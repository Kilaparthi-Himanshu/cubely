import { EditableServerConfig, ServerProperties } from "@/app/components/ServerManagement/ServerSettingsModal";
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

export async function updateServerProperties(serverPath: string, form: ServerProperties) {
    if (!form) {
        throw new Error("An error has occured!");
    }

    for (const [key, value] of Object.entries(form)) {
        if (value === undefined || value === null) {
            notifyError(`Property ${key} is missing`);
            return;
        }
    }

    const res = await invoke(
        'update_server_properties', 
        { serverPath, props: form }
    ).catch(err => {
        throw err;
    });
}

export async function readServerConfig(serverPath: string) {
    const props = await invoke<ServerConfig>(
        'read_server_config',
        { serverPath }
    ).catch(err => {
        throw err;
    });

    return props;
}

export async function updateServerConfig(serverPath: string, form: EditableServerConfig) {
    if (!form) {
        throw new Error("An error has occured!");
    }

    for (const [key, value] of Object.entries(form)) {
        if (value === undefined || value === null) {
            notifyError(`Property ${key} is missing`);
            return;
        }
    }

    const res = await invoke(
        'update_server_config', 
        { serverPath, props: form }
    ).catch(err => {
        throw err;
    });
}
