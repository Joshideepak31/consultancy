import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Field, NumField, Section, SelectField, TextAreaField, TextField, ToggleField, MultiToggleField,
} from "@/components/form-fields";
import type { Country, RecordStatus } from "@/lib/types";
import { id } from "@/lib/store";

const STATUSES: RecordStatus[] = ["Draft", "Verified", "Needs Update", "Outdated", "Archived"];
const INTAKES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function blank(): Country {
  return { id: id(), name: "", currency: "", status: "Draft", updatedAt: new Date().toISOString() };
}

export function CountryForm({
  initial, onSave, onCancel,
}: { initial?: Country | null; onSave: (c: Country) => void; onCancel: () => void }) {
  const [c, setC] = useState<Country>(initial ?? blank());
  const set = <K extends keyof Country>(k: K, v: Country[K]) => setC((p) => ({ ...p, [k]: v }));

  return (
    <div className="space-y-6">
      <Tabs defaultValue="basic">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="basic">Basic</TabsTrigger>
          <TabsTrigger value="study">Study Rules</TabsTrigger>
          <TabsTrigger value="english">English & Academic</TabsTrigger>
          <TabsTrigger value="visa">Visa & Finance</TabsTrigger>
          <TabsTrigger value="dependent">Dependents</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="pt-5">
          <Section title="Basic information">
            <TextField label="Country name" value={c.name} onChange={(v) => set("name", v)} />
            <TextField label="Flag (emoji or URL)" value={c.flag} onChange={(v) => set("flag", v)} placeholder="🇬🇧" />
            <TextField label="Currency" value={c.currency} onChange={(v) => set("currency", v)} placeholder="GBP" />
            <TextField label="Timezone" value={c.timezone} onChange={(v) => set("timezone", v)} placeholder="UTC+0" />
            <TextAreaField label="Short description" value={c.shortDescription} onChange={(v) => set("shortDescription", v)} />
            <TextAreaField label="Study destination summary" value={c.summary} onChange={(v) => set("summary", v)} />
          </Section>
        </TabsContent>

        <TabsContent value="study" className="pt-5">
          <Section title="Study rules">
            <TextField label="Average tuition range" value={c.avgTuition} onChange={(v) => set("avgTuition", v)} />
            <NumField label="Average living cost / year" value={c.avgLivingCost} onChange={(v) => set("avgLivingCost", v)} />
            <TextField label="Student work rights" value={c.workRights} onChange={(v) => set("workRights", v)} />
            <TextField label="PSW duration" value={c.pswDuration} onChange={(v) => set("pswDuration", v)} />
            <SelectField
              label="PR possibility" value={c.prPossibility}
              onChange={(v) => set("prPossibility", v as Country["prPossibility"])}
              options={[{ label: "Low", value: "Low" }, { label: "Medium", value: "Medium" }, { label: "High", value: "High" }]}
            />
            <TextField label="Typical processing time" value={c.processingTime} onChange={(v) => set("processingTime", v)} />
            <MultiToggleField label="Popular intakes" options={INTAKES} value={c.popularIntakes} onChange={(v) => set("popularIntakes", v)} />
          </Section>
        </TabsContent>

        <TabsContent value="english" className="pt-5">
          <Section title="English & academic rules">
            <ToggleField label="IELTS accepted" checked={c.ielts} onChange={(v) => set("ielts", v)} />
            <ToggleField label="PTE accepted" checked={c.pte} onChange={(v) => set("pte", v)} />
            <ToggleField label="Duolingo accepted" checked={c.duolingo} onChange={(v) => set("duolingo", v)} />
            <ToggleField label="MOI accepted" checked={c.moi} onChange={(v) => set("moi", v)} />
            <NumField label="Minimum GPA (general)" value={c.minGpa} onChange={(v) => set("minGpa", v)} step="0.1" />
            <ToggleField label="Gap accepted" checked={c.gapAccepted} onChange={(v) => set("gapAccepted", v)} />
            <NumField label="Maximum gap (years)" value={c.maxGap} onChange={(v) => set("maxGap", v)} />
            <ToggleField label="Backlogs accepted" checked={c.backlogsAccepted} onChange={(v) => set("backlogsAccepted", v)} />
            <TextAreaField label="Notes about gap / backlogs" value={c.gapNotes} onChange={(v) => set("gapNotes", v)} />
          </Section>
        </TabsContent>

        <TabsContent value="visa" className="pt-5">
          <Section title="Visa & financial requirements">
            <NumField label="Visa fee" value={c.visaFee} onChange={(v) => set("visaFee", v)} />
            <ToggleField label="Medical required" checked={c.medical} onChange={(v) => set("medical", v)} />
            <ToggleField label="Biometrics required" checked={c.biometrics} onChange={(v) => set("biometrics", v)} />
            <ToggleField label="TB test required" checked={c.tbTest} onChange={(v) => set("tbTest", v)} />
            <ToggleField label="Bank statement required" checked={c.bankStatement} onChange={(v) => set("bankStatement", v)} />
            <NumField label="Estimated bank balance required" value={c.bankBalance} onChange={(v) => set("bankBalance", v)} />
            <ToggleField label="Sponsor allowed" checked={c.sponsorAllowed} onChange={(v) => set("sponsorAllowed", v)} />
            <ToggleField label="Education loan accepted" checked={c.loanAccepted} onChange={(v) => set("loanAccepted", v)} />
            <TextAreaField label="Financial notes" value={c.financialNotes} onChange={(v) => set("financialNotes", v)} />
          </Section>
        </TabsContent>

        <TabsContent value="dependent" className="pt-5">
          <Section title="Dependent / spouse rules">
            <ToggleField label="Dependent allowed" checked={c.dependentAllowed} onChange={(v) => set("dependentAllowed", v)} />
            <ToggleField label="Spouse can work" checked={c.spouseCanWork} onChange={(v) => set("spouseCanWork", v)} />
            <ToggleField label="Children allowed" checked={c.childrenAllowed} onChange={(v) => set("childrenAllowed", v)} />
            <NumField label="Dependent visa fee" value={c.dependentVisaFee} onChange={(v) => set("dependentVisaFee", v)} />
            <NumField label="Dependent financial requirement" value={c.dependentFinancial} onChange={(v) => set("dependentFinancial", v)} />
            <TextAreaField label="Notes about dependent rules" value={c.dependentNotes} onChange={(v) => set("dependentNotes", v)} />
          </Section>
        </TabsContent>

        <TabsContent value="notes" className="pt-5">
          <Section title="Media & notes">
            <TextAreaField label="Internal counselor notes" value={c.internalNotes} onChange={(v) => set("internalNotes", v)} />
            <TextAreaField label="Risk notes" value={c.riskNotes} onChange={(v) => set("riskNotes", v)} />
            <TextAreaField label="Public summary" value={c.publicSummary} onChange={(v) => set("publicSummary", v)} />
            <TextField label="Last verified date" type="date" value={c.lastVerified} onChange={(v) => set("lastVerified", v)} />
            <TextField label="Source URL" value={c.source} onChange={(v) => set("source", v)} />
            <SelectField
              label="Status" value={c.status}
              onChange={(v) => set("status", v as RecordStatus)}
              options={STATUSES.map((s) => ({ label: s, value: s }))}
            />
            <Field label="Reference media" full>
              <div className="text-xs text-muted-foreground border border-dashed rounded-lg p-4 text-center">
                Image / PDF uploads will be added in the Media Library module.
              </div>
            </Field>
          </Section>
        </TabsContent>
      </Tabs>

      <div className="flex items-center justify-end gap-2 border-t pt-4">
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button variant="secondary" onClick={() => onSave({ ...c, status: "Draft" })}>Save Draft</Button>
        <Button onClick={() => onSave({ ...c, status: "Verified" })}>Verify & Publish</Button>
      </div>
    </div>
  );
}