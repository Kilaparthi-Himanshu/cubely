import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react"

type SelectMenuProps<T extends string> = {
  items: readonly T[];
  value: T;
  onChange: (value: T) => void;
  placeholder?: string;
};

export const SelectMenu = ({
    items,
    value,
    onChange,
    placeholder = "Select"
}: {
    items: string[]
    value: string
    onChange: (value: string) => void
    placeholder?: string
}) => {
    const [open, setOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target as Node)
            ) {
                setOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <div className="w-full relative" ref={menuRef}>
            <input 
                className="outline-0 border-2 focus:border-amber-400 transition-[border] corner-squircle rounded-[20px] p-2 cursor-pointer w-full capitalize" 
                value={value || placeholder}
                readOnly 
                onClick={() => setOpen(!open)}
            />

            <AnimatePresence>
                {open && items &&
                    <motion.div 
                        className="w-full max-h-60 overflow-y-auto overflow-x-visible corner-squircle rounded-[20px] bg-cyan-900 absolute mt-2 app-scroll p-2 shadow-2xl z-999"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {items.map(item =>
                            <div key={item} 
                                className="w-full h-10 p-2 hover:bg-gray-900 transition-[background] duration-100 cursor-pointer corner-squircle rounded-[20px]"
                                onClick={() => {
                                    onChange(item);
                                    setOpen(false);
                                }}
                            >
                                <span className="cursor-pointer capitalize">{item}</span>
                            </div>
                        )}
                    </motion.div>
                }
            </AnimatePresence>
        </div>
    );
}
