import { format, isValid } from 'date-fns'

export const formatExactDate = (
  dateString: string,
  formatString: string = 'dd-MM-yyyy',
) => {
  const date = new Date(dateString)
  if (!isValid(date)) return '-'
  return format(date, formatString)
}

export const isValidDDMMYYYY = (dateStr: string): boolean => {
  if (!dateStr) return false
  const regex = /^(\d{2})[-/](\d{2})[-/](\d{4})$/
  const match = dateStr.match(regex)
  if (!match) return false
  const day = parseInt(match[1], 10)
  const month = parseInt(match[2], 10)
  const year = parseInt(match[3], 10)
  if (month < 1 || month > 12) return false
  if (day < 1 || day > 31) return false

  const date = new Date(year, month - 1, day)
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  )
}

/** Normalizes and formats any date string/object into dd-mm-yyyy format. */
export function formatToDDMMYYYY(val: any): string {
  if (!val) return '-'
  const str = String(val).trim()
  if (str === '-' || str === '') return '-'

  // If it's already dd-mm-yyyy
  if (/^\d{2}-\d{2}-\d{4}$/.test(str)) {
    return str
  }

  // If it is dd/mm/yyyy, convert to dd-mm-yyyy
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
    return str.replace(/\//g, '-')
  }

  // If it is yyyy-mm-dd (with or without time)
  const yyyymmddMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (yyyymmddMatch) {
    const [_, y, m, d] = yyyymmddMatch
    return `${d}-${m}-${y}`
  }

  // If it is yyyy/mm/dd
  const yyyymmddSlashMatch = str.match(/^(\d{4})\/(\d{2})\/(\d{2})/)
  if (yyyymmddSlashMatch) {
    const [_, y, m, d] = yyyymmddSlashMatch
    return `${d}-${m}-${y}`
  }

  // Fallback to new Date parsing
  try {
    const parsed = new Date(str)
    if (!isNaN(parsed.getTime())) {
      const d = String(parsed.getDate()).padStart(2, '0')
      const m = String(parsed.getMonth() + 1).padStart(2, '0')
      const y = parsed.getFullYear()
      return `${d}-${m}-${y}`
    }
  } catch {}

  return str
}

export function formatCreationTimestamp(ts?: string | null): string {
  if (!ts || ts === '—') return '—'
  const clean = String(ts).trim()
  if (!clean) return '—'

  const monthMap: Record<string, number> = {
    jan: 0,
    feb: 1,
    mar: 2,
    apr: 3,
    may: 4,
    jun: 5,
    jul: 6,
    aug: 7,
    sep: 8,
    oct: 9,
    nov: 10,
    dec: 11,
  }

  let year: number | null = null
  let month: number | null = null
  let day: number | null = null
  let hour = 0
  let min = 0
  let sec = 0

  // 1. Matches text months: "11 November 2026 11:16", "11 Nov 2026, 11:16:30", etc.
  const textMonthMatch = clean.match(
    /(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})(?:[,\s]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/i,
  )

  if (textMonthMatch) {
    day = parseInt(textMonthMatch[1], 10)
    const monthKey = textMonthMatch[2].toLowerCase().substring(0, 3)
    month = monthMap[monthKey] ?? 0
    year = parseInt(textMonthMatch[3], 10)
    hour = textMonthMatch[4] ? parseInt(textMonthMatch[4], 10) : 0
    min = textMonthMatch[5] ? parseInt(textMonthMatch[5], 10) : 0
    sec = textMonthMatch[6] ? parseInt(textMonthMatch[6], 10) : 0
  }

  // 2. Matches DD/MM/YYYY or DD-MM-YYYY
  if (year === null) {
    const dmyMatch = clean.match(
      /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:[,\s]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/,
    )
    if (dmyMatch) {
      day = parseInt(dmyMatch[1], 10)
      month = parseInt(dmyMatch[2], 10) - 1
      year = parseInt(dmyMatch[3], 10)
      hour = dmyMatch[4] ? parseInt(dmyMatch[4], 10) : 0
      min = dmyMatch[5] ? parseInt(dmyMatch[5], 10) : 0
      sec = dmyMatch[6] ? parseInt(dmyMatch[6], 10) : 0
    }
  }

  // 3. Matches YYYY-MM-DD
  if (year === null) {
    const ymdMatch = clean.match(
      /^(\d{4})[/-](\d{1,2})[/-](\d{1,2})(?:[,\s]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/,
    )
    if (ymdMatch) {
      year = parseInt(ymdMatch[1], 10)
      month = parseInt(ymdMatch[2], 10) - 1
      day = parseInt(ymdMatch[3], 10)
      hour = ymdMatch[4] ? parseInt(ymdMatch[4], 10) : 0
      min = ymdMatch[5] ? parseInt(ymdMatch[5], 10) : 0
      sec = ymdMatch[6] ? parseInt(ymdMatch[6], 10) : 0
    }
  }

  // If a pattern matched, calculate the offset using UTC
  if (year !== null && month !== null && day !== null) {
    const utcTime = Date.UTC(year, month, day, hour, min, sec)
    // Add 5 hours and 30 minutes (5.5 * 60 * 60 * 1000 ms)
    const offsetMs = (5 * 60 + 30) * 60 * 1000
    const targetDate = new Date(utcTime + offsetMs)

    const d = String(targetDate.getUTCDate()).padStart(2, '0')
    const m = String(targetDate.getUTCMonth() + 1).padStart(2, '0')
    const y = targetDate.getUTCFullYear()

    const h24 = targetDate.getUTCHours()
    const period = h24 >= 12 ? 'PM' : 'AM'
    const h12 = h24 % 12 === 0 ? 12 : h24 % 12
    const h12Str = String(h12).padStart(2, '0')
    const minsStr = String(targetDate.getUTCMinutes()).padStart(2, '0')
    const secsStr = String(targetDate.getUTCSeconds()).padStart(2, '0')

    return `${d}/${m}/${y}, ${h12Str}:${minsStr}:${secsStr} ${period}`
  }

  return clean
}
