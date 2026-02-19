'use client';

import { useEffect } from 'react';
import { useSetAtom } from 'jotai';
import { isMacAtom } from '../atoms';
import { isTauri } from '@tauri-apps/api/core';

export function TauriPlatformInit() {
    const setIsMac = useSetAtom(isMacAtom);

    useEffect(() => {
        if (!isTauri()) {
        // Web build fallback
        setIsMac(false);
        return;
        }

        import('@tauri-apps/plugin-os').then(({ platform }) => {
        const os = platform(); // sync in v2
        setIsMac(os === 'macos');
        });
    }, [setIsMac]);

    return null;
}
