'use client';

import { AnimatePresence, motion } from 'framer-motion';
import React from 'react';
import { IoWarningOutline } from 'react-icons/io5';
import { notifyError } from '@/app/utils/alerts';
type AlertModalProps = {
    isOpen?: boolean;
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
    onConfirm: () => void | Promise<void>;

    title?: string;
    description?: string;

    confirmText?: string;
    cancelText?: string;

    confirmVariant?: "danger" | "warning" | "default";
}

const AlertModal = ({ 
    setIsOpen,
    onConfirm,
    title = "Are you sure?",
    description = "This action can't be reverted!",
    confirmText = "Confirm",
    cancelText = "Cancel",
    confirmVariant = "default"
}: AlertModalProps) => {
    const confirmStyles = {
        danger: 'bg-red-900 rounded-lg border border-red-500 px-6 py-2 text-white active:scale-95 active:bg-red-500/40 transition-[scale,background] cursor-pointer cyberpunk:rounded-none cyberpunk:rounded-br-2xl cyberpunk:corner-br-bevel',
        warning: 'bg-yellow-700 border-yellow-400 active:bg-yellow-500/40 rounded-lg border px-6 py-2 text-white active:scale-95 transition-[scale,background] cursor-pointer cyberpunk:rounded-none cyberpunk:rounded-br-2xl cyberpunk:corner-br-bevel',
        default: 'bg-neutral-700 border-neutral-500'
    }

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
                className='w-120 h-60 bg-black border border-neutral-600 rounded-xl flex flex-col py-4 cyberpunk:rounded-none  cyberpunk:rounded-tr-2xl cyberpunk:corner-tr-bevel cyberpunk:rounded-tl-2xl cyberpunk:corner-tl-bevel cyberpunk:rounded-bl-2xl cyberpunk:corner-bl-bevel cyberpunk:bg-cyber-gray'
                onClick={(e) => e.stopPropagation()}
                initial={{ y: -10 }}
                animate={{ y: 0 }}
                exit={{ y: -10 }}
                transition={{ duration: 0.2 }}
            >
                <div className='flex-3/4 flex flex-col items-center justify-center gap-2 text-2xl border-b border-neutral-600 pb-3'>
                    <IoWarningOutline size={60} className='text-red-400 cyberpunk:text-cyber-purple' />
                    <span className='cyberpunk:text-cyber-yellow'>{title}</span>
                    <span className='text-xl text-neutral-300 cyberpunk:text-cyber-dark-yellow'>{description}</span>
                </div>
                <div className='flex-1/4 flex items-center justify-end p-4 gap-2'>
                    <button 
                        className='bg-neutral-700 rounded-lg border border-neutral-500 px-6 py-2 text-white active:scale-95 active:bg-neutral-800 transition-[scale,background] cursor-pointer cyberpunk:rounded-none  cyberpunk:rounded-tl-2xl cyberpunk:corner-tl-bevel'
                        onClick={handleReject}
                    >
                        {cancelText}
                    </button>
                    <button 
                        className={`${confirmStyles[confirmVariant]} ...`}
                        onClick={handleConfirm}
                    >
                        {confirmText}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}

export const AlertModalRenderer = ({ 
    isOpen, 
    setIsOpen, 
    onConfirm,
    title,
    description,
    confirmText,
    cancelText,
    confirmVariant,
}: AlertModalProps) => {

    return (
        <AnimatePresence>
            {isOpen && 
                <AlertModal 
                    setIsOpen={setIsOpen} 
                    onConfirm={onConfirm} 
                    title={title}
                    description={description}
                    confirmText={confirmText}
                    cancelText={cancelText}
                    confirmVariant={confirmVariant}
                />
            }
        </AnimatePresence>
    );
}
