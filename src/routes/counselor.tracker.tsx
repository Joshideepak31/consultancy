import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Circle, Clock, Plus, Trash2, StickyNote, Pencil, UserPlus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useDB, upsertStudent, id as newId } from "@/lib/store";
import { TRACKER_STAGES, type TrackerEvent, type TrackerStage, type Student } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/counselor/tracker")({ component: Page });

function fmt(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function Page() {
  const db = useDB();
  const [selectedId, setSelectedId] = useState<string | null>(db.students[0]?.id ?? null);
  const [q, setQ] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  const filtered = useMemo(
    () => db.students.filter((s) => (s.fullName ?? "").toLowerCase().includes(q.toLowerCase())),
    [db.students, q],
  );
  const selected = db.students.find((s) => s.id === selectedId) ?? null;

  return (
    <>
      <PageHeader
        title="Student Tracker"
        description="Track each student's journey from intake to departure with timestamped milestones."
        actions={
          <Button onClick={() => setAddOpen(true)}>
            <UserPlus className="h-4 w-4 mr-1" /> Add student
          </Button>
        }
      />
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
        <Card className="p-3 h-fit">
          <Input placeholder="Search students..." value={q} onChange={(e) => setQ(e.target.value)} className="mb-3" />
          {db.students.length === 0 ? (
            <div className="text-sm text-muted-foreground p-3 text-center">
              No students yet. Click <span className="font-medium">Add student</span> to begin.
            </div>
          ) : (
          <div className="space-y-1 max-h-[70vh] overflow-y-auto">
            {filtered.map((s) => {
              const events = s.trackerEvents ?? [];
              const last = events[events.length - 1];
              const active = s.id === selectedId;
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedId(s.id)}
                  className={`w-full text-left rounded-md p-2 transition ${active ? "bg-primary/10 border border-primary/30" : "hover:bg-muted"}`}
                >
                  <div className="text-sm font-medium text-foreground truncate">{s.fullName || "Unnamed"}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {last ? `${last.stage} · ${fmt(last.at)}` : "No events yet"}
                  </div>
                </button>
              );
            })}
          </div>
          )}
        </Card>
        {selected ? <Detail key={selected.id} student={selected} /> : (
          <Card className="p-8 text-center text-sm text-muted-foreground">
            Select a student or add a new one to begin tracking.
          </Card>
        )}
      </div>
      <AddStudentDialog open={addOpen} onOpenChange={setAddOpen} onCreated={(s) => setSelectedId(s.id)} />
    </>
  );
}

