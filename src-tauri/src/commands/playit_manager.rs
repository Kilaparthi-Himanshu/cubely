use std::{
    fs,
    path::{Path, PathBuf},
    process::{Child, Command, Stdio},
};

use reqwest::Client;
use zip::ZipArchive;

/// Playit Binary Resolution
fn playit_binary_name() -> &'static str {
    #[cfg(target_os = "windows")]
    { "playit.exe" }

    #[cfg(not(target_os = "windows"))]
    { "playit" }
}


pub fn playit_binary(base: &PathBuf) -> PathBuf {
    base.join(playit_binary_name())
}

/// Installation Helpers
fn installing_marker(base: &PathBuf) -> PathBuf {
    base.join(".installing")
}

fn zip_path(base: &PathBuf) -> PathBuf {
    base.join("playit.zip")
}

/// Download URLs (official + existing)
#[cfg(windows)]
fn playit_download_url() -> &'static str {
    "https://github.com/playit-cloud/playit-agent/releases/latest/download/playit-windows-x86_64.exe"
}

#[cfg(all(target_os = "linux", target_arch = "x86_64"))]
fn playit_download_url() -> &'static str {
    "https://github.com/playit-cloud/playit-agent/releases/latest/download/playit-linux-amd64"
}

#[cfg(all(target_os = "linux", target_arch = "aarch64"))]
fn playit_download_url() -> &'static str {
    "https://github.com/playit-cloud/playit-agent/releases/latest/download/playit-linux-aarch64"
}


/// Install Playit (transactional)
#[cfg(target_os = "macos")]
pub async fn install_playit(_: &PathBuf) -> Result<(), String> {
    Err("Playit tunnel is not supported on macOS. Consider changing the provider or turn off Tunnel option and try again.".into())
}

#[cfg(not(target_os = "macos"))]
pub async fn install_playit(base: &PathBuf) -> Result<(), String> {
    fs::create_dir_all(base).map_err(|e| e.to_string())?;

    let marker = installing_marker(base);
    fs::write(&marker, b"").ok();

    let resp = Client::new()
        .get(playit_download_url())
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !resp.status().is_success() {
        return Err(format!("Failed to download playit: {}", resp.status()));
    }

    let bytes = resp.bytes().await.map_err(|e| e.to_string())?;

    if bytes.len() < 500_000 {
        return Err("Downloaded playit binary is suspiciously small".into());
    }

    let bin = playit_binary(base);
    fs::write(&bin, &bytes).map_err(|e| e.to_string())?;

    #[cfg(not(target_os = "windows"))]
    {
        use std::os::unix::fs::PermissionsExt;
        fs::set_permissions(&bin, fs::Permissions::from_mode(0o755)).ok();
    }

    fs::remove_file(&marker).ok();
    Ok(())
}

/// Verification
fn playit_runs(bin: &Path) -> bool {
    Command::new(bin)
        .arg("--version")
        .stdout(std::process::Stdio::null())
        .stderr(std::process::Stdio::null())
        .status()
        .map(|s| s.success())
        .unwrap_or(false)
}

/// Cleanup (nuke strategy)
fn cleanup_playit(base: &PathBuf) {
    fs::remove_dir_all(base).ok();
}

/// Installed Check
#[cfg(target_os = "macos")]
pub fn playit_installed(_: &PathBuf) -> bool {
    false
}

#[cfg(not(target_os = "macos"))]
pub fn playit_installed(base: &PathBuf) -> bool {
    let bin = playit_binary(base);

    if installing_marker(base).exists() {
        cleanup_playit(base);
        return false;
    }

    if !bin.exists() {
        cleanup_playit(base);
        return false;
    }

    if !playit_runs(&bin) {
        cleanup_playit(base);
        return false;
    }

    true
}
#[cfg(windows)]
use std::os::windows::process::CommandExt;

#[cfg(windows)]
const CREATE_NEW_CONSOLE: u32 = 0x00000010;

#[cfg(windows)]
pub fn start_playit(base: &PathBuf) -> Result<Child, String> {
    let bin = playit_binary(base);

    // let child = Command::new("cmd")
    //     .args([
    //         "/C",
    //         "start",
    //         "",
    //         bin.to_str().unwrap(),
    //     ])
    //     .spawn()
    //     .map_err(|e| e.to_string())?;

    let child = Command::new(bin)
        .creation_flags(CREATE_NEW_CONSOLE)
        .spawn()
        .map_err(|e| e.to_string())?;

    // let child = Command::new(bin)
    //     .arg("agent")
    //     .current_dir(base)
    //     .stdout(Stdio::null())   // or null if you want logs
    //     .stderr(Stdio::null())
    //     .spawn()
    //     .map_err(|e| e.to_string())?;

    Ok(child)
}

#[cfg(target_os = "macos")]
pub fn start_playit(_: &PathBuf) -> Result<Child, String> {
    Err("Playit tunnel is not supported on macOS. Consider changing the provider or turn off Tunnel option and try again.".into())
}

#[cfg(target_os = "linux")]
pub fn start_playit(base: &PathBuf) -> Result<Child, String> {
    let bin = playit_binary(base);

    // x-terminal-emulator is standard on Debian/Ubuntu
    Command::new("x-terminal-emulator")
        .args(["-e", bin.to_str().ok_or("Invalid playit path")?])
        .spawn()
        .map_err(|e| e.to_string())
}
