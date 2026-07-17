# MediNova — AI-Powered Hospital Management System

MediNova is a full-stack hospital management platform built on the MERN stack, designed to go beyond traditional patient-record CRUD systems by adding intelligent, AI-driven decision support at the points where hospitals genuinely struggle: patient routing, appointment reliability, and queue realism.

This isn't a "digitize the paperwork" project. It's built around three real, observable inefficiencies in how hospitals (especially small-to-mid clinics in India) currently operate — and each core feature exists specifically to address one of them.

---

## The Problem We're Solving

1. **Patients don't know who to see or how urgent their condition is.** Reception staff aren't trained to triage, so patients either guess or wait in a generic queue regardless of severity.
2. **Appointment no-shows waste doctor time and clinic revenue**, and most clinics only react to this the morning of (a phone call, or nothing at all).
3. **Fixed appointment slots don't reflect reality.** Consultations vary in length — a 15-minute fixed slot system either wastes doctor time or creates backlogs, because real diagnosis time isn't predictable.

MediNova addresses all three with AI/ML-backed features, while remaining realistic about how Indian healthcare actually operates today — including doctors who go on leave, patients who show up despite cancelling, walk-ins, and emergencies.

---

## Core Features

### 1. AI Symptom Triage
Patients enter their symptoms in plain text. An AI/NLP model analyzes the input and recommends:
- The appropriate department/specialty
- A suggested doctor based on availability and specialization
- An urgency level (helps patients and staff understand how time-sensitive the visit is)

The patient can accept the recommendation or override it — the AI assists, it doesn't force a decision.

### 2. PRCS — Predictive Reminder & Confirmation System
Rather than predicting who won't show up and silently deprioritizing them (which we deliberately avoided — see *Design Philosophy* below), PRCS works as a fairness-first reminder and confirmation pipeline:
- Automated reminders sent at T-2 days and on the day of the appointment
- Patients confirm or cancel via SMS/notification reply
- If a patient doesn't respond, an ML model (trained on appointment history) assigns a no-show risk score
- This score is **only used to prioritize admin follow-up calls** — it never reorders the queue or bumps a confirmed patient. A human always makes the final call.

### 3. Dynamic Queue Time Estimator
Instead of fixed time slots, patients are given an **estimated arrival window** based on their position in the doctor's queue and that doctor's average consultation time (which the system learns and refines over time from real data). This reflects how outpatient departments actually function and avoids the false precision of a rigid slot system.

### 4. Emergency & Walk-in Handling
- **Emergencies** are inserted at the front of the doctor's live queue, since they're based on observed urgency, not prediction.
- **Regular walk-ins** (unscheduled patients) are appended to the end of the day's queue, after all pre-booked patients.

### 5. Doctor Leave Management
- Single-day leave: affected patients are notified and prompted to reschedule.
- Extended leave (e.g. 7+ consecutive days): a proactive notice is shown on the doctor's booking page in advance, so new patients don't book into a dead period, and existing patients get early warning to plan around it.

---

## Design Philosophy

A recurring principle across MediNova's AI features: **prediction informs human decisions, it never replaces fairness or patient autonomy.**

For example, the no-show risk model never reorders a queue or bumps a patient based on a probability — because doing so would be unfair to patients who show up despite being flagged "high risk," and would erode trust in the system. Instead, predictions are surfaced only to hospital staff as a prioritization tool for outreach, keeping the final decision human.

This distinction was a deliberate design choice, not an oversight — and it's the difference between a genuinely responsible use of AI in healthcare and a naive one.

---

## What's Explicitly Out of Scope (Phase 1)

- **Nurse/paramedical staff roles** — outside the core patient-flow problem this project targets
- **Full medicine inventory/pharmacy management** (suppliers, batches, purchase orders) — a separate project scope on its own

Both are natural extensions planned for a future development cycle once the core AI/patient-flow modules are validated.

---

## Tech Stack

### Frontend
- **React.js** — patient, doctor, and admin dashboards
- **Tailwind CSS** (or CSS modules) — styling

### Backend
- **Node.js + Express.js** — REST API, business logic, authentication, orchestration between DB and AI microservice
- **JWT** — authentication/session management
- **node-cron / node-schedule** — scheduled jobs (reminder triggers, leave checks)

### Database
- **MongoDB** (Mongoose ODM) — stores users, patients, doctors, appointments, prescriptions, bills, no-show predictions, leave records

### AI/ML Microservice
- **Python** (Flask or FastAPI) — separate microservice exposing prediction endpoints
- **scikit-learn** — Logistic Regression / Random Forest for no-show risk prediction
- **NLP library** (spaCy or a simple rule-based/keyword classifier, depending on scope) — for symptom-to-department triage
- **pandas / numpy** — data preprocessing

### Communication / Notifications
- **Twilio API** (or similar SMS gateway) — appointment reminders and confirmation replies

### Other
- **Postman** — API testing
- **Git/GitHub** — version control and team collaboration

---

## High-Level Architecture

```
React (Frontend)
      │
      ▼
Node.js/Express (Backend API)
      │
      ├──▶ MongoDB (data persistence)
      │
      └──▶ Python ML Microservice (Flask/FastAPI)
                │
                ├── Symptom Triage model
                └── No-show Risk model
```

The AI/ML layer is kept as a **separate microservice** rather than embedded in the Node backend, since Python's ML ecosystem (scikit-learn, NLP libraries) is far more mature than Node's for this kind of work. The Node backend orchestrates requests between the frontend, database, and this microservice.

---

## Team Notes

This README reflects the current locked scope for Phase 1. If any teammate wants to propose scope changes (adding a feature, adjusting a workflow), raise it for discussion before implementation — several design decisions here (especially around PRCS and queue handling) were made deliberately after working through real-world edge cases, so changes to those flows should be discussed as a team rather than assumed.

Diagrams (DFD, ER, Class, Activity, Sequence) reflecting this architecture will be added to the `/docs` folder as they're finalized.
