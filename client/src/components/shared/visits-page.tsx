import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, SectionCard } from "./page";
import { AppointmentList } from "./appointment-list";
import { QueryError, QueryLoading } from "./query-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApiQuery } from "@/hooks/use-api-query";
import {
  clinicToday,
  activeStatuses,
  type Envelope,
  type AppointmentList as VisitList,
} from "@/lib/appointments";

export function VisitsPage({ mode }: { mode: "patient" | "doctor" | "admin" }) {
  const [date, setDate] = useState(clinicToday);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const path =
    mode === "patient"
      ? `/api/appointments/my?page=${page}`
      : mode === "doctor"
        ? `/api/appointments/doctor?date=${date || clinicToday()}`
        : `/api/appointments?date=${date || clinicToday()}`;
  const visits = useApiQuery<Envelope<VisitList>>(path, true);
  const entries = visits.data?.data.appointments ?? [];
  const appointments = entries.filter((entry) =>
    `${entry.patientId?.userId?.name ?? ""} ${entry.doctorId?.userId?.name ?? ""}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  if (mode === "doctor")
    appointments.sort(
      (a, b) =>
        Number(!activeStatuses.includes(a.status)) - Number(!activeStatuses.includes(b.status)) ||
        (a.queuePosition ?? 0) - (b.queuePosition ?? 0),
    );
  return (
    <div className="space-y-6">
      <PageHeader
        title={
          mode === "patient"
            ? "My appointments"
            : mode === "doctor"
              ? "Your daily queue"
              : "Manage appointments"
        }
        description={
          mode === "patient"
            ? "Confirm your visit, track your place, or cancel if your plans change."
            : mode === "doctor"
              ? "Patients assigned to you, with check-in status and arrival estimates."
              : "Browse the clinic day and check patients in when they arrive."
        }
        action={
          mode === "patient" ? (
            <Button asChild>
              <Link to="/patient/book">Book a visit</Link>
            </Button>
          ) : undefined
        }
      />
      {mode !== "patient" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="queue-date">Clinic day</Label>
            <Input
              id="queue-date"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </div>
          {mode === "admin" && (
            <div className="space-y-2">
              <Label htmlFor="visit-search">Find patient or doctor</Label>
              <Input
                id="visit-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name"
              />
            </div>
          )}
        </div>
      )}
      {mode === "doctor" && visits.data && (
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            [
              "Awaiting visit",
              entries.filter((entry) => activeStatuses.includes(entry.status)).length,
            ],
            [
              "Checked in",
              entries.filter((entry) => entry.checkedIn && activeStatuses.includes(entry.status))
                .length,
            ],
            ["Completed", entries.filter((entry) => entry.status === "Completed").length],
          ].map(([title, value]) => (
            <SectionCard key={title} title={String(title)}>
              <p className="text-3xl font-semibold">{value}</p>
            </SectionCard>
          ))}
        </div>
      )}
      <p className="text-sm text-muted-foreground">
        Queue estimates refresh every 20 seconds. Times are shown in IST.
      </p>
      {visits.isLoading ? (
        <QueryLoading />
      ) : visits.isError ? (
        <QueryError error={visits.error} retry={() => visits.refetch()} />
      ) : (
        <AppointmentList mode={mode} appointments={appointments} />
      )}
      {mode === "patient" && (visits.data?.data.total ?? 0) > 25 && (
        <div className="flex items-center justify-between">
          <Button variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)}>
            Previous
          </Button>
          <span className="text-sm">Page {page}</span>
          <Button
            variant="outline"
            disabled={page * 25 >= (visits.data?.data.total ?? 0)}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
