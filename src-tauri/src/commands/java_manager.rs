use std::{path::{Path, PathBuf}, process::Command};
use tauri::{AppHandle, Manager};
use reqwest::Client;
use std::{fs, io::Write};
use zip::ZipArchive;

/// Installing Java

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
    let bin = "Contents/Home/bin/java";

    #[cfg(all(unix, not(target_os = "macos")))]
    let bin = "bin/java";

    match version {
        JavaVersion::Java8 => base.join("8").join(bin),
        JavaVersion::Java17 => base.join("17").join(bin),
        JavaVersion::Java21 => base.join("21").join(bin),
    }
}

fn java_download_url(version: JavaVersion) -> &'static str {
    match version {
        JavaVersion::Java8 => {
            #[cfg(target_os = "windows")]
            { "https://api.adoptium.net/v3/binary/latest/8/ga/windows/x64/jre/hotspot/normal/eclipse" }

            #[cfg(all(target_os = "macos", target_arch = "x86_64"))]
            { "https://api.adoptium.net/v3/binary/latest/8/ga/mac/x64/jre/hotspot/normal/eclipse" }

            #[cfg(all(target_os = "macos", target_arch = "aarch64"))]
            { "https://api.adoptium.net/v3/binary/latest/8/ga/mac/aarch64/jre/hotspot/normal/eclipse" }

            #[cfg(all(target_os = "linux", target_arch = "x86_64"))]
            { "https://api.adoptium.net/v3/binary/latest/8/ga/linux/x64/jre/hotspot/normal/eclipse" }
        }

        JavaVersion::Java17 => {
            #[cfg(target_os = "windows")]
            { "https://api.adoptium.net/v3/binary/latest/17/ga/windows/x64/jre/hotspot/normal/eclipse" }

            #[cfg(all(target_os = "macos", target_arch = "x86_64"))]
            { "https://api.adoptium.net/v3/binary/latest/17/ga/mac/x64/jre/hotspot/normal/eclipse" }

            #[cfg(all(target_os = "macos", target_arch = "aarch64"))]
            { "https://api.adoptium.net/v3/binary/latest/17/ga/mac/aarch64/jre/hotspot/normal/eclipse" }

            #[cfg(all(target_os = "linux", target_arch = "x86_64"))]
            { "https://api.adoptium.net/v3/binary/latest/17/ga/linux/x64/jre/hotspot/normal/eclipse" }
        }

        JavaVersion::Java21 => {
            #[cfg(target_os = "windows")]
            { "https://api.adoptium.net/v3/binary/latest/21/ga/windows/x64/jre/hotspot/normal/eclipse" }

            #[cfg(all(target_os = "macos", target_arch = "x86_64"))]
            { "https://api.adoptium.net/v3/binary/latest/21/ga/mac/x64/jre/hotspot/normal/eclipse" }

            #[cfg(all(target_os = "macos", target_arch = "aarch64"))]
            { "https://api.adoptium.net/v3/binary/latest/21/ga/mac/aarch64/jre/hotspot/normal/eclipse" }

            #[cfg(all(target_os = "linux", target_arch = "x86_64"))]
            { "https://api.adoptium.net/v3/binary/latest/21/ga/linux/x64/jre/hotspot/normal/eclipse" }
        }
    }
}

fn installing_marker(base: &PathBuf, version: JavaVersion) -> PathBuf {
    match version {
        JavaVersion::Java8 => base.join("8/.installing"),
        JavaVersion::Java17 => base.join("17/.installing"),
        JavaVersion::Java21 => base.join("21/.installing"),
    }
}

fn java_archive_path(base: &PathBuf) -> PathBuf {
    #[cfg(target_os = "windows")]
    { base.join("java.zip") }

    #[cfg(not(target_os = "windows"))]
    { base.join("java.tar.gz") }
}

