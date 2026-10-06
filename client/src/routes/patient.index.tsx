import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, SectionCard } from "@/components/shared/page";
import { AppointmentList } from "@/components/shared/appointment-list";
import { QueryError, QueryLoading } from "@/components/shared/query-state";
import { Button } from "@/components/ui/button";
import { useApiQuery } from "@/hooks/use-api-query";
import { useAuth } from "@/lib/auth";
import type { Envelope, AppointmentList as VisitList } from "@/lib/appointments";
export const Route = createFileRoute("/patient/")({
  head: () => ({ meta: [{ title: "Your Care — MediNova" }] }),
  component: Page,
});
function Page() {
  const { user } = useAuth();
  const visits = useApiQuery<Envelope<VisitList>>("/api/appointments/my?upcoming=true", true);
  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${user?.name ?? "patient"}`}
        description="Your next visits and current arrival estimates."
        action={
          <Button asChild>
            <Link to="/patient/book">Book a visit</Link>
          </Button>
        }
      />
      {visits.isLoading ? (
        <QueryLoading />
      ) : visits.isError ? (
        <QueryError error={visits.error} retry={() => visits.refetch()} />
      ) : (
        <>
          <SectionCard title="Upcoming appointments">
            <p className="text-3xl font-semibold">{visits.data?.data.total ?? 0}</p>
          </SectionCard>
          <AppointmentList
            mode="patient"
            appointments={visits.data?.data.appointments.slice(0, 3) ?? []}
          />
          <Button variant="outline" asChild>
            <Link to="/patient/appointments">View all appointments</Link>
          </Button>
        </>
      )}
    </div>
  );
}
