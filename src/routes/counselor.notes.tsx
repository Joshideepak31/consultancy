import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Pin, Search } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDB } from "@/lib/store";

export const Route = createFileRoute("/counselor/notes")({ component: Page });

const CATS = ["Embassy", "Visa Policy", "University Update", "Process", "Escalation", "Other"] as const;

function Page() {
  const db = useDB();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("__all");
  const [country, setCountry] = useState("__all");

  const cName = (id?: string) => db.countries.find((c) => c.id === id)?.name;
  const uName = (id?: string) => db.universities.find((u) => u.id === id)?.name;

  const rows = useMemo(() => {
    return db.notes
      .filter((n) =>
        n.title.toLowerCase().includes(q.toLowerCase()) ||
        n.body.toLowerCase().includes(q.toLowerCase()),
      )
      .filter((n) => cat === "__all" || n.category === cat)
      .filter((n) => country === "__all" || n.countryId === country)
      .sort((a, b) => {
        if (!!b.pinned !== !!a.pinned) return b.pinned ? 1 : -1;
        return b.updatedAt.localeCompare(a.updatedAt);
      });
  }, [db.notes, q, cat, country]);

  return (
    <>
      <PageHeader title="Knowledge Notes" description="Latest updates from the admin team — embassy news, visa changes, university bulletins." />
      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-60">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search notes..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select value={cat} onValueChange={setCat}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">All categories</SelectItem>
            {CATS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
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
        <EmptyState title="No notes" description="No knowledge notes match your filters yet." />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {rows.map((n) => (
            <Card key={n.id} className="p-5">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  {n.pinned && <Pin className="h-4 w-4 text-primary fill-primary" />}
                  <h3 className="font-semibold text-foreground">{n.title}</h3>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border whitespace-nowrap">{n.category}</span>
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{n.body}</p>
              <div className="flex items-center justify-between mt-3 pt-3 border-t text-xs text-muted-foreground">
                <span>
                  {[cName(n.countryId), uName(n.universityId)].filter(Boolean).join(" · ") || "General"}
                </span>
                <span>Updated {new Date(n.updatedAt).toLocaleDateString()}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
