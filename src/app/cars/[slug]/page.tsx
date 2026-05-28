import { notFound } from "next/navigation";

import { BookingForm } from "@/components/booking-form";
import { CarGallery } from "@/components/car-gallery";
import { hasSupabaseConfig } from "@/lib/config";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getTierMeta } from "@/lib/tier";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

type CarPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function CarPage({ params }: CarPageProps) {
  const { slug } = await params;

  if (!hasSupabaseConfig) {
    notFound();
  }

  const supabase = getSupabaseAdmin();
  const { data: vehicleById } = await supabase
    .from("vehicles")
    .select("*")
    .eq("id", slug)
    .maybeSingle();

  const { data: vehicleBySlug } = vehicleById
    ? { data: null }
    : await supabase.from("vehicles").select("*").eq("slug", slug).maybeSingle();

  const vehicle = vehicleById || vehicleBySlug;
  if (!vehicle) notFound();

  const { data: blockedDates } = await supabase
    .from("blocked_dates")
    .select("*")
    .eq("vehicle_id", vehicle.id)
    .order("blocked_from", { ascending: true });

  const car = {
    id: vehicle.id,
    slug: vehicle.slug,
    name: vehicle.name,
    brand: vehicle.brand,
    model: vehicle.model,
    year: vehicle.year,
    dailyPrice: vehicle.price_per_day,
    description: vehicle.description,
    images: (vehicle.gallery_urls && vehicle.gallery_urls.length > 0
      ? vehicle.gallery_urls
      : [vehicle.image_url || ""])
      .filter(Boolean)
      .map((url, index) => ({
        id: `${vehicle.id}-${index}`,
        url,
      })),
    blockedDates: (blockedDates || []).map((entry) => ({
      id: entry.id,
      startDate: new Date(entry.blocked_from),
      endDate: new Date(entry.blocked_to),
      reason: entry.reason,
    })),
  };

  if (!car) {
    notFound();
  }
  const tier = getTierMeta(car);

  return (
    <div className="container" style={{ padding: "1.2rem 0 2rem" }}>
      <h1 style={{ marginBottom: "0.35rem" }}>{car.name}</h1>
      <p className="muted" style={{ marginTop: 0 }}>
        {car.year} {car.brand} {car.model} • {formatCurrency(car.dailyPrice)} / day
      </p>
      <p className={`tier-badge tier-${tier.key}`} style={{ width: "fit-content" }}>
        {tier.label}
      </p>

      <div className="grid-two">
        <div className="form-grid">
          <CarGallery name={car.name} images={car.images} />
          <section className="panel">
            <h2>Description</h2>
            <p className="muted">{car.description}</p>
            <p className="muted">{tier.summary}</p>
          </section>
          <section className="panel">
            <h2>Unavailable Dates</h2>
            {car.blockedDates.length === 0 ? (
              <p className="muted">No custom blocks set.</p>
            ) : (
              <ul className="muted">
                {car.blockedDates.map((blockedDate) => (
                  <li key={blockedDate.id}>
                    {blockedDate.startDate.toLocaleDateString()} -{" "}
                    {blockedDate.endDate.toLocaleDateString()}{" "}
                    {blockedDate.reason ? `(${blockedDate.reason})` : ""}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <BookingForm
          car={{
            id: car.id,
            name: car.name,
            dailyPrice: car.dailyPrice,
          }}
          blockedDates={car.blockedDates.map((blockedDate) => ({
            startDate: blockedDate.startDate.toISOString(),
            endDate: blockedDate.endDate.toISOString(),
            reason: blockedDate.reason,
          }))}
        />
      </div>
    </div>
  );
}
