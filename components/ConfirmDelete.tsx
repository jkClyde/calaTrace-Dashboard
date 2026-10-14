"use client";

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// Put this INSIDE a <form action={...}>. The first button opens a popup;
// the popup's confirm button submits the surrounding form.
export default function ConfirmDelete({
    title,
    description,
    triggerLabel = "Delete…",
    confirmLabel = "Delete",
}: {
    title: string;
    description?: string;
    triggerLabel?: string;
    confirmLabel?: string;
}) {
    const [open, setOpen] = useState(false);
    const { pending } = useFormStatus();

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && !pending && setOpen(false);
        document.addEventListener("keydown", onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = prev;
        };
    }, [open, pending]);

    return (
        <>
            <Button type="button" variant="outline" size="sm" className="text-destructive" onClick={() => setOpen(true)}>
                {triggerLabel}
            </Button>

            {open && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                    onClick={() => !pending && setOpen(false)}
                >
                    <div
                        role="alertdialog"
                        aria-modal="true"
                        className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                            <AlertTriangle size={18} />
                        </div>
                        <h2 className="text-base font-semibold text-foreground">{title}</h2>
                        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
                        <div className="mt-5 flex justify-end gap-2">
                            <Button type="button" variant="outline" size="sm" disabled={pending} onClick={() => setOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" variant="destructive" size="sm" disabled={pending} className="gap-2">
                                {pending && <Loader2 size={14} className="animate-spin" />}
                                {pending ? "Deleting…" : confirmLabel}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}