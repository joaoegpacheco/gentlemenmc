/**
 * Type definitions for Supabase Authentication User
 * Based on the actual JSON structure returned by Supabase Auth
 */

export interface SupabaseAuthUser {
  id: string;
  email: string;
  banned_until: string | null;
  created_at: string;
  confirmed_at: string | null;
  confirmation_sent_at: string | null;
  is_anonymous: boolean;
  is_sso_user: boolean;
  invited_at: string | null;
  last_sign_in_at: string | null;
  phone: string | null;
  raw_app_meta_data: {
    provider?: string;
    providers?: string[];
    [key: string]: unknown;
  };
  raw_user_meta_data: {
    phone_confirmed?: boolean;
    user_name?: string;
    [key: string]: unknown;
  };
  updated_at: string;
  providers: string[];
}

/**
 * Helper type for user data from supabase.auth.getUser()
 */
export interface AuthUserResponse {
  user: SupabaseAuthUser | null;
}

