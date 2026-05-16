import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, ChevronRight, Building2, GraduationCap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PageHeader } from "@/components/page-header";
import { useDB, finalFee } from "@/lib/store";

export const Route = createFileRoute("/counselor/countries/$countryId")({ component: Page });

function Page() {
  const { countryId } = Route.useParams();
  const db = useDB();
  const country = db.countries.find((c) => c.id === countryId);
  const [tab, setTab] = useState<"universities" | "courses">("universities");
  const [q, setQ] = useState("");
  const [pq, setPq] = useState("");

  const universities = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return db.universities
      .filter((u) => u.countryId === countryId && u.status !== "Archived")
      .filter((u) => !ql || u.name.toLowerCase().includes(ql))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [db.universities, countryId, q]);

  const programRows = useMemo(() => {
    const ql = pq.trim().toLowerCase();
    const ids = new Set(db.universities.filter((u) => u.countryId === countryId).map((u) => u.id));
    return db.programs
      .filter((p) => ids.has(p.universityId) && p.status !== "Archived")
      .filter((p) => !ql || p.name.toLowerCase().includes(ql))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [db.programs, db.universities, countryId, pq]);

  const uniName = (uid: string) => db.universities.find((u) => u.id === uid)?.name ?? "—";
  const programCount = (uid: string) => db.programs.filter((p) => p.universityId === uid).length;

  if (!country) return <Navigate to="/counselor/countries" />;

  return (
    <>
      <PageHeader
        backTo="/counselor/countries"
        title={`${country.flag ?? ""} ${country.name}`}
        description="Universities and courses available in this country."
      />

      <div className="grid sm:grid-cols-3 gap-3 mb-4">
        <Stat icon={<Building2 className="h-4 w-4" />} label="Universities" value={universities.length} />
        <Stat icon={<GraduationCap className="h-4 w-4" />} label="Courses" value={programRows.length} />
        <Stat label="Currency" value={country.currency || "—"} />
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as "universities" | "courses")} className="w-full">
        <TabsList className="w-full justify-start mb-4">
          <TabsTrigger value="universities"><Building2 className="h-4 w-4 mr-1.5" />Universities</TabsTrigger>
          <TabsTrigger value="courses"><GraduationCap className="h-4 w-4 mr-1.5" />Courses</TabsTrigger>
        </TabsList>

        <TabsContent value="universities" className="mt-0 space-y-4">
          <Card className="p-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search university..." value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
          </Card>
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>University</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>MOI</TableHead>
                  <TableHead>IELTS</TableHead>
                  <TableHead className="text-right">Courses</TableHead>
                  <TableHead>Scholarship</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {universities.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">
                      <Link
                        to="/counselor/countries/$countryId/universities/$universityId"
                        params={{ countryId, universityId: u.id }}
                        className="inline-flex items-center hover:underline text-primary"
                      >
                        {u.name}<ChevronRight className="h-3.5 w-3.5 ml-1 opacity-60" />
                      </Link>
                    </TableCell>
                    <TableCell>{u.city ?? "—"}</TableCell>
                    <TableCell>{u.moi === undefined ? "—" : u.moi ? "Yes" : "No"}</TableCell>
                    <TableCell>{u.ieltsOverall ?? "—"}</TableCell>
                    <TableCell className="text-right">{programCount(u.id)}</TableCell>
                    <TableCell>{u.scholarshipAvailable ? "Yes" : "—"}</TableCell>
                  </TableRow>
                ))}
                {universities.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">No universities yet.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="courses" className="mt-0 space-y-4">
          <Card className="p-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search course..." value={pq} onChange={(e) => setPq(e.target.value)} />
            </div>
          </Card>
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead>University</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead className="text-right">Final fee</TableHead>
                  <TableHead>IELTS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {programRows.map((p) => (
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
                    <TableCell>
                      <Link
                        to="/counselor/countries/$countryId/universities/$universityId"
                        params={{ countryId, universityId: p.universityId }}
                        className="hover:underline text-primary"
                      >{uniName(p.universityId)}</Link>
                    </TableCell>
                    <TableCell>{p.level}</TableCell>
                    <TableCell>{p.duration ?? "—"}</TableCell>
                    <TableCell className="text-right">{p.currency ?? ""} {finalFee(p).toLocaleString()}</TableCell>
                    <TableCell>{p.ieltsOverall ?? (p.moiAccepted ? "MOI" : "—")}</TableCell>
                  </TableRow>
                ))}
                {programRows.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">No courses yet.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}

function Stat({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string | number }) {
  return (
    <Card className="p-4">
      <div className="text-xs text-muted-foreground flex items-center gap-1.5">{icon}{label}</div>
      <div className="text-xl font-semibold mt-1">{value}</div>
    </Card>
  );
}