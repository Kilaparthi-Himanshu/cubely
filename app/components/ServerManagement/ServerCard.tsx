'use client';

import { activeServerAtom, ActiveServerInfo, hideGlobalLoaderAtom, isMacAtom, ServerConfig, showGlobalLoaderAtom } from "@/app/atoms"
import { invoke } from "@tauri-apps/api/core";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { FaCirclePlay } from "react-icons/fa6";
import { FaStopCircle } from "react-icons/fa";
import { IoSettingsSharp } from "react-icons/io5";
import { ServerSettingsModal } from "./ServerSettingsModal";
import { useEffect, useState } from "react";
import ModalRenderer from "../ModalRenderer";
import { notifyError } from "@/app/utils/alerts";
import { resetLogs } from "@/app/utils/server/resetLogs";
import { stopServer } from "@/app/utils/server/serverActions";

export const ServerCard = ({
    server
}: {
    server: ServerConfig
}) => {
    const {
        id,
        name,
        version,
        loader,
        ram_gb,
        path,
        created_at,
    } = server;

    const isMac = useAtomValue(isMacAtom);
    const [serverSettingsModalOpen, setServerSettingsModalOpen] = useState(false);
    const [activeServer, setActiveServer] = useAtom(activeServerAtom);

    const isActive = activeServer?.server_id === server.id;
    const isAnotherRunning = activeServer !== null && activeServer.server_id !== server.id;

    const setGlobalShowLoader = useSetAtom(showGlobalLoaderAtom);
    const setHideGlobalLoader = useSetAtom(hideGlobalLoaderAtom);

    const handlePlayStop = async () => {
        try {
            if (isActive) {
                await stopServer();
            } else if (isAnotherRunning) {
                notifyError("Another server is already running.");
            } else {
                setGlobalShowLoader("Starting server...");
                resetLogs(); // Reset old logs
                const startedServer = await invoke<ActiveServerInfo>("start_server", { server });
                setActiveServer(startedServer);
                await invoke("discord_set_server_running", { serverName: server.name });
            }
        } catch (err) {
            notifyError(err?.toString() ?? "Failed to start server");
            console.error(err);
        } finally {
            setHideGlobalLoader();
        }
    }

    return (
        <>
            <ModalRenderer isOpen={serverSettingsModalOpen}>
                <ServerSettingsModal setIsOpen={setServerSettingsModalOpen} server={server} />
            </ModalRenderer>

            <div className={`w-50 h-65 corner-squircle bg-neutral-800 flex flex-col overflow-hidden cursor-pointer relative shadow-md ${isMac ? 'rounded-[30px]' : ' rounded-[50px]'} ${isActive && 'border-2 border-green-500'} cyberpunk: bg-red-900/70 cyberpunk:rounded-none cyberpunk:rounded-tl-[40px] cyberpunk:corner-tl-bevel cyberpunk:rounded-br-[30px] cyberpunk:corner-br-bevel cyberpunk-border cyberpunk-glow`}>
                <div className="absolute inset-0 flex flex-col pointer-events-none">
                    <button 
                        onClick={handlePlayStop}
                        disabled={isAnotherRunning}
                        className={`
                            flex-1 flex items-center justify-center transition-opacity duration-150 cursor-pointer pointer-events-auto group z-100
                            ${isAnotherRunning ? "opacity-30 cyberpunk:opacity-40 cursor-not-allowed" : "opacity-0 hover:opacity-100"}
                            ${isActive ? "bg-red-500/90" : "bg-green-500/90 cyberpunk:bg-green-900/80"}
                        `}
                        onPointerEnter={() => {
                            // const audio = new Audio('/audio/Cubely_Hover_Sound.mp3');
                            // audio.volume = 0.3; // volume is 0.0 – 1.0
                            // audio.play();
                        }}
                    >
                        {isActive ? 
                            <FaStopCircle 
                                size={50} 
                                className="text-red-700 group-active:scale-90 transition-[scale]"
                            /> : 
                            <FaCirclePlay 
                                size={50} 
                                className="text-green-700 group-active:scale-90 transition-[scale]"
                            />
                        }
                    </button>

                    <button 
                        onClick={() => setServerSettingsModalOpen(true)}
                        disabled={activeServer !== null}
                        className={`
                            flex-1 flex items-center justify-center bg-gray-500/90 cyberpunk:bg-gray-800/80 transition-opacity duration-150 cursor-pointer pointer-events-auto group z-100
                            ${activeServer ? "opacity-30 cyberpunk:opacity-40 cursor-not-allowed" : "opacity-0 hover:opacity-100"}
                        `}
                    >
                        <IoSettingsSharp 
                            size={50} 
                            className="text-gray-700 group-active:scale-90 transition-[scale]" 
                        />
                    </button>
                </div>

                <div className="h-full flex flex-col relative">
                    <div 
                        className="flex-1 bg-[url('/minecraft.jpg')] bg-cover bg-center mask-[linear-gradient(to_bottom,black_30%,transparent)]
                        [-webkit-mask-image:linear-gradient(to_bottom,black_30%,transparent)]"
                    />

                    <div className="flex-1 p-2 px-4 flex flex-col justify-center text-white cyberpunk:text-red-600 font-mono text-sm gap-1">
                        <p>
                            <span className="font-semibold">Name:</span>{" "}
                            <span className="text-amber-400 cyberpunk:text-cyber-blue">{name}</span>
                        </p>
                        <p>
                            <span className="font-semibold">Version:</span>{" "}
                            <span className="text-amber-400 cyberpunk:text-cyber-blue">{version}</span>
                        </p>
                        <p>
                            <span className="font-semibold">Loader:</span>{" "}
                            <span className="text-amber-400 cyberpunk:text-cyber-blue">{loader.charAt(0).toUpperCase() + loader.slice(1)}</span>
                        </p>
                        <p>
                            <span className="font-semibold">RAM:</span>{" "}
                            <span className="text-amber-400 cyberpunk:text-cyber-blue">{ram_gb}</span><span className="text-blue-300 cyberpunk:text-cyber-green"> GB</span>
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
