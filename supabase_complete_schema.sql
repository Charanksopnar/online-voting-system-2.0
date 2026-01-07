-- ==========================================================
-- SUPABASE COMPLETE DATABASE SCHEMA FOR E-VOTING SYSTEM 2.0
-- Consolidated & Idempotent
-- Date: January 2026
-- ==========================================================

-- ============================================
-- 1. ENABLE EXTENSIONS
-- ============================================
create extension if not exists "uuid-ossp";

-- ============================================
-- 2. TABLES DEFINITIONS
-- ============================================

-- PROFILES (User accounts with KYC data)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  first_name text,
  last_name text,
  father_name text,
  role text default 'VOTER',
  verification_status text default 'NOT_STARTED',
  verification_stage text default 'NOT_STARTED',
  verification_rejection_reason text,
  is_blocked boolean default false,
  block_reason text,
  photo_url text,
  face_url text,
  face_embeddings jsonb default '[]'::jsonb,
  face_embedding_hash text,
  face_embedding_version int default 1,
  face_embedding_created_at timestamptz,
  liveness_verified boolean default false,
  age int,
  dob text,
  phone text,
  address_state text,
  address_district text,
  address_city text,
  id_number text,
  id_type text,
  kyc_doc_url text,
  aadhaar_number text,
  epic_number text,
  epic_doc_url text,
  latest_verification_photo text,
  electoral_roll_verified boolean default false,
  electoral_roll_match_id uuid,
  manual_verify_requested boolean default false,
  manual_verify_requested_at timestamptz,
  verification_override_reason text,
  verification_override_by uuid,
  verification_override_at timestamptz,
  deleted_at timestamptz,
  deleted_by uuid,
  deleted_reason text,
  created_at timestamptz default timezone('utc'::text, now())
);

-- ELECTIONS
create table if not exists public.elections (
  id text primary key,
  title text,
  description text,
  start_date timestamptz,
  end_date timestamptz,
  status text default 'UPCOMING',
  region text,
  region_state text,
  region_district text,
  created_at timestamptz default timezone('utc'::text, now())
);

-- CANDIDATES
create table if not exists public.candidates (
  id text primary key,
  election_id text references public.elections(id) on delete cascade,
  name text,
  party text,
  party_symbol_url text,
  photo_url text,
  manifesto text,
  votes_count int default 0,
  age int,
  state text,
  district text,
  created_at timestamptz default timezone('utc'::text, now())
);

-- VOTES
create table if not exists public.votes (
  id uuid primary key default uuid_generate_v4(),
  election_id text references public.elections(id) on delete cascade,
  candidate_id text references public.candidates(id) on delete cascade,
  voter_id uuid references public.profiles(id) on delete cascade,
  block_hash text,
  risk_score double precision default 0,
  verification_token text,
  verification_confidence decimal,
  face_verified_at timestamptz,
  created_at timestamptz default timezone('utc'::text, now()),
  unique (election_id, voter_id)
);

-- REGIONS
create table if not exists public.regions (
  id text primary key,
  name text,
  type text,
  parent_region_id text references public.regions(id),
  voter_count int default 0,
  created_at timestamptz default timezone('utc'::text, now())
);

-- FRAUD ALERTS
create table if not exists public.fraud_alerts (
  id uuid primary key default uuid_generate_v4(),
  voter_id uuid references public.profiles(id) on delete set null,
  election_id text references public.elections(id) on delete set null,
  reason text,
  risk_level text,
  details text,
  timestamp timestamptz default timezone('utc'::text, now())
);

-- OFFICIAL VOTER LISTS
create table if not exists public.official_voter_lists (
  id uuid primary key default uuid_generate_v4(),
  aadhaar_number text unique,
  epic_number text unique,
  full_name text,
  last_name text,
  father_name text,
  age int,
  gender text,
  address_state text,
  address_district text,
  address_city text,
  polling_booth text,
  dob text,
  full_address text,
  created_at timestamptz default timezone('utc'::text, now())
);

