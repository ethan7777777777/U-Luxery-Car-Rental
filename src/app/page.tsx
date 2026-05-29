import { CarCard } from "@/components/car-card";
import { hasSupabaseConfig } from "@/lib/config";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const cars = hasSupabaseConfig
    ? await (async () => {
        const supabase = getSupabaseAdmin();
        const { data } = await supabase
          .from("vehicles")
          .select("*")
          .eq("is_active", true)
          .order("price_per_day", { ascending: true });
        return (data || []).map((car) => ({
          id: car.id,
          slug: car.slug,
          name: car.name,
          brand: car.brand,
          model: car.model,
          year: car.year,
          dailyPrice: car.price_per_day,
          thumbnailUrl: car.image_url || (car.gallery_urls?.[0] ?? ""),
        }));
      })()
    : [];

  return (
    <div className="container">
      <section className="hero">
        <h1>Private Rolls-Royce Experiences</h1>
        <p>
          Reserve exclusive luxury transportation tailored for executive travel,
          special occasions, and premium client experiences.
        </p>
        <p className="muted">
          Join our early access client list to preview availability, request preferred
          models, and help shape our upcoming luxury fleet.
        </p>
        {!hasSupabaseConfig && (
          <p className="status error">
            Supabase is not configured yet. Add Supabase env variables in Vercel to
            enable live vehicle and booking request data.
          </p>
        )}
      </section>

      <section className="car-grid" aria-label="Available cars">
        {cars.length === 0 ? (
          <article className="panel">
            <h2>No active vehicles available</h2>
            <p className="muted">
              Add or activate vehicles in the admin dashboard to begin collecting booking
              requests.
            </p>
          </article>
        ) : (
          cars.map((car) => <CarCard key={car.id} car={car} />)
        )}
      </section>
    </div>
  );
}
