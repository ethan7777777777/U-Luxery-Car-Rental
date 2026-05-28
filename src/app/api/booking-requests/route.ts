import { NextResponse } from "next/server";
import { z } from "zod";

import { hasSupabaseConfig } from "@/lib/config";
import { getSupabaseAdmin } from "@/lib/supabase";

const bookingRequestSchema = z.object({
  vehicleId: z.uuid(),
  name: z.string().min(2),
  email: z.email(),
  phone: z.string().min(7),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  licenseUrl: z.string().url().nullable(),
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

    const payload = bookingRequestSchema.parse(await request.json());
    const startDate = new Date(payload.startDate);
    const endDate = new Date(payload.endDate);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return NextResponse.json({ message: "Invalid date selection." }, { status: 400 });
    }
    if (startDate > endDate) {
      return NextResponse.json(
        { message: "End date must be on or after start date." },
        { status: 400 },
      );
    }

    const supabase = getSupabaseAdmin();

    const { data: vehicle, error: vehicleError } = await supabase
      .from("vehicles")
      .select("id, name, price_per_day")
      .eq("id", payload.vehicleId)
      .eq("is_active", true)
      .maybeSingle();

    if (vehicleError || !vehicle) {
      return NextResponse.json({ message: "Vehicle not found." }, { status: 404 });
    }

    const dayMs = 24 * 60 * 60 * 1000;
    const dayCount = Math.max(1, Math.floor((endDate.getTime() - startDate.getTime()) / dayMs) + 1);
    const totalPrice = dayCount * vehicle.price_per_day;

    const { error: insertError } = await supabase.from("bookings").insert({
      vehicle_id: payload.vehicleId,
      customer_name: payload.name,
      first_name: payload.name.split(" ")[0] || payload.name,
      last_name: payload.name.split(" ").slice(1).join(" ") || null,
      email: payload.email,
      phone: payload.phone,
      license_url: payload.licenseUrl,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      total_price: totalPrice,
      deposit_amount: Math.ceil(totalPrice * 0.3),
      charged_amount: 0,
      payment_type: "deposit",
      payment_status: "pending",
      booking_status: "PENDING",
      agreement_accepted: false,
      pickup_time: "10:00",
      return_time: "10:00",
    });

    if (insertError) {
      return NextResponse.json(
        { message: `Could not save booking request: ${insertError.message}` },
        { status: 400 },
      );
    }

    return NextResponse.json({ message: "Booking request submitted." });
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? error.issues[0]?.message
        : error instanceof Error
          ? error.message
          : "Booking request failed.";

    return NextResponse.json({ message }, { status: 400 });
  }
}
