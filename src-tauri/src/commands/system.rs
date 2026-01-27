use crate::state::app_state::AppState;

#[tauri::command]
pub fn ping(state: tauri::State<AppState>) -> String {
    // let mut count = state.ping_count.lock().unwrap();
    // *count += 1;
    state.add();

    format!("pong 🏓 ({} times)", *state.ping_count.lock().unwrap())
}
