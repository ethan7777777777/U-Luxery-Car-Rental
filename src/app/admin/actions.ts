"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  clearAdminSessionCookie,
  isAdminAuthenticated,
  setAdminSessionCookie,
} from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

const vehicleInputSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2),
  slug: z.string().min(3),
  brand: z.string().min(2),
  model: z.string().min(1),
  tier: z.enum(["classic", "modern", "ultra"]),
  year: z.coerce.number().int().min(1950).max(2100),
  pricePerDay: z.coerce.number().int().min(10000),
  description: z.string().min(10),
  imageUrl: z.string().url(),
  imageUrls: z.string().optional(),
});

async function requireAdmin() {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) redirect("/admin/login");
}

export async function adminLoginAction(formData: FormData) {
  const enteredPassword = formData.get("password");
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword || typeof enteredPassword !== "string" || enteredPassword !== adminPassword) {
    redirect("/admin/login?error=1");
  }

  await setAdminSessionCookie();
  redirect("/admin");
}

export async function adminLogoutAction() {
  await clearAdminSessionCookie();
  redirect("/admin/login");
}

export async function createOrUpdateVehicleAction(formData: FormData) {
  await requireAdmin();
  const parsed = vehicleInputSchema.safeParse({
    id: formData.get("id") || undefined,
    name: formData.get("name"),
    slug: formData.get("slug"),
    brand: formData.get("brand"),
    model: formData.get("model"),
    tier: formData.get("tier"),
    year: formData.get("year"),
    pricePerDay: formData.get("pricePerDay"),
    description: formData.get("description"),
    imageUrl: formData.get("imageUrl"),
    imageUrls: formData.get("imageUrls") || "",
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message || "Invalid vehicle data.");

  const data = parsed.data;
  const galleryUrls = (data.imageUrls || "")
    .split("\n")
    .map((value) => value.trim())
    .filter(Boolean);
  const supabase = getSupabaseAdmin();

  const payload = {
    name: data.name,
    slug: data.slug,
    brand: data.brand,
    model: data.model,
    tier: data.tier,
    year: data.year,
    price_per_day: data.pricePerDay,
    description: data.description,
    image_url: data.imageUrl,
    gallery_urls: galleryUrls.length > 0 ? galleryUrls : [data.imageUrl],
    is_active: true,
    updated_at: new Date().toISOString(),
  };

  if (data.id) {
    const { error } = await supabase.from("vehicles").update(payload).eq("id", data.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("vehicles").insert(payload);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function removeVehicleAction(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id");
  if (typeof id !== "string") return;

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("vehicles").update({ is_active: false }).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function updateBookingRequestStatusAction(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id");
  const status = formData.get("status");
  if (typeof id !== "string" || typeof status !== "string") return;

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("bookings")
    .update({ booking_status: status, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin");
}

export async function createBlockedDateAction(formData: FormData) {
  await requireAdmin();
  const vehicleId = formData.get("vehicleId");
  const blockedFrom = formData.get("blockedFrom");
  const blockedTo = formData.get("blockedTo");
  const reason = formData.get("reason");
  if (
    typeof vehicleId !== "string" ||
    typeof blockedFrom !== "string" ||
    typeof blockedTo !== "string"
  ) {
    return;
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("blocked_dates").insert({
    vehicle_id: vehicleId,
    blocked_from: new Date(blockedFrom).toISOString(),
    blocked_to: new Date(blockedTo).toISOString(),
    reason: typeof reason === "string" ? reason : null,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/admin");
}

export async function removeBlockedDateAction(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id");
  if (typeof id !== "string") return;
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("blocked_dates").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}
