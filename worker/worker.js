/**
 * Night Shine Car Detailing — Cloudflare Worker
 * Worker name: nightshine-detailing-worker
 *
 * Bindings (set in the Cloudflare dashboard):
 *   DB                 → D1 database (shared detailing bookings DB)
 *   STRIPE_SECRET_KEY  → Secret (sk_live_… / sk_test_…)
 *   ALLOWED_ORIGINS    → (optional) comma-separated list, e.g. https://nightshinecardetailing.com,https://night-shine.pages.dev
 *   ADMIN_KEY          → (optional) secret required for GET /api/bookings and PATCH
 *
 * Routes:
 *   GET   /api/health
 *   GET   /api/availability?date=YYYY-MM-DD
 *   POST  /api/create-payment-intent   { service, addon, coupon, email, name }
 *   POST  /api/bookings                { date, time, service, name, phone, email, vehicle, address, notes, payment_status }
 *   GET   /api/bookings                (admin)
 *   PATCH /api/bookings/:id            (admin) PATCHABLE fields only
 */

const SOURCE = 'nightshine'
const ID_PREFIX = 'NSCD-'

// Prices in dollars — must match src/config/site.js
const PRICES = { basic: 150, premium: 200 }
const NAMES = { basic: 'Basic Detail', premium: 'Premium Detail' }
const ADDON_PRICE = 50
const COUPONS = { PREPAY: 15 }

const PATCHABLE = [
  'status', 'date', 'time', 'service', 'name', 'phone', 'email', 'vehicle', 'address', 'notes',
  'payment_status', 'reschedule_date', 'reschedule_time', 'original_date', 'original_time', 'notes2',
]

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    service TEXT,
    name TEXT,
    phone TEXT,
    email TEXT,
    vehicle TEXT,
    address TEXT,
    notes TEXT,
    source TEXT,
    created_at TEXT,
    status TEXT DEFAULT 'Confirmed',
    reschedule_date TEXT,
    reschedule_time TEXT,
    notes2 TEXT,
    original_date TEXT,
    original_time TEXT,
    payment_status TEXT DEFAULT 'Pay Later'
  )
`.replace(/\s+/g, ' ').trim()

let schemaReady = false
async function ensureSchema(db) {
  if (schemaReady) return
  await db.exec(SCHEMA)
  // Add columns that older copies of the shared table may be missing
  const cols = await db.prepare('PRAGMA table_info(bookings)').all()
  const have = new Set((cols.results || []).map((c) => c.name))
  const want = ['reschedule_date', 'reschedule_time', 'notes2', 'original_date', 'original_time', 'payment_status', 'source', 'status']
  for (const c of want) {
    if (!have.has(c)) {
      try { await db.exec(`ALTER TABLE bookings ADD COLUMN ${c} TEXT`) } catch (_) { /* ignore */ }
    }
  }
  schemaReady = true
}

/* ---------------- helpers ---------------- */
function corsHeaders(request, env) {
  const origin = request.headers.get('Origin') || '*'
  const allowed = (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean)
  const allow = !allowed.length || allowed.includes(origin) ? origin : allowed[0]
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Key',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
}

function json(data, status, cors) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', ...cors } })
}

const clean = (v, max = 300) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
const isDate = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v)
const isTime = (v) => /^(1[0-2]|[1-9]):[0-5]\d (AM|PM)$/.test(v)

function makeId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let s = ''
  const bytes = crypto.getRandomValues(new Uint8Array(6))
  for (const b of bytes) s += chars[b % chars.length]
  return ID_PREFIX + s
}

function isAdmin(request, env) {
  if (!env.ADMIN_KEY) return true // dashboard reads D1 directly; lock down by setting ADMIN_KEY
  const key = request.headers.get('X-Admin-Key') || (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '')
  return key === env.ADMIN_KEY
}

/* ---------------- Stripe (no D1 dependency) ---------------- */
async function createPaymentIntent(request, env, cors) {
  if (!env.STRIPE_SECRET_KEY) return json({ error: 'Payments are not configured.' }, 500, cors)
  const body = await request.json().catch(() => ({}))
  const service = clean(body.service, 20)
  if (!PRICES[service]) return json({ error: 'Unknown service.' }, 400, cors)

  const addon = Boolean(body.addon)
  const coupon = clean(body.coupon, 30).toUpperCase()
  const discount = COUPONS[coupon] || 0
  const dollars = Math.max(PRICES[service] + (addon ? ADDON_PRICE : 0) - discount, 1)
  const description = `${NAMES[service]}${addon ? ' + Exterior Wash' : ''} — Night Shine Car Detailing`

  const form = new URLSearchParams()
  form.append('amount', String(Math.round(dollars * 100)))
  form.append('currency', 'usd')
  form.append('automatic_payment_methods[enabled]', 'true')
  form.append('description', description)
  form.append('metadata[source]', SOURCE)
  form.append('metadata[service]', service)
  form.append('metadata[addon]', addon ? 'exterior' : 'none')
  if (discount) form.append('metadata[coupon]', coupon)
  const email = clean(body.email, 200)
  if (email) form.append('receipt_email', email)

  const res = await fetch('https://api.stripe.com/v1/payment_intents', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: form,
  })
  const data = await res.json()
  if (!res.ok) return json({ error: data?.error?.message || 'Stripe error' }, 502, cors)
  return json({ clientSecret: data.client_secret, amount: dollars }, 200, cors)
}

/* ---------------- D1 routes ---------------- */
async function availability(url, env, cors) {
  const date = url.searchParams.get('date') || ''
  if (!isDate(date)) return json({ error: 'Invalid date.' }, 400, cors)
  const { results } = await env.DB.prepare(
    `SELECT time FROM bookings WHERE date = ? AND source = ? AND (status IS NULL OR status NOT IN ('Cancelled','Canceled'))`
  ).bind(date, SOURCE).all()
  return json({ date, booked: (results || []).map((r) => r.time) }, 200, cors)
}

async function createBooking(request, env, cors) {
  const b = await request.json().catch(() => ({}))
  const rec = {
    date: clean(b.date, 10),
    time: clean(b.time, 8),
    service: clean(b.service, 120),
    name: clean(b.name, 120),
    phone: clean(b.phone, 30),
    email: clean(b.email, 200),
    vehicle: clean(b.vehicle, 120),
    address: clean(b.address, 250),
    notes: clean(b.notes, 500),
    payment_status: b.payment_status === 'Paid' ? 'Paid' : 'Pay Later',
  }
  if (!isDate(rec.date)) return json({ error: 'Please choose a valid date.' }, 400, cors)
  if (!isTime(rec.time)) return json({ error: 'Please choose a valid time.' }, 400, cors)
  for (const k of ['service', 'name', 'phone', 'email', 'vehicle', 'address']) {
    if (!rec[k]) return json({ error: `Missing ${k}.` }, 400, cors)
  }

  // Unpaid bookings can't take a slot that's already held. Paid ones always go in (customer has paid).
  if (rec.payment_status !== 'Paid') {
    const clash = await env.DB.prepare(
      `SELECT id FROM bookings WHERE date = ? AND time = ? AND source = ? AND (status IS NULL OR status NOT IN ('Cancelled','Canceled')) LIMIT 1`
    ).bind(rec.date, rec.time, SOURCE).first()
    if (clash) return json({ error: 'That time was just booked. Please choose another.' }, 409, cors)
  }

  const id = makeId()
  await env.DB.prepare(
    `INSERT INTO bookings (id, date, time, service, name, phone, email, vehicle, address, notes, source, created_at, status, payment_status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id, rec.date, rec.time, rec.service, rec.name, rec.phone, rec.email, rec.vehicle, rec.address, rec.notes,
    SOURCE, new Date().toISOString(), 'Confirmed', rec.payment_status
  ).run()

  return json({ id }, 201, cors)
}

