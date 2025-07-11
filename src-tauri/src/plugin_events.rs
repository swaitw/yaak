use crate::http_request::send_http_request;
use crate::render::{render_grpc_request, render_http_request, render_json_value};
use crate::window::{CreateWindowConfig, create_window};
use crate::{
    call_frontend, cookie_jar_from_window, environment_from_window, get_window_from_window_context,
    workspace_from_window,
};
use chrono::Utc;
use cookie::Cookie;
use log::warn;
use tauri::{AppHandle, Emitter, Manager, Runtime, State};
use tauri_plugin_clipboard_manager::ClipboardExt;
use yaak_models::models::{HttpResponse, Plugin};
use yaak_models::query_manager::QueryManagerExt;
use yaak_models::util::UpdateSource;
use yaak_plugins::events::{
    Color, DeleteKeyValueResponse, EmptyPayload, FindHttpResponsesResponse, GetCookieValueResponse,
    GetHttpRequestByIdResponse, GetKeyValueResponse, Icon, InternalEvent, InternalEventPayload,
    ListCookieNamesResponse, PluginWindowContext, RenderGrpcRequestResponse,
    RenderHttpRequestResponse, SendHttpRequestResponse, SetKeyValueResponse, ShowToastRequest,
    TemplateRenderResponse, WindowNavigateEvent,
};
use yaak_plugins::manager::PluginManager;
use yaak_plugins::plugin_handle::PluginHandle;
use yaak_plugins::template_callback::PluginTemplateCallback;

