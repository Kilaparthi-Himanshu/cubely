'use client';

import { invoke } from "@tauri-apps/api/core";

export default function Home() {
    const invokeRustCommand = () => {
        invoke<String>('greet', { name: "Himanshu", email: "himanshunani9@gmal.com" })
            .then(result => console.log(result))
            .catch(e => console.error(e));

        invoke('ping').then(result => console.log(result)).catch(e => console.error(e));
    }

    return (
        <div className="bg-neutral-900 w-screen h-screen flex items-center justify-center">
            <button className="bg-red-500 px-2 py-4 rounded-xl cursor-pointer active:scale-95 w-max h-max border border-white" onClick={invokeRustCommand}>CLICK ME!</button>
        </div>
    );
}
