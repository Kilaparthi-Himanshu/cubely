'use client';

import React, { useEffect, useState } from 'react';
import { SelectMenu } from '../components/misc/SelectMenu';
import { useAtom, useAtomValue } from 'jotai';
import { activeServerAtom, AppSettings, settingsAtom } from '../atoms';
import { invoke } from '@tauri-apps/api/core';
import { SwitchToggle } from '../components/misc/Switch';

export default function Page() {
    const THEMES = ["default", "cyberpunk"] as const;
    type Theme = (typeof THEMES)[number];

    const [settings, setSettings] = useAtom(settingsAtom);
    const activeServer = useAtomValue(activeServerAtom);

    const updateTheme = (value: Theme) => {
        setSettings(prev => ({
            ...prev,
            theme: value
        }));

        document.documentElement.dataset.theme = value;

        localStorage.setItem("theme", value);
    }

    const toggleRpc = async (enabled: boolean) => {
        setSettings(prev => ({
            ...prev,
            rpcEnabled: enabled
        }));

        localStorage.setItem("rpcEnabled", String(enabled));

        if (enabled) {
            if (activeServer) {
                await invoke("discord_set_server_running", { serverName: activeServer.server_name });
            } else {
                await invoke("set_idle");
            }
        } else {
            await invoke("clear_rpc");
        }
    }

    return (
        <div className='bg-neutral-950 cyberpunk:bg-linear-to-br cyberpunk:from-red-950 cyberpunk:to-neutral-950 cyberpunk:backdrop-blur-2xl cyberpunk:border cyberpunk:border-red-500/30 cyberpunk:shadow-[0_0_40px_rgba(255,0,80,0.25)] w-full h-full flex flex-col items-center'>
            <div className='w-full max-w-225 h-full border-x border-neutral-500 cyberpunk:border-red-500/30 cyberpunk:shadow-[0_0_40px_rgba(255,0,80,0.25)] flex flex-col p-8 font-semibold'>
                <span className='text-3xl font-bold font-mono border-b border-neutral-500 cyberpunk:border-red-500/30 pb-2 cyberpunk:rounded-br-[20px] cyberpunk:corner-br-bevel'>Settings</span>

                <div className='flex flex-col gap-8 pt-8'>
                    <div className="flex flex-col gap-3">
                        <span>Theme:</span>

                        <div className="w-1/2">
                            <SelectMenu
                                items={THEMES}
                                value={settings.theme}
                                onChange={updateTheme}
                                placeholder="Select theme"
                            />
                        </div>

                        <span className="text-xs text-gray-400">
                            Choose how Cubely looks.
                        </span>

                        <span className="text-sm text-amber-400">
                            {settings.theme === "default" && "Clean and minimal UI"}
                            {settings.theme === "cyberpunk" && "Neon futuristic aesthetic"}
                        </span>
                    </div>

                    <div className='w-full border-b cyberpunk:border-cyber-cyan cyberpunk-blue-glow' />

                    <div className="flex flex-col gap-3">
                        <div className='flex gap-3'>
                            <span>Discord Rich Presence:</span>

                            <div className="flex items-center gap-3">
                                <SwitchToggle
                                    checked={settings.rpcEnabled}
                                    onChange={(e) => toggleRpc(e.target.checked)}
                                />
                            </div>
                        </div>

                        <span className="text-xs text-gray-400">
                            Show your server activity on Discord.
                        </span>

                        <span className="text-sm text-amber-400">
                            {settings.rpcEnabled
                                ? "Your activity will be visible on Discord"
                                : "Discord presence is disabled"}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
