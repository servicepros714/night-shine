import { SOURCE, ID_PREFIX, PACKAGES, ADDON, PREPAY_CODE, PREPAY_DISCOUNT } from '../config/site'

const RAW = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
export const API_URL = RAW && !RAW.includes('REPLACE_ME') ? RAW : ''
export const API_LIVE = Boolean(API_URL)

const LOCAL_KEY = 'nightshine_bookings'

/* ---------- pricing (mirrors the Worker) ---------- */
export function priceFor({ packageId, addon, coupon }) {
  const pkg = PACKAGES.find((p) => p.id === packageId)
  const subtotal = (pkg?.price || 0) + (addon ? ADDON.price : 0)
  const discount = coupon && coupon.toUpperCase() === PREPAY_CODE ? PREPAY_DISCOUNT : 0
  return { subtotal, discount, total: Math.max(subtotal - discount, 0) }
}

export function serviceLabel(packageId, addon) {
  const pkg = PACKAGES.find((p) => p.id === packageId)
  return pkg ? `${pkg.name}${addon ? ` + ${ADDON.name}` : ''}` : ''
}

/* ---------- local fallback (preview without a Worker) ---------- */
function readLocal() {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]') } catch { return [] }
}
function writeLocal(list) {
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(list)) } catch { /* ignore */ }
}

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.error || `Request failed (${res.status})`)
    err.status = res.status
    throw err
  }
  return data
}

/* ---------- public API ---------- */
export async function getBookedTimes(date) {
  if (!API_LIVE) {
    return readLocal().filter((b) => b.date === date && b.status !== 'Cancelled').map((b) => b.time)
  }
  const data = await request(`/api/availability?date=${encodeURIComponent(date)}&source=${SOURCE}`)
  return data.booked || []
}

export async function createPaymentIntent({ packageId, addon, coupon, email, name }) {
  if (!API_LIVE) throw new Error('Online payment is not connected yet.')
  return request('/api/create-payment-intent', {
    method: 'POST',
    body: JSON.stringify({ service: packageId, addon: Boolean(addon), coupon: coupon || '', email, name, source: SOURCE }),
  })
}

export async function createBooking(booking) {
  const payload = { ...booking, source: SOURCE }
  if (!API_LIVE) {
    const list = readLocal()
    const clash = list.find((b) => b.date === payload.date && b.time === payload.time && b.status !== 'Cancelled')
    if (clash && payload.payment_status !== 'Paid') {
      const e = new Error('That time was just taken. Please pick another slot.'); e.status = 409; throw e
    }
    const id = `${ID_PREFIX}${Date.now().toString(36).toUpperCase().slice(-6)}`
    const record = { id, ...payload, status: 'Confirmed', created_at: new Date().toISOString() }
    list.push(record)
    writeLocal(list)
    return { id }
  }
  return request('/api/bookings', { method: 'POST', body: JSON.stringify(payload) })
}

/* ---------- draft booking handed from /book to /checkout ---------- */
const DRAFT_KEY = 'nightshine_draft'
export function saveDraft(d) { try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify(d)) } catch { /* ignore */ } }
export function loadDraft() { try { return JSON.parse(sessionStorage.getItem(DRAFT_KEY) || 'null') } catch { return null } }
export function clearDraft() { try { sessionStorage.removeItem(DRAFT_KEY) } catch { /* ignore */ } }

const DONE_KEY = 'nightshine_confirmed'
export function saveConfirmed(d) { try { sessionStorage.setItem(DONE_KEY, JSON.stringify(d)) } catch { /* ignore */ } }
export function loadConfirmed() { try { return JSON.parse(sessionStorage.getItem(DONE_KEY) || 'null') } catch { return null } }
