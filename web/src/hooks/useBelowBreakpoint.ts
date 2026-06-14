import { useEffect, useState } from "react";

export function useBelowBreakpoint(px: number): boolean {
  const [below, setBelow] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < px;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia(`(max-width: ${px - 1}px)`);
    const onChange = (e: MediaQueryListEvent) => setBelow(e.matches);
    setBelow(mq.matches);
    if (mq.addEventListener) {
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    }
    mq.addListener(onChange);
    return () => mq.removeListener(onChange);
  }, [px]);

  return below;
}