-- VERIFICATION STATUS HISTORY
create table if not exists public.verification_status_history (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references public.profiles(id) on delete cascade,
  old_status text,
  new_status text,
  changed_by uuid references public.profiles(id) on delete set null,
  changed_at timestamptz default now(),
  reason text,
  metadata jsonb
);

-- VOTING SESSIONS
create table if not exists public.voting_sessions (
  id uuid primary key default uuid_generate_v4(),
  voter_id uuid references public.profiles(id) on delete cascade,
  election_id text references public.elections(id) on delete cascade,
  started_at timestamptz default now(),
  completed_at timestamptz,
  violation_count int default 0,
  blocked_at timestamptz,
  blocked_reason text,
  ip_address text,
  user_agent text,
  unique(voter_id, election_id)
);

-- FACE VERIFICATION ATTEMPTS
create table if not exists public.face_verification_attempts (
  id uuid primary key default uuid_generate_v4(),
  voter_id uuid references public.profiles(id) on delete cascade,
  election_id text references public.elections(id) on delete cascade,
  attempt_time timestamptz default now(),
  success boolean,
  confidence_score decimal,
  distance decimal,
  image_quality_score decimal,
  failure_reason text,
  ip_address text,
  context text default 'VOTING'
);

-- AUDIT LOGS
create table if not exists public.audit_logs (
  id uuid primary key default uuid_generate_v4(),
  action_type text,
  actor_id uuid references public.profiles(id) on delete set null,
  target_type text,
  target_id text,
  old_values jsonb,
  new_values jsonb,
  timestamp timestamptz default now(),
  ip_address text,
  user_agent text
);

-- NOTIFICATION QUEUE
create table if not exists public.notification_queue (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade,
  notification_type text,
  channel text, -- EMAIL, SMS, PUSH
  subject text,
  body text,
  sent_at timestamptz,
  failed_at timestamptz,
  failure_reason text,
  retry_count int default 0
);

-- CITY ALIASES
create table if not exists public.city_aliases (
  id uuid primary key default uuid_generate_v4(),
  primary_name text not null,
  alias text not null,
  state text,
  unique(primary_name, alias)
);

-- ============================================
-- 3. INSERT DEFAULT DATA
-- ============================================

insert into public.city_aliases (primary_name, alias, state) values
  ('Bengaluru', 'Bangalore', 'Karnataka'),
  ('Mumbai', 'Bombay', 'Maharashtra'),
  ('Chennai', 'Madras', 'Tamil Nadu'),
  ('Kolkata', 'Calcutta', 'West Bengal'),
  ('Kochi', 'Cochin', 'Kerala'),
  ('Thiruvananthapuram', 'Trivandrum', 'Kerala'),
  ('Varanasi', 'Banaras', 'Uttar Pradesh'),
  ('Puducherry', 'Pondicherry', 'Puducherry'),
  ('Shimla', 'Simla', 'Himachal Pradesh'),
  ('Mysuru', 'Mysore', 'Karnataka')
on conflict (primary_name, alias) do nothing;

-- ============================================
-- 4. INDEXES
-- ============================================

create index if not exists idx_profiles_lower_email on public.profiles (lower(email));
create index if not exists idx_profiles_phone on public.profiles (phone);
create index if not exists idx_profiles_aadhaar_number on public.profiles (aadhaar_number);
create index if not exists idx_profiles_epic_number on public.profiles (epic_number);
create index if not exists idx_profiles_verification_stage on public.profiles(verification_stage);
create index if not exists idx_profiles_deleted_at on public.profiles(deleted_at) where deleted_at is null;
create index if not exists idx_profiles_verification_compound on public.profiles (verification_status, electoral_roll_verified) where deleted_at is null;

create index if not exists idx_elections_status_dates on public.elections (status, start_date, end_date);
create index if not exists idx_candidates_election_id on public.candidates (election_id);

