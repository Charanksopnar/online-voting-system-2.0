
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Candidate, Election, VoteTransaction, UserRole, VerificationStatus, FraudAlert, Region, OfficialVoter } from '../types';
import { supabase } from '../supabase';
import { useNotification } from './NotificationContext';

interface RealtimeContextType {
  voters: User[];
  candidates: Candidate[];
  elections: Election[];
  votes: VoteTransaction[];
  fraudAlerts: FraudAlert[];
  regions: Region[];
  officialVoters: OfficialVoter[];

  // Actions
  registerVoter: (voter: User) => void;
  updateVoterStatus: (id: string, status: VerificationStatus) => void;
  blockVoter: (id: string, reason: string) => void;
  unblockVoter: (id: string) => void;
  deleteVoter: (id: string) => void;

  addCandidate: (candidate: Candidate) => void;
  deleteCandidate: (id: string) => void;

  addElection: (election: Election) => void;
  stopElection: (id: string) => void;
  updateCandidate: (id: string, updates: Partial<Candidate>) => Promise<void>;

  castVote: (electionId: string, candidateId: string, voterId: string, riskScore?: number) => void;
  reportFraud: (alert: FraudAlert) => void;

  addRegion: (region: Region) => void;

  // Official Voter Lists
  addOfficialVoters: (voters: OfficialVoter[]) => Promise<void>;
  deleteOfficialVoter: (id: string) => Promise<void>;
  updateOfficialVoter: (voter: OfficialVoter) => Promise<void>;
  crossVerifyElectoralRoll: (userId: string, matchId: string) => Promise<void>;
  requestManualVerification: (userId: string) => Promise<void>;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (!context) throw new Error('useRealtime must be used within a RealtimeProvider');
  return context;
};

