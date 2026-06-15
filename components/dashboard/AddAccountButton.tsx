"use client";

import { useCallback, useState, useEffect } from "react";
import { usePlaidLink } from "react-plaid-link";
import { Plus, Loader2, CheckCircle } from "lucide-react";

interface Props {
  userId?: string;
  onSuccess?: () => void;
}

export function AddAccountButton({ userId, onSuccess }: Props) {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  const getToken = async () => {
    setError(null);
    try {
      const uid = userId || localStorage.getItem("titan_user_id") || crypto.randomUUID();
      const res = await fetch("/api/plaid/link-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: uid }),
      });
      const data = await res.json();
      if (data.link_token) {
        setLinkToken(data.link_token);
        if (!userId) localStorage.setItem("titan_user_id", uid);
      } else {
        setError(data.error || "Failed to initialize");
      }
    } catch (err: any) {
      setError(err.message);
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
        if (data.success || data.ok) {
          setConnected(true);
          setLinkToken(null);
          setTimeout(() => {
            setConnected(false);
            onSuccess?.();
          }, 2000);
        } else if (data.already_connected) {
          setError(data.message || "This bank is already connected.");
          setLinkToken(null);
        } else {
          setError(data.error || "Exchange failed");
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

  if (connected) {
    return (
      <button className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium rounded-lg">
        <CheckCircle className="w-4 h-4" />
        Connected!
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={getToken}
        disabled={!!linkToken}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#0071c5] hover:text-[#00aeef] border border-[#0071c5]/20 rounded-lg hover:bg-[#0071c5]/5 transition-all"
      >
        {linkToken ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Opening Plaid...
          </>
        ) : (
          <>
            <Plus className="w-3.5 h-3.5" />
            Connect Another Bank
          </>
        )}
      </button>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}
