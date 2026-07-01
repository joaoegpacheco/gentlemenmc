import { supabase } from "@/hooks/use-supabase";

export const INFINITE_PAY_STORE_HANDLE = "gentlemenmc";
export const PAYMENT_REDIRECT_URL = "https://gentlemenmc.vercel.app/payment-return";

export type CheckoutMember = {
  user_name: string;
  phone: string;
  user_email?: string | null;
};

export function buildInfinitePayUrl(
  member: CheckoutMember,
  amount: number,
  itemName: string,
  orderNsu: string
): string {
  const cleanPhone = member.phone.replace(/\D/g, "");
  const amountInCents = Math.round(amount * 100);
  const items = JSON.stringify([
    { name: itemName, price: amountInCents, quantity: 1 },
  ]);
  const redirectUrl = encodeURIComponent(PAYMENT_REDIRECT_URL);

  let paymentUrl = `https://checkout.infinitepay.io/${INFINITE_PAY_STORE_HANDLE}?items=${items}&order_nsu=${orderNsu}&redirect_url=${redirectUrl}&customer_name=${encodeURIComponent(
    member.user_name
  )}&customer_cellphone=55${cleanPhone}`;

  if (member.user_email) {
    paymentUrl += `&customer_email=${encodeURIComponent(member.user_email)}`;
  }

  return paymentUrl;
}

export async function createChargeAndOpenCheckout(
  member: CheckoutMember,
  customerName: string,
  amount: number,
  itemName: string
): Promise<
  | { ok: true; orderNsu: string }
  | { ok: false; reason: "no_phone" | "insert_failed" }
> {
  if (!member.phone?.replace(/\D/g, "")) {
    return { ok: false, reason: "no_phone" };
  }

  const orderNsu = crypto.randomUUID();
  const paymentUrl = buildInfinitePayUrl(member, amount, itemName, orderNsu);
  const cleanPhone = member.phone.replace(/\D/g, "");

  const { error } = await supabase.from("charges").insert({
    order_nsu: orderNsu,
    customer_name: customerName,
    customer_email: member.user_email ?? undefined,
    customer_phone: cleanPhone,
    status: "pending",
  });

  if (error) {
    console.error(error);
    return { ok: false, reason: "insert_failed" };
  }

  window.open(paymentUrl, "_blank");
  return { ok: true, orderNsu };
}
