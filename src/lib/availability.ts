import { BookingStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { overlap } from "@/lib/utils";

const BLOCKING_BOOKING_STATUSES: BookingStatus[] = [
  BookingStatus.PENDING,
  BookingStatus.APPROVED,
  BookingStatus.PAID,
];

export async function checkCarAvailability(
  carId: string,
  startDate: Date,
  endDate: Date,
) {
  const [bookings, blocks] = await Promise.all([
    prisma.booking.findMany({
      where: {
        carId,
        status: { in: BLOCKING_BOOKING_STATUSES },
      },
      select: {
        id: true,
        startDate: true,
        endDate: true,
      },
    }),
    prisma.blockedDate.findMany({
      where: { carId },
      select: {
        id: true,
        startDate: true,
        endDate: true,
        reason: true,
      },
    }),
  ]);

  const conflictingBooking = bookings.find((booking) =>
    overlap(startDate, endDate, booking.startDate, booking.endDate),
  );

  if (conflictingBooking) {
    return {
      available: false,
      conflictType: "booking" as const,
      conflictId: conflictingBooking.id,
      reason: "This vehicle is already booked for part of your selected dates.",
    };
  }

  const conflictingBlock = blocks.find((block) =>
    overlap(startDate, endDate, block.startDate, block.endDate),
  );

  if (conflictingBlock) {
    return {
      available: false,
      conflictType: "blocked_date" as const,
      conflictId: conflictingBlock.id,
      reason: conflictingBlock.reason || "This vehicle is unavailable on those dates.",
    };
  }

  return {
    available: true,
    conflictType: null,
    conflictId: null,
    reason: null,
  };
}
