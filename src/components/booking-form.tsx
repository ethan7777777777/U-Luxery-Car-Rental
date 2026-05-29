"use client";

import { useMemo, useState } from "react";

import { formatCurrency, overlap } from "@/lib/utils";

type BookingFormProps = {
  car: {
    id: string;
    name: string;
    dailyPrice: number;
  };
  blockedDates: {
    startDate: string;
    endDate: string;
    reason?: string | null;
  }[];
};

export function BookingForm({ car, blockedDates }: BookingFormProps) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [licenseUrl, setLicenseUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const minimumDate = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const blockedConflict = useMemo(() => {
    if (!startDate || !endDate) return null;

    const requestStart = new Date(startDate);
    const requestEnd = new Date(endDate);
    return blockedDates.find((blockedDate) =>
      overlap(
        requestStart,
        requestEnd,
        new Date(blockedDate.startDate),
        new Date(blockedDate.endDate),
      ),
    );
  }, [startDate, endDate, blockedDates]);

  async function handleFileUpload() {
    if (!licenseFile) return "";
    const formData = new FormData();
    formData.append("file", licenseFile);
    const response = await fetch("/api/upload/license", { method: "POST", body: formData });
    if (!response.ok) throw new Error("Failed to upload driver license.");
    const data = (await response.json()) as { url: string };
    setLicenseUrl(data.url);
    return data.url;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (blockedConflict) {
      setError(
        blockedConflict.reason ||
          "Those dates are currently unavailable. Please choose different dates.",
      );
      return;
    }

    setSubmitting(true);
    try {
      const uploadedLicenseUrl = licenseUrl || (await handleFileUpload());
      const response = await fetch("/api/booking-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleId: car.id,
          name,
          email,
          phone,
          startDate,
          endDate,
          licenseUrl: uploadedLicenseUrl || null,
        }),
      });

      const data = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(data.message || "Could not submit booking request.");

      setSuccess(
        "Your booking request was submitted successfully. Our concierge team will contact you shortly.",
      );
      setStartDate("");
      setEndDate("");
      setName("");
      setEmail("");
      setPhone("");
      setLicenseFile(null);
      setLicenseUrl("");
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Booking request failed.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="panel">
      <h2>Booking Request: {car.name}</h2>
      <p className="muted">From {formatCurrency(car.dailyPrice)} / day</p>

      <form className="form-grid" onSubmit={handleSubmit}>
        <div className="field-row">
          <label>
            Start Date
            <input
              type="date"
              min={minimumDate}
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              required
            />
          </label>
          <label>
            End Date
            <input
              type="date"
              min={startDate || minimumDate}
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              required
            />
          </label>
        </div>

        {blockedConflict && (
          <div className="status error">
            {blockedConflict.reason || "Selected dates include unavailable dates."}
          </div>
        )}

        <label>
          Full Name
          <input value={name} onChange={(event) => setName(event.target.value)} required />
        </label>

        <div className="field-row">
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label>
            Phone
            <input value={phone} onChange={(event) => setPhone(event.target.value)} required />
          </label>
        </div>

        <label>
          Driver License Upload (Optional)
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            onChange={(event) => setLicenseFile(event.target.files?.[0] ?? null)}
          />
        </label>

        <p className="muted" style={{ marginTop: 0 }}>
          By submitting, you agree to our data collection for booking request handling.
          California residents can manage privacy rights via the{" "}
          <a href="/privacy-request">Privacy Request</a> page.
        </p>

        {error && <div className="status error">{error}</div>}
        {success && <div className="status ok">{success}</div>}

        <button type="submit" disabled={submitting || Boolean(blockedConflict)}>
          {submitting ? "Submitting..." : "Submit Booking Request"}
        </button>
      </form>
    </section>
  );
}
