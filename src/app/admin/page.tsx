import Link from "next/link";
import { redirect } from "next/navigation";

import {
  adminLogoutAction,
  createBlockedDateAction,
  createOrUpdateCarAction,
  markBookingPaidAction,
  removeBlockedDateAction,
  removeCarAction,
  updateBookingStatusAction,
} from "@/app/admin/actions";
import { isAdminAuthenticated } from "@/lib/auth";
import { hasDatabaseUrl } from "@/lib/config";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) {
    redirect("/admin/login");
  }

  if (!hasDatabaseUrl) {
    return (
      <div className="container" style={{ padding: "1.5rem 0 3rem" }}>
        <section className="panel">
          <h1>Admin Dashboard</h1>
          <div className="status error">
            Database is not configured. Set `DATABASE_URL` in Vercel or `.env.local`
            to enable admin features.
          </div>
        </section>
      </div>
    );
  }

  const [bookings, cars, blockedDates] = await Promise.all([
    prisma.booking.findMany({
      include: { car: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.car.findMany({
      include: {
        images: {
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.blockedDate.findMany({
      include: { car: true },
      orderBy: { startDate: "asc" },
    }),
  ]);

  return (
    <div className="container" style={{ padding: "1.2rem 0 3rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "0.8rem" }}>
        <h1>Admin Dashboard</h1>
        <form action={adminLogoutAction}>
          <button className="btn-secondary" type="submit">
            Log Out
          </button>
        </form>
      </div>

      <section className="panel" style={{ marginBottom: "1rem" }}>
        <h2>Cars (Add / Edit / Remove)</h2>
        <p className="muted">Submit with an existing Car ID to edit; leave Car ID empty to add.</p>
        <form className="form-grid" action={createOrUpdateCarAction}>
          <div className="field-row">
            <label>
              Car ID (edit only)
              <input name="id" />
            </label>
            <label>
              Slug
              <input name="slug" required />
            </label>
          </div>
          <div className="field-row">
            <label>
              Name
              <input name="name" required />
            </label>
            <label>
              Brand
              <input name="brand" required />
            </label>
          </div>
          <div className="field-row">
            <label>
              Model
              <input name="model" required />
            </label>
            <label>
              Year
              <input name="year" type="number" min={2000} max={2100} required />
            </label>
          </div>
          <div className="field-row">
            <label>
              Daily Price (cents)
              <input name="dailyPrice" type="number" min={10000} required />
            </label>
            <label>
              Thumbnail URL
              <input name="thumbnailUrl" type="url" required />
            </label>
          </div>
          <label>
            Description
            <textarea name="description" rows={3} required />
          </label>
          <label>
            Gallery Image URLs (one per line)
            <textarea name="imageUrls" rows={4} required />
          </label>
          <button type="submit">Save Car</button>
        </form>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Car</th>
                <th>Price</th>
                <th>Booking Page</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {cars.map((car) => (
                <tr key={car.id}>
                  <td>{car.id}</td>
                  <td>
                    {car.name}
                    <div className="muted">{car.slug}</div>
                  </td>
                  <td>{formatCurrency(car.dailyPrice)}</td>
                  <td>
                    <Link href={`/cars/${car.slug}`}>Open</Link>
                  </td>
                  <td>
                    <form action={removeCarAction}>
                      <input type="hidden" name="id" value={car.id} />
                      <button className="btn-secondary" type="submit">
                        Remove
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel" style={{ marginBottom: "1rem" }}>
        <h2>Bookings</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Created</th>
                <th>Car</th>
                <th>Customer</th>
                <th>Dates</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id}>
                  <td>{booking.createdAt.toLocaleString()}</td>
                  <td>{booking.car.name}</td>
                  <td>
                    {booking.firstName} {booking.lastName}
                    <div className="muted">{booking.email}</div>
                  </td>
                  <td>
                    {booking.startDate.toLocaleDateString()} -{" "}
                    {booking.endDate.toLocaleDateString()}
                  </td>
                  <td>
                    {booking.status}
                    <div className="muted">{booking.paymentStatus}</div>
                  </td>
                  <td>
                    {formatCurrency(booking.chargedAmountCents)}
                    <div className="muted">{booking.paymentType}</div>
                  </td>
                  <td>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                      <form action={updateBookingStatusAction}>
                        <input type="hidden" name="id" value={booking.id} />
                        <input type="hidden" name="status" value="APPROVED" />
                        <button type="submit" className="btn-secondary">
                          Approve
                        </button>
                      </form>
                      <form action={updateBookingStatusAction}>
                        <input type="hidden" name="id" value={booking.id} />
                        <input type="hidden" name="status" value="REJECTED" />
                        <button type="submit" className="btn-secondary">
                          Reject
                        </button>
                      </form>
                      <form action={markBookingPaidAction}>
                        <input type="hidden" name="id" value={booking.id} />
                        <button type="submit" className="btn-secondary">
                          Mark Paid
                        </button>
                      </form>
                    </div>
                    <div style={{ marginTop: "0.3rem" }}>
                      <Link href={booking.licenseUrl} target="_blank">
                        View License
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <h2>Blocked Dates</h2>
        <form className="form-grid" action={createBlockedDateAction}>
          <div className="field-row">
            <label>
              Car
              <select name="carId" required>
                {cars.map((car) => (
                  <option key={car.id} value={car.id}>
                    {car.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Reason
              <input name="reason" placeholder="Maintenance, private use..." />
            </label>
          </div>
          <div className="field-row">
            <label>
              Start Date
              <input type="date" name="startDate" required />
            </label>
            <label>
              End Date
              <input type="date" name="endDate" required />
            </label>
          </div>
          <button type="submit">Block Dates</button>
        </form>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Car</th>
                <th>Dates</th>
                <th>Reason</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {blockedDates.map((blockedDate) => (
                <tr key={blockedDate.id}>
                  <td>{blockedDate.car.name}</td>
                  <td>
                    {blockedDate.startDate.toLocaleDateString()} -{" "}
                    {blockedDate.endDate.toLocaleDateString()}
                  </td>
                  <td>{blockedDate.reason || "—"}</td>
                  <td>
                    <form action={removeBlockedDateAction}>
                      <input type="hidden" name="id" value={blockedDate.id} />
                      <button className="btn-secondary" type="submit">
                        Remove
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
