import { createFileRoute } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/shared/page";

export const Route = createFileRoute("/admin/users")({
  head: () => ({
    meta: [
      { title: "Manage Users — MediNova" },
      { name: "description", content: "Patients and doctors registered at MediNova." },
      { property: "og:title", content: "Manage Users — MediNova" },
      { property: "og:description", content: "Patients and doctors registered at MediNova." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <div className="space-y-6">
      <PageHeader title="Manage Users" description="Patients and doctors registered at MediNova." />
      <EmptyState icon={Users} title="User directory coming next" description="Searchable patient and doctor lists land here." />
    </div>
  );
}
