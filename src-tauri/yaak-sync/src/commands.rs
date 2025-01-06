use crate::error::Result;
use crate::sync::{
    apply_sync_ops, apply_sync_state_ops, compute_sync_ops, get_db_candidates, get_fs_candidates,
    get_workspace_sync_dir, SyncOp,
};
use crate::watch::{watch_directory, WatchEvent};
use chrono::Utc;
use log::warn;
use serde::{Deserialize, Serialize};
use tauri::ipc::Channel;
use tauri::{command, Listener, Runtime, WebviewWindow};
use tokio::sync::watch;
use ts_rs::TS;
use yaak_models::queries::get_workspace;

#[command]
pub async fn calculate<R: Runtime>(
    window: WebviewWindow<R>,
    workspace_id: &str,
) -> Result<Vec<SyncOp>> {
    let workspace = get_workspace(&window, workspace_id).await?;
    let db_candidates = get_db_candidates(&window, &workspace).await?;
    let fs_candidates = get_fs_candidates(&workspace).await?;
    Ok(compute_sync_ops(db_candidates, fs_candidates))
}

#[command]
pub async fn apply<R: Runtime>(
    window: WebviewWindow<R>,
    sync_ops: Vec<SyncOp>,
    workspace_id: &str,
) -> Result<()> {
    let workspace = get_workspace(&window, workspace_id).await?;
    let sync_state_ops = apply_sync_ops(&window, &workspace, sync_ops).await?;
    apply_sync_state_ops(&window, &workspace, sync_state_ops).await
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export, export_to = "watch.ts")]
pub(crate) struct WatchResult {
    unlisten_event: String,
}

#[command]
pub async fn watch<R: Runtime>(
    window: WebviewWindow<R>,
    workspace_id: &str,
    channel: Channel<WatchEvent>,
) -> Result<WatchResult> {
    let workspace = get_workspace(&window, workspace_id).await?;
    let sync_dir = get_workspace_sync_dir(&workspace)?;
    let (cancel_tx, cancel_rx) = watch::channel(());

    watch_directory(&sync_dir, channel, cancel_rx).await?;

    let window_inner = window.clone();
    let unlisten_event =
        format!("watch-unlisten-{}-{}", workspace_id, Utc::now().timestamp_millis());

    // TODO: Figure out a way to unlisten when the client window refreshes or closes. Perhaps with
    //   a heartbeat mechanism, or ensuring only a single subscription per workspace (at least
    //   this won't create `n` subs). We could also maybe have a global fs watcher that we keep
    //   adding to here.
    window.listen_any(unlisten_event.clone(), move |event| {
        window_inner.unlisten(event.id());
        if let Err(e) = cancel_tx.send(()) {
            warn!("Failed to send cancel signal to watcher {e:?}");
        }
    });

    Ok(WatchResult { unlisten_event })
}
