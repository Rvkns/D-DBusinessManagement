import { supabase, DbUserProfile } from './supabaseClient';
import type { User, Session } from '@supabase/supabase-js';

// ============================================================
// Auth: Sign In / Sign Up / Sign Out
// ============================================================

export const signIn = async (email: string, password: string): Promise<{ user: User; session: Session }> => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  if (!data.user || !data.session) throw new Error('Login fallito: risposta inattesa.');
  return { user: data.user, session: data.session };
};

export const signUp = async (
  email: string,
  password: string,
  displayName: string,
  role: 'dm' | 'player' = 'player'
): Promise<{ user: User }> => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
        role
      }
    }
  });
  if (error) throw new Error(error.message);
  if (!data.user) throw new Error('Registrazione fallita.');

  // Se la conferma email è attiva, Supabase può non creare subito una sessione valida.
  // In quel caso evitiamo upsert immediato (fallirebbe per RLS) e lasciamo al trigger DB la creazione base.
  if (!data.session) {
    return { user: data.user };
  }

  const { error: profileError } = await supabase
    .from('user_profiles')
    .upsert({
      id: data.user.id,
      display_name: displayName,
      role
    });

  if (profileError) {
    console.error('Errore creazione profilo:', profileError.message);
    throw new Error('Registrazione completata, ma il profilo non è stato inizializzato. Riprova login tra pochi secondi.');
  }

  return { user: data.user };
};

export const signOut = async (): Promise<void> => {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
};

// ============================================================
// Sessione corrente
// ============================================================

export const getCurrentSession = async (): Promise<Session | null> => {
  const { data } = await supabase.auth.getSession();
  return data.session;
};

export const getCurrentUser = async (): Promise<User | null> => {
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
};

// ============================================================
// Profilo utente e ruolo
// ============================================================

export const getUserProfile = async (userId: string): Promise<DbUserProfile | null> => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('getUserProfile error:', error.message);
    return null;
  }
  return data as DbUserProfile;
};

export const updateUserProfile = async (
  userId: string,
  updates: Partial<Pick<DbUserProfile, 'display_name' | 'character_name' | 'role'>>
): Promise<void> => {
  const { error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('id', userId);
  if (error) throw new Error(error.message);
};

// ============================================================
// Listener per cambio auth state
// ============================================================

export const onAuthStateChange = (
  callback: (session: Session | null) => void
) => {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
  return data.subscription;
};
