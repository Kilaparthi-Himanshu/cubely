use crate::commands::{server_management::ActiveServer, versions_loaders::LoaderSupportCache};
use std::sync::{Arc, Mutex};

#[derive(Default)]
pub struct AppState {
    pub ping_count: Arc<Mutex<u32>>,
    pub loader_cache: Arc<Mutex<Option<LoaderSupportCache>>>,
    pub active_server: Arc<Mutex<Option<ActiveServer>>>,
}

impl AppState {
    pub fn add(&self) -> () {
        *self.ping_count.lock().unwrap() += 1;
    }
}
