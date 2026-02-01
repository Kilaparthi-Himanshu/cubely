use std::fs;

use serde::{Deserialize, Serialize};

use crate::{commands::server_creation::LoaderType, utils::path::servers_dir};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ServerConfig {
    pub id: String,
    pub name: String,
    pub version: String,
    pub loader: LoaderType,
    pub ram_gb: u8,
    pub path: String,
    pub created_at: i64,
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
        if !version_dir.path().is_dir() { continue; } // continue if its not a folder and is a file

        for server_dir in fs::read_dir(version_dir.path()).map_err(|e| e.to_string())? {
            let server_dir = server_dir.map_err(|e| e.to_string())?;
            let config_path = server_dir.path().join("cubely.json");

            if config_path.exists() {
                let content = fs::read_to_string(config_path)
                    .map_err(|e| e.to_string())?;
                let config: ServerConfig = serde_json::from_str(&content)
                    .map_err(|e| e.to_string())?;
                servers.push(config);
            }
        }
    }

    Ok(servers)
}
