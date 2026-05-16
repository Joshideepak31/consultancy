import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Save, RotateCcw, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { SelectField, TextField } from "@/components/form-fields";
import { useDB, updateSettings, resetDB, logAudit } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/settings")({ component: Page });

const CURRENCIES = ["USD", "GBP", "EUR", "AUD", "CAD", "NPR", "INR"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function Page() {
  const db = useDB();
  const [s, setS] = useState(db.settings);

  const save = () => {
    updateSettings(s);
    logAudit({ actor: "Admin", action: "update", entity: "Settings", entityName: "Workspace settings" });
    toast.success("Settings saved.");
  };

  return (
    <>
      <PageHeader title="Settings" description="Workspace settings — branding, default currency, intake calendar." />

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h3 className="font-semibold mb-4">Workspace</h3>
          <div className="space-y-4">
            <TextField label="Workspace name" value={s.workspaceName} onChange={(v) => setS({ ...s, workspaceName: v })} />
            <TextField label="Brand tagline" value={s.brandTagline ?? ""} onChange={(v) => setS({ ...s, brandTagline: v })} />
            <TextField label="Primary contact email" value={s.primaryContact ?? ""} onChange={(v) => setS({ ...s, primaryContact: v })} type="email" />
            <SelectField label="Default currency" value={s.defaultCurrency} onChange={(v) => setS({ ...s, defaultCurrency: v })}
              options={CURRENCIES.map((c) => ({ label: c, value: c }))} />
            <SelectField label="Fiscal year start" value={s.fiscalYearStart ?? "April"} onChange={(v) => setS({ ...s, fiscalYearStart: v })}
              options={MONTHS.map((m) => ({ label: m, value: m }))} />
            <Button onClick={save}><Save className="h-4 w-4 mr-1" /> Save settings</Button>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold mb-2 flex items-center gap-2"><Database className="h-4 w-4" /> Data</h3>
          <p className="text-sm text-muted-foreground mb-4">
            All data currently lives in your browser (localStorage). Switch to Lovable Cloud later for real auth, multi-user
            access and storage.
          </p>
          <ul className="text-sm text-foreground space-y-1.5 mb-4">
            <li>{db.countries.length} countries</li>
            <li>{db.universities.length} universities</li>
            <li>{db.programs.length} programs</li>
            <li>{db.rules.length} rules · {db.notes.length} notes · {db.media.length} media</li>
            <li>{db.counselors.length} counselors · {db.processMaps.length} process maps</li>
            <li>{db.audit.length} audit entries</li>
          </ul>
          <Button variant="outline" onClick={() => {
            if (confirm("Reset ALL data to seed values? This cannot be undone.")) {
              resetDB();
              toast.success("Data reset to seed.");
            }
          }}><RotateCcw className="h-4 w-4 mr-1" /> Reset to seed data</Button>
        </Card>
      </div>
    </>
  );
}
