# Blackline Exotics - Supercar Rental Platform

Production-ready luxury supercar rental website built with Next.js, Prisma/Postgres, Stripe checkout, Vercel Blob license uploads, and an admin dashboard.

## Stack

- Next.js (App Router, TypeScript)
- Prisma + PostgreSQL
- Stripe Checkout + Webhooks
- Vercel Blob storage for driver license uploads
- Optional Resend email notifications

## Features

- Homepage listing all available supercars
- Individual car pages with:
  - Image gallery
  - Price per day
  - Simple date/time availability picker
  - Booking form
  - Driver license upload
  - Rental agreement checkbox
  - Deposit/full payment selection
- Instant availability checking (prevents double booking)
- Booking storage in database (customer + payment metadata)
- Stripe payment flow + webhook confirmation
- Admin dashboard:
  - View/manage bookings
  - Approve/reject bookings
  - Mark booking paid
  - Add/edit/remove cars
  - Block/unblock unavailable dates
  - View customer/payment/license data
- Optional admin booking email notifications

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Copy env template and set values:

```bash
cp .env.example .env.local
```

3. Generate Prisma client + push schema + seed starter fleet:

```bash
npm run db:setup
```

4. Run dev server:

```bash
npm run dev
```

5. Open:
- User site: `http://localhost:3000`
- Admin login: `http://localhost:3000/admin/login`

## Stripe Webhook (Local)

Use Stripe CLI to forward webhook events:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Set the returned signing secret as `STRIPE_WEBHOOK_SECRET`.

## Vercel Deployment

1. Push this folder to GitHub.
2. Import the repo in Vercel.
3. Add all `.env.example` variables in Vercel Project Settings.
4. Provision a PostgreSQL database and set `DATABASE_URL`.
5. Redeploy.

Recommended build command:

```bash
npm run build
```

## Important Notes

- `BLOB_READ_WRITE_TOKEN` is required for driver license uploads.
- `NEXT_PUBLIC_APP_URL` must match your domain (for Stripe redirects).
- Admin auth is env-password based (`ADMIN_PASSWORD` + `ADMIN_SESSION_SECRET`).
- Payment confirmations are finalized in `src/app/api/stripe/webhook/route.ts`.
