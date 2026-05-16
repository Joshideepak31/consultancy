import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  FileText, FileType, ImageIcon, Search, Folder as FolderIcon,
  ChevronRight, Home,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageHeader, EmptyState } from "@/components/page-header";
import { useDB } from "@/lib/store";
import type { MediaItem, Folder } from "@/lib/types";

export const Route = createFileRoute("/counselor/media")({ component: Page });

function Page() {
  const db = useDB();
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [preview, setPreview] = useState<MediaItem | null>(null);

  const folders = db.folders ?? [];
  const term = q.trim().toLowerCase();

  const trail = useMemo(() => {
    const out: Folder[] = [];
    let cur: string | null = currentFolder;
    while (cur) {
      const f = folders.find((x) => x.id === cur);
      if (!f) break;
      out.unshift(f);
      cur = f.parentId ?? null;
    }
    return out;
  }, [currentFolder, folders]);

  const childFolders = folders
    .filter((f) => (f.parentId ?? null) === currentFolder)
    .filter((f) => !term || f.name.toLowerCase().includes(term))
    .sort((a, b) => a.name.localeCompare(b.name));

  const filesHere = db.media
    .filter((m) => (m.folderId ?? null) === currentFolder)
    .filter((m) => !term ||
      m.title.toLowerCase().includes(term) ||
      m.kind.toLowerCase().includes(term) ||
      (m.description ?? "").toLowerCase().includes(term))
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));

  const total = db.media.length;

  return (
    <>
      <PageHeader
        title="Document Hub"
        description="Browse brochures, fee sheets and reference files organized by Superadmin."
      />

      <Card className="p-3 mb-4 flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground ml-1" />
        <Input
          placeholder="Search this folder…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="border-0 focus-visible:ring-0 shadow-none"
        />
        <Badge variant="secondary">{total} file{total === 1 ? "" : "s"} total</Badge>
      </Card>

      {/* Breadcrumb */}
      <Card className="p-3 mb-4 flex items-center gap-1 flex-wrap text-sm">
        <button
          onClick={() => setCurrentFolder(null)}
          className="flex items-center gap-1 px-2 py-1 rounded hover:bg-muted text-foreground"
        >
          <Home className="h-3.5 w-3.5" /> Home
        </button>
        {trail.map((f) => (
          <span key={f.id} className="flex items-center gap-1">
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            <button
              onClick={() => setCurrentFolder(f.id)}
              className="px-2 py-1 rounded hover:bg-muted"
            >
              {f.name}
            </button>
          </span>
        ))}
      </Card>

      {childFolders.length === 0 && filesHere.length === 0 ? (
        <EmptyState
          title={total === 0 ? "No documents yet" : "Nothing here"}
          description={total === 0
            ? "Once Superadmin uploads files, they'll appear here."
            : "This folder is empty or no items match your search."}
        />
      ) : (
        <div className="space-y-6">
          {childFolders.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Folders</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {childFolders.map((f) => {
                  const itemCount =
                    db.media.filter((m) => m.folderId === f.id).length +
                    folders.filter((x) => x.parentId === f.id).length;
                  return (
                    <button
                      key={f.id}
                      onClick={() => setCurrentFolder(f.id)}
                      className="text-left"
                    >
                      <Card className="p-3 flex items-center gap-3 hover:border-primary/40 transition">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <FolderIcon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium truncate">{f.name}</div>
                          <div className="text-xs text-muted-foreground">{itemCount} item{itemCount === 1 ? "" : "s"}</div>
                        </div>
                      </Card>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {filesHere.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Files</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {filesHere.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPreview(m)}
                    className="text-left rounded-lg border bg-card overflow-hidden hover:shadow-md hover:border-primary/40 transition group"
                  >
                    <div className="aspect-video bg-muted relative flex items-center justify-center">
                      {m.mime?.startsWith("image/") ? (
                        <img src={m.url} alt={m.title} className="w-full h-full object-cover" />
                      ) : m.mime?.includes("pdf") ? (
                        <FileType className="h-10 w-10 text-muted-foreground" />
                      ) : (
                        <FileText className="h-10 w-10 text-muted-foreground" />
                      )}
                      <Badge variant="secondary" className="absolute top-2 right-2 text-[10px]">{m.kind}</Badge>
                    </div>
                    <div className="p-2">
                      <div className="text-xs font-medium truncate group-hover:text-primary">{m.title}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <Dialog open={!!preview} onOpenChange={(v) => { if (!v) setPreview(null); }}>
        <DialogContent className="max-w-4xl">
          <DialogHeader><DialogTitle>{preview?.title}</DialogTitle></DialogHeader>
          {preview && (
            <>
              {preview.mime?.startsWith("image/") ? (
                <img src={preview.url} alt={preview.title} className="w-full max-h-[70vh] object-contain rounded" />
              ) : (
                <iframe src={preview.url} title={preview.title} className="w-full h-[70vh] rounded border" />
              )}
              {preview.description && <p className="text-sm text-muted-foreground mt-2">{preview.description}</p>}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{preview.kind}</span>
                <a href={preview.url} download={preview.title} className="text-primary hover:underline">Download</a>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export const _ImageIcon = ImageIcon;
