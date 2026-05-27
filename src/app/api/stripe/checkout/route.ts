import { BookingStatus, PaymentType } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { checkCarAvailability } from "@/lib/availability";
import { hasDatabaseUrl } from "@/lib/config";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { getRentalDays } from "@/lib/utils";

const DEPOSIT_PERCENTAGE = 0.3;

const requestSchema = z.object({
  carId: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  pickupTime: z.string().min(1),
  returnTime: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.email(),
  phone: z.string().min(5),
  notes: z.string().optional(),
  paymentType: z.enum([PaymentType.DEPOSIT, PaymentType.FULL]),
  agreementAccepted: z.boolean(),
  licenseUrl: z.url(),
});

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    if (!hasDatabaseUrl) {
      return NextResponse.json(
        { message: "Booking is currently unavailable while database setup is pending." },
        { status: 503 },
      );
    }

    const body = await request.json();
    const payload = requestSchema.parse(body);

    if (!payload.agreementAccepted) {
      return NextResponse.json(
        { message: "Rental agreement must be accepted." },
        { status: 400 },
      );
    }

    const car = await prisma.car.findUnique({
      where: { id: payload.carId },
    });

    if (!car) {
      return NextResponse.json({ message: "Vehicle not found." }, { status: 404 });
    }

    const startDate = new Date(payload.startDate);
    const endDate = new Date(payload.endDate);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return NextResponse.json({ message: "Invalid booking dates." }, { status: 400 });
    }

    if (startDate > endDate) {
      return NextResponse.json(
        { message: "End date must be on or after start date." },
        { status: 400 },
      );
    }

    const availability = await checkCarAvailability(payload.carId, startDate, endDate);
    if (!availability.available) {
      return NextResponse.json(
        {
          message: availability.reason || "Vehicle is unavailable for selected dates.",
        },
        { status: 409 },
      );
    }

    const rentalDays = getRentalDays(startDate, endDate);
    const fullAmountCents = rentalDays * car.dailyPrice;
    const depositAmountCents = Math.ceil(fullAmountCents * DEPOSIT_PERCENTAGE);
    const chargedAmountCents =
      payload.paymentType === PaymentType.FULL ? fullAmountCents : depositAmountCents;

    const booking = await prisma.booking.create({
      data: {
        carId: payload.carId,
        status: BookingStatus.PENDING,
        paymentType: payload.paymentType,
        totalAmountCents: fullAmountCents,
        depositAmountCents,
        chargedAmountCents,
        startDate,
        endDate,
        pickupTime: payload.pickupTime,
        returnTime: payload.returnTime,
        firstName: payload.firstName,
        lastName: payload.lastName,
        email: payload.email,
        phone: payload.phone,
        notes: payload.notes,
        agreementAccepted: payload.agreementAccepted,
        licenseUrl: payload.licenseUrl,
      },
    });

    const stripe = getStripe();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!baseUrl) {
      throw new Error("Missing NEXT_PUBLIC_APP_URL.");
    }

    const checkout = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: `${baseUrl}/bookings/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/cars/${car.slug}?cancelled=1`,
      customer_email: payload.email,
      metadata: {
        bookingId: booking.id,
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: chargedAmountCents,
            product_data: {
              name: `${car.name} Rental`,
              description: `${payload.startDate} to ${payload.endDate} (${rentalDays} day${rentalDays > 1 ? "s" : ""})`,
            },
          },
        },
      ],
    });

    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        stripeSessionId: checkout.id,
      },
    });

    return NextResponse.json({ checkoutUrl: checkout.url });
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? error.issues[0]?.message
        : error instanceof Error
          ? error.message
          : "Unable to create checkout session.";

    return NextResponse.json({ message }, { status: 400 });
  }
}
