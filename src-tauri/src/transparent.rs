use tauri::Manager;
use window_vibrancy::{
    apply_acrylic,
    apply_vibrancy,
    NSVisualEffectMaterial,
};

pub fn apply_window_effects(app: &tauri::AppHandle) {
    let window = app.get_webview_window("main").unwrap();

    // 🪟 WINDOWS
    #[cfg(target_os = "windows")]
    {
        // apply_acrylic(&window, None).ok();
        apply_acrylic(&window, Some((80, 0, 20, 220))).ok();
    }

    // 🍎 MacOS
    #[cfg(target_os = "macos")]
    {
        apply_vibrancy(
            &window,
            NSVisualEffectMaterial::HudWindow,
            None,
            None,
        )
        .ok();
    }
}
