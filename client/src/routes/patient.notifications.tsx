import { createFileRoute } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/shared/page";

export const Route = createFileRoute("/patient/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — MediNova" },
      { name: "description", content: "Reminders, queue updates and doctor leave alerts." },
      { property: "og:title", content: "Notifications — MediNova" },
      { property: "og:description", content: "Reminders, queue updates and doctor leave alerts." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Reminders, queue updates and doctor leave alerts."
      />
      <EmptyState
        icon={Bell}
        title="No notifications yet"
        description="Reminders and queue updates will appear here as they arrive."
      />
    </div>
  );
}
