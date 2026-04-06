import { activeServerAtom, showGlobalLoaderAtom } from "@/app/atoms";
import { invoke } from "@tauri-apps/api/core";
import { getDefaultStore } from "jotai";

const store = getDefaultStore();

export async function stopServer(rpcEnabled: boolean) {
    store.set(showGlobalLoaderAtom, "Stopping server...");
    await invoke("stop_server");
    store.set(activeServerAtom, null);

    rpcEnabled && await invoke("set_idle");
}
