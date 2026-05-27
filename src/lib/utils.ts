import { clsx, type ClassValue } from "clsx";
import { differenceInCalendarDays, isValid } from "date-fns";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function getRentalDays(startDate: Date, endDate: Date) {
  if (!isValid(startDate) || !isValid(endDate)) return 0;
  const days = differenceInCalendarDays(endDate, startDate) + 1;
  return Math.max(days, 1);
}

export function overlap(
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date,
) {
  return startA <= endB && endA >= startB;
}
