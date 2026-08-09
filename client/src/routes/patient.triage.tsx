import { createFileRoute } from "@tanstack/react-router";
import { Activity } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/shared/page";

export const Route = createFileRoute("/patient/triage")({
  head: () => ({
    meta: [
      { title: "AI Triage — MediNova" },
      { name: "description", content: "Describe your symptoms and get a recommended department and doctor." },
      { property: "og:title", content: "AI Triage — MediNova" },
      { property: "og:description", content: "Describe your symptoms and get a recommended department and doctor." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <div className="space-y-6">
      <PageHeader title="AI Triage" description="Describe your symptoms and get a recommended department and doctor." />
      <EmptyState icon={Activity} title="Symptom entry coming next" description="You'll be able to describe symptoms and receive an AI recommendation." />
    </div>
  );
}
