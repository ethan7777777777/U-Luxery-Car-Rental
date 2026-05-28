import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  // Legacy Stripe webhook endpoint retained as a stable integration point.
  // MVP mode does not finalize payments automatically.
  return NextResponse.json({ received: true, mode: "mvp-request-only" });
}
