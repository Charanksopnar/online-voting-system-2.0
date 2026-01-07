---
description: Fix voting flow security - server-side verification and duplicate prevention
---

# Fix Voting Flow Security

This workflow addresses CRITICAL security vulnerabilities in the voting process.

## Prerequisites
- DeepFace Docker container running
- Supabase Edge Functions enabled
- Admin access to Supabase dashboard

## Steps

### 1. Implement Server-Side Face Verification
**CRITICAL**: Current face verification happens client-side which can be bypassed.

**Location**: `services/faceService.ts` and `pages/user/VotingPage.tsx`

**New File**: Create Supabase Edge Function `verify-voter-face`:
```typescript
// supabase/functions/verify-voter-face/index.ts
export async function handler(req: Request) {
  const { voter_id, election_id, live_frame_base64 } = await req.json();
  
  // 1. Fetch stored embeddings from profiles
  // 2. Call DeepFace to get embedding for live_frame
  // 3. Compute distance on server side
  // 4. Log verification attempt to fraud_alerts
  // 5. Return signed verification token with expiry
}
```

**Database Changes**:
```sql
ALTER TABLE public.votes 
  ADD COLUMN IF NOT EXISTS verification_token text,
  ADD COLUMN IF NOT EXISTS token_expires_at timestamptz;
```

### 2. Fix Multiple Voting Prevention
**Problem**: Race conditions can allow duplicate votes.

**Location**: `contexts/RealtimeContext.tsx` - `castVote` function (line 398-421)

1. Handle unique constraint violations gracefully:
   ```typescript
   try {
     // Insert vote
   } catch (error) {
     if (error.code === '23505') { // Unique violation
       notify('You have already voted in this election');
       return;
     }
   }
   ```

2. Add database-level validation before vote insertion

### 3. Fix Security Violation Handling
**Problem**: Tab switches/blur events only tracked client-side.

**Database Changes**: Create `voting_sessions` table:
```sql
CREATE TABLE IF NOT EXISTS public.voting_sessions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  voter_id uuid REFERENCES profiles(id),
  election_id text REFERENCES elections(id),
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  violation_count int DEFAULT 0,
  blocked_at timestamptz,
  blocked_reason text,
  ip_address text,
  user_agent text
);
```

**Location**: `pages/user/VotingPage.tsx` - `handleViolation` function

1. Store violations in database, not just local state
2. Block user after 3 violations for 30 minutes
3. Check session status before allowing vote

### 4. Fix Face Verification Retry Logic
**Problem**: Page reload resets attempts, allowing brute force.

**Database Changes**: Create `face_verification_attempts` table:
```sql
CREATE TABLE IF NOT EXISTS public.face_verification_attempts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  voter_id uuid REFERENCES profiles(id),
  election_id text REFERENCES elections(id),
  attempt_time timestamptz DEFAULT now(),
  success boolean,
  confidence_score decimal,
  distance decimal,
  failure_reason text,
  ip_address text
);
```

**Implementation**:
1. Track failed attempts in database per user per election
2. Implement exponential backoff: 5 min, 15 min, 1 hour, 24 hours
3. Show remaining time to user
4. Admin can reset attempts manually

## Verification
// turbo
```bash
npm run dev
```

1. Navigate to an active election voting page
2. Test face verification flow
3. Verify attempts are logged to database
4. Test tab switch violation handling
5. Verify duplicate vote prevention works
