import { NextResponse } from "next/server";

import { hasSupabaseConfig } from "@/lib/config";
import { getSupabaseAdmin } from "@/lib/supabase";
import { overlap } from "@/lib/utils";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const carId = searchParams.get("carId");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  if (!carId || !startDate || !endDate) {
    return NextResponse.json(
      {
        available: false,
        reason: "Missing carId, startDate, or endDate.",
      },
      { status: 400 },
    );
  }

  if (!hasSupabaseConfig) {
    return NextResponse.json({
      available: false,
      reason: "Booking is currently unavailable while database setup is pending.",
    });
  }

  const parsedStartDate = new Date(startDate);
  const parsedEndDate = new Date(endDate);

  if (parsedStartDate > parsedEndDate) {
    return NextResponse.json(
      { available: false, reason: "End date must be on or after start date." },
      { status: 400 },
    );
  }

  const supabase = getSupabaseAdmin();
  const { data: blockedDates } = await supabase
    .from("blocked_dates")
    .select("id, blocked_from, blocked_to, reason")
    .eq("vehicle_id", carId);

  const conflict = (blockedDates || []).find((blockedDate) =>
    overlap(
      parsedStartDate,
      parsedEndDate,
      new Date(blockedDate.blocked_from),
      new Date(blockedDate.blocked_to),
    ),
  );

  const availability = conflict
    ? {
        available: false,
        reason: conflict.reason || "Selected dates are blocked for this vehicle.",
      }
    : { available: true, reason: null };

  return NextResponse.json({
    available: availability.available,
    reason: availability.reason,
  });
}
