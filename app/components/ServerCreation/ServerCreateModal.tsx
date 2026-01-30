import { AnimatePresence, motion } from "framer-motion"
import { useEffect, useState } from "react";
import { SelectMenu } from "../misc/SelectMenu";
import DiscreteSlider from "../misc/Slider";
import { getSupportedVersions } from "@/app/utils/getSupportedVersions";
import { useAtomValue } from "jotai";
import { isMacAtom } from "@/app/atoms";
import { RadioSelect } from "../misc/RadioSelect";
import { IoCloseCircle } from "react-icons/io5";

export type LoaderType = "vanilla" | "fabric" | "forge";
export type SupportedLoadersType = {
    vanilla: boolean;
    fabric: boolean;
    forge: boolean;
}

export const ServerCreateModal = ({ 
    setIsOpen, 
    versions,
}: { 
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>, 
    versions?: string[] | null
}) => {
    const ramMarks = [
        { value: 1, label: '1' },
        { value: 2, label: '2' },
        { value: 4, label: '4' },
        { value: 8, label: '8' },
        { value: 12, label: '12' },
        { value: 16, label: '16' },
    ];

    const isMac = useAtomValue(isMacAtom);
    const [mappedVersions, setMappedVersions] = useState<{ key: string, label: string }[]>();
    const [instanceName, setInstanceName] = useState<string | null>(null);
    const [instanceVersion, setInstanceVersion] = useState<string | null>(null);
    const [selectedLoader, setSelectedLoader] = useState<LoaderType | null>(null);
    const [supportedLoaders, setSupportedLoaders] = useState<SupportedLoadersType | null>(null);
    const [loadingLoaders, setLoadingLoaders] = useState(false);
    const [ramGB, setRamGB] = useState<number>(2);

    useEffect(() => {
        function convertVersionList() {
            const data = versions?.map(ver => ({key: ver, label: ver}));
            setMappedVersions(data);
        }

        convertVersionList();
    }, [versions]);

    getSupportedVersions({
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
                className={`w-110 h-150 bg-gray-800 corner-squircle rounded-[30px] flex flex-col items-center ${isMac && 'rounded-xl relative'}`}
                onClick={(e) => e.stopPropagation()}
                initial={{ y: -10 }}
                animate={{ y: 0 }}
                exit={{ y: -10 }}
                transition={{ duration: 0.2 }}
            >
                <IoCloseCircle 
                    size={30} 
                    className="absolute right-2 top-2 cursor-pointer text-red-500  hover:scale-120 transition-[scale]" 
                    title="Close"
                    onClick={(e) => {
                        e.preventDefault();
                        setIsOpen(false);
                    }} 
                />

                <div className="w-full h-max p-4 pr-2">
                    <span className="text-2xl font-semibold">Create Server</span>
                </div>

                <div className="border-b border-[#fbbf24] w-full" />

                <div className="w-full h-full flex flex-col gap-8 p-4 font-semibold overflow-y-auto">
                    <div className="flex flex-col gap-3">
                        <span className="underline">Instance Name:</span>

                        <input 
                            className="outline-0 border-2 focus:border-[#fbbf24] transition-[border] corner-squircle rounded-[20px] p-2" 
                            value={instanceName ?? ""}
                            onChange={(e) => setInstanceName(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-col gap-3">
                        <span className="underline">Server Version:</span>

                        <SelectMenu items={versions ?? null} setInstanceVersion={setInstanceVersion} />
                    </div>

                    <div className="flex flex-col gap-3">
                        <span className="underline">Server Type:</span>

                        {!instanceVersion && (
                            <span className="text-sm text-gray-400">
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

                        <span className="text-sm text-amber-400">
                            {ramGB <= 3 && "Good for small vanilla servers"}
                            {ramGB === 4 && "Recommended for most servers ⭐"}
                            {ramGB > 4 && "Best for modded servers"}
                        </span>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    )
}
