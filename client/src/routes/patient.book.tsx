import { createFileRoute } from "@tanstack/react-router";
import { CalendarPlus } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/shared/page";

export const Route = createFileRoute("/patient/book")({
  head: () => ({
    meta: [
      { title: "Book Appointment — MediNova" },
      { name: "description", content: "Pick a doctor and date — you'll get a queue position and arrival window." },
      { property: "og:title", content: "Book Appointment — MediNova" },
      { property: "og:description", content: "Pick a doctor and date — you'll get a queue position and arrival window." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <div className="space-y-6">
      <PageHeader title="Book Appointment" description="Pick a doctor and date — you'll get a queue position and arrival window." />
      <EmptyState icon={CalendarPlus} title="Booking flow coming next" description="Doctor selection, date picker and queue estimate land here." />
    </div>
  );
}
