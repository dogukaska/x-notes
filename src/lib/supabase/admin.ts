import { createClient } from "@supabase/supabase-js";

// Sadece sunucu tarafında kullanılır (Server Actions). Service role key
// tarayıcıya asla gönderilmez; NEXT_PUBLIC_ öneki taşımaz.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
