import PaymentReturnClient from "./PaymentReturnClient";

type SearchParams = {
  [key: string]: string | string[] | undefined;
};

export default function PaymentReturnPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return <PaymentReturnClient searchParams={searchParams as any} />;
}
