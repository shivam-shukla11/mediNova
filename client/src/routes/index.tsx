import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AuthLayout } from "@/components/auth/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { dashboardPathFor, useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sign in — MediNova Hospital Management" },
      {
        name: "description",
        content:
          "Sign in to MediNova to manage appointments, AI triage, prescriptions and hospital operations.",
      },
      { property: "og:title", content: "Sign in — MediNova Hospital Management" },
      {
        property: "og:description",
        content: "One calm login for patients, doctors and hospital reception.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { login, user, ready } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showAdminId, setShowAdminId] = useState(false);
  const [adminId, setAdminId] = useState("");

  useEffect(() => {
    if (ready && user) navigate({ to: dashboardPathFor(user.role), replace: true });
  }, [ready, user, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const authed = await login(email.trim(), password, adminId.trim() || undefined);
      toast.success(`Welcome back, ${authed?.name ?? "there"}`);
      navigate({ to: dashboardPathFor(authed?.role), replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to sign in");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout>
      <div className="surface-card p-6 sm:p-8">
        <h1 className="text-2xl font-semibold">Sign in</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          We'll take you to the right place based on your role.
        </p>

        <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              placeholder="ananya.rao@medinova.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 rounded-xl pr-11"
              />
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {!showAdminId ? (
              <button
                type="button"
                onClick={() => setShowAdminId(true)}
                className="text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
              >
                Signing in as hospital admin?
              </button>
            ) : (
              <>
                <Label htmlFor="adminId" className="text-xs text-muted-foreground">
                  Admin ID
                </Label>
                <Input
                  id="adminId"
                  value={adminId}
                  onChange={(e) => setAdminId(e.target.value)}
                  placeholder="Hospital admin ID"
                  className="h-10 rounded-xl text-sm"
                />
              </>
            )}
          </div>

          <Button type="submit" disabled={submitting} className="h-11 w-full rounded-xl text-sm">
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          New to MediNova?{" "}
          <Link to="/register" className="font-medium text-primary hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
