use std::process::Command;


#[tauri::command]
pub fn open_folder(path: String) {
    let _ = Command::new("open")
        .arg(path)
        .spawn();
}
