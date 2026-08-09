import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { HeartPulse, Loader2, Stethoscope } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AuthLayout } from "@/components/auth/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { API_BASE_URL, type Role } from "@/lib/api";
import { dashboardPathFor, useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create an account — MediNova" },
      {
        name: "description",
        content:
          "Register as a patient, doctor or hospital admin on MediNova and start managing care in minutes.",
      },
      { property: "og:title", content: "Create an account — MediNova" },
      {
        property: "og:description",
        content: "Register as a patient, doctor or hospital admin on MediNova.",
      },
    ],
  }),
  component: RegisterPage,
});

const ROLES: { role: Role; label: string; blurb: string; icon: typeof HeartPulse }[] = [
  { role: "Patient", label: "Patient", blurb: "Book visits & track care", icon: HeartPulse },
  { role: "Doctor", label: "Doctor", blurb: "Run your daily queue", icon: Stethoscope },
];

interface Department {
  _id: string;
  departmentName: string;
  description?: string;
}

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

type FormState = Record<string, string>;

const INITIAL: FormState = {
  name: "",
  email: "",
  password: "",
  phone: "",
  dob: "",
  gender: "",
  bloodGroup: "",
  address: "",
  medicalHistory: "",
  department: "",
  specialization: "",
  qualification: "",
  experience: "",
  consultationFee: "",
  shiftStart: "",
  shiftEnd: "",
};

