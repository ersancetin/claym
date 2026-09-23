import { useEffect, useState } from "react";

export const prefersReducedMotion = () =>
    typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** 0'dan hedef değere yumuşak sayaç; bileşen her yeniden bağlandığında baştan sayar */
export function useCountUp(target: number, duration = 1200, delay = 0) {
    const [value, setValue] = useState(() => (prefersReducedMotion() ? target : 0));

    useEffect(() => {
        if (prefersReducedMotion()) {
            setValue(target);
            return;
        }
        let raf = 0;
        let start = 0;
        const tick = (t: number) => {
            if (!start) start = t + delay;
            const k = Math.min(1, Math.max(0, (t - start) / duration));
            setValue(target * (1 - Math.pow(1 - k, 4)));
            if (k < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [target, duration, delay]);

    return value;
}

/** İlk boyamadan sonra true olur; genişlik/ölçek geçişlerini tetiklemek için */
export function useMounted(delay = 60) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        const id = window.setTimeout(() => setMounted(true), delay);
        return () => window.clearTimeout(id);
    }, [delay]);
    return mounted;
}
