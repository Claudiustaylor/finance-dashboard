import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { normalizeUserId } from '@/lib/user-id';

function getUserId(req: NextRequest): string | null {
  return normalizeUserId(req.headers.get("x-titan-user-id") || req.headers.get("x-user-id"));
}

export async function POST(req: NextRequest) {
  try {
    const userId = getUserId(req);
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const fallbackUserId = (formData.get("userId") as string) || null;
    const uid = userId || fallbackUserId;

    if (!uid) {
      return NextResponse.json({ error: "Missing user id" }, { status: 401 });
    }
    if (!file) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    const ext = file.name.split(".").pop() || "jpg";
    const path = `${uid}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { data, error } = await supabaseAdmin().storage
      .from("receipts")
      .upload(path, file, { contentType: file.type, upsert: false });

    if (error) {
      console.error("Receipt upload error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const {
      data: { publicUrl },
    } = supabaseAdmin().storage.from("receipts").getPublicUrl(path);

    return NextResponse.json({ file_url: publicUrl, path });
  } catch (err: any) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: err.message || "Upload failed" }, { status: 500 });
  }
}
