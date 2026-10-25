import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

/**
 * The publishable key is safe to ship in the app: it can only do what the database's
 * row-level security rules and the edge functions allow. Secret keys never live in the app.
 */
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_KEY;

/** False until the Supabase keys are in .env. The app falls back to sample data until then. */
export const isBackendConfigured = Boolean(url && publishableKey);

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!url || !publishableKey) {
    throw new Error('Supabase is not configured. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_KEY to .env.');
  }
  if (client) return client;

  client = createClient(url, publishableKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });

  // Refresh the session only while the app is open, as Supabase recommends for mobile.
  if (Platform.OS !== 'web') {
    const active = client;
    AppState.addEventListener('change', (state) => {
      if (state === 'active') active.auth.startAutoRefresh();
      else active.auth.stopAutoRefresh();
    });
  }

  return client;
}
