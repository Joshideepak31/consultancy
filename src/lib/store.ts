import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type {
  AuditEntry, Counselor, Country, Folder, MediaItem, Note, ProcessMap, Program,
  Rule, Settings, Student, University,
} from "./types";

/**
 * Supabase-backed store with a sync read API to preserve existing call sites.
 * Strategy:
 *  - Load all collections once after sign-in into an in-memory cache.
 *  - useDB() returns the cache synchronously (via useSyncExternalStore).
 *  - upsert/delete update the cache optimistically and fire-and-forget the DB write.
 *    On error, we toast and reload from DB.
 *  - JSONB column `data` carries every optional field that doesn't have its own column.
 */

interface DB {
  countries: Country[];
  universities: University[];
  programs: Program[];
  students: Student[];
  rules: Rule[];
  media: MediaItem[];
  notes: Note[];
  counselors: Counselor[];
  audit: AuditEntry[];
  processMaps: ProcessMap[];
  folders: Folder[];
  settings: Settings;
}

const defaultSettings: Settings = {
  workspaceName: "EduIntel",
  defaultCurrency: "USD",
  primaryContact: "",
  brandTagline: "Knowledge-driven counseling",
  fiscalYearStart: "April",
};

const empty: DB = {
  countries: [], universities: [], programs: [], students: [],
  rules: [], media: [], notes: [], counselors: [],
  audit: [], processMaps: [], folders: [], settings: defaultSettings,
};

let cache: DB = empty;
let loaded = false;
let loadingPromise: Promise<void> | null = null;
const listeners = new Set<() => void>();
function emit() { listeners.forEach((l) => l()); }
function subscribe(l: () => void) { listeners.add(l); return () => listeners.delete(l); }

export const id = () => Math.random().toString(36).slice(2, 10);

// --- Row <-> Object packing helpers ---
// Domain object is split into "explicit columns" + "data" jsonb.

type ExplicitKeys<T> = (keyof T)[];

function pack<T>(obj: T, explicit: ExplicitKeys<T>): { cols: Record<string, unknown>; data: Record<string, unknown> } {
  const cols: Record<string, unknown> = {};
  const data: Record<string, unknown> = {};
  const o = obj as unknown as Record<string, unknown>;
  for (const k of Object.keys(o)) {
    if ((explicit as string[]).includes(k)) cols[k] = o[k];
    else data[k] = o[k];
  }
  return { cols, data };
}

function unpack<T>(row: Record<string, unknown>): T {
  const { data, ...rest } = row as { data?: Record<string, unknown> } & Record<string, unknown>;
  return { ...rest, ...(data ?? {}) } as T;
}

// snake_case <-> camelCase tiny helpers for explicit FK columns
function rowToCountry(r: Record<string, unknown>): Country {
  return unpack<Country>({ ...r, updatedAt: r.updated_at as string });
}
function rowToUniversity(r: Record<string, unknown>): University {
  return unpack<University>({ ...r, countryId: r.country_id, updatedAt: r.updated_at });
}
function rowToProgram(r: Record<string, unknown>): Program {
  return unpack<Program>({ ...r, universityId: r.university_id, updatedAt: r.updated_at });
}
function rowToStudent(r: Record<string, unknown>): Student {
  return unpack<Student>({ ...r, fullName: r.full_name, createdAt: r.created_at });
}
function rowToRule(r: Record<string, unknown>): Rule {
  return unpack<Rule>({ ...r, updatedAt: r.updated_at });
}
function rowToMedia(r: Record<string, unknown>): MediaItem {
  return unpack<MediaItem>({
    ...r,
    folderId: r.folder_id, countryId: r.country_id,
    universityId: r.university_id, programId: r.program_id,
    uploadedAt: r.uploaded_at,
  });
}
function rowToFolder(r: Record<string, unknown>): Folder {
  return unpack<Folder>({ ...r, parentId: r.parent_id, createdAt: r.created_at });
}
function rowToNote(r: Record<string, unknown>): Note {
  return unpack<Note>({ ...r, countryId: r.country_id, universityId: r.university_id, updatedAt: r.updated_at });
}
function rowToCounselor(r: Record<string, unknown>): Counselor {
  return unpack<Counselor>({ ...r, joinedAt: r.joined_at });
}
function rowToProcessMap(r: Record<string, unknown>): ProcessMap {
  return unpack<ProcessMap>({ ...r, countryId: r.country_id, updatedAt: r.updated_at });
}
function rowToAudit(r: Record<string, unknown>): AuditEntry {
  return { id: r.id as string, at: r.at as string, actor: r.actor as string,
    action: r.action as AuditEntry["action"], entity: r.entity as AuditEntry["entity"],
    entityName: r.entity_name as string, details: r.details as string | undefined };
}

