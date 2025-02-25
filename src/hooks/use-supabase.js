import { createClient } from "@supabase/supabase-js";

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUBABASE_WEB,
    process.env.NEXT_PUBLIC_SUBABASE_KEY
  );

export default supabase;