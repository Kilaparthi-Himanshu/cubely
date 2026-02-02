import { isMacAtom, ServerConfig } from "@/app/atoms";
import { notifyError } from "@/app/utils/alerts";
import { invoke } from "@tauri-apps/api/core";
import { motion } from "framer-motion";
import { useAtomValue } from "jotai";
import { useEffect, useState } from "react";
import { IoCloseCircle } from "react-icons/io5";
import { Loader } from "../misc/Loader";

type ServerProperties = {
    motd: string
    online_mode: boolean
    max_players: number
    difficulty: string
    gamemode: string
    pvp: boolean
    spawn_protection: number
    view_distance: number
    simulation_distance: number
    server_port: number
}

export const ServerSettingsModal = ({ 
    setIsOpen, 
    server,
}: { 
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>, 
    server: ServerConfig
}) => {
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

    function updateField<K extends keyof ServerProperties>(
        key: K,
        value: ServerProperties[K]
    ) {
        setForm(prev => {
            if (!prev) return prev;

            return {
                ...prev,
                [key]: value
            }
        });
    }

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
                className={`w-190 h-full bg-gray-800 corner-squircle rounded-[30px] flex flex-col items-center ${isMac && 'rounded-xl'} relative max-h-[calc(100vh-50px)] overflow-hidden`}
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

                    <div className="border-b border-[#fbbf24] w-full" />

                     <div className="w-full h-full flex flex-col gap-8 p-4 font-semibold overflow-y-auto overflow-x-hidden app-scroll">
                        <div className="flex flex-col gap-3">
                            <span className="underline">Message Of The Day:</span>

                            <textarea
                                className="outline-0 border-2 focus:border-[#fbbf24] transition-[border] corner-squircle rounded-[20px] p-2 min-h-11 h-11 max-h-50 app-scroll" 
                                value={form.motd}
                                onChange={(e) => {
                                    updateField("motd", e.target.value)

                                    e.target.style.height = "auto";
                                    e.target.style.height = `${e.target.scrollHeight}px`;
                                }}
                            />
                        </div>
                     </div>
            </motion.div>
        </motion.div>
    );
}
