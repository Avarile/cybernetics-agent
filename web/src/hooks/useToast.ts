import { useCallback, useEffect, useRef, useState } from "react";
import type { ToastState, ToastType } from "@/components/ui/toast";

export function useToast(duration = 3500) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timerRef = useRef<number | null>(null);

  const showToast = useCallback(
    (message: string, type: ToastType) => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
      setToast({ message, type });
      timerRef.current = window.setTimeout(() => {
        setToast(null);
        timerRef.current = null;
      }, duration);
    },
    [duration],
  );

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  return { showToast, toast };
}
