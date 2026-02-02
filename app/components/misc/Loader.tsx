'use client';

import { AnimatePresence, motion } from 'framer-motion';

export const Loader = ({
    text
}: {
    text?: string
}) => {
    return (
        <motion.div className='bg-[rgba(43,43,43,0.3)] absolute w-full h-full flex flex-col items-center justify-center py-9 px-2 z-1000 left-0 top-0 gap-2 backdrop-blur-[2px]' initial={{ opacity: 0}} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.1 }}>
            <div className="flex flex-row gap-2">
                <div className="w-4 h-4 rounded-full bg-white animate-bounce"></div>
                <div className="w-4 h-4 rounded-full bg-white animate-bounce [animation-delay:-.3s]"></div>
                <div className="w-4 h-4 rounded-full bg-white animate-bounce [animation-delay:-.5s]"></div>
            </div>

            <div className='font-bold'>{text}</div>
        </motion.div>
    );
}

export const LoaderRenderer = ({ text }: { text: string }) => {

    return (
        <AnimatePresence>
            <Loader text={text} />
        </AnimatePresence>
    );
}
