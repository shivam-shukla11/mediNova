import { createFileRoute } from "@tanstack/react-router";
import { VisitsPage } from "@/components/shared/visits-page";
export const Route = createFileRoute("/patient/appointments")({
  head: () => ({ meta: [{ title: "My Appointments — MediNova" }] }),
  component: () => <VisitsPage mode="patient" />,
});
