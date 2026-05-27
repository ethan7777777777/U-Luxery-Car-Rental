"use server";

import {
  BookingStatus,
  PaymentStatus,
  PaymentType,
  type Prisma,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  clearAdminSessionCookie,
  isAdminAuthenticated,
  setAdminSessionCookie,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const carInputSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2),
  slug: z.string().min(3),
  brand: z.string().min(2),
  model: z.string().min(1),
  year: z.coerce.number().int().min(2000).max(2100),
  dailyPrice: z.coerce.number().int().min(10000),
  description: z.string().min(10),
  thumbnailUrl: z.string().url(),
  imageUrls: z.string().min(10),
});

async function requireAdmin() {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) {
    redirect("/admin/login");
  }
}

export async function adminLoginAction(formData: FormData) {
  const enteredPassword = formData.get("password");
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword || typeof enteredPassword !== "string") {
    redirect("/admin/login?error=1");
  }

  if (enteredPassword !== adminPassword) {
    redirect("/admin/login?error=1");
  }

  await setAdminSessionCookie();
  redirect("/admin");
}

export async function adminLogoutAction() {
  await clearAdminSessionCookie();
  redirect("/admin/login");
}

export async function createOrUpdateCarAction(formData: FormData) {
  await requireAdmin();

  const parsed = carInputSchema.safeParse({
    id: formData.get("id") || undefined,
    name: formData.get("name"),
    slug: formData.get("slug"),
    brand: formData.get("brand"),
    model: formData.get("model"),
    year: formData.get("year"),
    dailyPrice: formData.get("dailyPrice"),
    description: formData.get("description"),
    thumbnailUrl: formData.get("thumbnailUrl"),
    imageUrls: formData.get("imageUrls"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Invalid car form data.");
  }

  const data = parsed.data;
  const imageUrls = data.imageUrls
    .split("\n")
    .map((value) => value.trim())
    .filter(Boolean);

  const carPayload: Prisma.CarUncheckedCreateInput = {
    name: data.name,
    slug: data.slug,
    brand: data.brand,
    model: data.model,
    year: data.year,
    dailyPrice: data.dailyPrice,
    description: data.description,
    thumbnailUrl: data.thumbnailUrl,
  };

  let persistedCarId: string;
  if (data.id) {
    const updated = await prisma.car.update({
      where: { id: data.id },
      data: carPayload,
      select: { id: true },
    });
    persistedCarId = updated.id;
  } else {
    const created = await prisma.car.create({
      data: carPayload,
      select: { id: true },
    });
    persistedCarId = created.id;
  }

  await prisma.carImage.deleteMany({ where: { carId: persistedCarId } });
  if (imageUrls.length > 0) {
    await prisma.carImage.createMany({
      data: imageUrls.map((url, index) => ({
        carId: persistedCarId,
        url,
        sortOrder: index,
      })),
    });
  }

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function removeCarAction(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id");
  if (typeof id !== "string" || id.length === 0) return;

  await prisma.car.delete({ where: { id } });
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function updateBookingStatusAction(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id");
  const status = formData.get("status");

  if (typeof id !== "string" || typeof status !== "string") return;

  if (!Object.values(BookingStatus).includes(status as BookingStatus)) return;

  const nextStatus = status as BookingStatus;
  const nextPaymentStatus =
    nextStatus === BookingStatus.REJECTED || nextStatus === BookingStatus.CANCELLED
      ? PaymentStatus.REFUNDED
      : undefined;

  await prisma.booking.update({
    where: { id },
    data: {
      status: nextStatus,
      ...(nextPaymentStatus ? { paymentStatus: nextPaymentStatus } : {}),
    },
  });

  revalidatePath("/admin");
}

export async function createBlockedDateAction(formData: FormData) {
  await requireAdmin();
  const carId = formData.get("carId");
  const startDate = formData.get("startDate");
  const endDate = formData.get("endDate");
  const reason = formData.get("reason");

  if (
    typeof carId !== "string" ||
    typeof startDate !== "string" ||
    typeof endDate !== "string"
  ) {
    return;
  }

  await prisma.blockedDate.create({
    data: {
      carId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason: typeof reason === "string" ? reason : null,
    },
  });

  revalidatePath("/admin");
}

export async function removeBlockedDateAction(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id");
  if (typeof id !== "string") return;

  await prisma.blockedDate.delete({ where: { id } });
  revalidatePath("/admin");
}

export async function markBookingPaidAction(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id");
  if (typeof id !== "string") return;

  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) return;

  await prisma.booking.update({
    where: { id },
    data: {
      status: BookingStatus.PAID,
      paymentStatus:
        booking.paymentType === PaymentType.DEPOSIT
          ? PaymentStatus.DEPOSIT_PAID
          : PaymentStatus.FULL_PAID,
    },
  });
  revalidatePath("/admin");
}
