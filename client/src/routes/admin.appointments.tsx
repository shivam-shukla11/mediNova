import { createFileRoute } from "@tanstack/react-router";
import { ClipboardList } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/shared/page";

export const Route = createFileRoute("/admin/appointments")({
  head: () => ({
    meta: [
      { title: "Manage Appointments — MediNova" },
      { name: "description", content: "All appointments with filters and walk-in registration." },
      { property: "og:title", content: "Manage Appointments — MediNova" },
      { property: "og:description", content: "All appointments with filters and walk-in registration." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <div className="space-y-6">
      <PageHeader title="Manage Appointments" description="All appointments with filters and walk-in registration." />
      <EmptyState icon={ClipboardList} title="Appointment console coming next" description="Filters and walk-in registration will live here." />
    </div>
  );
}
