import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDB, finalFee } from "@/lib/store";
import { Search, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/counselor/programs")({ component: Page });

function Page() {
  const db = useDB();
  const [q, setQ] = useState("");
  const [level, setLevel] = useState("__all");
  const [country, setCountry] = useState("__all");

  const uMap = useMemo(() => new Map(db.universities.map((u) => [u.id, u])), [db.universities]);
  const cMap = useMemo(() => new Map(db.countries.map((c) => [c.id, c])), [db.countries]);

  const rows = db.programs
    .filter((p) => p.status !== "Archived")
    .filter((p) => p.name.toLowerCase().includes(q.toLowerCase()))
    .filter((p) => level === "__all" || p.level === level)
    .filter((p) => country === "__all" || uMap.get(p.universityId)?.countryId === country);

  return (
    <>
      <PageHeader title="Programs" description="Search programs across universities." />
      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-60">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search program..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select value={country} onValueChange={setCountry}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">All countries</SelectItem>
            {db.countries.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={level} onValueChange={setLevel}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">All levels</SelectItem>
            {["Foundation", "Diploma", "Undergraduate", "International Year One", "Postgraduate", "MBA", "PhD"].map((l) => (
              <SelectItem key={l} value={l}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Program</TableHead>
              <TableHead>University</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Intakes</TableHead>
              <TableHead className="text-right">Final fee</TableHead>
              <TableHead>IELTS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((p) => {
              const u = uMap.get(p.universityId);
              const c = u ? cMap.get(u.countryId) : undefined;
              return (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">
                    <Link
                      to="/counselor/programs/$programId"
                      params={{ programId: p.id }}
                      className="inline-flex items-center hover:underline text-primary"
                    >
                      {p.name}<ChevronRight className="h-3.5 w-3.5 ml-1 opacity-60" />
                    </Link>
                  </TableCell>
                  <TableCell>{u?.name ?? "—"}</TableCell>
                  <TableCell>{c?.name ?? "—"}</TableCell>
                  <TableCell>{p.level}</TableCell>
                  <TableCell className="text-xs">{p.intakes?.join(", ") ?? "—"}</TableCell>
                  <TableCell className="text-right">{p.currency ?? ""} {finalFee(p).toLocaleString()}</TableCell>
                  <TableCell>{p.ieltsOverall ?? (p.moiAccepted ? "MOI" : "—")}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}