use crate::commands::{server_management::ActiveServer, versions_loaders::LoaderSupportCache};
use std::{path::PathBuf, sync::{Arc, Mutex}};
use tauri::AppHandle;

#[derive(Default)]
pub struct AppState {
    pub app_handle: Arc<Mutex<Option<AppHandle>>>,
    pub ping_count: Arc<Mutex<u32>>,
    pub loader_cache: Arc<Mutex<Option<LoaderSupportCache>>>,
    pub active_server: Arc<Mutex<Option<ActiveServer>>>,
    pub java_base_dir: Arc<Mutex<Option<PathBuf>>>,
    pub ngrok_base_dir: Arc<Mutex<Option<PathBuf>>>,
    pub playit_base_dir: Arc<Mutex<Option<PathBuf>>>,
}

impl AppState {
    pub fn add(&self) -> () {
        *self.ping_count.lock().unwrap() += 1;
    }
}
