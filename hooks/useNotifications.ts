"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { type Filing } from "@/hooks/useCompliance";

const LS_KEY = "titan_notif_last_seen";
const MIN_INTERVAL_MS = 1000 * 60 * 60; // 1 hour between re-alerts
const URGENT_DAYS = 7;

function loadLastSeen(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveLastSeen(map: Record<string, number>) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(map));
  } catch {}
}

export type NotificationPermission =
  | "default"
  | "granted"
  | "denied"
  | "unsupported";

export function useNotifications(upcoming: Filing[]) {
  const [perm, setPerm] = useState<NotificationPermission>("default");
  const lastSeen = useRef<Record<string, number>>({});
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof Notification === "undefined") {
      setPerm("unsupported");
      return;
    }
    setPerm(Notification.permission as NotificationPermission);
    lastSeen.current = loadLastSeen();
  }, []);

  useEffect(() => {
    setEnabled(perm === "granted");
  }, [perm]);

  const requestPermission = useCallback(async () => {
    if (typeof Notification === "undefined") return;
    const p = await Notification.requestPermission();
    setPerm(p);
  }, []);

  // Check and fire notifications
  useEffect(() => {
    if (perm !== "granted" || !upcoming.length) return;

    const now = Date.now();
    let changed = false;

    for (const f of upcoming) {
      if (f.completed || f.dueDate === "Ongoing") continue;
      const d = daysUntil(f.dueDate);
      if (d > URGENT_DAYS + 1) continue;

      const last = lastSeen.current[f.id] || 0;
      if (now - last < MIN_INTERVAL_MS) continue;

      const title = d < 0
        ? `Overdue: ${f.type}`
        : d <= URGENT_DAYS
          ? `Due in ${d}d: ${f.type}`
          : `Filing due: ${f.type}`;

      try {
        new Notification(title, {
          body: `${f.type} for ${f.entityId} — Cost: ${f.cost} | Late Fee: ${f.lateFee}`,
          icon: "/favicon.ico",
          tag: f.id,
          requireInteraction: d < 0,
        });
        lastSeen.current[f.id] = now;
        changed = true;
      } catch {
        // silent fail
      }
    }

    if (changed) saveLastSeen(lastSeen.current);
  }, [perm, upcoming]);

  return { perm, enabled, requestPermission };
}

function daysUntil(dateStr: string): number {
  const d = new Date(dateStr);
  const diff = d.getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
