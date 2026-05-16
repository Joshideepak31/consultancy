import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader, StatusBadge } from "@/components/page-header";
import { ProgramForm } from "@/components/forms/program-form";
import { useDB, upsertProgram, deleteProgram, finalFee } from "@/lib/store";
import type { Program } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/countries/$countryId/universities/$universityId")({
  component: UniversityDetail,
});

function UniversityDetail() {
  const { countryId, universityId } = Route.useParams();
  const db = useDB();
  const country = db.countries.find((c) => c.id === countryId);
  const university = db.universities.find((u) => u.id === universityId);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Program | null>(null);
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return db.programs
      .filter((p) => p.universityId === universityId)
      .filter((p) => !ql || p.name.toLowerCase().includes(ql))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [db.programs, q, universityId]);

  if (!university || !country) return <Navigate to="/admin/countries" />;

  const onSave = (p: Program) => {
    upsertProgram({ ...p, universityId });
    setOpen(false); setEditing(null);
    toast.success(`Program "${p.name}" saved.`);
  };

  return (
    <>
      <PageHeader
        backTo={`/admin/countries/${countryId}`}
        title={university.name}
        description={`${country.flag ?? ""} ${country.name}${university.city ? ` · ${university.city}` : ""}`}
        actions={
          <Button onClick={() => { setEditing({ id: "", name: "", universityId, level: "Undergraduate", status: "Draft", updatedAt: new Date().toISOString() } as Program); setOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" /> Add Program
          </Button>
        }
      />

      <Card className="p-4 mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search program..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </Card>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Program</TableHead>
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
            {rows.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">
                  <button
                    type="button"
                    onClick={() => { setEditing(p); setOpen(true); }}
                    className="inline-flex items-center hover:underline text-primary text-left"
                  >
                    {p.name}<ChevronRight className="h-3.5 w-3.5 ml-1 opacity-60" />
                  </button>
                </TableCell>
                <TableCell>{p.level}</TableCell>
                <TableCell>{p.duration ?? "—"}</TableCell>
                <TableCell className="text-right">{p.annualTuition ? `${p.currency ?? ""} ${p.annualTuition.toLocaleString()}` : "—"}</TableCell>
                <TableCell className="text-right">{p.currency ?? ""} {finalFee(p).toLocaleString()}</TableCell>
                <TableCell>{p.ieltsOverall ?? "—"}</TableCell>
                <TableCell><StatusBadge status={p.status} /></TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => { setEditing(p); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => { if (confirm("Delete program?")) deleteProgram(p.id); }}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow><TableCell colSpan={8} className="text-center py-10 text-muted-foreground">No programs yet. Add the first one.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Sheet open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editing && editing.id ? `Edit ${editing.name || "program"}` : "Add program"}</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <ProgramForm initial={editing && editing.id ? editing : null} universities={db.universities} onSave={onSave} onCancel={() => { setOpen(false); setEditing(null); }} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}