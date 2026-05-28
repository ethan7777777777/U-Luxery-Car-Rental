import Link from "next/link";

export default function BookingSuccessPage() {
  return (
    <div className="container" style={{ padding: "2.2rem 0 3rem" }}>
      <section className="panel" style={{ maxWidth: 700, margin: "0 auto" }}>
        <h1>Booking Submitted Successfully</h1>
        <p className="muted">
          Your executive rental request and payment are saved. Our concierge desk has
          been notified and will confirm final itinerary details shortly.
        </p>
        <Link className="btn" href="/">
          Return to Fleet
        </Link>
      </section>
    </div>
  );
}
