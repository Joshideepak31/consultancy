import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, BadgeDollarSign, GraduationCap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/page-header";
import { useDB, finalFee } from "@/lib/store";

export const Route = createFileRoute("/admin/fees")({ component: Page });

function Page() {
  const db = useDB();
  const [q, setQ] = useState("");
  const [country, setCountry] = useState("__all");
  const [scholarship, setScholarship] = useState("__all");

  const uniMap = useMemo(() => Object.fromEntries(db.universities.map((u) => [u.id, u])), [db.universities]);
  const countryMap = useMemo(() => Object.fromEntries(db.countries.map((c) => [c.id, c.name])), [db.countries]);

  const rows = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return db.programs
      .map((p) => ({ p, u: uniMap[p.universityId] }))
      .filter(({ p, u }) => {
        if (!u) return false;
        if (ql && !p.name.toLowerCase().includes(ql) && !u.name.toLowerCase().includes(ql)) return false;
        if (country !== "__all" && u.countryId !== country) return false;
        if (scholarship === "yes" && !p.scholarshipAvailable) return false;
        if (scholarship === "no" && p.scholarshipAvailable) return false;
        return true;
      });
  }, [db.programs, uniMap, q, country, scholarship]);

  const totalScholarship = rows.filter((r) => r.p.scholarshipAvailable).length;
  const avgFinal = rows.length
    ? Math.round(rows.reduce((acc, r) => acc + finalFee(r.p), 0) / rows.length)
    : 0;

  return (
    <>
      <PageHeader
        title="Fees & Scholarships"
        description="Centralised view of program fees and scholarship rules across universities."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Stat icon={<BadgeDollarSign className="h-4 w-4" />} label="Programs" value={rows.length.toString()} />
        <Stat icon={<GraduationCap className="h-4 w-4 text-success" />} label="With scholarship" value={totalScholarship.toString()} />
        <Stat icon={<BadgeDollarSign className="h-4 w-4" />} label="Avg. final fee" value={avgFinal.toLocaleString()} />
        <Stat icon={<BadgeDollarSign className="h-4 w-4" />} label="Universities" value={db.universities.length.toString()} />
      </div>

      <Card className="p-4 mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-60">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search programs..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select value={country} onValueChange={setCountry}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">All countries</SelectItem>
            {db.countries.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={scholarship} onValueChange={setScholarship}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">All programs</SelectItem>
            <SelectItem value="yes">Scholarship only</SelectItem>
            <SelectItem value="no">No scholarship</SelectItem>
          </SelectContent>
        </Select>
      </Card>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Program</TableHead>
              <TableHead>University</TableHead>
              <TableHead>Country</TableHead>
              <TableHead className="text-right">Tuition</TableHead>
              <TableHead className="text-right">Scholarship</TableHead>
              <TableHead className="text-right">Final fee</TableHead>
              <TableHead>App. fee</TableHead>
              <TableHead>Deposit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(({ p, u }) => {
              const tuition = p.totalTuition ?? p.annualTuition ?? 0;
              const sch = p.scholarshipAmount ?? (p.scholarshipPercentage ? Math.round((tuition * p.scholarshipPercentage) / 100) : 0);
              return (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">
                    <Link to="/admin/programs" className="hover:underline">{p.name}</Link>
                  </TableCell>
                  <TableCell>{u.name}</TableCell>
                  <TableCell>{countryMap[u.countryId] ?? "—"}</TableCell>
                  <TableCell className="text-right">{p.currency ?? ""} {tuition.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{sch ? `${p.currency ?? ""} ${sch.toLocaleString()}${p.scholarshipPercentage ? ` (${p.scholarshipPercentage}%)` : ""}` : "—"}</TableCell>
                  <TableCell className="text-right font-semibold">{p.currency ?? ""} {finalFee(p).toLocaleString()}</TableCell>
                  <TableCell>{p.applicationFee ? `${p.currency ?? ""} ${p.applicationFee.toLocaleString()}` : "—"}</TableCell>
                  <TableCell>{p.deposit ? `${p.currency ?? ""} ${p.deposit.toLocaleString()}` : "—"}</TableCell>
                </TableRow>
              );
            })}
            {rows.length === 0 && (
              <TableRow><TableCell colSpan={8} className="text-center py-10 text-muted-foreground">No programs match.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">{icon}{label}</div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
    </Card>
  );
}