pub async fn install_java(base: &PathBuf, version: JavaVersion) -> Result<(), String> {
    #[cfg(all(target_os = "linux", not(target_arch = "x86_64")))]
    compile_error!("Unsupported Linux architecture for Java installer");

    let url = java_download_url(version);
    let target_dir = base; // C:\Users\<YOUR_USERNAME>\AppData\Roaming\com.tauri.dev\java

    fs::create_dir_all(&target_dir).map_err(|e| e.to_string())?;

    let marker = installing_marker(base, version);
    fs::write(&marker, b"").ok();

    let bytes = Client::new()
        .get(url)
        .send()
        .await
        .map_err(|e| e.to_string())?
        .bytes()
        .await
        .map_err(|e| e.to_string())?;

    let archive_path = java_archive_path(target_dir);
    fs::write(&archive_path, &bytes).map_err(|e| e.to_string())?;

    let version_dir = match version {
        JavaVersion::Java8 => target_dir.join("8"),
        JavaVersion::Java17 => target_dir.join("17"),
        JavaVersion::Java21 => target_dir.join("21"),
    };

    fs::create_dir_all(&version_dir).map_err(|e| e.to_string())?;

    #[cfg(target_os = "windows")]
    {
        let file = fs::File::open(&archive_path).map_err(|e| e.to_string())?;
        let mut archive = ZipArchive::new(file).map_err(|e| e.to_string())?;

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
    }

    #[cfg(not(target_os = "windows"))]
    {
        use flate2::read::GzDecoder;
        use tar::Archive;

        let file = fs::File::open(&archive_path).map_err(|e| e.to_string())?;
        let decompressor = GzDecoder::new(file);
        let mut archive = Archive::new(decompressor);

        for entry in archive.entries().map_err(|e| e.to_string())? {
            let mut entry = entry.map_err(|e| e.to_string())?;

            let rel = entry
                .path()
                .map_err(|e| e.to_string())?
                .components()
                .skip(1)
                .collect::<PathBuf>();

            if rel.as_os_str().is_empty() {
                continue;
            }

            let outpath = version_dir.join(rel);
            if let Some(p) = outpath.parent() {
                fs::create_dir_all(p).ok();
            }

            entry.unpack(outpath).map_err(|e| e.to_string())?;
        }
    }

    #[cfg(not(target_os = "windows"))]
    {
        use std::os::unix::fs::PermissionsExt;

        let java_bin = java_binary(base, version);
        if java_bin.exists() {
            fs::set_permissions(&java_bin, fs::Permissions::from_mode(0o755)).ok();
        }
    }

    fs::remove_file(&marker).ok();
    fs::remove_file(archive_path).ok();
    Ok(())
}

/// Java Verification and Cleanup

fn java_structure_ok(java_home: &Path) -> bool {
    #[cfg(target_os = "windows")]
    {
        java_home.join("bin").exists()
            && java_home.join("lib").exists()
            && java_home.join("release").exists()
    }

    #[cfg(not(target_os = "windows"))]
    {
        java_home.join("Contents/Home/bin").exists()
            && java_home.join("Contents/Home/lib").exists()
            && java_home.join("Contents/Home/release").exists()
    }
}

fn java_runs(java_bin: &Path) -> bool {
    Command::new(java_bin)
        .arg("-version")
        .stdout(std::process::Stdio::null())
        .stderr(std::process::Stdio::null())
        .status()
        .map(|s| s.success())
        .unwrap_or(false)
}

fn cleanup_java(base: &PathBuf, version: JavaVersion) {
    let dir = match version {
        JavaVersion::Java8 => base.join("8"),
        JavaVersion::Java17 => base.join("17"),
        JavaVersion::Java21 => base.join("21"),
    };

    let archive = java_archive_path(base);

    fs::remove_dir_all(dir).ok();
    fs::remove_file(archive).ok();
}

pub fn java_installed(base: &PathBuf, version: JavaVersion) -> bool {
    let java = java_binary(base, version);
    let java_home = {
        #[cfg(target_os = "macos")]
        {
            java.parent().unwrap().parent().unwrap().parent().unwrap()
        }

        #[cfg(not(target_os = "macos"))]
        {
            java.parent().unwrap().parent().unwrap()
        }
    };

    let marker = installing_marker(base, version);

    if marker.exists() {
        cleanup_java(base, version);
        return false;
    }

    if !java_structure_ok(java_home) {
        cleanup_java(base, version);
        return false;
    }

    if !java_runs(&java) {
        cleanup_java(base, version);
        return false;
    }

    true
}
