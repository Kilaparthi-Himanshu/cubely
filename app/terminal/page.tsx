'use client';

import React from 'react'
import { ActiveServerBanner } from '../components/ServerManagement/ActiveServerBanner';
import { TerminalPane } from '../components/ServerManagement/TerminalPane';

export default function Page() {
    return (
        <div className="w-full h-full flex flex-col">
            <ActiveServerBanner />

            <div className='bg-neutral-950 cyberpunk:bg-linear-to-br cyberpunk:from-red-950 cyberpunk:to-neutral-950 w-full h-full flex flex-col min-h-0'>
                <div className='flex-1 w-full p-2 min-h-0 cyberpunk:bg-linear-to-br cyberpunk:from-red-950 cyberpunk:to-neutral-950 cyberpunk:backdrop-blur-2xl cyberpunk:border cyberpunk:border-red-500/30 cyberpunk:shadow-[0_0_40px_rgba(255,0,80,0.25)]'>
                    <div className='w-full h-full flex flex-row gap-2'>
                        <TerminalPane eventName="mc-log" />

                        <TerminalPane eventName="playit-log" />
                    </div>
                </div>
            </div>
        </div>
    );
}
