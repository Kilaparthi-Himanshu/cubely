'use client';

import React from 'react'
import { ActiveServerBanner } from '../components/ServerManagement/ActiveServerBanner';
import { TerminalPane } from '../components/ServerManagement/TerminalPane';

export default function Page() {
    return (
        <div className='w-full h-full flex flex-col'>
            <ActiveServerBanner />

            <div className='flex-1 w-full p-2 min-h-0'>
                <div className='w-full h-full flex flex-row gap-2'>
                    <TerminalPane eventName="mc-log" />

                    <TerminalPane eventName="playit-log" />
                </div>
            </div>
        </div>
    );
}
