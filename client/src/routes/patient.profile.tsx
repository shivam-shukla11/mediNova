import { createFileRoute } from "@tanstack/react-router";
import { ProfilePage } from "@/components/shared/profile-page";
export const Route = createFileRoute("/patient/profile")({
  head: () => ({ meta: [{ title: "My Profile — MediNova" }] }),
  component: () => <ProfilePage role="Patient" />,
});
