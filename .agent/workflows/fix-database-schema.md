---
description: Fix database schema issues - constraints, triggers, and performance
---

# Fix Database Schema Issues

This workflow addresses database schema problems and missing constraints.

## Prerequisites
- Supabase project with SQL Editor access
- Database backup recommended before changes

## Steps

### 1. Add Verification Status Transition Validation
**Problem**: Status can jump from any state to any state without validation.

**Create Status History Table**:
```sql
CREATE TABLE IF NOT EXISTS public.verification_status_history (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  old_status text,
  new_status text,
  changed_by uuid REFERENCES profiles(id),
  changed_at timestamptz DEFAULT now(),
  reason text,
  metadata jsonb
);

CREATE INDEX idx_status_history_profile ON verification_status_history(profile_id);
CREATE INDEX idx_status_history_time ON verification_status_history(changed_at);
```

**Create Validation Trigger**:
```sql
CREATE OR REPLACE FUNCTION validate_verification_status_transition()
RETURNS TRIGGER AS $$
BEGIN
  -- Define valid transitions
  IF OLD.verification_status IS DISTINCT FROM NEW.verification_status THEN
    -- Log the transition
    INSERT INTO verification_status_history (profile_id, old_status, new_status)
    VALUES (NEW.id, OLD.verification_status, NEW.verification_status);
    
    -- Validate transition is allowed
    IF NOT (
      (OLD.verification_status = 'NOT_STARTED' AND NEW.verification_status = 'PENDING') OR
      (OLD.verification_status = 'PENDING' AND NEW.verification_status IN ('VERIFIED', 'REJECTED')) OR
      (OLD.verification_status = 'REJECTED' AND NEW.verification_status = 'PENDING') OR
      (OLD.verification_status = 'VERIFIED' AND NEW.verification_status = 'PENDING')
    ) THEN
      RAISE EXCEPTION 'Invalid status transition from % to %', 
        OLD.verification_status, NEW.verification_status;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS validate_status_transition ON profiles;
CREATE TRIGGER validate_status_transition
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION validate_verification_status_transition();
```

### 2. Add Performance Indices
**Problem**: Missing compound indices for common queries.

```sql
-- Compound index for verification queue queries
CREATE INDEX IF NOT EXISTS idx_profiles_verification_compound 
  ON profiles (verification_status, electoral_roll_verified);

-- Index for electoral roll name lookups
CREATE INDEX IF NOT EXISTS idx_official_voters_name_state 
  ON official_voter_lists (lower(full_name), address_state);

-- Index for vote results aggregation
CREATE INDEX IF NOT EXISTS idx_votes_election_time 
  ON votes (election_id, created_at);

-- Index for fraud alert filtering
CREATE INDEX IF NOT EXISTS idx_fraud_risk_time 
  ON fraud_alerts (voter_id, risk_level, timestamp);
```

### 3. Add Vote Validation Trigger
**Problem**: Votes can be inserted without validating eligibility.

```sql
CREATE OR REPLACE FUNCTION validate_vote_insertion()
RETURNS TRIGGER AS $$
DECLARE
  voter_record profiles%ROWTYPE;
  election_record elections%ROWTYPE;
  candidate_count int;
BEGIN
  -- Get voter record
  SELECT * INTO voter_record FROM profiles WHERE id = NEW.voter_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Voter not found';
  END IF;
  
  -- Validate voter eligibility
  IF voter_record.verification_status != 'VERIFIED' THEN
    RAISE EXCEPTION 'Voter is not verified';
  END IF;
  
  IF voter_record.is_blocked = true THEN
    RAISE EXCEPTION 'Voter is blocked';
  END IF;
  
  -- Get election record
  SELECT * INTO election_record FROM elections WHERE id = NEW.election_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Election not found';
  END IF;
  
  -- Validate election is active
  IF election_record.status != 'ACTIVE' THEN
    RAISE EXCEPTION 'Election is not active';
  END IF;
  
  IF now() < election_record.start_date OR now() > election_record.end_date THEN
    RAISE EXCEPTION 'Election is not within voting period';
  END IF;
  
  -- Validate candidate belongs to election
  SELECT COUNT(*) INTO candidate_count 
  FROM candidates 
  WHERE id = NEW.candidate_id AND election_id = NEW.election_id;
  
  IF candidate_count = 0 THEN
    RAISE EXCEPTION 'Candidate does not belong to this election';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS validate_vote ON votes;
CREATE TRIGGER validate_vote
  BEFORE INSERT ON votes
  FOR EACH ROW
  EXECUTE FUNCTION validate_vote_insertion();
```

### 4. Add Automatic Election Status Updates
**Problem**: Election status must be manually changed.

```sql
-- Enable pg_cron extension (if available in your Supabase plan)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE OR REPLACE FUNCTION update_election_statuses()
RETURNS void AS $$
BEGIN
  -- Mark elections as ACTIVE when start_date is reached
  UPDATE elections 
  SET status = 'ACTIVE'
  WHERE status = 'UPCOMING' 
    AND start_date <= now();
  
  -- Mark elections as ENDED when end_date is passed
  UPDATE elections 
  SET status = 'ENDED'
  WHERE status = 'ACTIVE' 
    AND end_date < now();
END;
$$ LANGUAGE plpgsql;

-- Schedule to run every minute (requires pg_cron)
-- SELECT cron.schedule('update-election-status', '* * * * *', 'SELECT update_election_statuses();');
```

### 5. Add Electoral Roll Deduplication
**Problem**: Same voter can be uploaded multiple times.

```sql
-- Add unique constraints
ALTER TABLE official_voter_lists 
  DROP CONSTRAINT IF EXISTS unique_epic_number;
CREATE UNIQUE INDEX IF NOT EXISTS unique_epic_number 
  ON official_voter_lists (epic_number) 
  WHERE epic_number IS NOT NULL;

ALTER TABLE official_voter_lists 
  DROP CONSTRAINT IF EXISTS unique_aadhaar_number;
CREATE UNIQUE INDEX IF NOT EXISTS unique_aadhaar_number 
  ON official_voter_lists (aadhaar_number) 
  WHERE aadhaar_number IS NOT NULL;

-- Add upload tracking columns
ALTER TABLE official_voter_lists 
  ADD COLUMN IF NOT EXISTS uploaded_batch_id uuid,
  ADD COLUMN IF NOT EXISTS uploaded_by uuid REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS uploaded_at timestamptz DEFAULT now();
```

### 6. Add CHECK Constraints
**Problem**: Invalid data can be inserted.

```sql
-- Age constraint (voting age 18+)
ALTER TABLE profiles 
  ADD CONSTRAINT check_voting_age 
  CHECK (age IS NULL OR (age >= 18 AND age <= 120));

-- Role constraint
ALTER TABLE profiles 
  ADD CONSTRAINT check_valid_role 
  CHECK (role IN ('VOTER', 'ADMIN'));

-- Aadhaar format constraint (12 digits)
ALTER TABLE profiles 
  ADD CONSTRAINT check_aadhaar_format 
  CHECK (aadhaar_number IS NULL OR aadhaar_number ~ '^\d{12}$');
```

## Verification
// turbo-all
Open Supabase SQL Editor and run each migration block sequentially.

1. Run each SQL block in order
2. Test inserting invalid data to verify constraints work
3. Verify status transition logging works
4. Check indices exist using `\di` command
5. Test vote validation by attempting invalid vote
