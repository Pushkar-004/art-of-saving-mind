# Phase 2 Testing Checklist

Run the backend setup steps in `backend/README.md` first
(`npm install`, configure `.env`, `npx prisma generate`,
`npx prisma migrate dev`, `npm run dev`), then the frontend
(`npm install`, `npm run dev`). You'll need one patient account and
one admin account — see `backend/README.md` for how to create the
admin manually via Prisma Studio.

> **Updated:** this checklist now includes a dedicated "Date / weekday
> / timezone regression checks" section (under Appointments) covering
> the bug fixed in this round — `appointment.service.ts` was parsing
> booking dates as UTC while `availability.service.ts` had already
> been fixed to use local calendar dates. No schema changes were
> needed; see `backend/README.md` → "Date/timezone bugfix" for details.

---

## Backend / Postman checklist

### Patient profile (`/api/patient`)
- [ ] `GET /api/patient/me` as a patient → returns name/email/phone/primaryConcern
- [ ] `GET /api/patient/me` as admin → 403 Forbidden (route is patient-only)
- [ ] `PATCH /api/patient/me` with just `{ "phone": "..." }` → only phone changes
- [ ] `PATCH /api/patient/me` with an email already used by another account → 409 Conflict
- [ ] `PATCH /api/patient/me` with empty body `{}` → 422 validation error
- [ ] `GET /api/patient/admin` as admin → returns all patients
- [ ] `GET /api/patient/admin` as patient → 403 Forbidden
- [ ] `GET /api/patient/admin/:patientId` as admin → returns that one patient

### Medical history (`/api/medical-history`)
- [ ] `GET /api/medical-history/me` for a brand-new patient → `{ conditions: [], medications: [], allergies: [] }`, not a 404
- [ ] `PUT /api/medical-history/me` with `{ "conditions": ["Anxiety"] }` → creates the record, other arrays default to `[]`
- [ ] `PUT /api/medical-history/me` again with just `{ "medications": [...] }` → conditions from the first save are untouched
- [ ] `GET /api/medical-history/admin/:patientId` as admin → reads any patient's data
- [ ] `PUT /api/medical-history/me` as admin → 403 Forbidden

### Emergency contact (`/api/emergency-contact`)
- [ ] `GET /api/emergency-contact/me` before ever saving one → `{ "emergencyContact": null }`
- [ ] `PUT /api/emergency-contact/me` with name/relationship/phone → creates it
- [ ] `PUT /api/emergency-contact/me` again with different values → updates the same row (not a duplicate)
- [ ] `PUT /api/emergency-contact/me` missing `phone` → 422 validation error
- [ ] `GET /api/emergency-contact/admin/:patientId` as admin → works

### Availability (`/api/availability`)
- [ ] `GET /api/availability` as admin → full week, all 7 days present even with no slots
- [ ] `PUT /api/availability` with a new slot (no `id`) for Monday → slot is created
- [ ] `PUT /api/availability` again, omitting a previously-saved slot → that slot is deleted (reconcile behavior)
- [ ] `PUT /api/availability` with `startTime >= endTime` → 422 validation error
- [ ] `POST /api/availability/blocked-dates` with a date → creates it
- [ ] `POST /api/availability/blocked-dates` with the same date again → 409 Conflict
- [ ] `DELETE /api/availability/blocked-dates/:id` → removes it
- [ ] `GET /api/availability/slots?from=YYYY-MM-DD&to=YYYY-MM-DD` with **no auth header** → still works (public)
- [ ] Block a date that has enabled weekly slots, then check `/slots` for that date → returns no slots for that date
- [ ] Book an appointment in a slot, then check `/slots` for that date+time again → that specific slot no longer appears, but other slots that day still do
- [ ] Check `/slots` for today → any slot whose start time has already passed is excluded; later slots today still appear

### Appointments (`/api/appointments`)
- [ ] `POST /api/appointments/book` with no auth header + guest fields → creates a guest appointment (`patientId: null`)
- [ ] `POST /api/appointments/book` with guest fields missing (e.g. no `guestPhone`) and no auth → 400 Bad Request
- [ ] `POST /api/appointments/book` **with** a valid patient `Authorization` header (guest fields can be omitted) → creates an appointment linked to that patient
- [ ] `POST /api/appointments/book` for a date/time that's blocked or already booked → 409 Conflict
- [ ] `POST /api/appointments/book` for a past date → 400 Bad Request
- [ ] `GET /api/appointments/me` as the booking patient → shows the appointment with `status: "pending"`
- [ ] `POST /api/appointments/:id/cancel` as that patient → status becomes `cancelled`
- [ ] `POST /api/appointments/:id/cancel` on someone else's appointment → 404 Not Found (ownership check)
- [ ] `POST /api/appointments/:id/reschedule` with a new valid slot → date/time update, status resets to `pending`
- [ ] `POST /api/appointments/:id/reschedule` to an already-booked slot → 409 Conflict

