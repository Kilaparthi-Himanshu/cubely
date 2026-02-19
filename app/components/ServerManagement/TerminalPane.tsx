'use client';

import { listen } from "@tauri-apps/api/event";
import { useEffect, useRef, useState } from "react";

export function TerminalPane({ eventName }: { eventName: string }) {
    const [lines, setLines] = useState<string[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);

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
        containerRef.current?.scrollTo({
            top: containerRef.current.scrollHeight,
            behavior: 'smooth'
        });
    }, [lines]);

    return (
        <div
            ref={containerRef}
            className="bg-neutral-900 rounded-xl corner-squircle text-green-400 font-mono text-sm p-2 overflow-y-auto h-full"
        >
            {lines.map((line, i) => (
                <div key={i}>{line}</div>
            ))}
        </div>
    );
}
