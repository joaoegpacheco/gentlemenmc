import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resolveMemberDisplayName, type EventRsvpStatus } from "@/lib/event-rsvp";

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

const postSchema = z.object({
  eventId: z.union([z.string(), z.number()]),
  status: z.enum(["confirmed", "declined"]),
  guestNames: z.array(z.string()).optional(),
});

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
    .select("status, guest_names")
    .eq("event_id", eventId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ rsvp: null });
  }

  return NextResponse.json({
    rsvp: {
      eventId,
      status: data.status as EventRsvpStatus,
      guestNames: (data.guest_names ?? []) as string[],
    },
  });
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const eventId = String(parsed.data.eventId);
  const status = parsed.data.status;
  const guestNames =
    status === "confirmed"
      ? (parsed.data.guestNames ?? [])
          .map((name) => name.trim())
          .filter((name) => name.length > 0)
      : [];

  const admin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: eventRow, error: eventError } = await admin
    .from("events")
    .select("id")
    .eq("id", eventId)
    .maybeSingle();

  if (eventError) {
    return NextResponse.json({ error: eventError.message }, { status: 500 });
  }
  if (!eventRow) {
    return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });
  }

  const userName = await resolveMemberDisplayName(admin, user.id);

  const { data, error } = await admin
    .from("evento_presencas")
    .upsert(
      {
        event_id: eventId,
        user_id: user.id,
        user_name: userName,
        status,
        guest_names: guestNames,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "event_id,user_id" }
    )
    .select("status, guest_names")
    .single();

  if (error) {
    console.error("Erro ao salvar presença:", error);
    return NextResponse.json({ error: "Erro ao salvar presença" }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    rsvp: {
      eventId,
      status: data.status as EventRsvpStatus,
      guestNames: (data.guest_names ?? []) as string[],
    },
  });
}
