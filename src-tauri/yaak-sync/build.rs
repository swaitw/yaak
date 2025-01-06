const COMMANDS: &[&str] = &["calculate", "apply", "watch"];

fn main() {
    tauri_plugin::Builder::new(COMMANDS).build();
}
