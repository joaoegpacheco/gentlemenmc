import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import type { EventAttendee } from "@/lib/event-rsvp";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function getAuthenticatedUser(request: NextRequest) {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get("authToken")?.value;
  const headerToken = request.headers
    .get("Authorization")
    ?.replace(/^Bearer\s+/i, "");
  const authToken = headerToken || cookieToken;
  if (!authToken) return null;

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(authToken);

  if (error || !user) return null;
  return user;
}

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const eventId = request.nextUrl.searchParams.get("eventId");
  if (!eventId) {
    return NextResponse.json({ error: "eventId obrigatório" }, { status: 400 });
  }

  const admin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await admin
    .from("evento_presencas")
    .select("user_id, user_name, status, guest_names")
    .eq("event_id", eventId)
    .eq("status", "confirmed")
    .order("user_name", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const attendees: EventAttendee[] = (data ?? []).map((row) => ({
    userId: row.user_id,
    userName: row.user_name,
    status: row.status,
    guestNames: (row.guest_names ?? []) as string[],
  }));

  return NextResponse.json({ attendees });
}
