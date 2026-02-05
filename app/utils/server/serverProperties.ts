import { ServerProperties } from "@/app/components/ServerManagement/ServerSettingsModal";
import { notifyError } from "../alerts";
import { invoke } from "@tauri-apps/api/core";
import { ServerConfig } from "@/app/atoms";

export async function readServerProperties(serverPath: string) {
    const props = await invoke<ServerProperties>(
            "read_server_properties",
        { serverPath }
    ).catch(err => {
        throw err;
    });

    return props;
}

export async function updateServerProperties(server: ServerConfig, form: ServerProperties) {
    if (!form) {
        throw new Error("An error has occured!");
    }

    for (const [key, value] of Object.entries(form)) {
        if (value === undefined || value === null) {
            notifyError(`Property ${key} is missing`);
            return;
        }
    }

    const res = await invoke('write_server_properties', { serverPath: server.path, props: form });
}
