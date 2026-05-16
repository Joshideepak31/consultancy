import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2, Copy, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader, StatusBadge } from "@/components/page-header";
import { CountryForm } from "@/components/forms/country-form";
import { useDB, upsertCountry, deleteCountry, id as makeId } from "@/lib/store";
import type { Country } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/countries/")({
  component: AdminCountries,
});

function AdminCountries() {
  const db = useDB();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Country | null>(null);
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return db.countries
      .filter((c) => !ql || c.name.toLowerCase().includes(ql))
      .slice()
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [db.countries, q]);

  const counts = (countryId: string) => ({
    unis: db.universities.filter((u) => u.countryId === countryId).length,
    progs: db.programs.filter((p) => db.universities.find((u) => u.id === p.universityId)?.countryId === countryId).length,
  });

  const onSave = (c: Country) => {
    upsertCountry(c);
    setOpen(false); setEditing(null);
    toast.success(`Country "${c.name}" saved.`);
  };

  return (
    <>
      <PageHeader
        title="Countries"
        description="Manage country-level study rules, visa requirements and dependent policies."
        actions={
          <Button onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" /> Add Country
          </Button>
        }
      />

      <Card className="p-4 mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search country..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </Card>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Country</TableHead>
              <TableHead>Currency</TableHead>
              <TableHead>Living cost</TableHead>
              <TableHead>Dependents</TableHead>
              <TableHead>PSW</TableHead>
              <TableHead className="text-right">Univs</TableHead>
              <TableHead className="text-right">Programs</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((c) => {
              const k = counts(c.id);
              return (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">
                    <Link
                      to="/admin/countries/$countryId"
                      params={{ countryId: c.id }}
                      className="inline-flex items-center hover:underline text-primary"
                    >
                      <span className="mr-2">{c.flag}</span>{c.name}
                      <ChevronRight className="h-3.5 w-3.5 ml-1 opacity-60" />
                    </Link>
                  </TableCell>
                  <TableCell>{c.currency}</TableCell>
                  <TableCell>{c.avgLivingCost ? c.avgLivingCost.toLocaleString() : "—"}</TableCell>
                  <TableCell>{c.dependentAllowed === undefined ? "—" : c.dependentAllowed ? "Yes" : "No"}</TableCell>
                  <TableCell>{c.pswDuration ?? "—"}</TableCell>
                  <TableCell className="text-right">{k.unis}</TableCell>
                  <TableCell className="text-right">{k.progs}</TableCell>
                  <TableCell>{new Date(c.updatedAt).toLocaleDateString()}</TableCell>
                  <TableCell><StatusBadge status={c.status} /></TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => { setEditing(c); setOpen(true); }} title="Edit">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => upsertCountry({ ...c, id: makeId(), name: c.name + " (copy)", status: "Draft" })} title="Duplicate">
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => { if (confirm("Delete country?")) deleteCountry(c.id); }} title="Delete">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
            {rows.length === 0 && (
              <TableRow><TableCell colSpan={10} className="text-center py-10 text-muted-foreground">No countries match your search.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Sheet open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editing ? `Edit ${editing.name || "country"}` : "Add country"}</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <CountryForm initial={editing} onSave={onSave} onCancel={() => { setOpen(false); setEditing(null); }} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}