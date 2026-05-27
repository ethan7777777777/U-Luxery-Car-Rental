import { NextResponse } from "next/server";

import { checkCarAvailability } from "@/lib/availability";
import { hasDatabaseUrl } from "@/lib/config";

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

  if (!hasDatabaseUrl) {
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

  const availability = await checkCarAvailability(carId, parsedStartDate, parsedEndDate);
  return NextResponse.json({
    available: availability.available,
    reason: availability.reason,
  });
}
