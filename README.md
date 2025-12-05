<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# 🗳️ Secure e-Voting System with KYC Verification

A comprehensive, secure electronic voting system built with **React + TypeScript** frontend and **Supabase** backend. Features KYC-based voter verification, real-time election updates, biometric face matching, and fraud detection.

---

## 📋 Project Overview

This project implements a **secure e-Voting platform** that ensures only verified voters can participate in elections. The system follows a multi-phase verification process:

1. **Voter Registration** → Collect user details and ID documents (Aadhaar/Voter ID)
2. **KYC Verification** → Admin reviews documents and verifies identity
3. **Face Capture** → Capture live face photo for biometric matching
4. **Secure Voting** → Verified voters cast votes with face verification
5. **Real-time Results** → Live election results and fraud monitoring

---

## 📁 Project Structure

```
sum/
├── components/           # Reusable UI components
│   ├── Layout/          # Page layout components
│   │   ├── AdminLayout.tsx    # Admin panel wrapper
│   │   ├── Navbar.tsx         # Top navigation bar
│   │   └── Sidebar.tsx        # Side navigation menu
│   └── UI/              # Generic UI components
│       └── LoadingOverlay.tsx # Loading spinner overlay
│
├── contexts/            # React Context providers (global state)
│   ├── AuthContext.tsx        # User auth & session management
│   ├── NotificationContext.tsx # In-app notifications
│   ├── RealtimeContext.tsx    # Supabase real-time subscriptions
│   └── ThemeContext.tsx       # Dark/Light theme toggle
│
├── pages/               # Page components for each route
│   ├── Home.tsx              # Landing page
│   ├── Login.tsx             # User login form
│   ├── Signup.tsx            # User registration with OCR
│   ├── admin/                # Admin-only pages
│   │   ├── AdminDashboard.tsx    # Admin overview & stats
│   │   ├── AddElection.tsx       # Create new elections
│   │   ├── AddCandidate.tsx      # Add candidates to elections
│   │   ├── CandidatesManagement.tsx # Manage all candidates
│   │   ├── VotersManagement.tsx  # Manage voter accounts
│   │   ├── KycReview.tsx         # Review KYC submissions
│   │   ├── RegionConfiguration.tsx # Manage regions/districts
│   │   ├── InvalidVotes.tsx      # View flagged/invalid votes
│   │   └── AdminNotifications.tsx # Admin alerts
│   ├── user/                 # Voter pages
│   │   ├── UserDashboard.tsx     # Voter home with elections
│   │   ├── VotingPage.tsx        # Cast vote interface
│   │   ├── IdVerification.tsx    # ID verification status
│   │   ├── EditProfile.tsx       # Edit user profile
│   │   ├── FaceCapturePreview.tsx # Face capture for verification
│   │   └── UserNotifications.tsx # Voter notifications
│   └── common/              # Shared pages
│       └── NotFound.tsx         # 404 error page
│
├── services/            # External API services
│   └── geminiService.ts     # Gemini AI for OCR extraction
│
├── App.tsx              # Main app with routing
├── index.tsx            # React entry point
├── types.ts             # TypeScript interfaces
├── supabase.ts          # Supabase client config
├── supabase_schema.sql  # Database schema (run in Supabase)
└── package.json         # Dependencies
```

---

## 🔄 Workflow Logic by Phase

### **Phase 1: Voter Registration** (`Signup.tsx`)
- User enters personal details (name, DOB, phone, address)
- Uploads Aadhaar or Voter ID document
- **OCR extraction** (via Gemini AI) auto-fills ID numbers
- Captures live face photo for biometric verification
- Data saved to `profiles` table via Supabase Auth

### **Phase 2: KYC Verification** (`KycReview.tsx`)
- Admin views pending KYC submissions
- Compares uploaded ID documents with user data
- Verifies face photo matches ID photo
- Updates `verification_status`: `NOT_STARTED` → `PENDING` → `VERIFIED` / `REJECTED`
- Verified users can proceed to vote

### **Phase 3: Election Management** (`AddElection.tsx`, `AddCandidate.tsx`)
- Admin creates elections with title, dates, and region
- Adds candidates with party info and manifesto
- Election status: `UPCOMING` → `ACTIVE` → `COMPLETED`
- Real-time updates via Supabase subscriptions

### **Phase 4: Secure Voting** (`VotingPage.tsx`)
- Voter selects an active election
- System checks: verification status, hasn't voted, not blocked
- Live face capture compared against stored face
- Vote recorded with blockchain-style hash
- Fraud score calculated based on behavior patterns

### **Phase 5: Results & Monitoring** (`UserDashboard.tsx`, `AdminDashboard.tsx`)
- Real-time vote counts and winner display
- Admin monitors fraud alerts and invalid votes
- Region-wise statistics and voter turnout
- Export results and audit logs

---

## 🗄️ Database Tables (Supabase)

| Table | Purpose |
|-------|---------|
| `profiles` | User accounts with KYC data |
| `elections` | Election details and status |
| `candidates` | Candidates per election |
| `votes` | Vote records with hashes |
| `regions` | Geographic regions/districts |
| `fraud_alerts` | Flagged suspicious activities |

---

## 🚀 Run Locally

**Prerequisites:** Node.js, Supabase Project

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Supabase:**
   - Set `GEMINI_API_KEY` in [.env.local](.env.local)
   - Run `supabase_schema.sql` in your Supabase SQL editor

3. **Run the app:**
   ```bash
   npm run dev
   ```

---

## 🔐 Security Features

- **Row Level Security (RLS)** on all tables
- **Face biometric verification** before voting
- **Fraud detection** with risk scoring
- **Blockchain-style vote hashing**
- **Real-time monitoring** for suspicious activity

---

## 🛠️ Tech Stack

- **Frontend:** React 18 + TypeScript + Vite
- **Backend:** Supabase (PostgreSQL + Auth + Realtime)
- **AI:** Google Gemini API (OCR extraction)
- **Styling:** CSS with dark/light theme support

---

View your app in AI Studio: https://ai.studio/apps/drive/1qT5myx_44t4u6J3i-wjK2c1N95ulBrRG
