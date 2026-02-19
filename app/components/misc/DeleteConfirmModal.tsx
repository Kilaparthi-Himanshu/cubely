'use client';

import { AnimatePresence, motion } from 'framer-motion';
import React from 'react';
import { IoWarningOutline } from 'react-icons/io5';
import { notifyError } from '@/app/utils/alerts';
type DeleteModalProps = {
    isOpen?: boolean;
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
    onConfirm: () => void | Promise<void>;
}

const DeleteConfirmModal = ({ setIsOpen, onConfirm }: DeleteModalProps) => {;
    const handleConfirm = async () => {
        try {
            await onConfirm();
            setIsOpen(false);
        } catch (error) {
            notifyError('Unable To Delete Session');
        }
    }

    const handleReject = (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
        e.stopPropagation()
        setIsOpen(false);
    }

    return (
        <motion.div 
            className='absolute top-0 left-0 w-full h-full bg-black/70 backdrop-blur-md flex items-center justify-center text-white p-2 z-999'
            onClick={handleReject}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            key={"xD"}
        >
            <motion.div 
                className='w-120 h-60 bg-black border border-neutral-600 rounded-xl flex flex-col py-4' 
                onClick={(e) => e.stopPropagation()}
                initial={{ y: -10 }}
                animate={{ y: 0 }}
                exit={{ y: -10 }}
                transition={{ duration: 0.2 }}
            >
                <div className='flex-3/4 flex flex-col items-center justify-center gap-2 text-2xl border-b border-neutral-600 pb-3'>
                    <IoWarningOutline size={60} className='text-red-400' />
                    <span>Are You sure?</span>
                    <span className='text-xl text-neutral-300'>This action can't be reverted!</span>
                </div>
                <div className='flex-1/4 flex items-center justify-end p-4 gap-2'>
                    <button 
                        className='bg-neutral-700 rounded-lg border border-neutral-500 px-6 py-2 text-white active:scale-95 active:bg-neutral-800 transition-[scale,background] cursor-pointer'
                        onClick={handleReject}
                    >
                        Cancel
                    </button>
                    <button 
                        className='bg-red-900 rounded-lg border border-red-500 px-6 py-2 text-white active:scale-95 active:bg-red-500/40 transition-[scale,background] cursor-pointer'
                        onClick={handleConfirm}
                    >
                        Delete
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}

export const DeleteSessionModalRenderer = ({ isOpen, setIsOpen, onConfirm}: DeleteModalProps) => {

    return (
        <AnimatePresence>
            {isOpen && <DeleteConfirmModal setIsOpen={setIsOpen} onConfirm={onConfirm} />}
        </AnimatePresence>
    );
}
