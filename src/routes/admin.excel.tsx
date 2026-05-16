import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Upload, FileSpreadsheet, Download, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { SelectField } from "@/components/form-fields";
import { useDB, upsertCountry, upsertUniversity, upsertProgram, id, logAudit } from "@/lib/store";
import type { Country, Program, ProgramLevel, RecordStatus, University } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/excel")({ component: Page });

type Entity = "countries" | "universities" | "programs";

function Page() {
  const db = useDB();
  const fileRef = useRef<HTMLInputElement>(null);
  const [entity, setEntity] = useState<Entity>("countries");
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const headers = entity === "countries"
    ? ["name", "currency", "avgLivingCost", "pswDuration", "visaFee", "ielts", "moi"]
    : entity === "universities"
    ? ["name", "country", "city", "ieltsOverall", "moi", "scholarshipAvailable"]
    : ["name", "university", "level", "category", "currency", "annualTuition", "scholarshipAmount", "ieltsOverall"];

  const downloadTemplate = () => {
    const csv = headers.join(",") + "\n";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${entity}-template.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const parse = (text: string) => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) return { rows: [], errors: ["File must have a header row + at least one data row"] };
    const head = lines[0].split(",").map((h) => h.trim());
    const out: Record<string, string>[] = [];
    const errs: string[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cells = lines[i].split(",").map((c) => c.trim());
      const r: Record<string, string> = {};
      head.forEach((h, idx) => (r[h] = cells[idx] ?? ""));
      if (!r.name) { errs.push(`Row ${i + 1}: missing name`); continue; }
      out.push(r);
    }
    return { rows: out, errors: errs };
  };

  const onFile = async (f: File) => {
    const text = await f.text();
    const { rows: r, errors: e } = parse(text);
    setRows(r); setErrors(e);
    toast.success(`Parsed ${r.length} row(s)`);
  };

  const importNow = () => {
    let count = 0;
    for (const r of rows) {
      if (entity === "countries") {
        const c: Country = {
          id: id(), name: r.name, currency: r.currency || "USD",
          avgLivingCost: r.avgLivingCost ? Number(r.avgLivingCost) : undefined,
          pswDuration: r.pswDuration || undefined,
          visaFee: r.visaFee ? Number(r.visaFee) : undefined,
          ielts: r.ielts === "true", moi: r.moi === "true",
          status: "Draft" as RecordStatus, updatedAt: new Date().toISOString(),
        };
        upsertCountry(c); count++;
      } else if (entity === "universities") {
        const country = db.countries.find((c) => c.name.toLowerCase() === (r.country ?? "").toLowerCase());
        if (!country) continue;
        const u: University = {
          id: id(), name: r.name, countryId: country.id,
          city: r.city || undefined,
          ieltsOverall: r.ieltsOverall ? Number(r.ieltsOverall) : undefined,
          moi: r.moi === "true",
          scholarshipAvailable: r.scholarshipAvailable === "true",
          status: "Draft", updatedAt: new Date().toISOString(),
        };
        upsertUniversity(u); count++;
      } else {
        const uni = db.universities.find((u) => u.name.toLowerCase() === (r.university ?? "").toLowerCase());
        if (!uni) continue;
        const p: Program = {
          id: id(), name: r.name, universityId: uni.id,
          level: (r.level || "Undergraduate") as ProgramLevel,
          category: r.category || undefined,
          currency: r.currency || "USD",
          annualTuition: r.annualTuition ? Number(r.annualTuition) : undefined,
          scholarshipAmount: r.scholarshipAmount ? Number(r.scholarshipAmount) : undefined,
          scholarshipAvailable: r.scholarshipAmount ? true : undefined,
          ieltsOverall: r.ieltsOverall ? Number(r.ieltsOverall) : undefined,
          status: "Draft", updatedAt: new Date().toISOString(),
        };
        upsertProgram(p); count++;
      }
    }
    logAudit({ actor: "Admin", action: "create", entity: entity === "countries" ? "Country" : entity === "universities" ? "University" : "Program", entityName: `Bulk import (${count})` });
    toast.success(`Imported ${count} ${entity}.`);
    setRows([]); setErrors([]);
  };

  return (
    <>
      <PageHeader title="Excel / CSV Upload" description="Bulk import countries, universities and programs from CSV files." />

      <Card className="p-5 mb-4">
        <div className="grid md:grid-cols-3 gap-4 items-end">
          <SelectField label="Import target" value={entity} onChange={(v) => { setEntity(v as Entity); setRows([]); setErrors([]); }}
            options={[
              { label: "Countries", value: "countries" },
              { label: "Universities", value: "universities" },
              { label: "Programs", value: "programs" },
            ]} />
          <Button variant="outline" onClick={downloadTemplate}><Download className="h-4 w-4 mr-1" /> Download CSV template</Button>
          <div>
            <input ref={fileRef} type="file" hidden accept=".csv,text/csv"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }} />
            <Button onClick={() => fileRef.current?.click()}><Upload className="h-4 w-4 mr-1" /> Choose CSV</Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Required columns: <code className="text-foreground">{headers.join(", ")}</code>. Booleans use <code>true</code>/<code>false</code>.
        </p>
      </Card>

      {errors.length > 0 && (
        <Card className="p-4 mb-4 border-destructive/40">
          <div className="flex items-center gap-2 text-destructive font-medium mb-2"><AlertCircle className="h-4 w-4" /> {errors.length} issue(s)</div>
          <ul className="text-xs text-muted-foreground space-y-0.5">{errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
        </Card>
      )}

      {rows.length > 0 && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm font-medium"><CheckCircle2 className="h-4 w-4 text-success" /> Preview · {rows.length} row(s)</div>
            <Button onClick={importNow}>Import {rows.length} {entity}</Button>
          </div>
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-xs">
              <thead className="bg-muted">
                <tr>{headers.map((h) => <th key={h} className="text-left px-3 py-2 font-medium">{h}</th>)}</tr>
              </thead>
              <tbody>
                {rows.slice(0, 20).map((r, i) => (
                  <tr key={i} className="border-t">
                    {headers.map((h) => <td key={h} className="px-3 py-2">{r[h] ?? "—"}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rows.length > 20 && <p className="text-xs text-muted-foreground mt-2">Showing first 20 of {rows.length} rows.</p>}
        </Card>
      )}

      {rows.length === 0 && errors.length === 0 && (
        <Card className="p-10 text-center border-dashed border-2">
          <FileSpreadsheet className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Choose a CSV file to preview rows before importing.</p>
        </Card>
      )}
    </>
  );
}
