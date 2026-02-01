'use client';

import { invoke } from "@tauri-apps/api/core";
import { ServerCard } from "./components/ServerCreation/ServerCard";
import { ServerCreateCard } from "./components/ServerCreation/ServerCreateCard";
import ModalRenderer from "./components/ModalRenderer";
import { useEffect, useState } from "react";
import { ServerCreateModal } from "./components/ServerCreation/ServerCreateModal";
import { ServerConfig, serversAtom } from "./atoms";
import { useAtom, useAtomValue } from "jotai";

export default function Home() {
    const [serverCreateModalOpen, setServerCreateModalOpen] = useState(false);
    const [serverVersions, setServerVersions] = useState<string[] | null>(null);
    const [servers, setServers] = useAtom(serversAtom);

    // const invokeRustCommand = () => {
    //     invoke('create_server', { name: 'First-Server', version: '1.21.9' })
    //         .then(result => console.log(result));
    // }

    useEffect(() => {
        async function getVersions() {
            try {
                const data = await invoke<string[]>('get_mc_versions');
                setServerVersions(data ?? null);
            } catch(err) {
                console.error(err);
            }
        }

        getVersions();
    }, []);

    useEffect(() => {
        async function loadServers() {
            const servers = await invoke<ServerConfig[]>('list_servers');
            setServers(servers);
            console.log(servers);
        }

        loadServers();
    }, []);

    return (
        <div className="bg-neutral-900 w-full h-full flex p-4 gap-4 flex-wrap app-scroll relative">
            <ServerCreateCard setIsOpen={setServerCreateModalOpen} />

            {servers?.map(server => (
                <ServerCard server={server} key={server.id} />
            ))}

            <ModalRenderer isOpen={serverCreateModalOpen}> {/* This allows for smoother fade out */}
                <ServerCreateModal setIsOpen={setServerCreateModalOpen} versions={serverVersions} />
            </ModalRenderer>
        </div>
    );
}
