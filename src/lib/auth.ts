import { useEffect, useState, useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";

export type Role = "admin" | "counselor" | null;

let session: Session | null = null;
let role: Role = null;
let initialized = false;
const listeners = new Set<() => void>();

function emit() { listeners.forEach((l) => l()); }
function subscribe(l: () => void) { listeners.add(l); return () => listeners.delete(l); }

async function loadRole(userId: string): Promise<Role> {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (!data?.length) return "counselor";
  if (data.some((r) => r.role === "superadmin")) return "admin";
  return "counselor";
}

if (typeof window !== "undefined") {
  // 1. Subscribe FIRST to avoid missing the INITIAL_SESSION event
  supabase.auth.onAuthStateChange((_event, s) => {
    session = s;
    if (!s) { role = null; initialized = true; emit(); return; }
    // Defer Supabase calls out of the callback to avoid deadlocks
    setTimeout(async () => {
      role = await loadRole(s.user.id);
      initialized = true;
      emit();
    }, 0);
  });
  supabase.auth.getSession().then(async ({ data }) => {
    session = data.session;
    if (data.session) role = await loadRole(data.session.user.id);
    initialized = true;
    emit();
  });
}

export function useAuth() {
  const snap = useSyncExternalStore(
    subscribe,
    () => `${session?.user.id ?? ""}|${role ?? ""}|${initialized}`,
    () => "||false",
  );
  return {
    session,
    user: session?.user ?? null,
    role,
    initialized,
    _snap: snap,
  };
}

export function useRole(): Role { return useAuth().role; }

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}
export async function signUp(email: string, password: string, fullName?: string) {
  return supabase.auth.signUp({
    email, password,
    options: {
      emailRedirectTo: `${window.location.origin}/`,
      data: { full_name: fullName ?? "" },
    },
  });
}
export async function signOut() {
  await supabase.auth.signOut();
  // Clear any cached app data
  if (typeof window !== "undefined") {
    window.localStorage.removeItem("eduintel:db:v1");
  }
}
