# Psychologist Practice Management System — Backend

Phase 1: backend foundation + authentication module.
Phase 2: patient profile, medical history, emergency contact,
availability management, and the appointment booking system.

Built for the existing `frontend/` in this `PPM/` workspace — response
shapes and field names match what the frontend's `lib/api/client.ts`
and pages already send/expect, so no frontend redesign is needed.

## Tech stack

- Node.js + Express.js + TypeScript
- MySQL + Prisma ORM
- Zod (request validation)
- JWT (access + refresh tokens)
- bcryptjs (password hashing — pure JS, no native build step)

## What's included

**Phase 1:**

- Project foundation: config, Prisma client, error handling, response
  envelope, validation middleware, auth/role middleware
- Auth module: signup, login, forgot password, reset password, refresh
  token, logout, get current user (`/me`)
- Prisma models: `User`, `Patient`, `MedicalHistory`, `EmergencyContact`,
  `PasswordResetToken`

**Phase 2:**

- Patient profile module (`modules/patient`) — own-profile read/update,
  admin read-only list/detail
- Medical history module (`modules/medical-history`) — upsert pattern,
  patient-owned + admin read-only
- Emergency contact module (`modules/emergency-contact`) — single
  contact per patient, same upsert pattern
- Availability module (`modules/availability`) — admin-only weekly
  recurring slots + blocked dates, plus a public slot-generation
  endpoint
- Appointment module (`modules/appointment`) — public guest booking,
  patient booking/cancel/reschedule, admin
  list/confirm/cancel/reschedule
- New Prisma models: `AvailabilitySlot`, `BlockedDate`, `Appointment`
  (+ `AppointmentStatus`, `AppointmentMode`, `DayOfWeek` enums; added
  `email` to `EmergencyContact`)

**Not included** (explicitly out of scope per the Phase 2 spec):
payment integration, invoices/receipts, blog, FAQ, testimonials,
newsletter, WhatsApp integration, AI chatbot, session notes/therapist
notes, mood tracker/journal/analytics.

---

## 1. Install

```bash
cd backend
npm install
```

## 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

- `DATABASE_URL` — point at a running MySQL instance and an existing
  database, e.g. `mysql://root:password@localhost:3306/psychologist_ppm`
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` — generate two **different**
  random values:
  ```bash
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  ```
  Run it twice, once per secret.
- `CORS_ORIGIN` — your running frontend URL (default `http://localhost:3000`)
- `FRONTEND_URL` — used to build the password-reset link
  (`{FRONTEND_URL}/auth/reset-password/{token}`)

## 3. Set up the database with Prisma

```bash
npx prisma validate          # sanity-check the schema
npx prisma generate          # generate the typed Prisma Client
npx prisma migrate dev       # applies both the Phase 1 `init` and
                              # Phase 2 `phase2_appointments_availability`
                              # migrations already in prisma/migrations/
```

Optional — browse data visually:

```bash
npx prisma studio
```

## 4. Run the server

```bash
npm run dev
```

You should see:

```
Database connected
Server running on port 5001 [development]
```

Health check: `GET http://localhost:5001/health`

### Production build

```bash
npm run build
npm start
```

---

## API route list (Phase 1)

Base path: `/api/auth`

| Method | Route | Auth required | Purpose |
|---|---|---|---|
| POST | `/api/auth/signup` | No | Patient self-registration (creates `User` + `Patient`) |
| POST | `/api/auth/login` | No | Login for patient or admin |
| POST | `/api/auth/forgot-password` | No | Request a password reset link (always returns generic message) |
| POST | `/api/auth/reset-password/:token` | No | Reset password using the raw token from the emailed/logged link |
| POST | `/api/auth/refresh` | No (httpOnly cookie) | Exchange refresh token cookie for a new access token |
| POST | `/api/auth/logout` | No | Clears the refresh token cookie |
| GET | `/api/auth/me` | Yes (`Authorization: Bearer <token>`) | Returns the current authenticated user |

All responses use this envelope:

```json
{
  "success": true,
  "message": "Some message",
  "data": { }
}
```

## API route list (Phase 2)

Base paths: `/api/patient`, `/api/medical-history`, `/api/emergency-contact`, `/api/availability`, `/api/appointments`

