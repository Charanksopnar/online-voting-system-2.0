---
description: Fix registration flow - face embedding validation and verification state machine
---

# Fix Registration Flow

This workflow addresses critical issues in the voter registration process.

## Prerequisites
- DeepFace Docker container running at `localhost:5000`
- Supabase database with proper schema

## Steps

### 1. Fix Face Embedding Validation in Signup.tsx
**Problem**: Face embeddings captured during registration may not be properly saved to the database.

**Fix Location**: `pages/Signup.tsx` - `handleSubmit` function (lines 250-581)

1. After calling `signUp()`, add explicit validation:
   ```typescript
   // After profile update with face_embeddings
   const { data: confirmData } = await supabase
     .from('profiles')
     .select('face_embeddings')
     .eq('id', user.id)
     .single();
   
   if (!confirmData?.face_embeddings || confirmData.face_embeddings.length === 0) {
     throw new Error('Face embeddings were not saved. Please retry face capture.');
   }
   ```

2. Add retry mechanism with max 3 attempts for face capture

### 2. Implement Strict Verification State Machine
**Problem**: Automatic verification status can lead to users being auto-verified inappropriately.

**Database Changes** (run in Supabase SQL Editor):
```sql
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS verification_stage text DEFAULT 'NOT_STARTED';
```

**Valid State Transitions**:
- `NOT_STARTED` → `PENDING_ELECTORAL`
- `PENDING_ELECTORAL` → `PENDING_BIOMETRIC`
- `PENDING_BIOMETRIC` → `VERIFIED` or `PENDING_MANUAL`
- `REJECTED` → `PENDING` (on resubmission)

### 3. Add Duplicate Prevention with Transaction
**Problem**: Duplicates can occur if face registration fails after initial checks pass.

1. Add unique constraints in database:
   ```sql
   ALTER TABLE public.profiles 
     ADD CONSTRAINT unique_aadhaar UNIQUE (aadhaar_number);
   ALTER TABLE public.profiles 
     ADD CONSTRAINT unique_epic UNIQUE (epic_number);
   ```

2. Implement cleanup job for incomplete registrations

### 4. Validate OCR Extracted Data Quality
**Problem**: OCR may produce incorrect data that goes unnoticed.

**Location**: `pages/Signup.tsx` - `handleAadhaarUpload` function

1. Add format validation:
   - Aadhaar: 12-digit validation
   - DOB: Valid date format
   - Names: No invalid characters

2. Show diff comparison UI for user confirmation

## Verification
// turbo-all
```bash
npm run dev
```

1. Navigate to `/signup`
2. Complete registration with invalid test data
3. Verify validation errors appear
4. Complete with valid data
5. Check database for correct face_embeddings
