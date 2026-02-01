'use client';

import { ServerConfig } from "@/app/atoms"
import { FaCirclePlay } from "react-icons/fa6";
import { IoSettingsSharp } from "react-icons/io5";

export const ServerCard = ({ 
    server
}: {
    server: ServerConfig
}) => {
    const {
        id,
        name,
        version,
        loader,
        ram_gb,
        path,
        created_at,
    } = server;

    return (
        <div className="w-50 h-65 corner-squircle bg-neutral-800 rounded-[50px] flex flex-col overflow-hidden cursor-pointer relative">
            <div className="absolute inset-0 flex flex-col pointer-events-none">
                <div 
                className="flex-1 flex items-center justify-center opacity-0 hover:opacity-100 bg-green-500/30 transition-opacity duration-150 cursor-pointer pointer-events-auto group"
                >
                    <FaCirclePlay size={50} className="text-green-500 group-active:scale-90 transition-[scale]" />
                </div>

                <div 
                    className="flex-1 flex items-center justify-center opacity-0 hover:opacity-100 bg-gray-500/30 transition-opacity duration-150 cursor-pointer pointer-events-auto group"
                >
                    <IoSettingsSharp size={50} className="text-gray-500 group-active:scale-90 transition-[scale]" />
                </div>
            </div>
        </div>
    );
}
