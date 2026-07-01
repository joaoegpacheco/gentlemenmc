"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
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
import { getAccessToken } from "@/lib/sync-event-notifications";
import { toast } from "@/hooks/use-toast";
import type { EventRsvpStatus } from "@/lib/event-rsvp";

type EventRsvpDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  eventName?: string;
  onSuccess?: (status: EventRsvpStatus) => void;
};

export async function submitEventRsvp(params: {
  eventId: string;
  status: EventRsvpStatus;
  guestNames?: string[];
}): Promise<{ ok: boolean; error?: string }> {
  const token = await getAccessToken();
  if (!token) return { ok: false, error: "not_authenticated" };

  try {
    const res = await fetch("/api/events/rsvp", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      return { ok: false, error: json.error ?? "request_failed" };
    }

    return { ok: true };
  } catch {
    return { ok: false, error: "network_error" };
  }
}

export function EventRsvpDialog({
  open,
  onOpenChange,
  eventId,
  eventName,
  onSuccess,
}: EventRsvpDialogProps) {
  const t = useTranslations("eventRsvp");
  const [bringingGuests, setBringingGuests] = useState<boolean | null>(null);
  const [guestNames, setGuestNames] = useState<string[]>([""]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setBringingGuests(null);
    setGuestNames([""]);
    setError(null);
  }, []);

  const handleOpenChange = (next: boolean) => {
    if (!next) resetForm();
    onOpenChange(next);
  };

  const handleConfirm = async () => {
    setError(null);

    if (bringingGuests === null) {
      setError(t("chooseGuestOption"));
      return;
    }

    const names = bringingGuests
      ? guestNames.map((n) => n.trim()).filter((n) => n.length > 0)
      : [];

    if (bringingGuests && names.length === 0) {
      setError(t("guestNameRequired"));
      return;
    }

    setSubmitting(true);
    const result = await submitEventRsvp({
      eventId,
      status: "confirmed",
      guestNames: names,
    });
    setSubmitting(false);

    if (!result.ok) {
      setError(t("saveError"));
      return;
    }

    toast({ title: t("confirmSuccess"), description: eventName });
    onSuccess?.("confirmed");
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("confirmTitle")}</DialogTitle>
          <DialogDescription>
            {eventName ? t("confirmDescriptionNamed", { name: eventName }) : t("confirmDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>{t("bringingGuests")}</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={bringingGuests === true ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setBringingGuests(true);
                  if (guestNames.length === 0) setGuestNames([""]);
                }}
              >
                {t("yes")}
              </Button>
              <Button
                type="button"
                variant={bringingGuests === false ? "default" : "outline"}
                size="sm"
                onClick={() => setBringingGuests(false)}
              >
                {t("no")}
              </Button>
            </div>
          </div>

          {bringingGuests && (
            <div className="grid gap-2">
              <Label>{t("guestNames")}</Label>
              {guestNames.map((name, index) => (
                <Input
                  key={index}
                  value={name}
                  onChange={(e) => {
                    const next = [...guestNames];
                    next[index] = e.target.value;
                    setGuestNames(next);
                  }}
                  placeholder={t("guestNamePlaceholder", { number: index + 1 })}
                  autoComplete="off"
                />
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-fit"
                onClick={() => setGuestNames((prev) => [...prev, ""])}
              >
                {t("addGuest")}
              </Button>
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={submitting}
          >
            {t("cancel")}
          </Button>
          <Button type="button" onClick={() => void handleConfirm()} disabled={submitting}>
            {submitting ? t("saving") : t("confirmPresence")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function useEventRsvpActions() {
  const t = useTranslations("eventRsvp");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const [activeEventName, setActiveEventName] = useState<string | undefined>();
  const [declining, setDeclining] = useState(false);

  const openConfirmDialog = (eventId: string, eventName?: string) => {
    setActiveEventId(eventId);
    setActiveEventName(eventName);
    setDialogOpen(true);
  };

  const declinePresence = async (
    eventId: string,
    eventName?: string,
    onSuccess?: () => void
  ) => {
    setDeclining(true);
    const result = await submitEventRsvp({ eventId, status: "declined" });
    setDeclining(false);

    if (!result.ok) {
      toast({
        title: t("saveError"),
        variant: "destructive",
      });
      return;
    }

    toast({
      title: t("declineSuccess"),
      description: eventName,
    });
    onSuccess?.();
  };

  return {
    dialogOpen,
    setDialogOpen,
    activeEventId,
    activeEventName,
    declining,
    openConfirmDialog,
    declinePresence,
  };
}
