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
    tunnel: {
        enabled: boolean,
        provider: "ngrok"
    }
}

export type ActiveServer = {
    server_id: string,
    // public_url: string,
}

export const isMacAtom = atom<boolean | null>(null);

export const serversAtom = atom<ServerConfig[] | null>(null);

export const activeServerAtom = atom<ActiveServer | null>(null);

export type GlobalLoaderState = {
    visible: boolean;
    message?: string;
}

export const globalLoaderAtom = atom<GlobalLoaderState>({
    visible: false,
    message: undefined,
});

export const showGlobalLoaderAtom = atom(
    null,
    (_get, set, message?: string) => {
        set(globalLoaderAtom, { visible: true, message });
    }
);

export const hideGlobalLoaderAtom = atom(
    null,
    (_get, set) => {
        set(globalLoaderAtom, { visible: false, message: undefined });
    }
);
