import { createFileRoute } from "@tanstack/react-router";
import { CalendarOff } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/shared/page";

export const Route = createFileRoute("/doctor/leave")({
  head: () => ({
    meta: [
      { title: "Mark Leave — MediNova" },
      { name: "description", content: "Let reception know when you're unavailable." },
      { property: "og:title", content: "Mark Leave — MediNova" },
      { property: "og:description", content: "Let reception know when you're unavailable." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <div className="space-y-6">
      <PageHeader title="Mark Leave" description="Let reception know when you're unavailable." />
      <EmptyState
        icon={CalendarOff}
        title="Leave form coming next"
        description="A date-range picker with reason will be available here."
      />
    </div>
  );
}