create index if not exists idx_votes_election_candidate on public.votes (election_id, candidate_id);
create index if not exists idx_votes_voter_id on public.votes (voter_id);
create index if not exists idx_votes_election_time on public.votes (election_id, created_at);

create index if not exists idx_fraud_alerts_voter_election on public.fraud_alerts (voter_id, election_id);
create index if not exists idx_fraud_alerts_risk_level on public.fraud_alerts(risk_level);
create index if not exists idx_fraud_risk_time on public.fraud_alerts (voter_id, risk_level, timestamp);

create index if not exists idx_official_voters_aadhaar on public.official_voter_lists (aadhaar_number);
create index if not exists idx_official_voters_epic on public.official_voter_lists (epic_number);
create index if not exists idx_official_voters_name on public.official_voter_lists (lower(full_name));
create index if not exists idx_official_voters_name_state on public.official_voter_lists (lower(full_name), address_state);

create index if not exists idx_status_history_profile on public.verification_status_history(profile_id);
create index if not exists idx_status_history_time on public.verification_status_history(changed_at);

create index if not exists idx_voting_sessions_voter on public.voting_sessions(voter_id);
create index if not exists idx_voting_sessions_election on public.voting_sessions(election_id);

create index if not exists idx_face_attempts_voter on public.face_verification_attempts(voter_id);
create index if not exists idx_face_attempts_election on public.face_verification_attempts(election_id);
create index if not exists idx_face_attempts_time on public.face_verification_attempts(attempt_time);

create index if not exists idx_audit_logs_actor_id on public.audit_logs(actor_id);
create index if not exists idx_audit_logs_timestamp on public.audit_logs(timestamp);
create index if not exists idx_audit_logs_target on public.audit_logs(target_type, target_id);

-- ============================================
-- 5. STORAGE BUCKETS
-- ============================================

