import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Field, NumField, Section, SelectField, TextAreaField, TextField, ToggleField, MultiToggleField,
} from "@/components/form-fields";
import type { Country, RecordStatus, University } from "@/lib/types";
import { id } from "@/lib/store";

const STATUSES: RecordStatus[] = ["Draft", "Verified", "Needs Update", "Outdated", "Archived"];
const NEPALI = ["Tribhuvan University", "Kathmandu University", "Pokhara University", "Purbanchal University"];

function blank(): University {
  return { id: id(), name: "", countryId: "", status: "Draft", updatedAt: new Date().toISOString() };
}

export function UniversityForm({
  initial, countries, onSave, onCancel,
}: { initial?: University | null; countries: Country[]; onSave: (u: University) => void; onCancel: () => void }) {
  const [u, setU] = useState<University>(initial ?? blank());
  const set = <K extends keyof University>(k: K, v: University[K]) => setU((p) => ({ ...p, [k]: v }));

  return (
    <div className="space-y-6">
      <Tabs defaultValue="basic">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="basic">Basic</TabsTrigger>
          <TabsTrigger value="admission">Admission</TabsTrigger>
          <TabsTrigger value="english">English</TabsTrigger>
          <TabsTrigger value="fees">Fees & Scholarships</TabsTrigger>
          <TabsTrigger value="process">Process & Visa</TabsTrigger>
          <TabsTrigger value="notes">Media & Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="pt-5">
          <Section title="Basic information">
            <TextField label="University name" value={u.name} onChange={(v) => set("name", v)} />
            <SelectField label="Country" value={u.countryId} onChange={(v) => set("countryId", v)}
              options={countries.map((c) => ({ label: c.name, value: c.id }))} />
            <TextField label="City" value={u.city} onChange={(v) => set("city", v)} />
            <TextField label="Campus name" value={u.campus} onChange={(v) => set("campus", v)} />
            <TextField label="Website" value={u.website} onChange={(v) => set("website", v)} />
            <SelectField label="Type" value={u.type} onChange={(v) => set("type", v as University["type"])}
              options={[{ label: "Public", value: "Public" }, { label: "Private", value: "Private" }]} />
            <TextField label="Ranking (optional)" value={u.ranking} onChange={(v) => set("ranking", v)} />
            <ToggleField label="Partner university" checked={u.partner} onChange={(v) => set("partner", v)} />
            <SelectField label="Internal priority" value={u.priority} onChange={(v) => set("priority", v as University["priority"])}
              options={[{ label: "Low", value: "Low" }, { label: "Medium", value: "Medium" }, { label: "High", value: "High" }]} />
          </Section>
        </TabsContent>

        <TabsContent value="admission" className="pt-5">
          <Section title="Admission rules">
            <ToggleField label="Undergraduate accepted" checked={u.ugAccepted} onChange={(v) => set("ugAccepted", v)} />
            <ToggleField label="Postgraduate accepted" checked={u.pgAccepted} onChange={(v) => set("pgAccepted", v)} />
            <ToggleField label="Foundation accepted" checked={u.foundationAccepted} onChange={(v) => set("foundationAccepted", v)} />
            <ToggleField label="International Year One accepted" checked={u.iyOneAccepted} onChange={(v) => set("iyOneAccepted", v)} />
            <NumField label="Minimum GPA (UG)" value={u.minGpaUg} onChange={(v) => set("minGpaUg", v)} step="0.1" />
            <NumField label="Minimum GPA (PG)" value={u.minGpaPg} onChange={(v) => set("minGpaPg", v)} step="0.1" />
            <ToggleField label="3-year bachelor accepted" checked={u.threeYrBachelor} onChange={(v) => set("threeYrBachelor", v)} />
            <ToggleField label="4-year bachelor accepted" checked={u.fourYrBachelor} onChange={(v) => set("fourYrBachelor", v)} />
            <ToggleField label="Indian degree accepted" checked={u.indianDegree} onChange={(v) => set("indianDegree", v)} />
            <ToggleField label="Nepali degree accepted" checked={u.nepaliDegree} onChange={(v) => set("nepaliDegree", v)} />
            <MultiToggleField label="Accepted Nepali universities for MOI" options={NEPALI}
              value={u.nepaliMoiUnis} onChange={(v) => set("nepaliMoiUnis", v)} />
            <ToggleField label="Gap accepted" checked={u.gapAccepted} onChange={(v) => set("gapAccepted", v)} />
            <NumField label="Maximum gap (years)" value={u.maxGap} onChange={(v) => set("maxGap", v)} />
            <ToggleField label="Backlogs accepted" checked={u.backlogsAccepted} onChange={(v) => set("backlogsAccepted", v)} />
          </Section>
        </TabsContent>

        <TabsContent value="english" className="pt-5">
          <Section title="English language rules">
            <ToggleField label="IELTS required" checked={u.ieltsRequired} onChange={(v) => set("ieltsRequired", v)} />
            <NumField label="IELTS minimum overall" value={u.ieltsOverall} onChange={(v) => set("ieltsOverall", v)} step="0.5" />
            <NumField label="IELTS minimum band" value={u.ieltsBand} onChange={(v) => set("ieltsBand", v)} step="0.5" />
            <ToggleField label="PTE required" checked={u.pteRequired} onChange={(v) => set("pteRequired", v)} />
            <NumField label="PTE minimum score" value={u.pteScore} onChange={(v) => set("pteScore", v)} />
            <ToggleField label="Duolingo accepted" checked={u.duolingo} onChange={(v) => set("duolingo", v)} />
            <ToggleField label="MOI accepted" checked={u.moi} onChange={(v) => set("moi", v)} />
            <ToggleField label="Grade 12 English waiver" checked={u.g12Waiver} onChange={(v) => set("g12Waiver", v)} />
            <TextField label="Min Grade 12 English marks/grade" value={u.g12English} onChange={(v) => set("g12English", v)} />
            <TextAreaField label="IELTS / PTE waiver notes" value={u.waiverNotes} onChange={(v) => set("waiverNotes", v)} />
          </Section>
        </TabsContent>

        <TabsContent value="fees" className="pt-5">
          <Section title="Fees & scholarships">
            <NumField label="Application fee" value={u.applicationFee} onChange={(v) => set("applicationFee", v)} />
            <NumField label="Deposit amount" value={u.deposit} onChange={(v) => set("deposit", v)} />
            <NumField label="Average tuition fee" value={u.avgTuition} onChange={(v) => set("avgTuition", v)} />
            <ToggleField label="Scholarship available" checked={u.scholarshipAvailable} onChange={(v) => set("scholarshipAvailable", v)} />
            <NumField label="Scholarship amount" value={u.scholarshipAmount} onChange={(v) => set("scholarshipAmount", v)} />
            <SelectField label="Scholarship type" value={u.scholarshipType} onChange={(v) => set("scholarshipType", v)}
              options={["Fixed amount", "Percentage", "Merit-based", "Automatic", "Case-by-case"].map((s) => ({ label: s, value: s }))} />
            <TextAreaField label="Scholarship notes" value={u.scholarshipNotes} onChange={(v) => set("scholarshipNotes", v)} />
          </Section>
        </TabsContent>

        <TabsContent value="process" className="pt-5">
          <Section title="Process & visa intelligence">
            <TextField label="Offer letter processing time" value={u.offerProcessingTime} onChange={(v) => set("offerProcessingTime", v)} />
            <ToggleField label="Interview required" checked={u.interviewRequired} onChange={(v) => set("interviewRequired", v)} />
            <ToggleField label="Pre-CAS interview required" checked={u.preCasInterview} onChange={(v) => set("preCasInterview", v)} />
            <ToggleField label="CAS process available" checked={u.casProcess} onChange={(v) => set("casProcess", v)} />
            <ToggleField label="Credibility interview common" checked={u.credibilityInterview} onChange={(v) => set("credibilityInterview", v)} />
            <SelectField label="Visa success confidence" value={u.visaConfidence} onChange={(v) => set("visaConfidence", v as University["visaConfidence"])}
              options={[{ label: "Low", value: "Low" }, { label: "Medium", value: "Medium" }, { label: "High", value: "High" }]} />
            <TextAreaField label="Internal warnings" value={u.internalWarnings} onChange={(v) => set("internalWarnings", v)} />
            <TextAreaField label="Process notes" value={u.processNotes} onChange={(v) => set("processNotes", v)} />
          </Section>
        </TabsContent>

        <TabsContent value="notes" className="pt-5">
          <Section title="Media & notes">
            <TextAreaField label="Notes for counselors" value={u.counselorNotes} onChange={(v) => set("counselorNotes", v)} />
            <SelectField label="Status" value={u.status} onChange={(v) => set("status", v as RecordStatus)}
              options={STATUSES.map((s) => ({ label: s, value: s }))} />
            <Field label="Reference media (brochure, flyer, fee sheet, screenshots)" full>
              <div className="text-xs text-muted-foreground border border-dashed rounded-lg p-4 text-center">
                Image / PDF uploads will be added in the Media Library module.
              </div>
            </Field>
          </Section>
        </TabsContent>
      </Tabs>

      <div className="flex items-center justify-end gap-2 border-t pt-4">
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button variant="secondary" onClick={() => onSave({ ...u, status: "Draft" })}>Save Draft</Button>
        <Button onClick={() => onSave({ ...u, status: "Verified" })}>Verify & Publish</Button>
      </div>
    </div>
  );
}