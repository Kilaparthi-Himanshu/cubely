use std::{
    fs,
    path::{Path, PathBuf},
    process::Command,
};

use reqwest::Client;
use zip::ZipArchive;

/// Installing Ngrok

fn ngrok_binary_name() -> &'static str {
    #[cfg(target_os = "windows")]
    {
        "ngrok.exe"
    }

    #[cfg(not(target_os = "windows"))]
    {
        "ngrok"
    }
}

pub fn ngrok_binary(base: &PathBuf) -> PathBuf {
    base.join(ngrok_binary_name())
}

fn installing_marker(base: &PathBuf) -> PathBuf {
    base.join(".installing")
}

fn zip_path(base: &PathBuf) -> PathBuf {
    base.join("ngrok.zip")
}

fn ngrok_download_url() -> &'static str {
    #[cfg(target_os = "windows")]
    {
        "https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-windows-amd64.zip"
    }

    #[cfg(target_os = "macos")]
    {
        "https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-darwin-amd64.zip"
    }

    #[cfg(target_os = "linux")]
    {
        "https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.zip"
    }
}

pub async fn install_ngrok(base: &PathBuf) -> Result<(), String> {
    fs::create_dir_all(base).map_err(|e| e.to_string())?;

    let marker = installing_marker(base);
    fs::write(&marker, b"").ok();

    let bytes = Client::new()
        .get(ngrok_download_url())
        .send()
        .await
        .map_err(|e| e.to_string())?
        .bytes()
        .await
        .map_err(|e| e.to_string())?;

    let zip = zip_path(base);
    fs::write(&zip, &bytes).map_err(|e| e.to_string())?;

    let file = fs::File::open(&zip).map_err(|e| e.to_string())?;
    let mut archive = ZipArchive::new(file).map_err(|e| e.to_string())?;

    for i in 0..archive.len() {
        let mut file = archive.by_index(i).map_err(|e| e.to_string())?;
        let outpath = base.join(file.name());

        if file.is_dir() {
            fs::create_dir_all(&outpath).ok();
        } else {
            let mut out = fs::File::create(&outpath).map_err(|e| e.to_string())?;
            std::io::copy(&mut file, &mut out).map_err(|e| e.to_string())?;
        }
    }

    #[cfg(not(target_os = "windows"))]
    {
        use std::os::unix::fs::PermissionsExt;
        let bin = ngrok_binary(base);
        fs::set_permissions(&bin, fs::Permissions::from_mode(0o755)).ok();
    }

    fs::remove_dir(&marker).ok();
    fs::remove_file(&zip).ok();

    Ok(())
}

/// Ngrok verification and Cleanup

fn ngrok_runs(bin: &Path) -> bool {
    Command::new(bin)
        .arg("version")
        .stdout(std::process::Stdio::null())
        .stderr(std::process::Stdio::null())
        .status()
        .map(|s| s.success())
        .unwrap_or(false)
}

fn cleanup_ngrok(base: &PathBuf) {
    fs::remove_file(ngrok_binary(base)).ok();
    fs::remove_file(zip_path(base)).ok();
    fs::remove_file(installing_marker(base)).ok();
}

pub fn ngrok_installed(base: &PathBuf) -> bool {
    let bin = ngrok_binary(base);

    if installing_marker(base).exists() {
        cleanup_ngrok(base);
        return false;
    }

    if !bin.exists() {
        cleanup_ngrok(base);
        return false;
    }

    if !ngrok_runs(&bin) {
        cleanup_ngrok(base);
        return false;
    }

    true
}

/// Start Ngrok
use serde_json::Value;
use std::process::{Child, Stdio};
use std::thread::sleep;
use std::time::Duration;

pub async fn start_ngrok(port: u16, base: &PathBuf) -> Result<(Child, String), String> {
    let bin = ngrok_binary(base);

    let child = Command::new(bin)
        .args(["tcp", &port.to_string(), "--log=stdout"])
        .stdout(Stdio::piped())
        .spawn()
        .map_err(|e| e.to_string())?;

    // Give ngrok time to boot
    sleep(Duration::from_secs(2));

    let tunnels: Value = reqwest::get("https://127.0.0.1:4040/api/tunnels")
        .await
        .map_err(|_| "Failed to connect to ngrok API".to_string())?
        .json()
        .await
        .map_err(|_| "Failed to parse ngrok API response".to_string())?;

    let url = tunnels["tunnels"][0]["publci_url"]
        .as_str()
        .ok_or("No ngrok tunnel found")?
        .to_string();

    Ok((child, url))
}
