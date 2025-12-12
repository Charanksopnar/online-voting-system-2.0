# SecureVote AI - Modern Electronic Voting System

## 🗳️ Project Overview
SecureVote AI is a state-of-the-art online voting platform designed to ensure secure, transparent, and accessible elections. It leverages **AI-based Face Verification** for robust identity checks and **Supabase** for real-time data management. The system supports full election lifecycles including voter registration, KYC verification, candidate management, and real-time result visualization.

## 🚀 Tech Stack

### Frontend
- **Framework**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/) - For a fast, modern UI.
- **Language**: TypeScript - ensuring type safety across the codebase.
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) - Responsive and modern design system with a custom dark mode.
- **Icons**: [Lucide React](https://lucide.dev/) - Clean and consistent iconography.
- **Charts**: [Recharts](https://recharts.org/) - For visualizing election data and analytics.
- **Excel/CSV Parsing**: `papaparse` & `xlsx` - For bulk importing voter lists.

### Backend & Database
- **Platform**: [Supabase](https://supabase.com/) (BaaS)
- **Database**: PostgreSQL with Row Level Security (RLS) policies.
- **Authentication**: Supabase Auth (Email/Password).
- **Storage**: Supabase Storage for profile photos, KYC docs, and party symbols.
- **Realtime**: Supabase Realtime for live vote updates and notifications.

### AI & Security
- **Face Recognition**: A separate Python-based service (DeepFace) running in Docker.
  - **Liveness Detection**: Client-side heuristic checks + Server-side embedding verification.
  - **Face Embeddings**: Vectors stored in the database to compare at voting time without storing raw biometric images.
- **Block Hash Mock**: Each vote generates a hash to simulate blockchain-style integrity.

---

## � Folder Structure

```
/
├── .env.local             # Environment variables (Supabase URL, Anon Key)
├── components/            # Reusable UI components
│   ├── Layout/            # Navbar, Sidebar, AdminLayout, etc.
│   └── UI/                # Smaller UI elements (Cards, Buttons)
├── contexts/              # React Context Providers for global state
│   ├── AuthContext.tsx        # Manages user login/signup state
│   ├── RealtimeContext.tsx    # Handles live data sync (votes, candidates)
│   ├── NotificationContext.tsx # Toast notification system
│   └── ThemeContext.tsx       # Dark/Light mode toggle
├── pages/                 # Main application routes/views
│   ├── Home.tsx               # Landing page
│   ├── Login.tsx / Signup.tsx # Auth pages
│   ├── user/                  # Voter-facing pages (Dashboard, Voting, IdVerification)
│   └── admin/                 # Admin-facing pages (Management, Analytics)
│       ├── VotersManagement.tsx        # Manage registered users
│       ├── CandidatesManagement.tsx    # Manage candidates & parties
│       ├── VoterListsVerification.tsx  # Cross-verify with official electoral rolls
│       └── ... (other admin features)
├── services/              # API and external service connectors
│   ├── faceService.ts     # Communicates with DeepFace Docker API (localhost:5000)
│   ├── geminiService.ts   # (Optional) AI helper features
│   └── supabase.ts        # Supabase client configuration
├── data/                  # Static data (e.g., states/districts mapping)
├── supabase_schema.sql    # Complete Database Schema setup script
├── App.tsx                # Main Router and Layout definition
└── package.json           # Dependencies and scripts setup
```

---

## ⚙️ Workflows & Implementation Logic

### 1. Voter Registration & KYC
**Workflow**:
1. User signs up via `Signup.tsx` providing basic details (Name, Email, Password).
2. **Auto-Profile Creation**: A PostgreSQL Trigger (`handle_new_user`) automatically creates a user entry in the `profiles` table.
3. **ID Proof Upload**: Users upload Aadhaar/EPIC cards.
4. **OCR**: (Logic implemented in `Signup.tsx`) The system can OCR scanned IDs to auto-fill fields (e.g., Aadhaar Number).

### 2. Face Verification (Registration)
**Logic**: Defined in `services/faceService.ts`.
1. **Liveness Check**: The user must provide 3 slightly different camera frames. The system checks if frames differ enough to prevent using a static photo.
2. **Embedding Generation**: Frames are sent to the local Python DeepFace API (`/represent`).
3. **Storage**: The generated 128-dimensional face vector (embedding) is stored in the `profiles` table.

### 3. Electoral Roll Verification (Admin)
**File**: `pages/admin/VoterListsVerification.tsx`
1. **Upload**: Admin uploads an official Government Electoral Roll (CSV/Excel).
2. **Parsing**: The app parses files using `PapaParse` or `XLSX`.
3. **Cross-Matching**: The system attempts to match rows against registered users via `aadhaarNumber` or `epicNumber`.
4. **Verification**: If matched, the user is marked as `electoral_roll_verified = true` in the DB.

### 4. Voting Process
**File**: `pages/user/VotingPage.tsx`
1. **Eligibility Check**:
   - Must be verified (`verification_status` = 'VERIFIED').
   - Must not have voted in this election.
2. **Face Auth**: Before casting a vote, the user's live camera feed is compared against the stored embedding in the DB.
   - **Threshold**: Basic Euclidean distance check (< 10.0 distance).
3. **Casting Vote**: If face matches, the vote is inserted into the `votes` table with a unique `block_hash`.

### 5. Admin Management
- **Candidates**: Add/Edit candidates with photos and party symbols.
- **Regions**: Configure States and Districts.
- **Analytics**: View live vote counts, turnout percentages, and regional breakdowns.

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js (v16+)
- Docker (for DeepFace service)
- Supabase Account

### 1. Environment Setup
Create a `.env.local` file in the root directory:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Database Setup
1. Go to your Supabase SQL Editor.
2. Copy the contents of `supabase_schema.sql`.
3. Run the script to create all tables, policies, and triggers.

### 4. Pull the DeepFace Docker Image
```bash
docker pull serengil/deepface
```

### 5. Start the Application

**Option A: Run everything together (Recommended)**
```bash
npm run dev:all
```
This starts both the Vite dev server and DeepFace Docker container concurrently.

**Option B: Run services separately**
```bash
# Terminal 1 - Start the Face Service
npm run dev:face

# Terminal 2 - Start the Vite dev server
npm run dev
```

Access the app at `http://localhost:5173`.

### 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start only the Vite dev server |
| `npm run dev:face` | Start only the DeepFace Docker container |
| `npm run dev:all` | Start BOTH together (Vite + DeepFace) |
| `npm run build` | Build for production |
| `npm run preview` | Preview the production build |

---

## � Security Measures
- **Row Level Security (RLS)**: Ensures users can only edit their own profiles and cannot access unauthorized data.
- **Face Biometrics**: Prevents impersonation during voting.
- **Audit Logs**: Tracks critical admin actions.
