import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

export function PageHeader({
  title, description, actions, backTo,
}: { title: string; description?: string; actions?: ReactNode; backTo?: string }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
      <div>
        {backTo && (
          <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
            <Link to={backTo}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Link>
          </Button>
        )}
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

export function EmptyState({
  title, description, action,
}: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="border-2 border-dashed border-border rounded-xl p-10 text-center">
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {description && <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Verified: "bg-success/15 text-success border-success/30",
    Draft: "bg-muted text-muted-foreground border-border",
    "Needs Update": "bg-warning/15 text-warning-foreground border-warning/40",
    Outdated: "bg-destructive/10 text-destructive border-destructive/30",
    Archived: "bg-muted text-muted-foreground border-border opacity-60",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${map[status] ?? "bg-muted"}`}>
      {status}
    </span>
  );
}