use std::io::BufRead;
use std::{fs, path::PathBuf, process::Command};

use playit_api_client::PlayitApi;
use serde::{Deserialize, Serialize};
use tauri::Emitter;

use crate::commands::java_manager::{install_java, java_binary, java_installed, require_java};
use crate::commands::ngrok_manager::{install_ngrok, ngrok_binary, ngrok_installed, start_ngrok};
use crate::commands::playit_manager::{get_playit_public_url, install_playit, playit_binary, playit_installed, start_playit};
use crate::{
    commands::server_creation::LoaderType, state::app_state::AppState, utils::path::servers_dir,
};

/// READING AND WRITING OF SERVERS

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "lowercase")]
pub enum TunnelProvider {
    Playit,
    Ngrok,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TunnelConfig {
    pub enabled: bool,
    pub provider: TunnelProvider, // "playit"
}

impl Default for TunnelConfig {
    fn default() -> Self {
        Self {
            enabled: false,
            provider: TunnelProvider::Playit,
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ServerConfig {
    pub id: String,
    pub name: String,
    pub version: String,
    pub loader: LoaderType,
    pub ram_gb: u8,
    pub path: String,
    pub created_at: i64,

    #[serde(default)]
    pub tunnel: Option<TunnelConfig>,
}

#[tauri::command]
pub fn list_servers() -> Result<Vec<ServerConfig>, String> {
    let base = servers_dir();
    let mut servers = Vec::new();

    // First install: no servers directory yet
    if !base.exists() {
        return Ok(servers);
    }

    for version_dir in fs::read_dir(base).map_err(|e| e.to_string())? {
        let version_dir = version_dir.map_err(|e| e.to_string())?;
        if !version_dir.path().is_dir() {
            continue;
        } // continue if its not a folder and is a file

        for server_dir in fs::read_dir(version_dir.path()).map_err(|e| e.to_string())? {
            let server_dir = server_dir.map_err(|e| e.to_string())?;
            let config_path = server_dir.path().join("cubely.json");

            if config_path.exists() {
                let content = fs::read_to_string(config_path).map_err(|e| e.to_string())?;
                let config: ServerConfig =
                    serde_json::from_str(&content).map_err(|e| e.to_string())?;
                servers.push(config);
            }
        }
    }

    Ok(servers)
}

use serde_json::Value;
use std::collections::HashMap;
use std::process::{Child, Stdio};
use std::thread::sleep;
use std::time::Duration;

#[derive(Serialize, Deserialize)]
pub struct ServerProperties {
    pub motd: String,
    pub online_mode: bool,
    pub max_players: u32,
    pub difficulty: String,
    pub gamemode: String,
    pub pvp: bool,
    pub spawn_protection: u32,
    pub view_distance: u32,
    pub simulation_distance: u32,
    pub server_port: u16,
}

// Returns the HashMap of all the server propertiy pairs
pub fn map_server_properties(server_path: &String) -> Result<HashMap<String, String>, String> {
    let content = fs::read_to_string(PathBuf::from(server_path).join("server.properties"))
        .map_err(|e| e.to_string())?;

    let mut map = std::collections::HashMap::new();

    for line in content.lines() {
        let line = line.trim();
        if line.is_empty() || line.starts_with('#') {
            continue;
        }

        if let Some((k, v)) = line.split_once('=') {
            map.insert(k.to_string(), v.to_string());
        }
    }

    Ok(map)
}

#[tauri::command]
pub fn read_server_properties(server_path: String) -> Result<ServerProperties, String> {
    let map = map_server_properties(&server_path)?;

    Ok(ServerProperties {
        motd: map.get("motd").cloned().unwrap_or_default(),
        online_mode: map.get("online-mode").map(|v| v == "true").unwrap_or(true),
        max_players: map
            .get("max-players")
            .and_then(|v| v.parse().ok())
            .unwrap_or(20),
        difficulty: map.get("difficulty").cloned().unwrap_or("easy".into()),
        gamemode: map.get("gamemode").cloned().unwrap_or("survival".into()),
        pvp: map.get("pvp").map(|v| v == "true").unwrap_or(true),
        spawn_protection: map
            .get("spawn-protection")
            .and_then(|v| v.parse().ok())
            .unwrap_or(16),
        view_distance: map
            .get("view-distance")
            .and_then(|v| v.parse().ok())
            .unwrap_or(10),
        simulation_distance: map
            .get("simulation-distance")
            .and_then(|v| v.parse().ok())
            .unwrap_or(10),
        server_port: map
            .get("server-port")
            .and_then(|v| v.parse().ok())
            .unwrap_or(25565),
    })
}

#[tauri::command]
pub async fn update_server_properties(
    server_path: String,
    props: ServerProperties,
) -> Result<(), String> {
    let mut map = map_server_properties(&server_path)?;

    // Update only keys we control
    map.insert("motd".into(), props.motd);
    map.insert("online-mode".into(), props.online_mode.to_string());
    map.insert("max-players".into(), props.max_players.to_string());
    map.insert("difficulty".into(), props.difficulty);
    map.insert("gamemode".into(), props.gamemode);
    map.insert("pvp".into(), props.pvp.to_string());
    map.insert(
        "spawn-protection".into(),
        props.spawn_protection.to_string(),
    );
    map.insert("view-distance".into(), props.view_distance.to_string());
    map.insert(
        "simulation-distance".into(),
        props.simulation_distance.to_string(),
    );
    map.insert("server-port".into(), props.server_port.to_string());

    //  Write back EVERYTHING (including unknown keys)
    let mut output = String::from("# Generated / Updated by Cubely\n");

    for (k, v) in map.iter() {
        output.push_str(&format!("{k}={v}\n"));
    }

    fs::write(
        &PathBuf::from(server_path).join("server.properties"),
        output,
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

/// READING AND WRITING SERVER CONFIG (cubely.json)

#[derive(Debug, Serialize, Deserialize)]
pub struct EditableServerConfig {
    pub name: String,
    pub ram_gb: u8,

    #[serde(default)]
    pub tunnel: TunnelConfig,
}

impl Default for EditableServerConfig {
    fn default() -> Self {
        Self {
            name: String::new(),
            ram_gb: 2,
            tunnel: TunnelConfig::default(),
        }
    }
}

#[tauri::command]
pub fn read_server_config(server_path: String) -> Result<EditableServerConfig, String> {
    let path = PathBuf::from(server_path).join("cubely.json");

    let raw = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    let mut full: ServerConfig = serde_json::from_str(&raw).map_err(|e| e.to_string())?;

    Ok(EditableServerConfig {
        name: full.name.clone(),
        ram_gb: full.ram_gb,
        tunnel: full.tunnel.unwrap_or(TunnelConfig::default()),
    })
}

#[tauri::command]
pub fn update_server_config(
    server_path: String,
    props: EditableServerConfig,
) -> Result<(), String> {
    let path = PathBuf::from(server_path).join("cubely.json");

    let raw = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    let mut full: ServerConfig = serde_json::from_str(&raw).map_err(|e| e.to_string())?;

    // Only allow safe fields
    full.name = props.name;
    full.ram_gb = props.ram_gb;
    full.tunnel = Some(props.tunnel);

    fs::write(&path, serde_json::to_string_pretty(&full).unwrap()).map_err(|e| e.to_string())?;

    Ok(())
}

/// SERVER STARTUP AND STOPPING

#[derive(Debug)]
pub struct ActiveServer {
    pub server_name: String,
    pub server_id: String,
    pub mc_child: Child,
    pub ngrok_child: Option<Child>,
    pub playit_child: Option<Child>,
    pub public_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActiveServerInfo {
    pub server_name: String,
    pub server_id: String,
    pub public_url: Option<String>,
}

#[tauri::command]
pub fn get_active_server(state: tauri::State<'_, AppState>) -> Option<ActiveServerInfo> {
    let active_server = state.active_server.lock().unwrap();

    active_server.as_ref().map(|s| ActiveServerInfo {
        server_name: s.server_name.clone(),
        server_id: s.server_id.clone(),
        public_url: s.public_url.clone(),
    })
}

#[tauri::command]
pub async fn start_server(
    server: ServerConfig,
    state: tauri::State<'_, AppState>,
) -> Result<ActiveServerInfo, String> {
    // check state synchronously
    {
        let mut active = state.active_server.lock().unwrap();

        if active.is_some() {
            return Err("A server is already running".into());
        }
    } // <- mutex guard DROPPED here

    // Check and install if required java version is missing
    let java_version = require_java(&server.version);

    // lock once
    let java_base = {
        let guard = state.java_base_dir.lock().unwrap();
        guard
            .clone()
            .ok_or("Java base directory not initialized")?
    };

    if !java_installed(&java_base, java_version) {
        install_java(&java_base, java_version).await?;
    }

    let java = java_binary(&java_base, java_version);

    // println!("Java path: {}", java.display());
    // println!("Java exists: {}", java.exists());
    // println!("Server path: {}", server.path);
    // println!("Server path exists: {}", PathBuf::from(&server.path).exists());

    if !java.exists() {
        return Err(format!("Java not found at {}", java.display()));
    }

    let ngrok_base = {
        let guard = state.ngrok_base_dir.lock().unwrap();
        guard
            .clone()
            .ok_or("Ngrok base dir not initialized")?
    };

    let playit_base = {
        let guard = state.playit_base_dir.lock().unwrap();
        guard
            .clone()
            .ok_or("Playit base dir not initialized")?
    };

    if !PathBuf::from(&server.path).exists() {
        return Err(format!("Server directory not found: {}", server.path));
    }

    // spawn minecraft
    let mut mc_child: Child = match server.loader {
        LoaderType::Vanilla | LoaderType::Fabric => {
            Command::new(java)
                .args([
                    format!("-Xmx{}G", server.ram_gb),
                    format!("-Xms{}G", server.ram_gb),
                    "-jar".into(),
                    "server.jar".into(),
                    "nogui".into(),
                ])
                .current_dir(&server.path)
                .stdin(Stdio::piped())
                .stdout(Stdio::piped())
                .stderr(Stdio::piped())
                .spawn()
                .map_err(|e| e.to_string())?
        }

        LoaderType::Forge => {
            let jar_name = find_forge_entry(&server.path)?;

            Command::new(java)
                .args([
                    format!("-Xmx{}G", server.ram_gb),
                    format!("-Xms{}G", server.ram_gb),
                    "-jar".into(),
                    jar_name,
                    "nogui".into(),
                ])
                .current_dir(&server.path)
                .stdin(Stdio::piped())
                .stdout(Stdio::piped())
                .stderr(Stdio::piped())
                .spawn()
                .map_err(|e| e.to_string())?
        }
    };

    // Logging to frontend
    let app = {
        let guard = state.app_handle.lock().unwrap();
        guard
            .clone()
            .ok_or("App handle not initialized")?
    };

    if let Some(stdout) = mc_child.stdout.take() {
        let app = app.clone();

        std::thread::spawn(move || {
            let reader = std::io::BufReader::new(stdout);
            for line in reader.lines().flatten() {
                let _ = app.emit("mc-log", line);
            }
        });
    }

    if let Some(stderr) = mc_child.stderr.take() {
        let app = app.clone();

        std::thread::spawn(move || {
            let reader = std::io::BufReader::new(stderr);
            for line in reader.lines().flatten() {
                let _ = app.emit("mc-log", format!("[ERR] {}", line));
            }
        });
    }

    let mut ngrok_child = None;
    let mut playit_child = None;
    let mut public_url = None;

    if let Some(tunnel) = &server.tunnel {
        if tunnel.enabled {
            match tunnel.provider {
                TunnelProvider::Playit => {
                    if !playit_installed(&playit_base) {
                        install_playit(&playit_base).await?;
                    }

                    let child = start_playit(&playit_base)?;
                    playit_child = Some(child);

                    if let Some(child) = playit_child.as_mut() {
                        if let Some(stdout) = child.stdout.take() {
                            let app = app.clone();

                            std::thread::spawn(move || {
                                let reader = std::io::BufReader::new(stdout);
                                for line in reader.lines().flatten() {
                                    let _ = app.emit("playit-log", line);
                                }
                            });
                        }

                        if let Some(stderr) = child.stderr.take() {
                            let app = app.clone();

                            std::thread::spawn(move || {
                                let reader = std::io::BufReader::new(stderr);
                                for line in reader.lines().flatten() {
                                    let _  = app.emit("playit-log", format!("[ERR] {}", line));
                                }
                            });
                        }
                    }

                    let url = get_playit_public_url(app.clone()).await?;

                    let _ = app.emit(
                        "playit-log",
                        format!("[PLAYIT] public url: {}", url),
                    );

                    public_url = Some(url);
                }

                TunnelProvider::Ngrok => {
                    if !ngrok_installed(&ngrok_base) {
                        install_ngrok(&ngrok_base).await?;
                    }

                    // Async rule: never hold std::sync::MutexGuard across .await
                    // The future must be Send (Tauri requirement)
                    // Drop active_server mutex before awaiting — MutexGuard is not Send
                    let (child, url) = start_ngrok(25565, &ngrok_base).await?;
                    ngrok_child = Some(child);
                    public_url = Some(url);
                }
            }
        }
    }

    let info = ActiveServerInfo {
        server_name: server.name.clone(),
        server_id: server.id.clone(),
        public_url: public_url.clone(),
    };

    let mut active = state.active_server.lock().unwrap();
    *active = Some(ActiveServer {
        server_name: server.name.clone(),
        server_id: server.id.clone(),
        mc_child,
        ngrok_child,
        playit_child,
        public_url,
    });

    Ok(info)
}

fn find_forge_entry(server_path: &str) -> Result<String, String> {
    let dir = PathBuf::from(server_path);

    for entry in fs::read_dir(&dir).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();

        if let Some(name) = path.file_name().and_then(|n| n.to_str()) {
            // New Forge versions with shim
            if name.contains("shim.jar") {
                return Ok(name.to_string());
            }

            // Old Forge versions with universal jar
            if name.contains("forge-") && name.contains("universal.jar") {
                return Ok(name.to_string());
            }
        }
    }

    Err("Could not find Forge launch jar".into())
}

#[tauri::command]
pub fn stop_server(state: tauri::State<'_, AppState>) -> Result<(), String> {
    let mut active = state.active_server.lock().unwrap();

    if let Some(mut server) = active.take() {
        if let Some(stdin) = server.mc_child.stdin.as_mut() {
            use std::io::Write;
            stdin.write_all(b"stop\n").ok();
        }

        // wait for clean shutdown
        server.mc_child.wait().ok();

        if let Some(mut playit) = server.playit_child {
            playit.kill().ok();
        }

        if let Some(mut ngrok) = server.ngrok_child {
            ngrok.kill().ok();
        }

        Ok(())
    } else {
        Err("No active server".into())
    }
}

#[tauri::command]
pub fn delete_server(
    server_id: String,
    state: tauri::State<'_, AppState>
) -> Result<(), String> {
    // Block deleting active server
    {
        let active = state.active_server.lock().unwrap();
        if let Some(active) = active.as_ref() {
            if active.server_id == server_id {
                return Err("Cannot delete a running server".into());
            }
        }
    }

    // Find server config
    let servers = list_servers()?;
    let server = servers
        .into_iter()
        .find(|s| s.id == server_id)
        .ok_or("Server not found")?;

    let server_path = PathBuf::from(&server.path);

    // Safety check: must live under servers_dir
    let base = servers_dir();
    if !server_path.starts_with(&base) {
        return Err("Invalid server path".into());
    }

    // Delete
    fs::remove_dir_all(&server_path).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn send_mc_command(
    command: String,
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    let mut active_server = state.active_server.lock().unwrap();

    let server = active_server
        .as_mut()
        .ok_or("No active server running")?;

    // Echo command to UI BEFORE sending
    if let Some(app) = state.app_handle.lock().unwrap().clone() {
        let _ = app.emit("mc-log", format!("> {}", command));
    }

    let stdin = server
        .mc_child
        .stdin
        .as_mut()
        .ok_or("Minecraft stdin not available")?;

    use std::io::Write;

    stdin
        .write_all(command.as_bytes())
        .and_then(|_| stdin.write_all(b"\n"))
        .map_err(|e| e.to_string())?;

    Ok(())
}
