import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lphgxslwytubrtjdtahz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwaGd4c2x3eXR1YnJ0amR0YWh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwNzk4MzMsImV4cCI6MjA3MzY1NTgzM30.AsLETVUSzbeTM4uKnI-w44d5-1eCU7OatifBx7vMoAo';

// Voter Supabase client - uses 'voter' storage key
export const supabaseVoter = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storageKey: 'supabase.auth.voter', // Separate storage for voters
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Admin Supabase client - uses 'admin' storage key
export const supabaseAdmin = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storageKey: 'supabase.auth.admin', // Separate storage for admins
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Default export for backward compatibility (uses voter client)
export const supabase = supabaseVoter;

export const isSupabaseConfigured = () => {
  return true;
};

// Helper to get the correct client based on role
export const getSupabaseClient = (role?: 'VOTER' | 'ADMIN') => {
  if (role === 'ADMIN') {
    return supabaseAdmin;
  }
  return supabaseVoter;
};
