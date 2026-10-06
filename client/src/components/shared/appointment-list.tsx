import { CalendarCheck, Clock, UserRound } from "lucide-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/page";
import { apiRequest } from "@/lib/api";
import {
  activeStatuses,
  appointmentDay,
  clinicToday,
  formatClinicDay,
  formatWindow,
  statusLabel,
  type AppointmentRecord,
} from "@/lib/appointments";

export function AppointmentList({
  appointments,
  mode,
}: {
  appointments: AppointmentRecord[];
  mode: "patient" | "doctor" | "admin";
}) {
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const changeStatus = async (id: string, status: string) => {
    setBusy(id);
    try {
      await apiRequest(`/api/appointments/${id}/status`, { method: "PATCH", body: { status } });
      toast.success(
        status === "CancelledByPatient"
          ? "Appointment cancelled"
          : status === "CheckedIn"
            ? "Patient checked in"
            : "Appointment confirmed",
      );
      setCancelId(null);
      await queryClient.invalidateQueries({ queryKey: ["api"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update appointment");
    } finally {
      setBusy(null);
    }
  };
  if (!appointments.length)
    return (
      <EmptyState
        icon={CalendarCheck}
        title="No appointments yet"
        description={
          mode === "patient"
            ? "Book a visit to see your queue position and arrival estimate here."
            : "Appointments for the selected day will appear here."
        }
      />
    );
  return (
    <div className="space-y-3">
      {appointments.map((appointment) => {
        const day = appointmentDay(appointment);
        const active = activeStatuses.includes(appointment.status);
        const canRespond =
          mode === "patient" &&
          active &&
          !appointment.checkedIn &&
          appointment.status !== "CheckedIn" &&
          day >= clinicToday();
        return (
          <article key={appointment._id} className="surface-card space-y-4 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">
                  {mode === "doctor"
                    ? (appointment.patientId?.userId?.name ?? "Patient unavailable")
                    : (appointment.doctorId?.userId?.name ?? "Doctor unavailable")}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatClinicDay(day)} ·{" "}
                  {appointment.doctorId?.departmentId?.departmentName ?? "Department unavailable"}
                </p>
              </div>
              <Badge
                variant={appointment.status === "CancelledByPatient" ? "secondary" : "outline"}
              >
                {statusLabel(appointment.status)}
              </Badge>
            </div>
            {mode === "admin" && (
              <p className="flex items-center gap-2 text-sm">
                <UserRound className="h-4 w-4" />
                {appointment.patientId?.userId?.name ?? "Patient unavailable"}{" "}
                {appointment.patientId?.userId?.phone && (
                  <span className="text-muted-foreground">
                    · {appointment.patientId.userId.phone}
                  </span>
                )}
              </p>
            )}
            {active && day >= clinicToday() && (
              <div className="flex flex-wrap gap-4 rounded-xl bg-secondary/60 p-3 text-sm">
                <span className="font-medium">Queue #{appointment.queuePosition ?? "—"}</span>
                <span className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  {formatWindow(
                    appointment.estimatedWindowStart,
                    appointment.estimatedWindowEnd,
                  )}{" "}
                  <span className="text-muted-foreground">IST</span>
                </span>
              </div>
            )}
            {mode !== "patient" && appointment.symptoms && (
              <p className="whitespace-pre-wrap break-words text-sm text-muted-foreground">
                {appointment.symptoms}
              </p>
            )}
            {canRespond && (
              <div className="flex flex-wrap gap-2">
                {appointment.status !== "Confirmed" && (
                  <Button
                    size="sm"
                    disabled={busy !== null}
                    onClick={() => changeStatus(appointment._id, "Confirmed")}
                  >
                    Confirm visit
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy !== null}
                  onClick={() => setCancelId(appointment._id)}
                >
                  Cancel visit
                </Button>
              </div>
            )}
            {cancelId === appointment._id && (
              <div className="rounded-xl border border-border p-4">
                <p className="mb-3 text-sm">
                  Cancel this visit? You will lose your place in the queue.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={busy !== null}
                    onClick={() => changeStatus(appointment._id, "CancelledByPatient")}
                  >
                    Yes, cancel
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busy !== null}
                    onClick={() => setCancelId(null)}
                  >
                    Keep visit
                  </Button>
                </div>
              </div>
            )}
            {mode === "admin" && active && !appointment.checkedIn && day === clinicToday() && (
              <Button
                size="sm"
                disabled={busy !== null}
                onClick={() => changeStatus(appointment._id, "CheckedIn")}
              >
                Check patient in
              </Button>
            )}
          </article>
        );
      })}
    </div>
  );
}
