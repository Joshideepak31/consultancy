import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { useDB, upsertCountry, upsertUniversity, upsertProgram, logAudit } from "@/lib/store";
import { seedCountries, seedUniversities, seedPrograms } from "@/lib/seed";
import { useState } from "react";
import { toast } from "sonner";
import {
  Globe2, Building2, BookOpen, CheckCircle2, AlertTriangle, ImageIcon,
  Plus, Upload, Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const db = useDB();
  const [seeding, setSeeding] = useState(false);
  const isEmpty = db.countries.length === 0 && db.universities.length === 0 && db.programs.length === 0;

  async function seedSample() {
    setSeeding(true);
    try {
      for (const c of seedCountries) upsertCountry(c);
      for (const u of seedUniversities) upsertUniversity(u);
      for (const p of seedPrograms) upsertProgram(p);
      logAudit({ actor: "Admin", action: "create", entity: "Country", entityName: `Seeded ${seedCountries.length} countries, ${seedUniversities.length} universities, ${seedPrograms.length} programs` });
      toast.success("Sample data seeded");
    } finally {
      setSeeding(false);
    }
  }
  const verified = [...db.countries, ...db.universities, ...db.programs].filter((r) => r.status === "Verified").length;
  const needsUpdate = [...db.countries, ...db.universities, ...db.programs].filter((r) => r.status === "Needs Update" || r.status === "Outdated").length;

  const recent = [
    ...db.countries.map((c) => ({ kind: "Country", name: c.name, at: c.updatedAt, status: c.status })),
    ...db.universities.map((u) => ({ kind: "University", name: u.name, at: u.updatedAt, status: u.status })),
    ...db.programs.map((p) => ({ kind: "Program", name: p.name, at: p.updatedAt, status: p.status })),
  ].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 6);

  const dataHealth = [
    { label: "Programs missing fee", value: db.programs.filter((p) => !p.annualTuition && !p.totalTuition).length },
    { label: "Universities missing MOI rule", value: db.universities.filter((u) => u.moi === undefined).length },
    { label: "Countries missing dependent rule", value: db.countries.filter((c) => c.dependentAllowed === undefined).length },
    { label: "Programs missing scholarship info", value: db.programs.filter((p) => p.scholarshipAvailable === undefined).length },
  ];

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Overview of your knowledge base."
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        <Stat icon={<Globe2 className="h-4 w-4" />} label="Countries" value={db.countries.length} />
        <Stat icon={<Building2 className="h-4 w-4" />} label="Universities" value={db.universities.length} />
        <Stat icon={<BookOpen className="h-4 w-4" />} label="Programs" value={db.programs.length} />
        <Stat icon={<CheckCircle2 className="h-4 w-4 text-success" />} label="Verified" value={verified} />
        <Stat icon={<AlertTriangle className="h-4 w-4 text-warning-foreground" />} label="Need attention" value={needsUpdate} />
        <Stat icon={<ImageIcon className="h-4 w-4" />} label="Media uploads" value={0} />
      </div>

      <div className="mb-8">
        <h2 className="text-sm font-semibold text-foreground mb-3">Quick actions</h2>
        <div className="flex flex-wrap gap-2">
          <Button asChild><Link to="/admin/countries"><Plus className="h-4 w-4 mr-1" /> Add Country</Link></Button>
          <Button asChild variant="secondary"><Link to="/admin/universities"><Plus className="h-4 w-4 mr-1" /> Add University</Link></Button>
          <Button asChild variant="secondary"><Link to="/admin/programs"><Plus className="h-4 w-4 mr-1" /> Add Program</Link></Button>
          <Button asChild variant="outline"><Link to="/admin/excel"><Upload className="h-4 w-4 mr-1" /> Upload Excel</Link></Button>
          <Button asChild variant="outline"><Link to="/admin/media"><Upload className="h-4 w-4 mr-1" /> Upload Media</Link></Button>
          {isEmpty && (
            <Button variant="default" onClick={seedSample} disabled={seeding}>
              <Sparkles className="h-4 w-4 mr-1" /> {seeding ? "Seeding…" : "Seed sample data"}
            </Button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h3 className="font-semibold mb-4">Recently updated</h3>
          <ul className="space-y-3">
            {recent.map((r, i) => (
              <li key={i} className="flex items-center justify-between text-sm">
                <div>
                  <span className="text-xs text-muted-foreground mr-2">{r.kind}</span>
                  <span className="text-foreground">{r.name}</span>
                </div>
                <span className="text-xs text-muted-foreground">{new Date(r.at).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-5">
          <h3 className="font-semibold mb-4">Data health</h3>
          <ul className="space-y-3">
            {dataHealth.map((d) => (
              <li key={d.label} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{d.label}</span>
                <span className={`font-medium ${d.value > 0 ? "text-warning-foreground" : "text-success"}`}>
                  {d.value}
                </span>
              </li>
            ))}
          </ul>
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