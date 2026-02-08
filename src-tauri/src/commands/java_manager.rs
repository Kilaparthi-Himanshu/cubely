use std::path::{Path, PathBuf};
use tauri::{AppHandle, Manager};
use reqwest::Client;
use std::{fs, io::Write};
use zip::ZipArchive;

#[derive(Debug, Clone, Copy)]
pub enum JavaVersion {
    Java8,
    Java17,
    Java21,
}

pub fn require_java(mc_version: &str) -> JavaVersion {
    // String comparison works for MC versions reliably here
    if mc_version < "1.13" {
        JavaVersion::Java8
    } else if mc_version < "1.18" {
        JavaVersion::Java8
    } else if mc_version < "1.20.5" {
        JavaVersion::Java17
    } else {
        JavaVersion::Java21
    }
}

pub fn java_binary(base: &PathBuf, version: JavaVersion) -> PathBuf {
    #[cfg(target_os = "windows")]
    let bin = "bin/java.exe";

    #[cfg(not(target_os = "windows"))]
    let bin = "bin/java";

    match version {
        JavaVersion::Java8 => base.join("8").join(bin),
        JavaVersion::Java17 => base.join("17").join(bin),
        JavaVersion::Java21 => base.join("21").join(bin),
    }
}

pub fn java_installed(base: &PathBuf, version: JavaVersion) -> bool {
    java_binary(base, version).exists()
}

fn java_download_url(version: JavaVersion) -> &'static str {
    match version {
        JavaVersion::Java8 =>
            "https://api.adoptium.net/v3/binary/latest/8/ga/windows/x64/jre/hotspot/normal/eclipse",
        JavaVersion::Java17 =>
            "https://api.adoptium.net/v3/binary/latest/17/ga/windows/x64/jre/hotspot/normal/eclipse",
        JavaVersion::Java21 =>
            "https://api.adoptium.net/v3/binary/latest/21/ga/windows/x64/jre/hotspot/normal/eclipse",
    }
}

pub async fn install_java(base: &PathBuf, version: JavaVersion) -> Result<(), String> {
    let url = java_download_url(version);
    let target_dir = base; // C:\Users\<YOUR_USERNAME>\AppData\Roaming\com.tauri.dev\java

    fs::create_dir_all(&target_dir).map_err(|e| e.to_string())?;

    let bytes = Client::new()
        .get(url)
        .send()
        .await
        .map_err(|e| e.to_string())?
        .bytes()
        .await
        .map_err(|e| e.to_string())?;

    let zip_path = target_dir.join("java.zip");
    fs::write(&zip_path, &bytes).map_err(|e| e.to_string())?;

    let file = fs::File::open(&zip_path).map_err(|e| e.to_string())?;
    let mut archive = ZipArchive::new(file).map_err(|e| e.to_string())?;

    let version_dir = match version {
        JavaVersion::Java8 => target_dir.join("8"),
        JavaVersion::Java17 => target_dir.join("17"),
        JavaVersion::Java21 => target_dir.join("21"),
    };

    fs::create_dir_all(&version_dir).map_err(|e| e.to_string())?;

    for i in 0..archive.len() {
        let mut file = archive.by_index(i).map_err(|e| e.to_string())?;
        // file.name() gives the relative path inside the ZIP, outpath recreates that structure under version_dir
        let rel = Path::new(file.name());

        // Strip the ZIP's top-level folder (e.g. jdk-17.x.x-jre/)
        let rel = rel
            .components()
            .skip(1)
            .collect::<PathBuf>();

        // Skip the root folder entry itself
        if rel.as_os_str().is_empty() {
            continue;
        }

        let outpath = version_dir.join(rel);

        if file.is_dir() {
            fs::create_dir_all(&outpath).ok();
        } else {
            if let Some(p) = outpath.parent() {
                fs::create_dir_all(p).ok();
            }
            let mut outfile = fs::File::create(&outpath).map_err(|e| e.to_string())?;
            std::io::copy(&mut file, &mut outfile).map_err(|e| e.to_string())?;
        }
    }

    fs::remove_file(zip_path).ok();
    Ok(())
}