insert into storage.buckets (id, name, public) values ('uploads', 'uploads', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('faces', 'faces', true) on conflict (id) do nothing;

-- ============================================
-- 6. FUNCTIONS & TRIGGERS
-- ============================================

-- Function to handle new user registration
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  voter_record public.official_voter_lists%ROWTYPE;
  is_verified boolean := false;
  rejection_reason text := null;
  user_age int;
  user_dob text;
  user_father text;
begin
  user_age := nullif(new.raw_user_meta_data->>'age', '')::int;
  user_dob := new.raw_user_meta_data->>'dob';
  user_father := new.raw_user_meta_data->>'fatherName';

  if user_age < 18 then
    is_verified := false;
    rejection_reason := 'User is underage (must be 18+)';
  else
    select * into voter_record from public.official_voter_lists 
    where (aadhaar_number = new.raw_user_meta_data->>'aadhaarNumber' and aadhaar_number is not null)
       or (epic_number = new.raw_user_meta_data->>'epicNumber' and epic_number is not null)
    limit 1;

    if not found then
      is_verified := false;
      rejection_reason := 'Details not found in official voter records. Please check your Aadhaar/EPIC number.';
    else
      if voter_record.dob is distinct from user_dob then
        is_verified := false;
        rejection_reason := 'Date of Birth mismatch with official records.';
      elsif lower(trim(voter_record.father_name)) is distinct from lower(trim(user_father)) then
        is_verified := false;
        rejection_reason := 'Father Name mismatch with official records.';
      else
        is_verified := true;
        rejection_reason := null;
      end if;
    end if;
  end if;

  insert into public.profiles (
    id, email, first_name, last_name, father_name, role, age, dob, phone,
    address_state, address_district, address_city, id_number, id_type,
    kyc_doc_url, face_url, aadhaar_number, epic_number, epic_doc_url, photo_url,
    electoral_roll_verified, electoral_roll_match_id, verification_rejection_reason,
    verification_status, verification_stage, face_embeddings
  )
  values (
    new.id, new.email,
    new.raw_user_meta_data->>'firstName',
    new.raw_user_meta_data->>'lastName',
    new.raw_user_meta_data->>'fatherName',
    coalesce(new.raw_user_meta_data->>'role', 'VOTER'),
    user_age, user_dob,
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'state',
    new.raw_user_meta_data->>'district',
    new.raw_user_meta_data->>'city',
    new.raw_user_meta_data->>'idNumber',
    new.raw_user_meta_data->>'idType',
    new.raw_user_meta_data->>'kycDocUrl',
    new.raw_user_meta_data->>'faceUrl',
    new.raw_user_meta_data->>'aadhaarNumber',
    new.raw_user_meta_data->>'epicNumber',
    new.raw_user_meta_data->>'epicDocUrl',
    'https://ui-avatars.com/api/?name=' || coalesce(new.raw_user_meta_data->>'firstName', '') || '+' || coalesce(new.raw_user_meta_data->>'lastName', '') || '&background=random',
    is_verified,
    case when is_verified then voter_record.id else null end,
    rejection_reason,
    'NOT_STARTED',
    'PENDING_ELECTORAL',
    '[]'::jsonb
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

-- Trigger for Verification Status History
create or replace function public.log_verification_status_change()
returns trigger as $$
begin
  if (old.verification_status is distinct from new.verification_status) then
    insert into public.verification_status_history (
      profile_id, old_status, new_status, changed_at, reason
    ) values (
      new.id, old.verification_status, new.verification_status, now(), 'Database Level Log'
    );
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists tr_log_verification_status on public.profiles;
create trigger tr_log_verification_status after update of verification_status on public.profiles for each row execute function public.log_verification_status_change();

-- Trigger for Vote Integrity
create or replace function public.validate_vote_insertion()
returns trigger as $$
declare
  voter_record record;
begin
  select verification_status, deleted_at, electoral_roll_verified into voter_record from public.profiles where id = new.voter_id;
  if voter_record.verification_status != 'VERIFIED' then
    raise exception 'Voter is not verified. Current status: %', voter_record.verification_status;
  end if;
  if voter_record.deleted_at is not null then
    raise exception 'Voter record has been deleted/deactivated.';
  end if;
  if not voter_record.electoral_roll_verified then
    raise exception 'Voter is not present or verified in the official electoral roll.';
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists tr_validate_vote_insertion on public.votes;
create trigger tr_validate_vote_insertion before insert on public.votes for each row execute function public.validate_vote_insertion();

-- Election Status Synchronization Function
create or replace function public.update_election_statuses()
returns void as $$
begin
  update public.elections set status = 'ACTIVE' where status = 'UPCOMING' and now() between start_date and end_date;
  update public.elections set status = 'COMPLETED' where status in ('UPCOMING', 'ACTIVE') and now() > end_date;
end;
$$ language plpgsql security definer;

-- Audit Logging Function
create or replace function public.log_to_audit()
returns trigger as $$
begin
  insert into public.audit_logs (action_type, actor_id, target_type, target_id, new_values, timestamp)
  values (tg_op, auth.uid(), tg_table_name, new.id::text, to_jsonb(new), now());
  return new;
end;
$$ language plpgsql security definer;

-- ============================================
-- 7. HELPER FUNCTIONS FOR SECURITY
-- ============================================

create or replace function public.log_audit_event(
  p_action_type text, p_actor_id uuid, p_target_type text, p_target_id text,
  p_old_values jsonb default null, p_new_values jsonb default null, p_ip_address text default null
) returns uuid language plpgsql security definer as $$
declare v_audit_id uuid;
begin
  insert into public.audit_logs (action_type, actor_id, target_type, target_id, old_values, new_values, ip_address)
  values (p_action_type, p_actor_id, p_target_type, p_target_id, p_old_values, p_new_values, p_ip_address)
  returning id into v_audit_id;
  return v_audit_id;
end;
$$;

create or replace function public.is_voter_blocked_for_election(p_voter_id uuid, p_election_id text)
returns boolean language plpgsql security definer as $$
declare v_session public.voting_sessions%ROWTYPE; v_block_duration interval := interval '30 minutes';
begin
  select * into v_session from public.voting_sessions where voter_id = p_voter_id and election_id = p_election_id;
  if not found then return false; end if;
  if v_session.blocked_at is not null then
    if now() < v_session.blocked_at + v_block_duration then return true; end if;
  end if;
  return false;
end;
$$;

create or replace function public.record_voting_violation(p_voter_id uuid, p_election_id text, p_violation_reason text)
returns public.voting_sessions language plpgsql security definer as $$
declare v_session public.voting_sessions%ROWTYPE; v_max_violations int := 3;
begin
  select * into v_session from public.voting_sessions where voter_id = p_voter_id and election_id = p_election_id for update;
  if not found then
    insert into public.voting_sessions (voter_id, election_id, violation_count) values (p_voter_id, p_election_id, 1) returning * into v_session;
  else
    update public.voting_sessions
    set violation_count = violation_count + 1,
        blocked_at = case when violation_count + 1 >= v_max_violations then now() else blocked_at end,
        blocked_reason = case when violation_count + 1 >= v_max_violations then p_violation_reason else blocked_reason end
    where id = v_session.id returning * into v_session;
  end if;
  if v_session.violation_count >= v_max_violations then
    insert into public.fraud_alerts (voter_id, election_id, reason, risk_level, details)
    values (p_voter_id, p_election_id, 'SECURITY_VIOLATIONS', 'HIGH', 'Voter blocked after ' || v_session.violation_count || ' violations: ' || p_violation_reason);
  end if;
  return v_session;
end;
$$;

create or replace function public.record_face_verification_attempt(
  p_voter_id uuid, p_election_id text, p_success boolean, p_confidence_score decimal,
  p_distance decimal default null, p_failure_reason text default null, p_context text default 'VOTING'
) returns uuid language plpgsql security definer as $$
declare v_attempt_id uuid;
begin
  insert into public.face_verification_attempts (voter_id, election_id, success, confidence_score, distance, failure_reason, context)
  values (p_voter_id, p_election_id, p_success, p_confidence_score, p_distance, p_failure_reason, p_context)
  returning id into v_attempt_id;
  if not p_success and p_confidence_score < 50 then
    insert into public.fraud_alerts (voter_id, election_id, reason, risk_level, details)
    values (p_voter_id, p_election_id, 'FACE_VERIFICATION_FAILED', case when p_confidence_score < 30 then 'HIGH' else 'MEDIUM' end, 'Face verification failed with confidence: ' || p_confidence_score || '%. Reason: ' || coalesce(p_failure_reason, 'Unknown'));
  end if;
  return v_attempt_id;
end;
$$;

-- ============================================
-- 8. ROW LEVEL SECURITY
-- ============================================

alter table public.profiles enable row level security;
alter table public.elections enable row level security;
alter table public.candidates enable row level security;
alter table public.votes enable row level security;
alter table public.regions enable row level security;
alter table public.fraud_alerts enable row level security;
alter table public.official_voter_lists enable row level security;
alter table public.verification_status_history enable row level security;
alter table public.voting_sessions enable row level security;
alter table public.face_verification_attempts enable row level security;
alter table public.audit_logs enable row level security;
alter table public.city_aliases enable row level security;

-- Policies
create policy "Everyone can view profiles" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "Admins can update any profile" on public.profiles for update using (exists (select 1 from public.profiles where id = auth.uid() and role = 'ADMIN')) with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'ADMIN'));
create policy "Users can delete own profile" on public.profiles for delete using (auth.uid() = id);
create policy "Admins can delete any profile" on public.profiles for delete using (exists (select 1 from public.profiles where id = auth.uid() and role = 'ADMIN'));

