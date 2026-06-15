"use client";

import { useCallback, useState, useEffect } from "react";
import { usePlaidLink } from "react-plaid-link";
import { Plus, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface Props {
  userId?: string;
  onSuccess?: () => void;
  label?: string;
  className?: string;
  "data-connect-bank"?: string;
}

export function AddAccountButton({ userId, onSuccess, label = "Connect Another Bank", className = "", "data-connect-bank": dataConnectBank }: Props) {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  const getToken = async () => {
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
        toast.error(data.error || "Failed to initialize Plaid.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to start bank connection.");
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
          toast.success(data.message || "Bank connected successfully.");
          setTimeout(() => {
            setConnected(false);
            onSuccess?.();
          }, 1500);
        } else if (data.already_connected) {
          setLinkToken(null);
          toast.info(data.message || "This bank is already connected.");
        } else {
          toast.error(data.error || "Failed to connect bank.");
        }
      } catch (err: any) {
        toast.error(err.message || "Connection failed.");
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
      <button className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-sm font-medium rounded-lg">
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
        data-connect-bank={dataConnectBank}
        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#0071c5] hover:text-[#00aeef] border border-[#0071c5]/20 rounded-lg hover:bg-[#0071c5]/5 transition-all ${className}`}
      >
        {linkToken ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Opening Plaid...
          </>
        ) : (
          <>
            <Plus className="w-3.5 h-3.5" />
            {label}
          </>
        )}
      </button>
    </div>
  );
}
