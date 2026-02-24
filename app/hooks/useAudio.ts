import { useEffect, useState } from "react"

export const useAudio = (url: string) => {
    const [audio] = useState(new Audio(url));
    const [playing, setPlaying] = useState(false);
    const toggle = () => setPlaying(!playing);

    useEffect(() => {
        playing ? audio.play() : audio.pause();
        audio.onended = () => setPlaying(false);
    }, [playing, audio]);

    return [playing, toggle];
}