create policy "Everyone can view elections" on public.elections for select using (true);
create policy "Admins manage elections" on public.elections for all using (auth.role() = 'authenticated');

create policy "Everyone can view candidates" on public.candidates for select using (true);
create policy "Admins manage candidates" on public.candidates for all using (auth.role() = 'authenticated');

create policy "Everyone can view votes" on public.votes for select using (true);
create policy "Authenticated users can vote" on public.votes for insert with check (auth.role() = 'authenticated');

create policy "Everyone can view regions" on public.regions for select using (true);
create policy "Admins manage regions" on public.regions for all using (auth.role() = 'authenticated');

create policy "Admins view alerts" on public.fraud_alerts for select using (true);
create policy "System inserts alerts" on public.fraud_alerts for insert with check (true);

create policy "Everyone can view official lists" on public.official_voter_lists for select using (true);
create policy "Authenticated users can manage official lists" on public.official_voter_lists for all using (auth.uid() is not null) with check (auth.uid() is not null);

create policy "Admins and owners view status history" on public.verification_status_history for select using (profile_id = auth.uid() or exists (select 1 from public.profiles where id = auth.uid() and role = 'ADMIN'));
create policy "System inserts status history" on public.verification_status_history for insert with check (true);

create policy "Users view own sessions" on public.voting_sessions for select using (voter_id = auth.uid() or exists (select 1 from public.profiles where id = auth.uid() and role = 'ADMIN'));
create policy "System manages sessions" on public.voting_sessions for all using (true) with check (true);

