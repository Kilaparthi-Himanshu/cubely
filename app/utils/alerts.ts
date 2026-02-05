import { toast, Bounce } from "react-toastify";

type SuccesPropsType = {
    message: string;
    onClose?: () => void;
    time?: number;
    hideProgressBar?: boolean;
    className?: string
}

export const notifyError = (message: string) => toast.error(message, {
    position: "top-right",
    autoClose: 5000,
    hideProgressBar: true,
    closeOnClick: true,
    pauseOnHover: false,
    draggable: true,
    progress: undefined,
    theme: "dark",
    transition: Bounce,
    style: {
        background: 'black',
        border: '1px solid rgb(28, 28, 28)',
        width: '300px',
        textAlign: 'center'
    },
    pauseOnFocusLoss: false
});

export const notifySuccess = ({ message, onClose, time, hideProgressBar, className }: SuccesPropsType) => toast.success(message, {
    position: "top-right",
    autoClose: time || 5000,
    hideProgressBar: hideProgressBar ?? true,
    closeOnClick: true,
    pauseOnHover: false,
    draggable: true,
    progress: undefined,
    theme: "dark",
    transition: Bounce,
    style: {
        background: 'black',
        border: '1px solid rgb(28, 28, 28)'
    },
    onClose,
    className: className,
    pauseOnFocusLoss: false
});
