import { activeServerAtom, showGlobalLoaderAtom, hideGlobalLoaderAtom } from "@/app/atoms";
import { notifyError, notifySuccess } from "@/app/utils/alerts";
import { stopServer } from "@/app/utils/server/serverActions";
import { invoke } from "@tauri-apps/api/core";
import { acceleratedValues } from "framer-motion";
import { useAtom, useSetAtom } from "jotai";

export const ActiveServerBanner = () => {
    const [activeServer, setActiveServer] = useAtom(activeServerAtom);

    const setGlobalShowLoader = useSetAtom(showGlobalLoaderAtom);
    const setHideGlobalLoader = useSetAtom(hideGlobalLoaderAtom);

    const handleCopy = async () => {
        if (!activeServer?.public_url) return;

        try {
            await navigator.clipboard.writeText(activeServer.public_url);
            // optional success toast
            notifySuccess({ message: "Copied to clipboard" }); // replace with notifySuccess if you have it
        } catch (err) {
            notifyError("Failed to copy URL");
            console.error(err);
        }
    };

    if (!activeServer) return;

    return (
        <div className="w-full py-1 max-h-max bg-amber-400 text-black flex max-sm:flex-col max-md:items-start max-md:gap-4 items-center justify-between px-4 z-500 font-mono cyberpunk:bg-cyber-blue/70 cyberpunk-blue-border cyberpunk-blue-glow">
            <div className="text-green-800 cyberpunk:text-cyber-green font-semibold flex gap-2 items-center">
                <div className="flex gap-2 items-center min-w-0">
                    Server running - Name: 
                    <span className="truncate min-w-0 max-w-60">
                        {activeServer.server_name}
                    </span>
                    , Public Url: {
                        activeServer.public_url 
                        ? <span className="text-amber-800 cyberpunk:text-cyber-yellow">{activeServer.public_url}</span> 
                        : "No Public URL available"
                    }
                </div>

                {activeServer.public_url && 
                    <button
                        onClick={handleCopy}
                        className="text-sm bg-yellow-500 px-2 py-1 border text-green-800 corner-squircle rounded-2xl cursor-pointer shadow-xl active:scale-97 active:bg-[#bb8e1e] transition-[scale,background] cyberpunk:bg-cyber-dark-blue cyberpunk:text-cyber-green cyberpunk:rounded-none cyberpunk:rounded-br-md cyberpunk:corner-br-bevel cyberpunk:rounded-tl-md cyberpunk:corner-tl-bevel cyberpunk-border cyberpunk-glow"
                    >
                        Copy
                    </button>
                }
            </div>

            <button
                className="bg-red-600 px-3 py-1 rounded-md text-white
                        active:scale-95 transition cyberpunk:bg-red-900/90 cyberpunk-border cyberpunk-glow cursor-pointer cyberpunk:rounded-none cyberpunk:rounded-tl-lg cyberpunk:corner-tl-bevel cyberpunk:rounded-br-lg cyberpunk:corner-br-bevel"
                onClick={async () => {
                    try {
                        await stopServer();
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
