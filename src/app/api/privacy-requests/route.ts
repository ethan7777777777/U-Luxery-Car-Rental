import { NextResponse } from "next/server";
import { z } from "zod";

import { hasSupabaseConfig } from "@/lib/config";
import { getSupabaseAdmin } from "@/lib/supabase";

const schema = z.object({
  requestType: z.enum([
    "know",
    "delete",
    "correct",
    "opt_out_sale",
    "limit_sensitive_use",
  ]),
  fullName: z.string().min(2),
  email: z.email(),
  phone: z.string().optional().nullable(),
  details: z.string().optional().nullable(),
});

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    if (!hasSupabaseConfig) {
      return NextResponse.json(
        { message: "Supabase configuration is missing." },
        { status: 503 },
      );
    }

    const payload = schema.parse(await request.json());
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("privacy_requests").insert({
      request_type: payload.requestType,
      full_name: payload.fullName,
      email: payload.email,
      phone: payload.phone || null,
      details: payload.details || null,
      status: "open",
      updated_at: new Date().toISOString(),
    });

    if (error) {
      return NextResponse.json(
        { message: `Failed to save privacy request: ${error.message}` },
        { status: 400 },
      );
    }

    return NextResponse.json({ message: "Privacy request submitted." });
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? error.issues[0]?.message
        : error instanceof Error
          ? error.message
          : "Invalid request.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
