use std::{fs, path::PathBuf};

/// Returns the base directory where all Cubely servers are stored.
///
/// The directory is OS-specific and is resolved using `dirs::data_dir()`:
/// - Windows: C:\Users\<you>\AppData\Roaming\Cubely\servers
/// - macOS:   ~/Library/Application Support/Cubely/servers (i.e. /Users/<your-username>/Library/Application Support/Cubely/servers/)
/// - Linux:   ~/.local/share/Cubely/servers
///
/// This function does NOT create the directory; it only resolves the path.
pub fn servers_dir() -> PathBuf {
    let mut dir = dirs::data_dir().expect("Failed to get data dir");
    dir.push("Cubely");
    dir.push("servers");
    dir
}

/// Removes an entire server directory and all of its contents. [Ex: MyServer and it's contents get deleted inside 1.21.9]
///
/// This is intended to be called when server creation or installation fails,
/// ensuring that no partially-installed or corrupted server data is left behind.
///
/// If the directory does not exist, the function does nothing.
/// Any deletion errors are logged but not propagated.
pub fn cleanup_server_dir(server_path: &PathBuf) {
    if server_path.exists() {
        if let Err(e) = fs::remove_dir_all(server_path) {
            eprintln!("Failed to cleanup server directory {:?}: {}", server_path, e);
        }
    }
}

/// Removes a directory ONLY if it is completely empty. [Ex: 1.21.9 folder itself]
///
/// This is typically used to clean up a parent directory (such as a Minecraft
/// version folder) after a server directory has been deleted.
/// 
/// If the directory contains any files or subdirectories, it is left untouched.
/// Errors are intentionally ignored to avoid disrupting the main control flow.
pub fn cleanup_empty_parent_dir(parent: &PathBuf) {
    if parent.exists() {
        if let Ok(mut entries) = fs::read_dir(parent) {
            if entries.next().is_none() {
                let _ = fs::remove_dir(parent);
            }
        }
    }
}
