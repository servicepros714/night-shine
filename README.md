# Night Shine Car Detailing — San Clemente, CA

Vite + React booking site with a Cloudflare Worker (D1 bookings) and Stripe PaymentIntents.

| Item | Value |
|---|---|
| Phone | (714) 844-1247 |
| Source tag | `nightshine` |
| Booking ID prefix | `NSCD-` |
| Worker name | `nightshine-detailing-worker` |
| Pages project | `night-shine-car-detailing` |
| Booking hours | 7:00 AM – 7:00 PM hourly, Mon–Sun, earliest slot 4 hrs after current California time |
| Prepay coupon | `PREPAY` = $15 off (online payment only) |

**Brand palette (from the crest):** Night `#0B0C0E` · Gunmetal `#1A1D21` · Steel `#2C3036` · Chrome `#C9CDD3` · Crimson `#8E0A1C` · Signal Red `#D0283A`
**Fonts:** Anton (display) · Manrope (body) · Space Mono (labels)
**Layout:** centered-crest split nav with red info rail · stacked outline/chrome hero with hex-shield photo · angled red ticker · sticky-intro spec-sheet services · hex-badge process track · bento gallery (swipe carousel on mobile) · Basic vs Premium comparison table · FAQ split · outlined wordmark footer.

---

## 1. Local

```cmd
cd night-shine
npm install
npm run dev
```

Without a Worker URL in `.env.local`, bookings save to the browser (preview mode) and checkout shows only "I'll pay later".

## 2. Worker (Cloudflare dashboard)

1. **Workers & Pages → Create → Worker** → name `nightshine-detailing-worker` → paste `worker/worker.js` → Deploy.
2. **Settings → Bindings → D1** → variable name `DB` → pick the shared detailing bookings database for the chosen account.
3. **Settings → Variables and Secrets** → add secret `STRIPE_SECRET_KEY`.
   Optional: `ALLOWED_ORIGINS` (comma-separated site URLs) and `ADMIN_KEY`.
4. Open `https://nightshine-detailing-worker.<account>.workers.dev/api/health` → should return `{"ok":true,"source":"nightshine"}`.

The table is created automatically (`IF NOT EXISTS`) on the first non-payment request. `worker/schema.sql` is there if you prefer to run it in the D1 console.

## 3. Frontend env

Edit `.env.local` (committed on purpose — publishable key only):

```
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
VITE_API_URL=https://nightshine-detailing-worker.<account>.workers.dev
```

## 4. GitHub → Cloudflare Pages

```cmd
git init
git add .
git commit -m "Night Shine Car Detailing site"
git branch -M main
git remote add origin https://github.com/servicepros714/night-shine-car-detailing.git
git push -u origin main
```

Repo **Settings → Secrets and variables → Actions**: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.
Every push to `main` builds and deploys via `.github/workflows/deploy.yml`. SPA routing is handled by `public/_redirects`.

## Worker API

| Method | Path | Notes |
|---|---|---|
| GET | `/api/availability?date=YYYY-MM-DD` | Booked times for `source = 'nightshine'` |
| POST | `/api/create-payment-intent` | Price computed server-side; never touches D1 |
| POST | `/api/bookings` | `payment_status` is `'Paid'` or `'Pay Later'` |
| GET | `/api/bookings` | Admin (uses `ADMIN_KEY` if set) |
| PATCH | `/api/bookings/:id` | Admin; PATCHABLE incl. `reschedule_date, reschedule_time, original_date, original_time, notes2` |
