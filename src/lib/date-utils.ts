/**
 * Utility functions for Indian Standard Time (IST) formatting in the frontend.
 * Safely handles MongoDB UTC ISO strings (with or without 'Z').
 */

/**
 * Ensures a UTC timestamp has a trailing 'Z' or timezone offset.
 * Python/Motor often serializes UTC naive datetimes without 'Z'
 * (e.g. '2026-10-12T07:40:38.885000').
 * Without 'Z', browsers parse it as local time instead of UTC, causing timezone offset math to fail.
 */
export function ensureUTC(isoString?: string | null): string {
  if (!isoString) return '';
  const trimmed = String(isoString).trim();
  if (!trimmed) return '';
  if (trimmed.endsWith('Z') || /[+-]\d{2}:?\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  return `${trimmed}Z`;
}

/**
 * Safely parses an ISO string into a Date object, guaranteeing UTC interpretation.
 */
export function parseUTCDate(isoString?: string | null): Date | null {
  if (!isoString) return null;
  const d = new Date(ensureUTC(isoString));
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Returns formatted short time in IST (e.g., "1:10 pm")
 */
export function formatISTTime(isoString?: string | null): string {
  const d = parseUTCDate(isoString);
  if (!d) return '';
  return d
    .toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
    .toLowerCase();
}

/**
 * Returns full date and time in IST (e.g., "12 Oct 2026, 1:10:38 pm")
 */
export function formatFullIST(isoString?: string | null): string {
  const d = parseUTCDate(isoString);
  if (!d) return '';
  return d.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

/**
 * Formats a message's status_history array into an IST breakdown for tooltips
 */
export function formatStatusHistoryIST(
  statusHistory?: Array<{ status: string; timestamp: string; error?: any }>
): string {
  if (!statusHistory || !statusHistory.length) return '';
  return statusHistory
    .map((item) => {
      const timeStr = formatFullIST(item.timestamp);
      const label =
        item.status === 'sent_to_meta'
          ? 'Sent'
          : item.status === 'sent'
          ? 'Sent to WhatsApp'
          : item.status.charAt(0).toUpperCase() + item.status.slice(1);
      return `${label}: ${timeStr}`;
    })
    .join('\n');
}
