import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  // Legacy automated Stripe checkout flow is intentionally disabled for MVP request mode.
  // The previous implementation remains in git history and can be restored when automated
  // payment-confirmed booking is re-enabled.
  return NextResponse.json(
    {
      message:
        "Automated checkout is disabled in MVP mode. Use /api/booking-requests for lead capture.",
    },
    { status: 410 },
  );
}