### Admin appointment management
- [ ] `GET /api/appointments/admin` as admin → all appointments, including guest ones
- [ ] `GET /api/appointments/admin?status=pending` → filtered correctly
- [ ] `POST /api/appointments/admin/:id/confirm` on a pending appointment → status becomes `upcoming`
- [ ] `POST /api/appointments/admin/:id/confirm` on an already-confirmed one → 400 Bad Request
- [ ] `POST /api/appointments/admin/:id/cancel` with a `reason` → status `cancelled`, reason stored
- [ ] `POST /api/appointments/admin/:id/reschedule` → works the same as the patient version, for any appointment

### Date / weekday / timezone regression checks (the bug this round fixed)
- [ ] Check your server's timezone: `node -e "console.log(Intl.DateTimeFormat().resolvedOptions().timeZone)"`. If it's UTC, temporarily run the backend with `TZ=America/New_York npm run dev` for this section, then switch back — UTC servers won't show the bug even when it's present.
- [ ] In admin **Availability**, add a slot only on **Monday**, save.
- [ ] `GET /api/availability/slots?from=<a Monday>&to=<that same Monday>` → the slot appears under that exact Monday date, not Sunday or Tuesday.
- [ ] Book that Monday slot via `POST /api/appointments/book`.
- [ ] `GET /api/appointments/admin` (or `/me`) → the appointment's `date`/`day`/`month`/`dateTime` all show **Monday**, not the day before or after.
- [ ] `GET /api/availability/slots` for that same Monday again → the booked slot is now **excluded** (no double-booking), and it's excluded specifically from Monday's list, not from the wrong day.
- [ ] Reschedule that appointment to a **Tuesday** slot → re-fetch `/me` → `date`/`dateTime` now correctly show Tuesday.
- [ ] Block a specific date in admin **Availability**, then check `/availability/slots` for that exact date → no slots returned for it, and neighboring dates are unaffected.

### Public booking flow (end-to-end via Postman, simulating the public page)
- [ ] `GET /api/availability/slots` → pick a date+time from the response
- [ ] `POST /api/appointments/book` with that exact date/startTime + guest details + service + mode → 201 Created
- [ ] `GET /api/appointments/admin?status=pending` as admin → the new guest booking appears

---

## Frontend smoke test checklist

### Patient profile save
- [ ] Log in as a patient, go to **Settings**
- [ ] Change name/email/phone, click **Save Changes** → success toast, refresh the page → changes persisted
- [ ] Try saving an email that belongs to another account → error toast with a clear message

### Medical history save
- [ ] On **Settings**, add a few conditions/medications/allergies as chips, click **Save Medical History**
- [ ] Refresh the page → previously saved chips reload correctly
- [ ] Remove a chip and save again → it stays removed after refresh

### Emergency contact save
- [ ] Fill in name/relationship/phone (+ optional email) on **Settings**, save
- [ ] Refresh → fields are pre-filled with the saved contact
- [ ] Leave phone blank and try to save → inline error toast, not saved

### Admin availability save
- [ ] Log in as admin, go to **Availability**
- [ ] Toggle a day off → its slots show as disabled, "Save Changes" becomes enabled
- [ ] Add a new slot to a day, adjust nothing else, save → reload the page → new slot persisted with a real id
- [ ] Remove a slot, save, reload → it's gone
- [ ] Add a blocked date with a label → appears in the list immediately
- [ ] Remove a blocked date → disappears, and a later booking-page check for that date shows no slots

### Public appointment booking
- [ ] Visit `/appointment-booking` while logged out
- [ ] Step 1: pick a service → Next
- [ ] Step 2: pick a date, confirm only real available times show up (no fixed/fake list) → Next
- [ ] Step 3: fill name/email/phone, pick online/offline → Next
- [ ] Step 4: confirm details look right, click **Confirm Booking** → success toast, redirected to login
- [ ] As admin, check **Appointments** → the new guest booking appears as "pending" with "(guest)" label

### Patient appointment list
- [ ] Log in as a patient with at least one booking → **Appointments** shows it under Upcoming or Past correctly
- [ ] A `pending` appointment shows the "Awaiting confirmation" badge

### Patient cancel/reschedule
- [ ] Click **Cancel** on an upcoming appointment → confirm modal → appointment moves to Past as "Cancelled"
- [ ] Click **Reschedule** on an upcoming appointment → pick a new date/time from the real available list → confirm → appointment updates and re-enters "Awaiting confirmation"

### Admin appointment management
- [ ] **Appointments** page loads real data, filter tabs (All/Pending/Upcoming/Completed/Cancelled) show correct counts
- [ ] Confirm a pending appointment → moves to "upcoming"
- [ ] Cancel an appointment → confirm modal → moves to "cancelled"
- [ ] Reschedule an appointment → pick a new slot → updates and returns to "pending"
- [ ] **Patients** page loads real patient list; opening a patient shows their real medical history + emergency contact (or graceful "None reported" / "No emergency contact on file" if not yet saved)
- [ ] Try visiting any `/dashboard/admin/*` page while logged in as a **patient** → redirected to `/dashboard/patient`

---

## Known gaps to be aware of while testing

- No email notifications anywhere yet (password reset, booking
  confirmations, reminders) — everything that would normally email
  someone just updates the database silently.
- Admin dashboard overview's revenue/stats/patient-count tiles are
  still mocked data — only the "pending appointments" figure now
  reflects real bookings.
- Single hardcoded therapist name (`"Miss Pooja"`) — no multi-provider
  support.
