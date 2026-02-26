import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { SelectMenu } from "../misc/SelectMenu";
import DiscreteSlider from "../misc/Slider";
import { useSupportedLoaders } from "@/app/hooks/useSupportedLoaders";
import { useAtomValue } from "jotai";
import { isMacAtom } from "@/app/atoms";
import { RadioSelect } from "../misc/RadioSelect";
import { IoCloseCircle } from "react-icons/io5";
import { createServer } from "@/app/utils/server/createServer";
import { notifyError, notifySuccess } from "@/app/utils/alerts";
import { isValidInstanceName } from "@/app/utils/regexValidator";
import { LoaderRenderer } from "../misc/Loader";
import { refreshServers } from "@/app/utils/server/refreshServers";

export type LoaderType = "vanilla" | "fabric" | "forge";
export type SupportedLoadersType = {
    vanilla: boolean;
    fabric: boolean;
    forge: boolean;
}

const INSTANCE_NAME_REGEX = /^[a-zA-Z0-9_-]+$/;

export const ramMarks = [
    { value: 1, label: '1' },
    { value: 2, label: '2' },
    { value: 4, label: '4' },
    { value: 8, label: '8' },
    { value: 12, label: '12' },
    { value: 16, label: '16' },
];

export const ServerCreateModal = ({ 
    setIsOpen, 
    versions,
}: { 
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>, 
    versions?: string[] | null
}) => {
    const isMac = useAtomValue(isMacAtom);
    const [mappedVersions, setMappedVersions] = useState<{ key: string, label: string }[]>();
    const [instanceName, setInstanceName] = useState<string | null>(null);
    const [instanceVersion, setInstanceVersion] = useState<string | null>(null);
    const [selectedLoader, setSelectedLoader] = useState<LoaderType | null>(null);
    const [supportedLoaders, setSupportedLoaders] = useState<SupportedLoadersType | null>(null);
    const [loadingLoaders, setLoadingLoaders] = useState(false);
    const [ramGB, setRamGB] = useState<number>(2);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        function convertVersionList() {
            const data = versions?.map(ver => ({key: ver, label: ver}));
            setMappedVersions(data);
        }

        convertVersionList();
    }, [versions]);

    useSupportedLoaders({
        instanceVersion,
        setSelectedLoader,
        setSupportedLoaders,
        setLoadingLoaders
    });

    const loaderOptions = supportedLoaders
    ? ([
        {
            value: "vanilla",
            label: "Vanilla",
            disabled: !supportedLoaders.vanilla,
        },
        {
            value: "fabric",
            label: "Fabric",
            disabled: !supportedLoaders.fabric,
        },
        {
            value: "forge",
            label: "Forge",
            disabled: !supportedLoaders.forge,
        },
        ] as const)
    : [];

    const handleCreateServer = async () => {
        try {
            setLoading(true);

            if (!instanceName) {
                notifyError("Server instance name is required!");
                return;
            }

            if (!isValidInstanceName(INSTANCE_NAME_REGEX, instanceName)) {
                notifyError(
                    "Instance name can only contain letters, numbers, '-' and '_' (no spaces or special characters)"
                );
                return;
            }

            if (!instanceVersion) {
                notifyError("Server version is required!");
                return;
            }

            if (!selectedLoader) {
                notifyError("Loader type is required!");
                return;
            }

            await createServer({
                name: instanceName!,
                version: instanceVersion!,
                loader: selectedLoader!,
                ramGb: ramGB!
            });

            await refreshServers();

            setIsOpen(false);

            notifySuccess({
                message: "Server created successfully!",
                hideProgressBar: false
            });
        } catch (err) {
            notifyError("An error occured while creating the server. Please try again!");
            console.error("Create server failed:", err);
        } finally {
            setLoading(false);
        }
    }

    return (
        <motion.div 
            className='absolute top-0 left-0 size-full bg-black/70 flex items-center justify-center z-205 text-white p-2 font-mono'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            // onClick={(e) => {
            //     e.preventDefault();
            //     setIsOpen(false);
            // }}
        >
            <motion.div 
                className={`w-110 h-max bg-gray-800 corner-squircle rounded-[30px] flex flex-col items-center ${isMac && 'rounded-xl'} relative max-h-[calc(100vh-50px)] overflow-hidden cyberpunk-border cyberpunk-glow cyberpunk:bg-cyber-dark-blue/20 cyberpunk:backdrop-blur-xl cyberpunk:rounded-none cyberpunk:rounded-bl-[28px] cyberpunk:corner-bl-bevel`}
                onClick={(e) => e.stopPropagation()}
                initial={{ y: -10 }}
                animate={{ y: 0 }}
                exit={{ y: -10 }}
                transition={{ duration: 0.2 }}
            >
                {(loadingLoaders || loading) && <LoaderRenderer text="Creating Server..." />}

                <IoCloseCircle 
                    size={30} 
                    className="absolute right-2 top-2 cursor-pointer text-red-500 active:scale-95 transition-[scale]" 
                    title="Close"
                    onClick={(e) => {
                        e.preventDefault();
                        setIsOpen(false);
                    }} 
                />

                <div className="w-full h-max p-4 pr-2 ">
                    <span className="text-2xl font-semibold cyberpunk:bg-red-900 cyberpunk-input cyberpunk:px-3 cyberpunk:py-2">Create Server</span>
                </div>

                <div className="border-b border-amber-400 w-full" />

                <div className="w-full h-full flex flex-col gap-8 p-4 font-semibold overflow-y-auto overflow-x-hidden app-scroll cyberpunk:text-cyber-purple">
                    <div className="flex flex-col gap-3">
                        <span className="underline">Instance Name:</span>

                        <input 
                            className="outline-0 border-2 focus:border-amber-400 transition-[border] corner-squircle rounded-[20px] p-2 cyberpunk:rounded-none cyberpunk:rounded-br-xl cyberpunk:corner-br-bevel cyberpunk:focus:border-cyber-yellow" 
                            value={instanceName ?? ""}
                            onChange={(e) => setInstanceName(e.target.value)}
                        />

                        <span className="text-xs text-gray-400 cyberpunk:text-cyber-green">
                            Allowed: letters, numbers, - and _
                        </span>

                        <span className="text-xs text-amber-400 cyberpunk:text-cyber-blue">
                            Intance name cannot be changed after creation.
                        </span>
                    </div>

                    <div className="flex flex-col gap-3">
                        <span className="underline">Server Version:</span>

                        <SelectMenu 
                            items={versions ?? []} 
                            value={instanceVersion ?? ""} 
                            onChange={setInstanceVersion}
                            placeholder={"Select A Version"}
                        />
                    </div>

                    <div className="flex flex-col gap-3">
                        <span className="underline">Server Type:</span>

                        {!instanceVersion && (
                            <span className="text-sm text-gray-400 cyberpunk:text-cyber-green">
                                Select a version first
                            </span>
                        )}

                        {instanceVersion && loadingLoaders && (
                            <span className="text-sm text-amber-400">
                                Checking available loaders...
                            </span>
                        )}

                        {supportedLoaders && (
                            <RadioSelect<LoaderType>
                                value={selectedLoader}
                                options={loaderOptions}
                                onChange={setSelectedLoader}
                            />
                        )}
                    </div>

                    <div className="flex flex-col gap-3">
                        <span className="underline">RAM Allocated:</span>

                        <div className="w-full px-1">
                            <DiscreteSlider 
                                ariaLabel="Ram Allocation"
                                value={ramGB}
                                step={1}
                                min={1}
                                max={16}
                                marks={ramMarks}
                                unit="GB"
                                onChange={setRamGB}
                            />
                        </div>

                        <span className="text-sm text-amber-400 cyberpunk:text-cyber-blue">
                            {ramGB <= 3 && "Good for small vanilla servers"}
                            {ramGB === 4 && "Recommended for most servers ⭐"}
                            {ramGB > 4 && "Best for modded servers"}
                        </span>
                    </div>

                    <div className="w-full flex justify-end">
                        <button 
                            className="bg-amber-400 px-4 py-2 text-stone-800 corner-squircle rounded-2xl cursor-pointer shadow-xl active:scale-97 active:bg-[#bb8e1e] transition-[scale,background] cyberpunk:bg-cyber-dark-yellow cyberpunk:text-cyber-yellow cyberpunk:rounded-none cyberpunk:rounded-br-xl cyberpunk:corner-br-bevel cyberpunk:rounded-tl-xl cyberpunk:corner-tl-bevel cyberpunk-border cyberpunk-glow"
                            onClick={handleCreateServer}
                        >
                            Create!
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
