import { createFileRoute } from "@tanstack/react-router";
import { FileHeart } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/shared/page";

export const Route = createFileRoute("/patient/history")({
  head: () => ({
    meta: [
      { title: "Medical History — MediNova" },
      { name: "description", content: "Prescriptions and bills from your past visits." },
      { property: "og:title", content: "Medical History — MediNova" },
      { property: "og:description", content: "Prescriptions and bills from your past visits." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <div className="space-y-6">
      <PageHeader title="Medical History" description="Prescriptions and bills from your past visits." />
      <EmptyState icon={FileHeart} title="History coming next" description="Downloadable prescriptions and bills will be listed here." />
    </div>
  );
}
