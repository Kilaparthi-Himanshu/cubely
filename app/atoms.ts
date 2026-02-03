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

export const isMacAtom = atom<boolean | null>(null);

export const serversAtom = atom<ServerConfig[] | null>(null);
