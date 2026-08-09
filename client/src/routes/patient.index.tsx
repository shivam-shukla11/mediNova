import { createFileRoute } from "@tanstack/react-router";
import { LayoutDashboard } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/shared/page";

export const Route = createFileRoute("/patient/")({
  head: () => ({
    meta: [
      { title: "Welcome back — MediNova" },
      { name: "description", content: "Your care overview at a glance." },
      { property: "og:title", content: "Welcome back — MediNova" },
      { property: "og:description", content: "Your care overview at a glance." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <div className="space-y-6">
      <PageHeader title="Welcome back" description="Your care overview at a glance." />
      <EmptyState icon={LayoutDashboard} title="Overview coming next" description="Upcoming appointments, prescriptions, bills and notifications will appear here." />
    </div>
  );
}
