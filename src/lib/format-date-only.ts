import { format } from "date-fns";
import { enUS, ptBR } from "date-fns/locale";

const DATE_ONLY_RE = /^(\d{4})-(\d{2})-(\d{2})/;

/** Parse YYYY-MM-DD (or ISO prefix) as a local calendar date — no UTC midnight shift. */
export function parseDateOnly(value: string): Date | null {
  const match = DATE_ONLY_RE.exec(value);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDateOnly(
  value: string | null | undefined,
  options?: { pattern?: string; locale?: "pt" | "en" }
): string {
  if (!value) return "-";
  const date = parseDateOnly(value);
  if (!date) return "-";
  const pattern = options?.pattern ?? "dd/MM/yyyy";
  const localeObj = options?.locale === "en" ? enUS : ptBR;
  return format(date, pattern, { locale: localeObj });
}

export function formatDateOnlyLocale(
  value: string | null | undefined,
  locale: string = "pt-BR"
): string {
  if (!value) return "-";
  const date = parseDateOnly(value);
  if (!date) return "-";
  return date.toLocaleDateString(locale);
}
