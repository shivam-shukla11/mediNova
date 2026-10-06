# Profiles, appointments and queue API

Except the public department list, endpoints below require `Authorization: Bearer <JWT>`. Responses use `{ success, message, data }`. Queue estimates are approximate and displayed in `Asia/Kolkata`.

| Method | Endpoint | Allowed role | Result |
| --- | --- | --- | --- |
| GET | `/api/departments` | Public | Alphabetical department list for registration and booking |
| POST | `/api/departments` | Admin | Create a department; reject duplicate names |
| GET | `/api/doctors?date=YYYY-MM-DD&departmentId=<optional ID>` | Authenticated | Active doctor directory with date-specific availability, fee, shift and next estimate |
| GET | `/api/doctors/:id?date=YYYY-MM-DD` | Authenticated | One doctor's availability |
| GET/PATCH | `/api/patients/me` | Patient | Own patient profile |
| GET/PATCH | `/api/doctors/me` | Doctor | Own doctor profile |
| GET | `/api/admin/users?page=1&search=<text>&role=<optional role>` | Admin | User directory, 25 entries per page; no password fields |
| POST | `/api/appointments` | Patient | Book own appointment |
| GET | `/api/appointments/my?page=1&upcoming=true` | Patient | Own visits, 25 per page; omit `upcoming` for full history |
| GET | `/api/appointments/doctor?date=YYYY-MM-DD` | Doctor | Own doctor's daily queue |
| GET | `/api/appointments?date=YYYY-MM-DD` | Admin | Clinic-day reception console |
| PATCH | `/api/appointments/:id/status` | Patient/Admin | Authorized confirmation, cancellation or check-in |

## Departments

Admin → Departments creates a department with `POST /api/departments`:

```json
{ "departmentName": "Psychiatry", "description": "Mental health care" }
```

Names are trimmed, repeated whitespace is collapsed, and case-insensitive duplicates return HTTP 409, including concurrent creates. Names must have 2–100 characters and optional descriptions at most 1000. A sparse unique normalized-name index protects new writes without requiring a migration of legacy departments.

The public list supplies doctor registration, patient booking, and the admin directory. Open screens refresh every 20 seconds; creation also refreshes the current browser's list. A new department is selectable before any doctor joins it; booking requires an active doctor assigned to that department with an available schedule.


## Booking

```json
{
  "doctorId": "<Doctor collection ObjectId>",
  "appointmentDate": "2026-10-08",
  "symptoms": "Optional reason for visit, up to 2000 characters"
}
```

The doctor identifier is a MongoDB Doctor `_id`, not the human-readable `car_001` code. Patient identity always comes from the authenticated account. Sending `patientId` or `appointmentType` is rejected.

Choose today through 30 days ahead. Inactive doctors, invalid shifts, leave, full shifts, and duplicate active patient/doctor/day bookings are rejected. The response contains the populated appointment under `data.appointment` with queue position and estimated window.

Each queue mutation writes a shared doctor/day QueueState record within a MongoDB transaction. Cancellation and booking update positions together. A sparse unique `activeBookingKey` provides an additional duplicate safeguard. No-show predictions and confirmation response do not determine queue order.

## Status changes

```json
{ "status": "Confirmed" }
```

- Patient: `Confirmed` or `CancelledByPatient` on their own active present/future visit, before check-in.
- Admin: `CheckedIn` on an active visit on the current clinic day.
- Doctor: queue retrieval only in this milestone. Starting/completing consultations will be added together with prescriptions and billing.
- Another patient's appointment is reported as not found. Role-invalid transitions are rejected. Completed/cancelled and past visits cannot be changed through this endpoint.

The independent `confirmationStatus` records confirmation response; existing status values are retained for compatibility. Cancelled visits remain in history, lose their active booking key/estimate, and can be rebooked at the end of the queue.

## Profile updates

Patient editable fields: `address`, `medicalHistory`, `bloodGroup`.

Doctor editable fields: `specialization`, `qualification`, `experience`.

Other fields are rejected, including ownership IDs, role, credentials, fee and shift. Schedule/fee administration and account deactivation are future workflows that need coordination with existing bookings.

## Verification

```sh
npm --prefix server test
npm --prefix server run test:integration
npm --prefix client test
npm --prefix client run lint
npm --prefix client run typecheck
npm --prefix client run build
```

Integration tests use a uniquely named temporary Atlas database, real Express requests, and actual MongoDB transactions/indexes. They verify duplicate and capacity races, ownership, role boundaries, cancellation/rebooking, leave, malformed dates and editable-field protection. Their own test database is removed afterward; the configured application database is not changed by these tests.

Public doctor availability is advisory. Final availability and capacity are always checked again in the booking transaction. Later leave/schedule editing must participate in the same synchronization strategy to prevent booking-versus-leave races.
