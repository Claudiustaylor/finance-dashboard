"use client";

import { useState, useEffect } from "react";
import { ToggleLeft, ToggleRight } from "lucide-react";

type PlaidEnv = "production" | "development" | "sandbox";

function getCookie(name: string): string | undefined {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match?.[2];
}

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
}

export function PlaidEnvToggle() {
  const [env, setEnv] = useState<PlaidEnv>("production");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const c = getCookie("plaid_env");
    if (c && (c === "production" || c === "development" || c === "sandbox")) {
      setEnv(c as PlaidEnv);
    }
  }, []);

  const options: { label: string; value: PlaidEnv; color: string }[] = [
    { label: "Production", value: "production", color: "#ef4444" },
    { label: "Sandbox", value: "sandbox", color: "#22c55e" },
  ];

  const toggle = () => {
    const next = env === "production" ? "sandbox" : "production";
    setEnv(next);
    setCookie("plaid_env", next, 30);
    // Reload to pick up new env in server components
    window.location.reload();
  };

  if (!mounted) return null;

  const activeOption = options.find((o) => o.value === env)!;
  const inactiveOption = options.find((o) => o.value !== env)!;

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all"
      style={{
        borderColor: env === "production" ? "rgba(239,68,68,0.2)" : "rgba(34,197,94,0.2)",
        color: activeOption.color,
        backgroundColor: env === "production" ? "rgba(239,68,68,0.05)" : "rgba(34,197,94,0.05)",
      }}
    >
      {env === "production" ? (
        <ToggleLeft className="w-4 h-4" style={{ color: activeOption.color }} />
      ) : (
        <ToggleRight className="w-4 h-4" style={{ color: activeOption.color }} />
      )}
      <span>
        Plaid: <span className="font-bold">{activeOption.label}</span>
      </span>
    </button>
  );
}
