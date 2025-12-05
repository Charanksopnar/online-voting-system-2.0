export enum UserRole {
  VOTER = 'VOTER',
  ADMIN = 'ADMIN'
}

export enum VerificationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  NOT_STARTED = 'NOT_STARTED'
}

export interface Address {
  state: string;
  district: string;
  city: string;
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  photoUrl?: string; // Display photo
  faceUrl?: string; // Biometric reference photo
  verificationStatus: VerificationStatus;
  isBlocked: boolean;
  blockReason?: string;
  age?: number;
  dob?: string;
  phone?: string;
  address?: Address;

  // ID Details
  idNumber?: string; // Primary ID Number (Legacy/Fallback)
  idType?: 'AADHAAR' | 'VOTER_ID'; // Primary ID Type (Legacy/Fallback)
  kycDocUrl?: string; // Primary Doc URL (Aadhaar)

  // Specific Fields
  aadhaarNumber?: string;
  epicNumber?: string;
  epicDocUrl?: string; // Secondary Doc URL (Voter ID)

  created_at?: string;
}

export interface Election {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  status: 'UPCOMING' | 'ACTIVE' | 'ENDED';
  candidates: Candidate[];
  region?: string;
}

export interface Candidate {
  id: string;
  name: string;
  party: string;
  partySymbolUrl: string; // Placeholder image URL
  photoUrl?: string; // Candidate profile photo
  manifesto: string;
  votes: number;
  age?: number;
  electionId?: string;
}

export interface Notification {
  id: string;
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export interface VoteTransaction {
  id: string;
  electionId: string;
  voterId: string;
  candidateId: string;
  timestamp: string;
  blockHash: string; // Simulating blockchain hash
  riskScore?: number;
}

export interface FraudAlert {
  id: string;
  voterId: string;
  electionId: string;
  timestamp: string;
  reason: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  details: string;
}

export interface Region {
  id: string;
  name: string;
  type: 'STATE' | 'DISTRICT' | 'CONSTITUENCY';
  parentRegionId?: string;
  voterCount: number;
}

// SQL Schema Reference included in supabase_schema.sql