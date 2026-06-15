"use client";

import { useEffect, useState } from "react";
import { usePlaidLink } from "react-plaid-link";
import { RefreshCw, Loader2 } from "lucide-react";

interface RepairButtonProps {
  itemId: string;
  userId?: string;
  onSuccess?: () => void;
  className?: string;
}

export function RepairConnectionButton({ itemId, userId, onSuccess, className = "" }: RepairButtonProps) {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
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

  const { open, ready } = usePlaidLink({
    token: linkToken || "",
    onSuccess: () => {
      setLinkToken(null);
      onSuccess?.();
    },
    onExit: () => setLinkToken(null),
  });

  useEffect(() => {
    if (linkToken && ready) {
      open();
    }
  }, [linkToken, ready, open]);

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={startRepair}
        disabled={loading || !!linkToken}
        className={`inline-flex items-center gap-1.5 text-xs font-medium text-[#0071c5] hover:text-[#00aeef] transition-colors ${className}`}
      >
        {loading || linkToken ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Opening...
          </>
        ) : (
          <>
            <RefreshCw className="w-3.5 h-3.5" />
            Repair connection
          </>
        )}
      </button>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}
