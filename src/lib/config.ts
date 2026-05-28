export const hasSupabaseConfig = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
);

// Legacy flag retained so older payment modules keep compiling during MVP mode.
export const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
