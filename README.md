# PPM — Psychologist Practice Management System

```
PPM/
├─ frontend/   ← existing Next.js frontend (auth + Phase 2 modules wired to the backend)
├─ backend/    ← Express + TypeScript + Prisma backend (Phase 1 auth + Phase 2 core modules)
└─ docs/       ← project documentation (architecture notes, SDLC, etc.)
```

## Quick start

**Backend** (see `backend/README.md` for full details):

```bash
cd backend
npm install
cp .env.example .env   # then edit DATABASE_URL, JWT secrets, etc.
npx prisma generate
npx prisma migrate dev   # applies the Phase 2 migration alongside Phase 1's init migration
npm run dev
```

Runs on `http://localhost:5000`.

**Frontend:**

```bash
cd frontend
npm install
npm run dev
```

Runs on `http://localhost:3000`.

## Current phase

**Phase 1** (complete): backend foundation (Express app, error handling,
validation, JWT auth/role middleware) plus the full auth module
(signup, login, forgot/reset password, refresh token, logout, `/me`),
backed by Prisma models for `User`, `Patient`, `MedicalHistory`,
`EmergencyContact`, and `PasswordResetToken`.

**Phase 2** (complete): core practice-management features, built on
top of Phase 1 without changing its auth system or frontend design:

- **Patient profile** — patients view/update their own name, email,
  phone, and primary concern; admins can list/view any patient.
- **Medical history** — conditions/medications/allergies, create-on-
  first-save / update-after, patient-owned + admin read-only.
- **Emergency contact** — single contact per patient (name,
  relationship, phone, optional email), same create/update pattern.
- **Availability management (admin-only)** — weekly recurring time
  slots per day plus one-off blocked dates, matching the frontend's
  existing fixed-slot UI exactly.
- **Appointment booking** — public guest booking, logged-in patient
  booking, patient cancel/reschedule, and admin
  confirm/cancel/reschedule, all backed by real slot generation that
  respects weekly availability, blocked dates, and already-booked
  slots (no double-booking, no booking into the past).

New Prisma models: `AvailabilitySlot`, `BlockedDate`, `Appointment`
(plus the `AppointmentStatus`, `AppointmentMode`, and `DayOfWeek`
enums, and an added `email` field on `EmergencyContact`).

Mood tracker, journal, wellness assistant, resources, payments,
invoices, and other content modules remain mocked/untouched — out of
scope for Phase 2 per the original spec.

See `backend/README.md` for the full API route list and frontend
integration notes, and `TESTING.md` at the repo root for the Phase 2
testing checklist.

