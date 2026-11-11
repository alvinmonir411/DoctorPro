"use client";

import React from "react";
import { Toaster as Sonner, toast, type ToasterProps } from "sonner";
import { AlertTriangle } from "lucide-react";

function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      position="top-center"
      richColors
      closeButton
      expand
      className="toaster group pointer-events-auto"
      style={{ zIndex: 9999 }}
      toastOptions={{
        classNames: {
          toast:
            "group toast pointer-events-auto group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-xl group-[.toaster]:rounded-2xl group-[.toaster]:px-4 group-[.toaster]:py-3 font-medium text-xs sm:text-sm",
          title: "font-bold text-xs sm:text-sm",
          description: "group-[.toast]:text-muted-foreground text-xs mt-0.5",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
}

interface ConfirmToastOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

/**
 * Displays a central top-center Sonner confirmation toast with Confirm / Cancel buttons
 * instead of blocking native browser confirm() dialogs.
 */
function confirmActionToast({
  title,
  description,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
}: ConfirmToastOptions): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false;
    const settle = (value: boolean, toastId?: string | number) => {
      if (settled) return;
      settled = true;
      if (toastId !== undefined) toast.dismiss(toastId);
      resolve(value);
    };

    toast.custom(
      (t) => (
        <div className="pointer-events-auto w-full max-w-md rounded-2xl border border-rose-200 bg-background p-4 shadow-2xl flex items-start gap-3">
          <div className="h-9 w-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0 space-y-2.5">
            <div>
              <p className="font-bold text-xs sm:text-sm text-foreground">{title}</p>
              {description && (
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  {description}
                </p>
              )}
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => settle(false, t)}
                className="px-3 py-1.5 rounded-lg border border-border bg-muted/50 hover:bg-muted text-foreground text-xs font-semibold transition-colors cursor-pointer"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={() => settle(true, t)}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                {confirmLabel}
              </button>
            </div>
          </div>
        </div>
      ),
      {
        duration: 10000,
        position: "top-center",
        onDismiss: () => settle(false),
        onAutoClose: () => settle(false),
      }
    );
  });
}

export { Toaster, confirmActionToast };
