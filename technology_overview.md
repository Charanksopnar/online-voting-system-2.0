# 🗳️ SecureVote AI - Technology Stack & Architecture Report

## 1. Frontend Architecture
The user interface is built as a Single Page Application (SPA), emphasizing performance, type safety, and a modern component-based architecture.

*   **Core Framework**: [React 19](https://react.dev/)
    *   Utilizes the latest React features (Hooks, Context API) for state management.
*   **Build Tool**: [Vite](https://vitejs.dev/)
    *   Provides instant server start and lightning-fast Hot Module Replacement (HMR).
    *   Configured with a proxy to forward `/deepface` requests to the local Docker container.
*   **Language**: **TypeScript** (v5.8)
    *   Strict typing enforced across all components and services to minimize runtime errors.
*   **Styling System**: [Tailwind CSS v4](https://tailwindcss.com/)
    *   Utility-first CSS framework for rapid UI development.
    *   Includes a dark/light mode theme system (`ThemeContext`).
    *   Custom design tokens for the "premium" aesthetic.
*   **Routing**: **React Router Dom** (v7.10)
    *   Client-side routing with protected routes for Admin and User roles.
*   **State Management**: **React Context API**
    *   `AuthContext`: Manages user authentication sessions.
    *   `RealtimeContext`: Handles live database subscriptions.
    *   `NotificationContext`: Global toast notification system.

## 2. Backend Services (BaaS)
The backend leverages **Supabase** as a Backend-as-a-Service (BaaS) platform, providing a robust and scalable serverless architecture.

*   **Platform**: [Supabase](https://supabase.com/)
*   **Database**: **PostgreSQL**
    *   Relational data model (Tables: `profiles`, `elections`, `candidates`, `votes`, `official_voter_lists`).
    *   **Row Level Security (RLS)**: Policies enforce data access rules at the database engine level (e.g., users can only edit their own profiles).
    *   **Triggers (PL/pgSQL)**:
        *   `handle_new_user`: Automatically verifies age and checks against the official voter list upon registration.
*   **Authentication**: **Supabase Auth**
    *   Email/Password authentication.
    *   Session management with JSON Web Tokens (JWT).
    *   Role-based access control (Admin vs. Voter).
*   **Realtime**: **Supabase Realtime**
    *   WebSockets-based subscriptions to database changes.
    *   Used for live vote counting and instant status updates (e.g., identity verification results).
*   **Storage**: **Supabase Storage**
    *   Buckets for `faces` (biometric data), `uploads` (ID documents), and candidate photos.

## 3. AI & Machine Learning Services
A dedicated microservice handles biometric verification to ensure election integrity.

*   **Service**: **DeepFace**
    *   **Framework**: Python-based facial recognition framework.
    *   **Models**: Configured to use **FaceNet** for embedding generation and **OpenCV** for detection.
*   **Biometric Logic**:
    *   **Liveness Detection**: Client-side analysis of 3 camera frames to prevent photo spoofs.
    *   **Face Embeddings**: Converts faces into 128-dimensional vectors. SecureVote stores these vectors, not the raw images, for privacy-preserving verification.
    *   **Verification**: Calculates Euclidean distance between the live camera feed and the stored profile vector during voting (Threshold < 10.0).
*   **Generative AI**: **Google Gemini API** (`@google/genai`)
    *   Integrated via `geminiService.ts` for auxiliary AI tasks (helper bots or enhanced data processing).

## 4. Infrastructure & DevOps
*   **Containerization**: **Docker**
    *   The DeepFace API runs in an isolated container (`serengil/deepface`).
    *   Exposes port `5000` locally, which the Vite frontend proxies to.
*   **Environment Management**: `.env` files manage API keys (Supabase URL/Key, Gemini Key).

## 5. Key Libraries & Tools
*   **Data Visualization**: **Recharts** (Interactive charts for election results).
*   **Data Processing**:
    *   `papaparse`: CSV parsing for bulk voter list uploads.
    *   `xlsx`: Excel file processing for administrative data import.
*   **Icons**: **Lucide React** (Consistent, modern SVG icons).
*   **QR Codes**: `react-qr-code` (Digital Voter ID generation).

## 6. Security Features
*   **Blockchain Simulation**: Each vote generates a unique `block_hash`, creating a tamper-evident record.
*   **Strict Verification**: Registration triggers a cross-check against `official_voter_lists` using `aadhaar_number` or `epic_number`.
*   **Age Verification**: Database-level constraints prevent underage registration.
