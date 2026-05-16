import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDB } from "@/lib/store";
import { Search } from "lucide-react";

export const Route = createFileRoute("/counselor/universities")({ component: Page });

function Page() {
  const db = useDB();
  const [q, setQ] = useState("");
  const [country, setCountry] = useState("__all");
  const rows = db.universities
    .filter((u) => u.status !== "Archived")
    .filter((u) => u.name.toLowerCase().includes(q.toLowerCase()))
    .filter((u) => country === "__all" || u.countryId === country);
  const cName = (id: string) => db.countries.find((c) => c.id === id)?.name ?? "—";
  return (
    <>
      <PageHeader title="Universities" description="Browse universities verified by the admin team." />
      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-60">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select value={country} onValueChange={setCountry}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">All countries</SelectItem>
            {db.countries.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {rows.map((u) => (
          <Card key={u.id} className="p-5">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold text-foreground">{u.name}</h3>
                <p className="text-xs text-muted-foreground">{cName(u.countryId)} · {u.city ?? "—"}</p>
              </div>
              {u.scholarshipAvailable && <span className="text-xs px-2 py-0.5 rounded-full bg-success/15 text-success border border-success/30">Scholarship</span>}
            </div>
            <dl className="text-xs space-y-1.5 mt-3">
              <Row k="MOI accepted" v={u.moi ? "Yes" : "No"} />
              <Row k="IELTS overall" v={u.ieltsOverall ?? "—"} />
              <Row k="Min GPA (UG)" v={u.minGpaUg ?? "—"} />
              <Row k="Avg tuition" v={u.avgTuition ? u.avgTuition.toLocaleString() : "—"} />
              <Row k="Visa confidence" v={u.visaConfidence ?? "—"} />
            </dl>
          </Card>
        ))}
      </div>
    </>
  );
}

function Row({ k, v }: { k: string; v: string | number }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="text-foreground font-medium text-right">{v}</dd>
    </div>
  );
}