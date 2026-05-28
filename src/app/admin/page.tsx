import { redirect } from "next/navigation";

import {
  adminLogoutAction,
  createBlockedDateAction,
  createOrUpdateVehicleAction,
  removeBlockedDateAction,
  removeVehicleAction,
  updateBookingRequestStatusAction,
} from "@/app/admin/actions";
import { isAdminAuthenticated } from "@/lib/auth";
import { hasSupabaseConfig } from "@/lib/config";
import { getTierMeta } from "@/lib/tier";
import { formatCurrency } from "@/lib/utils";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");

  if (!hasSupabaseConfig) {
    return (
      <div className="container" style={{ padding: "1.5rem 0 3rem" }}>
        <section className="panel">
          <h1>Executive Rental Admin</h1>
          <div className="status error">Supabase env variables are not configured.</div>
        </section>
      </div>
    );
  }

  const supabase = getSupabaseAdmin();
  const [{ data: vehiclesRaw }, { data: bookingsRaw }, { data: blockedDatesRaw }] =
    await Promise.all([
    supabase.from("vehicles").select("*").order("price_per_day", { ascending: true }),
    supabase
      .from("bookings")
      .select("*, vehicles(name)")
      .order("created_at", { ascending: false }),
    supabase
      .from("blocked_dates")
      .select("*, vehicles(name)")
      .order("blocked_from", { ascending: true }),
    ]);

  const vehicles = (vehiclesRaw || []) as {
    id: string;
    name: string;
    slug: string;
    year: number;
    price_per_day: number;
    is_active: boolean;
  }[];
  const bookings = (bookingsRaw || []) as {
    id: string;
    vehicle_id: string;
    customer_name: string | null;
    email: string;
    start_date: string;
    end_date: string;
    created_at: string;
    booking_status: string;
    vehicles?: { name?: string } | null;
  }[];
  const blockedDates = (blockedDatesRaw || []) as {
    id: string;
    blocked_from: string;
    blocked_to: string;
    reason: string | null;
    vehicles?: { name?: string } | null;
  }[];

  const rows = (vehicles || []).map((vehicle) => {
    const vehicleBookings = bookings.filter((booking) => booking.vehicle_id === vehicle.id);
    return {
      id: vehicle.id,
      name: vehicle.name,
      tier: getTierMeta({
        slug: vehicle.slug,
        year: vehicle.year,
        dailyPrice: vehicle.price_per_day,
      }).label,
      total: vehicleBookings.length,
      pending: vehicleBookings.filter((booking) => booking.booking_status === "PENDING").length,
    };
  });

  return (
    <div className="container" style={{ padding: "1.2rem 0 3rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "0.8rem" }}>
        <h1>Executive Rental Admin</h1>
        <form action={adminLogoutAction}>
          <button className="btn-secondary" type="submit">
            Log Out
          </button>
        </form>
      </div>

      <section className="panel" style={{ marginBottom: "1rem" }}>
        <h2>Demand Snapshot</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Tier</th>
                <th>Total Requests</th>
                <th>Pending Requests</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.name}</td>
                  <td>{row.tier}</td>
                  <td>{row.total}</td>
                  <td>{row.pending}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel" style={{ marginBottom: "1rem" }}>
        <h2>Manage Vehicles</h2>
        <form className="form-grid" action={createOrUpdateVehicleAction}>
          <div className="field-row">
            <label>
              Vehicle ID (edit only)
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
              <input name="brand" defaultValue="Rolls-Royce" required />
            </label>
          </div>
          <div className="field-row">
            <label>
              Model
              <input name="model" required />
            </label>
            <label>
              Tier
              <select name="tier" required>
                <option value="classic">classic</option>
                <option value="modern">modern</option>
                <option value="ultra">ultra</option>
              </select>
            </label>
          </div>
          <div className="field-row">
            <label>
              Year
              <input name="year" type="number" min={1950} max={2100} required />
            </label>
            <label>
              Price Per Day (cents)
              <input name="pricePerDay" type="number" min={10000} required />
            </label>
          </div>
          <label>
            Main Image URL
            <input name="imageUrl" type="url" required />
          </label>
          <label>
            Description
            <textarea name="description" rows={3} required />
          </label>
          <label>
            Gallery URLs (one per line)
            <textarea name="imageUrls" rows={3} />
          </label>
          <button type="submit">Save Vehicle</button>
        </form>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Vehicle</th>
                <th>Price</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {vehicles.map((vehicle) => (
                <tr key={vehicle.id}>
                  <td>{vehicle.id}</td>
                  <td>{vehicle.name}</td>
                  <td>{formatCurrency(vehicle.price_per_day)}</td>
                  <td>{vehicle.is_active ? "Active" : "Inactive"}</td>
                  <td>
                    <form action={removeVehicleAction}>
                      <input type="hidden" name="id" value={vehicle.id} />
                      <button className="btn-secondary" type="submit">
                        Deactivate
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
        <h2>Booking Requests</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Created</th>
                <th>Vehicle</th>
                <th>Customer</th>
                <th>Dates</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id}>
                  <td>{new Date(booking.created_at).toLocaleString()}</td>
                  <td>{booking.vehicles?.name || "—"}</td>
                  <td>
                    {booking.customer_name}
                    <div className="muted">{booking.email}</div>
                  </td>
                  <td>
                    {new Date(booking.start_date).toLocaleDateString()} -{" "}
                    {new Date(booking.end_date).toLocaleDateString()}
                  </td>
                  <td>{booking.booking_status}</td>
                  <td>
                    <div style={{ display: "flex", gap: "0.35rem" }}>
                      <form action={updateBookingRequestStatusAction}>
                        <input type="hidden" name="id" value={booking.id} />
                        <input type="hidden" name="status" value="APPROVED" />
                        <button className="btn-secondary" type="submit">
                          Approve
                        </button>
                      </form>
                      <form action={updateBookingRequestStatusAction}>
                        <input type="hidden" name="id" value={booking.id} />
                        <input type="hidden" name="status" value="REJECTED" />
                        <button className="btn-secondary" type="submit">
                          Reject
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <h2>Blocked Dates (Visual Disable)</h2>
        <form className="form-grid" action={createBlockedDateAction}>
          <div className="field-row">
            <label>
              Vehicle
              <select name="vehicleId" required>
                {vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Reason
              <input name="reason" placeholder="Maintenance, private charter..." />
            </label>
          </div>
          <div className="field-row">
            <label>
              Blocked From
              <input type="date" name="blockedFrom" required />
            </label>
            <label>
              Blocked To
              <input type="date" name="blockedTo" required />
            </label>
          </div>
          <button type="submit">Add Blocked Dates</button>
        </form>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Date Range</th>
                <th>Reason</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {blockedDates.map((entry) => (
                <tr key={entry.id}>
                  <td>{entry.vehicles?.name || "—"}</td>
                  <td>
                    {new Date(entry.blocked_from).toLocaleDateString()} -{" "}
                    {new Date(entry.blocked_to).toLocaleDateString()}
                  </td>
                  <td>{entry.reason || "—"}</td>
                  <td>
                    <form action={removeBlockedDateAction}>
                      <input type="hidden" name="id" value={entry.id} />
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