function Field({
  id,
  label,
  children,
  className,
}: {
  id?: string;
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

function RegisterPage() {
  const { register, user, ready } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>("Patient");
  const [form, setForm] = useState<FormState>(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);

  useEffect(() => {
    if (role !== "Doctor") return;
    let cancelled = false;
    setLoadingDepartments(true);
    fetch(`${API_BASE_URL}/api/departments`)
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        setDepartments(json?.data?.departments ?? []);
      })
      .catch(() => {
        if (!cancelled) setDepartments([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingDepartments(false);
      });
    return () => {
      cancelled = true;
    };
  }, [role]);

  useEffect(() => {
    if (ready && user) navigate({ to: dashboardPathFor(user.role), replace: true });
  }, [ready, user, navigate]);

  const set = (key: string) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

  function buildPayload() {
    const base = {
      name: form['name']?.trim(),
      email: form['email']?.trim(),
      password: form['password'],
      phone: form['phone']?.trim(),
      role,
    };
    if (role === "Patient") {
      return {
        ...base,
        dob: form['dob'],
        gender: form['gender'],
        bloodGroup: form['bloodGroup'],
        address: form['address'],
        medicalHistory: form['medicalHistory'],
      };
    }
    if (role === "Doctor") {
      return {
        ...base,
        departmentId: form['department'],
        specialization: form['specialization'],
        qualification: form['qualification'],
        experience: Number(form['experience'] || 0),
        consultationFee: Number(form['consultationFee'] || 0),
        shiftStart: form['shiftStart'],
        shiftEnd: form['shiftEnd'],
      };
    }
    return base;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const created = await register(buildPayload());
      toast.success("Account created — welcome to MediNova");
      navigate({ to: dashboardPathFor(created?.role ?? role), replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout>
      <div className="surface-card p-6 sm:p-8">
        <h1 className="text-2xl font-semibold">Create your account</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Tell us who you are — we'll only ask for what's needed.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-2">
          {ROLES.map((r) => {
            const active = role === r.role;
            return (
              <button
                key={r.role}
                type="button"
                onClick={() => setRole(r.role)}
                className={cn(
                  "rounded-2xl border p-3 text-left transition-all",
                  active
                    ? "border-primary bg-primary-soft shadow-soft"
                    : "border-border hover:border-primary/40 hover:bg-secondary/60",
                )}
              >
                <r.icon className={cn("h-4 w-4", active ? "text-primary" : "text-muted-foreground")} />
                <p className="mt-2 text-sm font-semibold">{r.label}</p>
                <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground">{r.blurb}</p>
              </button>
            );
          })}
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <Field id="name" label="Full name">
            <Input
              id="name"
              required
              placeholder="Ananya Rao"
              value={form['name'] ?? ""}
              onChange={(e) => set("name")(e.target.value)}
              className="h-11 rounded-xl"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="email" label="Email">
              <Input
                id="email"
                type="email"
                required
                placeholder="ananya.rao@gmail.com"
                value={form['email'] ?? ""}
                onChange={(e) => set("email")(e.target.value)}
                className="h-11 rounded-xl"
              />
            </Field>
            <Field id="phone" label="Phone">
              <Input
                id="phone"
                required
                inputMode="tel"
                placeholder="+91 98765 43210"
                value={form['phone'] ?? ""}
                onChange={(e) => set("phone")(e.target.value)}
                className="h-11 rounded-xl"
              />
            </Field>
          </div>

          <Field id="password" label="Password">
            <Input
              id="password"
              type="password"
              required
              minLength={8}
              placeholder="At least 8 characters, with at least one letter and one number."
              value={form['password'] ?? ""}
              onChange={(e) => set("password")(e.target.value)}
              className="h-11 rounded-xl"
            />
            <p className="text-xs text-muted-foreground">
              At least 8 characters, with at least one letter and one number.
            </p>
          </Field>

          {role === "Patient" && (
            <div className="space-y-4 rounded-2xl bg-secondary/50 p-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="dob" label="Date of birth">
                  <Input
                    id="dob"
                    type="date"
                    value={form['dob'] ?? ""}
                    onChange={(e) => set("dob")(e.target.value)}
                    className="h-11 rounded-xl bg-background"
                  />
                </Field>
                <Field label="Gender">
                  <Select value={form['gender'] ?? ""} onValueChange={set("gender")}>
                    <SelectTrigger className="h-11 rounded-xl bg-background">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {["Female", "Male", "Other"].map((g) => (
                        <SelectItem key={g} value={g}>
                          {g}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Blood group">
                  <Select value={form['bloodGroup'] ?? ""} onValueChange={set("bloodGroup")}>
                    <SelectTrigger className="h-11 rounded-xl bg-background">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {BLOOD_GROUPS.map((b) => (
                        <SelectItem key={b} value={b}>
                          {b}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field id="address" label="Address">
                  <Input
                    id="address"
                    placeholder="12, Nandi Durga Rd, Bengaluru"
                    value={form['address'] ?? ""}
                    onChange={(e) => set("address")(e.target.value)}
                    className="h-11 rounded-xl bg-background"
                  />
                </Field>
              </div>
              <Field id="medicalHistory" label="Medical history (optional)">
                <Textarea
                  id="medicalHistory"
                  rows={3}
                  placeholder="Asthma since 2018, no known drug allergies…"
                  value={form['medicalHistory'] ?? ""}
                  onChange={(e) => set("medicalHistory")(e.target.value)}
                  className="rounded-xl bg-background"
                />
              </Field>
            </div>
          )}

          {role === "Doctor" && (
            <div className="space-y-4 rounded-2xl bg-secondary/50 p-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Department">
                  <Select value={form['department'] ?? ""} onValueChange={set("department")}>
                    <SelectTrigger className="h-11 rounded-xl bg-background">
                      <SelectValue
                        placeholder={
                          loadingDepartments
                            ? "Loading departments…"
                            : departments.length === 0
                              ? "No departments available — contact admin"
                              : "Select department"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((d) => (
                        <SelectItem key={d._id} value={d._id}>
                          {d.departmentName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!loadingDepartments && departments.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      No departments available — contact admin
                    </p>
                  )}
                </Field>
                <Field id="specialization" label="Specialization">
                  <Input
                    id="specialization"
                    placeholder="Interventional Cardiology"
                    value={form['specialization'] ?? ""}
                    onChange={(e) => set("specialization")(e.target.value)}
                    className="h-11 rounded-xl bg-background"
                  />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="qualification" label="Qualification">
                  <Input
                    id="qualification"
                    placeholder="MBBS, MD"
                    value={form['qualification'] ?? ""}
                    onChange={(e) => set("qualification")(e.target.value)}
                    className="h-11 rounded-xl bg-background"
                  />
                </Field>
                <Field id="experience" label="Experience (years)">
                  <Input
                    id="experience"
                    type="number"
                    min={0}
                    placeholder="8"
                    value={form['experience'] ?? ""}
                    onChange={(e) => set("experience")(e.target.value)}
                    className="h-11 rounded-xl bg-background"
                  />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field id="consultationFee" label="Fee (₹)">
                  <Input
                    id="consultationFee"
                    type="number"
                    min={0}
                    placeholder="600"
                    value={form['consultationFee'] ?? ""}
                    onChange={(e) => set("consultationFee")(e.target.value)}
                    className="h-11 rounded-xl bg-background"
                  />
                </Field>
                <Field id="shiftStart" label="Shift start">
                  <Input
                    id="shiftStart"
                    type="time"
                    value={form['shiftStart'] ?? ""}
                    onChange={(e) => set("shiftStart")(e.target.value)}
                    className="h-11 rounded-xl bg-background"
                  />
                </Field>
                <Field id="shiftEnd" label="Shift end">
                  <Input
                    id="shiftEnd"
                    type="time"
                    value={form['shiftEnd'] ?? ""}
                    onChange={(e) => set("shiftEnd")(e.target.value)}
                    className="h-11 rounded-xl bg-background"
                  />
                </Field>
              </div>
            </div>
          )}

          <Button type="submit" disabled={submitting} className="h-11 w-full rounded-xl text-sm">
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitting ? "Creating account…" : `Create ${role.toLowerCase()} account`}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already registered?{" "}
          <Link to="/" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}