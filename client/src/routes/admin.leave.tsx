import { createFileRoute } from "@tanstack/react-router";
import { CalendarOff } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/shared/page";

export const Route = createFileRoute("/admin/leave")({
  head: () => ({
    meta: [
      { title: "Doctor Leave Management — MediNova" },
      { name: "description", content: "Mark a doctor on leave and preview affected patients." },
      { property: "og:title", content: "Doctor Leave Management — MediNova" },
      {
        property: "og:description",
        content: "Mark a doctor on leave and preview affected patients.",
      },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Doctor Leave Management"
        description="Mark a doctor on leave and preview affected patients."
      />
      <EmptyState
        icon={CalendarOff}
        title="Leave management coming next"
        description="Leave form with impact preview lands here."
      />
    </div>
  );
}
