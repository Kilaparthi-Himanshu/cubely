'use client';

import React from 'react'
import { ActiveServerBanner } from '../components/ServerManagement/ActiveServerBanner';

export default function Page() {
    return (
        <div className='w-full h-full flex flex-col'>
            <ActiveServerBanner />
            Terminal
        </div>
    );
}
