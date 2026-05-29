const supabaseUrlCandidate =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.DB_SUPABASE_URL || "";

const hasHttpUrl = /^https?:\/\//i.test(supabaseUrlCandidate);

export const hasSupabaseConfig = Boolean(
  hasHttpUrl &&
    (process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.DB_SUPABASE_SERVICE_ROLE_KEY ||
      process.env.DB_SUPABASE_SECRET_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.DB_SUPABASE_ANON_KEY),
);

// Legacy flag retained so older payment modules keep compiling during MVP mode.
export const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
