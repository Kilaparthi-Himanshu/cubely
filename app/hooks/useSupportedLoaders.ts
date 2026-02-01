import { useEffect } from "react";
import { LoaderType, SupportedLoadersType } from "../components/ServerCreation/ServerCreateModal";
import { invoke } from "@tauri-apps/api/core";

export function useSupportedLoaders({
    instanceVersion,
    setSelectedLoader,
    setSupportedLoaders,
    setLoadingLoaders
}: {
    instanceVersion: string | null;
    setSelectedLoader: (value: LoaderType | null) => void;
    setSupportedLoaders: (value: SupportedLoadersType | null) => void;
    setLoadingLoaders: (value: boolean) => void;
}) {
    useEffect(() => {
        if (!instanceVersion) return;

        // Reset loader selection when version changes
        setSelectedLoader(null);
        setSupportedLoaders(null);

        setLoadingLoaders(true);

        invoke<SupportedLoadersType>("get_supported_loaders", { version: instanceVersion })
            .then((res) => {
                setSupportedLoaders(res);
            })
            .catch((err) => {
                console.error(err);

                // Fallback: only vanilla
                setSupportedLoaders({
                    vanilla: true,
                    fabric: false,
                    forge: false
                });
            })
            .finally(() => {
                setLoadingLoaders(false);
            });
    }, [instanceVersion]);
}
