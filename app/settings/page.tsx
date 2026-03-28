'use client';

import React, { useEffect, useState } from 'react';
import { SelectMenu } from '../components/misc/SelectMenu';

export default function Page() {
    const THEMES = ["default", "cyberpunk"] as const;
    type Theme = (typeof THEMES)[number];

    const [theme, setTheme] = useState<Theme>("default");

    // Read theme on mount
    useEffect(() => {
        const current = document.documentElement.dataset.theme as Theme;
        setTheme(current);
    }, []);

    const updateTheme = (value: Theme) => {
        document.documentElement.dataset.theme = value;
        localStorage.setItem("theme", value);
        setTheme(value);
    }

    return (
        <div className='bg-neutral-950 cyberpunk:bg-linear-to-br cyberpunk:from-red-950 cyberpunk:to-neutral-950 cyberpunk:backdrop-blur-2xl cyberpunk:border cyberpunk:border-red-500/30 cyberpunk:shadow-[0_0_40px_rgba(255,0,80,0.25)] w-full h-full flex flex-col items-center'>
            <div className='w-full max-w-225 h-full border-x border-neutral-500 cyberpunk:border-red-500/30 cyberpunk:shadow-[0_0_40px_rgba(255,0,80,0.25)] flex flex-col p-8 font-semibold'>
                <span className='text-3xl font-bold font-mono border-b border-neutral-500 cyberpunk:border-red-500/30 pb-2 cyberpunk:rounded-br-[20px] cyberpunk:corner-br-bevel'>Settings</span>

                <div className="flex flex-col gap-3 mt-8">
                    <span>Theme:</span>

                    <div className="w-1/2">
                        <SelectMenu
                            items={THEMES}
                            value={theme}
                            onChange={updateTheme}
                            placeholder="Select theme"
                        />
                    </div>

                    <span className="text-xs text-gray-400">
                        Choose how Cubely looks.
                    </span>

                    <span className="text-sm text-amber-400">
                        {theme === "default" && "Clean and minimal UI"}
                        {theme === "cyberpunk" && "Neon futuristic aesthetic"}
                    </span>
                </div>
            </div>
        </div>
    );
}
