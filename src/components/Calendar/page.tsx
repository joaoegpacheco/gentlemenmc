"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Calendar } from "@fullcalendar/core";
import type { EventClickArg } from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import allLocales from "@fullcalendar/core/locales-all";
import { useTheme } from "next-themes";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { supabase } from "@/hooks/use-supabase";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

/** Data/hora dos eventos são interpretadas neste fuso (Brasil). */
const EVENT_TZ = "America/Sao_Paulo";

/** Linha vinda do PostgREST (`date` ou `data` conforme o schema). */
type DbEventRow = {
  id?: string;
  name?: string;
  location?: string | null;
  date?: string | null;
  /** Alguns schemas usam `data` em vez de `date`. */
  data?: string | null;
  time?: string | null;
};

type SelectedEvent = {
  dbId: string | null;
  name: string;
  location: string;
  /** YYYY-MM-DD (coluna `date`). */
  eventDate: string;
  /** Valor da coluna `time` (Postgres time / timetz como string). */
  eventTime: string;
};

/** HH:mm:ss a partir do valor devolvido pelo Postgres (time / timetz). */
function normalizeDbTimeString(raw: string): string {
  if (!raw || typeof raw !== "string") return "00:00:00";
  const m = raw.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (!m) return "00:00:00";
  const h = m[1].padStart(2, "0");
  const min = m[2].padStart(2, "0");
  const s = (m[3] ?? "00").padStart(2, "0");
  return `${h}:${min}:${s}`;
}

/** Valor para coluna Postgres `time` (sem timezone) a partir de <input type="time">. */
function pgTimeFromTimeInput(hm: string): string {
  if (!hm || !hm.trim()) return "00:00:00";
  const parts = hm.trim().split(":");
  const h = (parts[0] ?? "0").padStart(2, "0");
  const m = (parts[1] ?? "0").padStart(2, "0");
  return `${h}:${m}:00`;
}

function hmForTimeInputFromDb(raw: string): string {
  return normalizeDbTimeString(raw).slice(0, 5);
}

function getDateFromRow(row: DbEventRow): string | null {
  const raw = row.date ?? row.data;
  if (raw == null || String(raw).trim() === "") return null;
  const s = String(raw).trim();
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  if (m) return m[1];
  const d = dayjs(s);
  return d.isValid() ? d.format("YYYY-MM-DD") : null;
}

function getTimeFromRow(row: DbEventRow): string {
  if (row.time == null || String(row.time).trim() === "") return "00:00:00";
  return normalizeDbTimeString(String(row.time));
}

/** ISO com hora em BRT, ou só `YYYY-MM-DD` (dia inteiro) se o parse falhar. */
function startForFullCalendar(dateKey: string, timeKey: string): string {
  const t = normalizeDbTimeString(timeKey);
  const d = dayjs.tz(`${dateKey} ${t}`, "YYYY-MM-DD HH:mm:ss", EVENT_TZ);
  if (!d.isValid()) return dateKey;
  return d.toISOString();
}

function formatEventWhen(
  dateStr: string,
  timeRaw: string,
  dateLocale: string
): string {
  const t = normalizeDbTimeString(timeRaw);
  const d = dayjs.tz(`${dateStr} ${t}`, "YYYY-MM-DD HH:mm:ss", EVENT_TZ).toDate();
  return d.toLocaleString(dateLocale, {
    timeZone: EVENT_TZ,
    dateStyle: "full",
    timeStyle: "short",
  });
}

