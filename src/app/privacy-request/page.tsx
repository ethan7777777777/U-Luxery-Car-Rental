"use client";

import { useState } from "react";

export default function PrivacyRequestPage() {
  const [requestType, setRequestType] = useState("know");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [details, setDetails] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    setSubmitting(true);
    try {
      const response = await fetch("/api/privacy-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestType,
          fullName,
          email,
          phone: phone || null,
          details: details || null,
        }),
      });
      const data = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(data.message || "Failed to submit privacy request.");
      setMessage("Your privacy request was submitted. We will follow up after verification.");
      setFullName("");
      setEmail("");
      setPhone("");
      setDetails("");
      setRequestType("know");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container" style={{ padding: "1.6rem 0 3rem" }}>
      <section className="panel">
        <h1>Privacy Request</h1>
        <p className="muted">
          California residents can submit requests to know, correct, delete, or opt out
          of sale/sharing of personal information.
        </p>
        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            Request Type
            <select value={requestType} onChange={(event) => setRequestType(event.target.value)}>
              <option value="know">Know / Access</option>
              <option value="correct">Correct</option>
              <option value="delete">Delete</option>
              <option value="opt_out_sale">Opt-Out of Sale/Sharing</option>
              <option value="limit_sensitive_use">Limit Sensitive Use</option>
            </select>
          </label>
          <label>
            Full Name
            <input value={fullName} onChange={(event) => setFullName(event.target.value)} required />
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
              Phone (Optional)
              <input value={phone} onChange={(event) => setPhone(event.target.value)} />
            </label>
          </div>
          <label>
            Additional Details (Optional)
            <textarea value={details} onChange={(event) => setDetails(event.target.value)} rows={4} />
          </label>
          {error && <div className="status error">{error}</div>}
          {message && <div className="status ok">{message}</div>}
          <button type="submit" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Privacy Request"}
          </button>
        </form>
      </section>
    </div>
  );
}
