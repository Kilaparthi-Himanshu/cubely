'use client';

import { useState } from 'react';
import { IoMenu } from "react-icons/io5";
import { HiMiniXMark } from "react-icons/hi2";
import { motion, AnimatePresence } from "framer-motion";
import { FaHome } from "react-icons/fa";
import { FaTerminal } from "react-icons/fa6";
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { IoMdSettings } from "react-icons/io";
import { activeServerAtom } from '@/app/atoms';
import { useAtomValue } from 'jotai';

export const Sidebar = () => {
    const [sideOpen, setSideOpen] = useState(false);
    const router = useRouter();
    const pathname = usePathname();
    const activeServer = useAtomValue(activeServerAtom);

    const isActive = (path: string) => pathname === path;

    const baseBtn =
        'w-full p-4 px-2 relative flex items-center justify-center cursor-pointer';
    const activeBtn =
        'bg-stone-600 text-white';
    const inactiveBtn =
        'bg-stone-800 hover:bg-stone-600 text-neutral-300';

    return (
        <nav 
            className={`h-full ${sideOpen ? 'w-70' : 'w-15'} bg-neutral-950 flex flex-col items-center relative transition-[width] duration-200 border-r border-r-neutral-500`} 
            // onPointerEnter={() => setSideOpen(true)} 
            // onPointerLeave={() => setSideOpen(false)}
        >
            {/* <div className='w-full py-8'>
                <AnimatePresence mode="wait">
                    {!sideOpen ? (
                        <motion.div
                            key="menu"
                            initial={{ opacity: 0, rotate: -90, scale: 0.8 }}
                            animate={{ opacity: 1, rotate: 0, scale: 1 }}
                            exit={{ opacity: 0, rotate: 90, scale: 0.8 }}
                            transition={{ duration: 0.2 }}
                            className="absolute top-4 left-3.5 cursor-pointer text-white"
                            onClick={() => setSideOpen(true)}
                        >
                            <IoMenu size={30} />
                        </motion.div>
                        ) : (
                        <motion.div
                            key="close"
                            initial={{ opacity: 0, rotate: -90, scale: 0.8 }}
                            animate={{ opacity: 1, rotate: 0, scale: 1 }}
                            exit={{ opacity: 0, rotate: 90, scale: 0.8 }}
                            transition={{ duration: 0.2 }}
                            className="absolute top-4 left-3.5 cursor-pointer text-white"
                            onClick={() => setSideOpen(false)}
                        >
                            <HiMiniXMark size={30} />
                        </motion.div>
                    )}

                </AnimatePresence>
            </div> */}

            <button
                className={`${baseBtn} ${isActive('/') ? activeBtn : inactiveBtn}`}
                onClick={() => router.push('/')}
                title='Home'
            >
                <FaHome size={25} className={`${isActive('/') ? 'text-amber-400' : ''}`} />
            </button>

            <div className='w-full border-b border-amber-600'></div>

            <button
                className={`${baseBtn} ${isActive('/terminal') ? activeBtn : inactiveBtn}`}
                onClick={() => router.push('/terminal')}
                title='Terminal'
            >
                <FaTerminal size={20} className={`${isActive('/terminal') && 'text-amber-400'} ${activeServer && 'text-green-400'}`} />
            </button>

            <div className='w-full border-b border-amber-600'></div>

            <button
                className={`${baseBtn} ${isActive('/settings') ? activeBtn : inactiveBtn}`}
                onClick={() => router.push('/settings')}
                title='Settings'
            >
                <IoMdSettings size={25} className={`${isActive('/settings') ? 'text-amber-400' : ''}`} />
            </button>
        </nav>
    );
}
