# MediNova: step-by-step build guide

This guide turns the requirements in `MediNova_Documentation_Draft1.docx` into a development sequence. Setup commands below work with the current repository. APIs, services, and schema fields described in later stages are implementation tasks unless explicitly marked as existing.

## Implemented milestone — 7 October 2026

The profile, booking, and queue foundation is now implemented. Patients can edit address/history/blood group, browse active doctors by department/date, book visits, confirm/cancel their own visits, and track live queue estimates. Doctors can edit professional profile fields and view their assigned daily queue. Admin can search the user directory, check in patients on the clinic day, and create departments from Admin → Departments. Departments are shared with doctor registration and patient booking, with duplicate-name protection.

Current policies: India clinic timezone, a 30-day booking horizon, one active appointment per patient/doctor/day, shift capacity computed using the doctor's consultation average, and no patient cancellation after check-in. Operational emergency/walk-in priority is supported by the queue calculation; their registration UI/API comes in a later milestone. Doctor leave records are respected during booking; leave authoring and cascading notices remain planned. Consultation completion is deliberately not exposed until prescription and billing writes can be coordinated.

Queue mutations use a shared doctor/day document inside a MongoDB transaction. New bookings have a sparse unique active-booking key. Cancellation releases that key and recomputes positions. Existing records remain compatible with the additive schema changes; no destructive migration was applied. Reminder confirmation is stored separately while the existing attendance/status vocabulary is retained for compatibility.

Verification: backend/frontend lint, TypeScript, frontend production build, unit tests, and real API integration tests against a uniquely named temporary Atlas database. The integration test never modifies the configured application database, and removes its own test database on completion.

```sh
npm --prefix server run test:integration
```

This command needs Atlas credentials with permission to create/use the temporary test database and a connection that supports transactions. Default unit-test runs skip external database integration.

Sections below remain the full project roadmap. Steps 3–5 now have working implementations, with further scheduling/account-administration policies deferred to their relevant later modules. The next feature milestone is consultation, prescriptions, and billing, followed by operational leave and walk-ins.

## 1. Establish the working baseline

Current implementation:

- Patient/Doctor registration, login, JWT authentication, role middleware, and department listing.
- React/TanStack Start frontend with login, registration, role navigation, and placeholder feature pages.
- Nine hospital-domain Mongoose models. The internal `Counter` collection now allocates doctor IDs safely.
- FastAPI skeleton with fixed triage and no-show responses; these are not trained models.

Corrections made with this guide:

- JWT signing/verification share one required secret; missing configuration fails at startup.
- Admin login requires explicit environment configuration; default credentials were removed.
- Inactive users cannot log in or access protected APIs.
- Session restoration reads `data.user`, rejects expired/inactive sessions, and retains cached sessions only during network outages.
- Role-mismatched dashboard content is hidden while redirecting.
- Plain-text HTTP errors are handled, rate-limit responses are JSON, and validation errors include field names.
- Atomic counters replace count-based doctor IDs and preserve existing identifiers. IDs sharing a department abbreviation use the same sequence; gaps are valid.
- Frontend formatting/type lint issues were corrected. Named exports used by shared UI primitives and auth helpers are explicitly allowed by the Fast Refresh lint rule.
- Node 24 is recorded in `.nvmrc` and both package manifests. Test and typecheck commands were added.

### Set up Node and dependencies

Use Node 24 for this repository. If you already use nvm, run these commands from the project root:

```sh
nvm install
nvm use
node --version
npm --version
npm --prefix server ci
npm --prefix client ci --include=optional
```

