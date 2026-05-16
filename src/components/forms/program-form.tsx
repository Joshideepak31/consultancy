import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Field, NumField, Section, SelectField, TextAreaField, TextField, ToggleField, MultiToggleField,
} from "@/components/form-fields";
import type { Program, ProgramLevel, RecordStatus, University } from "@/lib/types";
import { finalFee, id } from "@/lib/store";

const STATUSES: RecordStatus[] = ["Draft", "Verified", "Needs Update", "Outdated", "Archived"];
const LEVELS: ProgramLevel[] = ["Foundation", "Diploma", "Undergraduate", "International Year One", "Postgraduate", "MBA", "PhD"];
const CATEGORIES = ["Business", "IT", "Engineering", "Health", "Arts", "Design", "Media", "Hospitality", "Law", "Other"];
const INTAKES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "Rolling"];

function blank(): Program {
  return { id: id(), name: "", universityId: "", level: "Undergraduate", status: "Draft", updatedAt: new Date().toISOString() };
}

export function ProgramForm({
  initial, universities, onSave, onCancel,
}: { initial?: Program | null; universities: University[]; onSave: (p: Program) => void; onCancel: () => void }) {
  const [p, setP] = useState<Program>(initial ?? blank());
  const set = <K extends keyof Program>(k: K, v: Program[K]) => setP((prev) => ({ ...prev, [k]: v }));

  return (
    <div className="space-y-6">
      <Tabs defaultValue="basic">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="basic">Basic</TabsTrigger>
          <TabsTrigger value="intake">Intake</TabsTrigger>
          <TabsTrigger value="fees">Fees</TabsTrigger>
          <TabsTrigger value="elig">Eligibility</TabsTrigger>
          <TabsTrigger value="english">English</TabsTrigger>
          <TabsTrigger value="status">Status</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="pt-5">
          <Section title="Basic program info">
            <TextField label="Program name" value={p.name} onChange={(v) => set("name", v)} />
            <SelectField label="University" value={p.universityId} onChange={(v) => set("universityId", v)}
              options={universities.map((u) => ({ label: u.name, value: u.id }))} />
            <SelectField label="Level" value={p.level} onChange={(v) => set("level", v as ProgramLevel)}
              options={LEVELS.map((l) => ({ label: l, value: l }))} />
            <SelectField label="Category" value={p.category} onChange={(v) => set("category", v)}
              options={CATEGORIES.map((c) => ({ label: c, value: c }))} />
            <TextField label="Faculty / School" value={p.faculty} onChange={(v) => set("faculty", v)} />
            <TextField label="Duration" value={p.duration} onChange={(v) => set("duration", v)} placeholder="e.g. 2 years" />
            <ToggleField label="Placement available" checked={p.placement} onChange={(v) => set("placement", v)} />
            <TextAreaField label="Course description" value={p.description} onChange={(v) => set("description", v)} />
          </Section>
        </TabsContent>

        <TabsContent value="intake" className="pt-5">
          <Section title="Intake">
            <MultiToggleField label="Available intakes" options={INTAKES} value={p.intakes} onChange={(v) => set("intakes", v)} />
            <TextField label="Application deadline" value={p.applicationDeadline} onChange={(v) => set("applicationDeadline", v)} />
            <TextAreaField label="Intake notes" value={p.intakeNotes} onChange={(v) => set("intakeNotes", v)} />
          </Section>
        </TabsContent>

        <TabsContent value="fees" className="pt-5">
          <Section title="Fees">
            <TextField label="Currency" value={p.currency} onChange={(v) => set("currency", v)} placeholder="USD / GBP / AUD" />
            <NumField label="Annual tuition fee" value={p.annualTuition} onChange={(v) => set("annualTuition", v)} />
            <NumField label="Total tuition fee" value={p.totalTuition} onChange={(v) => set("totalTuition", v)} />
            <NumField label="Application fee" value={p.applicationFee} onChange={(v) => set("applicationFee", v)} />
            <NumField label="Deposit amount" value={p.deposit} onChange={(v) => set("deposit", v)} />
            <ToggleField label="Scholarship available" checked={p.scholarshipAvailable} onChange={(v) => set("scholarshipAvailable", v)} />
            <NumField label="Scholarship amount" value={p.scholarshipAmount} onChange={(v) => set("scholarshipAmount", v)} />
            <NumField label="Scholarship %" value={p.scholarshipPercentage} onChange={(v) => set("scholarshipPercentage", v)} />
            <NumField label="Other compulsory fees" value={p.otherFees} onChange={(v) => set("otherFees", v)} />
            <Field label="Final fee after scholarship">
              <div className="px-3 py-2 rounded-md bg-muted text-foreground text-sm font-medium">
                {p.currency ?? ""} {finalFee(p).toLocaleString()}
              </div>
            </Field>
            <TextAreaField label="Fee notes" value={p.feeNotes} onChange={(v) => set("feeNotes", v)} />
          </Section>
        </TabsContent>

        <TabsContent value="elig" className="pt-5">
          <Section title="Academic eligibility">
            <NumField label="Minimum GPA / percentage" value={p.minGpa} onChange={(v) => set("minGpa", v)} step="0.1" />
            <NumField label="Min +2 GPA (for Bachelor)" value={p.minPlus2} onChange={(v) => set("minPlus2", v)} step="0.1" />
            <NumField label="Min Bachelor % (for Master)" value={p.minBachelor} onChange={(v) => set("minBachelor", v)} step="0.1" />
            <TextField label="Required academic background" value={p.academicBackground} onChange={(v) => set("academicBackground", v)} />
            <ToggleField label="Related background required" checked={p.relatedBackground} onChange={(v) => set("relatedBackground", v)} />
            <ToggleField label="Work experience required" checked={p.workExperience} onChange={(v) => set("workExperience", v)} />
            <ToggleField label="Portfolio required" checked={p.portfolio} onChange={(v) => set("portfolio", v)} />
          </Section>
        </TabsContent>

        <TabsContent value="english" className="pt-5">
          <Section title="English requirements">
            <NumField label="IELTS overall" value={p.ieltsOverall} onChange={(v) => set("ieltsOverall", v)} step="0.5" />
            <NumField label="PTE score" value={p.pteScore} onChange={(v) => set("pteScore", v)} />
            <ToggleField label="MOI accepted" checked={p.moiAccepted} onChange={(v) => set("moiAccepted", v)} />
          </Section>
        </TabsContent>

        <TabsContent value="status" className="pt-5">
          <Section title="Status">
            <SelectField label="Record status" value={p.status} onChange={(v) => set("status", v as RecordStatus)}
              options={STATUSES.map((s) => ({ label: s, value: s }))} />
          </Section>
        </TabsContent>
      </Tabs>

      <div className="flex items-center justify-end gap-2 border-t pt-4">
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button variant="secondary" onClick={() => onSave({ ...p, status: "Draft" })}>Save Draft</Button>
        <Button onClick={() => onSave({ ...p, status: "Verified" })}>Verify & Publish</Button>
      </div>
    </div>
  );
}