import { ServerConfig } from "@/app/atoms";
import { invoke } from "@tauri-apps/api/core";

export const deleteServer = async (serverId: string) => {
    if (!serverId) {
        throw new Error("Server ID is empty, Please try again.");
    }

    const res = await invoke('delete_server', {
        serverId
    });
}
