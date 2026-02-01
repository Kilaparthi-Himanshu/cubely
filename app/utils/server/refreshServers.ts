import { invoke } from "@tauri-apps/api/core";
import { ServerConfig } from "@/app/atoms";
import { serversAtom } from "@/app/atoms";
import { getDefaultStore } from "jotai";

export async function refreshServers() {
    const servers = await invoke<ServerConfig[]>("list_servers");

    const store = getDefaultStore();
    store.set(serversAtom, servers);

    return servers;
}
