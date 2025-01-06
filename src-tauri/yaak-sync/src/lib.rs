use crate::commands::{apply, calculate, watch};
use tauri::{
    generate_handler,
    plugin::{Builder, TauriPlugin},
    Runtime,
};

mod commands;
mod error;
mod models;
mod sync;
mod watch;

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("yaak-sync").invoke_handler(generate_handler![calculate, apply, watch]).build()
}
