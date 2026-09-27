import { SLOT_START_HOUR, SLOT_END_HOUR, LEAD_TIME_HOURS, BOOKING_WINDOW_DAYS } from '../config/site'

const TZ = 'America/Los_Angeles'

/** Current wall-clock time in California as plain numbers. */
export function caNow() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(new Date())
  const get = (t) => Number(parts.find((p) => p.type === t)?.value)
  const hour = get('hour') % 24
  return { y: get('year'), m: get('month'), d: get('day'), hour, minute: get('minute') }
}

export const pad = (n) => String(n).padStart(2, '0')
export const toKey = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`

export function todayKey() {
  const n = caNow()
  return toKey(n.y, n.m, n.d)
}

/** Parse 'YYYY-MM-DD' into a local Date at noon (safe from DST edges). */
export function keyToDate(key) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d, 12)
}

export function dateToKey(dt) {
  return toKey(dt.getFullYear(), dt.getMonth() + 1, dt.getDate())
}

export function addDays(key, n) {
  const dt = keyToDate(key)
  dt.setDate(dt.getDate() + n)
  return dateToKey(dt)
}

export function formatLong(key) {
  return keyToDate(key).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

export function formatShort(key) {
  return keyToDate(key).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export function hourLabel(h) {
  const suffix = h >= 12 ? 'PM' : 'AM'
  const hh = h % 12 === 0 ? 12 : h % 12
  return `${hh}:00 ${suffix}`
}

/** All slot labels for a day. */
export function allSlots() {
  const out = []
  for (let h = SLOT_START_HOUR; h <= SLOT_END_HOUR; h++) out.push({ hour: h, label: hourLabel(h) })
  return out
}

/** Minutes-since-midnight (CA) of the earliest bookable time for today. */
function earliestTodayMinutes() {
  const n = caNow()
  return n.hour * 60 + n.minute + LEAD_TIME_HOURS * 60
}

/** Slots on `key` that are not in the past / inside the lead-time window. */
export function openSlotsFor(key) {
  const tk = todayKey()
  if (key < tk) return []
  const slots = allSlots()
  if (key !== tk) {
    // If lead time spills past midnight, trim tomorrow's early slots too
    const spill = earliestTodayMinutes() - 24 * 60
    if (key === addDays(tk, 1) && spill > 0) return slots.filter((s) => s.hour * 60 >= spill)
    return slots
  }
  const min = earliestTodayMinutes()
  return slots.filter((s) => s.hour * 60 >= min)
}

export function isDayBookable(key) {
  const tk = todayKey()
  if (key < tk) return false
  if (key > addDays(tk, BOOKING_WINDOW_DAYS)) return false
  return openSlotsFor(key).length > 0
}

export function firstBookableDay() {
  let k = todayKey()
  for (let i = 0; i < 7; i++) {
    if (isDayBookable(k)) return k
    k = addDays(k, 1)
  }
  return k
}
