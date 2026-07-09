import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { formatDateTime } from "@/utils/formatDateTime";
import { formatCurrency } from "@/utils/formatCurrency";

export interface DrinkReportRow {
  created_at: string;
  name: string;
  drink: string;
  paid: boolean | null;
  quantity: number;
  price: number;
  user: string;
  uuid: string;
}

export interface DrinkSummaryRow {
  drink: string;
  quantity: number;
  total: number;
}

export interface ReportLabels {
  title: string;
  member: string;
  period: string;
  totalSpent: string;
  summaryByDrink: string;
  details: string;
  date: string;
  drink: string;
  quantity: string;
  value: string;
  paid: string;
  markedBy: string;
  totalQuantity: string;
  totalValue: string;
  paidYes: string;
  paidNo: string;
  fileNamePdf: string;
  fileNameExcel: string;
  sheetSummary: string;
  sheetDetails: string;
}

export function getMonthRangeISO(year: number, month: number) {
  const monthStr = String(month).padStart(2, "0");
  const lastDay = new Date(year, month, 0).getDate();

  return {
    start: new Date(`${year}-${monthStr}-01T00:00:00-03:00`).toISOString(),
    end: new Date(
      `${year}-${monthStr}-${String(lastDay).padStart(2, "0")}T23:59:59-03:00`
    ).toISOString(),
  };
}

export function summarizeDrinksByType(
  drinks: DrinkReportRow[]
): DrinkSummaryRow[] {
  const map = new Map<string, DrinkSummaryRow>();

  for (const drink of drinks) {
    const existing = map.get(drink.drink) ?? {
      drink: drink.drink,
      quantity: 0,
      total: 0,
    };
    existing.quantity += drink.quantity;
    existing.total += parseFloat(drink.price.toString());
    map.set(drink.drink, existing);
  }

  return Array.from(map.values()).sort((a, b) =>
    a.drink.localeCompare(b.drink)
  );
}

export function getTotalSpent(drinks: DrinkReportRow[]): number {
  return drinks.reduce(
    (sum, drink) => sum + parseFloat(drink.price.toString()),
    0
  );
}

export function exportDrinksReportPDF(
  drinks: DrinkReportRow[],
  memberName: string,
  periodLabel: string,
  labels: ReportLabels
) {
  const summary = summarizeDrinksByType(drinks);
  const total = getTotalSpent(drinks);
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text(labels.title, 14, 20);

  doc.setFontSize(10);
  doc.text(`${labels.member}: ${memberName}`, 14, 28);
  doc.text(`${labels.period}: ${periodLabel}`, 14, 34);
  doc.text(`${labels.totalSpent}: ${formatCurrency(total)}`, 14, 40);

  doc.setFontSize(12);
  doc.text(labels.summaryByDrink, 14, 48);

  autoTable(doc, {
    startY: 52,
    head: [[labels.drink, labels.totalQuantity, labels.totalValue]],
    body: summary.map((row) => [
      row.drink,
      row.quantity.toString(),
      formatCurrency(row.total),
    ]),
  });

  const docWithTable = doc as jsPDF & {
    lastAutoTable?: { finalY: number };
  };
  const summaryEndY = docWithTable.lastAutoTable?.finalY ?? 52;

  doc.setFontSize(12);
  doc.text(labels.details, 14, summaryEndY + 10);

  autoTable(doc, {
    startY: summaryEndY + 14,
    head: [
      [
        labels.date,
        labels.drink,
        labels.quantity,
        labels.value,
        labels.paid,
        labels.markedBy,
      ],
    ],
    body: drinks.map((drink) => [
      formatDateTime(drink.created_at),
      drink.drink,
      drink.quantity.toString(),
      formatCurrency(drink.price),
      isDrinkPaid(drink.paid) ? labels.paidYes : labels.paidNo,
      drink.user || "—",
    ]),
  });

  doc.save(labels.fileNamePdf);
}

export function exportDrinksReportExcel(
  drinks: DrinkReportRow[],
  memberName: string,
  periodLabel: string,
  labels: ReportLabels
) {
  const summary = summarizeDrinksByType(drinks);
  const total = getTotalSpent(drinks);
  const wb = XLSX.utils.book_new();

  const wsSummary = XLSX.utils.aoa_to_sheet([
    [labels.title],
    [`${labels.member}: ${memberName}`],
    [`${labels.period}: ${periodLabel}`],
    [`${labels.totalSpent}: ${formatCurrency(total)}`],
    [],
    [labels.drink, labels.totalQuantity, labels.totalValue],
    ...summary.map((row) => [row.drink, row.quantity, row.total]),
  ]);
  XLSX.utils.book_append_sheet(wb, wsSummary, labels.sheetSummary);

  const wsDetails = XLSX.utils.aoa_to_sheet([
    [
      labels.date,
      labels.drink,
      labels.quantity,
      labels.value,
      labels.paid,
      labels.markedBy,
    ],
    ...drinks.map((drink) => [
      formatDateTime(drink.created_at),
      drink.drink,
      drink.quantity,
      parseFloat(drink.price.toString()),
      isDrinkPaid(drink.paid) ? labels.paidYes : labels.paidNo,
      drink.user || "—",
    ]),
  ]);
  XLSX.utils.book_append_sheet(wb, wsDetails, labels.sheetDetails);

  XLSX.writeFile(wb, labels.fileNameExcel);
}

