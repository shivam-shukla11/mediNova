import { createFileRoute } from "@tanstack/react-router";
import { LayoutDashboard } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/shared/page";

export const Route = createFileRoute("/doctor/")({
  head: () => ({
    meta: [
      { title: "Today's Queue — MediNova" },
      { name: "description", content: "Patients waiting for you right now." },
      { property: "og:title", content: "Today's Queue — MediNova" },
      { property: "og:description", content: "Patients waiting for you right now." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <div className="space-y-6">
      <PageHeader title="Today's Queue" description="Patients waiting for you right now." />
      <EmptyState icon={LayoutDashboard} title="Queue coming next" description="Your live patient queue will be listed here." />
    </div>
  );
}
