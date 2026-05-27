"use client";

import { useMemo, useState } from "react";

import { formatCurrency, getRentalDays } from "@/lib/utils";

type BookingFormProps = {
  car: {
    id: string;
    name: string;
    dailyPrice: number;
  };
  bookingEnabled?: boolean;
};

type AvailabilityResponse = {
  available: boolean;
  reason: string | null;
};

const DEPOSIT_PERCENTAGE = 0.3;

export function BookingForm({ car, bookingEnabled = true }: BookingFormProps) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [pickupTime, setPickupTime] = useState("10:00");
  const [returnTime, setReturnTime] = useState("10:00");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentType, setPaymentType] = useState<"DEPOSIT" | "FULL">("DEPOSIT");
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [licenseUrl, setLicenseUrl] = useState("");
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const minimumDate = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const pricing = useMemo(() => {
    if (!startDate || !endDate) {
      return { days: 0, fullAmount: 0, depositAmount: 0, dueToday: 0 };
    }
    const days = getRentalDays(new Date(startDate), new Date(endDate));
    const fullAmount = days * car.dailyPrice;
    const depositAmount = Math.ceil(fullAmount * DEPOSIT_PERCENTAGE);
    const dueToday = paymentType === "FULL" ? fullAmount : depositAmount;
    return { days, fullAmount, depositAmount, dueToday };
  }, [startDate, endDate, car.dailyPrice, paymentType]);

  async function runAvailabilityCheck(nextStartDate: string, nextEndDate: string) {
    if (!nextStartDate || !nextEndDate) {
      setAvailability(null);
      return;
    }

    setCheckingAvailability(true);
    setError(null);
    try {
      if (!bookingEnabled) {
        setAvailability({
          available: false,
          reason: "Booking is currently unavailable while setup is being finalized.",
        });
        return;
      }
      const response = await fetch(
        `/api/availability?carId=${car.id}&startDate=${nextStartDate}&endDate=${nextEndDate}`,
      );
      if (!response.ok) {
        throw new Error("Could not check availability.");
      }
      const data = (await response.json()) as AvailabilityResponse;
      setAvailability(data);
    } catch (availabilityError) {
      setAvailability(null);
      setError(
        availabilityError instanceof Error
          ? availabilityError.message
          : "Availability check failed.",
      );
    } finally {
      setCheckingAvailability(false);
    }
  }

  async function handleFileUpload() {
    if (!licenseFile) return "";

    const formData = new FormData();
    formData.append("file", licenseFile);

    const response = await fetch("/api/upload/license", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to upload driver license.");
    }

    const data = (await response.json()) as { url: string };
    setLicenseUrl(data.url);
    return data.url;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError(null);
    if (!agreementAccepted) {
      setError("You must accept the rental agreement to continue.");
      return;
    }

    if (!availability?.available) {
      setError("Please select available dates before checkout.");
      return;
    }

    setSubmitting(true);

    try {
      if (!bookingEnabled) {
        throw new Error("Booking is currently unavailable.");
      }
      const uploadedLicenseUrl = licenseUrl || (await handleFileUpload());
      if (!uploadedLicenseUrl) {
        throw new Error("Driver license upload is required.");
      }

      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          carId: car.id,
          startDate,
          endDate,
          pickupTime,
          returnTime,
          firstName,
          lastName,
          email,
          phone,
          notes,
          paymentType,
          agreementAccepted,
          licenseUrl: uploadedLicenseUrl,
        }),
      });

      const data = (await response.json()) as { checkoutUrl?: string; message?: string };
      if (!response.ok || !data.checkoutUrl) {
        throw new Error(data.message || "Could not create checkout session.");
      }

      window.location.href = data.checkoutUrl;
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Booking submission failed.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="panel">
      <h2>Book {car.name}</h2>
      <form className="form-grid" onSubmit={handleSubmit}>
        <div className="field-row">
          <label>
            Start Date
            <input
              type="date"
              min={minimumDate}
              value={startDate}
              onChange={(event) => {
                const value = event.target.value;
                setStartDate(value);
                void runAvailabilityCheck(value, endDate);
              }}
              required
            />
          </label>
          <label>
            End Date
            <input
              type="date"
              min={startDate || minimumDate}
              value={endDate}
              onChange={(event) => {
                const value = event.target.value;
                setEndDate(value);
                void runAvailabilityCheck(startDate, value);
              }}
              required
            />
          </label>
        </div>

        <div className="field-row">
          <label>
            Pickup Time
            <input
              type="time"
              value={pickupTime}
              onChange={(event) => setPickupTime(event.target.value)}
              required
            />
          </label>
          <label>
            Return Time
            <input
              type="time"
              value={returnTime}
              onChange={(event) => setReturnTime(event.target.value)}
              required
            />
          </label>
        </div>

        {checkingAvailability && <div className="status">Checking availability...</div>}
        {!checkingAvailability && availability?.available && (
          <div className="status ok">Vehicle is available for those dates.</div>
        )}
        {!checkingAvailability && availability && !availability.available && (
          <div className="status error">
            {availability.reason || "Vehicle is not available for those dates."}
          </div>
        )}

        <div className="field-row">
          <label>
            First Name
            <input
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              required
            />
          </label>
          <label>
            Last Name
            <input
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              required
            />
          </label>
        </div>

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
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              required
            />
          </label>
        </div>

        <label>
          Driver License Upload
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            onChange={(event) => setLicenseFile(event.target.files?.[0] ?? null)}
            required={!licenseUrl}
          />
        </label>

        <fieldset className="panel">
          <legend>Payment Option</legend>
          <div className="form-grid">
            <label>
              <input
                type="radio"
                name="paymentType"
                value="DEPOSIT"
                checked={paymentType === "DEPOSIT"}
                onChange={() => setPaymentType("DEPOSIT")}
              />{" "}
              Pay Deposit ({Math.round(DEPOSIT_PERCENTAGE * 100)}%)
            </label>
            <label>
              <input
                type="radio"
                name="paymentType"
                value="FULL"
                checked={paymentType === "FULL"}
                onChange={() => setPaymentType("FULL")}
              />{" "}
              Pay Full Amount
            </label>
          </div>
        </fieldset>

        <div className="panel">
          <strong>Pricing Summary</strong>
          <p className="muted" style={{ marginBottom: 0 }}>
            {pricing.days} day(s) × {formatCurrency(car.dailyPrice)} ={" "}
            {formatCurrency(pricing.fullAmount)}
            <br />
            Due now: {formatCurrency(pricing.dueToday)}
          </p>
        </div>

        <label>
          Additional Notes
          <textarea
            rows={3}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Pickup preferences, delivery address, flight details..."
          />
        </label>

        <label>
          <input
            type="checkbox"
            checked={agreementAccepted}
            onChange={(event) => setAgreementAccepted(event.target.checked)}
          />{" "}
          I have read and accept the rental agreement terms.
        </label>

        {error && <div className="status error">{error}</div>}

        <button
          type="submit"
          disabled={submitting || !availability?.available || !bookingEnabled}
        >
          {submitting ? "Processing..." : "Book Now"}
        </button>
      </form>
    </section>
  );
}
