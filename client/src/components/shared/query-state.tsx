import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function QueryLoading() {
  return (
    <div
      role="status"
      className="surface-card flex items-center gap-3 p-6 text-sm text-muted-foreground"
    >
      <Loader2 className="h-4 w-4 animate-spin" /> Loading your data…
    </div>
  );
}

export function QueryError({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <div role="alert" className="surface-card flex flex-wrap items-center gap-3 p-5">
      <AlertCircle className="h-5 w-5 text-destructive" />
      <p className="flex-1 text-sm">{error.message}</p>
      <Button variant="outline" onClick={retry}>
        Try again
      </Button>
    </div>
  );
}
