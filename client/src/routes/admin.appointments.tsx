import { createFileRoute } from "@tanstack/react-router";
import { VisitsPage } from "@/components/shared/visits-page";
export const Route = createFileRoute("/admin/appointments")({
  head: () => ({ meta: [{ title: "Manage Appointments — MediNova" }] }),
  component: () => <VisitsPage mode="admin" />,
});
