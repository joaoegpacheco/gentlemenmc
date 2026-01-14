import PaymentReturnClient from "./PaymentReturnClient";

type SearchParams = {
  [key: string]: string | string[] | undefined;
};

export default async function PaymentReturnPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  return <PaymentReturnClient searchParams={resolvedSearchParams as any} />;
}
