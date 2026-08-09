import { createFileRoute } from "@tanstack/react-router";
import { BadgeIndianRupee } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/shared/page";

export const Route = createFileRoute("/admin/billing")({
  head: () => ({
    meta: [
      { title: "Billing — MediNova" },
      { name: "description", content: "Bills and payment status across the hospital." },
      { property: "og:title", content: "Billing — MediNova" },
      { property: "og:description", content: "Bills and payment status across the hospital." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <div className="space-y-6">
      <PageHeader title="Billing" description="Bills and payment status across the hospital." />
      <EmptyState icon={BadgeIndianRupee} title="Billing coming next" description="Bill list with payment status filters will appear here." />
    </div>
  );
}