Vite requires a newer runtime than the original Node 20.0.0 installation; see the [official Vite runtime requirements](https://vite.dev/guide/). Do not run the new frontend tests with Node 20: they use Node's native TypeScript support.

Keep both lockfiles. If an existing installation reports a missing Rolldown native binding, first use the correct Node version, then run `npm --prefix client install --include=optional`. Do not delete lockfiles as the first troubleshooting step.

### Configure environments

From the project root:

```sh
cp -n server/.env.example server/.env
cp -n client/.env.example client/.env
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Put the generated value in `server/.env` as `JWT_SECRET`. Configure:

```dotenv
MONGO_URI=<your MongoDB connection string with a database name>
PORT=5000
JWT_SECRET=<generated secret>
CLIENT_URL=http://localhost:5173
ADMIN_EMAIL=<chosen hospital admin email>
ADMIN_PASSWORD=<chosen strong admin password>
ADMIN_ID=<chosen hospital admin identifier>
```

All three `ADMIN_*` values are optional as a group; leaving them empty disables admin login. The current code creates the Admin user on its first successful configured login. Use an email that is not already registered as a Patient or Doctor. Restart the backend after changing configuration. Existing JWT sessions must log in again when the secret changes.

The frontend needs:

```dotenv
VITE_API_URL=http://localhost:5000
```

Restart Vite after changing frontend environment values. Keep secrets in backend configuration, never in `VITE_*` variables.

### Populate departments and run

The new seed command inserts six example departments without overwriting existing departments. Adjust `server/scripts/seedDepartments.js` to match your demo hospital, then run:

```sh
npm --prefix server run seed:departments
```

Run each service in a separate terminal:

```sh
# Terminal 1, from the project root
npm --prefix server run dev
```

```sh
# Terminal 2, from the project root
npm --prefix client run dev -- --port 5173
```

```sh
# Terminal 3
cd ml-service
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

The ML service is not yet called by Express. Its health endpoint is at port 8000 and its interactive API documentation is at `/docs`; see [FastAPI's first steps](https://fastapi.tiangolo.com/tutorial/first-steps/).

**Acceptance check:** Register a patient, register a doctor using a seeded department, log in as each role, refresh the browser, log out, and confirm an expired token returns to login. Verify `/api/auth/me` and `/api/departments` in Postman. Separately test configured Admin login.

## 2. Lock the remaining workflow rules

Before adding business logic, write these decisions in a short requirements note:

1. Use `Asia/Kolkata` to define clinic days; persist timestamps in UTC and convert on display.
2. Define whether booking is for a clinic day or an appointment time. The documented product uses day-based queues and estimated windows.
3. Define booking horizon, doctor daily capacity, duplicate-booking policy, and what happens after a shift is full.
4. Define the PRCS response cutoff and the extended-leave threshold. Seven consecutive days is the documentation's example threshold.
5. Define who may mark an emergency and how emergencies are ordered among themselves. Emergency priority must come from staff-assessed urgency.
6. Define late arrival, missed visit, cancellation followed by arrival, and rescheduling behavior.

Suggested policies to review: keep an in-progress consultation uninterrupted when an emergency arrives; treat a cancelled patient who later arrives as a staff-recorded walk-in; keep pre-booked patients ahead of ordinary walk-ins. These are proposed edge-case rules, not completed features.

Preserve the locked constraint: no-show risk can prioritize outreach only. It must never change queue order, capacity, or appointment eligibility. Keep nursing roles and full pharmacy inventory out of this release.

## 3. Add doctor and patient profile APIs

Create `doctorController.js`, `patientController.js`, their route files, and an admin user controller.

| API to add | Access | Purpose |
| --- | --- | --- |
| `GET /api/doctors` | Patient/Admin | Doctor list filtered by department and clinic date |
| `GET /api/doctors/:id` | Authenticated | Public booking information and availability |
| `GET/PATCH /api/patients/me` | Patient | Own patient profile |
| `GET/PATCH /api/doctors/me` | Doctor | Own doctor profile |
| `GET /api/admin/users` | Admin | Paginated/searchable user directory |
| `PATCH /api/admin/users/:id/status` | Admin | Activate/deactivate accounts |

Return only necessary fields. Resolve Patient/Doctor records from `req.user._id`; never trust a patient-supplied owner ID. Restrict writable profile fields so users cannot change role, account status, or identifiers.

Connect `admin.users.tsx` and booking doctor selection through the existing `apiRequest` helper. Keep TanStack file-based routes; do not manually edit `routeTree.gen.ts`.

**Acceptance check:** Patient A cannot retrieve Patient B's profile; doctors cannot edit other doctors; patients cannot activate accounts or change their role.

## 4. Implement appointments and status transitions

Create `appointmentController.js`, `appointmentRoutes.js`, and `services/appointmentService.js`. Register the routes in `server/index.js`.

Implement the documented APIs:

- `POST /api/appointments`: derive the patient from the session; validate doctor, date, capacity, and availability.
- `GET /api/appointments/my`: return only the patient's own appointments.
- `GET /api/appointments/doctor`: return only the doctor's assigned appointments for the requested clinic day.
- `PATCH /api/appointments/:id/status`: enforce allowed transitions and ownership.
- Add an Admin-only appointment listing for the reception console.

The current `status` enum mixes attendance and reminder-response states. Before expanding it, introduce a separate `confirmationStatus` on Appointment and plan how to migrate existing records. Keep attendance states such as booked, checked-in, in-consultation, completed, cancelled, and no-show separate from confirmed/cancelled/no-response reminder outcomes. Add a leave-cancellation reason/state.

Define transitions explicitly: patients can confirm or cancel eligible future appointments; staff can check patients in; the assigned doctor can start and complete consultations; completed visits cannot return to pending. Unknown transitions must return 400/409 rather than silently succeeding.

Add indexes matching doctor/day and patient/history queries. Enforce the chosen duplicate-booking rule in persistence, not just the UI. Coordinate capacity checks and writes so simultaneous bookings cannot overbook the doctor.

Connect `patient.book.tsx`, `patient.appointments.tsx`, `doctor.index.tsx`, and `admin.appointments.tsx`.

**Acceptance check:** A booking persists and appears for its patient and assigned doctor. Attempts to alter another patient's visit or complete another doctor's consultation fail. Concurrent booking tests enforce capacity and uniqueness.

## 5. Build queue estimation

Create `services/queueService.js` and a doctor/day queue state document that can serialize competing mutations. Simply reading the appointment count and assigning `count + 1` is insufficient under concurrency.

For an initial estimate, use the doctor's shift start and stored `avgConsultationTime` (currently 15 minutes). Compute a predicted start from the work remaining ahead of a patient; display a range around that prediction using a documented tolerance. An estimate is not a guaranteed appointment time.

For the live queue, account for the active consultation's elapsed time, checked-in patients waiting ahead, and operational priority rules. Recalculate affected estimates after check-in, cancellation, completion, emergency insertion, and queue changes.

Add `consultationStartedAt` and `consultationEndedAt` to Appointment. On completion, record the actual duration and update a running mean using a consultation count. Validate durations and document how unusual records are handled.

Use a transaction plus an actual write to the shared doctor/day queue state to coordinate queue mutations; retry transaction conflicts. MongoDB transactions require a compatible replica-set deployment. Follow [Mongoose transaction guidance](https://mongoosejs.com/docs/transactions.html), especially its restriction on parallel operations inside a transaction.

For a first release, poll a queue endpoint every 15–30 seconds and refresh after mutations. Add push updates later if needed. Include a last-updated time in the UI.

**Acceptance check:** Concurrent bookings have unique positions, completed/cancelled entries do not consume waiting positions, estimates update after consultation completion, and no-show scores never enter queue calculations.

## 6. Add emergencies and walk-ins

Implement `POST /api/appointments/walkin` for Admin only. Reuse patient registration/profile lookup rather than creating appointments with missing patient references.

Choose `Normal`, `Emergency`, or `Walkin` through a validated staff workflow. Assign emergency priority through reception/clinical assessment; an AI prediction must not automatically grant emergency insertion. Keep ordinary walk-ins behind active pre-booked visits.

Use the same queue mutation service for all entry paths. Store who registered the patient and why emergency priority was assigned. Apply the late/cancelled-arrival policies agreed in step 2.

**Acceptance check:** An emergency enters ahead of waiting non-emergency patients, ordinary walk-ins enter at the end, and concurrent arrivals do not duplicate positions. The active consultation follows the agreed interruption policy.

## 7. Complete consultations, prescriptions, and billing

Create prescription and billing controllers/routes/services, then build the workspace in `doctor.consultations.tsx`.

The doctor workflow should be: open assigned checked-in patient → start consultation → record diagnosis/medication instructions → complete consultation → persist prescription and bill → advance queue.

Prefer structured medicine entries (`name`, `dosage`, `frequency`, `duration`) rather than a single free-text medicine field; plan a schema migration. Keep the documented one-prescription/one-bill constraint per appointment.

Make completion idempotent: retries and double clicks must not create duplicate bills, prescriptions, or consultation-duration samples. Use a transaction for related writes and unique indexes for appointment references and invoice numbers. Store the bill's fee snapshot so later doctor-fee edits do not rewrite historical bills.

Add patient-owned history retrieval and Admin billing/payment-status APIs. Patients may view their records; only authorized staff may change payment status. Cash/UPI status recording is sufficient initially; an online payment gateway is a separate integration.

**Acceptance check:** A completed consultation creates one prescription and one bill. Repeating the request does not duplicate either. Patient A cannot access Patient B's records or mark a bill paid.

## 8. Implement doctor leave

Add `doctorLeaveController.js`, `doctorLeaveRoutes.js`, and `services/leaveService.js`.

Implement Doctor-owned and Admin-authorized leave creation, listing, and cancellation. Validate date ranges and overlapping leave records. Coordinate leave creation and booking so a race cannot create an appointment in an unavailable period.

For affected future appointments, record the agreed leave cancellation/rescheduling state and create a notification. Leave creation should succeed even if SMS delivery temporarily fails; queue notifications for retry. Extended leave must appear as advance booking-page notice. Any leave should block unavailable dates, regardless of length.

Connect `doctor.leave.tsx`, `admin.leave.tsx`, and availability in the booking flow. Provide an affected-appointment preview before staff submit leave.

**Acceptance check:** Booking during leave fails through the API even if a client submits a blocked date. Existing affected patients receive persistent notices; duplicate submissions do not duplicate leave or notifications.

## 9. Replace placeholder AI triage

Start with an explainable symptom-to-department baseline rather than presenting hardcoded responses as AI. Put classifier logic in a dedicated module and keep FastAPI handlers thin.

Define a validated response contract containing department, urgency (`Low`, `Medium`, `High`, `Emergency`), explanation, and model/version information. Express should map the department to real database IDs and choose available doctors; the Python service should not return a fictional doctor name.

Create `services/mlClient.js` with `ML_SERVICE_URL`, a timeout, response validation, and an explicit unavailable-service fallback. Expose the documented `POST /api/ai/triage` through Express. Keep Python reachable only through the backend in deployment.

Build symptom input and recommendation display in `patient.triage.tsx`. Let the patient accept the suggestion or select manually. Store the recommendation with the booking for audit. Handle empty input, uncertainty, unknown symptoms, service failure, and urgent guidance explicitly without claiming a diagnosis.

**Acceptance check:** Different inputs are evaluated by actual classifier logic, unknown inputs are handled honestly, unavailable doctors are excluded, and patients retain manual booking choice when the ML service is down.

## 10. Build reminders and confirmations before risk prediction

Create persistent Notification/ReminderDelivery records and `jobs/reminderJob.js`. These are new workflow-support models beyond the initial nine domain entities.

Schedule reminders at T−2 days and on the clinic day. Record delivery status, provider reference, retries, and a unique appointment/reminder-type key. The job must catch up safely after downtime and avoid duplicate delivery if two job processes run.

Implement authenticated in-app confirm/cancel actions first. Then add SMS integration: verify provider webhook authenticity, correlate replies with the correct appointment, and make duplicate replies idempotent. Do not let arbitrary phone-number input alter a visit.

Persist the latest response and timestamps on Appointment. Use an explicit clinic timezone in cron configuration. Add provider settings only when that integration exists. Connect `patient.notifications.tsx` to persisted notices and confirmations.

**Acceptance check:** Running a reminder job twice sends one reminder per type. Retries recover provider failures. Confirmed/cancelled visits are removed from the unconfirmed outreach pool. Queue position remains independent of reminder response risk.

## 11. Train and integrate the no-show model

Add a reproducible training script, feature schema, dataset provenance, evaluation report, and saved versioned model artifact to `ml-service`.

Use only features available at prediction time. Start with a baseline, then compare Logistic Regression or Random Forest. Split training/evaluation data so the same patient's repeated records do not leak across partitions where identifiers are available; consider a temporal holdout. Fit preprocessing on training data only.

Evaluate precision, recall, PR-AUC, and probability calibration; report sample sizes and limitations. Avoid promising accuracy from a public dataset on a different clinic. The currently proposed `patient_id`-only payload is insufficient: send the required feature values and handle missing history explicitly.

Run prediction only for eligible appointments with no response after the defined cutoff. Save the risk score, feature/model version, and prediction time. Keep this processing entirely separate from queue mutation code.

Implement `GET /api/prcs/followup-list` and `PATCH /api/prcs/:appointmentId/outcome`. Store caller, call time, outcome, and notes. Build `admin.follow-up.tsx` with risk-sorted outreach and human confirmation actions.

**Acceptance check:** Only eligible unconfirmed appointments appear; outreach outcomes persist; model failure does not cancel visits; changing risk scores leaves queue order unchanged.

## 12. Finish dashboards and patient history

Implement `/api/admin/dashboard` aggregation for appointments, checked-in/completed visits, paid revenue, doctor workload, and follow-up counts. Define each metric precisely: paid revenue must not include unpaid bills, and comparisons need consistent clinic-day boundaries.

Connect the patient overview to upcoming visits and notifications; doctor overview to the live queue; Admin overview to real aggregates. Add pagination and date/department filters where records grow.

Reuse existing shared components. Every screen needs loading, empty, success, validation, and server-error states. Keep booking and confirmation usable on mobile.

**Acceptance check:** Dashboard values reconcile with a known demo dataset and remain correctly scoped to the signed-in role.

## 13. Test complete journeys and deploy

Current checks, from the project root using Node 24:

```sh
npm --prefix server run lint
npm --prefix server test
npm --prefix client run lint
npm --prefix client run typecheck
npm --prefix client test
npm --prefix client run build
```

The new regression tests use mocked database/provider boundaries. Add integration tests against a separate test replica-set database for transactions, unique indexes, capacity races, queue reordering, and reminder idempotency. Never use production patient records as test fixtures.

Maintain a full demo journey: patient registration → manual or triage-assisted booking → reminder → confirmation → check-in → consultation → prescription and bill → patient history. Separately demonstrate emergencies, ordinary walk-ins, leave, no-show outreach, and ML/SMS failure recovery.

For deployment:

1. Provision MongoDB with a named application database and an application user; apply indexes and reviewed migrations.
2. Deploy Express with its environment settings, TLS-facing proxy, health/readiness endpoints, and process supervision. Configure rate-limit proxy handling to match the actual host.
3. Deploy Python privately and configure Express's ML URL, timeouts, and service access controls.
4. Deploy the TanStack Start frontend using its actual build preset. The current Lovable configuration emits a Cloudflare module worker plus assets; deploying only `.output/public` would omit SSR behavior. Follow the generated build instructions or explicitly configure another compatible preset.
5. Set the frontend API URL and backend allowed origin to the deployed addresses, then rebuild the frontend.
6. Run one coordinated reminder worker, or implement safe multi-worker claiming before scaling jobs.
7. Verify all role journeys on deployment; add error monitoring, backup/restore procedures, and logs that omit tokens and medical free text.

Update the Word report, README progress checklist, endpoint documentation, and test evidence after each module. Treat features as complete only when the UI, API, persistence, authorization, and acceptance checks all work together.

## Suggested development milestones

| Milestone | Deliverable | Requirements |
| --- | --- | --- |
| A | Working setup, profiles, secure authentication | FR-1/2 |
| B | Appointments, daily queues, estimated windows | FR-4/5/7 |
| C | Walk-ins, consultation, prescription, billing, leave | FR-10–15 |
| D | Real triage and reminder/confirmation workflow | FR-3/6/7 |
| E | Evaluated no-show model and staff follow-up | FR-8/9 |
| F | Analytics, full integration tests, deployment, report | FR-16 and NFRs |

Complete one usable vertical journey per milestone. Keep newly added behavior reviewable, and avoid rewriting published Git history because the frontend is linked to Lovable.
