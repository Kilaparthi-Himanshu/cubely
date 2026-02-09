'use client';

import { activeServerAtom, hideGlobalLoaderAtom, isMacAtom, ServerConfig, showGlobalLoaderAtom } from "@/app/atoms"
import { invoke } from "@tauri-apps/api/core";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { FaCirclePlay } from "react-icons/fa6";
import { FaStopCircle } from "react-icons/fa";
import { IoSettingsSharp } from "react-icons/io5";
import { ServerSettingsModal } from "./ServerSettingsModal";
import { useEffect, useState } from "react";
import ModalRenderer from "../ModalRenderer";
import { notifyError } from "@/app/utils/alerts";

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
                setGlobalShowLoader("Stopping server...");
                await invoke("stop_server");
                setActiveServer(null);
            } else if (isAnotherRunning) {
                notifyError("Another server is already running.");
            } else {
                setGlobalShowLoader("Starting server...");
                await invoke("start_server", { server });
                setActiveServer({
                    server_id: server.id,
                    // public_url: "local" // placeholder for now
                });
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

            <div className={`w-50 h-65 corner-squircle bg-neutral-800 flex flex-col overflow-hidden cursor-pointer relative shadow-md ${isMac ? 'rounded-[30px]' : ' rounded-[50px]'} ${isActive && 'border-2 border-green-500'}`}>
                <div className="absolute inset-0 flex flex-col pointer-events-none">
                    <button 
                        onClick={handlePlayStop}
                        disabled={isAnotherRunning}
                        className={`
                            flex-1 flex items-center justify-center transition-opacity duration-150 cursor-pointer pointer-events-auto group z-100
                            ${isAnotherRunning ? "opacity-30 cursor-not-allowed" : "opacity-0 hover:opacity-100"}
                            ${isActive ? "bg-red-500/90" : "bg-green-500/90"}
                        `}
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
                            flex-1 flex items-center justify-center bg-gray-500/90 transition-opacity duration-150 cursor-pointer pointer-events-auto group z-100
                            ${activeServer ? "opacity-30 cursor-not-allowed" : "opacity-0 hover:opacity-100"}
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

                    <div className="flex-1 p-2 px-4 flex flex-col justify-center text-white font-mono text-sm gap-1">
                        <p>
                            <span className="font-semibold">Name:</span>{" "}
                            <span className="text-amber-400">{name}</span>
                        </p>
                        <p>
                            <span className="font-semibold">Version:</span>{" "}
                            <span className="text-amber-400">{version}</span>
                        </p>
                        <p>
                            <span className="font-semibold">Loader:</span>{" "}
                            <span className="text-amber-400">{loader.charAt(0).toUpperCase() + loader.slice(1)}</span>
                        </p>
                        <p>
                            <span className="font-semibold">RAM:</span>{" "}
                            <span className="text-amber-400">{ram_gb}</span><span className="text-blue-300"> GB</span>
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
