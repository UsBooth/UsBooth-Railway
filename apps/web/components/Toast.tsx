"use client";

import { useEffect, useRef, useState } from "react";

export type ToastTone = "success" | "error" | "info" | "warning";

type ToastPayload = {
  message: string;
  tone?: ToastTone;
  duration?: number;
};

const TOAST_EVENT = "usbooth:toast";

export function showToast(
  message: string,
  tone: ToastTone = "success",
  duration = 2200
) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent<ToastPayload>(TOAST_EVENT, {
      detail: { message, tone, duration },
    })
  );
}

export default function ToastHost() {
  const [toast, setToast] = useState<ToastPayload | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    function handleToast(event: Event) {
      const detail = (event as CustomEvent<ToastPayload>).detail;
      if (!detail?.message) return;

      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }

      setToast(detail);

      timerRef.current = window.setTimeout(() => {
        setToast((current) =>
          current === detail ? null : current
        );
        timerRef.current = null;
      }, detail.duration ?? 2200);
    }

    window.addEventListener(TOAST_EVENT, handleToast);

    return () => {
      window.removeEventListener(TOAST_EVENT, handleToast);

      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  if (!toast) return null;

  const icon =
    toast.tone === "error"
      ? "!"
      : toast.tone === "info"
        ? "i"
        : toast.tone === "warning"
          ? "!"
          : "✓";

  return (
    <div
      className={`usbooth-toast usbooth-toast-${toast.tone ?? "success"}`}
      role={
        toast.tone === "error"
          ? "alert"
          : "status"
      }
      aria-live={toast.tone === "error" ? "assertive" : "polite"}
    >
      <span
        className="usbooth-toast-icon"
        aria-hidden="true"
      >
        {icon}
      </span>

      <span className="usbooth-toast-message">
        {toast.message}
      </span>
    </div>
  );
}
