import { isMacAtom, ServerConfig } from "@/app/atoms";
import { notifyError } from "@/app/utils/alerts";
import { invoke } from "@tauri-apps/api/core";
import { motion } from "framer-motion";
import { useAtomValue } from "jotai";
import { useEffect, useState } from "react";
import { IoCloseCircle } from "react-icons/io5";
import { Loader } from "../misc/Loader";
import { SwitchToggle } from "../misc/Switch";
import { SelectMenu } from "../misc/SelectMenu";

type ServerProperties = {
    motd: string // Done
    online_mode: boolean // Done
    max_players: number // Done
    difficulty: string // Done
    gamemode: string
    pvp: boolean // Done
    spawn_protection: number // Done
    view_distance: number // Done
    simulation_distance: number // Done
    server_port: number
}

export const ServerSettingsModal = ({ 
    setIsOpen, 
    server,
}: { 
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>, 
    server: ServerConfig
}) => {
    const DIFFICULTIES = ["peaceful", "easy", "normal", "hard"];

    const isMac = useAtomValue(isMacAtom);
    const [form, setForm] = useState<ServerProperties | null>(null);

    useEffect(() => {
        async function getServerProperties() {
            const props = await invoke<ServerProperties>(
                  "read_server_properties",
                { serverPath: server.path }
            ).catch(err => {
                notifyError("Something went wrong, please reopen settings and try again!");
                console.error(err);
                setIsOpen(false);
            });

            console.log(props);
            setForm(props!);
        }

        getServerProperties();
    }, []);

    const updateField = <K extends keyof ServerProperties>(
        key: K,
        value: ServerProperties[K]
    ) => {
        setForm(prev => {
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
        if (!form) return;

        updateField(key, clamp(form[key] as number, min, max));
    }

    const clamp = (value: number, min: number, max: number) => {
        return Math.min(Math.max(value, min), max);
    }

    const handleEditServerProperties = () => {

    }

    useEffect(() => {
        console.log(form);
    }, [form]);

    if (!form) return <Loader />

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

                <div className="border-b border-amber-400 w-full" />

                <div className="w-full h-full flex flex-col gap-8 p-4 font-semibold overflow-y-auto overflow-x-hidden app-scroll">
                    <div className="flex flex-col gap-3">
                        <span>Message Of The Day:</span>

                        <textarea
                            className="outline-0 border-2 focus:border-amber-400 transition-[border] corner-squircle rounded-[20px] p-2 min-h-11 h-11 max-h-50 app-scroll" 
                            value={form.motd}
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
                                    checked={form.online_mode}
                                    onChange={(e) => updateField("online_mode", e.target.checked)}
                                />
                            </div>

                            <span className="text-xs text-gray-400">
                                {form.online_mode
                                    ? "Authenticates players with Mojang."
                                    : "Allows offline or cracked clients."}
                            </span>
                        </div>

                        <div className="h-full border-l-3 border-amber-400" />

                        <div className="flex flex-col gap-3 h-max">
                            <div className="flex gap-3 h-max">
                                <span>PVP:</span>

                                <SwitchToggle 
                                    checked={form.pvp}
                                    onChange={(e) => updateField("pvp", e.target.checked)}
                                />
                            </div>

                            <span className="text-xs text-gray-400">
                                {form.pvp
                                    ? "Players can damage each other."
                                    : "Player-vs-player combat disabled."}
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <span>Max Players:</span>

                        <input 
                            className="outline-0 border-2 focus:border-amber-400 transition-[border] corner-squircle rounded-[20px] p-2 w-1/2" 
                            value={form.max_players ?? 20}
                            onChange={(e) => {console.log(Number(e.target.value)); updateField("max_players", Number(e.target.value))}}
                            type="number"
                            min="1"
                        />

                        <span className={`text-xs transition-colors ${
                                form.max_players > 20
                                    ? "text-amber-400"
                                    : "text-gray-400"
                                }`}
                            >
                                {form.max_players > 20
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
                                value={form.difficulty}
                                onChange={(value) => updateField("difficulty", value)}
                                placeholder="Select difficulty"
                            />
                        </div>

                        <span className="text-xs text-gray-400">
                            Affects mob damage, hunger, and spawn rules.
                        </span>

                        <span className="text-sm text-amber-400">
                            {form.difficulty === "peaceful" && "No hostile mobs. Hunger disabled."}
                            {form.difficulty === "easy" && "Hostile mobs deal less damage."}
                            {form.difficulty === "normal" && "Vanilla survival experience."}
                            {form.difficulty === "hard" && "Mobs hit harder and hunger is unforgiving."}
                        </span>
                    </div>

                    <div className="flex flex-col gap-3">
                        <span>Spawn Protection:</span>

                        <input 
                            className="outline-0 border-2 focus:border-amber-400 transition-[border] corner-squircle rounded-[20px] p-2 w-1/2" 
                            value={form.spawn_protection ?? 16}
                            onChange={(e) => {
                                    console.log(Number(e.target.value)); 
                                    handleNumberChange("spawn_protection", e.target.value);
                                }
                            }
                            onBlur={() => handleNumberBlur("spawn_protection", 0, 128)}
                            type="number"
                            min={0}
                            max={128}
                        />

                        <span className={`text-xs transition-colors ${
                                form.spawn_protection > 16
                                    ? "text-amber-400"
                                    : "text-gray-400"
                                }`}
                            >
                                {form.spawn_protection === 0
                                    ? "Spawn protection disabled."
                                    : "Large values can block building near spawn."
                                }
                        </span>
                    </div>

                    <div className="flex flex-col gap-3">
                        <span>View Distance:</span>

                        <input 
                            className="outline-0 border-2 focus:border-amber-400 transition-[border] corner-squircle rounded-[20px] p-2 w-1/2" 
                            value={form.view_distance ?? 10}
                            onChange={(e) => {
                                    console.log(Number(e.target.value)); 
                                    handleNumberChange("view_distance", e.target.value);
                                }
                            }
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
                            value={form.simulation_distance ?? 10}
                            onChange={(e) => {
                                    console.log(Number(e.target.value)); 
                                    handleNumberChange("simulation_distance", e.target.value);
                                }
                            }
                            onBlur={() => handleNumberBlur("simulation_distance", 2, Math.min(32, form.view_distance))}
                            type="number"
                            min={2}
                            max={32}
                            step={1}
                        />

                        <span className="text-xs text-gray-400">
                            Controls how far players can see (in chunks).
                        </span>

                        {form.simulation_distance > form.view_distance && (
                            <span className="text-sm text-red-400">
                                Simulation distance cannot exceed view distance.
                            </span>
                        )}
                    </div>

                    <div className="flex flex-col gap-3">
                        <span>Server Port:</span>

                        <input 
                            className="outline-0 border-2 focus:border-amber-400 transition-[border] corner-squircle rounded-[20px] p-2 w-1/2" 
                            value={form.server_port ?? 10}
                            onChange={(e) => {
                                    console.log(Number(e.target.value)); 
                                    handleNumberChange("server_port", e.target.value);
                                }
                            }
                            onBlur={() => handleNumberBlur("server_port", 1024, 65535)}
                            type="number"
                            min={1024}
                            max={65535}
                            step={1}
                        />

                        <span className="text-xs text-gray-400">
                            Default Minecraft port is 25565.
                        </span>

                        <span className={`text-sm ${form.server_port !== 25565 ? "text-amber-400" : "text-gray-400"}`}>
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