pub(crate) async fn handle_plugin_event<R: Runtime>(
    app_handle: &AppHandle<R>,
    event: &InternalEvent,
    plugin_handle: &PluginHandle,
) {
    // debug!("Got event to app {event:?}");
    let window_context = event.window_context.to_owned();
    let response_event: Option<InternalEventPayload> = match event.clone().payload {
        InternalEventPayload::CopyTextRequest(req) => {
            app_handle
                .clipboard()
                .write_text(req.text.as_str())
                .expect("Failed to write text to clipboard");
            Some(InternalEventPayload::CopyTextResponse(EmptyPayload {}))
        }
        InternalEventPayload::ShowToastRequest(req) => {
            match window_context {
                PluginWindowContext::Label { label, .. } => app_handle
                    .emit_to(label, "show_toast", req)
                    .expect("Failed to emit show_toast to window"),
                _ => app_handle.emit("show_toast", req).expect("Failed to emit show_toast"),
            };
            Some(InternalEventPayload::ShowToastResponse(EmptyPayload {}))
        }
        InternalEventPayload::PromptTextRequest(_) => {
            let window = get_window_from_window_context(app_handle, &window_context)
                .expect("Failed to find window for render");
            call_frontend(window, event).await
        }
        InternalEventPayload::FindHttpResponsesRequest(req) => {
            let http_responses = app_handle
                .db()
                .list_http_responses_for_request(&req.request_id, req.limit.map(|l| l as u64))
                .unwrap_or_default();
            Some(InternalEventPayload::FindHttpResponsesResponse(FindHttpResponsesResponse {
                http_responses,
            }))
        }
        InternalEventPayload::GetHttpRequestByIdRequest(req) => {
            let http_request = app_handle.db().get_http_request(&req.id).ok();
            Some(InternalEventPayload::GetHttpRequestByIdResponse(GetHttpRequestByIdResponse {
                http_request,
            }))
        }
        InternalEventPayload::RenderGrpcRequestRequest(req) => {
            let window = get_window_from_window_context(app_handle, &window_context)
                .expect("Failed to find window for render grpc request");

            let workspace =
                workspace_from_window(&window).expect("Failed to get workspace_id from window URL");
            let environment = environment_from_window(&window);
            let base_environment = app_handle
                .db()
                .get_base_environment(&workspace.id)
                .expect("Failed to get base environment");
            let cb = PluginTemplateCallback::new(app_handle, &window_context, req.purpose);
            let grpc_request = render_grpc_request(
                &req.grpc_request,
                &base_environment,
                environment.as_ref(),
                &cb,
            )
            .await
            .expect("Failed to render grpc request");
            Some(InternalEventPayload::RenderGrpcRequestResponse(RenderGrpcRequestResponse {
                grpc_request,
            }))
        }
        InternalEventPayload::RenderHttpRequestRequest(req) => {
            let window = get_window_from_window_context(app_handle, &window_context)
                .expect("Failed to find window for render http request");

            let workspace =
                workspace_from_window(&window).expect("Failed to get workspace_id from window URL");
            let environment = environment_from_window(&window);
            let base_environment = app_handle
                .db()
                .get_base_environment(&workspace.id)
                .expect("Failed to get base environment");
            let cb = PluginTemplateCallback::new(app_handle, &window_context, req.purpose);
            let http_request = render_http_request(
                &req.http_request,
                &base_environment,
                environment.as_ref(),
                &cb,
            )
            .await
            .expect("Failed to render http request");
            Some(InternalEventPayload::RenderHttpRequestResponse(RenderHttpRequestResponse {
                http_request,
            }))
        }
        InternalEventPayload::TemplateRenderRequest(req) => {
            let window = get_window_from_window_context(app_handle, &window_context)
                .expect("Failed to find window for render");

            let workspace =
                workspace_from_window(&window).expect("Failed to get workspace_id from window URL");
            let environment = environment_from_window(&window);
            let base_environment = app_handle
                .db()
                .get_base_environment(&workspace.id)
                .expect("Failed to get base environment");
            let cb = PluginTemplateCallback::new(app_handle, &window_context, req.purpose);
            let data = render_json_value(req.data, &base_environment, environment.as_ref(), &cb)
                .await
                .expect("Failed to render template");
            Some(InternalEventPayload::TemplateRenderResponse(TemplateRenderResponse { data }))
        }
        InternalEventPayload::ErrorResponse(resp) => {
            let toast_event = plugin_handle.build_event_to_send(
                &window_context,
                &InternalEventPayload::ShowToastRequest(ShowToastRequest {
                    message: format!(
                        "Plugin error from {}: {}",
                        plugin_handle.info().name,
                        resp.error
                    ),
                    color: Some(Color::Danger),
                    ..Default::default()
                }),
                None,
            );
            Box::pin(handle_plugin_event(app_handle, &toast_event, plugin_handle)).await;
            None
        }
        InternalEventPayload::ReloadResponse(r) => {
            let plugins = app_handle.db().list_plugins().unwrap();
            for plugin in plugins {
                if plugin.directory != plugin_handle.dir {
                    continue;
                }

                let new_plugin = Plugin {
                    updated_at: Utc::now().naive_utc(), // TODO: Add reloaded_at field to use instead
                    ..plugin
                };
                app_handle.db().upsert_plugin(&new_plugin, &UpdateSource::Plugin).unwrap();
            }
            let toast_event = plugin_handle.build_event_to_send(
                &window_context,
                &InternalEventPayload::ShowToastRequest(ShowToastRequest {
                    message: format!("Reloaded plugin {}@{}", r.name, r.version),
                    icon: Some(Icon::Info),
                    ..Default::default()
                }),
                None,
            );
            Box::pin(handle_plugin_event(app_handle, &toast_event, plugin_handle)).await;
            None
        }
        InternalEventPayload::SendHttpRequestRequest(req) => {
            let window = get_window_from_window_context(app_handle, &window_context)
                .expect("Failed to find window for sending HTTP request");
            let mut http_request = req.http_request;
            let workspace =
                workspace_from_window(&window).expect("Failed to get workspace_id from window URL");
            let cookie_jar = cookie_jar_from_window(&window);
            let environment = environment_from_window(&window);

            if http_request.workspace_id.is_empty() {
                http_request.workspace_id = workspace.id;
            }

            let http_response = if http_request.id.is_empty() {
                HttpResponse::default()
            } else {
                window
                    .db()
                    .upsert_http_response(
                        &HttpResponse {
                            request_id: http_request.id.clone(),
                            workspace_id: http_request.workspace_id.clone(),
                            ..Default::default()
                        },
                        &UpdateSource::Plugin,
                    )
                    .unwrap()
            };

            let result = send_http_request(
                &window,
                &http_request,
                &http_response,
                environment,
                cookie_jar,
                &mut tokio::sync::watch::channel(false).1, // No-op cancel channel
            )
            .await;

            let http_response = match result {
                Ok(r) => r,
                Err(_e) => return,
            };

            Some(InternalEventPayload::SendHttpRequestResponse(SendHttpRequestResponse {
                http_response,
            }))
        }
        InternalEventPayload::OpenWindowRequest(req) => {
            let label = req.label;
            let (navigation_tx, mut navigation_rx) = tokio::sync::mpsc::channel(128);
            let (close_tx, mut close_rx) = tokio::sync::mpsc::channel(128);
            let win_config = CreateWindowConfig {
                url: &req.url,
                label: &label.clone(),
                title: &req.title.unwrap_or_default(),
                navigation_tx: Some(navigation_tx),
                close_tx: Some(close_tx),
                inner_size: req.size.map(|s| (s.width, s.height)),
                data_dir_key: req.data_dir_key,
                ..Default::default()
            };
            create_window(app_handle, win_config);

            {
                let event_id = event.id.clone();
                let plugin_handle = plugin_handle.clone();
                let window_context = window_context.clone();
                tauri::async_runtime::spawn(async move {
                    while let Some(url) = navigation_rx.recv().await {
                        let url = url.to_string();
                        let event_to_send = plugin_handle.build_event_to_send(
                            &window_context, // NOTE: Sending existing context on purpose here
                            &InternalEventPayload::WindowNavigateEvent(WindowNavigateEvent { url }),
                            Some(event_id.clone()),
                        );
                        plugin_handle.send(&event_to_send).await.unwrap();
                    }
                });
            }

            {
                let event_id = event.id.clone();
                let plugin_handle = plugin_handle.clone();
                let window_context = window_context.clone();
                tauri::async_runtime::spawn(async move {
                    while let Some(_) = close_rx.recv().await {
                        let event_to_send = plugin_handle.build_event_to_send(
                            &window_context,
                            &InternalEventPayload::WindowCloseEvent,
                            Some(event_id.clone()),
                        );
                        plugin_handle.send(&event_to_send).await.unwrap();
                    }
                });
            }

            None
        }
        InternalEventPayload::CloseWindowRequest(req) => {
            if let Some(window) = app_handle.webview_windows().get(&req.label) {
                window.close().expect("Failed to close window");
            }
            None
        }
        InternalEventPayload::SetKeyValueRequest(req) => {
            let name = plugin_handle.info().name;
            app_handle.db().set_plugin_key_value(&name, &req.key, &req.value);
            Some(InternalEventPayload::SetKeyValueResponse(SetKeyValueResponse {}))
        }
        InternalEventPayload::GetKeyValueRequest(req) => {
            let name = plugin_handle.info().name;
            let value = app_handle.db().get_plugin_key_value(&name, &req.key).map(|v| v.value);
            Some(InternalEventPayload::GetKeyValueResponse(GetKeyValueResponse { value }))
        }
        InternalEventPayload::DeleteKeyValueRequest(req) => {
            let name = plugin_handle.info().name;
            let deleted = app_handle.db().delete_plugin_key_value(&name, &req.key).unwrap();
            Some(InternalEventPayload::DeleteKeyValueResponse(DeleteKeyValueResponse { deleted }))
        }
        InternalEventPayload::ListCookieNamesRequest(_req) => {
            let window = get_window_from_window_context(app_handle, &window_context)
                .expect("Failed to find window for listing cookies");
            let names = match cookie_jar_from_window(&window) {
                None => Vec::new(),
                Some(j) => j
                    .cookies
                    .into_iter()
                    .filter_map(|c| Cookie::parse(c.raw_cookie).ok().map(|c| c.name().to_string()))
                    .collect(),
            };
            Some(InternalEventPayload::ListCookieNamesResponse(ListCookieNamesResponse { names }))
        }
        InternalEventPayload::GetCookieValueRequest(req) => {
            let window = get_window_from_window_context(app_handle, &window_context)
                .expect("Failed to find window for listing cookies");
            let value = match cookie_jar_from_window(&window) {
                None => None,
                Some(j) => j.cookies.into_iter().find_map(|c| match Cookie::parse(c.raw_cookie) {
                    Ok(c) if c.name().to_string().eq(&req.name) => {
                        Some(c.value_trimmed().to_string())
                    }
                    _ => None,
                }),
            };
            Some(InternalEventPayload::GetCookieValueResponse(GetCookieValueResponse { value }))
        }
        _ => None,
    };

    if let Some(e) = response_event {
        let plugin_manager: State<'_, PluginManager> = app_handle.state();
        if let Err(e) = plugin_manager.reply(&event, &e).await {
            warn!("Failed to reply to plugin manager: {:?}", e)
        }
    }
}
