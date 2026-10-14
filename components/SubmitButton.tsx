"use client";

import type { ComponentProps } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// Drop-in for <Button type="submit">. Shows a spinner and disables itself
// while the form's server action is running, so it can't be double-clicked.
export default function SubmitButton({
    children,
    pendingText = "Saving…",
    className = "",
    ...props
}: ComponentProps<typeof Button> & { pendingText?: string }) {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending} className={`gap-2 ${className}`} {...props}>
            {pending && <Loader2 size={14} className="animate-spin" />}
            {pending ? pendingText : children}
        </Button>
    );
}