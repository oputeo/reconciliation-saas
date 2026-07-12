// src/lib/supabase.ts
import { createBrowserClient } from '@supabase/ssr';

/**
 * Supabase Client for Browser (Client Components)
 * Using SSR package for better integration with Next.js App Router
 */
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Optional: Add a server-side client if needed later
export const createSupabaseServerClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
};