import { createFileRoute } from "@tanstack/react-router";
import { PhoneCall } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/shared/page";

export const Route = createFileRoute("/admin/follow-up")({
  head: () => ({
    meta: [
      { title: "High-Risk Follow-up — MediNova" },
      { name: "description", content: "Unconfirmed appointments sorted by no-show risk." },
      { property: "og:title", content: "High-Risk Follow-up — MediNova" },
      { property: "og:description", content: "Unconfirmed appointments sorted by no-show risk." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="High-Risk Follow-up"
        description="Unconfirmed appointments sorted by no-show risk."
      />
      <EmptyState
        icon={PhoneCall}
        title="Follow-up list coming next"
        description="Staff call list with confirm outcomes will appear here."
      />
    </div>
  );
}
