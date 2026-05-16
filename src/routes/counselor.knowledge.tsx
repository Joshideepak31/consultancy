import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { useDB } from "@/lib/store";
import { Globe2, Building2, GraduationCap } from "lucide-react";

export const Route = createFileRoute("/counselor/knowledge")({ component: Page });

function Page() {
  const db = useDB();
  return (
    <>
      <PageHeader title="Knowledge Base" description="Read-only directory of everything the admin team has verified." />
      <div className="grid md:grid-cols-3 gap-4">
        <KbCard to="/counselor/countries" icon={<Globe2 className="h-5 w-5" />} title="Countries" count={db.countries.length}
          description="Visa rules, dependent policy, financial requirements." />
        <KbCard to="/counselor/universities" icon={<Building2 className="h-5 w-5" />} title="Universities" count={db.universities.length}
          description="Admission criteria, MOI rules, scholarship info." />
        <KbCard to="/counselor/programs" icon={<GraduationCap className="h-5 w-5" />} title="Programs" count={db.programs.length}
          description="Tuition, intake, eligibility and final fee." />
      </div>
    </>
  );
}

function KbCard({ to, icon, title, count, description }: { to: string; icon: React.ReactNode; title: string; count: number; description: string }) {
  return (
    <Link to={to}>
      <Card className="p-5 hover:shadow-lg transition-shadow cursor-pointer h-full">
        <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-3">{icon}</div>
        <div className="flex items-baseline gap-2">
          <h3 className="font-semibold text-foreground">{title}</h3>
          <span className="text-xs text-muted-foreground">{count} records</span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </Card>
    </Link>
  );
}