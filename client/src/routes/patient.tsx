import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";

export const Route = createFileRoute("/patient")({
  component: () => (
    <AppShell role="Patient">
      <Outlet />
    </AppShell>
  ),
});