const CalendarEvents = () => {
  const calendarRef = useRef<HTMLDivElement>(null);
  const calendarInstanceRef = useRef<Calendar | null>(null);
  const { resolvedTheme } = useTheme();
  const locale = useLocale();
  const t = useTranslations("calendar");

  const fullCalendarLocale = locale === "en" ? "en" : "pt-br";
  const dateLocale = locale === "en" ? "en-US" : "pt-BR";

  const [fcEvents, setFcEvents] = useState<
    {
      id: string;
      title: string;
      start: string;
      extendedProps: {
        location: string;
        dbId: string | null;
        eventDate: string;
        eventTime: string;
      };
    }[]
  >([]);
  const [canEditEvents, setCanEditEvents] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<SelectedEvent | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createLocation, setCreateLocation] = useState("");
  const [createDate, setCreateDate] = useState("");
  const [createTimeHm, setCreateTimeHm] = useState("");
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const loadEvents = useCallback(async () => {
    setLoadError(null);
    setLoading(true);

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    if (!token) {
      setFcEvents([]);
      setLoading(false);
      return;
    }

    const res = await fetch("/api/events", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = (await res.json()) as { events?: DbEventRow[]; error?: string };

    if (!res.ok) {
      setLoadError(json.error ?? res.statusText);
      setFcEvents([]);
      setLoading(false);
      return;
    }

    const rows = (json.events ?? []) as DbEventRow[];
    const mapped = rows
      .map((row, index) => {
        const dateKey = getDateFromRow(row);
        if (!dateKey) return null;
        const timeKey = getTimeFromRow(row);
        const title = String(row.name ?? "").trim() || "—";
        const id =
          row.id != null && String(row.id).length > 0
            ? String(row.id)
            : `evt-${dateKey}-${timeKey}-${index}`;
        return {
          id,
          title,
          start: startForFullCalendar(dateKey, timeKey),
          extendedProps: {
            location: row.location ?? "",
            dbId: row.id != null ? String(row.id) : null,
            eventDate: dateKey,
            eventTime: timeKey,
          },
        };
      })
      .filter(
        (e): e is NonNullable<typeof e> => e != null
      );

    mapped.sort((a, b) => {
      const da = a.extendedProps.eventDate.localeCompare(b.extendedProps.eventDate);
      if (da !== 0) return da;
      return a.extendedProps.eventTime.localeCompare(b.extendedProps.eventTime);
    });

    setFcEvents(mapped);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user || cancelled) {
        if (!cancelled) setCanEditEvents(false);
        return;
      }
      const { data } = await supabase
        .from("admins")
        .select("id")
        .eq("id", user.id)
        .in("role", ["admin", "command"]);
      if (!cancelled) setCanEditEvents(!!data?.length);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const [detailEditing, setDetailEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editTimeHm, setEditTimeHm] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  const handleEventClick = useCallback(
    ({ event, jsEvent }: EventClickArg) => {
      if (event.url) {
        jsEvent.preventDefault();
        window.open(event.url, "_blank", "noopener,noreferrer");
        return;
      }
      const start = event.start;
      if (!start) return;
      const ext = event.extendedProps as {
        location?: string;
        dbId?: string | null;
        eventDate?: string;
        eventTime?: string;
      };
      setSelected({
        dbId: ext.dbId ?? null,
        name: event.title,
        location: String(ext.location ?? ""),
        eventDate: String(ext.eventDate ?? ""),
        eventTime: String(ext.eventTime ?? ""),
      });
      setDetailEditing(false);
      setEditError(null);
      setDetailOpen(true);
    },
    []
  );

  useEffect(() => {
    if (!calendarRef.current) return;

    const calendar = new Calendar(calendarRef.current, {
      plugins: [dayGridPlugin, interactionPlugin],
      initialView: "dayGridMonth",
      events: [],
      eventClick: handleEventClick,
      buttonText: {
        prev: t("buttonText.prev"),
        next: t("buttonText.next"),
        prevYear: t("buttonText.prevYear"),
        nextYear: t("buttonText.nextYear"),
        today: t("buttonText.today"),
        month: t("buttonText.month"),
        week: t("buttonText.week"),
        day: t("buttonText.day"),
      },
      locales: allLocales,
      locale: fullCalendarLocale,
      headerToolbar: {
        right: "prev,next",
      },
    });

    calendar.render();
    calendarInstanceRef.current = calendar;

    return () => {
      calendar.destroy();
      calendarInstanceRef.current = null;
    };
  }, [fullCalendarLocale, handleEventClick, t]);

  useEffect(() => {
    const cal = calendarInstanceRef.current;
    if (!cal) return;
    cal.removeAllEvents();
    for (const ev of fcEvents) {
      cal.addEvent({
        id: ev.id,
        title: ev.title,
        start: ev.start,
        extendedProps: ev.extendedProps,
      });
    }
  }, [fcEvents]);

  useEffect(() => {
    if (calendarInstanceRef.current && resolvedTheme) {
      const id = window.setTimeout(() => {
        calendarInstanceRef.current?.render();
      }, 100);
      return () => window.clearTimeout(id);
    }
  }, [resolvedTheme]);

  async function handleCreateSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);
    if (!createName.trim() || !createDate || !createTimeHm) {
      setCreateError(t("create.validation"));
      return;
    }

    setCreateSubmitting(true);
    const { error } = await supabase.from("events").insert({
      name: createName.trim(),
      location: createLocation.trim() || null,
      date: createDate,
      time: pgTimeFromTimeInput(createTimeHm),
    });
    setCreateSubmitting(false);

    if (error) {
      setCreateError(error.message);
      return;
    }

    setCreateName("");
    setCreateLocation("");
    setCreateDate("");
    setCreateTimeHm("");
    setCreateOpen(false);
    await loadEvents();
  }

  const formattedSelectedTime =
    selected &&
    formatEventWhen(selected.eventDate, selected.eventTime, dateLocale);

  function startDetailEdit() {
    if (!selected) return;
    setEditName(selected.name);
    setEditLocation(selected.location);
    setEditDate(selected.eventDate);
    setEditTimeHm(hmForTimeInputFromDb(selected.eventTime));
    setEditError(null);
    setDetailEditing(true);
  }

  function cancelDetailEdit() {
    setDetailEditing(false);
    setEditError(null);
  }

  async function saveDetailEdit() {
    if (!selected?.dbId) return;
    setEditError(null);
    if (!editName.trim() || !editDate || !editTimeHm) {
      setEditError(t("create.validation"));
      return;
    }

    const timePg = pgTimeFromTimeInput(editTimeHm);

    setEditSaving(true);
    const { error } = await supabase
      .from("events")
      .update({
        name: editName.trim(),
        location: editLocation.trim() || null,
        date: editDate,
        time: timePg,
      })
      .eq("id", selected.dbId);
    setEditSaving(false);

    if (error) {
      setEditError(error.message);
      return;
    }

    setSelected({
      ...selected,
      name: editName.trim(),
      location: editLocation.trim(),
      eventDate: editDate,
      eventTime: timePg,
    });
    setDetailEditing(false);
    await loadEvents();
  }

  const showEditControls =
    canEditEvents && selected?.dbId != null && selected.dbId.length > 0;

  return (
    <div className="space-y-3">
      {canEditEvents && (
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button type="button" size="sm" onClick={() => setCreateOpen(true)}>
            {t("create.button")}
          </Button>
        </div>
      )}

      {loading && (
        <p className="text-sm text-muted-foreground">{t("loading")}</p>
      )}
      {loadError && (
        <p className="text-sm text-destructive" role="alert">
          {t("loadError", { message: loadError })}
        </p>
      )}

      <div ref={calendarRef} />

      <Dialog
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open);
          if (!open) {
            setDetailEditing(false);
            setEditError(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("detail.title")}</DialogTitle>
            <DialogDescription className="sr-only">
              {t("detail.title")}
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="grid gap-3 text-sm">
              {detailEditing ? (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="detail-edit-name">{t("detail.name")}</Label>
                    <Input
                      id="detail-edit-name"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      autoComplete="off"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="detail-edit-date">{t("create.dateLabel")}</Label>
                    <Input
                      id="detail-edit-date"
                      type="date"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="detail-edit-time">{t("create.timeLabel")}</Label>
                    <Input
                      id="detail-edit-time"
                      type="time"
                      value={editTimeHm}
                      onChange={(e) => setEditTimeHm(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      {t("create.timezoneHint")}
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="detail-edit-location">
                      {t("detail.location")}
                    </Label>
                    <Input
                      id="detail-edit-location"
                      value={editLocation}
                      onChange={(e) => setEditLocation(e.target.value)}
                      autoComplete="off"
                    />
                  </div>
                  {editError && (
                    <p className="text-sm text-destructive" role="alert">
                      {editError}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <div>
                    <p className="font-medium text-muted-foreground">
                      {t("detail.name")}
                    </p>
                    <p>{selected.name}</p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">
                      {t("detail.when")}
                    </p>
                    <p>{formattedSelectedTime}</p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">
                      {t("detail.location")}
                    </p>
                    <p>
                      {selected.location || t("detail.locationEmpty")}
                    </p>
                  </div>
                </>
              )}
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            {detailEditing ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={cancelDetailEdit}
                  disabled={editSaving}
                >
                  {t("edit.cancelEdit")}
                </Button>
                <Button
                  type="button"
                  onClick={saveDetailEdit}
                  disabled={editSaving}
                >
                  {editSaving ? t("edit.saving") : t("edit.save")}
                </Button>
              </>
            ) : (
              <>
                {showEditControls && (
                  <Button type="button" variant="default" onClick={startDetailEdit}>
                    {t("edit.button")}
                  </Button>
                )}
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setDetailOpen(false)}
                >
                  {t("detail.close")}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) setCreateError(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleCreateSubmit}>
            <DialogHeader>
              <DialogTitle>{t("create.title")}</DialogTitle>
              <DialogDescription>{t("create.description")}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="event-name">{t("create.nameLabel")}</Label>
                <Input
                  id="event-name"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  autoComplete="off"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="event-location">{t("create.locationLabel")}</Label>
                <Input
                  id="event-location"
                  value={createLocation}
                  onChange={(e) => setCreateLocation(e.target.value)}
                  autoComplete="off"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="event-date">{t("create.dateLabel")}</Label>
                <Input
                  id="event-date"
                  type="date"
                  value={createDate}
                  onChange={(e) => setCreateDate(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="event-time-hm">{t("create.timeLabel")}</Label>
                <Input
                  id="event-time-hm"
                  type="time"
                  value={createTimeHm}
                  onChange={(e) => setCreateTimeHm(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {t("create.timezoneHint")}
                </p>
              </div>
              {createError && (
                <p className="text-sm text-destructive" role="alert">
                  {createError}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
              >
                {t("create.cancel")}
              </Button>
              <Button type="submit" disabled={createSubmitting}>
                {createSubmitting ? t("create.saving") : t("create.save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CalendarEvents;
