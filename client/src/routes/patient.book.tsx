import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Stethoscope } from "lucide-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { EmptyState, PageHeader, SectionCard } from "@/components/shared/page";
import { QueryError, QueryLoading } from "@/components/shared/query-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useDepartments } from "@/hooks/use-departments";
import { useApiQuery } from "@/hooks/use-api-query";
import { apiRequest } from "@/lib/api";
import {
  clinicToday,
  bookingLastDay,
  formatWindow,
  type DoctorRecord,
  type Envelope,
  type AppointmentRecord,
} from "@/lib/appointments";

export const Route = createFileRoute("/patient/book")({
  head: () => ({ meta: [{ title: "Book Appointment — MediNova" }] }),
  component: Page,
});
function Page() {
  const [date, setDate] = useState(clinicToday);
  const [department, setDepartment] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const client = useQueryClient();
  const departments = useDepartments();
  const doctors = useApiQuery<Envelope<{ doctors: DoctorRecord[] }>>(
    `/api/doctors?date=${date || clinicToday()}${department ? `&departmentId=${department}` : ""}`,
    true,
  );
  const selected = doctors.data?.data.doctors.find((doctor) => doctor._id === doctorId);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selected?.availability?.available || !date) return;
    setSaving(true);
    try {
      const result = await apiRequest<Envelope<{ appointment: AppointmentRecord }>>(
        "/api/appointments",
        { method: "POST", body: { doctorId, appointmentDate: date, symptoms } },
      );
      toast.success(`Visit booked — queue #${result.data.appointment.queuePosition}`);
      await client.invalidateQueries({ queryKey: ["api"] });
      await navigate({ to: "/patient/appointments" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Booking failed");
      await doctors.refetch();
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="space-y-6">
      <PageHeader
        title="Book an appointment"
        description="Choose a doctor and clinic day. Your arrival window adjusts with the queue."
      />
      <form className="space-y-6" onSubmit={submit}>
        <SectionCard
          title="Choose your visit"
          description="Book up to 30 days ahead. All times are in IST."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="visit-date">Clinic date</Label>
              <Input
                id="visit-date"
                type="date"
                required
                min={clinicToday()}
                max={bookingLastDay()}
                value={date}
                onChange={(event) => {
                  setDate(event.target.value);
                  setDoctorId("");
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <select
                id="department"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={department}
                onChange={(event) => {
                  setDepartment(event.target.value);
                  setDoctorId("");
                }}
              >
                <option value="">All departments</option>
                {departments.data?.data.departments.map((entry) => (
                  <option key={entry._id} value={entry._id}>
                    {entry.departmentName}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {departments.isError && (
            <p role="alert" className="mt-3 text-sm text-destructive">
              Could not load departments. You can still browse all doctors.
            </p>
          )}
        </SectionCard>
        <fieldset className="space-y-3">
          <legend className="mb-3 font-semibold">Choose a doctor</legend>
          {doctors.isLoading ? (
            <QueryLoading />
          ) : doctors.isError ? (
            <QueryError error={doctors.error} retry={() => doctors.refetch()} />
          ) : !doctors.data?.data.doctors.length ? (
            <EmptyState
              icon={Stethoscope}
              title="No doctors found"
              description="Try a different department or contact reception."
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {doctors.data.data.doctors.map((doctor) => (
                <label
                  key={doctor._id}
                  className={`surface-card flex items-start gap-3 p-5 ${doctorId === doctor._id ? "ring-2 ring-primary" : ""} ${doctor.availability?.available ? "cursor-pointer" : "opacity-70"}`}
                >
                  <input
                    className="mt-1 accent-primary"
                    type="radio"
                    name="doctor"
                    value={doctor._id}
                    checked={doctorId === doctor._id}
                    disabled={!doctor.availability?.available || saving}
                    onChange={() => setDoctorId(doctor._id)}
                  />
                  <div className="min-w-0">
                    <p className="font-semibold">{doctor.userId?.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {doctor.specialization} · {doctor.departmentId?.departmentName}
                    </p>
                    <p className="mt-2 text-sm">
                      ₹{doctor.consultationFee.toLocaleString("en-IN")} · {doctor.shiftStart}–
                      {doctor.shiftEnd}
                    </p>
                    {doctor.availability?.available ? (
                      <>
                        <p className="mt-3 text-sm font-medium text-primary">
                          {formatWindow(
                            doctor.availability.nextWindow?.start,
                            doctor.availability.nextWindow?.end,
                          )}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {doctor.availability.remaining} places remaining ·{" "}
                          {doctor.availability.bookedCount} patients queued
                        </p>
                      </>
                    ) : (
                      <p className="mt-3 text-sm text-muted-foreground">
                        {doctor.availability?.reason ?? "Unavailable"}
                      </p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          )}
        </fieldset>
        <SectionCard title="Tell your doctor what brings you in">
          <Label htmlFor="symptoms">Symptoms or reason for visit (optional)</Label>
          <Textarea
            id="symptoms"
            className="mt-2"
            rows={4}
            maxLength={2000}
            value={symptoms}
            onChange={(event) => setSymptoms(event.target.value)}
            placeholder="Describe what you would like to discuss…"
          />
          <p className="mt-3 text-sm text-muted-foreground">
            Arrival windows are estimates. Emergencies or longer consultations may change your
            waiting time.
          </p>
          <Button
            className="mt-5"
            type="submit"
            disabled={saving || !date || !selected?.availability?.available}
          >
            {saving ? "Booking your visit…" : "Book appointment"}
          </Button>
        </SectionCard>
      </form>
    </div>
  );
}
