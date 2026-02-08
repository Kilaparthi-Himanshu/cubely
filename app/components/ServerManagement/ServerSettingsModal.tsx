import { isMacAtom, ServerConfig } from "@/app/atoms";
import { notifyError, notifySuccess } from "@/app/utils/alerts";
import { invoke } from "@tauri-apps/api/core";
import { motion } from "framer-motion";
import { useAtomValue } from "jotai";
import { useEffect, useState } from "react";
import { IoCloseCircle } from "react-icons/io5";
import { Loader, LoaderRenderer } from "../misc/Loader";
import { SwitchToggle } from "../misc/Switch";
import { SelectMenu } from "../misc/SelectMenu";
import { readServerConfig, readServerProperties, updateServerProperties } from "@/app/utils/server/serverProperties";
import { refreshServers } from "@/app/utils/server/refreshServers";

export type ServerProperties = {
    motd: string,
    online_mode: boolean,
    max_players: number,
    difficulty: string,
    gamemode: string
    pvp: boolean,
    spawn_protection: number,
    view_distance: number,
    simulation_distance: number,
    server_port: number,
}

export const ServerSettingsModal = ({ 
    setIsOpen, 
    server,
}: { 
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
    server: ServerConfig;
}) => {
    const DIFFICULTIES = ["peaceful", "easy", "normal", "hard"];

    const isMac = useAtomValue(isMacAtom);
    const [properties, setProperties] = useState<ServerProperties | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        async function getServerProperties() {
            try {
                const props = await readServerProperties(server.path);
                if (props) {
                    setProperties(props);
                }
            } catch(err) {
                console.error(err);
                setIsOpen(false);
            }
        }

        getServerProperties();
    }, [server]);

    useEffect(() => {
        async function getServerConfig() {
            try {
                const props = await readServerConfig(server.path);
                // if (props) {
                    console.log(props);
                // }
            } catch(err) {
                console.error(err);
                setIsOpen(false);
            }
        }

        getServerConfig();
    }, [server]);

    const updateField = <K extends keyof ServerProperties>(
        key: K,
        value: ServerProperties[K]
    ) => {
        setProperties(prev => {
            if (!prev) return prev;

            return {
                ...prev,
                [key]: value
            }
        });
    }

    const handleNumberChange = (
        key: keyof ServerProperties,
        value: string
    ) => {
        updateField(key, value === "" ? 0 : Number(value));
    }

    const handleNumberBlur =(
        key: keyof ServerProperties,
        min: number,
        max: number
    ) => {
        if (!properties) return;

        updateField(key, clamp(properties[key] as number, min, max));
    }

    const clamp = (value: number, min: number, max: number) => {
        return Math.min(Math.max(value, min), max);
    }

    const handleEditServerProperties = async () => {
        try {
            setLoading(true);

            if (!properties?.motd) {
                notifyError("Message of the day can't be empty!");
            }

            if (!properties) {
                notifyError("An error has occured!");
                return;
            }

            await updateServerProperties(server.path, properties);

            await refreshServers();

            setIsOpen(false);

            notifySuccess({
                message: "Server properties updated successfully!",
                hideProgressBar: false
            });
        } catch (err) {
            notifyError("Something went wrong, please reopen settings and try again!");
            console.error("Edit server properties failed:", err);
        } finally {
            setLoading(false);
        }
    }

    // useEffect(() => {
    //     console.log(properties);
    // }, [properties]);

    const openServerFolder = async () => {
        try {
            await invoke("open_folder", { path: server.path });
        } catch(err) {
            console.error(err);
        }
    }

    if (!properties) return <Loader />

    return (
        <motion.div 
            className='absolute top-0 left-0 size-full bg-black/70 flex items-center justify-center z-205 text-white p-2 font-mono'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            // onClick={(e) => {
            //     e.preventDefault();
            //     setIsOpen(false);
            // }}
        >
            <motion.div 
                className={`w-160 h-full bg-gray-800 corner-squircle rounded-[30px] flex flex-col items-center ${isMac && 'rounded-xl'} relative max-h-225 overflow-hidden`}
                onClick={(e) => e.stopPropagation()}
                initial={{ y: -10 }}
                animate={{ y: 0 }}
                exit={{ y: -10 }}
                transition={{ duration: 0.2 }}
            >
                {/* {loading && <LoaderRenderer text="Changing Server Properties..." />} */}

                <IoCloseCircle
                    size={30} 
                    className="absolute right-2 top-2 cursor-pointer text-red-500 active:scale-95 transition-[scale]" 
                    title="Close"
                    onClick={(e) => {
                        e.preventDefault();
                        setIsOpen(false);
                    }}
                />

                <div className="w-full h-max p-4 pr-2">
                    <span className="text-2xl font-semibold">Server Settings</span>
                </div>

                <div className="border-t border-amber-400 w-full flex justify-end">
                    <button 
                        className={`p-2 text-green-800 font-bold bg-amber-400 text-[10px] cursor-pointer ${isMac ? 'rounded-bl-2xl' : 'corner-b-bevel rounded-bl-[50%]'}`}
                        onClick={openServerFolder}
                    >
                        Open Folder
                    </button>
                </div>

                <div className="w-full h-full flex flex-col gap-8 p-4 font-semibold overflow-y-auto overflow-x-hidden app-scroll">
                    <div className="flex flex-col gap-3">
                        <span>Message Of The Day:</span>

                        <textarea
                            className="outline-0 border-2 focus:border-amber-400 transition-[border] corner-squircle rounded-[20px] p-2 min-h-11 h-11 max-h-50 app-scroll" 
                            value={properties.motd}
                            onChange={(e) => {
                                updateField("motd", e.target.value)

                                e.target.style.height = "auto";
                                e.target.style.height = `${e.target.scrollHeight}px`;
                            }}
                        />
                    </div>

                    <div className="flex flex-row gap-5">
                        <div className="flex flex-col gap-3 h-max">
                            <div className="flex gap-3 h-max">
                                <span>Online Mode:</span>

                                <SwitchToggle 
                                    checked={properties.online_mode}
                                    onChange={(e) => updateField("online_mode", e.target.checked)}
                                />
                            </div>

                            <span className="text-xs text-gray-400">
                                {properties.online_mode
                                    ? "Authenticates players with Mojang."
                                    : "Allows offline or cracked clients."}
                            </span>
                        </div>

                        <div className="h-full border-l-3 border-amber-400" />

                        <div className="flex flex-col gap-3 h-max">
                            <div className="flex gap-3 h-max">
                                <span>PVP:</span>

                                <SwitchToggle 
                                    checked={properties.pvp}
                                    onChange={(e) => updateField("pvp", e.target.checked)}
                                />
                            </div>

                            <span className="text-xs text-gray-400">
                                {properties.pvp
                                    ? "Players can damage each other."
                                    : "Player-vs-player combat disabled."}
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <span>Max Players:</span>

                        <input 
                            className="outline-0 border-2 focus:border-amber-400 transition-[border] corner-squircle rounded-[20px] p-2 w-1/2" 
                            value={properties.max_players ?? 20}
                            onChange={(e) => updateField("max_players", Number(e.target.value))}
                            type="number"
                            min="1"
                        />

                        <span className={`text-xs transition-colors ${
                                properties.max_players > 20
                                    ? "text-amber-400"
                                    : "text-gray-400"
                                }`}
                            >
                                {properties.max_players > 20
                                    ? "More players mean more chunks, mobs, and CPU usage."
                                    : "Default value is 20 players."
                                }
                        </span>
                    </div>

                    <div className="flex flex-col gap-3">
                        <span>Difficulty:</span>

                        <div className="w-1/2">
                            <SelectMenu
                                items={DIFFICULTIES}
                                value={properties.difficulty}
                                onChange={(value) => updateField("difficulty", value)}
                                placeholder="Select difficulty"
                            />
                        </div>

                        <span className="text-xs text-gray-400">
                            Affects mob damage, hunger, and spawn rules.
                        </span>

                        <span className="text-sm text-amber-400">
                            {properties.difficulty === "peaceful" && "No hostile mobs. Hunger disabled."}
                            {properties.difficulty === "easy" && "Hostile mobs deal less damage."}
                            {properties.difficulty === "normal" && "Vanilla survival experience."}
                            {properties.difficulty === "hard" && "Mobs hit harder and hunger is unforgiving."}
                        </span>
                    </div>

                    <div className="flex flex-col gap-3">
                        <span>Spawn Protection:</span>

                        <input 
                            className="outline-0 border-2 focus:border-amber-400 transition-[border] corner-squircle rounded-[20px] p-2 w-1/2" 
                            value={properties.spawn_protection ?? 16}
                            onChange={(e) => handleNumberChange("spawn_protection", e.target.value)}
                            onBlur={() => handleNumberBlur("spawn_protection", 0, 128)}
                            type="number"
                            min={0}
                            max={128}
                        />

                        <span className={`text-xs transition-colors ${
                                properties.spawn_protection > 16 || properties.spawn_protection === 0
                                    ? "text-amber-400"
                                    : "text-gray-400"
                                }`}
                            >
                                {properties.spawn_protection === 0
                                    ? "Spawn protection disabled."
                                    : "Large values can block building near spawn."
                                }
                        </span>
                    </div>

                    <div className="flex flex-col gap-3">
                        <span>View Distance:</span>

                        <input 
                            className="outline-0 border-2 focus:border-amber-400 transition-[border] corner-squircle rounded-[20px] p-2 w-1/2" 
                            value={properties.view_distance ?? 10}
                            onChange={(e) => handleNumberChange("view_distance", e.target.value)}
                            onBlur={() => handleNumberBlur("view_distance", 2, 32)}
                            type="number"
                            min={2}
                            max={32}
                            step={1}
                        />

                        <span className="text-xs text-gray-400">
                            Controls how far players can see (in chunks).
                        </span>
                    </div>

                    <div className="flex flex-col gap-3">
                        <span>Simulation Distance:</span>

                        <input 
                            className="outline-0 border-2 focus:border-amber-400 transition-[border] corner-squircle rounded-[20px] p-2 w-1/2" 
                            value={properties.simulation_distance ?? 10}
                            onChange={(e) => handleNumberChange("simulation_distance", e.target.value)}
                            onBlur={() => handleNumberBlur("simulation_distance", 2, Math.min(32, properties.view_distance))}
                            type="number"
                            min={2}
                            max={32}
                            step={1}
                        />

                        <span className="text-xs text-gray-400">
                            Controls how far players can see (in chunks).
                        </span>

                        {properties.simulation_distance > properties.view_distance && (
                            <span className="text-sm text-red-400">
                                Simulation distance cannot exceed view distance.
                            </span>
                        )}
                    </div>

                    <div className="flex flex-col gap-3">
                        <span>Server Port:</span>

                        <input 
                            className="outline-0 border-2 focus:border-amber-400 transition-[border] corner-squircle rounded-[20px] p-2 w-1/2" 
                            value={properties.server_port ?? 10}
                            onChange={(e) => handleNumberChange("server_port", e.target.value)}
                            onBlur={() => handleNumberBlur("server_port", 1024, 65535)}
                            type="number"
                            min={1024}
                            max={65535}
                            step={1}
                        />

                        <span className="text-xs text-gray-400">
                            Default Minecraft port is 25565.
                        </span>

                        <span className={`text-sm ${properties.server_port !== 25565 ? "text-amber-400" : "text-gray-400"} transition-colors`}>
                            Non-default ports may require firewall or router changes.
                        </span>
                    </div>

                    <div className="w-full flex justify-end">
                        <button 
                            className="bg-amber-400 px-4 py-2 text-stone-800 corner-squircle rounded-2xl cursor-pointer shadow-xl active:scale-97 active:bg-[#bb8e1e] transition-[scale,background]"
                            onClick={handleEditServerProperties}
                        >
                            Submit
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
