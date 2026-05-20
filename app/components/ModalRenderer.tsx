import { AnimatePresence } from "framer-motion";
import { useEffect } from "react";

const ModalRenderer = ({ isOpen, onClose, children }: { isOpen: boolean, onClose: () => void, children: React.ReactNode }) => {
    useEffect(() => {
        if (!isOpen) return;

        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            }
        }

        window.addEventListener("keydown", handleKey);

        return () => {
            window.removeEventListener("keydown", handleKey);
        }
    }, [isOpen, onClose]);

    return (
        <AnimatePresence>
            {isOpen && children}
        </AnimatePresence>
    );
}

export default ModalRenderer;
