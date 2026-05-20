'use client';

import { listen } from '@tauri-apps/api/event';
import { useEffect, useState } from 'react';
import { motion } from "framer-motion";
import { AlertModalRenderer } from './AlertModal';
import { useAtom } from 'jotai';
import { activeServerAtom } from '@/app/atoms';
import { stopServer } from '@/app/utils/server/serverActions';
import { notifyError } from '@/app/utils/alerts';
import { exit } from "@tauri-apps/plugin-process";

export default function CloseGuard() {
    const [open, setOpen] = useState(false);
    const [activeServer, setActiveServer] = useAtom(activeServerAtom);

    useEffect(() => {
        const unlisten = listen("confirm_close", () =>  {
            if (!open) setOpen(true);
        });

        return () => {
            unlisten.then(f => f());
        }
    }, []);

    return (
        <>
            {open && (
                <div className='absolute inset-0 z-9999 bg-black flex flex-col items-center justify-center text-white font-mono cyberpunk:bg-linear-to-br cyberpunk:from-red-950 cyberpunk:to-neutral-950 cyberpunk:backdrop-blur-2xl cyberpunk:border cyberpunk:border-red-500/30 cyberpunk:shadow-[0_0_40px_rgba(255,0,80,0.25)]'>
                    <AlertModalRenderer
                        isOpen={open} 
                        setIsOpen={setOpen} 
                        onConfirm={async () => {
                            try {
                                await stopServer();
                            } catch (e) {
                                notifyError(`${e}`);
                                return;
                            }
                            console.log("GOGOGAGA");
                            await exit(0);
                        }} 
                        confirmText='Save and Quit'
                        cancelText="Cancel"
                        confirmVariant="default"
                        description=''
                        title={`Server still runnning: '${activeServer?.server_name}'.`}
                    />
                    <button onClick={() => setOpen(false)}>Close</button>
                </div>
            )}
        </>
    );
}

