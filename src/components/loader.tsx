import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function Loader({ label = "Loading…", className }: { label?: string; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground", className)}>
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function FullPageLoader({ label }: { label?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader label={label} />
    </div>
  );
}

export function TopProgressBar() {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-0.5 overflow-hidden bg-primary/10">
      <div className="h-full w-1/3 bg-primary animate-[loader-slide_1s_ease-in-out_infinite]" />
    </div>
  );
}
