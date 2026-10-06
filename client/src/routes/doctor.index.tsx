import { createFileRoute } from "@tanstack/react-router";
import { VisitsPage } from "@/components/shared/visits-page";
export const Route = createFileRoute("/doctor/")({
  head: () => ({ meta: [{ title: "Daily Queue — MediNova" }] }),
  component: () => <VisitsPage mode="doctor" />,
});
