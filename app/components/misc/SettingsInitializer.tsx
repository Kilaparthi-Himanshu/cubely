'use client';

import { settingsAtom  } from '@/app/atoms';
import { invoke } from '@tauri-apps/api/core';
import { useSetAtom } from 'jotai';
import React, { useEffect } from 'react';

export const SettingsInitializer = () => {
    const setSettings = useSetAtom(settingsAtom);

    useEffect(() => {
        const theme = localStorage.getItem("theme") ?? "default";
        const rpcEnabled = localStorage.getItem("rpcEnabled") === "true";

        setSettings({
            theme: theme as any,
            rpcEnabled,
        });

        // Apply theme
        document.documentElement.dataset.theme = theme;

        // Initiate RPC
        if (rpcEnabled) {
            invoke("set_idle");
        } else {
            invoke("clear_rpc");
        }
    }, []);

    return null;
}