// --- Loading ---
export async function loadAll(): Promise<void> {
  if (loadingPromise) return loadingPromise;
  loadingPromise = (async () => {
    const [
      countries, universities, programs, students, rules, media, folders,
      notes, counselors, processMaps, audit, settings,
    ] = await Promise.all([
      supabase.from("countries").select("*"),
      supabase.from("universities").select("*"),
      supabase.from("programs").select("*"),
      supabase.from("students").select("*"),
      supabase.from("rules").select("*"),
      supabase.from("media").select("*"),
      supabase.from("folders").select("*"),
      supabase.from("notes").select("*"),
      supabase.from("counselors").select("*"),
      supabase.from("process_maps").select("*"),
      supabase.from("audit").select("*").order("at", { ascending: false }).limit(500),
      supabase.from("settings").select("*").eq("id", 1).maybeSingle(),
    ]);

    const settingsData = (settings.data?.data as Settings | undefined) ?? defaultSettings;

    cache = {
      countries: (countries.data ?? []).map(rowToCountry),
      universities: (universities.data ?? []).map(rowToUniversity),
      programs: (programs.data ?? []).map(rowToProgram),
      students: (students.data ?? []).map(rowToStudent),
      rules: (rules.data ?? []).map(rowToRule),
      media: (media.data ?? []).map(rowToMedia),
      folders: (folders.data ?? []).map(rowToFolder),
      notes: (notes.data ?? []).map(rowToNote),
      counselors: (counselors.data ?? []).map(rowToCounselor),
      processMaps: (processMaps.data ?? []).map(rowToProcessMap),
      audit: (audit.data ?? []).map(rowToAudit),
      settings: { ...defaultSettings, ...settingsData },
    };
    loaded = true;
    emit();
  })();
  try { await loadingPromise; } finally { loadingPromise = null; }
}

export function clearCache() {
  cache = empty;
  loaded = false;
  emit();
}

export function isLoaded() { return loaded; }

// --- Hook ---
export function useDB(): DB {
  useSyncExternalStore(subscribe, () => loaded ? cache : empty, () => empty);
  return loaded ? cache : empty;
}

// Trigger initial load when the auth session appears.
if (typeof window !== "undefined") {
  supabase.auth.onAuthStateChange((_e, session) => {
    if (session) { loadAll().catch(console.error); }
    else { clearCache(); }
  });
  supabase.auth.getSession().then(({ data }) => {
    if (data.session) loadAll().catch(console.error);
  });
}

// --- Helpers ---
function setCache(next: DB) { cache = next; emit(); }
function showError(label: string, err: unknown) {
  console.error(label, err);
  toast.error(`${label} failed`, { description: err instanceof Error ? err.message : String(err) });
}

async function writeRow(table: string, row: Record<string, unknown>, label: string) {
  const { error } = await supabase.from(table as any).upsert(row);
  if (error) { showError(label, error); await loadAll(); }
}
async function deleteRow(table: string, rowId: string, label: string) {
  const { error } = await supabase.from(table as any).delete().eq("id", rowId);
  if (error) { showError(label, error); await loadAll(); }
}

// --- COUNTRIES ---
const COUNTRY_COLS: ExplicitKeys<Country> = ["id", "name", "flag", "currency", "status"];
export function listCountries() { return cache.countries; }
export function getCountry(cid: string) { return cache.countries.find((c) => c.id === cid); }
export function upsertCountry(c: Country) {
  const next = { ...c, updatedAt: new Date().toISOString() };
  const idx = cache.countries.findIndex((x) => x.id === c.id);
  setCache({ ...cache, countries: idx >= 0
    ? cache.countries.map((x, i) => i === idx ? next : x)
    : [...cache.countries, next] });
  const { cols, data } = pack(next, COUNTRY_COLS);
  writeRow("countries", { ...cols, data, updated_at: next.updatedAt }, "Save country");
}
export function deleteCountry(cid: string) {
  setCache({ ...cache, countries: cache.countries.filter((c) => c.id !== cid) });
  deleteRow("countries", cid, "Delete country");
}

// --- UNIVERSITIES ---
const UNI_COLS: ExplicitKeys<University> = ["id", "name", "status"];
export function listUniversities() { return cache.universities; }
export function getUniversity(uid: string) { return cache.universities.find((u) => u.id === uid); }
export function upsertUniversity(u: University) {
  const next = { ...u, updatedAt: new Date().toISOString() };
  const idx = cache.universities.findIndex((x) => x.id === u.id);
  setCache({ ...cache, universities: idx >= 0
    ? cache.universities.map((x, i) => i === idx ? next : x)
    : [...cache.universities, next] });
  const { cols, data } = pack(next, UNI_COLS);
  writeRow("universities", { ...cols, country_id: next.countryId, data, updated_at: next.updatedAt }, "Save university");
}
export function deleteUniversity(uid: string) {
  setCache({ ...cache, universities: cache.universities.filter((u) => u.id !== uid) });
  deleteRow("universities", uid, "Delete university");
}

