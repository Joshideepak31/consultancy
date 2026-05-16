import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import {
  Upload, Trash2, FileText, FileType, Folder as FolderIcon, FolderPlus,
  ChevronRight, Home, Image as ImageIcon, Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader, EmptyState } from "@/components/page-header";
import {
  useDB, upsertMedia, deleteMedia, upsertFolder, deleteFolder, id, logAudit,
} from "@/lib/store";
import type { MediaItem, Folder } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/media")({ component: Page });

function Page() {
  const db = useDB();
  const fileRef = useRef<HTMLInputElement>(null);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [pending, setPending] = useState<MediaItem | null>(null);
  const [preview, setPreview] = useState<MediaItem | null>(null);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [renaming, setRenaming] = useState<Folder | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const folders = db.folders ?? [];
  const childFolders = folders
    .filter((f) => (f.parentId ?? null) === currentFolder)
    .sort((a, b) => a.name.localeCompare(b.name));
  const filesHere = db.media
    .filter((m) => (m.folderId ?? null) === currentFolder)
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));

  // breadcrumb path
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

  const onPick = async (file: File) => {
    if (file.size > 4 * 1024 * 1024) {
      toast.error("Max 4MB for browser-stored uploads.");
      return;
    }
    const url = await new Promise<string>((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(String(r.result));
      r.onerror = () => rej(r.error);
      r.readAsDataURL(file);
    });
    setPending({
      id: id(),
      title: file.name.replace(/\.[^.]+$/, ""),
      kind: file.type.includes("pdf") ? "PDF" : file.type.startsWith("image/") ? "Screenshot" : "Other",
      url,
      mime: file.type,
      size: file.size,
      uploadedAt: new Date().toISOString(),
      folderId: currentFolder ?? undefined,
    });
  };

  const saveFile = () => {
    if (!pending) return;
    upsertMedia(pending);
    logAudit({ actor: "Admin", action: "create", entity: "Media", entityName: pending.title });
    toast.success(`Uploaded "${pending.title}"`);
    setPending(null);
  };

  const createFolder = () => {
    const name = newFolderName.trim();
    if (!name) return;
    const f: Folder = {
      id: id(),
      name,
      parentId: currentFolder ?? undefined,
      createdAt: new Date().toISOString(),
    };
    upsertFolder(f);
    logAudit({ actor: "Admin", action: "create", entity: "Media", entityName: `Folder: ${name}` });
    toast.success(`Folder "${name}" created`);
    setNewFolderName("");
    setNewFolderOpen(false);
  };

  const renameFolder = () => {
    if (!renaming) return;
    const name = renameValue.trim();
    if (!name) return;
    upsertFolder({ ...renaming, name });
    toast.success("Folder renamed");
    setRenaming(null);
    setRenameValue("");
  };

  const removeFolder = (f: Folder) => {
    if (!confirm(`Delete folder "${f.name}" and everything inside?`)) return;
    deleteFolder(f.id);
    logAudit({ actor: "Admin", action: "delete", entity: "Media", entityName: `Folder: ${f.name}` });
    toast.success("Folder deleted");
  };

  return (
    <>
      <PageHeader
        title="Document Hub"
        description="Organize brochures, fee sheets and reference files into folders. Counselors will browse the same structure."
        actions={
          <>
            <input
              ref={fileRef}
              type="file"
              hidden
              accept="image/*,application/pdf"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) onPick(f); e.target.value = ""; }}
            />
            <Button variant="outline" onClick={() => setNewFolderOpen(true)}>
              <FolderPlus className="h-4 w-4 mr-1" /> New folder
            </Button>
            <Button onClick={() => fileRef.current?.click()}>
              <Upload className="h-4 w-4 mr-1" /> Upload file
            </Button>
          </>
        }
      />

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
          title="This folder is empty"
          description="Create a subfolder or upload a file (4MB max)."
          action={
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setNewFolderOpen(true)}>
                <FolderPlus className="h-4 w-4 mr-1" /> New folder
              </Button>
              <Button onClick={() => fileRef.current?.click()}>
                <Upload className="h-4 w-4 mr-1" /> Upload file
              </Button>
            </div>
          }
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
                    <Card key={f.id} className="p-3 group hover:border-primary/40 transition">
                      <button
                        onClick={() => setCurrentFolder(f.id)}
                        className="flex items-center gap-3 w-full text-left"
                      >
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <FolderIcon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium truncate">{f.name}</div>
                          <div className="text-xs text-muted-foreground">{itemCount} item{itemCount === 1 ? "" : "s"}</div>
                        </div>
                      </button>
                      <div className="flex justify-end gap-1 mt-2 opacity-0 group-hover:opacity-100 transition">
                        <button
                          onClick={() => { setRenaming(f); setRenameValue(f.name); }}
                          className="p-1 rounded hover:bg-muted"
                          title="Rename"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => removeFolder(f)}
                          className="p-1 rounded hover:bg-muted"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {filesHere.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Files</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filesHere.map((m) => (
                  <Card key={m.id} className="overflow-hidden group">
                    <button
                      type="button"
                      onClick={() => setPreview(m)}
                      className="block w-full aspect-video bg-muted relative"
                    >
                      {m.mime?.startsWith("image/") ? (
                        <img src={m.url} alt={m.title} className="w-full h-full object-cover" />
                      ) : m.mime?.includes("pdf") ? (
                        <FileType className="h-10 w-10 m-auto text-muted-foreground absolute inset-0" />
                      ) : (
                        <FileText className="h-10 w-10 m-auto text-muted-foreground absolute inset-0" />
                      )}
                    </button>
                    <div className="p-3">
                      <div className="text-sm font-medium truncate">{m.title}</div>
                      <div className="text-xs text-muted-foreground flex items-center justify-between mt-1">
                        <span>{m.kind}</span>
                        <button onClick={() => {
                          if (confirm("Delete file?")) {
                            deleteMedia(m.id);
                            logAudit({ actor: "Admin", action: "delete", entity: "Media", entityName: m.title });
                          }
                        }}><Trash2 className="h-3.5 w-3.5 text-destructive" /></button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* New folder dialog */}
      <Dialog open={newFolderOpen} onOpenChange={(v) => { if (!v) { setNewFolderOpen(false); setNewFolderName(""); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>New folder</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Folder name</Label>
              <Input
                autoFocus
                placeholder="e.g. UK Universities"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") createFolder(); }}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => { setNewFolderOpen(false); setNewFolderName(""); }}>Cancel</Button>
              <Button onClick={createFolder}>Create</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rename folder dialog */}
      <Dialog open={!!renaming} onOpenChange={(v) => { if (!v) { setRenaming(null); setRenameValue(""); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Rename folder</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") renameFolder(); }}
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => { setRenaming(null); setRenameValue(""); }}>Cancel</Button>
              <Button onClick={renameFolder}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload details dialog */}
      <Dialog open={!!pending} onOpenChange={(v) => { if (!v) setPending(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add file details</DialogTitle></DialogHeader>
          {pending && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Title</Label>
                <Input value={pending.title} onChange={(e) => setPending({ ...pending, title: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Description (optional)</Label>
                <Input
                  value={pending.description ?? ""}
                  onChange={(e) => setPending({ ...pending, description: e.target.value })}
                />
              </div>
              <div className="text-xs text-muted-foreground">
                Saving to: {trail.length === 0 ? "Home" : trail.map((t) => t.name).join(" / ")}
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setPending(null)}>Cancel</Button>
                <Button onClick={saveFile}>Save</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Preview dialog */}
      <Dialog open={!!preview} onOpenChange={(v) => { if (!v) setPreview(null); }}>
        <DialogContent className="max-w-4xl">
          <DialogHeader><DialogTitle>{preview?.title}</DialogTitle></DialogHeader>
          {preview && (preview.mime?.startsWith("image/") ? (
            <img src={preview.url} alt={preview.title} className="w-full max-h-[70vh] object-contain rounded" />
          ) : (
            <iframe src={preview.url} title={preview.title} className="w-full h-[70vh] rounded border" />
          ))}
        </DialogContent>
      </Dialog>
    </>
  );
}

export const _ImageIcon = ImageIcon;
