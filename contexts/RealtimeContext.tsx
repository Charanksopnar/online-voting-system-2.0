
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Candidate, Election, VoteTransaction, UserRole, VerificationStatus, FraudAlert, Region } from '../types';
import { supabase } from '../supabase';
import { useNotification } from './NotificationContext';

interface RealtimeContextType {
  voters: User[];
  candidates: Candidate[];
  elections: Election[];
  votes: VoteTransaction[];
  fraudAlerts: FraudAlert[];
  regions: Region[];

  // Actions
  registerVoter: (voter: User) => void;
  updateVoterStatus: (id: string, status: VerificationStatus) => void;
  blockVoter: (id: string, reason: string) => void;
  unblockVoter: (id: string) => void;
  deleteVoter: (id: string) => void;

  addCandidate: (candidate: Candidate) => void;
  deleteCandidate: (id: string) => void;

  addElection: (election: Election) => void;
  stopElection: (id: string) => void; // New

  castVote: (electionId: string, candidateId: string, voterId: string, riskScore?: number) => void;
  reportFraud: (alert: FraudAlert) => void;

  addRegion: (region: Region) => void;
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

    created_at: p.created_at
  });

  const mapElection = (e: any): Election => ({
    id: e.id,
    title: e.title,
    description: e.description,
    startDate: e.start_date,
    endDate: e.end_date,
    status: e.status,
    region: e.region,
    candidates: []
  });

  const mapCandidate = (c: any): Candidate => ({
    id: c.id,
    electionId: c.election_id,
    name: c.name,
    party: c.party,
    partySymbolUrl: c.party_symbol_url,
    photoUrl: c.photo_url,
    manifesto: c.manifesto,
    age: c.age,
    votes: c.votes_count
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
      votes_count: 0
    }]);
    if (error) addNotification('ERROR', 'Candidate Add Failed', error.message);
  };

  const deleteCandidate = async (id: string) => {
    const { error } = await supabase.from('candidates').delete().eq('id', id);
    if (error) addNotification('ERROR', 'Delete Failed', error.message);
  };

  const addElection = async (election: Election) => {
    const { error } = await supabase.from('elections').insert([{
      id: election.id,
      title: election.title,
      description: election.description,
      start_date: election.startDate,
      end_date: election.endDate,
      status: election.status,
      region: election.region
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

  return (
    <RealtimeContext.Provider value={{
      voters, candidates, elections, votes, fraudAlerts, regions,
      registerVoter, updateVoterStatus, blockVoter, unblockVoter, deleteVoter,
      addCandidate, deleteCandidate, addElection, stopElection, castVote, reportFraud, addRegion
    }}>
      {children}
    </RealtimeContext.Provider>
  );
};
