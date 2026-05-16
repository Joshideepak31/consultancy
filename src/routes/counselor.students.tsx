import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, EmptyState } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { useDB, deleteStudent } from "@/lib/store";
import { Trash2 } from "lucide-react";

export const Route = createFileRoute("/counselor/students")({ component: Page });

function Page() {
  const db = useDB();
  return (
    <>
      <PageHeader title="Saved Students" description="Profiles you've captured during counseling sessions." />
      {db.students.length === 0 ? (
        <EmptyState
          title="No students yet"
          description="Use the Student Matcher to capture a student's details and save the profile."
          action={<Button asChild><Link to="/counselor/matcher">Open Student Matcher</Link></Button>}
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Field</TableHead>
                <TableHead>IELTS</TableHead>
                <TableHead>GPA</TableHead>
                <TableHead>Saved</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {db.students.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.fullName || "—"}</TableCell>
                  <TableCell>{s.preferredLevel || "—"}</TableCell>
                  <TableCell>{s.preferredCategory || "—"}</TableCell>
                  <TableCell>{s.ielts ?? "—"}</TableCell>
                  <TableCell>{s.gpa ?? "—"}</TableCell>
                  <TableCell>{new Date(s.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => { if (confirm("Delete?")) deleteStudent(s.id); }}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </>
  );
}