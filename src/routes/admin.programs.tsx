import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader, StatusBadge } from "@/components/page-header";
import { ProgramForm } from "@/components/forms/program-form";
import { useDB, upsertProgram, deleteProgram, finalFee } from "@/lib/store";
import type { Program } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/programs")({
  component: AdminPrograms,
});

function AdminPrograms() {
  const db = useDB();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Program | null>(null);
  const [q, setQ] = useState("");
  const [country, setCountry] = useState("__all");
  const [level, setLevel] = useState("__all");

  const uni = (uid: string) => db.universities.find((u) => u.id === uid);
  const cty = (uid: string) => {
    const u = uni(uid);
    return u ? db.countries.find((c) => c.id === u.countryId) : undefined;
  };

  const rows = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return db.programs
      .filter((p) => !ql || p.name.toLowerCase().includes(ql))
      .filter((p) => country === "__all" || cty(p.universityId)?.id === country)
      .filter((p) => level === "__all" || p.level === level)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db.programs, q, country, level]);

  const onSave = (p: Program) => {
    upsertProgram(p);
    setOpen(false); setEditing(null);
    toast.success(`Program "${p.name}" saved.`);
  };

  return (
    <>
      <PageHeader
        title="Programs / Courses"
        description="Per-program detail with intake, fees, scholarship and eligibility."
        actions={<Button onClick={() => { setEditing(null); setOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Add Program</Button>}
      />

      <Card className="p-4 mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-60">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search program..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select value={country} onValueChange={setCountry}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">All countries</SelectItem>
            {db.countries.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={level} onValueChange={setLevel}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">All levels</SelectItem>
            {["Foundation", "Diploma", "Undergraduate", "International Year One", "Postgraduate", "MBA", "PhD"].map((l) => (
              <SelectItem key={l} value={l}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Card>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Program</TableHead>
              <TableHead>University</TableHead>
              <TableHead>Country</TableHead>
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
            {rows.map((p) => {
              const u = uni(p.universityId); const c = cty(p.universityId);
              return (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>{u?.name ?? "—"}</TableCell>
                  <TableCell>{c?.name ?? "—"}</TableCell>
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
              );
            })}
            {rows.length === 0 && (
              <TableRow><TableCell colSpan={10} className="text-center py-10 text-muted-foreground">No programs found.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Sheet open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editing ? `Edit ${editing.name || "program"}` : "Add program"}</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <ProgramForm initial={editing} universities={db.universities} onSave={onSave} onCancel={() => { setOpen(false); setEditing(null); }} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}