import { supabase } from "@/hooks/use-supabase";

export type EventNotificationRow = {
  id: string;
  title: string;
  body: string;
  type: string;
  reference_id: string | null;
  read_at: string | null;
  created_at: string;
};

export type SyncEventNotificationsResult = {
  ok: boolean;
  created: number;
  notifications: EventNotificationRow[];
};

let inflightSync: Promise<SyncEventNotificationsResult> | null = null;

const TOASTED_STORAGE_KEY = "event-notify-toasted";

export function markEventNotificationToasted(id: string): void {
  if (typeof window === "undefined") return;
  try {
    const current = new Set<string>(
      JSON.parse(sessionStorage.getItem(TOASTED_STORAGE_KEY) ?? "[]")
    );
    current.add(id);
    sessionStorage.setItem(
      TOASTED_STORAGE_KEY,
      JSON.stringify([...current].slice(-50))
    );
  } catch {
    /* ignore */
  }
}

export function shouldToastEventNotification(id: string): boolean {
  if (typeof window === "undefined") return true;
  try {
    const current = new Set<string>(
      JSON.parse(sessionStorage.getItem(TOASTED_STORAGE_KEY) ?? "[]")
    );
    return !current.has(id);
  } catch {
    return true;
  }
}

export function toastEventNotifications(
  rows: EventNotificationRow[],
  toastFn: (opts: { title: string; description: string }) => void
): void {
  for (const row of rows) {
    if (!shouldToastEventNotification(row.id)) continue;
    markEventNotificationToasted(row.id);
    toastFn({ title: row.title, description: row.body });
  }
}

export function getAuthTokenFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)authToken=([^;]+)/);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

export async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  if (data.session?.access_token) return data.session.access_token;
  return getAuthTokenFromCookie();
}

export async function syncEventNotifications(
  locale: "pt" | "en" = "pt"
): Promise<SyncEventNotificationsResult> {
  if (inflightSync) return inflightSync;

  inflightSync = (async () => {
    const token = await getAccessToken();
    if (!token) {
      return { ok: false, created: 0, notifications: [] };
    }

    try {
      const res = await fetch("/api/events/notify-today", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ locale }),
      });

      if (!res.ok) {
        return { ok: false, created: 0, notifications: [] };
      }

      const json = (await res.json()) as SyncEventNotificationsResult;
      return {
        ok: true,
        created: json.created ?? 0,
        notifications: json.notifications ?? [],
      };
    } catch {
      return { ok: false, created: 0, notifications: [] };
    }
  })().finally(() => {
    window.setTimeout(() => {
      inflightSync = null;
    }, 1500);
  });

  return inflightSync;
}

export async function fetchAppNotifications(): Promise<EventNotificationRow[]> {
  const token = await getAccessToken();
  if (!token) return [];

  try {
    const res = await fetch("/api/notifications", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { notifications?: EventNotificationRow[] };
    return json.notifications ?? [];
  } catch {
    return [];
  }
}
