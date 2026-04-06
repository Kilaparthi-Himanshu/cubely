use std::{
    fs,
    path::{Path, PathBuf},
    process::{Child, Command, Stdio},
};

use reqwest::Client;
use serde_json::Value;
use tauri::{AppHandle, Emitter};
use zip::ZipArchive;

/// Playit Binary Resolution
fn playit_binary_name() -> &'static str {
    #[cfg(target_os = "windows")]
    {
        "playit.exe"
    }

    #[cfg(not(target_os = "windows"))]
    {
        "playit"
    }
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
    fs::create_dir_all(base).map_err(|e: std::io::Error| e.to_string())?;

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
pub fn start_playit(base: &PathBuf) -> Result<Child, String> {
    let bin = playit_binary(base);

    let mut cmd = Command::new(bin);

    cmd.current_dir(base)
        .args(["--stdout", "start"])
        .env("RUST_LOG", "info")
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());

    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        cmd.creation_flags(0x08000000); // NO WINDOW
    }

    let child = cmd.spawn().map_err(|e| e.to_string())?;

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

use playit_api_client::PlayitApi;
use std::time::Duration;

pub async fn get_playit_public_url(app: AppHandle) -> Result<String, String> {
    let secret = read_playit_secret()?;
    let api = PlayitApi::create("https://api.playit.gg".to_string(), Some(secret));

    let data = api
        .agents_rundata()
        .await
        .map_err(|e| format!("Playit API error: {}", e))?;

    data.tunnels
        .into_iter()
        .next()
        .map(|t| t.assigned_domain)
        .ok_or("No Playit tunnel found".into())
}

fn playit_config_path() -> Option<PathBuf> {
    #[cfg(target_os = "windows")]
    {
        // Try LOCALAPPDATA first
        if let Ok(local) = std::env::var("LOCALAPPDATA") {
            let p = PathBuf::from(&local).join("playit_gg").join("playit.toml");
            if p.exists() {
                return Some(p);
            }
        }

        // Fallback to APPDATA (older installs)
        if let Ok(roaming) = std::env::var("APPDATA") {
            let p = PathBuf::from(&roaming)
                .join("playit_gg")
                .join("playit.toml");
            if p.exists() {
                return Some(p);
            }
        }

        None
    }

    #[cfg(target_os = "linux")]
    {
        std::env::var("HOME").ok().map(|p| {
            PathBuf::from(p)
                .join(".local")
                .join("share")
                .join("playit_gg")
                .join("playit.toml")
        })
    }

    #[cfg(target_os = "macos")]
    {
        None
    }
}

fn read_playit_secret() -> Result<String, String> {
    let path = playit_config_path().ok_or("Unsupported OS for Playit")?;
    let content =
        fs::read_to_string(&path).map_err(|e| format!("Failed to read Playit config: {}", e))?;

    for line in content.lines() {
        if let Some(rest) = line.strip_prefix("secret_key") {
            let secret = rest
                .split("=")
                .nth(1)
                .map(|s| s.trim().trim_matches('"'))
                .filter(|s| !s.is_empty())
                .ok_or("Invalid secret_key format")?;

            return Ok(secret.to_string());
        }
    }

    Err("secret_key not found in playit.toml".into())
}
