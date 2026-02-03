import { invoke } from "@tauri-apps/api/core";
import { LoaderType } from "@/app/components/ServerManagement/ServerCreateModal";

type CreateServerInput = {
    name: string;
    version: string;
    loader: LoaderType;
    ramGb: number;
}

export async function createServer({
    name,
    version,
    loader,
    ramGb
}: CreateServerInput) {
    if (!name) {
        throw new Error("Server Instance Name Is Required!");
    }

    if (!version) {
        throw new Error("Server Version Is Required!");
    }

    if (!loader) {
        throw new Error("Loader Type Is Required!");
    }

    if (!ramGb) {
        throw new Error("Invalid RAM Allocation");
    }

    const res = await invoke('create_server', {
        name,
        version,
        loader,
        ramGb
    });

    console.log(res);
}
