import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";

export const Route = createFileRoute("/admin")({
  component: () => (
    <AppShell role="Admin">
      <Outlet />
    </AppShell>
  ),
});
