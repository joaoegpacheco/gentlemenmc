import type { SupabaseClient } from "@supabase/supabase-js";

export type EventRsvpStatus = "confirmed" | "declined";

export type EventAttendee = {
  userId: string;
  userName: string;
  status: EventRsvpStatus;
  guestNames: string[];
};

export type EventRsvpRow = {
  eventId: string;
  status: EventRsvpStatus;
  guestNames: string[];
};

export function parseEventIdFromReference(referenceId: string | null): string | null {
  if (!referenceId) return null;
  const match = referenceId.match(/^event:(.+)$/);
  return match?.[1] ?? null;
}

export async function resolveMemberDisplayName(
  supabase: SupabaseClient,
  userId: string
): Promise<string> {
  const { data: member } = await supabase
    .from("membros")
    .select("user_name")
    .eq("user_id", userId)
    .maybeSingle();

  const name = member?.user_name?.trim();
  if (name) return name;

  const { data: userData } = await supabase.auth.admin.getUserById(userId);
  return userData?.user?.email?.split("@")[0] ?? "Membro";
}
