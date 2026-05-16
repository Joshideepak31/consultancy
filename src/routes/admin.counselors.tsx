import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Pencil, Trash2, UserCheck, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader, EmptyState } from "@/components/page-header";
import { Field, MultiToggleField, SelectField, TextField } from "@/components/form-fields";
import { useDB, upsertCounselor, deleteCounselor, id, logAudit } from "@/lib/store";
import type { Counselor } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/counselors")({ component: Page });

function blank(): Counselor {
  return { id: id(), name: "", email: "", role: "Counselor", active: true, joinedAt: new Date().toISOString() };
}

function Page() {
  const db = useDB();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Counselor | null>(null);

  const onSave = (c: Counselor) => {
    upsertCounselor(c);
    logAudit({ actor: "Admin", action: editing ? "update" : "create", entity: "Counselor", entityName: c.name });
    setOpen(false); setEditing(null);
    toast.success(`Counselor "${c.name}" saved.`);
  };

  return (
    <>
      <PageHeader
        title="Counselors"
        description="Invite and manage counselor accounts. Real authentication will be enabled with Lovable Cloud."
        actions={<Button onClick={() => { setEditing(null); setOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Add Counselor</Button>}
      />

      {db.counselors.length === 0 ? (
        <EmptyState title="No counselors added yet" description="Add team members and assign country specialisations."
          action={<Button onClick={() => { setEditing(null); setOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Add counselor</Button>} />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Countries</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {db.counselors.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.email}</TableCell>
                  <TableCell>{c.role}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{c.countries?.length ? c.countries.join(", ") : "—"}</TableCell>
                  <TableCell>
                    {c.active
                      ? <span className="inline-flex items-center gap-1 text-xs text-success"><UserCheck className="h-3.5 w-3.5" /> Active</span>
                      : <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><UserX className="h-3.5 w-3.5" /> Inactive</span>}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(c.joinedAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => { setEditing(c); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => {
                      if (confirm("Delete counselor?")) {
                        deleteCounselor(c.id);
                        logAudit({ actor: "Admin", action: "delete", entity: "Counselor", entityName: c.name });
                      }
                    }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Sheet open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader><SheetTitle>{editing ? `Edit ${editing.name || "counselor"}` : "Add counselor"}</SheetTitle></SheetHeader>
          <CForm initial={editing} db={db} onSave={onSave} onCancel={() => { setOpen(false); setEditing(null); }} />
        </SheetContent>
      </Sheet>
    </>
  );
}

function CForm({
  initial, db, onSave, onCancel,
}: { initial: Counselor | null; db: ReturnType<typeof useDB>; onSave: (c: Counselor) => void; onCancel: () => void }) {
  const [c, setC] = useState<Counselor>(initial ?? blank());
  const set = <K extends keyof Counselor>(k: K, v: Counselor[K]) => setC((p) => ({ ...p, [k]: v }));
  return (
    <div className="mt-6 space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <TextField label="Full name" value={c.name} onChange={(v) => set("name", v)} />
        <TextField label="Email" value={c.email} onChange={(v) => set("email", v)} type="email" />
        <TextField label="Phone" value={c.phone ?? ""} onChange={(v) => set("phone", v)} />
        <SelectField label="Role" value={c.role} onChange={(v) => set("role", v as Counselor["role"])}
          options={[{ label: "Counselor", value: "Counselor" }, { label: "Senior Counselor", value: "Senior Counselor" }, { label: "Lead", value: "Lead" }]} />
      </div>
      <MultiToggleField label="Country specialisations" options={db.countries.map((x) => x.name)} value={c.countries} onChange={(v) => set("countries", v)} />
      <div className="flex items-center justify-between rounded-lg border bg-card px-3 py-2.5">
        <div className="text-sm font-medium">Active</div>
        <input type="checkbox" checked={c.active} onChange={(e) => set("active", e.target.checked)} className="h-4 w-4" />
      </div>
      <Field label="">
        <div className="flex items-center justify-end gap-2 border-t pt-4">
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button onClick={() => onSave(c)} disabled={!c.name.trim() || !c.email.trim()}>Save</Button>
        </div>
      </Field>
    </div>
  );
}
