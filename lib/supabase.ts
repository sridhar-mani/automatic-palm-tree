// lib/supabase.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

// TODO: Replace these with your real Supabase project values or use secure env vars
const SUPABASE_URL = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export type SupabaseJob = {
  id: string;
  title: string;
  company_name: string;
  company_verified?: boolean;
  description?: string;
  required_skills?: string[];
  city: string;
  state: string;
  latitude?: number | null;
  longitude?: number | null;
  is_remote?: boolean;
  hybrid_ok?: boolean;
  salary_min?: number | null;
  salary_max?: number | null;
  salary_currency?: string | null;
  experience_min?: number | null;
  experience_max?: number | null;
  application_type?: string | null;
  application_contact?: string | null;
  apply_url?: string | null;
  posted_by?: string | null;
  posted_at?: string | null;
  expires_at?: string | null;
  view_count?: number | null;
  application_count?: number | null;
  is_approved?: boolean | null;
  flagged_count?: number | null;
};

export type SupabaseProfile = {
  id: string;
  full_name?: string;
  email?: string;
  phone?: string;
  skills?: string[];
  experience_years?: number | null;
  education?: string | null;
  resume_summary?: string | null;
  preferred_cities?: string[];
  preferred_states?: string[];
  current_city?: string | null;
  current_state?: string | null;
  willing_to_relocate?: boolean | null;
  max_commute_km?: number | null;
  preferred_job_types?: string[];
  preferred_salary_min?: number | null;
  remote_only?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
};
