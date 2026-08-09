import { createFileRoute } from "@tanstack/react-router";
import { LayoutDashboard } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/shared/page";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Hospital Overview — MediNova" },
      { name: "description", content: "Today's key numbers at a glance." },
      { property: "og:title", content: "Hospital Overview — MediNova" },
      { property: "og:description", content: "Today's key numbers at a glance." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <div className="space-y-6">
      <PageHeader title="Hospital Overview" description="Today's key numbers at a glance." />
      <EmptyState icon={LayoutDashboard} title="Analytics coming next" description="Appointments today, revenue and doctor utilisation will show here." />
    </div>
  );
}
