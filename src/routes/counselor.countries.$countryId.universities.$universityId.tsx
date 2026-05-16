import { createFileRoute, Navigate, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/page-header";
import { useDB, finalFee } from "@/lib/store";

export const Route = createFileRoute("/counselor/countries/$countryId/universities/$universityId")({ component: Page });

function Page() {
  const { countryId, universityId } = Route.useParams();
  const db = useDB();
  const country = db.countries.find((c) => c.id === countryId);
  const university = db.universities.find((u) => u.id === universityId);
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return db.programs
      .filter((p) => p.universityId === universityId && p.status !== "Archived")
      .filter((p) => !ql || p.name.toLowerCase().includes(ql))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [db.programs, universityId, q]);

  if (!country || !university) return <Navigate to="/counselor/countries" />;

  return (
    <>
      <PageHeader
        backTo={`/counselor/countries/${countryId}`}
        title={university.name}
        description={`${country.flag ?? ""} ${country.name}${university.city ? ` · ${university.city}` : ""}`}
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <Info label="MOI accepted" value={university.moi ? "Yes" : "No"} />
        <Info label="IELTS overall" value={university.ieltsOverall ?? "—"} />
        <Info label="Min GPA (UG)" value={university.minGpaUg ?? "—"} />
        <Info label="Visa confidence" value={university.visaConfidence ?? "—"} />
      </div>

      <Card className="p-4 mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search course..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </Card>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Course</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Intakes</TableHead>
              <TableHead className="text-right">Tuition</TableHead>
              <TableHead className="text-right">Final fee</TableHead>
              <TableHead>IELTS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((p) => (
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
                <TableCell>{p.level}</TableCell>
                <TableCell>{p.duration ?? "—"}</TableCell>
                <TableCell className="text-xs">{p.intakes?.join(", ") ?? "—"}</TableCell>
                <TableCell className="text-right">{p.annualTuition ? `${p.currency ?? ""} ${p.annualTuition.toLocaleString()}` : "—"}</TableCell>
                <TableCell className="text-right">{p.currency ?? ""} {finalFee(p).toLocaleString()}</TableCell>
                <TableCell>{p.ieltsOverall ?? (p.moiAccepted ? "MOI" : "—")}</TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">No courses yet.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}

function Info({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-base font-semibold mt-1">{value}</div>
    </Card>
  );
}