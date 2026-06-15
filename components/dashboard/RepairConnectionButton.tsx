"use client";

import { useCallback, useEffect, useState } from "react";
import { usePlaidLink } from "react-plaid-link";
import { RefreshCw, Loader2, CheckCircle } from "lucide-react";

interface RepairButtonProps {
  itemId: string;
  userId?: string;
  onSuccess?: () => void;
  className?: string;
}

export function RepairConnectionButton({ itemId, userId, onSuccess, className = "" }: RepairButtonProps) {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startRepair = async () => {
    setError(null);
    setLoading(true);
    try {
      const uid = userId || localStorage.getItem("titan_user_id");
      const res = await fetch("/api/plaid/repair", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, userId: uid }),
      });
      const data = await res.json();
      if (data.link_token) {
        setLinkToken(data.link_token);
      } else {
        setError(data.error || "Failed to start repair");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const onPlaidSuccess = useCallback(
    async (publicToken: string) => {
      try {
        const uid = userId || localStorage.getItem("titan_user_id");
        const res = await fetch("/api/plaid/exchange-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ public_token: publicToken, userId: uid }),
        });
        const data = await res.json();
        if (data.success || data.ok || data.already_connected) {
          setDone(true);
          setLinkToken(null);
          setTimeout(() => {
            setDone(false);
            onSuccess?.();
          }, 1500);
        } else {
          setError(data.error || "Repair failed");
        }
      } catch (err: any) {
        setError(err.message);
      }
    },
    [userId, onSuccess]
  );

  const { open, ready } = usePlaidLink({
    token: linkToken || "",
    onSuccess: onPlaidSuccess,
    onExit: () => setLinkToken(null),
  });

  useEffect(() => {
    if (linkToken && ready) {
      open();
    }
  }, [linkToken, ready, open]);

  if (done) {
    return (
      <span className={`inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 ${className}`}>
        <CheckCircle className="size-3.5" /> Repaired
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={startRepair}
        disabled={loading || !!linkToken}
        className={`inline-flex items-center gap-1.5 text-xs font-medium text-[#0071c5] hover:text-[#00aeef] transition-colors ${className}`}
      >
        {loading || linkToken ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
        {loading || linkToken ? "Opening..." : "Repair connection"}
      </button>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
