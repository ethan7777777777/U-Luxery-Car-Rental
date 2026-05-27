import { CarCard } from "@/components/car-card";
import { hasDatabaseUrl } from "@/lib/config";
import { fallbackCars } from "@/lib/fallback-cars";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const cars = hasDatabaseUrl
    ? await prisma.car.findMany({
        orderBy: [{ dailyPrice: "desc" }],
      })
    : fallbackCars;

  return (
    <div className="container">
      <section className="hero">
        <h1>Luxury Supercar Rentals</h1>
        <p>
          Reserve elite vehicles with instant availability, secure Stripe checkout, and
          concierge-grade service built for high-performance experiences.
        </p>
        {!hasDatabaseUrl && (
          <p className="status error">
            Database is not configured yet. Add `DATABASE_URL` in Vercel environment
            variables to enable live bookings.
          </p>
        )}
      </section>

      <section className="car-grid" aria-label="Available cars">
        {cars.map((car) => (
          <CarCard key={car.id} car={car} />
        ))}
      </section>
    </div>
  );
}
