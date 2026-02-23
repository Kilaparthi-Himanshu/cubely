use std::time::{SystemTime, UNIX_EPOCH};

use discord_rich_presence::{activity, DiscordIpc, DiscordIpcClient};
use once_cell::sync::OnceCell;
use std::sync::Mutex;

static RPC: OnceCell<Mutex<DiscordIpcClient>> = OnceCell::new();

pub fn init_discord_rpc() {
    let mut client = DiscordIpcClient::new("1475496418176274432");

    // Discord may not be running — don't crash the app
    if client.connect().is_ok() {
        let _ = RPC.set(Mutex::new(client));
    }
}

#[tauri::command]
pub fn set_idle() {
    unsafe {
        if let Some(rpc) = RPC.get() {
            let mut rpc = rpc.lock().unwrap();

            let activity = activity::Activity::new()
                .details("Cubely")
                .state("Idle")
                .assets(
                    activity::Assets::new()
                        .large_text("Cubely")
                );

            let _ = rpc.set_activity(activity).ok();
        }
    }
}

#[tauri::command]
pub fn discord_set_server_running(server_name: String) {
    let start_time = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs() as i64;

    unsafe {
        if let Some(rpc) = RPC.get() {
            let mut rpc = rpc.lock().unwrap();

            let activity = activity::Activity::new()
                .details("Running Server")
                .state(format!("MC - {}", server_name))
                .timestamps(
                    activity::Timestamps::new()
                        .start(start_time))
                .assets(
                    activity::Assets::new()
                        .small_text("Server Online")
                );

            let _ = rpc.set_activity(activity).ok();
        }
    }
}
