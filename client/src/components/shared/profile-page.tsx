import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader, SectionCard } from "./page";
import { QueryError, QueryLoading } from "./query-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useApiQuery } from "@/hooks/use-api-query";
import { apiRequest } from "@/lib/api";
import type { Envelope } from "@/lib/appointments";

interface Profile {
  userId: { name: string; email: string; phone: string };
  departmentId?: { departmentName: string };
  address?: string;
  medicalHistory?: string;
  bloodGroup?: string;
  specialization?: string;
  qualification?: string;
  experience?: number;
  consultationFee?: number;
  shiftStart?: string;
  shiftEnd?: string;
}

export function ProfilePage({ role }: { role: "Patient" | "Doctor" }) {
  const path = role === "Patient" ? "/api/patients/me" : "/api/doctors/me";
  const query = useApiQuery<Envelope<{ profile: Profile }>>(path);
  return (
    <div className="space-y-6">
      <PageHeader
        title="Your profile"
        description="Keep your information up to date for your next visit."
      />
      {query.isLoading ? (
        <QueryLoading />
      ) : query.isError ? (
        <QueryError error={query.error} retry={() => query.refetch()} />
      ) : (
        query.data && (
          <ProfileForm
            key={`${role}:${query.data.data.profile.userId.email}`}
            profile={query.data.data.profile}
            role={role}
            path={path}
          />
        )
      )}
    </div>
  );
}

function ProfileForm({
  profile,
  role,
  path,
}: {
  profile: Profile;
  role: "Patient" | "Doctor";
  path: string;
}) {
  const client = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, string>>(
    role === "Patient"
      ? {
          address: profile.address ?? "",
          medicalHistory: profile.medicalHistory ?? "",
          bloodGroup: profile.bloodGroup ?? "",
        }
      : {
          specialization: profile.specialization ?? "",
          qualification: profile.qualification ?? "",
          experience: String(profile.experience ?? 0),
        },
  );
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await apiRequest(path, {
        method: "PATCH",
        body: role === "Doctor" ? { ...form, experience: Number(form["experience"]) } : form,
      });
      toast.success("Profile saved");
      await client.invalidateQueries({ queryKey: ["api"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save profile");
    } finally {
      setSaving(false);
    }
  };
  return (
    <>
      <SectionCard title={profile.userId.name}>
        <p className="text-sm text-muted-foreground">
          {profile.userId.email} · {profile.userId.phone}
        </p>
        {role === "Doctor" && (
          <p className="mt-3 text-sm">
            {profile.departmentId?.departmentName} · ₹{profile.consultationFee} ·{" "}
            {profile.shiftStart}–{profile.shiftEnd} IST
          </p>
        )}
      </SectionCard>
      <SectionCard>
        <form className="space-y-4" onSubmit={save}>
          {Object.entries(form).map(([field, value]) => (
            <div key={field} className="space-y-2">
              <Label htmlFor={field}>
                {
                  (
                    {
                      address: "Address",
                      medicalHistory: "Medical history",
                      bloodGroup: "Blood group",
                      specialization: "Specialization",
                      qualification: "Qualification",
                      experience: "Experience (years)",
                    } as Record<string, string>
                  )[field]
                }
              </Label>
              {field === "medicalHistory" ? (
                <Textarea
                  id={field}
                  rows={5}
                  maxLength={4000}
                  value={value}
                  onChange={(event) => setForm({ ...form, [field]: event.target.value })}
                />
              ) : field === "bloodGroup" ? (
                <select
                  id={field}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={value}
                  onChange={(event) => setForm({ ...form, [field]: event.target.value })}
                >
                  {["", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((group) => (
                    <option key={group} value={group}>
                      {group || "Not specified"}
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  id={field}
                  type={field === "experience" ? "number" : "text"}
                  min={field === "experience" ? 0 : undefined}
                  max={field === "experience" ? 80 : undefined}
                  step={field === "experience" ? "0.5" : undefined}
                  maxLength={300}
                  required={role === "Doctor"}
                  value={value}
                  onChange={(event) => setForm({ ...form, [field]: event.target.value })}
                />
              )}
            </div>
          ))}
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save profile"}
          </Button>
        </form>
      </SectionCard>
    </>
  );
}
