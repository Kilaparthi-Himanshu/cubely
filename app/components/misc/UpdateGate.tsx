'use client';

import { invoke } from '@tauri-apps/api/core';
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import React, { useEffect, useState, useRef } from 'react';

export const UpdateGate = ({ children }: { children: React.ReactNode }) => {
    const [status, setStatus] = useState<
        "checking" | "updating" | "done"
    >("checking");

    const [progress, setProgress] = useState(0);

    const downloadedRef = useRef(0);
    const totalRef = useRef(0);

    const [downloaded, setDownloaded] = useState(0);
    const [total, setTotal] = useState(0);

    useEffect(() => {
        async function run() {
            try {
                const active = await invoke("get_active_server");

                if (active) {
                    setStatus("done");
                    return;
                }

                const update = await check();
                // {
                //     async downloadAndInstall(cb: any) {
                //         const TOTAL = 1000; // pretend bytes

                //         cb({
                //             event: "Started",
                //             data: { contentLength: TOTAL },
                //         });

                //         let downloaded = 0;

                //         const interval = setInterval(() => {
                //             const chunk = 50;
                //             downloaded += chunk;

                //             cb({
                //                 event: "Progress",
                //                 data: { chunkLength: chunk },
                //             });

                //             if (downloaded >= TOTAL) {
                //                 clearInterval(interval);
                //                 cb({ event: "Finished" });
                //             }
                //         }, 200);

                //         await new Promise(res => setTimeout(res, 4000));
                //     }
                // };

                if (update) {
                    setStatus("updating");
                    console.log("Update object:", update);

                    await update.downloadAndInstall((event: any) => {
                    switch (event.event) {
                        case "Started":
                            totalRef.current = event.data.contentLength ?? 0;
                            downloadedRef.current = 0;

                            setTotal(totalRef.current);
                            setDownloaded(0);
                            break;

                        case "Progress":
                            downloadedRef.current += event.data.chunkLength;

                            setDownloaded(downloadedRef.current);

                            if (totalRef.current > 0) {
                                const percent = Math.floor(
                                    (downloadedRef.current / totalRef.current) * 100
                                );
                                setProgress(percent);
                            }
                            break;

                        case "Finished":
                            setProgress(95); // stop before full

                            setTimeout(() => {
                                setProgress(100);
                            }, 400);

                            setTimeout(() => {
                                // NOW let app close naturally
                            }, 800);
                    }
                });

                    // await relaunch();
                } else {
                    setStatus("done");
                }
            } catch (err) {
                console.error("Update error: ", err);
                setStatus("done");
            }
        }

        run();
    }, []);

    if (status !== "done") {
        return (
            <div className="absolute inset-0 z-9999 bg-black flex flex-col items-center justify-center text-white font-mono cyberpunk:bg-linear-to-br cyberpunk:from-red-950 cyberpunk:to-neutral-950 cyberpunk:backdrop-blur-2xl cyberpunk:border cyberpunk:border-red-500/30 cyberpunk:shadow-[0_0_40px_rgba(255,0,80,0.25)]">
                {status === "checking" && (
                    <>
                        <p className="text-lg">Checking for updates...</p>
                    </>
                )}

                {status === "updating" && (
                    <>
                        <p className="text-lg">Updating Cubely...</p>
                        <p className="text-sm text-gray-400 mt-2">
                            Please don’t close the app
                        </p>

                        {total === 0 ? (
                            <div className="animate-pulse w-64 h-2 bg-gray-700 mt-6 rounded" />
                        ) : (
                            <div>
                                <div className="w-64 h-2 bg-gray-800 rounded mt-6 overflow-hidden">
                                    <div
                                        className="h-full bg-white transition-all duration-200"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>

                                <p className="text-xs mt-2 text-gray-400 text-center">
                                    {progress}%
                                </p>
                            </div>
                        )}
                    </>
                )}
            </div>
        );
    }

    return <>{children}</>;
}
