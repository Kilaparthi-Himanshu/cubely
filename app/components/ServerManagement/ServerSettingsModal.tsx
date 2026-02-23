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
import { readServerConfig, readServerProperties, updateServerConfig, updateServerProperties } from "@/app/utils/server/serverProperties";
import { refreshServers } from "@/app/utils/server/refreshServers";
import DiscreteSlider from "../misc/Slider";
import { ramMarks } from "./ServerCreateModal";
import { deleteServer } from "@/app/utils/server/deleteServer";
import { DeleteSessionModalRenderer } from "../misc/DeleteConfirmModal";

export type ServerProperties = {
    motd: string,
    online_mode: boolean,
    max_players: number,
    difficulty: string,
    gamemode: string,
    pvp: boolean,
    spawn_protection: number,
    view_distance: number,
    simulation_distance: number,
    server_port: number,
}

type TunnelConfig = {
    enabled: boolean;
    provider: "ngrok"
}

export type EditableServerConfig = Pick<ServerConfig, "name" | "ram_gb"> & {
    tunnel: TunnelConfig
}

export const ServerSettingsModal = ({ 
    setIsOpen, 
    server,
}: { 
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
    server: ServerConfig;
}) => {
    const DIFFICULTIES = ["peaceful", "easy", "normal", "hard"];
    const GAMEMODES = ["survival", "creative", "adventure", "spectator"];

    const isMac = useAtomValue(isMacAtom);
    const [properties, setProperties] = useState<ServerProperties | null>(null);
    const [loading, setLoading] = useState(false);
    const [config, setConfig] = useState<EditableServerConfig | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);

    useEffect(() => {
        async function getServerProperties() {
            try {
                const props = await readServerProperties(server.path);
                if (props) {
                    setProperties(props);
                    console.log("GG: ", props);
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
                if (props) {
                    setConfig(props);
                    console.log(props);
                }
            } catch(err) {
                console.error(err);
                setIsOpen(false);
            }
        }

        getServerConfig();
    }, [server]);

    const updatePropertyField = <K extends keyof ServerProperties>(
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

    const updateConfigField = <K extends keyof EditableServerConfig>(
        key: K,
        value: EditableServerConfig[K]
    ) => {
        setConfig(prev => {
            if (!prev) return prev;

            return {
                ...prev,
                [key]: value
            }
        });
    }

    const updateTunnelField = <K extends keyof TunnelConfig>(
        key: K,
        value: TunnelConfig[K]
    ) => {
        setConfig(prev => {
            if (!prev) return prev;

            return {
                ...prev,
                tunnel: {
                    ...prev.tunnel,
                    [key]: value
                }
            }
        });
    }

    const handleNumberChange = (
        key: keyof ServerProperties,
        value: string
    ) => {
        updatePropertyField(key, value === "" ? 0 : Number(value));
    }

    const handleNumberBlur =(
        key: keyof ServerProperties,
        min: number,
        max: number
    ) => {
        if (!properties) return;

        updatePropertyField(key, clamp(properties[key] as number, min, max));
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

            if (!config) {
                notifyError("An error has occured!");
                return;
            }

            if (properties.simulation_distance > properties.view_distance) {
                notifyError("Simulation distance cannot exceed view distance.");
                return;
            }

            await updateServerProperties(server.path, properties);

            await updateServerConfig(server.path, config);

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
            console.log("GG");
        } catch(err) {
            console.error(err);
        }
    }

    const handleDeleteServer = async() => {
        try {
            await deleteServer(server.id);

            await refreshServers();

            notifySuccess({
                message: "Server deleted successfully!",
                hideProgressBar: false
            });
        } catch (err) {
            notifyError("An error occured while deleting the server. Please try again!");
            console.error("Create server failed:", err);
        } finally {
            setIsOpen(false);
        }
    }

    if (!properties || !config) return <Loader />

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
                className={`w-210 h-full bg-gray-800 corner-squircle rounded-[30px] flex flex-col items-center ${isMac && 'rounded-xl'} relative max-h-225 overflow-hidden`}
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
                        className={`z-300 absolute right-4 p-2 text-green-800 font-bold bg-amber-400 active:bg-amber-500 transition-colors text-[10px] cursor-pointer ${isMac ? 'rounded-b-2xl' : 'corner-b-bevel rounded-b-[10px]'}`}
                        onClick={openServerFolder}
                    >
                        Open Folder
                    </button>
                </div>

                <div className="w-full h-full flex flex-col gap-8 p-4 font-semibold overflow-y-auto overflow-x-hidden app-scroll">
                    <div className="flex flex-col gap-3 w-1/2">
                        <span>Instanc Name::</span>

                        <input
                            className="outline-0 border-2 focus:border-amber-400 transition-[border] corner-squircle rounded-[20px] p-2 min-h-11 h-11 max-h-50 app-scroll cursor-not-allowed opacity-60" 
                            value={config.name}
                            // onChange={(e) => {
                            //     updateConfigField("name", e.target.value)
                            // }}
                            disabled
                        />

                        <span className="text-xs text-gray-400">
                            Intance name cannot be changed after creation.
                        </span>
                    </div>

                    <div className="flex flex-col gap-3 w-1/2">
                        <span>RAM Allocated:</span>

                        <div className="w-full px-1">
                            <DiscreteSlider 
                                ariaLabel="Ram Allocation"
                                value={config.ram_gb}
                                step={1}
                                min={1}
                                max={16}
                                marks={ramMarks}
                                unit="GB"
                                onChange={(value) => updateConfigField("ram_gb", Number(value))}
                            />
                        </div>

                        <span className="text-sm text-amber-400">
                            {config.ram_gb <= 3 && "Good for small vanilla servers"}
                            {config.ram_gb === 4 && "Recommended for most servers ⭐"}
                            {config.ram_gb > 4 && "Best for modded servers"}
                        </span>
                    </div>

                    <div className="flex flex-col gap-3">
                        <span>Message Of The Day:</span>

                        <textarea
                            className="outline-0 border-2 focus:border-amber-400 transition-[border] corner-squircle rounded-[20px] p-2 min-h-11 h-11 max-h-50 app-scroll" 
                            value={properties.motd}
                            onChange={(e) => {
                                updatePropertyField("motd", e.target.value)

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
                                    onChange={(e) => updatePropertyField("online_mode", e.target.checked)}
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
                                    onChange={(e) => updatePropertyField("pvp", e.target.checked)}
                                />
                            </div>

                            <span className="text-xs text-gray-400">
                                {properties.pvp
                                    ? "Players can damage each other."
                                    : "Player-vs-player combat disabled."}
                            </span>
                        </div>

                        <div className="h-full border-l-3 border-amber-400" />

                        <div className="flex flex-col gap-3 h-max">
                            <div className="flex gap-3 h-max">
                                <span>Tunnel (Playit.gg):</span>

                                <SwitchToggle 
                                    checked={config.tunnel.enabled}
                                    onChange={(e) => updateTunnelField("enabled", e.target.checked)}
                                />
                            </div>

                            <span className="text-xs text-gray-400">
                                {config.tunnel.enabled
                                    ? "Friends can join using a public link."
                                    : "Share your server using a public link."
                                }
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <span>Max Players:</span>

                        <input 
                            className="outline-0 border-2 focus:border-amber-400 transition-[border] corner-squircle rounded-[20px] p-2 w-1/2" 
                            value={properties.max_players ?? 20}
                            onChange={(e) => updatePropertyField("max_players", Number(e.target.value))}
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
                        <span>Game Mode:</span>

                        <div className="w-1/2">
                            <SelectMenu
                                items={GAMEMODES}
                                value={properties.gamemode}
                                onChange={(value) => updatePropertyField("gamemode", value)}
                                placeholder="Select game mode"
                            />
                        </div>

                        <span className="text-xs text-gray-400">
                            Controls how players interact with the world.
                        </span>

                        <span className="text-sm text-amber-400">
                            {properties.gamemode === "survival" && "Players must gather resources to survive."}
                            {properties.gamemode === "creative" && "Unlimited blocks and flying enabled."}
                            {properties.gamemode === "adventure" && "Players cannot break blocks freely."}
                            {properties.gamemode === "spectator" && "Fly through the world without interaction."}
                        </span>
                    </div>

                    <div className="flex flex-col gap-3">
                        <span>Difficulty:</span>

                        <div className="w-1/2">
                            <SelectMenu
                                items={DIFFICULTIES}
                                value={properties.difficulty}
                                onChange={(value) => updatePropertyField("difficulty", value)}
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

                    <div className="flex flex-col gap-3 bg-red-500/50 w-1/2 p-2 corner-squircle rounded-2xl border-2 border-red-500">
                        <span className="text-red-200">Delete Instance:</span>

                        <button 
                            className="bg-red-400 px-4 py-2 text-red-900 corner-squircle rounded-2xl cursor-pointer shadow-xl active:scale-97 active:bg-red-600 transition-[scale,background] size-max"
                            onClick={() => setDeleteModalOpen(true)}
                        >
                            Delete
                        </button>

                        <span className={`text-sm text-red-400 transition-colors`}>
                            THIS ACTION CANNOT BE REVERSED!
                        </span>
                    </div>

                    <div className="w-max flex justify-end absolute bottom-4 right-4">
                        <button 
                            className="bg-amber-400 px-4 py-2 text-stone-800 corner-squircle rounded-2xl cursor-pointer shadow-xl active:scale-97 active:bg-[#bb8e1e] transition-[scale,background]"
                            onClick={handleEditServerProperties}
                        >
                            Submit
                        </button>
                    </div>
                </div>

                <DeleteSessionModalRenderer isOpen={deleteModalOpen} setIsOpen={setDeleteModalOpen} onConfirm={handleDeleteServer} />
            </motion.div>
        </motion.div>
    );
}
