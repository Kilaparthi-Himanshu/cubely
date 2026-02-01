#![allow(unused)]

pub mod commands;
pub mod state;
pub mod utils;

use tauri::Manager;
use crate::commands::versions_loaders::LoaderSupportCache;
use crate::commands::versions_loaders::fetch_fabric_versions;
use crate::commands::versions_loaders::fetch_forge_versions;
use crate::commands::versions_loaders::get_mc_versions;
use crate::commands::versions_loaders::get_supported_loaders;
use crate::commands::server_creation::create_server;
use crate::commands::server_management::list_servers;
use crate::state::app_state::AppState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
#[tauri::command] //  to make it invocable from JS
fn greet(name: &str, email: &str) -> String {
    println!("Inside RUST code");
    format!("Hello, {}! you are loggedIn with email {}", name, email)
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_os::init())
        .manage(AppState::default())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            let cache = app.state::<AppState>().loader_cache.clone();

            tauri::async_runtime::spawn(async move {
                let fabric_versions = fetch_fabric_versions().await;
                let forge_versions = fetch_forge_versions().await;

                let mut cache = cache.lock().unwrap();
                *cache = Some(LoaderSupportCache {
                    fabric_versions,
                    forge_versions
                });
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            create_server,
            get_mc_versions,
            get_supported_loaders,
            list_servers
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
