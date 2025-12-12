import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole, VerificationStatus } from '../types';
import { useNotification } from './NotificationContext';
import { supabaseVoter, supabaseAdmin, getSupabaseClient } from '../supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string, role: UserRole) => Promise<void>;
  signUp: (email: string, firstName: string, lastName: string, details: any) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

// Helper to map DB profile to User object
const mapProfileToUser = (profile: any): User => ({
  id: profile.id,
  email: profile.email,
  firstName: profile.first_name,
  lastName: profile.last_name,
  role: profile.role as UserRole,
  verificationStatus: profile.verification_status as VerificationStatus,
  isBlocked: profile.is_blocked,
  blockReason: profile.block_reason,
  photoUrl: profile.photo_url,
  faceUrl: profile.face_url,
  faceEmbeddings: profile.face_embeddings, // JSONB array from database
  livenessVerified: profile.liveness_verified,
  age: profile.age,
  dob: profile.dob,
  phone: profile.phone,
  address: {
    state: profile.address_state,
    district: profile.address_district,
    city: profile.address_city
  },
  idNumber: profile.id_number,
  idType: profile.id_type,
  kycDocUrl: profile.kyc_doc_url,

  // New Fields
  aadhaarNumber: profile.aadhaar_number,
  epicNumber: profile.epic_number,
  epicDocUrl: profile.epic_doc_url,

  // Electoral Roll Verification
  electoralRollVerified: profile.electoral_roll_verified,
  electoralRollMatchId: profile.electoral_roll_match_id,
  manualVerifyRequested: profile.manual_verify_requested,
  manualVerifyRequestedAt: profile.manual_verify_requested_at,

  created_at: profile.created_at
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { addNotification } = useNotification();

  // Use ref to track user state in async listeners without stale closures
  const userRef = React.useRef<User | null>(null);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    // Check active sessions on mount - priority: voter first, then admin
    const checkSessions = async () => {
      try {
        // Priority 1: Check voter session
        const { data: { session: voterSession } } = await supabaseVoter.auth.getSession();
        if (voterSession?.user) {
          const { data: profile, error: profileError } = await supabaseVoter
            .from('profiles')
            .select('*')
            .eq('id', voterSession.user.id)
            .single();

          if (!profileError && profile?.role === 'VOTER') {
            setUser(mapProfileToUser(profile));
            setLoading(false);
            return; // ✅ Found valid voter session, stop checking
          }
        }

        // Priority 2: Check admin session (only if no voter session found)
        const { data: { session: adminSession } } = await supabaseAdmin.auth.getSession();
        if (adminSession?.user) {
          const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', adminSession.user.id)
            .single();

          if (!profileError && profile?.role === 'ADMIN') {
            setUser(mapProfileToUser(profile));
            setLoading(false);
            return; // ✅ Found valid admin session
          }
        }

        // No valid session found
        setLoading(false);
      } catch (error) {
        console.error('Session check failed:', error);
        setLoading(false);
      }
    };

    checkSessions();

    // Listen for auth changes on voter client
    const voterSubscription = supabaseVoter.auth.onAuthStateChange(async (event, session) => {
      console.log('[Voter Auth Event]:', event, session?.user?.id);

      if (event === 'SIGNED_OUT') {
        // Only clear user if current user is a voter
        setUser(prev => {
          if (prev?.role === 'VOTER') {
            console.log('[Voter] Signing out voter user');
            return null;
          }
          return prev;
        });
      } else if (event === 'SIGNED_IN' && session?.user) {
        // Fetch profile immediately (no setTimeout to avoid race conditions)
        try {
          const { data: profile, error: profileError } = await supabaseVoter
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (!profileError && profile?.role === 'VOTER') {
            console.log('[Voter] Setting voter user:', profile.email);
            setUser(mapProfileToUser(profile));
          }
        } catch (error) {
          console.error('[Voter] Failed to fetch profile:', error);
        }
      }
      // Ignore TOKEN_REFRESHED and other events to prevent cross-tab interference
    });

    const adminSubscription = supabaseAdmin.auth.onAuthStateChange(async (event, session) => {
      console.log('[Admin Auth Event]:', event, session?.user?.id);

      if (event === 'SIGNED_OUT') {
        // Only clear user if current user is an admin
        setUser(prev => {
          if (prev?.role === 'ADMIN') {
            console.log('[Admin] Signing out admin user');
            return null;
          }
          return prev;
        });
      } else if (event === 'SIGNED_IN' && session?.user) {
        // Fetch profile immediately (no setTimeout to avoid race conditions)
        try {
          const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (!profileError && profile?.role === 'ADMIN') {
            console.log('[Admin] Setting admin user:', profile.email);
            setUser(mapProfileToUser(profile));
          }
        } catch (error) {
          console.error('[Admin] Failed to fetch profile:', error);
        }
      }
      // Ignore TOKEN_REFRESHED and other events to prevent cross-tab interference
    });

    return () => {
      voterSubscription.data.subscription.unsubscribe();
      adminSubscription.data.subscription.unsubscribe();
    };
  }, []);

  // Listen for Realtime Profile Updates (e.g. Verification Approved by Admin)
  useEffect(() => {
    if (!user?.id) return;

    // Use the correct client based on user role
    const client = user.role === 'ADMIN' ? supabaseAdmin : supabaseVoter;

    const channel = client.channel(`public:profiles:id=eq.${user.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${user.id}`
      }, (payload) => {
        // Update user state immediately with new profile data
        setUser(mapProfileToUser(payload.new));

        // Notify user of status changes
        if (payload.new.verification_status !== payload.old.verification_status) {
          if (payload.new.verification_status === 'VERIFIED') {
            addNotification('SUCCESS', 'Identity Verified', 'You are now eligible to vote!');
          } else if (payload.new.verification_status === 'REJECTED') {
            addNotification('ERROR', 'Verification Rejected', 'Please contact support.');
          }
        }

        if (payload.new.is_blocked && !payload.old.is_blocked) {
          addNotification('ERROR', 'Account Blocked', payload.new.block_reason || 'Contact Admin');
        }

        // Electoral roll verification status change
        if (payload.new.electoral_roll_verified && !payload.old.electoral_roll_verified) {
          addNotification('SUCCESS', 'Electoral Roll Verified', 'Your details have been verified against the official voter list. You can now vote!');
        }
      })
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [user?.id, user?.role, addNotification]);

  const signIn = async (email: string, password: string, role: UserRole) => {
    setLoading(true);
    try {
      // Use the correct client based on role
      const client = getSupabaseClient(role);

      const { data, error } = await client.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password
      });

      if (error) throw error;
      if (!data.user) throw new Error('No user found');

      const { data: profile, error: profileError } = await client
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError || !profile) throw new Error('Profile not found. Please contact support.');

      if (profile.role !== role) {
        await client.auth.signOut();
        throw new Error(`Unauthorized. This account is not registered as a ${role}.`);
      }

      if (profile.is_blocked) {
        await client.auth.signOut();
        throw new Error(`Account Blocked: ${profile.block_reason}`);
      }

      setUser(mapProfileToUser(profile));
      addNotification('SUCCESS', 'Welcome back', `Logged in as ${profile.first_name}`);
    } catch (error: any) {
      console.error("Login error:", error);
      const msg = error.message === "Invalid login credentials"
        ? "Invalid email or password."
        : error.message;
      addNotification('ERROR', 'Login Failed', msg);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, firstName: string, lastName: string, details: any) => {
    setLoading(true);
    try {
      const role = email.toLowerCase().includes('admin') ? UserRole.ADMIN : UserRole.VOTER;
      const client = getSupabaseClient(role);

      if (!details.password) {
        throw new Error("Password is required for signup");
      }

      const { data: authData, error: authError } = await client.auth.signUp({
        email: email.trim().toLowerCase(),
        password: details.password,
        options: {
          data: {
            firstName,
            lastName,
            role,
            age: details.age,
            dob: details.dob,
            phone: details.phone,
            state: details.state,
            district: details.district,
            city: details.city,
            idNumber: details.idNumber,
            idType: details.idType,
            kycDocUrl: details.kycDocUrl,
            faceUrl: details.faceUrl,
            // New Fields passed to metadata
            aadhaarNumber: details.aadhaarNumber,
            epicNumber: details.epicNumber,
            epicDocUrl: details.epicDocUrl
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Signup failed to return user');

      addNotification('SUCCESS', 'Account Created', role === UserRole.ADMIN ? 'Admin access granted.' : 'Please verify your email if required.');
    } catch (error: any) {
      console.error(error);
      addNotification('ERROR', 'Signup Failed', error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    if (!user) return;

    // Sign out from the correct client based on current user role
    const client = user.role === 'ADMIN' ? supabaseAdmin : supabaseVoter;
    await client.auth.signOut();
    setUser(null);
    addNotification('INFO', 'Signed Out', 'See you next time!');
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};