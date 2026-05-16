import { createFileRoute, Navigate, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { useDB, finalFee } from "@/lib/store";

export const Route = createFileRoute("/counselor/programs/$programId")({ component: Page });

function Page() {
  const { programId } = Route.useParams();
  const db = useDB();
  const program = db.programs.find((p) => p.id === programId);
  const university = program ? db.universities.find((u) => u.id === program.universityId) : undefined;
  const country = university ? db.countries.find((c) => c.id === university.countryId) : undefined;

  if (!program) return <Navigate to="/counselor/programs" />;

  const cur = program.currency ?? "";
  const fmt = (n?: number) => (n != null ? `${cur} ${n.toLocaleString()}` : "—");

  return (
    <>
      <PageHeader
        backTo="/counselor/programs"
        title={program.name}
        description={`${country?.flag ?? ""} ${country?.name ?? ""}${university ? ` · ${university.name}` : ""}`}
        actions={
          university && country ? (
            <Link
              to="/counselor/countries/$countryId/universities/$universityId"
              params={{ countryId: country.id, universityId: university.id }}
              className="text-sm text-primary hover:underline"
            >
              View university →
            </Link>
          ) : null
        }
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <Info label="Level" value={program.level} />
        <Info label="Duration" value={program.duration ?? "—"} />
        <Info label="Faculty" value={program.faculty ?? "—"} />
        <Info label="Category" value={program.category ?? "—"} />
      </div>

      <Section title="Overview">
        <Row k="Description" v={program.description ?? "—"} />
        <Row k="Intakes" v={program.intakes?.join(", ") ?? "—"} />
        <Row k="Application deadline" v={program.applicationDeadline ?? "—"} />
        <Row k="Placement" v={program.placement ? "Yes" : "No"} />
        <Row k="Intake notes" v={program.intakeNotes ?? "—"} />
      </Section>

      <Section title="Fees">
        <Row k="Annual tuition" v={fmt(program.annualTuition)} />
        <Row k="Total tuition" v={fmt(program.totalTuition)} />
        <Row k="Application fee" v={fmt(program.applicationFee)} />
        <Row k="Deposit" v={fmt(program.deposit)} />
        <Row k="Other fees" v={fmt(program.otherFees)} />
        <Row k="Scholarship available" v={program.scholarshipAvailable ? "Yes" : "No"} />
        <Row k="Scholarship amount" v={fmt(program.scholarshipAmount)} />
        <Row k="Scholarship %" v={program.scholarshipPercentage != null ? `${program.scholarshipPercentage}%` : "—"} />
        <Row k="Final fee" v={`${cur} ${finalFee(program).toLocaleString()}`} />
        <Row k="Fee notes" v={program.feeNotes ?? "—"} />
      </Section>

      <Section title="Academic requirements">
        <Row k="Min GPA" v={program.minGpa ?? "—"} />
        <Row k="Min Plus 2" v={program.minPlus2 ?? "—"} />
        <Row k="Min bachelor" v={program.minBachelor ?? "—"} />
        <Row k="Academic background" v={program.academicBackground ?? "—"} />
        <Row k="Related background required" v={program.relatedBackground ? "Yes" : "No"} />
        <Row k="Work experience required" v={program.workExperience ? "Yes" : "No"} />
        <Row k="Portfolio required" v={program.portfolio ? "Yes" : "No"} />
      </Section>

      <Section title="English requirements">
        <Row k="IELTS overall" v={program.ieltsOverall ?? "—"} />
        <Row k="PTE score" v={program.pteScore ?? "—"} />
        <Row k="MOI accepted" v={program.moiAccepted ? "Yes" : "No"} />
      </Section>
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="p-5 mb-4">
      <h3 className="text-sm font-semibold text-foreground mb-3">{title}</h3>
      <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">{children}</dl>
    </Card>
  );
}

function Row({ k, v }: { k: string; v: string | number }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border/50 py-1.5 last:border-0">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="text-foreground font-medium text-right">{v}</dd>
    </div>
  );
}