import { createFileRoute } from "@tanstack/react-router";
import { CalendarCheck } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/shared/page";

export const Route = createFileRoute("/patient/appointments")({
  head: () => ({
    meta: [
      { title: "My Appointments — MediNova" },
      { name: "description", content: "Past and upcoming visits with confirmation reminders." },
      { property: "og:title", content: "My Appointments — MediNova" },
      { property: "og:description", content: "Past and upcoming visits with confirmation reminders." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <div className="space-y-6">
      <PageHeader title="My Appointments" description="Past and upcoming visits with confirmation reminders." />
      <EmptyState icon={CalendarCheck} title="Appointments coming next" description="Your visit history and pending confirmations will show up here." />
    </div>
  );
}
