import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2, ChevronRight, Building2, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PageHeader, StatusBadge } from "@/components/page-header";
import { UniversityForm } from "@/components/forms/university-form";
import { ProgramForm } from "@/components/forms/program-form";
import { useDB, upsertUniversity, deleteUniversity, upsertProgram, deleteProgram, finalFee } from "@/lib/store";
import type { University, Program } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/countries/$countryId")({
  component: CountryDetail,
});

function CountryDetail() {
  const { countryId } = Route.useParams();
  const db = useDB();
  const country = db.countries.find((c) => c.id === countryId);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<University | null>(null);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"universities" | "courses">("universities");
  const [progOpen, setProgOpen] = useState(false);
  const [progEditing, setProgEditing] = useState<Program | null>(null);
  const [pq, setPq] = useState("");

  const rows = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return db.universities
      .filter((u) => u.countryId === countryId)
      .filter((u) => !ql || u.name.toLowerCase().includes(ql))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [db.universities, q, countryId]);

  const programCount = (uid: string) => db.programs.filter((p) => p.universityId === uid).length;

  const programRows = useMemo(() => {
    const ql = pq.trim().toLowerCase();
    const ids = new Set(db.universities.filter((u) => u.countryId === countryId).map((u) => u.id));
    return db.programs
      .filter((p) => ids.has(p.universityId))
      .filter((p) => !ql || p.name.toLowerCase().includes(ql))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [db.programs, pq, countryId, db.universities]);
  const uniName = (uid: string) => db.universities.find((u) => u.id === uid)?.name ?? "—";

  if (!country) return <Navigate to="/admin/countries" />;

  const onSave = (u: University) => {
    upsertUniversity({ ...u, countryId });
    setOpen(false); setEditing(null);
    toast.success(`University "${u.name}" saved.`);
  };
  const onSaveProgram = (p: Program) => {
    upsertProgram(p);
    setProgOpen(false); setProgEditing(null);
    toast.success(`Program "${p.name}" saved.`);
  };

  return (
    <>
      <PageHeader
        backTo="/admin/countries"
        title={`${country.flag ?? ""} ${country.name}`}
        description="Universities registered under this country."
        actions={
          tab === "universities" ? (
            <Button onClick={() => { setEditing({ id: "", name: "", countryId, status: "Draft", updatedAt: new Date().toISOString() } as University); setOpen(true); }}>
              <Plus className="h-4 w-4 mr-1" /> Add University
            </Button>
          ) : (
            <Button
              disabled={db.universities.filter((u) => u.countryId === countryId).length === 0}
              onClick={() => {
                const firstU = db.universities.find((u) => u.countryId === countryId);
                if (!firstU) return;
                setProgEditing({ id: "", name: "", universityId: firstU.id, level: "Undergraduate", status: "Draft", updatedAt: new Date().toISOString() } as Program);
                setProgOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-1" /> Add Course
            </Button>
          )
        }
      />

      <div className="grid sm:grid-cols-3 gap-3 mb-4">
        <Stat icon={<Building2 className="h-4 w-4" />} label="Universities" value={rows.length} />
        <Stat icon={<GraduationCap className="h-4 w-4" />} label="Total programs" value={rows.reduce((n, u) => n + programCount(u.id), 0)} />
        <Stat label="Currency" value={country.currency || "—"} />
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as "universities" | "courses")} className="w-full">
        <TabsList className="w-full justify-start mb-4">
          <TabsTrigger value="universities"><Building2 className="h-4 w-4 mr-1.5" />Universities</TabsTrigger>
          <TabsTrigger value="courses"><GraduationCap className="h-4 w-4 mr-1.5" />Courses</TabsTrigger>
        </TabsList>

        <TabsContent value="universities" className="mt-0 space-y-4">
          <Card className="p-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search university..." value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
          </Card>
          <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>University</TableHead>
              <TableHead>City</TableHead>
              <TableHead>MOI</TableHead>
              <TableHead>IELTS</TableHead>
              <TableHead className="text-right">Programs</TableHead>
              <TableHead>Scholarship</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">
                  <Link
                    to="/admin/countries/$countryId/universities/$universityId"
                    params={{ countryId, universityId: u.id }}
                    className="inline-flex items-center hover:underline text-primary"
                  >
                    {u.name}<ChevronRight className="h-3.5 w-3.5 ml-1 opacity-60" />
                  </Link>
                </TableCell>
                <TableCell>{u.city ?? "—"}</TableCell>
                <TableCell>{u.moi === undefined ? "—" : u.moi ? "Yes" : "No"}</TableCell>
                <TableCell>{u.ieltsOverall ?? "—"}</TableCell>
                <TableCell className="text-right">{programCount(u.id)}</TableCell>
                <TableCell>{u.scholarshipAvailable ? "Yes" : "—"}</TableCell>
                <TableCell><StatusBadge status={u.status} /></TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => { setEditing(u); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => { if (confirm("Delete university?")) deleteUniversity(u.id); }}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow><TableCell colSpan={8} className="text-center py-10 text-muted-foreground">No universities yet. Add the first one.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
          </Card>
        </TabsContent>

        <TabsContent value="courses" className="mt-0 space-y-4">
          <Card className="p-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search course..." value={pq} onChange={(e) => setPq(e.target.value)} />
            </div>
          </Card>
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead>University</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead className="text-right">Tuition</TableHead>
                  <TableHead className="text-right">Final fee</TableHead>
                  <TableHead>IELTS</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {programRows.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>
                      <Link
                        to="/admin/countries/$countryId/universities/$universityId"
                        params={{ countryId, universityId: p.universityId }}
                        className="hover:underline text-primary"
                      >{uniName(p.universityId)}</Link>
                    </TableCell>
                    <TableCell>{p.level}</TableCell>
                    <TableCell>{p.duration ?? "—"}</TableCell>
                    <TableCell className="text-right">{p.annualTuition ? `${p.currency ?? ""} ${p.annualTuition.toLocaleString()}` : "—"}</TableCell>
                    <TableCell className="text-right">{p.currency ?? ""} {finalFee(p).toLocaleString()}</TableCell>
                    <TableCell>{p.ieltsOverall ?? "—"}</TableCell>
                    <TableCell><StatusBadge status={p.status} /></TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => { setProgEditing(p); setProgOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => { if (confirm("Delete course?")) deleteProgram(p.id); }}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {programRows.length === 0 && (
                  <TableRow><TableCell colSpan={9} className="text-center py-10 text-muted-foreground">No courses yet.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      <Sheet open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editing && editing.id ? `Edit ${editing.name || "university"}` : "Add university"}</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <UniversityForm initial={editing && editing.id ? editing : null} countries={db.countries} onSave={onSave} onCancel={() => { setOpen(false); setEditing(null); }} />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={progOpen} onOpenChange={(v) => { setProgOpen(v); if (!v) setProgEditing(null); }}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{progEditing && progEditing.id ? `Edit ${progEditing.name || "course"}` : "Add course"}</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <ProgramForm
              initial={progEditing && progEditing.id ? progEditing : null}
              universities={db.universities.filter((u) => u.countryId === countryId)}
              onSave={onSaveProgram}
              onCancel={() => { setProgOpen(false); setProgEditing(null); }}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

function Stat({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string | number }) {
  return (
    <Card className="p-4">
      <div className="text-xs text-muted-foreground flex items-center gap-1.5">{icon}{label}</div>
      <div className="text-xl font-semibold mt-1">{value}</div>
    </Card>
  );
}