import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Section, NumField, TextField, ToggleField, SelectField, MultiToggleField, TextAreaField } from "@/components/form-fields";
import { useDB, upsertStudent, id as makeId } from "@/lib/store";
import { recommend } from "@/lib/recommender";
import type { Student, ProgramLevel } from "@/lib/types";
import { CheckCircle2, AlertTriangle, Save, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/counselor/matcher")({ component: Page });

const LEVELS: ProgramLevel[] = ["Foundation", "Diploma", "Undergraduate", "International Year One", "Postgraduate", "MBA", "PhD"];
const INTAKES = ["January", "February", "March", "May", "July", "August", "September", "October"];
const CATEGORIES = ["Business", "IT", "Engineering", "Health", "Arts", "Design", "Media", "Hospitality", "Law"];

function blank(): Student {
  return { id: makeId(), createdAt: new Date().toISOString() };
}

function Page() {
  const db = useDB();
  const [s, setS] = useState<Student>(blank());
  const [submitted, setSubmitted] = useState(false);
  const set = <K extends keyof Student>(k: K, v: Student[K]) => setS((p) => ({ ...p, [k]: v }));

  const matches = useMemo(
    () => (submitted ? recommend(s, db.programs, db.universities, db.countries, 8) : []),
    [submitted, s, db.programs, db.universities, db.countries],
  );

  const save = () => {
    upsertStudent(s);
    toast.success(`Saved ${s.fullName || "student profile"}.`);
  };

  return (
    <>
      <PageHeader
        title="Student Matcher"
        description="Every field is optional — submit even partial info to get suggestions."
        actions={<Button variant="outline" onClick={save}><Save className="h-4 w-4 mr-1" /> Save profile</Button>}
      />

      <div className="grid lg:grid-cols-[1fr_1.2fr] gap-6">
        <Card className="p-5 space-y-6">
          <Section title="Student basics">
            <TextField label="Full name" value={s.fullName} onChange={(v) => set("fullName", v)} />
            <TextField label="Email" value={s.email} onChange={(v) => set("email", v)} />
            <TextField label="Phone" value={s.phone} onChange={(v) => set("phone", v)} />
          </Section>
          <Section title="Preferences">
            <SelectField label="Preferred level" value={s.preferredLevel || ""} onChange={(v) => set("preferredLevel", v as ProgramLevel)}
              options={LEVELS.map((l) => ({ label: l, value: l }))} />
            <SelectField label="Preferred field" value={s.preferredCategory} onChange={(v) => set("preferredCategory", v)}
              options={CATEGORIES.map((c) => ({ label: c, value: c }))} />
            <SelectField label="Preferred intake" value={s.preferredIntake} onChange={(v) => set("preferredIntake", v)}
              options={INTAKES.map((i) => ({ label: i, value: i }))} />
            <NumField label="Max budget (per year)" value={s.budgetMax} onChange={(v) => set("budgetMax", v)} />
            <MultiToggleField label="Preferred countries" options={db.countries.map((c) => c.name)}
              value={(s.preferredCountries ?? []).map((id) => db.countries.find((c) => c.id === id)?.name ?? "").filter(Boolean)}
              onChange={(names) => set("preferredCountries", names.map((n) => db.countries.find((c) => c.name === n)?.id ?? "").filter(Boolean))}
            />
          </Section>
          <Section title="Academic profile">
            <NumField label="GPA / percentage" value={s.gpa} onChange={(v) => set("gpa", v)} step="0.1" />
            <NumField label="IELTS overall" value={s.ielts} onChange={(v) => set("ielts", v)} step="0.5" />
            <NumField label="PTE score" value={s.pte} onChange={(v) => set("pte", v)} />
            <ToggleField label="Has MOI letter" checked={s.hasMoi} onChange={(v) => set("hasMoi", v)} />
            <NumField label="Gap years" value={s.gapYears} onChange={(v) => set("gapYears", v)} />
            <ToggleField label="Has backlogs" checked={s.hasBacklogs} onChange={(v) => set("hasBacklogs", v)} />
            <TextAreaField label="Counseling notes" value={s.notes} onChange={(v) => set("notes", v)} />
          </Section>
          <div className="flex justify-end">
            <Button onClick={() => setSubmitted(true)}><Sparkles className="h-4 w-4 mr-1" /> Get suggestions</Button>
          </div>
        </Card>

        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Suggestions {matches.length > 0 && `(${matches.length})`}</h2>
          {!submitted && (
            <Card className="p-8 text-center text-muted-foreground text-sm">
              Fill any details on the left and click <strong>Get suggestions</strong> to see matching programs.
            </Card>
          )}
          {submitted && matches.length === 0 && (
            <Card className="p-8 text-center text-muted-foreground text-sm">No matches found.</Card>
          )}
          {matches.map((m) => (
            <Card key={m.program.id} className="p-5">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <h3 className="font-semibold text-foreground">{m.program.name}</h3>
                  <p className="text-xs text-muted-foreground">{m.university.name} · {m.country.flag} {m.country.name} · {m.program.level}</p>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Match</div>
                  <div className="font-bold text-primary">{Math.max(0, Math.min(100, m.score))}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs my-3">
                <Stat label="Final fee" value={`${m.program.currency ?? ""} ${m.finalFee.toLocaleString()}`} />
                <Stat label="Intakes" value={m.program.intakes?.join(", ") ?? "—"} />
                <Stat label="IELTS" value={m.program.ieltsOverall ? String(m.program.ieltsOverall) : (m.program.moiAccepted ? "MOI ok" : "—")} />
                <Stat label="Duration" value={m.program.duration ?? "—"} />
              </div>
              {m.reasons.length > 0 && (
                <ul className="space-y-1">
                  {m.reasons.map((r, i) => (
                    <li key={i} className="text-xs flex items-center gap-1.5 text-success">
                      <CheckCircle2 className="h-3 w-3" /> {r}
                    </li>
                  ))}
                </ul>
              )}
              {m.warnings.length > 0 && (
                <ul className="space-y-1 mt-1">
                  {m.warnings.map((w, i) => (
                    <li key={i} className="text-xs flex items-center gap-1.5 text-warning-foreground">
                      <AlertTriangle className="h-3 w-3" /> {w}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/50 px-2 py-1.5">
      <div className="text-[10px] uppercase text-muted-foreground tracking-wide">{label}</div>
      <div className="text-foreground font-medium">{value}</div>
    </div>
  );
}