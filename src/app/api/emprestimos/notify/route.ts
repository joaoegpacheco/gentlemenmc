import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  buildLoanNotifyMessages,
  getLoanNotifyEmails,
  isTelegramLoanNotifyEnabled,
} from "@/lib/loan-notify";
import { sendTelegramNotification } from "@/lib/telegram-notify";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const notifySchema = z
  .object({
    event: z.enum(["loan", "return"]).default("loan"),
    loanId: z.string().uuid().optional(),
    userName: z.string().min(1),
    itemDescription: z.string().min(1),
    sectorLabel: z.string().min(1),
    eventAt: z.string().min(1),
    returnedByName: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.event === "return" && !data.returnedByName?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "returnedByName obrigatório para devolução",
        path: ["returnedByName"],
      });
    }
  });

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const cookieToken = cookieStore.get("authToken")?.value;
    const headerToken = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
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

    const body = await request.json();
    const parsed = notifySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    const { title, body: notificationBody, externalMessage, notificationType } =
      buildLoanNotifyMessages({
        event: parsed.data.event,
        userName: parsed.data.userName,
        itemDescription: parsed.data.itemDescription,
        sectorLabel: parsed.data.sectorLabel,
        eventAt: parsed.data.eventAt,
        returnedByName: parsed.data.returnedByName,
      });
    const notifyEmails = getLoanNotifyEmails();

    const admin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: members, error: membersError } = await admin
      .from("membros")
      .select("user_id, user_email");

    if (membersError) {
      console.error("Erro ao buscar destinatários:", membersError);
      return NextResponse.json({ error: "Erro ao buscar destinatários" }, { status: 500 });
    }

    const emailSet = new Set(notifyEmails);
    const recipientIds = [
      ...new Set(
        (members ?? [])
          .filter(
            (m) =>
              m.user_id &&
              m.user_email &&
              emailSet.has(m.user_email.trim().toLowerCase())
          )
          .map((m) => m.user_id as string)
      ),
    ];

    let inAppCount = 0;
    if (recipientIds.length > 0) {
      const rows = recipientIds.map((userId) => ({
        user_id: userId,
        title,
        body: notificationBody,
        type: notificationType,
        reference_id: parsed.data.loanId ?? null,
      }));

      const { error: insertError } = await admin.from("notificacoes_app").insert(rows);
      if (insertError) {
        console.error("Erro ao criar notificações in-app:", insertError);
        return NextResponse.json({ error: "Erro ao criar notificações" }, { status: 500 });
      }
      inAppCount = rows.length;
    }

    let telegramResult: {
      sent: boolean;
      chatCount?: number;
      skipped?: boolean;
      error?: string;
    } = { sent: false, skipped: true };

    if (isTelegramLoanNotifyEnabled()) {
      try {
        const { chatCount } = await sendTelegramNotification(externalMessage);
        telegramResult = { sent: true, chatCount };
      } catch (error) {
        telegramResult = {
          sent: false,
          error: error instanceof Error ? error.message : "Erro Telegram",
        };
      }
    }

    return NextResponse.json({
      success: true,
      inApp: { count: inAppCount, emails: notifyEmails },
      telegram: telegramResult,
    });
  } catch (error) {
    console.error("Erro ao notificar empréstimo:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro interno" },
      { status: 500 }
    );
  }
}
