import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Pin, PinOff, Pencil, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader, EmptyState } from "@/components/page-header";
import { Field, SelectField, TextAreaField, TextField } from "@/components/form-fields";
import { useDB, upsertNote, deleteNote, id, logAudit } from "@/lib/store";
import type { Note, NoteCategory } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/notes")({ component: Page });

const CATS: NoteCategory[] = ["Embassy", "Visa Policy", "University Update", "Process", "Escalation", "Other"];

function blank(): Note {
  return { id: id(), title: "", category: "Embassy", body: "", updatedAt: new Date().toISOString() };
}

function Page() {
  const db = useDB();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("__all");

  const notes = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return db.notes
      .filter((n) => !ql || n.title.toLowerCase().includes(ql) || n.body.toLowerCase().includes(ql))
      .filter((n) => cat === "__all" || n.category === cat)
      .sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned) || b.updatedAt.localeCompare(a.updatedAt));
  }, [db.notes, q, cat]);

  const onSave = (n: Note) => {
    upsertNote(n);
    logAudit({ actor: "Admin", action: editing ? "update" : "create", entity: "Note", entityName: n.title });
    setOpen(false); setEditing(null);
    toast.success("Note saved.");
  };

  return (
    <>
      <PageHeader
        title="Knowledge Notes"
        description="Internal notes shared across the team — embassy updates, visa policy changes, escalation playbooks."
        actions={<Button onClick={() => { setEditing(null); setOpen(true); }}><Plus className="h-4 w-4 mr-1" /> New Note</Button>}
      />

      <Card className="p-4 mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-60">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search notes..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select value={cat} onValueChange={setCat}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">All categories</SelectItem>
            {CATS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </Card>

      {notes.length === 0 ? (
        <EmptyState title="No notes yet" description="Capture knowledge once, share with every counselor."
          action={<Button onClick={() => { setEditing(null); setOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Create note</Button>} />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {notes.map((n) => (
            <Card key={n.id} className="p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="text-xs text-muted-foreground">{n.category}</div>
                  <h3 className="font-semibold text-foreground">{n.title}</h3>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => upsertNote({ ...n, pinned: !n.pinned })}>
                    {n.pinned ? <Pin className="h-4 w-4 text-primary" /> : <PinOff className="h-4 w-4 text-muted-foreground" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => { setEditing(n); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => {
                    if (confirm("Delete note?")) {
                      deleteNote(n.id);
                      logAudit({ actor: "Admin", action: "delete", entity: "Note", entityName: n.title });
                    }
                  }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </div>
              <p className="text-sm text-foreground whitespace-pre-wrap line-clamp-6">{n.body}</p>
              <div className="text-xs text-muted-foreground mt-3">{new Date(n.updatedAt).toLocaleString()}</div>
            </Card>
          ))}
        </div>
      )}

      <Sheet open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader><SheetTitle>{editing ? "Edit note" : "New note"}</SheetTitle></SheetHeader>
          <NoteForm initial={editing} db={db} onSave={onSave} onCancel={() => { setOpen(false); setEditing(null); }} />
        </SheetContent>
      </Sheet>
    </>
  );
}

function NoteForm({
  initial, db, onSave, onCancel,
}: { initial: Note | null; db: ReturnType<typeof useDB>; onSave: (n: Note) => void; onCancel: () => void }) {
  const [n, setN] = useState<Note>(initial ?? blank());
  const set = <K extends keyof Note>(k: K, v: Note[K]) => setN((p) => ({ ...p, [k]: v }));
  return (
    <div className="mt-6 space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <TextField label="Title" value={n.title} onChange={(v) => set("title", v)} />
        <SelectField label="Category" value={n.category} onChange={(v) => set("category", v as NoteCategory)}
          options={CATS.map((c) => ({ label: c, value: c }))} />
        <SelectField label="Country (optional)" value={n.countryId ?? ""} onChange={(v) => set("countryId", v)}
          options={[{ label: "—", value: "" }, ...db.countries.map((c) => ({ label: c.name, value: c.id }))]} />
        <SelectField label="University (optional)" value={n.universityId ?? ""} onChange={(v) => set("universityId", v)}
          options={[{ label: "—", value: "" }, ...db.universities.map((u) => ({ label: u.name, value: u.id }))]} />
      </div>
      <TextAreaField label="Body" value={n.body} onChange={(v) => set("body", v)} placeholder="Write the note in detail..." />
      <Field label="">
        <div className="flex items-center justify-end gap-2 border-t pt-4">
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button onClick={() => onSave(n)} disabled={!n.title.trim()}>Save</Button>
        </div>
      </Field>
    </div>
  );
}
