#![allow(unused)]

pub mod commands;
pub mod state;
pub mod utils;

use crate::commands::server_creation::create_server;
use crate::commands::server_management::get_active_server;
use crate::commands::server_management::list_servers;
use crate::commands::server_management::read_server_config;
use crate::commands::server_management::update_server_config;
use crate::commands::server_management::read_server_properties;
use crate::commands::server_management::start_server;
use crate::commands::server_management::stop_server;
use crate::commands::server_management::update_server_properties;
use crate::commands::server_management::delete_server;
use crate::commands::versions_loaders::fetch_fabric_versions;
use crate::commands::versions_loaders::fetch_forge_versions;
use crate::commands::versions_loaders::get_mc_versions;
use crate::commands::versions_loaders::get_supported_loaders;
use crate::commands::misc::open_folder;
use crate::commands::versions_loaders::LoaderSupportCache;
use crate::state::app_state::AppState;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
#[tauri::command] //  to make it invocable from JS
fn greet(name: &str, email: &str) -> String {
    println!("Inside RUST code");
    format!("Hello, {}! you are loggedIn with email {}", name, email)
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
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

            // Versions cache
            let cache = app.state::<AppState>().loader_cache.clone();

            tauri::async_runtime::spawn(async move {
                let fabric_versions = fetch_fabric_versions().await;
                let forge_versions = fetch_forge_versions().await;

                let mut cache = cache.lock().unwrap();
                *cache = Some(LoaderSupportCache {
                    fabric_versions,
                    forge_versions,
                });
            });

            // Store app handle
            {
                let state = app.state::<AppState>();
                let mut slot = state.app_handle.lock().unwrap();
                *slot = Some(app.handle().clone());
            }

            // Java base dir
            let java_base = app
                .path()
                .app_data_dir()
                .expect("Failed to get app data dir for java")
                .join("java");

            {
                let app_state = app.state::<AppState>();

                let mut slot = app_state
                    .java_base_dir
                    .lock()
                    .unwrap();

                *slot = Some(java_base);
            }

            // Ngrok base dir
            let ngrok_base = app
                .path()
                .app_data_dir()
                .expect("Failed to get app data dir for ngrok")
                .join("ngrok");

            {
                let app_state = app.state::<AppState>();

                let mut slot = app_state
                    .ngrok_base_dir
                    .lock()
                    .unwrap();

                *slot = Some(ngrok_base);
            }

            // Playit base dir
            let playit_base = app
                .path()
                .app_data_dir()
                .expect("Failed to get app data dir for ngrok")
                .join("playit");

            {
                let app_state = app.state::<AppState>();

                let mut slot = app_state
                    .playit_base_dir
                    .lock()
                    .unwrap();

                *slot = Some(playit_base);
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            create_server,
            get_mc_versions,
            get_supported_loaders,
            list_servers,
            read_server_properties,
            update_server_properties,
            get_active_server,
            start_server,
            stop_server,
            read_server_config,
            update_server_config,
            open_folder,
            delete_server
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
