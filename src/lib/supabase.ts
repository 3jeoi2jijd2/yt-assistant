import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Create a mock client if credentials are missing
const isMockMode = !supabaseUrl || !supabaseAnonKey;

export const supabase = isMockMode
  ? null as any
  : createClient(supabaseUrl, supabaseAnonKey);

// Auth helpers with mock fallback
export const signUp = async (email: string, password: string) => {
  if (isMockMode) {
    return { data: null, error: new Error('Supabase not configured. See walkthrough for setup.') };
  }
  const { data, error } = await supabase.auth.signUp({ email, password });
  return { data, error };
};

export const signIn = async (email: string, password: string) => {
  if (isMockMode) {
    return { data: null, error: new Error('Supabase not configured. See walkthrough for setup.') };
  }
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { data, error };
};

export const signOut = async () => {
  if (isMockMode) return { error: null };
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async () => {
  if (isMockMode) return null;
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

// Database helpers with mock fallback
export const saveTranscript = async (userId: string, videoId: string, title: string, transcript: string) => {
  if (isMockMode) return { data: null, error: null };
  const { data, error } = await supabase
    .from('transcripts')
    .insert([{ user_id: userId, video_id: videoId, title, transcript }])
    .select();
  return { data, error };
};

export const getTranscripts = async (userId: string) => {
  if (isMockMode) return { data: [], error: null };
  const { data, error } = await supabase
    .from('transcripts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return { data, error };
};

export const saveScript = async (userId: string, title: string, script: string, platform: string, niche: string) => {
  if (isMockMode) return { data: null, error: null };
  const { data, error } = await supabase
    .from('scripts')
    .insert([{ user_id: userId, title, script, platform, niche }])
    .select();
  return { data, error };
};

export const getScripts = async (userId: string) => {
  if (isMockMode) return { data: [], error: null };
  const { data, error } = await supabase
    .from('scripts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return { data, error };
};

export const saveNiche = async (userId: string, name: string, competition: string, potential: number) => {
  if (isMockMode) return { data: null, error: null };
  const { data, error } = await supabase
    .from('saved_niches')
    .insert([{ user_id: userId, name, competition, potential }])
    .select();
  return { data, error };
};

export const getSavedNiches = async (userId: string) => {
  if (isMockMode) return { data: [], error: null };
  const { data, error } = await supabase
    .from('saved_niches')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return { data, error };
};

export { isMockMode };
