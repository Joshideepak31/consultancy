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
import { UniversityForm } from "@/components/forms/university-form";
import { useDB, upsertUniversity, deleteUniversity } from "@/lib/store";
import type { University } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/universities")({
  component: AdminUnis,
});

function AdminUnis() {
  const db = useDB();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<University | null>(null);
  const [q, setQ] = useState("");
  const [country, setCountry] = useState("__all");

  const rows = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return db.universities
      .filter((u) => !ql || u.name.toLowerCase().includes(ql))
      .filter((u) => country === "__all" || u.countryId === country)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [db.universities, q, country]);

  const programCount = (uid: string) => db.programs.filter((p) => p.universityId === uid).length;
  const countryName = (cid: string) => db.countries.find((c) => c.id === cid)?.name ?? "—";

  const onSave = (u: University) => {
    upsertUniversity(u);
    setOpen(false); setEditing(null);
    toast.success(`University "${u.name}" saved.`);
  };

  return (
    <>
      <PageHeader
        title="Universities"
        description="Capture admission rules, English requirements, fees and process intelligence."
        actions={<Button onClick={() => { setEditing(null); setOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Add University</Button>}
      />

      <Card className="p-4 mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-60">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search university..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select value={country} onValueChange={setCountry}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">All countries</SelectItem>
            {db.countries.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </Card>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>University</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>City</TableHead>
              <TableHead>MOI</TableHead>
              <TableHead>IELTS</TableHead>
              <TableHead>Gap</TableHead>
              <TableHead className="text-right">Programs</TableHead>
              <TableHead>Scholarship</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.name}</TableCell>
                <TableCell>{countryName(u.countryId)}</TableCell>
                <TableCell>{u.city ?? "—"}</TableCell>
                <TableCell>{u.moi === undefined ? "—" : u.moi ? "Yes" : "No"}</TableCell>
                <TableCell>{u.ieltsOverall ?? "—"}</TableCell>
                <TableCell>{u.gapAccepted === undefined ? "—" : u.gapAccepted ? "Yes" : "No"}</TableCell>
                <TableCell className="text-right">{programCount(u.id)}</TableCell>
                <TableCell>{u.scholarshipAvailable ? `Yes${u.scholarshipAmount ? ` · ${u.scholarshipAmount.toLocaleString()}` : ""}` : "—"}</TableCell>
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
              <TableRow><TableCell colSpan={10} className="text-center py-10 text-muted-foreground">No universities found.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Sheet open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editing ? `Edit ${editing.name || "university"}` : "Add university"}</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <UniversityForm initial={editing} countries={db.countries} onSave={onSave} onCancel={() => { setOpen(false); setEditing(null); }} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}