import { createFileRoute } from "@tanstack/react-router";
import { Stethoscope } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/shared/page";

export const Route = createFileRoute("/doctor/consultations")({
  head: () => ({
    meta: [
      { title: "Consultations — MediNova" },
      { name: "description", content: "Patient history, diagnosis and prescriptions." },
      { property: "og:title", content: "Consultations — MediNova" },
      { property: "og:description", content: "Patient history, diagnosis and prescriptions." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Consultations"
        description="Patient history, diagnosis and prescriptions."
      />
      <EmptyState
        icon={Stethoscope}
        title="Consultation workspace coming next"
        description="Patient details and prescription writing land here."
      />
    </div>
  );
}
