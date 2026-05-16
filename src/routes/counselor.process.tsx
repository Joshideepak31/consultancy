import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import { PageHeader, EmptyState, StatusBadge } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDB } from "@/lib/store";

export const Route = createFileRoute("/counselor/process")({ component: Page });

function Page() {
  const db = useDB();
  const [q, setQ] = useState("");
  const [type, setType] = useState("__all");
  const [country, setCountry] = useState("__all");

  const cName = (id?: string) => db.countries.find((c) => c.id === id)?.name;

  const rows = useMemo(() => db.processMaps
    .filter((m) => m.status !== "Archived")
    .filter((m) => m.title.toLowerCase().includes(q.toLowerCase()))
    .filter((m) => type === "__all" || m.type === type)
    .filter((m) => country === "__all" || m.countryId === country),
    [db.processMaps, q, type, country]);

  return (
    <>
      <PageHeader title="Process Guides" description="Step-by-step application → CAS → visa → departure flows curated by the admin team." />
      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-60">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search process map..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">All types</SelectItem>
            {["Application", "CAS", "Visa", "Departure", "End-to-End"].map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={country} onValueChange={setCountry}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">All countries</SelectItem>
            {db.countries.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No process maps" description="The admin team hasn't published any guides matching your filters yet." />
      ) : (
        <div className="space-y-4">
          {rows.map((m) => (
            <Card key={m.id} className="p-5">
              <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-foreground">{m.title}</h3>
                    <StatusBadge status={m.status} />
                    <span className="text-xs text-muted-foreground">{m.type}{cName(m.countryId) ? ` · ${cName(m.countryId)}` : ""}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{m.steps.length} step(s)</p>
                </div>
              </div>
              <div className="flex items-stretch gap-2 overflow-x-auto pb-2">
                {m.steps.map((s, i) => (
                  <div key={s.id} className="flex items-center gap-2">
                    <div className="min-w-[220px] max-w-[260px] rounded-lg border border-border bg-muted/40 p-3">
                      <div className="text-xs text-muted-foreground mb-1">Step {i + 1} · {s.owner ?? "—"}</div>
                      <div className="text-sm font-medium text-foreground">{s.title}</div>
                      {s.duration && <div className="text-xs text-muted-foreground mt-1">{s.duration}</div>}
                      {s.description && <div className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{s.description}</div>}
                    </div>
                    {i < m.steps.length - 1 && <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />}
                  </div>
                ))}
                {m.steps.length === 0 && <p className="text-sm text-muted-foreground">No steps yet.</p>}
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
