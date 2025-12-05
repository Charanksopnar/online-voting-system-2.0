import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole, VerificationStatus } from '../types';
import { useNotification } from './NotificationContext';
import { supabase } from '../supabase';

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

  created_at: profile.created_at
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { addNotification } = useNotification();

  useEffect(() => {
    // Check active session on mount
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (profile) {
            setUser(mapProfileToUser(profile));
          }
        }
      } catch (error) {
        console.error('Session check failed', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
      } else if (event === 'SIGNED_IN' && session?.user) {
         // Allow a small delay for trigger to create profile if this is a fresh signup
         setTimeout(async () => {
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();
            if (profile) setUser(mapProfileToUser(profile));
         }, 500);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Listen for Realtime Profile Updates (e.g. Verification Approved by Admin)
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase.channel(`public:profiles:id=eq.${user.id}`)
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
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, addNotification]);

  const signIn = async (email: string, password: string, role: UserRole) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password
      });

      if (error) throw error;
      if (!data.user) throw new Error('No user found');

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError || !profile) throw new Error('Profile not found. Please contact support.');

      if (profile.role !== role) {
        await supabase.auth.signOut();
        throw new Error(`Unauthorized. This account is not registered as a ${role}.`);
      }

      if (profile.is_blocked) {
         await supabase.auth.signOut();
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
      
      if (!details.password) {
          throw new Error("Password is required for signup");
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
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
    await supabase.auth.signOut();
    setUser(null);
    addNotification('INFO', 'Signed Out', 'See you next time!');
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};