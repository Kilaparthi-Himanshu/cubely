'use client';

import { getCurrentWindow, Window } from "@tauri-apps/api/window";
import { useEffect, useState } from "react";
import { GoDash } from "react-icons/go";
import { VscChromeMaximize } from "react-icons/vsc";
import { VscChromeRestore } from "react-icons/vsc";
import { IoClose } from "react-icons/io5";
import { useAtomValue } from "jotai";
import { isMacAtom } from "../atoms";

export const Titlebar = () => {
    const [appWindow, setAppWindow] = useState<Window | null>(null);
    const [isMaximized, setIsMaximized] = useState(false);
    const isMac = useAtomValue(isMacAtom);

    useEffect(() => {
        const win = getCurrentWindow();
        setAppWindow(win);

        win.isMaximized().then(setIsMaximized);

        const unlisten = win.onResized(() => {
            win.isMaximized().then(setIsMaximized);
        });
        return () => {
            unlisten.then((f) => f());
        }
    }, []);

    return (
        <div 
            className={`w-full bg-linear-60 from-blue-300 to-neutral-950 h-8.75 flex items-center justify-between ${isMac && 'justify-end pr-1'} cyberpunk:bg-linear-to-r cyberpunk:from-red-950 cyberpunk:to-neutral-950 cyberpunk:from-50%`}
            data-tauri-drag-region
        >
            <div className={`${isMac ? "ml-18.75 text-emerald-500 cyberpunk:text-cyber-cyan" : "text-emerald-700 cyberpunk:text-cyber-cyan"} font-semibold font-mono select-none px-2`}>
                Cubely
            </div>

            {!isMac && 
                <div className="flex text-neutral-900 h-full">
                    <button onClick={() => appWindow?.minimize()} className="h-full w-10 flex items-center justify-center cursor-pointer hover:bg-cyan-700 text-white">
                        <GoDash size={20} />
                    </button>
                    <button onClick={() => appWindow?.toggleMaximize()} className="h-full w-10 flex items-center justify-center cursor-pointer hover:bg-cyan-700 text-white">
                        {isMaximized ? <VscChromeRestore size={20} /> : <VscChromeMaximize size={20} />}
                    </button>
                    <button onClick={() => appWindow?.close()} className="h-full w-10 flex items-center justify-center cursor-pointer hover:bg-red-700 text-white">
                        <IoClose size={20} />
                    </button>
                </div>
            }
        </div>
    );
}
