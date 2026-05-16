import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2, Pencil, ArrowRight, GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { PageHeader, EmptyState, StatusBadge } from "@/components/page-header";
import { Field, SelectField, TextAreaField, TextField } from "@/components/form-fields";
import { useDB, upsertProcessMap, deleteProcessMap, id, logAudit } from "@/lib/store";
import type { ProcessMap, ProcessStep, RecordStatus } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/process-maps")({ component: Page });

const TYPES: ProcessMap["type"][] = ["Application", "CAS", "Visa", "Departure", "End-to-End"];
const OWNERS: NonNullable<ProcessStep["owner"]>[] = ["Student", "Counselor", "University", "Embassy"];
const STATUSES: RecordStatus[] = ["Draft", "Verified", "Needs Update", "Outdated", "Archived"];

function blank(): ProcessMap {
  return { id: id(), title: "", type: "Application", steps: [], status: "Draft", updatedAt: new Date().toISOString() };
}

function Page() {
  const db = useDB();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ProcessMap | null>(null);

  const onSave = (m: ProcessMap) => {
    upsertProcessMap(m);
    logAudit({ actor: "Admin", action: editing ? "update" : "create", entity: "ProcessMap", entityName: m.title });
    setOpen(false); setEditing(null);
    toast.success(`Process map "${m.title}" saved.`);
  };

  return (
    <>
      <PageHeader
        title="Process Maps"
        description="Visual application → CAS → visa → departure flows that counselors reference with students."
        actions={<Button onClick={() => { setEditing(null); setOpen(true); }}><Plus className="h-4 w-4 mr-1" /> New Process Map</Button>}
      />

      {db.processMaps.length === 0 ? (
        <EmptyState
          title="No process maps yet"
          description="Create your first end-to-end flow, e.g. 'UK Tier-4 application' or 'Australian visa lodgement'."
          action={<Button onClick={() => { setEditing(null); setOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Create map</Button>}
        />
      ) : (
        <div className="space-y-4">
          {db.processMaps.map((m) => {
            const country = db.countries.find((c) => c.id === m.countryId)?.name;
            return (
              <Card key={m.id} className="p-5">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-foreground">{m.title}</h3>
                      <StatusBadge status={m.status} />
                      <span className="text-xs text-muted-foreground">{m.type}{country ? ` · ${country}` : ""}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{m.steps.length} step(s)</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => { setEditing(m); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => {
                      if (confirm("Delete map?")) {
                        deleteProcessMap(m.id);
                        logAudit({ actor: "Admin", action: "delete", entity: "ProcessMap", entityName: m.title });
                      }
                    }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </div>
                <div className="flex items-stretch gap-2 overflow-x-auto pb-2">
                  {m.steps.map((s, i) => (
                    <div key={s.id} className="flex items-center gap-2">
                      <div className="min-w-[200px] max-w-[240px] rounded-lg border border-border bg-muted/40 p-3">
                        <div className="text-xs text-muted-foreground mb-1">Step {i + 1} · {s.owner ?? "—"}</div>
                        <div className="text-sm font-medium text-foreground">{s.title}</div>
                        {s.duration && <div className="text-xs text-muted-foreground mt-1">{s.duration}</div>}
                        {s.description && <div className="text-xs text-muted-foreground mt-1 line-clamp-3">{s.description}</div>}
                      </div>
                      {i < m.steps.length - 1 && <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />}
                    </div>
                  ))}
                  {m.steps.length === 0 && <p className="text-sm text-muted-foreground">No steps. Edit to add.</p>}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Sheet open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editing ? "Edit process map" : "New process map"}</SheetTitle>
          </SheetHeader>
          <MapForm initial={editing} db={db} onSave={onSave} onCancel={() => { setOpen(false); setEditing(null); }} />
        </SheetContent>
      </Sheet>
    </>
  );
}

function MapForm({
  initial, db, onSave, onCancel,
}: { initial: ProcessMap | null; db: ReturnType<typeof useDB>; onSave: (m: ProcessMap) => void; onCancel: () => void }) {
  const [m, setM] = useState<ProcessMap>(initial ?? blank());
  const set = <K extends keyof ProcessMap>(k: K, v: ProcessMap[K]) => setM((prev) => ({ ...prev, [k]: v }));

  const addStep = () => set("steps", [...m.steps, { id: id(), title: "", owner: "Counselor" }]);
  const updateStep = (sid: string, patch: Partial<ProcessStep>) =>
    set("steps", m.steps.map((s) => s.id === sid ? { ...s, ...patch } : s));
  const removeStep = (sid: string) => set("steps", m.steps.filter((s) => s.id !== sid));

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = m.steps.findIndex((s) => s.id === active.id);
    const newIdx = m.steps.findIndex((s) => s.id === over.id);
    if (oldIdx < 0 || newIdx < 0) return;
    set("steps", arrayMove(m.steps, oldIdx, newIdx));
  };

  return (
    <div className="mt-6 space-y-5">
      <div className="grid md:grid-cols-2 gap-4">
        <TextField label="Title" value={m.title} onChange={(v) => set("title", v)} />
        <SelectField label="Type" value={m.type} onChange={(v) => set("type", v as ProcessMap["type"])}
          options={TYPES.map((t) => ({ label: t, value: t }))} />
        <SelectField label="Country (optional)" value={m.countryId ?? "__none"} onChange={(v) => set("countryId", v === "__none" ? undefined : v)}
          options={[{ label: "—", value: "__none" }, ...db.countries.map((c) => ({ label: c.name, value: c.id }))]} />
        <SelectField label="Status" value={m.status} onChange={(v) => set("status", v as RecordStatus)}
          options={STATUSES.map((s) => ({ label: s, value: s }))} />
      </div>

      <div className="border-t pt-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Steps</h3>
          <Button size="sm" variant="outline" onClick={addStep}><Plus className="h-3 w-3 mr-1" /> Add step</Button>
        </div>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={m.steps.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {m.steps.map((s, i) => (
                <SortableStep
                  key={s.id}
                  step={s}
                  index={i}
                  onUpdate={(patch) => updateStep(s.id, patch)}
                  onRemove={() => removeStep(s.id)}
                />
              ))}
              {m.steps.length === 0 && <p className="text-xs text-muted-foreground">No steps yet.</p>}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      <Field label="">
        <div className="flex items-center justify-end gap-2 border-t pt-4">
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button onClick={() => onSave(m)} disabled={!m.title.trim()}>Save</Button>
        </div>
      </Field>
    </div>
  );
}

function SortableStep({
  step, index, onUpdate, onRemove,
}: {
  step: ProcessStep;
  index: number;
  onUpdate: (patch: Partial<ProcessStep>) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: step.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 10 : undefined,
  };
  return (
    <Card ref={setNodeRef} style={style} className="p-3">
      <div className="flex items-start gap-2">
        <button
          type="button"
          aria-label="Drag to reorder"
          className="mt-1 cursor-grab active:cursor-grabbing touch-none text-muted-foreground hover:text-foreground p-1 -ml-1"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="flex-1 grid md:grid-cols-2 gap-3">
          <TextField label={`Step ${index + 1} title`} value={step.title} onChange={(v) => onUpdate({ title: v })} />
          <SelectField
            label="Owner"
            value={step.owner ?? ""}
            onChange={(v) => onUpdate({ owner: v as ProcessStep["owner"] })}
            options={OWNERS.map((o) => ({ label: o, value: o }))}
          />
          <TextField label="Duration" value={step.duration ?? ""} onChange={(v) => onUpdate({ duration: v })} placeholder="e.g. 2-3 weeks" />
          <TextAreaField label="Description" value={step.description} onChange={(v) => onUpdate({ description: v })} />
        </div>
        <Button variant="ghost" size="icon" onClick={onRemove}><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </div>
    </Card>
  );
}