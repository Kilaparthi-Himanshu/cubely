'use client';

import React from 'react'
import { ActiveServerBanner } from '../components/ServerManagement/ActiveServerBanner';
import { TerminalPane } from '../components/ServerManagement/TerminalPane';

export default function Page() {
    return (
        <div className='w-full h-full flex flex-col'>
            <ActiveServerBanner />

            <div className='w-full h-full flex flex-col p-4'>
                <TerminalPane eventName="mc-log" />
            </div>
        </div>
    );
}
