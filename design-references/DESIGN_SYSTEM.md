# NEXORA Design System & Visual Specification

## 1. Brand Identity & Positioning
- **Brand Name**: NEXORA
- **Tagline**: Intelligent Hyperlocal Marketplace & Community Platform
- **Visual Personality**: Premium, Modern, Trustworthy, Clean, Professional, Restrained

## 2. Color Palette
- **Deep Forest Green (Primary)**:
  - `forest-900`: `#0A2920` (Dark background accents, deep navbar)
  - `forest-800`: `#0F382C` (Primary Brand Color, Primary CTAs, Header bars)
  - `forest-700`: `#134E3E` (Hover states for primary elements, active navigation)
  - `forest-600`: `#1A6350` (Subtle highlights, borders for selected cards)
  - `forest-500`: `#227D66` (Badges, accents)
- **Soft Neutral Backgrounds**:
  - `neutral-50`: `#F8FAF8` (App background, subtle soft greenish-gray tint)
  - `neutral-100`: `#F1F4F1` (Card background on light mode, table headers)
  - `neutral-200`: `#E5E9E5` (Borders, dividers, input borders)
- **Pure White**:
  - `#FFFFFF` (Surface cards, modals, dropdowns, input backgrounds)
- **Typography & Dark Neutral**:
  - `text-primary`: `#111827` (Headings, primary body text)
  - `text-secondary`: `#4B5563` (Subtitles, descriptions, labels)
  - `text-muted`: `#9CA3AF` (Placeholders, secondary metadata, timestamps)
- **Accents & Status**:
  - `accent-emerald`: `#10B981` (Success status, verified provider badge, ratings star)
  - `accent-amber`: `#F59E0B` (Pending bookings, review stars, warnings)
  - `accent-rose`: `#EF4444` (Cancellations, errors, rejected status, dispute alert)
  - `accent-blue`: `#3B82F6` (Information, in-progress jobs, active chat indicators)

## 3. Typography & Hierarchy
- **Font Family**: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
- **Scale**:
  - Display Hero: `text-4xl` / `text-5xl` (Font Weight 700 / 800)
  - Section Headings (H2): `text-2xl` / `text-3xl` (Font Weight 700)
  - Card Headings (H3): `text-lg` / `text-xl` (Font Weight 600)
  - Body Regular: `text-sm` / `text-base` (Font Weight 400 / 500)
  - Captions & Meta: `text-xs` (Font Weight 500 / 600)

## 4. UI Components & Layout Principles
- **Border Radii**: Smooth, refined `rounded-xl` (12px) for cards, `rounded-lg` (8px) for buttons & inputs, `rounded-full` for badges & avatars.
- **Elevation**:
  - Subtle cards: `shadow-sm hover:shadow-md transition-shadow`
  - Floating panels / Modals: `shadow-xl border border-gray-100`
- **Buttons**:
  - Primary: Deep forest green background (`#0F382C`), crisp white text, subtle hover lift.
  - Secondary: Soft neutral background (`#F1F4F1`), forest green text, hover tint.
  - Outline: 1px border (`#0F382C`), transparent background, forest green text.
  - Danger: Rose background or outline for destructive actions (e.g., cancel booking).
- **Service Cards**:
  - High quality provider photography with aspect ratio 16:9 or 4:3.
  - Provider avatar with green verification checkmark badge.
  - Star rating with total review count.
  - Transparent pricing snapshot: starting rate, unit (per hour / fixed).
  - Quick action: "Book Now" and "View Details".

## 5. Master Screen Specifications
1. **Customer Homepage**:
   - Hero banner with natural language task search bar: "e.g. Electrician tomorrow morning for 2 hours"
   - Location selector dropdown with geolocation and manual city/locality entry.
   - 8 Popular service category pills (Electrical, Plumbing, Home Cleaning, Carpentry, Painting, Appliance Repair, Gardening, Moving & Helpers).
   - "Verified & Top-Rated Local Experts" carousel/grid.
   - "Why NEXORA Works" 3-step timeline (Describe Task -> Smart Match -> Verified Service & Secure Pay).
   - Real customer testimonials slider.
   - "Become a Service Provider" dedicated banner with instant onboarding button.
   - Comprehensive footer with policy, dispute guidelines, safety terms, and contact.

2. **Service Search & Listing Results**:
   - Split layout or filter sidebar + grid.
   - Filters: Category, Price slider, Rating (4.0+), Availability (Today, Tomorrow, Weekend), Radius distance (5km, 10km, 25km).
   - Sort dropdown: Relevance, Highest Rated, Lowest Price, Distance.
   - Active filter tags with single-click dismissal.
   - Results count and clean empty states ("No providers found in this radius - expand search").

3. **Service Detail & Provider Profile**:
   - Provider header with verified checkmark, joined date, completed jobs count.
   - Service gallery, detailed description, skills & certifications list.
   - Dynamic booking widget: date picker, time slot selector, pricing calculation snapshot.
   - Customer review section with score breakdown and genuine reviews from verified bookings.
   - Guarantee & cancellation policy badge.

4. **Authentication Pages (Login & Register)**:
   - Centered card layout on soft neutral background with forest green branding.
   - Tabbed or dedicated switcher: Customer Account vs Service Provider Account.
   - Email & password with password strength meter.
   - Phone OTP tab with countdown resend timer.
   - Google & Apple OAuth buttons with proper brand guidelines.
   - Forgot password recovery modal.

5. **Customer Dashboard**:
   - Sidebar / top tabs: Bookings, Saved Providers, Messages, Notifications, Settings.
   - Booking cards displaying status pills: `Pending`, `Accepted`, `In Progress`, `Completed`, `Cancelled`.
   - Action buttons: "Message Provider", "Reschedule", "Cancel Booking", "Pay via Cash/UPI", "Leave Review".
   - Integrated live chat drawer for active bookings.

6. **Provider Dashboard**:
   - Metric cards: Today's Jobs, Monthly Earnings, Outstanding NEXORA Commission, Average Rating.
   - Incoming Booking Requests with 1-click "Accept" or "Decline" with reason.
   - Availability Manager: Set working hours, toggle emergency jobs, mark blackout dates.
   - My Services tab: Add new service, upload photos, set pricing tiers, pause/activate service.
   - Earnings & Payout tab: Recorded cash/UPI transactions, commission reconciliation.

7. **Admin Dashboard**:
   - High-level platform KPIs: Total Users, Active Providers, Bookings Today, GMV, Accrued Commissions.
   - Verification queue: Review pending provider government IDs, business proof, approve/reject with feedback.
   - Booking monitor: Full system oversight with search, status override, dispute resolution.
   - Commission management: Track provider remittances, mark reconciled, generate statements.
   - Platform settings & audit logs.
