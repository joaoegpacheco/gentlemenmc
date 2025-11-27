/**
 * Utilities for exporting data to CSV, Excel, and PDF
 */

/**
 * Convert array of objects to CSV
 */
export function arrayToCSV<T extends Record<string, any>>(
  data: T[],
  columns?: { key: keyof T; label: string }[]
): string {
  if (data.length === 0) return '';

  // Determine columns
  const cols = columns || Object.keys(data[0]).map((key) => ({ key, label: key }));

  // Create header row
  const header = cols.map((col) => `"${col.label}"`).join(',');

  // Create data rows
  const rows = data.map((row) => {
    return cols
      .map((col) => {
        const value = row[col.key];
        if (value === null || value === undefined) return '""';
        if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`;
        return `"${String(value)}"`;
      })
      .join(',');
  });

  return [header, ...rows].join('\n');
}

/**
 * Download CSV file
 */
export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Export data to CSV
 */
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  filename: string,
  columns?: { key: keyof T; label: string }[]
): void {
  const csv = arrayToCSV(data, columns);
  downloadCSV(csv, filename);
}

/**
 * Parse CSV file
 */
export function parseCSV(csvText: string): Record<string, string>[] {
  const lines = csvText.split('\n').filter((line) => line.trim());
  if (lines.length === 0) return [];

  // Parse header
  const headers = lines[0].split(',').map((h) => h.replace(/"/g, '').trim());

  // Parse rows
  return lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.replace(/"/g, '').trim());
    return headers.reduce((obj, header, index) => {
      obj[header] = values[index] || '';
      return obj;
    }, {} as Record<string, string>);
  });
}

/**
 * Read CSV file from File input
 */
export async function readCSVFile(file: File): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = parseCSV(text);
        resolve(data);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
}

/**
 * Export table to Excel-compatible format
 * (Using CSV format which Excel can open)
 */
export function exportToExcel<T extends Record<string, any>>(
  data: T[],
  filename: string,
  columns?: { key: keyof T; label: string }[]
): void {
  // Excel can open CSV files
  exportToCSV(data, filename, columns);
}

/**
 * Format value for export
 */
export function formatExportValue(value: any): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

/**
 * Prepare data for export (format all values)
 */
export function prepareDataForExport<T extends Record<string, any>>(
  data: T[]
): Record<string, string>[] {
  return data.map((row) => {
    const formatted: Record<string, string> = {};
    for (const key in row) {
      formatted[key] = formatExportValue(row[key]);
    }
    return formatted;
  });
}