| Method | Route | Auth required | Purpose |
|---|---|---|---|
| GET | `/api/patient/me` | Patient | Current patient's own profile |
| PATCH | `/api/patient/me` | Patient | Update own name/email/phone/primaryConcern |
| GET | `/api/patient/admin` | Admin | List all patients |
| GET | `/api/patient/admin/:patientId` | Admin | Single patient profile |
| GET | `/api/medical-history/me` | Patient | Own medical history (empty arrays if none yet) |
| PUT | `/api/medical-history/me` | Patient | Create-or-update own medical history |
| GET | `/api/medical-history/admin/:patientId` | Admin | Read a patient's medical history |
| GET | `/api/emergency-contact/me` | Patient | Own emergency contact (`null` if none yet) |
| PUT | `/api/emergency-contact/me` | Patient | Create-or-update own emergency contact |
| GET | `/api/emergency-contact/admin/:patientId` | Admin | Read a patient's emergency contact |
| GET | `/api/availability` | Admin | Read the raw weekly slot config |
| PUT | `/api/availability` | Admin | Replace the weekly slot config (full reconcile) |
| GET | `/api/availability/blocked-dates` | Admin | List blocked dates |
| POST | `/api/availability/blocked-dates` | Admin | Add a blocked date |
| DELETE | `/api/availability/blocked-dates/:id` | Admin | Remove a blocked date |
| GET | `/api/availability/slots?from=&to=` | **Public** | Bookable slots in a date range |
| POST | `/api/appointments/book` | **Public** (optional token) | Book — guest or, with a valid patient token, linked to that patient |
| GET | `/api/appointments/me` | Patient | Own appointment history |
| POST | `/api/appointments/:id/cancel` | Patient | Cancel own appointment |
| POST | `/api/appointments/:id/reschedule` | Patient | Reschedule own appointment (re-enters `pending`) |
| GET | `/api/appointments/admin?status=` | Admin | List all appointments, optional status filter |
| POST | `/api/appointments/admin/:id/confirm` | Admin | Approve a pending booking |
| POST | `/api/appointments/admin/:id/cancel` | Admin | Cancel any appointment |
| POST | `/api/appointments/admin/:id/reschedule` | Admin | Reschedule any appointment |

### Availability & slot-generation notes

