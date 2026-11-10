# 🏥 DoctorPro — Premium Medical & Practice Management System

A modern, full-featured medical practice and clinic website system built with **Next.js 15+ (App Router)** on the frontend and **NestJS 11 + Prisma ORM** on the backend. Designed specifically for individual doctors, multi-doctor chambers (2–3 doctors), and small private clinics / diagnostic practices.

---

## ✨ Key Features

### 👨‍⚕️ 1. Doctor Management & Credentials
- **Doctor Profile Picture Upload:** Seamless photo upload with live portrait preview, auto top-centered face alignment, and full-resolution uncropped lightbox viewer.
- **BMDC Medical Certificate Upload:** Support for PDF and image licenses/degree documents with quick "Open Document" verification.
- **Configurable Slot Duration:** Select consultation duration per patient: **10 min, 15 min, 20 min, 30 min, 45 min, or 60 min**. Online booking time slots are generated dynamically based on the doctor's interval.
- **Auto-Approve vs Manual Confirmation:** Toggle whether patient bookings are instantly **`CONFIRMED`** or held as **`PENDING CONFIRMATION`** awaiting doctor/assistant review.

### 👥 2. Three Specialized System Roles
1. **ADMIN (Clinic Administrator):** Full practice management, staff creation, doctor profile assignment, department/service control, and settings.
2. **DOCTOR (Doctor Portal):** Dedicated workspace with personal practice configuration (slot duration & auto-approve switch), patient queue, and appointment status updates.
3. **DOCTOR_ASSISTANT (Assistant Desk & Queue):** Daily patient queue, 1-click **Approve / Confirm** for pending bookings, and check-in desk.

### 🌐 3. Public Patient Experience
- Clean, trustworthy healthcare UI (inspired by MediCare+).
- Specialist directory with department filtering and doctor profile details.
- Frictionless online appointment booking without mandatory patient registration.
- Health blog, service offerings, clinic facilities gallery, and contact information.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 15+ (App Router), Tailwind CSS v4, shadcn/ui, Lucide Icons |
| **Backend** | NestJS 11, Prisma ORM, Multer (File Uploads), Swagger Docs |
| **Database** | SQLite (`prisma/dev.db`) |
| **Authentication** | JWT (Passport.js), Role-based authorization |

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js 20+
- npm

### 1. Backend Setup
```bash
cd backend
npm install
npx prisma db push
npm run prisma:seed
npm run build
npm run start:prod
# API runs on http://localhost:4000
# Swagger docs: http://localhost:4000/api/docs
```

### 2. Frontend Setup
```bash
cd ../frontend
npm install
npm run build
npm run start
# Website runs on http://localhost:3000
```

### 🔑 Default Credentials
- **Admin Portal:** `http://localhost:3000/admin`
- **Email:** `admin@doctorpro.com`
- **Password:** `admin123`

---

## 📁 Repository Structure

```
DoctorPro/
├── backend/                  # NestJS API Server
│   ├── prisma/               # Prisma schema & seed scripts
│   ├── uploads/              # Local uploads storage (pictures, certificates)
│   └── src/
│       ├── appointments/     # Dynamic slot generation & booking
│       ├── auth/             # JWT auth & Staff role management
│       ├── doctors/          # Doctor profiles, certificates, slots
│       ├── upload/           # Multer file upload handler
│       └── ...
│
└── frontend/                 # Next.js 15+ Frontend
    └── src/
        ├── app/
        │   ├── (public)/     # Public pages (Home, Doctors, Booking, Blog)
        │   └── admin/        # Portals (Admin, Doctor, Assistant, Staff)
        ├── components/       # shadcn/ui & layout components
        └── lib/              # API client & Auth context
```

---

## 📄 License
MIT License. Created for DoctorPro.
