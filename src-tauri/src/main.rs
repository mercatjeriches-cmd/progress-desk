#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{LogicalSize, Window};

#[tauri::command]
fn set_expanded(window: Window, expanded: bool) -> Result<(), String> {
    let (width, height) = if expanded { (850, 610) } else { (370, 250) };
    window
        .set_size(LogicalSize::new(width, height))
        .map_err(|error| error.to_string())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![set_expanded])
        .run(tauri::generate_context!())
        .expect("无法启动进度桌面");
}