export interface FinanceOverviewExportLabels {
  member: string;
  date: string;
  drink: string;
  quantity: string;
  value: string;
  paid: string;
  paidYes: string;
  paidNo: string;
  period: string;
  total: string;
  fileNameExcel: string;
  sheetDetails: string;
}

export function isDrinkPaid(paid: boolean | null | undefined): boolean {
  return paid === true;
}

function buildFinanceOverviewSheetRows(
  drinks: DrinkReportRow[],
  periodLabel: string,
  labels: FinanceOverviewExportLabels
) {
  const total = getTotalSpent(drinks);

  return [
    [`${labels.period}: ${periodLabel}`],
    [`${labels.total}: ${formatCurrency(total)}`],
    [],
    [
      labels.member,
      labels.date,
      labels.drink,
      labels.quantity,
      labels.value,
      labels.paid,
    ],
    ...drinks.map((drink) => [
      drink.name,
      formatDateTime(drink.created_at),
      drink.drink,
      drink.quantity,
      parseFloat(drink.price.toString()),
      isDrinkPaid(drink.paid) ? labels.paidYes : labels.paidNo,
    ]),
  ];
}

export function exportFinanceOverviewExcel(
  drinks: DrinkReportRow[],
  periodLabel: string,
  labels: FinanceOverviewExportLabels
) {
  const wb = XLSX.utils.book_new();
  const wsDetails = XLSX.utils.aoa_to_sheet(
    buildFinanceOverviewSheetRows(drinks, periodLabel, labels)
  );

  XLSX.utils.book_append_sheet(wb, wsDetails, labels.sheetDetails);
  XLSX.writeFile(wb, labels.fileNameExcel);
}

export interface MonthPeriod {
  year: number;
  month: number;
  key: string;
  label: string;
}

/** Months from start (inclusive) through end (inclusive). month is 1–12. */
export function listMonthPeriods(
  startYear: number,
  startMonth: number,
  endYear: number,
  endMonth: number,
  locale: string
): MonthPeriod[] {
  const formatter = new Intl.DateTimeFormat(locale, {
    month: "short",
    year: "numeric",
  });
  const periods: MonthPeriod[] = [];
  let year = startYear;
  let month = startMonth;

  while (year < endYear || (year === endYear && month <= endMonth)) {
    const date = new Date(year, month - 1, 1);
    const key = `${year}-${String(month).padStart(2, "0")}`;
    periods.push({
      year,
      month,
      key,
      label: formatter.format(date),
    });

    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }

  return periods;
}

function sanitizeSheetName(name: string, used: Set<string>): string {
  let base = name.replace(/[\\/?*[\]]/g, "").trim().slice(0, 31);
  if (!base) base = "Mes";

  let candidate = base;
  let suffix = 1;
  while (used.has(candidate)) {
    const suffixText = `_${suffix}`;
    candidate = `${base.slice(0, 31 - suffixText.length)}${suffixText}`;
    suffix += 1;
  }

  used.add(candidate);
  return candidate;
}

export function getDrinkMonthKeySaoPaulo(isoDate: string): string {
  const formatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
  });
  const parts = formatter.formatToParts(new Date(isoDate));
  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  return `${year}-${month}`;
}

export function exportFinanceOverviewFullExcel(
  drinks: DrinkReportRow[],
  periods: MonthPeriod[],
  labels: FinanceOverviewExportLabels
) {
  const wb = XLSX.utils.book_new();
  const usedNames = new Set<string>();
  const byMonth = new Map<string, DrinkReportRow[]>();

  for (const drink of drinks) {
    const key = getDrinkMonthKeySaoPaulo(drink.created_at);
    const list = byMonth.get(key) ?? [];
    list.push(drink);
    byMonth.set(key, list);
  }

  for (const period of periods) {
    const monthDrinks = (byMonth.get(period.key) ?? []).slice().sort((a, b) => {
      const nameCmp = a.name.localeCompare(b.name);
      if (nameCmp !== 0) return nameCmp;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    const ws = XLSX.utils.aoa_to_sheet(
      buildFinanceOverviewSheetRows(monthDrinks, period.label, labels)
    );
    XLSX.utils.book_append_sheet(
      wb,
      ws,
      sanitizeSheetName(period.label, usedNames)
    );
  }

  XLSX.writeFile(wb, labels.fileNameExcel);
}
