import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

export const EVENT_NOTIFY_TYPE = "evento_dia";
export const EVENT_TZ = "America/Sao_Paulo";
export const EVENT_NOTIFY_DAYS_AHEAD = 7;

dayjs.extend(utc);
dayjs.extend(timezone);

/** YYYY-MM-DD no fuso dos eventos (Brasil). */
export function todayDateKeyInEventTz(): string {
  return dayjs().tz(EVENT_TZ).format("YYYY-MM-DD");
}

export function daysUntilEvent(eventDateKey: string, todayKey: string): number {
  const event = dayjs.tz(eventDateKey, "YYYY-MM-DD", EVENT_TZ).startOf("day");
  const today = dayjs.tz(todayKey, "YYYY-MM-DD", EVENT_TZ).startOf("day");
  return event.diff(today, "day");
}

export function isWithinEventNotifyWindow(daysUntil: number): boolean {
  return daysUntil >= 0 && daysUntil <= EVENT_NOTIFY_DAYS_AHEAD;
}

export function eventReferenceKey(eventId: string | number): string {
  return `event:${eventId}`;
}

function normalizeDbTimeString(raw: string): string {
  if (!raw || typeof raw !== "string") return "00:00:00";
  const m = raw.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (!m) return "00:00:00";
  const h = m[1].padStart(2, "0");
  const min = m[2].padStart(2, "0");
  const s = (m[3] ?? "00").padStart(2, "0");
  return `${h}:${min}:${s}`;
}

function formatEventWhen(
  dateStr: string,
  timeRaw: string,
  locale: "pt" | "en"
): string {
  const t = normalizeDbTimeString(timeRaw);
  const dateLocale = locale === "en" ? "en-US" : "pt-BR";
  const d = dayjs
    .tz(`${dateStr} ${t}`, "YYYY-MM-DD HH:mm:ss", EVENT_TZ)
    .toDate();
  return d.toLocaleString(dateLocale, {
    timeZone: EVENT_TZ,
    dateStyle: "full",
    timeStyle: "short",
  });
}

function titleForDaysUntil(daysUntil: number, locale: "pt" | "en"): string {
  if (daysUntil === 0) {
    return locale === "en" ? "Event today" : "Evento hoje";
  }
  if (daysUntil === 1) {
    return locale === "en" ? "Event tomorrow" : "Evento amanhã";
  }
  if (locale === "en") {
    return `Event in ${daysUntil} days`;
  }
  return `Evento em ${daysUntil} dias`;
}

const copy = {
  pt: {
    body: (name: string, when: string, location: string | null) => {
      const loc = location?.trim()
        ? ` Local: ${location.trim()}.`
        : "";
      return `${name} — ${when}.${loc}`;
    },
  },
  en: {
    body: (name: string, when: string, location: string | null) => {
      const loc = location?.trim()
        ? ` Location: ${location.trim()}.`
        : "";
      return `${name} — ${when}.${loc}`;
    },
  },
} as const;

export function buildEventDayNotifyMessages(params: {
  eventName: string;
  eventDate: string;
  eventTime: string;
  location: string | null;
  daysUntil: number;
  locale?: "pt" | "en";
}) {
  const locale = params.locale ?? "pt";
  const when = formatEventWhen(
    params.eventDate,
    params.eventTime,
    locale
  );
  const strings = copy[locale];

  return {
    title: titleForDaysUntil(params.daysUntil, locale),
    body: strings.body(params.eventName, when, params.location),
    notificationType: EVENT_NOTIFY_TYPE,
  };
}

export function createdAtDateKeyInEventTz(iso: string): string {
  return dayjs(iso).tz(EVENT_TZ).format("YYYY-MM-DD");
}
