import { format, isValid } from 'date-fns'

export const formatExactDate = (
  dateString: string,
  formatString: string = 'dd-MM-yyyy'
) => {
  const date = new Date(dateString)
  if (!isValid(date)) return '-'
  return format(date, formatString)
}

export const isValidDDMMYYYY = (dateStr: string): boolean => {
  if (!dateStr) return false;
  const regex = /^(\d{2})[-/](\d{2})[-/](\d{4})$/;
  const match = dateStr.match(regex);
  if (!match) return false;
  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const year = parseInt(match[3], 10);
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
};

/** Normalizes and formats any date string/object into dd-mm-yyyy format. */
export function formatToDDMMYYYY(val: any): string {
  if (!val) return "-";
  const str = String(val).trim();
  if (str === "-" || str === "") return "-";

  // If it's already dd-mm-yyyy
  if (/^\d{2}-\d{2}-\d{4}$/.test(str)) {
    return str;
  }

  // If it is dd/mm/yyyy, convert to dd-mm-yyyy
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
    return str.replace(/\//g, "-");
  }

  // If it is yyyy-mm-dd (with or without time)
  const yyyymmddMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (yyyymmddMatch) {
    const [_, y, m, d] = yyyymmddMatch;
    return `${d}-${m}-${y}`;
  }

  // If it is yyyy/mm/dd
  const yyyymmddSlashMatch = str.match(/^(\d{4})\/(\d{2})\/(\d{2})/);
  if (yyyymmddSlashMatch) {
    const [_, y, m, d] = yyyymmddSlashMatch;
    return `${d}-${m}-${y}`;
  }

  // Fallback to new Date parsing
  try {
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
      const d = String(parsed.getDate()).padStart(2, '0');
      const m = String(parsed.getMonth() + 1).padStart(2, '0');
      const y = parsed.getFullYear();
      return `${d}-${m}-${y}`;
    }
  } catch {}

  return str;
}
