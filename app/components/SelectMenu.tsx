import { AnimatePresence, motion } from "framer-motion";
import { useRef, useState } from "react"

export const SelectMenu = ({
    items,
    setInstanceVersion
}: {
    items: string[] | null
    setInstanceVersion: React.Dispatch<React.SetStateAction<string | null>>
}) => {
    const [selectMenuOpen, setSelectMenuOpen] = useState(false);
    const [selected, setSelected] = useState("Select A Version");

    return (
        <div className="w-full relative">
            <input 
                className="outline-0 border-2 focus:border-amber-500 transition-[border] corner-squircle rounded-[20px] p-2 cursor-pointer w-full" 
                value={selected} 
                readOnly 
                onClick={() => setSelectMenuOpen(!selectMenuOpen)}
            />

            <AnimatePresence>
                {selectMenuOpen && items &&
                    <motion.div 
                        className="w-full max-h-60 overflow-y-scroll corner-l-squircle rounded-l-[20px] bg-cyan-900 absolute mt-2 app-scroll p-2 pr-0"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {items.map(item =>
                            <div key={item} 
                                className="w-full h-10 p-2 hover:bg-gray-900 transition-[background] duration-100 cursor-pointer corner-l-squircle rounded-l-[20px]"
                                onClick={() => {
                                    setSelected(item);
                                    setInstanceVersion(item);
                                    setSelectMenuOpen(false);
                                }}
                            >
                                <span className="cursor-pointer">{item}</span>
                            </div>
                        )}
                    </motion.div>
                }
            </AnimatePresence>
        </div>
    );
}
