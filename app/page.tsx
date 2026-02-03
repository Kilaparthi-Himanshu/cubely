'use client';

import { invoke } from "@tauri-apps/api/core";
import { ServerCard } from "./components/ServerManagement/ServerCard";
import { ServerCreateCard } from "./components/ServerManagement/ServerCreateCard";
import ModalRenderer from "./components/ModalRenderer";
import { useEffect, useMemo, useState } from "react";
import { ServerCreateModal } from "./components/ServerManagement/ServerCreateModal";
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
        }

        loadServers();
    }, []);

    const sortedArrays = useMemo(() => {
        if (!servers) return [];
        return [...servers].sort((a, b) => b.created_at - a.created_at);
    }, [servers]);

    return (
        <div className="bg-neutral-900 w-full h-full flex p-4 gap-4 flex-wrap app-scroll relative">
            <ServerCreateCard setIsOpen={setServerCreateModalOpen} />

            {sortedArrays?.map(server => (
                <ServerCard server={server} key={server.id} />
            ))}

            <ModalRenderer isOpen={serverCreateModalOpen}> {/* This allows for smoother fade out */}
                <ServerCreateModal setIsOpen={setServerCreateModalOpen} versions={serverVersions} />
            </ModalRenderer>
        </div>
    );
}
