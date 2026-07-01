import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  buildEventDayNotifyMessages,
  createdAtDateKeyInEventTz,
  daysUntilEvent,
  eventReferenceKey,
  EVENT_NOTIFY_TYPE,
  isWithinEventNotifyWindow,
  todayDateKeyInEventTz,
} from "@/lib/event-notify";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const bodySchema = z.object({
  locale: z.enum(["pt", "en"]).optional(),
});

type DbEventRow = {
  id: number | string;
  name?: string | null;
  location?: string | null;
  date?: string | null;
  data?: string | null;
  time?: string | null;
};

type CreatedNotification = {
  id: string;
  title: string;
  body: string;
  type: string;
  reference_id: string | null;
  read_at: string | null;
  created_at: string;
};

function getDateFromRow(row: DbEventRow): string | null {
  const raw = row.date ?? row.data;
  if (raw == null || String(raw).trim() === "") return null;
  const s = String(raw).trim();
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  if (m) return m[1];
  return null;
}

function getTimeFromRow(row: DbEventRow): string {
  if (row.time == null || String(row.time).trim() === "") return "00:00:00";
  const raw = String(row.time);
  const match = raw.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (!match) return "00:00:00";
  const h = match[1].padStart(2, "0");
  const min = match[2].padStart(2, "0");
  const s = (match[3] ?? "00").padStart(2, "0");
  return `${h}:${min}:${s}`;
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const cookieToken = cookieStore.get("authToken")?.value;
    const headerToken = request.headers
      .get("Authorization")
      ?.replace(/^Bearer\s+/i, "");
    const authToken = headerToken || cookieToken;

    if (!authToken) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${authToken}` } },
    });

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const userId = userData.user.id;
    let locale: "pt" | "en" = "pt";
    try {
      const json = await request.json();
      const parsed = bodySchema.safeParse(json);
      if (parsed.success && parsed.data.locale) {
        locale = parsed.data.locale;
      }
    } catch {
      /* body opcional */
    }

    const admin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const today = todayDateKeyInEventTz();

    const { data: events, error: eventsError } = await admin
      .from("events")
      .select("id, name, location, date, time");

    if (eventsError) {
      console.error("Erro ao buscar eventos:", eventsError);
      return NextResponse.json(
        { error: "Erro ao buscar eventos" },
        { status: 500 }
      );
    }

    const upcomingEvents = (events ?? [])
      .map((row) => {
        const dateKey = getDateFromRow(row as DbEventRow);
        if (!dateKey) return null;
        const until = daysUntilEvent(dateKey, today);
        if (!isWithinEventNotifyWindow(until)) return null;
        return {
          row: row as DbEventRow,
          dateKey,
          daysUntil: until,
        };
      })
      .filter((e): e is NonNullable<typeof e> => e != null);

    if (upcomingEvents.length === 0) {
      return NextResponse.json({ success: true, created: 0, notifications: [] });
    }

    const refKeys = upcomingEvents.map(({ row }) => eventReferenceKey(row.id));

    const { data: existing, error: existingError } = await admin
      .from("notificacoes_app")
      .select("reference_id, created_at")
      .eq("user_id", userId)
      .eq("type", EVENT_NOTIFY_TYPE)
      .in("reference_id", refKeys);

    if (existingError) {
      console.error("Erro ao verificar notificações:", existingError);
      return NextResponse.json(
        { error: "Erro ao verificar notificações" },
        { status: 500 }
      );
    }

    const alreadyNotifiedToday = new Set(
      (existing ?? [])
        .filter((n) => createdAtDateKeyInEventTz(n.created_at) === today)
        .map((n) => n.reference_id)
        .filter((id): id is string => id != null)
    );

    const rows = upcomingEvents
      .filter(({ row }) => !alreadyNotifiedToday.has(eventReferenceKey(row.id)))
      .map(({ row, dateKey, daysUntil }) => {
        const timeKey = getTimeFromRow(row);
        const { title, body, notificationType } = buildEventDayNotifyMessages({
          eventName: String(row.name ?? "").trim() || "Evento",
          eventDate: dateKey,
          eventTime: timeKey,
          location: row.location ?? null,
          daysUntil,
          locale,
        });

        return {
          user_id: userId,
          title,
          body,
          type: notificationType,
          reference_id: eventReferenceKey(row.id),
        };
      });

    if (rows.length === 0) {
      return NextResponse.json({ success: true, created: 0, notifications: [] });
    }

    const { data: inserted, error: insertError } = await admin
      .from("notificacoes_app")
      .insert(rows)
      .select("id, title, body, type, reference_id, read_at, created_at");

    if (insertError) {
      console.error("Erro ao criar notificações de evento:", insertError);
      return NextResponse.json(
        { error: "Erro ao criar notificações" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      created: rows.length,
      notifications: (inserted ?? []) as CreatedNotification[],
    });
  } catch (error) {
    console.error("Erro ao notificar eventos:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro interno" },
      { status: 500 }
    );
  }
}