// --- PROGRAMS ---
const PROG_COLS: ExplicitKeys<Program> = ["id", "name", "level", "status"];
export function listPrograms() { return cache.programs; }
export function getProgram(pid: string) { return cache.programs.find((p) => p.id === pid); }
export function upsertProgram(p: Program) {
  const next = { ...p, updatedAt: new Date().toISOString() };
  const idx = cache.programs.findIndex((x) => x.id === p.id);
  setCache({ ...cache, programs: idx >= 0
    ? cache.programs.map((x, i) => i === idx ? next : x)
    : [...cache.programs, next] });
  const { cols, data } = pack(next, PROG_COLS);
  writeRow("programs", { ...cols, university_id: next.universityId, data, updated_at: next.updatedAt }, "Save program");
}
export function deleteProgram(pid: string) {
  setCache({ ...cache, programs: cache.programs.filter((p) => p.id !== pid) });
  deleteRow("programs", pid, "Delete program");
}

// --- STUDENTS ---
const STUDENT_COLS: ExplicitKeys<Student> = ["id", "email"];
export function listStudents() { return cache.students; }
export function getStudent(sid: string) { return cache.students.find((s) => s.id === sid); }
export function upsertStudent(s: Student) {
  const idx = cache.students.findIndex((x) => x.id === s.id);
  setCache({ ...cache, students: idx >= 0
    ? cache.students.map((x, i) => i === idx ? s : x)
    : [...cache.students, s] });
  const { cols, data } = pack(s, STUDENT_COLS);
  // owner_id auto-set on insert via auth.uid() default? No — we need to send it.
  supabase.auth.getUser().then(({ data: u }) => {
    const ownerId = u.user?.id;
    writeRow("students", { ...cols, full_name: s.fullName, owner_id: ownerId, data, created_at: s.createdAt }, "Save student");
  });
}
export function deleteStudent(sid: string) {
  setCache({ ...cache, students: cache.students.filter((s) => s.id !== sid) });
  deleteRow("students", sid, "Delete student");
}

// --- RULES ---
const RULE_COLS: ExplicitKeys<Rule> = ["id", "title", "scope", "category", "status"];
export function upsertRule(r: Rule) {
  const next = { ...r, updatedAt: new Date().toISOString() };
  const idx = cache.rules.findIndex((x) => x.id === r.id);
  setCache({ ...cache, rules: idx >= 0
    ? cache.rules.map((x, i) => i === idx ? next : x)
    : [...cache.rules, next] });
  const { cols, data } = pack(next, RULE_COLS);
  writeRow("rules", { ...cols, data, updated_at: next.updatedAt }, "Save rule");
}
export function deleteRule(rid: string) {
  setCache({ ...cache, rules: cache.rules.filter((r) => r.id !== rid) });
  deleteRow("rules", rid, "Delete rule");
}

// --- MEDIA ---
const MEDIA_COLS: ExplicitKeys<MediaItem> = ["id", "title", "kind", "url"];
export function upsertMedia(m: MediaItem) {
  const idx = cache.media.findIndex((x) => x.id === m.id);
  setCache({ ...cache, media: idx >= 0
    ? cache.media.map((x, i) => i === idx ? m : x)
    : [...cache.media, m] });
  const { cols, data } = pack(m, MEDIA_COLS);
  writeRow("media", {
    ...cols, folder_id: m.folderId, country_id: m.countryId,
    university_id: m.universityId, program_id: m.programId,
    data, uploaded_at: m.uploadedAt,
  }, "Save media");
}
export function deleteMedia(mid: string) {
  setCache({ ...cache, media: cache.media.filter((m) => m.id !== mid) });
  deleteRow("media", mid, "Delete media");
}

// --- FOLDERS ---
const FOLDER_COLS: ExplicitKeys<Folder> = ["id", "name"];
export function upsertFolder(f: Folder) {
  const idx = cache.folders.findIndex((x) => x.id === f.id);
  setCache({ ...cache, folders: idx >= 0
    ? cache.folders.map((x, i) => i === idx ? f : x)
    : [...cache.folders, f] });
  const { cols, data } = pack(f, FOLDER_COLS);
  writeRow("folders", { ...cols, parent_id: f.parentId, data, created_at: f.createdAt }, "Save folder");
}
export function deleteFolder(fid: string) {
  // Remove descendants client-side too
  const all = cache.folders;
  const toDelete = new Set<string>([fid]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const f of all) {
      if (f.parentId && toDelete.has(f.parentId) && !toDelete.has(f.id)) {
        toDelete.add(f.id); changed = true;
      }
    }
  }
  setCache({
    ...cache,
    folders: all.filter((f) => !toDelete.has(f.id)),
    media: cache.media.filter((m) => !m.folderId || !toDelete.has(m.folderId)),
  });
  // Best-effort cascade: delete each id; media with those folder_ids will be untouched in DB
  // (fine since the cache hides them and reload would surface them again).
  // For correctness, also delete media rows tied to deleted folders.
  for (const fId of toDelete) {
    deleteRow("folders", fId, "Delete folder");
  }
  supabase.from("media").delete().in("folder_id", Array.from(toDelete));
}

