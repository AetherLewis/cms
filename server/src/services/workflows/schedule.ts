import type { WorkflowFrequency } from './types'

export const FALLBACK_TIME_ZONE = 'UTC'

interface WallClock {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
}

export function isValidTimeZone(timeZone: unknown): boolean {
  if (typeof timeZone !== 'string' || !timeZone.trim()) return false
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: timeZone.trim() })
    return true
  } catch {
    return false
  }
}

export function timeZoneOrDefault(timeZone: unknown): string {
  return typeof timeZone === 'string' && isValidTimeZone(timeZone.trim()) ? timeZone.trim() : FALLBACK_TIME_ZONE
}

/** Wall-clock components of an instant in the given IANA timezone. */
export function zonedWallClock(date: Date, timeZone: string): WallClock {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  const parts: Record<string, string> = {}
  for (const part of formatter.formatToParts(date)) {
    if (part.type !== 'literal') parts[part.type] = part.value
  }
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour) % 24,
    minute: Number(parts.minute),
    second: Number(parts.second),
  }
}

/** Offset in milliseconds to add to an instant to obtain its wall clock in `timeZone`. */
function zoneOffsetMs(date: Date, timeZone: string): number {
  const wall = zonedWallClock(date, timeZone)
  const asUtc = Date.UTC(wall.year, wall.month - 1, wall.day, wall.hour, wall.minute, wall.second)
  return asUtc - date.getTime()
}

/** Convert a wall-clock time in `timeZone` into the matching UTC instant. */
export function wallClockToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string,
): Date {
  const guess = Date.UTC(year, month - 1, day, hour, minute)
  let result = new Date(guess - zoneOffsetMs(new Date(guess), timeZone))
  const correction = new Date(guess - zoneOffsetMs(result, timeZone))
  if (Math.abs(correction.getTime() - result.getTime()) < 3_600_000) result = correction
  return result
}

export function parseRunTime(runTime: unknown): { hour: number; minute: number } | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(runTime ?? '').trim())
  if (!match) return null
  const hour = Number(match[1])
  const minute = Number(match[2])
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null
  return { hour, minute }
}

function addPeriod(year: number, month: number, day: number, frequency: WorkflowFrequency) {
  if (frequency === 'daily' || frequency === 'weekly') {
    const base = new Date(Date.UTC(year, month - 1, day))
    base.setUTCDate(base.getUTCDate() + (frequency === 'weekly' ? 7 : 1))
    return { year: base.getUTCFullYear(), month: base.getUTCMonth() + 1, day: base.getUTCDate() }
  }
  const nextMonthIndex = month // month is 1-based; index of the following month
  const targetYear = year + Math.floor(nextMonthIndex / 12)
  const targetMonth = (nextMonthIndex % 12) + 1
  const lastDay = new Date(Date.UTC(targetYear, targetMonth, 0)).getUTCDate()
  return { year: targetYear, month: targetMonth, day: Math.min(day, lastDay) }
}

/**
 * Next instant at or after `from` that matches the workflow's frequency and local run time.
 */
export function computeNextRunAt(
  frequency: WorkflowFrequency,
  runTime: string,
  timeZone: string,
  from: Date,
): Date | null {
  const parsed = parseRunTime(runTime)
  if (!parsed) return null
  const zone = timeZoneOrDefault(timeZone)
  const today = zonedWallClock(from, zone)
  let { year, month, day } = today
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const candidate = wallClockToUtc(year, month, day, parsed.hour, parsed.minute, zone)
    if (candidate.getTime() > from.getTime()) return candidate
    const next = addPeriod(year, month, day, frequency)
    year = next.year
    month = next.month
    day = next.day
  }
  return null
}

/** Local calendar day (YYYY-MM-DD) used for per-day idempotency keys. */
export function dateKeyInZone(date: Date, timeZone: string): string {
  const wall = zonedWallClock(date, timeZoneOrDefault(timeZone))
  return `${wall.year}-${String(wall.month).padStart(2, '0')}-${String(wall.day).padStart(2, '0')}`
}

/** Local calendar month (YYYY-MM) used for per-period idempotency keys. */
export function periodKeyInZone(date: Date, timeZone: string): string {
  const wall = zonedWallClock(date, timeZoneOrDefault(timeZone))
  return `${wall.year}-${String(wall.month).padStart(2, '0')}`
}