function AddStudentDialog({ open, onOpenChange, onCreated }: {
  open: boolean; onOpenChange: (v: boolean) => void; onCreated: (s: Student) => void;
}) {
  const db = useDB();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [countries, setCountries] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  const reset = () => {
    setFullName(""); setEmail(""); setPhone(""); setCountries([]); setNotes("");
  };

  const save = () => {
    if (!fullName.trim()) { toast.error("Name is required"); return; }
    const s: Student = {
      id: newId(),
      fullName: fullName.trim(),
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      preferredCountries: countries,
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString(),
      trackerEvents: [],
    };
    upsertStudent(s);
    toast.success("Student added");
    onCreated(s);
    reset();
    onOpenChange(false);
  };

  const toggleCountry = (cid: string) => {
    setCountries((prev) => prev.includes(cid) ? prev.filter((x) => x !== cid) : [...prev, cid]);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add a new student</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground">Full name *</label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Aisha Khan" maxLength={100} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Email</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Phone</label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={30} />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Interested countries</label>
            {db.countries.length === 0 ? (
              <p className="text-xs text-muted-foreground mt-1">No countries available. Add some via Superadmin.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {db.countries.map((c) => {
                  const on = countries.includes(c.id);
                  return (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() => toggleCountry(c.id)}
                      className={`text-xs px-2 py-1 rounded-md border transition ${on ? "bg-primary text-primary-foreground border-primary" : "bg-muted hover:bg-muted/70 border-border"}`}
                    >
                      {c.flag ? `${c.flag} ` : ""}{c.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Notes (optional)</label>
            <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save}>Save student</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Detail({ student }: { student: Student }) {
  const events = student.trackerEvents ?? [];
  const completedStages = new Set(events.map((e) => e.stage));
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState<TrackerStage>(TRACKER_STAGES[0]);
  const [note, setNote] = useState("");
  const [at, setAt] = useState(() => nowLocal());
  const [editing, setEditing] = useState<TrackerEvent | null>(null);

  const addEvent = () => {
    const ev: TrackerEvent = {
      id: newId(),
      stage,
      at: new Date(at).toISOString(),
      note: note || undefined,
    };
    upsertStudent({ ...student, trackerEvents: [...events, ev] });
    toast.success(`Logged: ${ev.stage}`);
    setOpen(false);
    setNote("");
    setAt(nowLocal());
  };

  const quickMarkDone = (s: TrackerStage) => {
    const ev: TrackerEvent = { id: newId(), stage: s, at: new Date().toISOString() };
    upsertStudent({ ...student, trackerEvents: [...events, ev] });
    toast.success(`Marked done: ${s}`);
  };

  const openEditor = (s: TrackerStage) => {
    const existing = events.find((e) => e.stage === s);
    const draft: TrackerEvent = existing
      ? { ...existing }
      : { id: newId(), stage: s, at: new Date().toISOString(), note: "" };
    setEditing(draft);
  };

  const saveEditing = (draft: TrackerEvent) => {
    const exists = events.some((e) => e.id === draft.id);
    const next = exists
      ? events.map((e) => (e.id === draft.id ? draft : e))
      : [...events, draft];
    upsertStudent({ ...student, trackerEvents: next });
    toast.success("Saved");
    setEditing(null);
  };

  const removeEvent = (id: string) => {
    upsertStudent({ ...student, trackerEvents: events.filter((e) => e.id !== id) });
  };

  const sorted = [...events].sort((a, b) => +new Date(a.at) - +new Date(b.at));
  const progress = Math.round((completedStages.size / TRACKER_STAGES.length) * 100);

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">{student.fullName || "Unnamed student"}</h2>
            <p className="text-xs text-muted-foreground">
              {student.email || "—"} {student.phone ? `· ${student.phone}` : ""}
            </p>
            <div className="flex gap-2 mt-2 flex-wrap">
              {student.preferredLevel && <Badge variant="secondary">{student.preferredLevel}</Badge>}
              {student.preferredCategory && <Badge variant="secondary">{student.preferredCategory}</Badge>}
              {student.preferredIntake && <Badge variant="secondary">Intake: {student.preferredIntake}</Badge>}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Progress</div>
            <div className="text-2xl font-semibold text-foreground">{progress}%</div>
            <div className="text-xs text-muted-foreground">{completedStages.size}/{TRACKER_STAGES.length} stages</div>
          </div>
        </div>
        <div className="mt-4 h-2 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Pipeline</h3>
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Log event
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {TRACKER_STAGES.map((s) => {
            const done = completedStages.has(s);
            const ev = sorted.find((e) => e.stage === s);
            return (
              <div
                key={s}
                className={`flex items-center justify-between gap-2 rounded-md border p-2 ${done ? "border-primary/30 bg-primary/5" : "border-border bg-muted/30"}`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {done ? <CheckCircle2 className="h-4 w-4 text-primary shrink-0" /> : <Circle className="h-4 w-4 text-muted-foreground shrink-0" />}
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">{s}</div>
                    {ev && (
                      <div className="text-xs text-muted-foreground truncate">
                        {fmt(ev.at)}{ev.note ? ` · ${ev.note}` : ""}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {!done && (
                    <Button size="sm" variant="ghost" onClick={() => quickMarkDone(s)}>Mark done</Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => openEditor(s)} title={done ? "Edit details" : "Add details"}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  {done && ev && (
                    <Button size="icon" variant="ghost" onClick={() => removeEvent(ev.id)} title="Clear">
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="font-semibold text-foreground mb-4">Timeline</h3>
        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground">No events logged yet.</p>
        ) : (
          <ol className="relative border-l border-border ml-3 space-y-4">
            {sorted.map((e) => (
              <li key={e.id} className="ml-4">
                <span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full bg-primary" />
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-foreground">{e.stage}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {fmt(e.at)}
                    </div>
                    {e.note && (
                      <div className="text-xs text-foreground mt-1 flex items-start gap-1">
                        <StickyNote className="h-3 w-3 mt-0.5 text-muted-foreground" />
                        <span className="whitespace-pre-wrap">{e.note}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setEditing({ ...e })}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => removeEvent(e.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log a tracker event</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">Stage</label>
              <Select value={stage} onValueChange={(v) => setStage(v as TrackerStage)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TRACKER_STAGES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">When</label>
              <Input type="datetime-local" value={at} onChange={(e) => setAt(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Note (optional)</label>
              <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Details, reference number, contact, etc." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={addEvent}>Save event</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EditEventDialog event={editing} onClose={() => setEditing(null)} onSave={saveEditing} />
    </div>
  );
}

function nowLocal() {
  const d = new Date();
  d.setSeconds(0, 0);
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 16);
}

function toLocalInput(iso: string) {
  const d = new Date(iso);
  d.setSeconds(0, 0);
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 16);
}

function EditEventDialog({ event, onClose, onSave }: {
  event: TrackerEvent | null;
  onClose: () => void;
  onSave: (e: TrackerEvent) => void;
}) {
  const [at, setAt] = useState("");
  const [note, setNote] = useState("");

  // re-init when event changes
  const key = event?.id ?? "none";
  useEffect(() => {
    if (event) {
      setAt(toLocalInput(event.at));
      setNote(event.note ?? "");
    }
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!event) return null;

  return (
    <Dialog open={!!event} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{event.stage}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground">Date & time</label>
            <Input type="datetime-local" value={at} onChange={(e) => setAt(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Note</label>
            <Textarea
              rows={4}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={1000}
              placeholder={hintFor(event.stage)}
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Tip: capture amounts, reference IDs, interview times, etc.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave({ ...event, at: new Date(at).toISOString(), note: note.trim() || undefined })}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function hintFor(stage: TrackerStage): string {
  switch (stage) {
    case "Interview": return "e.g. Interview scheduled with admissions on 12 Mar at 3 PM";
    case "Tuition Deposit Paid": return "e.g. Paid GBP 2,000 deposit, ref TXN-1029";
    case "Bank Statement Ready": return "e.g. GBP 18,500 maintained, statement dated 1 Apr";
    case "Visa Application Submitted": return "e.g. Application ID GWF000123456";
    case "Biometrics": return "e.g. VFS appointment 18 Apr, 10:30 AM";
    case "Visa Approved": return "e.g. Visa valid till 30 Sep 2027";
    case "Departed": return "e.g. Flight EK205 on 15 Sep";
    default: return "Add any details, dates, amounts or reference numbers";
  }
}