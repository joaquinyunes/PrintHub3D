"use client";

import { useEffect, useRef } from "react";

/**
 * Ejecuta `fn` cada `intervalMs`, pero:
 *  - no dispara mientras la pestaña está oculta (ahorra requests al backend)
 *  - refresca al volver a la pestaña
 *  - hace una primera llamada inmediata
 */
export function usePolling(fn: () => void, intervalMs = 20000, enabled = true) {
  const saved = useRef(fn);

  useEffect(() => {
    saved.current = fn;
  });

  useEffect(() => {
    if (!enabled) return;

    let timer: ReturnType<typeof setInterval> | null = null;

    const tick = () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      saved.current();
    };

    const start = () => {
      if (timer) return;
      tick();
      timer = setInterval(tick, intervalMs);
    };
    const stop = () => {
      if (timer) clearInterval(timer);
      timer = null;
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") start();
      else stop();
    };

    start();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", tick);

    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", tick);
    };
  }, [intervalMs, enabled]);
}