async function listBookings(request, env, cors) {
  if (!isAdmin(request, env)) return json({ error: 'Unauthorized' }, 401, cors)
  const { results } = await env.DB.prepare(
    `SELECT * FROM bookings WHERE source = ? ORDER BY date DESC, time DESC LIMIT 500`
  ).bind(SOURCE).all()
  return json({ bookings: results || [] }, 200, cors)
}

async function patchBooking(request, env, cors, id) {
  if (!isAdmin(request, env)) return json({ error: 'Unauthorized' }, 401, cors)
  const body = await request.json().catch(() => ({}))
  const keys = Object.keys(body).filter((k) => PATCHABLE.includes(k))
  if (!keys.length) return json({ error: 'Nothing to update.' }, 400, cors)
  if (keys.includes('payment_status') && !['Paid', 'Pay Later'].includes(body.payment_status)) {
    return json({ error: "payment_status must be 'Paid' or 'Pay Later'." }, 400, cors)
  }
  const sets = keys.map((k) => `${k} = ?`).join(', ')
  const vals = keys.map((k) => (body[k] == null ? null : String(body[k]).slice(0, 500)))
  const r = await env.DB.prepare(`UPDATE bookings SET ${sets} WHERE id = ? AND source = ?`).bind(...vals, id, SOURCE).run()
  if (!r.meta?.changes) return json({ error: 'Not found' }, 404, cors)
  return json({ ok: true }, 200, cors)
}

/* ---------------- router ---------------- */
export default {
  async fetch(request, env) {
    const cors = corsHeaders(request, env)
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors })

    const url = new URL(request.url)
    const path = url.pathname.replace(/\/+$/, '')

    try {
      if (path === '/api/health') return json({ ok: true, source: SOURCE }, 200, cors)

      // Payment route must never wait on D1 — schema init is skipped here on purpose.
      if (path === '/api/create-payment-intent' && request.method === 'POST') {
        return await createPaymentIntent(request, env, cors)
      }

      if (!env.DB) return json({ error: 'Database not bound.' }, 500, cors)
      await ensureSchema(env.DB)

      if (path === '/api/availability' && request.method === 'GET') return await availability(url, env, cors)
      if (path === '/api/bookings' && request.method === 'POST') return await createBooking(request, env, cors)
      if (path === '/api/bookings' && request.method === 'GET') return await listBookings(request, env, cors)

      const m = path.match(/^\/api\/bookings\/([A-Za-z0-9-]+)$/)
      if (m && request.method === 'PATCH') return await patchBooking(request, env, cors, m[1])

      return json({ error: 'Not found' }, 404, cors)
    } catch (err) {
      return json({ error: err?.message || 'Server error' }, 500, cors)
    }
  },
}
