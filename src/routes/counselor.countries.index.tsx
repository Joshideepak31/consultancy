import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/page-header";
import { useDB } from "@/lib/store";

export const Route = createFileRoute("/counselor/countries/")({ component: Page });

function Page() {
  const db = useDB();
  const [q, setQ] = useState("");
  const rows = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return db.countries
      .filter((c) => c.status !== "Archived")
      .filter((c) => !ql || c.name.toLowerCase().includes(ql))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [db.countries, q]);
  const counts = (cid: string) => {
    const unis = db.universities.filter((u) => u.countryId === cid);
    const uniIds = new Set(unis.map((u) => u.id));
    return { unis: unis.length, progs: db.programs.filter((p) => uniIds.has(p.universityId)).length };
  };
  return (
    <>
      <PageHeader title="Countries" description="Browse countries, then drill into universities and courses." />
      <Card className="p-4 mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search country..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </Card>
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Country</TableHead>
              <TableHead>Currency</TableHead>
              <TableHead>PSW</TableHead>
              <TableHead>Dependents</TableHead>
              <TableHead className="text-right">Universities</TableHead>
              <TableHead className="text-right">Courses</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((c) => {
              const k = counts(c.id);
              return (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">
                    <Link
                      to="/counselor/countries/$countryId"
                      params={{ countryId: c.id }}
                      className="inline-flex items-center hover:underline text-primary"
                    >
                      <span className="mr-2">{c.flag}</span>{c.name}
                      <ChevronRight className="h-3.5 w-3.5 ml-1 opacity-60" />
                    </Link>
                  </TableCell>
                  <TableCell>{c.currency}</TableCell>
                  <TableCell>{c.pswDuration ?? "—"}</TableCell>
                  <TableCell>{c.dependentAllowed === undefined ? "—" : c.dependentAllowed ? "Yes" : "No"}</TableCell>
                  <TableCell className="text-right">{k.unis}</TableCell>
                  <TableCell className="text-right">{k.progs}</TableCell>
                </TableRow>
              );
            })}
            {rows.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">No countries found.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}