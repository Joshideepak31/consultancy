import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader, StatusBadge, EmptyState } from "@/components/page-header";
import { Field, SelectField, TextAreaField, TextField, MultiToggleField } from "@/components/form-fields";
import { useDB, upsertRule, deleteRule, id, logAudit } from "@/lib/store";
import type { Rule, RuleCategory, RuleScope, RecordStatus } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/requirements")({ component: Page });

const SCOPES: RuleScope[] = ["Global", "Country", "University", "Program"];
const CATS: RuleCategory[] = ["GPA", "English", "Gap", "Backlogs", "Finance", "Visa", "Other"];
const STATUSES: RecordStatus[] = ["Draft", "Verified", "Needs Update", "Outdated", "Archived"];

function blank(): Rule {
  return { id: id(), title: "", scope: "Global", category: "GPA", description: "", status: "Draft", updatedAt: new Date().toISOString() };
}

function Page() {
  const db = useDB();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Rule | null>(null);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("__all");

  const rows = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return db.rules
      .filter((r) => !ql || r.title.toLowerCase().includes(ql) || r.description.toLowerCase().includes(ql))
      .filter((r) => cat === "__all" || r.category === cat)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [db.rules, q, cat]);

  const onSave = (r: Rule) => {
    upsertRule(r);
    logAudit({ actor: "Admin", action: editing ? "update" : "create", entity: "Rule", entityName: r.title });
    setOpen(false); setEditing(null);
    toast.success(`Rule "${r.title}" saved.`);
  };

  return (
    <>
      <PageHeader
        title="Requirements Rules"
        description="Cross-cutting eligibility rules — GPA bands, English equivalency, gap limits."
        actions={<Button onClick={() => { setEditing(null); setOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Add Rule</Button>}
      />

      <Card className="p-4 mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-60">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search rules..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select value={cat} onValueChange={setCat}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">All categories</SelectItem>
            {CATS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </Card>

      {rows.length === 0 ? (
        <EmptyState
          title="No rules yet"
          description="Create reusable rules like 'IELTS 6.0 with no band below 5.5' or 'Max 5-year gap accepted with justification' to apply across countries and universities."
          action={<Button onClick={() => { setEditing(null); setOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Create your first rule</Button>}
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Applies to</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.title}</TableCell>
                  <TableCell>{r.scope}</TableCell>
                  <TableCell>{r.category}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{r.appliesTo?.length ? `${r.appliesTo.length} item(s)` : "All"}</TableCell>
                  <TableCell><StatusBadge status={r.status} /></TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => { setEditing(r); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => {
                      if (confirm("Delete rule?")) {
                        deleteRule(r.id);
                        logAudit({ actor: "Admin", action: "delete", entity: "Rule", entityName: r.title });
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
          <SheetHeader>
            <SheetTitle>{editing ? `Edit rule` : "Add rule"}</SheetTitle>
          </SheetHeader>
          <RuleForm initial={editing} onSave={onSave} onCancel={() => { setOpen(false); setEditing(null); }} db={db} />
        </SheetContent>
      </Sheet>
    </>
  );
}

function RuleForm({
  initial, onSave, onCancel, db,
}: { initial: Rule | null; onSave: (r: Rule) => void; onCancel: () => void; db: ReturnType<typeof useDB> }) {
  const [r, setR] = useState<Rule>(initial ?? blank());
  const set = <K extends keyof Rule>(k: K, v: Rule[K]) => setR((p) => ({ ...p, [k]: v }));

  const targetOptions = r.scope === "Country" ? db.countries.map((c) => c.name)
    : r.scope === "University" ? db.universities.map((u) => u.name)
    : r.scope === "Program" ? db.programs.map((p) => p.name)
    : [];

  return (
    <div className="mt-6 space-y-5">
      <div className="grid md:grid-cols-2 gap-4">
        <TextField label="Rule title" value={r.title} onChange={(v) => set("title", v)} />
        <SelectField label="Scope" value={r.scope} onChange={(v) => set("scope", v as RuleScope)}
          options={SCOPES.map((s) => ({ label: s, value: s }))} />
        <SelectField label="Category" value={r.category} onChange={(v) => set("category", v as RuleCategory)}
          options={CATS.map((c) => ({ label: c, value: c }))} />
        <SelectField label="Status" value={r.status} onChange={(v) => set("status", v as RecordStatus)}
          options={STATUSES.map((s) => ({ label: s, value: s }))} />
      </div>
      <TextAreaField label="Description" value={r.description} onChange={(v) => set("description", v)}
        placeholder="e.g. IELTS overall 6.0, no band below 5.5; or PTE 50 equivalent." />
      {targetOptions.length > 0 && (
        <MultiToggleField label={`Apply to specific ${r.scope.toLowerCase()}s (optional)`}
          options={targetOptions} value={r.appliesTo} onChange={(v) => set("appliesTo", v)} />
      )}
      <Field label="">
        <div className="flex items-center justify-end gap-2 border-t pt-4">
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button onClick={() => onSave(r)} disabled={!r.title.trim()}>Save Rule</Button>
        </div>
      </Field>
    </div>
  );
}