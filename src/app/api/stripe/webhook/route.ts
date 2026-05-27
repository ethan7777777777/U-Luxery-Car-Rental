import { BookingStatus, PaymentStatus, PaymentType } from "@prisma/client";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { notifyAdminOfBooking } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return new NextResponse("Webhook config missing.", { status: 400 });
  }

  const stripe = getStripe();
  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    return new NextResponse(
      `Webhook signature verification failed: ${error instanceof Error ? error.message : "unknown error"}`,
      { status: 400 },
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const bookingId = session.metadata?.bookingId;

    if (!bookingId) {
      return new NextResponse("Missing booking metadata.", { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { car: true },
    });

    if (!booking) {
      return new NextResponse("Booking not found.", { status: 404 });
    }

    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: BookingStatus.PAID,
        paymentStatus:
          booking.paymentType === PaymentType.DEPOSIT
            ? PaymentStatus.DEPOSIT_PAID
            : PaymentStatus.FULL_PAID,
        stripePaymentIntentId:
          typeof session.payment_intent === "string" ? session.payment_intent : null,
      },
    });

    await notifyAdminOfBooking({
      bookingId: booking.id,
      carName: booking.car.name,
      customerName: `${booking.firstName} ${booking.lastName}`,
      customerEmail: booking.email,
      startDate: booking.startDate,
      endDate: booking.endDate,
      chargedAmountCents: booking.chargedAmountCents,
      paymentType: booking.paymentType,
    });
  }

  return NextResponse.json({ received: true });
}
