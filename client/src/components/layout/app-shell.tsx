import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { LogOut, Menu } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Logo } from "@/components/brand/logo";
import { NAV_BY_ROLE, ROLE_LABEL, type NavItem } from "@/components/layout/nav-config";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { dashboardPathFor, useAuth } from "@/lib/auth";
import type { Role } from "@/lib/api";
import { cn } from "@/lib/utils";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");
}

function isItemActive(pathname: string, item: NavItem, items: NavItem[]) {
  const deeper = items.some(
    (i) => i.to !== item.to && i.to.startsWith(item.to) && pathname.startsWith(i.to),
  );
  if (deeper) return false;
  return pathname === item.to || pathname.startsWith(`${item.to}/`);
}

function NavLinks({
  items,
  pathname,
  onNavigate,
}: {
  items: NavItem[];
  pathname: string;
  onNavigate?: (() => void) | undefined;
}) {
  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const active = isItemActive(pathname, item, items);
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
            )}
          >
            <item.icon className="h-[18px] w-[18px] shrink-0" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ role, children }: { role: Role; children: ReactNode }) {
  const { user, ready, logout } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);
  const items = NAV_BY_ROLE[role];
  const bottomItems = items.filter((i) => i.primary).slice(0, 5);

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      navigate({ to: "/", replace: true });
    } else if (user.role !== role) {
      navigate({ to: dashboardPathFor(user.role), replace: true });
    }
  }, [ready, user, role, navigate]);

  if (!ready || !user || user.role !== role) {
    return (
      <div className="min-h-screen bg-background p-6">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    navigate({ to: "/", replace: true });
  };

  const sidebarBody = (onNavigate?: () => void) => (
    <div className="flex h-full flex-col gap-6 p-4">
      <Link to={dashboardPathFor(role)} onClick={onNavigate} className="px-1 py-1">
        <Logo />
      </Link>
      <NavLinks items={items} pathname={pathname} onNavigate={onNavigate} />
      <div className="mt-auto rounded-2xl bg-secondary/70 p-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            {initials(user.name ?? "MN")}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">{ROLE_LABEL[role]}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 w-full justify-start gap-2 text-muted-foreground"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" /> Sign out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-sidebar-border bg-sidebar lg:block">
        {sidebarBody()}
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border/70 bg-background/80 px-4 py-3 backdrop-blur lg:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 bg-sidebar p-0">
              {sidebarBody(() => setMobileOpen(false))}
            </SheetContent>
          </Sheet>
          <Logo />
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:pb-12 lg:pt-10">
          {children}
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-background/95 backdrop-blur lg:hidden">
        <ul className="mx-auto flex max-w-lg items-stretch">
          {bottomItems.map((item) => {
            const active = isItemActive(pathname, item, items);
            return (
              <li key={item.to} className="flex-1">
                <Link
                  to={item.to}
                  className={cn(
                    "flex flex-col items-center gap-1 px-1 py-2.5 text-[11px] font-medium transition-colors",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="truncate">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
