"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

/* ─── Types ─── */
export interface Entity {
  id: string;
  name: string;
  type: "LLC" | "Corp" | "Nonprofit" | "Partnership" | "Sole Proprietorship";
  state: string;
  formationDate: string; // YYYY-MM-DD
  ein?: string;
  notes?: string;
}

export interface Filing {
  id: string;
  entityId: string;
  type: string;
  dueDate: string; // YYYY-MM-DD or "Ongoing"
  cost: string;
  lateFee: string;
  completed: boolean;
  completedAt?: string;
  link: string;
  notes: string;
}

/* ─── localStorage keys ─── */
const LS_ENTITIES = "titan_compliance_v2_entities";
const LS_DONE = "titan_compliance_v2_completed";
const LS_DIRTY = "titan_compliance_v2_dirty";

/* ─── Supabase client (anon key fine for RLS) ─── */
function supabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://uyvkqgmuxerjdqarjgbh.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || (typeof window !== "undefined" ? (window as any).__SB_ANON__ || "" : "")
  );
}

/* ─── Helpers ─── */
function loadLocalEntities(): Entity[] {
  try {
    const raw = localStorage.getItem(LS_ENTITIES);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [
    { id: "demo-gambix", name: "Gambix LLC", type: "LLC", state: "DE", formationDate: "2023-05-15", ein: "XX-XXXXXXX", notes: "Operating company for software products" },
    { id: "demo-converzi", name: "Converzi, Inc.", type: "Corp", state: "DE", formationDate: "2022-08-01", ein: "XX-XXXXXXX", notes: "Parent holding company" },
  ];
}

function loadLocalCompletions(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(LS_DONE);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

function saveEntities(e: Entity[]) {
  try { localStorage.setItem(LS_ENTITIES, JSON.stringify(e)); } catch {}
}
function saveCompletions(c: Record<string, boolean>) {
  try { localStorage.setItem(LS_DONE, JSON.stringify(c)); } catch {}
}
function markDirty() {
  try { localStorage.setItem(LS_DIRTY, "true"); } catch {}
}

/* ─── useCompliance hook ─── */
export function useCompliance() {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [completions, setCompletions] = useState<Record<string, boolean>>({});
  const [syncing, setSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [online, setOnline] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Initial hydration from localStorage
  useEffect(() => {
    setEntities(loadLocalEntities());
    setCompletions(loadLocalCompletions());
    setOnline(typeof navigator !== "undefined" ? navigator.onLine : true);
    const onStatus = () => setOnline(navigator.onLine);
    window.addEventListener("online", onStatus);
    window.addEventListener("offline", onStatus);
    return () => {
      window.removeEventListener("online", onStatus);
      window.removeEventListener("offline", onStatus);
    };
  }, []);

  // Persist localStorage on every change
  useEffect(() => {
    if (entities.length) saveEntities(entities);
  }, [entities]);

  useEffect(() => {
    saveCompletions(completions);
  }, [completions]);

  // ── SYNC with Supabase ──
  const sync = useCallback(async () => {
    setSyncing(true);
    setError(null);
    try {
      const resp = await fetch("/api/compliance/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entities, completions }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || String(resp.status));

      // Merge server state back (server wins on conflicts)
      if (data.entities?.length) {
        const merged = mergeEntities(loadLocalEntities(), data.entities);
        setEntities(merged);
        saveEntities(merged);
      }
      if (data.completions) {
        const mergedC = { ...loadLocalCompletions(), ...data.completions };
        setCompletions(mergedC);
        saveCompletions(mergedC);
      }

      setLastSynced(new Date().toISOString());
      try { localStorage.removeItem(LS_DIRTY); } catch {}
    } catch (e: any) {
      setError(e.message || "Sync failed");
      markDirty();
    } finally {
      setSyncing(false);
    }
  }, [entities, completions]);

  // Auto-sync on mount and when coming back online
  useEffect(() => {
    if (online) sync();
    // Periodic sync every 60s when window is active
    const iv = setInterval(() => {
      if (typeof document !== "undefined" && !document.hidden) sync();
    }, 60000);
    return () => clearInterval(iv);
  }, [online]);

  // Track visibility changes
  useEffect(() => {
    const handler = () => {
      if (!document.hidden && online) sync();
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [online, sync]);

  return {
    entities,
    setEntities,
    completions,
    setCompletions,
    syncing,
    lastSynced,
    error,
    online,
    sync,
  };
}

/* ─── Merge helper: server wins on conflict ─── */
function mergeEntities(local: Entity[], server: Partial<Entity>[]): Entity[] {
  const map = new Map<string, Entity>(local.map((e) => [e.id, e]));
  for (const s of server) {
    if (!s.id) continue;
    const localE = map.get(s.id);
    if (localE) {
      map.set(s.id, { ...localE, ...s } as Entity);
    } else {
      map.set(s.id, s as Entity);
    }
  }
  return Array.from(map.values());
}
