"use client";

import { useEffect, useState } from "react";

interface UserMeResponse {
  user_id: string | null;
  source?: string;
}

export function useTitanUserId() {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        // Check if a user id is already pinned in localStorage
        const stored = typeof window !== "undefined" ? localStorage.getItem("titan_user_id") : null;
        const res = await fetch("/api/user/me", {
          headers: stored ? { "x-titan-user-id": stored } : {},
        });
        const data: UserMeResponse = await res.json();
        if (data.user_id) {
          localStorage.setItem("titan_user_id", data.user_id);
          setUserId(data.user_id);
        }
      } catch (err) {
        console.error("Failed to resolve Titan user id", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return { userId, loading };
}
