# NEXORA — Complete REST API Documentation

Base URL: `http://localhost:5000/api`

## Authentication (`/api/auth`)
- `POST /register`: Register a customer or provider account.
  - Body: `{ name, email, password, phone, role, locality, category?, hourlyRate? }`
- `POST /login`: Authenticate with email & password. Returns JWT token.
- `GET /me`: Retrieve currently authenticated user profile (`Bearer <token>`).
- `POST /otp/request`: Trigger SMS OTP verification code.
- `POST /otp/verify`: Validate 6-digit OTP and establish session.

## Services & Discovery (`/api/services`)
- `GET /`: Search and filter services (`?category=&search=&maxPrice=`).
- `GET /:id`: Retrieve service details, provider profile, and verified customer reviews.
- `POST /`: Create service (Provider / Admin only).
- `PUT /:id`: Update service (Provider ownership verified).
- `DELETE /:id`: Delete service (Provider ownership verified).

## Hyperlocal AI Matching (`/api/ai`)
- `POST /match`: Parse natural language prompt (e.g., "Need electrician tomorrow morning in Bandra for 2 hours") and return ranked providers with transparent match explanations.

## Bookings Lifecycle (`/api/bookings`)
- `POST /`: Create booking request with transparent price snapshot and conflict check.
- `GET /`: List bookings for current user (customer or provider).
- `GET /:id`: Retrieve booking details, status history, and conversation.
- `PATCH /:id/status`: Update status (`accepted`, `in_progress`, `completed`, `cancelled`).
- `POST /:id/report-payment`: Provider records cash/UPI collection.
- `POST /:id/confirm-payment`: Customer verifies payment receipt.

## Customer Reviews (`/api/reviews`)
- `POST /`: Submit review (strictly permitted only on completed bookings with rating score recalculation).
- `GET /provider/:providerId`: Fetch all reviews for a provider.

## Live Chat (`/api/chat`)
- `GET /:bookingId`: Retrieve conversation messages between customer and provider.
- `POST /:bookingId`: Send a message with participant authorization.

## Platform Administration (`/api/admin`)
- `GET /stats`: High-level KPIs (Total Users, Providers, GMV, Accrued Commissions).
- `GET /verifications`: Pending provider verification queue.
- `POST /verifications/:providerId`: Approve or reject provider credentials.
- `GET /users`: Full user directory with status.
- `PATCH /users/:userId/toggle-status`: Suspend or activate account.
- `GET /commissions`: Platform commission ledger.
- `POST /commissions/:commissionId/reconcile`: Reconcile commission remittance.
- `GET /audit-logs`: Complete administrative audit trail.
