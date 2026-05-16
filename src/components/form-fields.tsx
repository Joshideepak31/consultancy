import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ReactNode } from "react";

export function Field({ label, hint, children, full }: { label: string; hint?: string; children: ReactNode; full?: boolean }) {
  return (
    <div className={`space-y-1.5 ${full ? "md:col-span-2" : ""}`}>
      <Label className="text-xs font-medium text-foreground">{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function TextField({
  label, value, onChange, placeholder, type = "text", hint, full,
}: {
  label: string; value: string | number | undefined;
  onChange: (v: string) => void; placeholder?: string; type?: string; hint?: string; full?: boolean;
}) {
  return (
    <Field label={label} hint={hint} full={full}>
      <Input type={type} value={value ?? ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </Field>
  );
}

export function NumField({
  label, value, onChange, placeholder, hint, step,
}: {
  label: string; value: number | undefined; onChange: (v: number | undefined) => void;
  placeholder?: string; hint?: string; step?: string;
}) {
  return (
    <Field label={label} hint={hint}>
      <Input
        type="number"
        step={step}
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
      />
    </Field>
  );
}

export function TextAreaField({
  label, value, onChange, placeholder, hint,
}: { label: string; value?: string; onChange: (v: string) => void; placeholder?: string; hint?: string }) {
  return (
    <Field label={label} hint={hint} full>
      <Textarea rows={3} value={value ?? ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </Field>
  );
}

export function ToggleField({
  label, checked, onChange, hint,
}: { label: string; checked: boolean | undefined; onChange: (v: boolean) => void; hint?: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2.5">
      <div>
        <div className="text-sm font-medium text-foreground">{label}</div>
        {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
      </div>
      <Switch checked={!!checked} onCheckedChange={onChange} />
    </div>
  );
}

export function SelectField({
  label, value, onChange, options, placeholder,
}: {
  label: string; value: string | undefined; onChange: (v: string) => void;
  options: { label: string; value: string }[]; placeholder?: string;
}) {
  return (
    <Field label={label}>
      <Select value={value ?? ""} onValueChange={onChange}>
        <SelectTrigger><SelectValue placeholder={placeholder ?? "Select..."} /></SelectTrigger>
        <SelectContent>
          {options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
        </SelectContent>
      </Select>
    </Field>
  );
}

export function MultiToggleField({
  label, options, value, onChange,
}: {
  label: string;
  options: string[];
  value: string[] | undefined;
  onChange: (v: string[]) => void;
}) {
  const set = new Set(value ?? []);
  return (
    <Field label={label} full>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = set.has(opt);
          return (
            <button
              type="button"
              key={opt}
              onClick={() => {
                const next = new Set(set);
                if (active) next.delete(opt); else next.add(opt);
                onChange(Array.from(next));
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                active
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-foreground border-border hover:bg-muted"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </Field>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground border-b pb-2">{title}</h3>
      <div className="grid md:grid-cols-2 gap-4">{children}</div>
    </div>
  );
}