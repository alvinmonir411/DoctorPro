import React from "react";
import { Badge } from "@/components/ui/badge";

const STATUS_CONFIG: Record<string, { label: string; className?: string; variant?: "destructive" | "secondary" }> = {
  CONFIRMED: {
    label: "Confirmed",
    className: "bg-emerald-500 hover:bg-emerald-600 text-white text-[10px]",
  },
  SERVING: {
    label: "Serving Now",
    className: "bg-violet-600 hover:bg-violet-700 text-white text-[10px]",
  },
  COMPLETED: {
    label: "Completed",
    className: "bg-blue-500 hover:bg-blue-600 text-white text-[10px]",
  },
  CANCELLED: {
    label: "Cancelled",
    variant: "destructive",
    className: "text-[10px]",
  },
  PENDING: {
    label: "Pending",
    variant: "secondary",
    className: "bg-amber-100 text-amber-800 text-[10px]",
  },
};

export const APPOINTMENT_STATUS_FILTERS = [
  "ALL",
  "PENDING",
  "CONFIRMED",
  "SERVING",
  "COMPLETED",
  "CANCELLED",
] as const;

export function AppointmentStatusBadge({ status }: { status?: string }) {
  const normalized = (status || "PENDING").toUpperCase();
  const cfg = STATUS_CONFIG[normalized];
  if (!cfg) {
    return (
      <Badge variant="secondary" className="text-[10px]">
        {status || "Unknown"}
      </Badge>
    );
  }
  return (
    <Badge variant={cfg.variant} className={cfg.className}>
      {cfg.label}
    </Badge>
  );
}
