"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Bell } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/hooks/use-supabase";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import {
  fetchAppNotifications,
  syncEventNotifications,
  toastEventNotifications,
  type EventNotificationRow,
} from "@/lib/sync-event-notifications";
import { parseEventIdFromReference } from "@/lib/event-rsvp";
import {
  EventRsvpDialog,
  useEventRsvpActions,
} from "@/components/EventRsvpDialog/page";
import { EVENT_NOTIFY_TYPE } from "@/lib/event-notify";

interface NotificationBellProps {
  onOpenToolLoanTab?: () => void;
  onOpenCalendarTab?: () => void;
  /** Incrementado pelo Tabs após sync de eventos (login). */
  syncVersion?: number;
}

export function NotificationBell({
  onOpenToolLoanTab,
  onOpenCalendarTab,
  syncVersion = 0,
}: NotificationBellProps) {
  const t = useTranslations("appNotifications");
  const tRsvp = useTranslations("eventRsvp");
  const locale = useLocale();
  const [items, setItems] = useState<EventNotificationRow[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const {
    dialogOpen,
    setDialogOpen,
    activeEventId,
    activeEventName,
    declining,
    openConfirmDialog,
    declinePresence,
  } = useEventRsvpActions();

  const unreadCount = items.filter((n) => !n.read_at).length;

  const loadItems = useCallback(async () => {
    const rows = await fetchAppNotifications();
    setItems(rows);
    return rows;
  }, []);

  const runEventSync = useCallback(
    async (showToasts: boolean) => {
      const result = await syncEventNotifications(locale === "en" ? "en" : "pt");
      const rows = await loadItems();

      if (showToasts && result.notifications.length > 0) {
        toastEventNotifications(result.notifications, (opts) =>
          toast({ title: opts.title, description: opts.description })
        );
      }

      return { result, rows };
    },
    [loadItems, locale]
  );

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData?.user?.id;
      if (!uid || cancelled) return;

      setUserId(uid);
      await loadItems();
      if (cancelled) return;

      if (channelRef.current) {
        await supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      const channel = supabase
        .channel(`notificacoes_app:${uid}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notificacoes_app",
            filter: `user_id=eq.${uid}`,
          },
          (payload) => {
            const row = payload.new as EventNotificationRow;
            setItems((prev) => [row, ...prev].slice(0, 20));
            toastEventNotifications([row], (opts) =>
              toast({ title: opts.title, description: opts.description })
            );
          }
        )
        .subscribe();

      channelRef.current = channel;

      if (!cancelled) {
        await runEventSync(true);
      }
    };

    void init();

    return () => {
      cancelled = true;
      if (channelRef.current) {
        void supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [loadItems, runEventSync]);

  useEffect(() => {
    if (syncVersion <= 0) return;
    void runEventSync(true);
  }, [syncVersion, runEventSync]);

  const markAsRead = async (id: string) => {
    const { error } = await supabase
      .from("notificacoes_app")
      .update({ read_at: new Date().toISOString() })
      .eq("id", id);

    if (!error) {
      setItems((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, read_at: new Date().toISOString() } : n
        )
      );
    }
  };

  const markAllAsRead = async () => {
    if (!userId || unreadCount === 0) return;
    const now = new Date().toISOString();
    const unreadIds = items.filter((n) => !n.read_at).map((n) => n.id);

    const { error } = await supabase
      .from("notificacoes_app")
      .update({ read_at: now })
      .in("id", unreadIds);

    if (!error) {
      setItems((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? now })));
    }
  };

  const handleItemClick = async (item: EventNotificationRow) => {
    if (!item.read_at) await markAsRead(item.id);
    if (item.type === "emprestimo_sede" || item.type === "emprestimo_sede_devolucao") {
      onOpenToolLoanTab?.();
    } else if (item.type === "evento_dia") {
      onOpenCalendarTab?.();
    }
  };

  const handleRsvpSuccess = async (notificationId: string) => {
    if (!items.find((n) => n.id === notificationId)?.read_at) {
      await markAsRead(notificationId);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="relative shrink-0">
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
            <span className="sr-only">{t("title")}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel className="flex items-center justify-between">
            <span>{t("title")}</span>
            {unreadCount > 0 && (
              <button
                type="button"
                className="text-xs font-normal text-primary hover:underline"
                onClick={() => void markAllAsRead()}
              >
                {t("markAllRead")}
              </button>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {items.length === 0 ? (
            <p className="px-2 py-4 text-sm text-muted-foreground text-center">
              {t("empty")}
            </p>
          ) : (
            items.map((item) => {
              const isEventNotification = item.type === EVENT_NOTIFY_TYPE;
              const eventId = parseEventIdFromReference(item.reference_id);

              if (isEventNotification && eventId) {
                return (
                  <DropdownMenuItem
                    key={item.id}
                    className="flex flex-col items-start gap-2 cursor-default focus:bg-accent"
                    onSelect={(e) => e.preventDefault()}
                  >
                    <span
                      className={`text-sm font-medium ${!item.read_at ? "text-foreground" : "text-muted-foreground"}`}
                    >
                      {item.title}
                    </span>
                    <span className="text-xs text-muted-foreground line-clamp-2">
                      {item.body}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {format(new Date(item.created_at), "dd/MM/yyyy HH:mm", {
                        locale: ptBR,
                      })}
                    </span>
                    <div className="flex w-full flex-col gap-1.5 pt-1">
                      <Button
                        type="button"
                        size="sm"
                        className="h-8 w-full text-xs"
                        onClick={() => {
                          if (!item.read_at) void markAsRead(item.id);
                          openConfirmDialog(eventId, item.title);
                        }}
                      >
                        {tRsvp("confirmPresence")}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-8 w-full text-xs"
                        disabled={declining}
                        onClick={() => {
                          void declinePresence(eventId, item.title, () => {
                            void handleRsvpSuccess(item.id);
                          });
                        }}
                      >
                        {tRsvp("declinePresence")}
                      </Button>
                      <button
                        type="button"
                        className="text-[10px] text-primary hover:underline self-start"
                        onClick={() => void handleItemClick(item)}
                      >
                        {t("viewInEvents")}
                      </button>
                    </div>
                  </DropdownMenuItem>
                );
              }

              return (
                <DropdownMenuItem
                  key={item.id}
                  className="flex flex-col items-start gap-1 cursor-pointer"
                  onClick={() => void handleItemClick(item)}
                >
                  <span
                    className={`text-sm font-medium ${!item.read_at ? "text-foreground" : "text-muted-foreground"}`}
                  >
                    {item.title}
                  </span>
                  <span className="text-xs text-muted-foreground line-clamp-2">
                    {item.body}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {format(new Date(item.created_at), "dd/MM/yyyy HH:mm", {
                      locale: ptBR,
                    })}
                  </span>
                </DropdownMenuItem>
              );
            })
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {activeEventId && (
        <EventRsvpDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          eventId={activeEventId}
          eventName={activeEventName}
          onSuccess={() => {
            const item = items.find(
              (n) => parseEventIdFromReference(n.reference_id) === activeEventId
            );
            if (item) void handleRsvpSuccess(item.id);
          }}
        />
      )}
    </>
  );
}
