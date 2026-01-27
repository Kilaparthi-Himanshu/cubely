mod state;
mod commands;

use crate::state::app_state::AppState;
use crate::commands::system::ping;

#[cfg_attr(mobile, tauri::mobile_entry_point)]

#[tauri::command] //  to make it invocable from JS
fn greet(name: &str, email: &str) -> String {
    println!("Inside RUST code");
    format!("Hello, {}! you are loggedIn with email {}", name, email)
}

pub fn run() {
  tauri::Builder::default()
  .manage(AppState::default())
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![ping, greet])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
