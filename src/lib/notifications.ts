import { format } from "date-fns";
import { Resend } from "resend";

type BookingNotificationPayload = {
  carName: string;
  bookingId: string;
  customerName: string;
  customerEmail: string;
  startDate: Date;
  endDate: Date;
  chargedAmountCents: number;
  paymentType: string;
};

export async function notifyAdminOfBooking(payload: BookingNotificationPayload) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.ADMIN_NOTIFICATION_EMAIL;
  const from = process.env.NOTIFICATION_FROM_EMAIL;

  if (!apiKey || !to || !from) {
    console.info(
      "[booking-notification] Skipped email (missing RESEND_API_KEY / ADMIN_NOTIFICATION_EMAIL / NOTIFICATION_FROM_EMAIL).",
    );
    return;
  }

  const resend = new Resend(apiKey);
  await resend.emails.send({
    from,
    to,
    subject: `New booking confirmed: ${payload.carName}`,
    html: `
      <h2>New booking confirmed</h2>
      <p><strong>Booking ID:</strong> ${payload.bookingId}</p>
      <p><strong>Vehicle:</strong> ${payload.carName}</p>
      <p><strong>Customer:</strong> ${payload.customerName} (${payload.customerEmail})</p>
      <p><strong>Dates:</strong> ${format(payload.startDate, "PPP")} to ${format(payload.endDate, "PPP")}</p>
      <p><strong>Amount Charged:</strong> $${(payload.chargedAmountCents / 100).toLocaleString("en-US")}</p>
      <p><strong>Payment Type:</strong> ${payload.paymentType}</p>
    `,
  });
}
