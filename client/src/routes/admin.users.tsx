import { createFileRoute } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { useState } from "react";
import { EmptyState, PageHeader } from "@/components/shared/page";
import { QueryError, QueryLoading } from "@/components/shared/query-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useApiQuery } from "@/hooks/use-api-query";
import type { Envelope } from "@/lib/appointments";
interface Directory {
  users: {
    _id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    status: string;
  }[];
  total: number;
  pageSize: number;
}
export const Route = createFileRoute("/admin/users")({
  head: () => ({ meta: [{ title: "User Directory — MediNova" }] }),
  component: Page,
});
function Page() {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [page, setPage] = useState(1);
  const directory = useApiQuery<Envelope<Directory>>(
    `/api/admin/users?page=${page}&search=${encodeURIComponent(search)}${role ? `&role=${role}` : ""}`,
  );
  return (
    <div className="space-y-6">
      <PageHeader
        title="User directory"
        description="Registered patients, doctors, and hospital administrators."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="user-search">Search name or email</Label>
          <Input
            id="user-search"
            value={search}
            maxLength={100}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="user-role">Role</Label>
          <select
            id="user-role"
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={role}
            onChange={(event) => {
              setRole(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All roles</option>
            {["Patient", "Doctor", "Admin"].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </div>
      </div>
      {directory.isLoading ? (
        <QueryLoading />
      ) : directory.isError ? (
        <QueryError error={directory.error} retry={() => directory.refetch()} />
      ) : !directory.data?.data.users.length ? (
        <EmptyState
          icon={Users}
          title="No matching users"
          description="Try another name, email, or role."
        />
      ) : (
        <>
          <div className="space-y-3">
            {directory.data.data.users.map((user) => (
              <article
                key={user._id}
                className="surface-card flex flex-wrap justify-between gap-3 p-5"
              >
                <div className="min-w-0">
                  <p className="font-semibold">{user.name}</p>
                  <p className="mt-1 break-all text-sm text-muted-foreground">{user.email}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{user.phone}</p>
                </div>
                <div className="flex items-start gap-2">
                  <Badge variant="outline">{user.role}</Badge>
                  <Badge variant="secondary">{user.status}</Badge>
                </div>
              </article>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <Button variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)}>
              Previous
            </Button>
            <span className="text-sm">
              {directory.data.data.total} users · Page {page}
            </span>
            <Button
              variant="outline"
              disabled={page * 25 >= directory.data.data.total}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
