'use client';

import { activeServerAtom, mcLogsAtom, playitLogsAtom } from "@/app/atoms";
import { notifyError } from "@/app/utils/alerts";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useAtom, useAtomValue } from "jotai";
import { useEffect, useRef, useState } from "react";

type LogTypes = "mc-log" | "playit-log";

export function TerminalPane({ eventName }: { eventName: LogTypes }) {
    let linesAtom = mcLogsAtom; // initialization for safe fallback

    if (eventName === "mc-log") {
        linesAtom = mcLogsAtom;
    } else if (eventName === "playit-log") {
        linesAtom = playitLogsAtom;
    }

    const [lines, setLines] = useAtom(linesAtom);
    const containerRef = useRef<HTMLDivElement>(null);
    const isFirstRender = useRef(true);
    const shouldAutoScroll = useRef(true);
    const activeServer = useAtomValue(activeServerAtom);
    const [input, setInput] = useState('');

    useEffect(() => {
        let unlisten: any;

        listen<string>(eventName, (event) => {
            setLines(prev => {
                const updated = [...prev, event.payload];
                if (updated.length > 1000) updated.shift(); // prevent memory blow
                return updated;
            });
        }).then(fn => unlisten = fn);

        return () => {
            if (unlisten) unlisten();
        }
    }, [eventName]);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const onScroll = () => {
            const threshold = 10;
            shouldAutoScroll.current =
            el.scrollTop + el.clientHeight >= el.scrollHeight - threshold;
        };

        el.addEventListener('scroll', onScroll);
        return () => el.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        if (isFirstRender.current) {
            el.scrollTop = el.scrollHeight;
            isFirstRender.current = false;
            return;
        }

        if (!shouldAutoScroll.current) return;

        el.scrollTo({
            top: el.scrollHeight,
            behavior: 'smooth'
        });
    }, [lines]);

    const sendCommand = async () => {
        if (!input.trim()) return;

        try {
            await invoke("send_mc_command", { command: input });
            setInput("");
        } catch (e) {
            notifyError(e?.toString() ?? "Unable to execute the command. Please try again.");
            console.error(e);
        }
    }

    return (
        <div className="flex flex-col flex-1 min-w-0 w-full h-full gap-2">
            <span className="rounded-2xl corner-squircle bg-neutral-900 border border-amber-400 px-2 py-1 text-amber-400 cyberpunk:text-cyber-purple font-semibold cyberpunk:bg-red-950/20 cyberpunk:rounded-none cyberpunk:rounded-tr-2xl cyberpunk:corner-tr-bevel cyberpunk-border cyberpunk-glow">{eventName === 'mc-log' ? 'Minecraft Terminal' : 'Tunnel Terminal (Playit)'}:</span>

            <div
                ref={containerRef}
                className={`bg-neutral-900 border rounded-2xl corner-squircle text-green-400 cyberpunk:text-cyber-sea-green font-mono text-sm p-2 overflow-y-auto w-full h-full app-scroll break-all min-w-0 flex-1 wrap-break-word whitespace-pre-wrap cyberpunk:bg-red-950/20 cyberpunk:rounded-none cyberpunk-border cyberpunk-glow ${eventName !== "mc-log" && 'cyberpunk:rounded-bl-2xl cyberpunk:corner-bl-bevel'}`}
            >
                {lines.length === 0 
                    ?   <div className="w-full h-full flex justify-center items-center font-bold text-amber-400">
                            No Logs To Display!
                        </div>
                    :   lines.map((line, i) => (
                            <div key={i}>{line}</div>
                        ))
                }
            </div>

            {eventName === "mc-log" && 
                <input 
                    className="w-full bg-neutral-900 border outline-0 text-md text-green-400 cyberpunk:text-cyber-sea-green rounded-2xl corner-squircle p-2 h-11.5 cyberpunk:bg-red-950/20 cyberpunk:rounded-none cyberpunk:rounded-bl-2xl cyberpunk:corner-bl-bevel cyberpunk:px-4 cyberpunk-border cyberpunk-glow" 
                    placeholder={activeServer ? 'Input goes here...' : 'Start server to enter commands...'} 
                    disabled={!activeServer}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => {
                        if (e.key === "Enter") {
                            sendCommand();
                        }
                    }}
                />
            }
        </div>
    );
}
