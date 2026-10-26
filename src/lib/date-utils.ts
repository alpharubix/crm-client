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
  if (!isoString) return ''
  const trimmed = String(isoString).trim()
  if (!trimmed) return ''
  if (trimmed.endsWith('Z') || /[+-]\d{2}:?\d{2}$/.test(trimmed)) {
    return trimmed
  }
  return `${trimmed}Z`
}

/**
 * Safely parses an ISO string into a Date object, guaranteeing UTC interpretation.
 */
export function parseUTCDate(isoString?: string | null): Date | null {
  if (!isoString) return null
  const d = new Date(ensureUTC(isoString))
  return isNaN(d.getTime()) ? null : d
}

/**
 * Returns formatted short time in IST (e.g., "1:10 pm")
 */
export function formatISTTime(isoString?: string | null): string {
  const d = parseUTCDate(isoString)
  if (!d) return ''
  return d
    .toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
    .toLowerCase()
}

/**
 * Returns full date and time in IST (e.g., "12 Oct 2026, 1:10:38 pm")
 */
export function formatFullIST(isoString?: string | null): string {
  const d = parseUTCDate(isoString)
  if (!d) return ''
  return d.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  })
}

/**
 * Formats a message's status_history array into an IST breakdown for tooltips
 */
export function formatStatusHistoryIST(
  statusHistory?: Array<{ status: string; timestamp: string; error?: any }>,
): string {
  if (!statusHistory || !statusHistory.length) return ''
  return statusHistory
    .map((item) => {
      const timeStr = formatFullIST(item.timestamp)
      const label =
        item.status === 'sent_to_meta'
          ? 'Sent'
          : item.status === 'sent'
            ? 'Sent to WhatsApp'
            : item.status.charAt(0).toUpperCase() + item.status.slice(1)
      return `${label}: ${timeStr}`
    })
    .join('\n')
}

/**
 * Safely formats UTC or already-IST timestamps into 12-hour IST Date & Time.
 * @param {string | number | Date} input - Timestamp input
 * @param {boolean} assumeIST - Set to true if unmarked strings (e.g. "2026-10-26 12:40:00") are already in IST
 */
/**
 * Universal UTC & IST Timestamp Formatter for React
 * Safely handles ISO UTC strings, DD/MM/YYYY strings, Unix epochs, and Date objects.
 */
export function formatToIST(
  input: string | number | Date | null | undefined,
  assumeIST: boolean = false,
): string {
  if (input === null || input === undefined || input === '') {
    return '-' // Safe fallback for empty table cells
  }

  let parsedInput: string | number | Date = input

  if (typeof input === 'string') {
    let str = input.trim()

    // 1. Handle DD/MM/YYYY or DD-MM-YYYY formats (e.g., "26/10/2026 12:44:58" or "26/10/2026, 12:44:58 pm")
    const dmyMatch = str.match(
      /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:,?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*(AM|PM))?)?(?:\s*IST)?$/i,
    )

    if (dmyMatch) {
      const [
        ,
        day,
        month,
        year,
        rawHour = '00',
        minute = '00',
        second = '00',
        meridiem,
      ] = dmyMatch
      let hour = parseInt(rawHour, 10)

      // Convert 12-hour AM/PM to 24-hour if present
      if (meridiem) {
        const isPM = meridiem.toUpperCase() === 'PM'
        if (isPM && hour < 12) hour += 12
        if (!isPM && hour === 12) hour = 0
      }

      const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
      const isoTime = `${String(hour).padStart(2, '0')}:${minute}:${second}`

      // DD/MM/YYYY in Indian apps is almost always already IST (+05:30).
      parsedInput = `${isoDate}T${isoTime}+05:30`
    } else {
      // 2. Standard ISO / SQL strings (e.g., "2026-10-23T15:20:03.546000")
      if (/IST$/i.test(str)) {
        str = str.replace(/\s*IST$/i, '+05:30').replace(' ', 'T')
      } else if (!str.endsWith('Z') && !/[+-]\d{2}:?\d{2}$/.test(str)) {
        str = str.replace(' ', 'T') + (assumeIST ? '+05:30' : 'Z')
      }

      // Trim 6-digit Python microseconds (.546000) to 3-digit milliseconds (.546) for strict browsers
      str = str.replace(/(\.\d{3})\d+/, '$1')
      parsedInput = str
    }
  }

  const date = new Date(parsedInput)

  // Never throw inside a React render loop — log a warning and return the raw string instead
  if (isNaN(date.getTime())) {
    console.warn('[formatToIST] Could not parse timestamp:', input)
    return String(input)
  }

  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    // timeZoneName: 'short',
  }).format(date)
}


/**
 * WhatsApp-style Relative Timestamp Formatter (in IST)
 */
export function formatWhatsAppTime(
  input: string | number | Date | null | undefined,
  assumeIST: boolean = false,
): string {
  if (input === null || input === undefined || input === '') {
    return '-'
  }

  let parsedInput: string | number | Date = input

  if (typeof input === 'string') {
    let str = input.trim()

    // 1. Handle DD/MM/YYYY or DD-MM-YYYY formats (e.g., "26/10/2026 12:44:58")
    const dmyMatch = str.match(
      /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:,?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*(AM|PM))?)?(?:\s*IST)?$/i,
    )

    if (dmyMatch) {
      const [
        ,
        day,
        month,
        year,
        rawHour = '00',
        minute = '00',
        second = '00',
        meridiem,
      ] = dmyMatch
      let hour = parseInt(rawHour, 10)

      if (meridiem) {
        const isPM = meridiem.toUpperCase() === 'PM'
        if (isPM && hour < 12) hour += 12
        if (!isPM && hour === 12) hour = 0
      }

      const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
      const isoTime = `${String(hour).padStart(2, '0')}:${minute}:${second}`

      parsedInput = `${isoDate}T${isoTime}+05:30`
    } else {
      // 2. Standard ISO / SQL strings (e.g., "2026-10-23T15:20:03.546000")
      if (/IST$/i.test(str)) {
        str = str.replace(/\s*IST$/i, '+05:30').replace(' ', 'T')
      } else if (!str.endsWith('Z') && !/[+-]\d{2}:?\d{2}$/.test(str)) {
        str = str.replace(' ', 'T') + (assumeIST ? '+05:30' : 'Z')
      }

      str = str.replace(/(\.\d{3})\d+/, '$1')
      parsedInput = str
    }
  }

  const date = new Date(parsedInput)

  if (isNaN(date.getTime())) {
    console.warn('[formatWhatsAppTime] Could not parse timestamp:', input)
    return String(input)
  }

  // Compare calendar days in IST (YYYY-MM-DD)
  const istDateFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  const targetDateStr = istDateFormatter.format(date)
  const todayDateStr = istDateFormatter.format(new Date())

  const targetMidnight = new Date(`${targetDateStr}T00:00:00Z`).getTime()
  const todayMidnight = new Date(`${todayDateStr}T00:00:00Z`).getTime()
  const diffDays = Math.round(
    (todayMidnight - targetMidnight) / (1000 * 60 * 60 * 24),
  )

  // 1. Today -> Show only time (e.g., "12:44 pm")
  if (diffDays === 0) {
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date)
  }

  // 2. Yesterday -> Show "Yesterday"
  if (diffDays === 1) {
    return 'Yesterday'
  }

  // 3. Within the last 7 days -> Show Weekday name ("Monday", "Tuesday", etc.)
  if (diffDays > 1 && diffDays < 7) {
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      weekday: 'long',
    }).format(date)
  }

  // 4. Older than a week -> Show date ("10/10/2026")
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}