- The weekly schedule is a **fixed list of slots per weekday** (matching
  the frontend's admin availability UI exactly) — not a start/end +
  duration range. A day with zero enabled slots shows as "not working".
- `PUT /api/availability` expects the **full desired slot list** in one
  call (existing slots keep their `id`, new ones omit it) — the
  backend reconciles creates/updates/deletes from that single list.
- `GET /api/availability/slots` excludes blocked dates, already-booked
  slots (no double-booking), and — for today only — slots whose start
  time has already passed.
- Booking and rescheduling both re-validate the requested slot against
  live availability server-side; a stale frontend slot list can never
  create a double-booking.

### Auth model notes

- **Admin accounts are never created via `/signup`** — every self-signup
  is forced to `role: patient` server-side, regardless of what the
  client sends. Provision the admin account directly in the database
  (see below) or via a future seed script.
- **Access token**: short-lived JWT (default 15m), returned in the JSON
  response body. The frontend is expected to keep it in memory (or
  wherever it prefers) and send it as `Authorization: Bearer <token>`.
- **Refresh token**: longer-lived JWT (default 7d), set as an `httpOnly`,
  `sameSite=strict` cookie scoped to `/api/auth`. Never exposed to JS.
  Rotated on every successful `/refresh` call.
- **Password reset tokens**: a random 32-byte token is generated, only
  its SHA-256 hash is stored in `password_reset_tokens`, and it expires
  after `PASSWORD_RESET_TOKEN_EXPIRES_MINUTES` (default 30) or after
  first use, whichever comes first.

### Manually creating the admin (psychologist) account

Phase 1 has no admin-seed script yet. Until one is added, create the
admin directly via Prisma Studio or a one-off script:

```bash
node -e "
const bcrypt = require('bcryptjs');
bcrypt.hash('YourStrongPassword1', 10).then(console.log);
"
```

Then in `npx prisma studio`, create a `User` row with that
`passwordHash`, `role = admin`, and the email/name you want — no linked
`Patient` row is needed for an admin.

---

## Project structure

```
backend/
├─ src/
│  ├─ config/
│  │  └─ env.ts
│  ├─ lib/
│  │  └─ prisma.ts
│  ├─ middleware/
│  │  ├─ authenticate.ts        (+ optionalAuthenticate, Phase 2)
│  │  ├─ authorize.ts
│  │  ├─ errorHandler.ts
│  │  └─ validate.ts
│  ├─ modules/
│  │  ├─ auth/
│  │  ├─ patient/               (Phase 2)
│  │  ├─ medical-history/       (Phase 2)
│  │  ├─ emergency-contact/     (Phase 2)
│  │  ├─ availability/          (Phase 2)
│  │  └─ appointment/           (Phase 2)
│  │     each with .controller.ts / .routes.ts / .service.ts /
│  │     .validation.ts / .types.ts (where applicable)
│  ├─ utils/
│  │  ├─ apiResponse.ts
│  │  ├─ AppError.ts
│  │  ├─ jwt.ts
│  │  └─ token.ts
│  ├─ app.ts
│  └─ server.ts
├─ prisma/
│  ├─ schema.prisma
│  └─ migrations/
│     ├─ 20260625101832_init/                              (Phase 1)
│     └─ 20260625120000_phase2_appointments_availability/   (Phase 2)
├─ .env.example
├─ package.json
├─ tsconfig.json
└─ README.md
```

## Frontend integration summary

**Phase 1 (auth)** — already wired: login, signup, logout, refresh,
`/me`, forgot/reset password all call this backend from
`lib/api/client.ts` and `lib/context/AuthContext.tsx`.

**Phase 2** — now also wired:

- `app/dashboard/patient/settings/page.tsx` — profile save, plus new
  medical history and emergency contact sections (previously absent
  from this page entirely).
- `app/dashboard/patient/appointments/page.tsx` — real appointment
  list, working cancel/reschedule.
- `app/dashboard/admin/appointments/page.tsx` — real appointment list,
  working confirm/cancel, plus a new reschedule action.
- `app/dashboard/admin/availability/page.tsx` — real weekly slot CRUD
  and blocked-date CRUD (previously local-state-only).
- `app/dashboard/admin/patients/page.tsx` — real patient list, and the
  detail modal now fetches real medical history / emergency contact
  per patient instead of mock data.
- `app/appointment-booking/page.tsx` — real available dates/times from
  `/api/availability/slots`, real booking submission (guest path).
- `app/dashboard/admin/layout.tsx` — now also redirects non-admin users
  away, since this layout's pages call admin-only API routes.

No layout, styling, or design-system changes were made anywhere —
every page above keeps its existing structure and components; only
data sources and submit handlers changed from mocked to real.

## Known limitation in this Phase 1 build

`forgotPassword` does not send a real email yet — it logs the reset
link to the server console (`[password-reset] Reset link for ...`).
Wire up `src/lib/mailer.ts` (Nodemailer/SMTP) in the notifications
phase and replace the `console.log` call in
`src/modules/auth/auth.service.ts`.

## Known limitations in this Phase 2 build

- **No appointment reminder emails/notifications** — booking,
  confirming, cancelling, and rescheduling are all silent on the
  notification side, same as Phase 1's password reset. Wire up the
  same future mailer module here too.
- **Single practitioner only** — `THERAPIST_NAME` in
  `appointment.service.ts` is a hardcoded `"Miss Pooja"` string,
  matching every existing mock appointment record. A multi-therapist
  model would need a `Therapist`/`Provider` model and isn't part of
  this phase.

## Date/timezone bugfix (post Phase 2)

`appointment.service.ts` previously parsed booking dates as **UTC**
midnight (`new Date(\`${date}T00:00:00.000Z\`)`) and mapped weekday
with `getUTCDay()`, while `availability.service.ts` had already been
fixed elsewhere to use **local** calendar dates. That mismatch could
silently store a booking under the wrong calendar date in any server
timezone behind UTC, breaking double-booking prevention and weekday
matching near midnight.

Fixed by adding `src/utils/date.ts` as the single source of truth for
date handling (`parseDateOnly`, `toDateKey`, `dayOfWeekFromDate`,
`startOfToday`, `startOfDay` — all local-time, never UTC/ISO) and
updating `appointment.service.ts` and `availability.controller.ts` to
use it instead of their own ad hoc Date construction. No schema or
migration changes were needed — this was an application-logic-only
fix.

---

## Phase 4.7 — Email Notifications

### What was implemented

Three new files in `src/lib/`:

| File | Purpose |
|---|---|
| `src/lib/mailer.ts` | Nodemailer transporter (singleton). Disabled gracefully if `SMTP_HOST` is blank — no startup error, emails just skip. |
| `src/lib/emailTemplates.ts` | Inline-HTML templates for all 5 email types: Appointment Booked, Confirmed, Cancelled, Rescheduled, Password Reset. |
| `src/lib/emailService.ts` | Fire-and-forget wrappers (`void sendX(...)`). Never throws — failed sends are logged with `console.error` only. |

Two existing files were minimally modified:

- **`src/modules/notification/notification.service.ts`** — the 4 `notifyAppointment*` functions now call the matching `emailService` function after persisting the in-app notification. They look up the user's email via a single `prisma.user.findUnique` call (select only `email` and `name`). `notifyAppointmentBooked` also accepts an optional `patientEmail` parameter to support guest bookings.
- **`src/modules/auth/auth.service.ts`** — the `forgotPassword` stub (`console.log(resetLink)`) is replaced with `void sendPasswordResetEmail(...)`.
- **`src/modules/appointment/appointment.service.ts`** — `book()` now resolves the patient's email and passes it to `notifyAppointmentBooked`.

### Environment variables added

No new variables — `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and `SMTP_FROM` were already declared in `src/config/env.ts` and `.env.example` from Phase 1.

### Install the new dependency

```bash
cd backend
npm install
```

(`nodemailer` and `@types/nodemailer` were added to `package.json`.)

### SMTP configuration

Set the five SMTP variables in your `.env` (see `.env.example`). Common providers:

- **Gmail (App Password):** `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`
- **SendGrid:** `SMTP_HOST=smtp.sendgrid.net`, `SMTP_PORT=587`, `SMTP_USER=apikey`, `SMTP_PASS=<API key>`
- **Mailtrap (dev/test):** use the SMTP credentials from your Mailtrap inbox

If `SMTP_HOST` is left blank, the app starts normally and email is simply disabled.
