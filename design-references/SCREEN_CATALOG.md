# NEXORA Complete Screen Catalog & UX Specifications

This document defines the functional and visual specifications for all 18 screens across Customer, Provider, and Admin platforms, maintaining visual alignment with the approved NEXORA design reference.

---

## 1. Customer Screens

### Screen 1: Customer Homepage
- **Header**: Sticky navigation with NEXORA logo (Forest green `#0F382C` icon), location pill (`Bandra, Mumbai \/`), search shortcut, "Explore Services", "Become a Provider", and "Sign In / Join".
- **Hero Section**:
  - Clean forest-tinted backdrop with bold typography: "Expert Local Services, Intelligently Matched."
  - Natural Language AI Search Box: Large floating card with input, placeholder: "e.g., Electrician tomorrow morning for 2 hours in Bandra, budget under ₹800".
  - One-click quick search tags: "AC Repair", "Deep Cleaning", "Emergency Plumber", "Carpenter".
- **Category Grid**: 8 cleanly styled cards with custom SVG icons (Electrical, Plumbing, Home Cleaning, Carpentry, Painting, Appliance Repair, Gardening, Helpers).
- **Featured & Verified Providers**: Carousel of top-rated verified local professionals with badge, rating, hourly price, and instant book button.
- **How NEXORA Works**: 3 steps with subtle icons (Describe Task -> Smart Match -> Verified Service & Secure Pay).
- **Trust & Safety Section**: Explaining verified identity, insurance protection, and direct UPI/Cash settlements.
- **Genuine Reviews**: Real verified booking reviews with customer name, provider name, and date.
- **Footer**: Detailed site map, terms, privacy, dispute policy, support contact.

### Screen 2: Service Search & Results
- **Layout**: Top active filter bar + left filter sidebar + main service card results grid.
- **Filters**:
  - Category multi-select
  - Location / Radius (5km, 10km, 25km, All)
  - Price range slider (Min - Max)
  - Rating threshold (4.5+, 4.0+, 3.5+)
  - Availability (Today, Tomorrow, Specific Date)
- **AI Match Banner**: When a natural language task query is entered, displays the AI match breakdown: "Found 6 providers matching 'electrician tomorrow morning' with verified skills."
- **Empty State**: Friendly illustration and "No providers found in this exact radius. Try widening your distance or clearing filters."

### Screen 3: Service Detail & Provider Profile
- **Header**: Provider photo, verified badge, aggregate rating, completed jobs count, response time.
- **Main Content**:
  - Service Overview, about provider, verified credentials & ID check status.
  - Included services checklist & exclusions.
  - Direct customer reviews with breakdown of ratings (Punctuality, Quality, Professionalism).
- **Sticky Booking Card**:
  - Service price snapshot (Hourly / Fixed rate).
  - Date & Time slot picker with real-time availability indicator.
  - Task notes textarea.
  - Price breakdown: Base Price + Platform Fee (10%) = Total Payable.
  - CTA: "Request Booking" / "Book Now".

### Screen 4: Customer Dashboard
- **Navigation Tabs**: My Bookings, Saved Providers, Messages, Notifications, Settings.
- **Bookings Management**:
  - Filter by status: All, Active, Completed, Cancelled.
  - Detailed Booking Card: Service title, Provider avatar, Scheduled date & time, Address, Price snapshot.
  - Live Status Timeline: `Pending` -> `Accepted` -> `In Progress` -> `Completed`.
  - Actions: "Message", "Reschedule", "Cancel Booking" (with reason modal), "Confirm Payment", "Leave Review".

### Screen 5: Booking Details & Live Chat
- **Split View / Drawer**: Booking summary card on the left, live real-time chat on the right.
- **Chat Features**: Instant messages between Customer and Provider, status event notices (e.g., "Provider accepted your request"), payment confirmation prompt.

### Screen 6: Customer Profile & Settings
- Personal details (Name, Email, Phone number with verified status).
- Saved addresses with primary tag.
- Communication preferences (Email alerts, SMS, In-app).
- Privacy controls & Account deletion request.

---

## 2. Provider Screens

### Screen 7: Provider Registration & Onboarding
- **Multi-step Onboarding**:
  - Step 1: Basic Info & Contact details.
  - Step 2: Service Category & Primary Skills.
  - Step 3: Identity Verification (Govt ID type, ID number, document upload simulation).
  - Step 4: Service Area Radius & Base Pricing.
- Status indicator: "Under Review by NEXORA Admin" with live verification status badge.

### Screen 8: Provider Dashboard & Overview
- **Key Metrics**:
  - Today's Bookings
  - Total Revenue / Earnings
  - Outstanding Platform Commission (10% due to NEXORA)
  - Overall Rating & Review Count
- **Incoming Booking Requests Card**:
  - Customer name, task location, requested time, task notes.
  - Action buttons: "Accept Booking" (Green) or "Decline" (with quick reason dropdown).

### Screen 9: Provider Service Management
- List of services offered by provider.
- "Create New Service" modal: Title, Category, Pricing model (Hourly/Fixed), Base price, Description, Service area radius.
- Quick toggle: Active / Paused.

### Screen 10: Provider Availability & Schedule
- Weekly calendar grid.
- Working hours per day (e.g. 09:00 AM - 07:00 PM).
- Blackout dates / Time-off selector.
- Double-booking prevention toggle.

### Screen 11: Provider Earnings & Commission Reconciliation
- Detailed earnings table: Booking ID, Customer, Service, Date, Amount Collected (Cash/UPI), Platform Commission (10%), Settlement Status.
- "Record UPI / Cash Received" action.
- NEXORA Commission remittance instructions and payment reference submission.

---

## 3. Administrator Screens

### Screen 12: Admin Platform Overview & Analytics
- Platform stats: Total Users, Total Providers, Pending Verifications, Active Bookings, Total GMV, Total NEXORA Commissions.
- Quick alerts: Pending provider verification queue, active dispute escalations.
- Recent platform activity log.

### Screen 13: Provider Verification & Approvals
- Table of providers awaiting verification.
- Document review modal: ID type, ID number, verification submission date.
- Actions: "Approve Provider" (grants Verified badge and activates services) or "Reject" (with reason sent to provider).

### Screen 14: User & Provider Management
- Full searchable list of all users and providers.
- Filters: Role (Customer, Provider, Admin), Status (Active, Suspended, Pending).
- Actions: View profile, toggle account suspension, reset password link.

### Screen 15: Booking Oversight & Dispute Resolution
- Comprehensive bookings table with search by Booking ID, customer or provider.
- Dispute cases list: Customer complaint, Provider response, evidence.
- Admin actions: "Resolve Dispute", "Enforce Refund / Cancellation", "Reassign Provider".

### Screen 16: Commission & Financial Reconciliation
- List of provider commission balances.
- Settlement status: `Unpaid`, `Settlement_Pending`, `Reconciled`.
- Action: "Mark Reconciled" with reference number.

---

## 4. Shared & Authentication Screens

### Screen 17: Unified Authentication (Login & Register)
- Clean card on forest green tinted background.
- Toggle: "Customer" vs "Service Provider".
- Options: Email & Password, Phone Number OTP, Social buttons (Google, Apple).
- Form validation with clear error messaging and password strength helper.

### Screen 18: Account Recovery & Password Reset
- "Forgot Password" with email submission.
- Secure token generation and reset password form with confirmation.
