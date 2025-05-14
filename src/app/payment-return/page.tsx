import React, { Suspense } from 'react';
import PaymentReturnClient from './PaymentReturnClient';

type Props = {
    transaction_id: string;
    order_nsu: string;
    slug: string;
};

export default function PaymentReturnPage({ searchParams }: { searchParams: Props }) {

  return (
    <Suspense fallback={<p>Verificando pagamento...</p>}>
      <PaymentReturnClient searchParams={searchParams} />
    </Suspense>
  );
}
