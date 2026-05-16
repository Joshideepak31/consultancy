import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Trash2, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader, EmptyState } from "@/components/page-header";
import { useDB, clearAudit } from "@/lib/store";

export const Route = createFileRoute("/admin/audit")({ component: Page });

const ACTION_COLOR: Record<string, string> = {
  create: "bg-success/15 text-success border-success/30",
  update: "bg-primary/15 text-primary border-primary/30",
  delete: "bg-destructive/10 text-destructive border-destructive/30",
  verify: "bg-success/15 text-success border-success/30",
  archive: "bg-muted text-muted-foreground border-border",
};

function Page() {
  const db = useDB();
  const [q, setQ] = useState("");
  const [action, setAction] = useState("__all");

  const rows = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return db.audit
      .filter((a) => action === "__all" || a.action === action)
      .filter((a) => !ql || a.entityName.toLowerCase().includes(ql) || a.actor.toLowerCase().includes(ql) || a.entity.toLowerCase().includes(ql));
  }, [db.audit, q, action]);

  return (
    <>
      <PageHeader
        title="Audit Log"
        description="Track who created, edited, verified or deleted each record."
        actions={db.audit.length > 0 && (
          <Button variant="outline" onClick={() => { if (confirm("Clear all audit entries?")) clearAudit(); }}>
            <Trash2 className="h-4 w-4 mr-1" /> Clear log
          </Button>
        )}
      />

      <Card className="p-4 mb-4 flex flex-wrap gap-3">
        <Input className="flex-1 min-w-60" placeholder="Search by entity, actor or name..." value={q} onChange={(e) => setQ(e.target.value)} />
        <Select value={action} onValueChange={setAction}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">All actions</SelectItem>
            <SelectItem value="create">Create</SelectItem>
            <SelectItem value="update">Update</SelectItem>
            <SelectItem value="delete">Delete</SelectItem>
            <SelectItem value="verify">Verify</SelectItem>
            <SelectItem value="archive">Archive</SelectItem>
          </SelectContent>
        </Select>
      </Card>

      {rows.length === 0 ? (
        <EmptyState title="No audit entries" description="Actions across the admin will be recorded here automatically." />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{new Date(a.at).toLocaleString()}</TableCell>
                  <TableCell>{a.actor}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${ACTION_COLOR[a.action]}`}>{a.action}</span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{a.entity}</TableCell>
                  <TableCell className="font-medium">{a.entityName}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{a.details ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </>
  );
}

export const _History = History;
