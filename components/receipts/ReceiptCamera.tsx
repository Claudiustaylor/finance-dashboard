"use client";

import { useState, useRef, useCallback } from "react";
import { Camera, Upload, X, Loader2, Check, FileImage } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ExtractedFields {
  merchant?: string;
  date?: string;
  total?: number;
  tax?: number;
  items?: { name: string; amount: number; qty?: number }[];
  confidence?: number;
}

interface MatchResult {
  transaction_id?: string;
  name?: string;
  amount?: number;
  date?: string;
  score?: number;
}

interface ReceiptCameraProps {
  userId?: string;
  onProcessed?: (receiptId: string) => void;
}

export function ReceiptCamera({ userId, onProcessed }: ReceiptCameraProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [extracted, setExtracted] = useState<ExtractedFields | null>(null);
  const [match, setMatch] = useState<MatchResult | null>(null);
  const [receiptId, setReceiptId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setPreview(null);
    setFile(null);
    setExtracted(null);
    setMatch(null);
    setReceiptId(null);
    setError(null);
    if (fileRef.current) fileRef.current.value = "";
  }, []);

  const handleFile = useCallback((selected: File | null) => {
    if (!selected) return;
    if (!selected.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }
    setFile(selected);
    setError(null);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(selected);
  }, []);

  const processReceipt = useCallback(async () => {
    if (!file) return;
    setUploading(true);
    setError(null);

    try {
      const uid = userId || localStorage.getItem("titan_user_id") || crypto.randomUUID();
      localStorage.setItem("titan_user_id", uid);

      // 1. Upload to Supabase Storage (signed upload handled via /api/upload)
      const formData = new FormData();
      formData.append("file", file);
      formData.append("userId", uid);
      const uploadRes = await fetch("/api/upload/receipt", { method: "POST", body: formData });
      if (!uploadRes.ok) throw new Error("Receipt upload failed");
      const uploadData = await uploadRes.json();
      const fileUrl = uploadData.file_url;

      // 2. OCR via AI
      setUploading(false);
      setOcrLoading(true);
      const ocrRes = await fetch("/api/ai/receipt-ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-titan-user-id": uid },
        body: JSON.stringify({ file_url: fileUrl }),
      });
      const ocrData = await ocrRes.json();
      if (!ocrRes.ok) throw new Error(ocrData.error || "OCR failed");

      const extractedFields: ExtractedFields = {
        merchant: ocrData.extracted?.merchant,
        date: ocrData.extracted?.date,
        total: Number(ocrData.extracted?.total_amount) || undefined,
        tax: Number(ocrData.extracted?.tax_amount) || undefined,
        items: ocrData.extracted?.items || [],
        confidence: Number(ocrData.extracted?.confidence) || 0,
      };
      setExtracted(extractedFields);
      setReceiptId(ocrData.receipt_id);

      // 3. Match to existing transaction
      const matchRes = await fetch("/api/receipts/match", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-titan-user-id": uid },
        body: JSON.stringify({
          amount: extractedFields.total,
          merchant: extractedFields.merchant,
          date: extractedFields.date,
          receipt_id: ocrData.receipt_id,
        }),
      });
      if (matchRes.ok) {
        const matchData = await matchRes.json();
        if (matchData.match) setMatch(matchData.match);
      }

      onProcessed?.(ocrData.receipt_id);
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    } finally {
      setUploading(false);
      setOcrLoading(false);
    }
  }, [file, userId, onProcessed]);

  return (
    <div className="w-full max-w-md mx-auto rounded-3xl bg-white p-5 shadow-[0_2px_24px_-6px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.04]">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900">Snap a receipt</h3>
        {preview && (
          <button onClick={reset} className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X className="size-4" />
          </button>
        )}
      </div>

      {!preview ? (
        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFile(e.dataTransfer.files?.[0] || null);
          }}
          className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-8 text-center transition hover:border-[#0071c5] hover:bg-slate-100 cursor-pointer"
        >
          <div className="flex size-14 items-center justify-center rounded-2xl bg-[#0071c5]/10">
            <Camera className="size-7 text-[#0071c5]" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900">Tap to capture or upload</p>
            <p className="mt-1 text-xs text-slate-500">Take a photo with your camera or drop an image</p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] || null)}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative overflow-hidden rounded-2xl bg-slate-100">
            <img src={preview} alt="Receipt preview" className="max-h-64 w-full object-contain" />
          </div>

          <Button
            onClick={processReceipt}
            disabled={uploading || ocrLoading}
            className="w-full rounded-full bg-[#0071c5] text-white"
          >
            {uploading || ocrLoading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                {uploading ? "Uploading..." : "Reading receipt..."}
              </>
            ) : (
              <>
                <Upload className="mr-2 size-4" />
                Process Receipt
              </>
            )}
          </Button>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

      {extracted && (
        <div className="mt-5 space-y-3 rounded-2xl bg-slate-50 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-emerald-600">
            <Check className="size-4" />
            Receipt extracted ({Math.round((extracted.confidence || 0) * 100)}% confidence)
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-slate-500">Merchant</p>
              <p className="font-medium text-slate-900">{extracted.merchant || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Date</p>
              <p className="font-medium text-slate-900">{extracted.date || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Total</p>
              <p className="font-medium text-slate-900">${extracted.total?.toFixed(2) || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Tax</p>
              <p className="font-medium text-slate-900">${extracted.tax?.toFixed(2) || "—"}</p>
            </div>
          </div>

          {match?.transaction_id ? (
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm">
              <p className="font-medium text-emerald-700">Matched transaction</p>
              <p className="text-emerald-600/90">{match.name} · ${match.amount?.toFixed(2)} · {match.date}</p>
            </div>
          ) : (
            <p className="text-xs text-slate-500">No matching transaction found — a manual expense can be created from this receipt.</p>
          )}
        </div>
      )}
    </div>
  );
}
