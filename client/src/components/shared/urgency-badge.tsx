import { AlertTriangle, ArrowUp, Minus, Siren } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type Urgency = "Low" | "Medium" | "High" | "Emergency";

const URGENCY: Record<Urgency, { icon: LucideIcon; className: string }> = {
  Low: { icon: Minus, className: "bg-urgency-low-soft text-urgency-low" },
  Medium: { icon: ArrowUp, className: "bg-urgency-medium-soft text-urgency-medium" },
  High: { icon: AlertTriangle, className: "bg-urgency-high-soft text-urgency-high" },
  Emergency: {
    icon: Siren,
    className: "bg-urgency-emergency-soft text-urgency-emergency ring-1 ring-urgency-emergency/30",
  },
};

export function UrgencyBadge({ level, className }: { level: Urgency; className?: string }) {
  const { icon: Icon, className: tone } = URGENCY[level];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        tone,
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {level}
    </span>
  );
}

export type AppointmentStatus =
  "Pending" | "Confirmed" | "Cancelled" | "Completed" | "Waiting" | "Checked-in" | "In-progress";

const STATUS_TONE: Record<AppointmentStatus, string> = {
  Pending: "bg-urgency-high-soft text-urgency-high",
  Confirmed: "bg-primary-soft text-primary",
  Cancelled: "bg-muted text-muted-foreground",
  Completed: "bg-urgency-low-soft text-urgency-low",
  Waiting: "bg-muted text-muted-foreground",
  "Checked-in": "bg-primary-soft text-primary",
  "In-progress": "bg-urgency-medium-soft text-urgency-medium",
};

export function StatusBadge({
  status,
  className,
}: {
  status: AppointmentStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        STATUS_TONE[status],
        className,
      )}
    >
      {status}
    </span>
  );
}
