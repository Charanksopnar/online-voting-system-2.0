import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lphgxslwytubrtjdtahz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwaGd4c2x3eXR1YnJ0amR0YWh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwNzk4MzMsImV4cCI6MjA3MzY1NTgzM30.AsLETVUSzbeTM4uKnI-w44d5-1eCU7OatifBx7vMoAo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const isSupabaseConfigured = () => {
  return true;
};
