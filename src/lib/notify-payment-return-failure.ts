import {
  loadPendingCheckout,
  type PaymentIssueReason,
} from "@/lib/payment-notify";
import { notifyPaymentIssue } from "@/lib/notify-payment-issue-client";

type PaymentReturnParams = {
  order_nsu?: string;
  order_id?: string;
  warning?: string;
};

export async function notifyFinanceOnPaymentReturnFailure(
  searchParams: PaymentReturnParams
): Promise<void> {
  const orderNsu = searchParams.order_nsu || searchParams.order_id;
  if (!orderNsu) return;

  const pending = loadPendingCheckout();
  const matched = pending?.orderNsu === orderNsu ? pending : null;

  const reason: PaymentIssueReason = "failed_return";

  await notifyPaymentIssue({
    orderNsu,
    reason,
    paymentKind: matched?.paymentKind,
    memberName: matched?.memberName,
    amount: matched?.amount,
  });
}
