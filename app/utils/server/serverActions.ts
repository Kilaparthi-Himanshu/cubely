import { activeServerAtom, settingsAtom, showGlobalLoaderAtom } from "@/app/atoms";
import { invoke } from "@tauri-apps/api/core";
import { getDefaultStore } from "jotai";

const store = getDefaultStore();

export async function stopServer() {
    const rpcEnabled = store.get(settingsAtom).rpcEnabled;
    console.log(rpcEnabled);
    store.set(showGlobalLoaderAtom, "Stopping server...");
    try {
        await invoke("stop_server");
    } catch (e) {
        throw e;
    }
    store.set(activeServerAtom, null);

    rpcEnabled && await invoke("set_idle");
}
