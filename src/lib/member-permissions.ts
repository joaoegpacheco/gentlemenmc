import type { SupabaseClient } from "@supabase/supabase-js";

export interface MemberManagementPermissions {
  isAdmin: boolean;
  /** Command role in admins table = Diretoria */
  isCommand: boolean;
  isBarMC: boolean;
  canAccessMembersPage: boolean;
  canDeleteOrSuspend: boolean;
  canManageMembers: boolean;
  canChangeCaseType: boolean;
}

export async function getMemberManagementPermissions(
  supabase: SupabaseClient,
  userId: string,
  userEmail?: string | null
): Promise<MemberManagementPermissions> {
  const [adminsResult, commandResult] = await Promise.all([
    supabase.from("admins").select("id").eq("id", userId).eq("role", "admin"),
    supabase.from("admins").select("id").eq("id", userId).eq("role", "command"),
  ]);

  const isAdmin = !!(adminsResult.data && adminsResult.data.length > 0);
  const isCommand = !!(commandResult.data && commandResult.data.length > 0);
  const isBarMC = userEmail === "barmc@gentlemenmc.com.br";

  return {
    isAdmin,
    isCommand,
    isBarMC,
    canAccessMembersPage: isAdmin || isCommand,
    canDeleteOrSuspend: isAdmin || isCommand,
    canManageMembers: isAdmin || isCommand || isBarMC,
    canChangeCaseType: isAdmin || isCommand || isBarMC,
  };
}