create policy "Users view own face attempts" on public.face_verification_attempts for select using (voter_id = auth.uid() or exists (select 1 from public.profiles where id = auth.uid() and role = 'ADMIN'));
create policy "System inserts face attempts" on public.face_verification_attempts for insert with check (true);

create policy "Admins view audit logs" on public.audit_logs for select using (exists (select 1 from public.profiles where id = auth.uid() and role = 'ADMIN'));
create policy "System inserts audit logs" on public.audit_logs for insert with check (true);

create policy "Everyone view city aliases" on public.city_aliases for select using (true);

-- Storage Policies
create policy "Public Access Uploads" on storage.objects for select using (bucket_id = 'uploads');
create policy "Any Authenticated Uploads" on storage.objects for insert with check (bucket_id = 'uploads' and auth.role() = 'authenticated');
create policy "Anon Uploads" on storage.objects for insert with check (bucket_id = 'uploads');

create policy "Public Access Faces" on storage.objects for select using (bucket_id = 'faces');
create policy "Any Authenticated Faces" on storage.objects for insert with check (bucket_id = 'faces' and auth.role() = 'authenticated');
create policy "Anon Faces" on storage.objects for insert with check (bucket_id = 'faces');

-- ============================================
-- 9. REALTIME
-- ============================================

do $$
begin
  begin alter publication supabase_realtime add table public.profiles; exception when others then null; end;
  begin alter publication supabase_realtime add table public.elections; exception when others then null; end;
  begin alter publication supabase_realtime add table public.candidates; exception when others then null; end;
  begin alter publication supabase_realtime add table public.votes; exception when others then null; end;
  begin alter publication supabase_realtime add table public.regions; exception when others then null; end;
  begin alter publication supabase_realtime add table public.fraud_alerts; exception when others then null; end;
  begin alter publication supabase_realtime add table public.voting_sessions; exception when others then null; end;
  begin alter publication supabase_realtime add table public.face_verification_attempts; exception when others then null; end;
end $$;

-- ============================================
-- 10. PERMISSIONS
-- ============================================

grant select, insert on public.verification_status_history to authenticated;
grant select, insert, update on public.voting_sessions to authenticated;
grant select, insert on public.face_verification_attempts to authenticated;
grant select, insert on public.audit_logs to authenticated;
grant select on public.city_aliases to authenticated, anon;

grant execute on function public.log_audit_event to authenticated;
grant execute on function public.is_voter_blocked_for_election to authenticated;
grant execute on function public.record_voting_violation to authenticated;
grant execute on function public.record_face_verification_attempt to authenticated;
