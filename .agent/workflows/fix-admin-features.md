---
description: Fix admin management features - bulk operations, audit trails, KYC review
---

# Fix Admin Management Features

This workflow addresses missing and incomplete admin functionality.

## Prerequisites
- Admin user credentials
- Access to Supabase dashboard

## Steps

### 1. Add Admin Verification Override Controls
**Problem**: Admin cannot manually verify users when automatic checks fail.

**Location**: `pages/admin/VotersManagement.tsx`

**Add UI Elements**:
```tsx
<button onClick={() => handleForceVerify(voter.id, justification)}>
  Force Verify
</button>
<button onClick={() => handleRequestReverification(voter.id)}>
  Request Re-verification
</button>
<textarea 
  placeholder="Justification for override..."
  value={justification}
  onChange={e => setJustification(e.target.value)}
/>
```

**Database Changes**:
```sql
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS verification_override_reason text,
  ADD COLUMN IF NOT EXISTS verification_override_by uuid,
  ADD COLUMN IF NOT EXISTS verification_override_at timestamptz;
```

### 2. Implement Bulk Operations
**Problem**: Admin must handle voters one by one.

**Location**: `pages/admin/VotersManagement.tsx`

**Add Features**:
1. Checkbox selection for multiple voters
2. Bulk actions menu:
   - Approve All Selected
   - Reject All Selected
   - Export Selected to CSV
3. Advanced filters:
   - By verification status
   - By electoral roll status
   - By missing documents
   - By failed biometric checks

**Example Implementation**:
```tsx
const [selectedVoters, setSelectedVoters] = useState<string[]>([]);

const handleBulkApprove = async () => {
  for (const voterId of selectedVoters) {
    await updateVoterStatus(voterId, 'VERIFIED');
  }
};

const handleExportCSV = () => {
  const data = voters.filter(v => selectedVoters.includes(v.id));
  // Generate and download CSV
};
```

### 3. Implement Soft Delete with Audit Trail
**Problem**: Voter deletion is permanent with no recovery option.

**Database Changes**:
```sql
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_by uuid,
  ADD COLUMN IF NOT EXISTS deleted_reason text;

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  action_type text NOT NULL,
  actor_id uuid REFERENCES profiles(id),
  target_type text,
  target_id text,
  old_values jsonb,
  new_values jsonb,
  created_at timestamptz DEFAULT now(),
  ip_address text
);
```

**Modify deleteVoter in RealtimeContext**:
```typescript
const deleteVoter = async (id: string, reason: string) => {
  const { error } = await getClient()
    .from('profiles')
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: currentUserId,
      deleted_reason: reason
    })
    .eq('id', id);
    
  // Log to audit_logs
  await logAuditEvent('VOTER_DELETED', id, reason);
};
```

### 4. Improve KYC Review Interface
**Problem**: KYC Review lacks side-by-side document comparison.

**Location**: `pages/admin/KycReview.tsx`

**Add Split-Screen View**:
```tsx
<div className="kyc-comparison-grid">
  <div className="id-document-section">
    <h3>ID Document</h3>
    <img src={voter.kycDocUrl} alt="ID Document" />
    <div className="extracted-data">
      {/* Show OCR extracted data */}
    </div>
  </div>
  
  <div className="face-photo-section">
    <h3>Captured Face</h3>
    <img src={voter.faceUrl} alt="Captured Face" />
    <div className="similarity-score">
      Match: {matchScore}%
    </div>
  </div>
</div>
```

### 5. Add User Notification System
**Problem**: Users not notified when verification status changes.

**Database Changes**:
```sql
CREATE TABLE IF NOT EXISTS public.notification_queue (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id),
  notification_type text,
  channel text, -- EMAIL, SMS, PUSH
  subject text,
  body text,
  sent_at timestamptz,
  failed_at timestamptz,
  failure_reason text,
  retry_count int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
```

**Implementation**: Integrate with email service (SendGrid, Resend, etc.)

## Verification
// turbo
```bash
npm run dev
```

1. Login as admin
2. Navigate to Voters Management
3. Test bulk selection and operations
4. Test force verify with justification
5. Test soft delete and verify data retained
6. Check audit_logs table for entries
