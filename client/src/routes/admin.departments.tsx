import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Building2, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { EmptyState, PageHeader, SectionCard } from "@/components/shared/page";
import { QueryError, QueryLoading } from "@/components/shared/query-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useDepartments } from "@/hooks/use-departments";
import { apiRequest, ApiError } from "@/lib/api";

export const Route = createFileRoute("/admin/departments")({
  head: () => ({ meta: [{ title: "Departments — MediNova" }] }),
  component: Page,
});

function Page() {
  const departments = useDepartments();
  const client = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      await apiRequest("/api/departments", {
        method: "POST",
        body: { departmentName: name.trim(), description: description.trim() },
      });
      setName("");
      setDescription("");
      toast.success("Department created");
      await client.invalidateQueries({ queryKey: ["departments"] });
    } catch (failure) {
      const message =
        failure instanceof ApiError
          ? (Object.values(failure.fieldErrors)[0] ?? failure.message)
          : failure instanceof Error
            ? failure.message
            : "Could not create department";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Departments"
        description="Manage the departments available to doctors and patients."
      />
      <SectionCard
        title="Create a department"
        description="New departments appear in doctor registration and appointment booking."
      >
        <form className="space-y-4" onSubmit={submit}>
          <div className="space-y-2">
            <Label htmlFor="department-name">Department name</Label>
            <Input
              id="department-name"
              required
              minLength={2}
              maxLength={100}
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setError("");
              }}
              placeholder="Psychiatry or Neurology"
              disabled={saving}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="department-description">Description (optional)</Label>
            <Textarea
              id="department-description"
              rows={3}
              maxLength={1000}
              value={description}
              onChange={(event) => {
                setDescription(event.target.value);
                setError("");
              }}
              placeholder="Describe the care offered by this department"
              disabled={saving}
            />
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <Button type="submit" disabled={saving || !name.trim()}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? "Creating department…" : "Create department"}
          </Button>
        </form>
      </SectionCard>
      {departments.isLoading ? (
        <QueryLoading />
      ) : departments.isError ? (
        <QueryError error={departments.error} retry={() => departments.refetch()} />
      ) : !departments.data?.data.departments.length ? (
        <EmptyState
          icon={Building2}
          title="No departments yet"
          description="Create your first department above."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {departments.data.data.departments.map((department) => (
            <article key={department._id} className="surface-card p-5">
              <h2 className="font-semibold">{department.departmentName}</h2>
              {department.description && (
                <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                  {department.description}
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
