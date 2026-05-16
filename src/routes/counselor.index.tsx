import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useDB } from "@/lib/store";
import { Globe2, Building2, BookOpen, UserSearch, Users } from "lucide-react";

export const Route = createFileRoute("/counselor/")({ component: Page });

function Page() {
  const db = useDB();
  return (
    <>
      <PageHeader title="Welcome back" description="Find the right program for your students using the team knowledge base." />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <Stat icon={<Globe2 className="h-4 w-4" />} label="Countries" value={db.countries.length} />
        <Stat icon={<Building2 className="h-4 w-4" />} label="Universities" value={db.universities.length} />
        <Stat icon={<BookOpen className="h-4 w-4" />} label="Programs" value={db.programs.length} />
        <Stat icon={<Users className="h-4 w-4" />} label="Saved students" value={db.students.length} />
      </div>
      <div className="grid md:grid-cols-2 gap-5">
        <Card className="p-6">
          <h3 className="font-semibold text-foreground mb-1">Match a student</h3>
          <p className="text-sm text-muted-foreground mb-4">Enter what you know — even partial info — and get program suggestions.</p>
          <Button asChild><Link to="/counselor/matcher"><UserSearch className="h-4 w-4 mr-1" /> Open Student Matcher</Link></Button>
        </Card>
        <Card className="p-6">
          <h3 className="font-semibold text-foreground mb-1">Browse Knowledge Base</h3>
          <p className="text-sm text-muted-foreground mb-4">Explore countries, universities and programs added by the admin team.</p>
          <Button asChild variant="secondary"><Link to="/counselor/knowledge"><BookOpen className="h-4 w-4 mr-1" /> Open Knowledge Base</Link></Button>
        </Card>
      </div>
    </>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">{icon}{label}</div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
    </Card>
  );
}