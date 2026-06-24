"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Bell } from "lucide-react";
import { useTranslations } from "next-intl";
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

interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: string;
  reference_id: string | null;
  read_at: string | null;
  created_at: string;
}

interface NotificationBellProps {
  onOpenToolLoanTab?: () => void;
}

export function NotificationBell({ onOpenToolLoanTab }: NotificationBellProps) {
  const t = useTranslations("appNotifications");
  const [items, setItems] = useState<AppNotification[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const unreadCount = items.filter((n) => !n.read_at).length;

  const fetchNotifications = useCallback(async (uid: string) => {
    const { data, error } = await supabase
      .from("notificacoes_app")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false })
      .limit(20);

    if (!error && data) setItems(data);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData?.user?.id;
      if (!uid || cancelled) return;

      setUserId(uid);
      await fetchNotifications(uid);
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
            const row = payload.new as AppNotification;
            setItems((prev) => [row, ...prev].slice(0, 20));
            toast({
              title: row.title,
              description: row.body,
            });
          }
        )
        .subscribe();

      channelRef.current = channel;
    };

    void init();

    return () => {
      cancelled = true;
      if (channelRef.current) {
        void supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [fetchNotifications]);

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

  const handleItemClick = async (item: AppNotification) => {
    if (!item.read_at) await markAsRead(item.id);
    if (item.type === "emprestimo_sede" || item.type === "emprestimo_sede_devolucao") {
      onOpenToolLoanTab?.();
    }
  };

  return (
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
          items.map((item) => (
            <DropdownMenuItem
              key={item.id}
              className="flex flex-col items-start gap-1 cursor-pointer"
              onClick={() => void handleItemClick(item)}
            >
              <span className={`text-sm font-medium ${!item.read_at ? "text-foreground" : "text-muted-foreground"}`}>
                {item.title}
              </span>
              <span className="text-xs text-muted-foreground line-clamp-2">{item.body}</span>
              <span className="text-[10px] text-muted-foreground">
                {format(new Date(item.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
              </span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