// --- NOTES ---
const NOTE_COLS: ExplicitKeys<Note> = ["id", "title", "category", "body", "pinned"];
export function upsertNote(n: Note) {
  const next = { ...n, updatedAt: new Date().toISOString() };
  const idx = cache.notes.findIndex((x) => x.id === n.id);
  setCache({ ...cache, notes: idx >= 0
    ? cache.notes.map((x, i) => i === idx ? next : x)
    : [...cache.notes, next] });
  const { cols, data } = pack(next, NOTE_COLS);
  writeRow("notes", {
    ...cols, country_id: next.countryId, university_id: next.universityId,
    data, updated_at: next.updatedAt,
  }, "Save note");
}
export function deleteNote(nid: string) {
  setCache({ ...cache, notes: cache.notes.filter((n) => n.id !== nid) });
  deleteRow("notes", nid, "Delete note");
}

// --- COUNSELORS ---
const COUN_COLS: ExplicitKeys<Counselor> = ["id", "name", "email", "phone", "role", "active"];
export function upsertCounselor(c: Counselor) {
  const idx = cache.counselors.findIndex((x) => x.id === c.id);
  setCache({ ...cache, counselors: idx >= 0
    ? cache.counselors.map((x, i) => i === idx ? c : x)
    : [...cache.counselors, c] });
  const { cols, data } = pack(c, COUN_COLS);
  writeRow("counselors", { ...cols, data, joined_at: c.joinedAt }, "Save counselor");
}
export function deleteCounselor(cid: string) {
  setCache({ ...cache, counselors: cache.counselors.filter((c) => c.id !== cid) });
  deleteRow("counselors", cid, "Delete counselor");
}

// --- PROCESS MAPS ---
const PMAP_COLS: ExplicitKeys<ProcessMap> = ["id", "title", "type", "status"];
export function upsertProcessMap(p: ProcessMap) {
  const next = { ...p, updatedAt: new Date().toISOString() };
  const idx = cache.processMaps.findIndex((x) => x.id === p.id);
  setCache({ ...cache, processMaps: idx >= 0
    ? cache.processMaps.map((x, i) => i === idx ? next : x)
    : [...cache.processMaps, next] });
  const { cols, data } = pack(next, PMAP_COLS);
  writeRow("process_maps", { ...cols, country_id: next.countryId, data, updated_at: next.updatedAt }, "Save process map");
}
export function deleteProcessMap(pid: string) {
  setCache({ ...cache, processMaps: cache.processMaps.filter((p) => p.id !== pid) });
  deleteRow("process_maps", pid, "Delete process map");
}

// --- AUDIT ---
export function logAudit(entry: Omit<AuditEntry, "id" | "at">) {
  const next: AuditEntry = { ...entry, id: id(), at: new Date().toISOString() };
  setCache({ ...cache, audit: [next, ...cache.audit].slice(0, 500) });
  supabase.from("audit").insert({
    id: next.id, actor: next.actor, action: next.action, entity: next.entity,
    entity_name: next.entityName, details: next.details, at: next.at,
  }).then(({ error }) => { if (error) console.warn("audit insert failed", error); });
}
export function clearAudit() {
  setCache({ ...cache, audit: [] });
  supabase.from("audit").delete().neq("id", "");
}

// --- SETTINGS ---
export function updateSettings(s: Partial<Settings>) {
  const next = { ...cache.settings, ...s };
  setCache({ ...cache, settings: next });
  supabase.from("settings").upsert({ id: 1, data: next, updated_at: new Date().toISOString() })
    .then(({ error }) => { if (error) showError("Save settings", error); });
}

// --- RESET (dev/admin) ---
export async function resetDB() {
  // Wipe local cache and pull fresh from server.
  await loadAll();
  toast.success("Reloaded from server");
}

// --- Pure helper, unchanged ---
export function finalFee(p: Program): number {
  const tuition = p.totalTuition ?? p.annualTuition ?? 0;
  let scholarship = p.scholarshipAmount ?? 0;
  if (p.scholarshipPercentage) scholarship = Math.max(scholarship, (tuition * p.scholarshipPercentage) / 100);
  return Math.max(0, tuition - scholarship);
}
