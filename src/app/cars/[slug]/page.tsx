import { notFound } from "next/navigation";

import { BookingForm } from "@/components/booking-form";
import { CarGallery } from "@/components/car-gallery";
import { hasDatabaseUrl } from "@/lib/config";
import { fallbackCars } from "@/lib/fallback-cars";
import { formatCurrency } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type CarPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function CarPage({ params }: CarPageProps) {
  const { slug } = await params;

  const car = hasDatabaseUrl
    ? await prisma.car.findUnique({
        where: { slug },
        include: {
          images: {
            orderBy: { sortOrder: "asc" },
          },
          blockedDates: {
            orderBy: { startDate: "asc" },
          },
        },
      })
    : (() => {
        const fallback = fallbackCars.find((item) => item.slug === slug);
        if (!fallback) return null;
        return {
          ...fallback,
          blockedDates: [],
        };
      })();

  if (!car) {
    notFound();
  }

  return (
    <div className="container" style={{ padding: "1.2rem 0 2rem" }}>
      <h1 style={{ marginBottom: "0.35rem" }}>{car.name}</h1>
      <p className="muted" style={{ marginTop: 0 }}>
        {car.year} {car.brand} {car.model} • {formatCurrency(car.dailyPrice)} / day
      </p>

      <div className="grid-two">
        <div className="form-grid">
          <CarGallery name={car.name} images={car.images} />
          {!hasDatabaseUrl && (
            <section className="panel">
              <div className="status error">
                Booking is disabled until `DATABASE_URL` is configured in Vercel.
              </div>
            </section>
          )}
          <section className="panel">
            <h2>Description</h2>
            <p className="muted">{car.description}</p>
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
          bookingEnabled={hasDatabaseUrl}
        />
      </div>
    </div>
  );
}
