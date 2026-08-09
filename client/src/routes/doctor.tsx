import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";

export const Route = createFileRoute("/doctor")({
  component: () => (
    <AppShell role="Doctor">
      <Outlet />
    </AppShell>
  ),
});
