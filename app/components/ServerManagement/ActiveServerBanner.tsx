import { activeServerAtom, showGlobalLoaderAtom, hideGlobalLoaderAtom } from "@/app/atoms";
import { notifyError } from "@/app/utils/alerts";
import { invoke } from "@tauri-apps/api/core";
import { acceleratedValues } from "framer-motion";
import { useAtom, useSetAtom } from "jotai";

export const ActiveServerBanner = () => {
    const [activeServer, setActiveServer] = useAtom(activeServerAtom);
    
    const setGlobalShowLoader = useSetAtom(showGlobalLoaderAtom);
    const setHideGlobalLoader = useSetAtom(hideGlobalLoaderAtom);

    if (!activeServer) return;

    return (
        <div className="w-full py-1 max-h-max bg-amber-400 text-black flex max-sm:flex-col max-md:items-start max-md:gap-4 items-center justify-between px-4 z-500 font-mono">
            <span className="text-green-800 font-semibold">
                Server running — ID: {activeServer.server_id}
            </span>

            <button
                className="bg-red-600 px-3 py-1 rounded-md text-white
                        active:scale-95 transition cursor-pointer"
                onClick={async () => {
                    try {
                        setGlobalShowLoader("Stopping server...");
                        await invoke("stop_server");
                        setActiveServer(null);
                    } catch (err) {
                        notifyError(err?.toString() ?? "Failed to start server");
                        console.error(err);
                    } finally {
                        setHideGlobalLoader();
                    }
                }}
            >
                Stop
            </button>
        </div>
    );
}
