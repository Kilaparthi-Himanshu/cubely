import { atom } from "jotai";
import { LoaderType } from "./components/ServerManagement/ServerCreateModal";

export type ServerConfig = {
    id: string,
    name: string,
    version: string,
    loader: LoaderType,
    ram_gb: number,
    path: string,
    created_at: number,
}

export type ActiveServer = {
    server_id: string,
    // public_url: string,
}

export const isMacAtom = atom<boolean | null>(null);

export const serversAtom = atom<ServerConfig[] | null>(null);

export const activeServerAtom = atom<ActiveServer | null>(null);