export const RealtimeProvider = ({ children }: { children: ReactNode }) => {
  const { addNotification } = useNotification();

  const [voters, setVoters] = useState<User[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [elections, setElections] = useState<Election[]>([]);
  const [votes, setVotes] = useState<VoteTransaction[]>([]);
  const [fraudAlerts, setFraudAlerts] = useState<FraudAlert[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [officialVoters, setOfficialVoters] = useState<OfficialVoter[]>([]);

  // --- DATA MAPPING HELPERS ---
  const mapProfileToUser = (p: any): User => ({
    id: p.id,
    email: p.email,
    firstName: p.first_name,
    lastName: p.last_name,
    role: p.role,
    verificationStatus: p.verification_status,
    isBlocked: p.is_blocked,
    blockReason: p.block_reason,
    photoUrl: p.photo_url,
    faceUrl: p.face_url,
    faceEmbeddings: p.face_embeddings, // JSONB array from database
    livenessVerified: p.liveness_verified,
    age: p.age,
    dob: p.dob,
    phone: p.phone,
    address: { state: p.address_state, district: p.address_district, city: p.address_city },
    idNumber: p.id_number,
    idType: p.id_type,
    kycDocUrl: p.kyc_doc_url,

    // New Fields
    aadhaarNumber: p.aadhaar_number,
    epicNumber: p.epic_number,
    epicDocUrl: p.epic_doc_url,

    // Electoral Roll Verification
    electoralRollVerified: p.electoral_roll_verified,
    electoralRollMatchId: p.electoral_roll_match_id,
    manualVerifyRequested: p.manual_verify_requested,
    manualVerifyRequestedAt: p.manual_verify_requested_at,

    created_at: p.created_at
  });

  // Helper to compute correct election status based on current time
  const computeElectionStatus = (startDate: string, endDate: string, currentStatus: string): 'UPCOMING' | 'ACTIVE' | 'ENDED' => {
    if (currentStatus === 'ENDED') return 'ENDED'; // Manual stop takes precedence
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (now >= end) return 'ENDED';
    if (now >= start) return 'ACTIVE';
    return 'UPCOMING';
  };

  const mapElection = (e: any): Election => {
    const computedStatus = computeElectionStatus(e.start_date, e.end_date, e.status);
    return {
      id: e.id,
      title: e.title,
      description: e.description,
      startDate: e.start_date,
      endDate: e.end_date,
      status: computedStatus,
      region: e.region,
      regionState: e.region_state,
      regionDistrict: e.region_district,
      candidates: []
    };
  };

  const mapCandidate = (c: any): Candidate => ({
    id: c.id,
    electionId: c.election_id,
    name: c.name,
    party: c.party,
    partySymbolUrl: c.party_symbol_url,
    photoUrl: c.photo_url,
    manifesto: c.manifesto,
    age: c.age,
    votes: c.votes_count,
    state: c.state,
    district: c.district
  });

  const mapVote = (v: any): VoteTransaction => ({
    id: v.id,
    electionId: v.election_id,
    candidateId: v.candidate_id,
    voterId: v.voter_id,
    timestamp: v.created_at,
    blockHash: v.block_hash,
    riskScore: v.risk_score
  });

  const mapRegion = (r: any): Region => ({
    id: r.id,
    name: r.name,
    type: r.type,
    parentRegionId: r.parent_region_id,
    voterCount: r.voter_count
  });

  const mapOfficialVoter = (o: any): OfficialVoter => ({
    id: o.id,
    aadhaarNumber: o.aadhaar_number,
    epicNumber: o.epic_number,
    fullName: o.full_name,
    fatherName: o.father_name,
    age: o.age,
    gender: o.gender,
    state: o.address_state,
    district: o.address_district,
    city: o.address_city,
    pollingBooth: o.polling_booth,
    dob: o.dob,
    fullAddress: o.full_address,
    createdAt: o.created_at
  });

  // --- INITIAL FETCH & SUBSCRIPTION ---
  useEffect(() => {
    // 1. Fetch initial data
    const fetchData = async () => {
      const { data: pData } = await supabase.from('profiles').select('*');
      if (pData) setVoters(pData.map(mapProfileToUser));

      const { data: eData } = await supabase.from('elections').select('*');
      if (eData) setElections(eData.map(mapElection));

      const { data: cData } = await supabase.from('candidates').select('*');
      if (cData) setCandidates(cData.map(mapCandidate));

      const { data: vData } = await supabase.from('votes').select('*');
      if (vData) setVotes(vData.map(mapVote));

      const { data: rData } = await supabase.from('regions').select('*');
      if (rData) setRegions(rData.map(mapRegion));

      const { data: fData } = await supabase.from('fraud_alerts').select('*');
      if (fData) setFraudAlerts(fData.map(f => ({
        id: f.id,
        voterId: f.voter_id,
        electionId: f.election_id,
        timestamp: f.timestamp,
        reason: f.reason,
        riskLevel: f.risk_level,
        details: f.details
      })));

      const { data: oData } = await supabase.from('official_voter_lists').select('*');
      if (oData) setOfficialVoters(oData.map(mapOfficialVoter));
    };
    fetchData();

    // 2. Realtime Subscriptions
    const channel = supabase.channel('db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, payload => {
        if (payload.eventType === 'INSERT') setVoters(prev => [...prev, mapProfileToUser(payload.new)]);
        if (payload.eventType === 'UPDATE') setVoters(prev => prev.map(v => v.id === payload.new.id ? mapProfileToUser(payload.new) : v));
        if (payload.eventType === 'DELETE') setVoters(prev => prev.filter(v => v.id !== payload.old.id));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'elections' }, payload => {
        if (payload.eventType === 'INSERT') setElections(prev => [...prev, mapElection(payload.new)]);
        if (payload.eventType === 'UPDATE') setElections(prev => prev.map(e => e.id === payload.new.id ? mapElection(payload.new) : e));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'candidates' }, payload => {
        if (payload.eventType === 'INSERT') setCandidates(prev => [...prev, mapCandidate(payload.new)]);
        if (payload.eventType === 'UPDATE') setCandidates(prev => prev.map(c => c.id === payload.new.id ? mapCandidate(payload.new) : c));
        if (payload.eventType === 'DELETE') setCandidates(prev => prev.filter(c => c.id !== payload.old.id));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'votes' }, payload => {
        if (payload.eventType === 'INSERT') {
          const newVote = mapVote(payload.new);
          setVotes(prev => [...prev, newVote]);
          setCandidates(prev => prev.map(c => c.id === newVote.candidateId ? { ...c, votes: c.votes + 1 } : c));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'official_voter_lists' }, payload => {
        if (payload.eventType === 'INSERT') setOfficialVoters(prev => [...prev, mapOfficialVoter(payload.new)]);
        if (payload.eventType === 'UPDATE') setOfficialVoters(prev => prev.map(o => o.id === payload.new.id ? mapOfficialVoter(payload.new) : o));
        if (payload.eventType === 'DELETE') setOfficialVoters(prev => prev.filter(o => o.id !== payload.old.id));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // --- DERIVED STATE ---
  useEffect(() => {
    setElections(prev => prev.map(e => ({
      ...e,
      candidates: candidates.filter(c => c.electionId === e.id)
    })));
  }, [candidates]);

  // --- PERIODIC ELECTION STATUS UPDATE ---
  useEffect(() => {
    const updateElectionStatuses = async () => {
      const updates: { id: string; newStatus: 'UPCOMING' | 'ACTIVE' | 'ENDED' }[] = [];

      setElections(prev => prev.map(e => {
        const computedStatus = computeElectionStatus(e.startDate, e.endDate, e.status);
        if (computedStatus !== e.status) {
          updates.push({ id: e.id, newStatus: computedStatus });
          return { ...e, status: computedStatus };
        }
        return e;
      }));

      // Sync changed statuses to database
      for (const update of updates) {
        await supabase.from('elections').update({ status: update.newStatus }).eq('id', update.id);
      }
    };

    // Initial check
    updateElectionStatuses();

    // Periodic check every 30 seconds
    const interval = setInterval(updateElectionStatuses, 30000);

    return () => clearInterval(interval);
  }, [elections.length]);

  // --- ACTIONS ---

  const registerVoter = async (voter: User) => { };

  const updateVoterStatus = async (id: string, status: VerificationStatus) => {
    setVoters(prev => prev.map(v => v.id === id ? { ...v, verificationStatus: status } : v));
    const { error } = await supabase.from('profiles').update({ verification_status: status }).eq('id', id);
    if (error) addNotification('ERROR', 'Update Failed', error.message);
  };

  const blockVoter = async (id: string, reason: string) => {
    setVoters(prev => prev.map(v => v.id === id ? { ...v, isBlocked: true, blockReason: reason } : v));
    const { error } = await supabase.from('profiles').update({ is_blocked: true, block_reason: reason }).eq('id', id);
    if (error) addNotification('ERROR', 'Block Failed', error.message);
  };

  const unblockVoter = async (id: string) => {
    setVoters(prev => prev.map(v => v.id === id ? { ...v, isBlocked: false, blockReason: undefined } : v));
    const { error } = await supabase.from('profiles').update({ is_blocked: false, block_reason: null }).eq('id', id);
    if (error) addNotification('ERROR', 'Unblock Failed', error.message);
  };

  const deleteVoter = async (id: string) => {
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (error) addNotification('ERROR', 'Delete Failed', error.message);
  };

  const addCandidate = async (candidate: Candidate) => {
    const { error } = await supabase.from('candidates').insert([{
      id: candidate.id,
      election_id: candidate.electionId,
      name: candidate.name,
      party: candidate.party,
      party_symbol_url: candidate.partySymbolUrl,
      photo_url: candidate.photoUrl,
      manifesto: candidate.manifesto,
      age: candidate.age,
      votes_count: 0,
      state: candidate.state,
      district: candidate.district
    }]);
    if (error) addNotification('ERROR', 'Candidate Add Failed', error.message);
  };

  const deleteCandidate = async (id: string) => {
    const { error } = await supabase.from('candidates').delete().eq('id', id);
    if (error) addNotification('ERROR', 'Delete Failed', error.message);
  };

  const updateCandidate = async (id: string, updates: Partial<Candidate>) => {
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.party !== undefined) dbUpdates.party = updates.party;
    if (updates.age !== undefined) dbUpdates.age = updates.age;
    if (updates.manifesto !== undefined) dbUpdates.manifesto = updates.manifesto;
    if (updates.photoUrl !== undefined) dbUpdates.photo_url = updates.photoUrl;
    if (updates.partySymbolUrl !== undefined) dbUpdates.party_symbol_url = updates.partySymbolUrl;
    if (updates.state !== undefined) dbUpdates.state = updates.state;
    if (updates.district !== undefined) dbUpdates.district = updates.district;
    if (updates.electionId !== undefined) dbUpdates.election_id = updates.electionId;

    setCandidates(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    const { error } = await supabase.from('candidates').update(dbUpdates).eq('id', id);
    if (error) {
      addNotification('ERROR', 'Update Failed', error.message);
    } else {
      addNotification('SUCCESS', 'Candidate Updated', 'Changes saved successfully.');
    }
  };

  const addElection = async (election: Election) => {
    const { error } = await supabase.from('elections').insert([{
      id: election.id,
      title: election.title,
      description: election.description,
      start_date: election.startDate,
      end_date: election.endDate,
      status: election.status,
      region: election.region,
      region_state: election.regionState,
      region_district: election.regionDistrict
    }]);
    if (error) addNotification('ERROR', 'Election Create Failed', error.message);
  };

  const stopElection = async (id: string) => {
    setElections(prev => prev.map(e => e.id === id ? { ...e, status: 'ENDED' } : e));
    const { error } = await supabase.from('elections').update({ status: 'ENDED' }).eq('id', id);
    if (error) addNotification('ERROR', 'Stop Failed', error.message);
  };

  const castVote = async (electionId: string, candidateId: string, voterId: string, riskScore = 0) => {
    const existing = votes.find(v => v.electionId === electionId && v.voterId === voterId);
    if (existing) {
      addNotification('ERROR', 'Action Blocked', 'You have already voted in this election.');
      return;
    }

    const { error } = await supabase.from('votes').insert([{
      election_id: electionId,
      candidate_id: candidateId,
      voter_id: voterId,
      block_hash: Math.random().toString(36).substring(2) + Date.now().toString(36),
      risk_score: riskScore
    }]);

    if (error) {
      addNotification('ERROR', 'Vote Failed', error.message);
    } else {
      const candidate = candidates.find(c => c.id === candidateId);
      if (candidate) {
        await supabase.from('candidates').update({ votes_count: candidate.votes + 1 }).eq('id', candidateId);
      }
    }
  };

  const reportFraud = async (alert: FraudAlert) => {
    await supabase.from('fraud_alerts').insert([{
      voter_id: alert.voterId,
      election_id: alert.electionId,
      reason: alert.reason,
      risk_level: alert.riskLevel,
      details: alert.details
    }]);
  };

  const addRegion = async (region: Region) => {
    await supabase.from('regions').insert([{
      name: region.name,
      type: region.type,
      parent_region_id: region.parentRegionId || null
    }]);
  };

  // --- OFFICIAL VOTER LISTS ACTIONS ---

  const addOfficialVoters = async (votersData: OfficialVoter[]) => {
    const insertData = votersData.map(v => ({
      aadhaar_number: v.aadhaarNumber,
      epic_number: v.epicNumber,
      full_name: v.fullName,
      father_name: v.fatherName,
      age: v.age,
      gender: v.gender,
      address_state: v.state,
      address_district: v.district,
      address_city: v.city,
      polling_booth: v.pollingBooth,
      dob: v.dob,
      full_address: v.fullAddress
    }));
    const { error } = await supabase.from('official_voter_lists').insert(insertData);
    if (error) addNotification('ERROR', 'Upload Failed', error.message);
    else addNotification('SUCCESS', 'Upload Complete', `${votersData.length} official voter records added.`);
  };

  const deleteOfficialVoter = async (id: string) => {
    const { error } = await supabase.from('official_voter_lists').delete().eq('id', id);
    if (error) addNotification('ERROR', 'Delete Failed', error.message);
  };

  const updateOfficialVoter = async (voter: OfficialVoter) => {
    const { error } = await supabase.from('official_voter_lists').update({
      aadhaar_number: voter.aadhaarNumber,
      epic_number: voter.epicNumber,
      full_name: voter.fullName,
      father_name: voter.fatherName,
      age: voter.age,
      gender: voter.gender,
      address_state: voter.state,
      address_district: voter.district,
      address_city: voter.city,
      polling_booth: voter.pollingBooth,
      dob: voter.dob,
      full_address: voter.fullAddress
    }).eq('id', voter.id);
    if (error) addNotification('ERROR', 'Update Failed', error.message);
    else addNotification('SUCCESS', 'Updated', 'Official voter record updated.');
  };

  const crossVerifyElectoralRoll = async (userId: string, matchId: string) => {
    setVoters(prev => prev.map(v => v.id === userId ? { ...v, electoralRollVerified: true, electoralRollMatchId: matchId, manualVerifyRequested: false } : v));
    const { error } = await supabase.from('profiles').update({
      electoral_roll_verified: true,
      electoral_roll_match_id: matchId,
      manual_verify_requested: false
    }).eq('id', userId);
    if (error) addNotification('ERROR', 'Verification Failed', error.message);
    else addNotification('SUCCESS', 'Verified', 'User is now verified against electoral roll.');
  };

  const requestManualVerification = async (userId: string) => {
    setVoters(prev => prev.map(v => v.id === userId ? { ...v, manualVerifyRequested: true, manualVerifyRequestedAt: new Date().toISOString() } : v));
    const { error } = await supabase.from('profiles').update({
      manual_verify_requested: true,
      manual_verify_requested_at: new Date().toISOString()
    }).eq('id', userId);
    if (error) addNotification('ERROR', 'Request Failed', error.message);
    else addNotification('INFO', 'Request Sent', 'Manual verification request sent to admin.');
  };

  return (
    <RealtimeContext.Provider value={{
      voters, candidates, elections, votes, fraudAlerts, regions, officialVoters,
      registerVoter, updateVoterStatus, blockVoter, unblockVoter, deleteVoter,
      addCandidate, deleteCandidate, updateCandidate, addElection, stopElection, castVote, reportFraud, addRegion,
      addOfficialVoters, deleteOfficialVoter, updateOfficialVoter, crossVerifyElectoralRoll, requestManualVerification
    }}>
      {children}
    </RealtimeContext.Provider>
  );
};
