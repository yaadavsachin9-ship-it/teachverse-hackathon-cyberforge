// Supabase Client Wrapper with Graceful Fallback to Local Store
export const SUPABASE_CONFIG = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  isConfigured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
};

export function isSupabaseEnabled(): boolean {
  return SUPABASE_CONFIG.isConfigured;
}
