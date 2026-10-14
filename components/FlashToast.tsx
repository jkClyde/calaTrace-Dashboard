"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2, X } from "lucide-react";

// Shows a toast when a page is opened with ?saved=... or ?error=... (set by the
// server actions after they redirect), then removes those params from the URL
// so a refresh doesn't show the message again.

type Toast = { id: number; kind: "success" | "error"; message: string };

const DURATION = { success: 4000, error: 7000 };

export default function FlashToast() {
    const params = useSearchParams();
    const pathname = usePathname();
    const router = useRouter();
    const [toast, setToast] = useState<Toast | null>(null);
    const [visible, setVisible] = useState(false);

    // 1. Pick the message out of the URL, then clean the URL.
    useEffect(() => {
        const error = params.get("error");
        const saved = params.get("saved");
        const message = error ?? saved;
        if (!message) return;

        setToast({ id: Date.now(), kind: error ? "error" : "success", message });
        requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));

        const next = new URLSearchParams(params.toString());
        next.delete("error");
        next.delete("saved");
        const qs = next.toString();
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }, [params, pathname, router]);

    // 2. Auto-dismiss.
    useEffect(() => {
        if (!toast) return;
        const hide = setTimeout(() => setVisible(false), DURATION[toast.kind]);
        const clear = setTimeout(() => setToast(null), DURATION[toast.kind] + 350);
        return () => {
            clearTimeout(hide);
            clearTimeout(clear);
        };
    }, [toast]);

    function dismiss() {
        setVisible(false);
        setTimeout(() => setToast(null), 300);
    }

    if (!toast) return null;
    const isError = toast.kind === "error";

    return (
        <>
            <style>{`
        @keyframes flash-toast-shrink { from { width: 100%; } to { width: 0%; } }
        @media (prefers-reduced-motion: reduce) {
          .flash-toast { transition: none !important; }
          .flash-toast-bar { animation: none !important; }
        }
      `}</style>
            <div
                role={isError ? "alert" : "status"}
                aria-live={isError ? "assertive" : "polite"}
                className={`flash-toast fixed left-4 right-4 top-28 z-50 lg:top-20 overflow-hidden rounded-xl border bg-card shadow-lg transition-all duration-300 ease-out sm:left-auto sm:w-96 ${isError ? "border-destructive/40" : "border-emerald-500/40"
                    } ${visible ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-3 opacity-0"}`}
            >
                <div className="flex items-start gap-3 p-4">
                    <div
                        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${isError ? "bg-destructive/15 text-destructive" : "bg-emerald-500/15 text-emerald-600"
                            }`}
                    >
                        {isError ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-foreground">{isError ? "Something went wrong" : "Done"}</div>
                        <div className="mt-0.5 text-sm text-muted-foreground">{toast.message}</div>
                    </div>
                    <button
                        type="button"
                        onClick={dismiss}
                        aria-label="Dismiss"
                        className="rounded-md p-1 text-muted-foreground transition hover:bg-accent hover:text-foreground"
                    >
                        <X size={14} />
                    </button>
                </div>
                <div className="h-1 w-full bg-muted">
                    <div
                        key={toast.id}
                        className={`flash-toast-bar h-full ${isError ? "bg-destructive" : "bg-emerald-500"}`}
                        style={{ animation: `flash-toast-shrink ${DURATION[toast.kind]}ms linear forwards` }}
                    />
                </div>
            </div>
        </>
    );
}