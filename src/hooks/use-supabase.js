import { createClient } from "@supabase/supabase-js";

  const supabase = createClient(
    process.env.SUPABASE_WEB ? process.env.SUPABASE_WEB : process.env.NEXT_PUBLIC_SUBABASE_WEB,
    process.env.SUPABASE_KEY ? process.env.SUPABASE_KEY : process.env.NEXT_PUBLIC_SUBABASE_KEY
  );

export default supabase;