import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  buildPaymentIssueNotifyMessages,
  FINANCE_IN_APP_NOTIFY_EMAIL,
  type PaymentKind,
} from "@/lib/payment-notify";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const notifySchema = z.object({
  orderNsu: z.string().uuid(),
  reason: z.enum(["failed_return", "incomplete_checkout"]),
  paymentKind: z.enum(["debt", "credit"]).optional(),
  memberName: z.string().min(1).optional(),
  amount: z.number().positive().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = notifySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const cookieToken = cookieStore.get("authToken")?.value;
    const headerToken = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
    const authToken = headerToken || cookieToken;

    const admin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: charge, error: chargeError } = await admin
      .from("charges")
      .select("order_nsu, customer_name, customer_email, customer_phone, status")
      .eq("order_nsu", parsed.data.orderNsu)
      .maybeSingle();

    if (chargeError || !charge) {
      return NextResponse.json({ error: "Cobrança não encontrada" }, { status: 404 });
    }

    if (charge.status === "paid") {
      return NextResponse.json({ success: true, notified: false, reason: "already_paid" });
    }

    if (authToken) {
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${authToken}` } },
      });
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;

      if (user) {
        const { data: member } = await admin
          .from("membros")
          .select("user_name")
          .eq("user_id", user.id)
          .maybeSingle();

        const memberName = member?.user_name?.trim();
        if (
          memberName &&
          charge.customer_name &&
          memberName !== charge.customer_name.trim()
        ) {
          return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
        }
      }
    }

    const { data: members, error: financeError } = await admin
      .from("membros")
      .select("user_id, user_email");

    if (financeError) {
      console.error("Financeiro in-app não encontrado:", financeError);
      return NextResponse.json(
        { error: "Usuário financeiro não encontrado no app" },
        { status: 500 }
      );
    }

    const financeMember = (members ?? []).find(
      (m) =>
        m.user_email?.trim().toLowerCase() === FINANCE_IN_APP_NOTIFY_EMAIL
    );

    if (!financeMember?.user_id) {
      return NextResponse.json(
        { error: "Usuário financeiro não encontrado no app" },
        { status: 500 }
      );
    }

    const memberName =
      parsed.data.memberName?.trim() || charge.customer_name?.trim() || "Membro";
    const paymentKind = parsed.data.paymentKind as PaymentKind | undefined;

    const { title, body, notificationType } = buildPaymentIssueNotifyMessages({
      reason: parsed.data.reason,
      memberName,
      amount: parsed.data.amount,
      paymentKind,
      orderNsu: parsed.data.orderNsu,
    });

    const referenceId = `${parsed.data.reason}:${parsed.data.orderNsu}`;

    const { data: existing } = await admin
      .from("notificacoes_app")
      .select("id")
      .eq("user_id", financeMember.user_id)
      .eq("type", notificationType)
      .eq("reference_id", referenceId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ success: true, notified: false, reason: "duplicate" });
    }

    const { error: insertError } = await admin.from("notificacoes_app").insert({
      user_id: financeMember.user_id,
      title,
      body,
      type: notificationType,
      reference_id: referenceId,
    });

    if (insertError) {
      console.error("Erro ao criar notificação de pagamento:", insertError);
      return NextResponse.json({ error: "Erro ao criar notificação" }, { status: 500 });
    }

    return NextResponse.json({ success: true, notified: true });
  } catch (error) {
    console.error("Erro ao notificar pagamento:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro interno" },
      { status: 500 }
    );
  }
}
