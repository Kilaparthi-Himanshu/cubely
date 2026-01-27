use std::sync::Mutex;

#[derive(Default)]
pub struct AppState {
    pub ping_count: Mutex<u32>,
}

impl AppState {
    pub fn add(&self) -> () {
        *self.ping_count.lock().unwrap() += 1;
    }
}
