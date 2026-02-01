'use client';

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export const Loader = () => {
    return (
        <motion.div className='bg-[rgba(43,43,43,0.3)] absolute w-full h-full flex items-center justify-center py-9 px-2 z-1000 left-0 top-0' initial={{ opacity: 0}} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.1 }}>
            <div className="flex-col gap-4 w-full flex items-center justify-center">
                <div
                    className="w-20 h-20 border-4 border-transparent text-neutral-400 text-4xl animate-spin flex items-center justify-center border-t-neutral-400 rounded-full"
                >
                    <div
                    className="w-16 h-16 border-4 border-transparent text-neutral-200 text-2xl animate-spin flex items-center justify-center border-t-neutral-200 rounded-full"
                    ></div>
                </div>
            </div>
        </motion.div>
    );
}

export const LoaderRenderer = () => {

    return (
        <AnimatePresence>
            <Loader />
        </AnimatePresence>
    );
}
