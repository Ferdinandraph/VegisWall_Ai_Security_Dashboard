import { supabase } from '../lib/supabase';

export type DeveloperAccount = {
  id: string;
  name: string;
  email: string;
  created_at?: string;
};

const STORAGE_KEY = 'vegiswall-developer-account';

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function signUpDeveloper(name: string, email: string, password: string): Promise<DeveloperAccount> {
  if (!supabase) {
    throw new Error('Supabase is not configured yet.');
  }

  const normalizedEmail = normalizeEmail(email);
  const trimmedName = name.trim();

  const { data, error } = await supabase.auth.signUp({
    email: normalizedEmail,
    password,
    options: {
      data: {
        name: trimmedName,
      },
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.user) {
    throw new Error('Sign up failed.');
  }

  const developer: DeveloperAccount = {
    id: data.user.id,
    name: trimmedName || data.user.email?.split('@')[0] || 'Developer',
    email: data.user.email ?? normalizedEmail,
    created_at: data.user.created_at,
  };

  return developer;
}

export async function loginDeveloper(email: string, password: string): Promise<DeveloperAccount> {
  if (!supabase) {
    throw new Error('Supabase is not configured yet.');
  }

  const normalizedEmail = normalizeEmail(email);

  const { data, error } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.user) {
    throw new Error('Invalid email or password.');
  }

  const name =
    data.user.user_metadata?.name ||
    data.user.email?.split('@')[0] ||
    'Developer';

  const developer: DeveloperAccount = {
    id: data.user.id,
    name,
    email: data.user.email ?? normalizedEmail,
    created_at: data.user.created_at,
  };

  return developer;
}

export function storeDeveloperSession(developer: DeveloperAccount) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(developer));
}

export function readDeveloperSession(): DeveloperAccount | null {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return null;
  }

  try {
    return JSON.parse(stored) as DeveloperAccount;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export async function clearDeveloperSession() {
  localStorage.removeItem(STORAGE_KEY);
  if (supabase) {
    await supabase.auth.signOut();
  }
}