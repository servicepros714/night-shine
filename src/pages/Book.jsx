import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Check, ChevronLeft, ChevronRight, ArrowLeft, ArrowRight, Plus, Loader2, Sparkles } from 'lucide-react'
import { PACKAGES, ADDON, BOOKING_WINDOW_DAYS } from '../config/site'
import {
  todayKey, addDays, toKey, keyToDate, formatLong, formatShort,
  allSlots, openSlotsFor, isDayBookable, firstBookableDay,
} from '../lib/time'
import { getBookedTimes, priceFor, serviceLabel, saveDraft, loadDraft } from '../lib/api'

const STEP_NAMES = ['Package', 'Add-on', 'Date & time', 'Your details']
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const FIELDS = [
  { key: 'name', label: 'Full name', type: 'text', auto: 'name', placeholder: 'Jordan Rivera', msg: 'Please enter your full name.' },
  { key: 'phone', label: 'Phone', type: 'tel', auto: 'tel', placeholder: '(714) 555-0123', msg: 'Please enter a valid 10-digit phone number.' },
  { key: 'email', label: 'Email', type: 'email', auto: 'email', placeholder: 'you@email.com', msg: 'Please enter a valid email address.' },
  { key: 'vehicle', label: 'Vehicle', type: 'text', auto: 'off', placeholder: 'Year Make Model — e.g. 2021 Toyota RAV4', msg: 'Please enter your vehicle (year, make, model).' },
  { key: 'address', label: 'Service address', type: 'text', auto: 'street-address', placeholder: 'Street, City, ZIP', msg: 'Please enter the address where we’ll detail your car.' },
]

function formatPhone(v) {
  const d = v.replace(/\D/g, '').slice(0, 10)
  if (d.length < 4) return d
  if (d.length < 7) return `(${d.slice(0, 3)}) ${d.slice(3)}`
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`
}

function validField(key, v) {
  const val = (v || '').trim()
  if (key === 'phone') return val.replace(/\D/g, '').length === 10
  if (key === 'email') return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val)
  if (key === 'name') return val.length >= 2
  return val.length >= 3
}

export default function Book() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const draft = loadDraft()
  const preset = params.get('package')
  const validPreset = PACKAGES.some((p) => p.id === preset)

  const [step, setStep] = useState(validPreset ? 1 : draft?.packageId ? 0 : 0)
  const [packageId, setPackageId] = useState(validPreset ? preset : draft?.packageId || '')
  const [addon, setAddon] = useState(draft?.addon || false)
  const [date, setDate] = useState(draft?.date && isDayBookable(draft.date) ? draft.date : '')
  const [time, setTime] = useState(draft?.date && isDayBookable(draft.date) ? draft?.time || '' : '')
  const [info, setInfo] = useState({
    name: draft?.name || '', phone: draft?.phone || '', email: draft?.email || '',
    vehicle: draft?.vehicle || '', address: draft?.address || '',
  })
  const [errors, setErrors] = useState({})
  const [booked, setBooked] = useState([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const inputs = useRef({})
  const topRef = useRef(null)

  // Calendar month shown
  const [month, setMonth] = useState(() => {
    const k = date || firstBookableDay()
    const d = keyToDate(k)
    return { y: d.getFullYear(), m: d.getMonth() }
  })

  const { total } = priceFor({ packageId, addon })

  // Scroll to top on every step change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [step])

  // Fetch booked slots for the chosen day
  useEffect(() => {
    if (!date) return
    let alive = true
    setLoadingSlots(true)
    getBookedTimes(date)
      .then((b) => { if (alive) setBooked(b) })
      .catch(() => { if (alive) { setBooked([]); toast.error('Could not load availability. Showing all times.') } })
      .finally(() => { if (alive) setLoadingSlots(false) })
    return () => { alive = false }
  }, [date])

  const slots = useMemo(() => {
    if (!date) return []
    const open = new Set(openSlotsFor(date).map((s) => s.label))
    return allSlots().map((s) => ({ ...s, disabled: !open.has(s.label) || booked.includes(s.label) }))
  }, [date, booked])

  // Clear a time that became unavailable
  useEffect(() => {
    if (time && slots.length && slots.find((s) => s.label === time)?.disabled) setTime('')
  }, [slots, time])

  const calendarDays = useMemo(() => {
    const first = new Date(month.y, month.m, 1, 12)
    const lead = first.getDay()
    const daysIn = new Date(month.y, month.m + 1, 0).getDate()
    const cells = []
    for (let i = 0; i < lead; i++) cells.push(null)
    for (let d = 1; d <= daysIn; d++) {
      const key = toKey(month.y, month.m + 1, d)
      cells.push({ d, key, ok: isDayBookable(key) })
    }
    return cells
  }, [month])

  const tk = todayKey()
  const minMonth = keyToDate(tk)
  const maxMonth = keyToDate(addDays(tk, BOOKING_WINDOW_DAYS))
  const canPrev = month.y > minMonth.getFullYear() || (month.y === minMonth.getFullYear() && month.m > minMonth.getMonth())
  const canNext = month.y < maxMonth.getFullYear() || (month.y === maxMonth.getFullYear() && month.m < maxMonth.getMonth())
  const shiftMonth = (n) => setMonth(({ y, m }) => {
    const d = new Date(y, m + n, 1)
    return { y: d.getFullYear(), m: d.getMonth() }
  })

  /* ---------- navigation ---------- */
  function next() {
    if (step === 0 && !packageId) return toast.error('Please choose a package to continue.')
    if (step === 2) {
      if (!date) return toast.error('Please pick a date.')
      if (!time) return toast.error('Please pick a time.')
    }
    if (step === 3) {
      const errs = {}
      for (const f of FIELDS) if (!validField(f.key, info[f.key])) errs[f.key] = f.msg
      setErrors(errs)
      const firstBad = FIELDS.find((f) => errs[f.key])
      if (firstBad) {
        toast.error(firstBad.msg)
        const el = inputs.current[firstBad.key]
        if (el) { el.focus({ preventScroll: true }); el.scrollIntoView({ behavior: 'smooth', block: 'center' }) }
        return
      }
      saveDraft({ packageId, addon, date, time, ...info, name: info.name.trim(), email: info.email.trim() })
      navigate('/checkout')
      return
    }
    setStep((s) => Math.min(s + 1, 3))
  }

  function back() {
    if (step === 0) return navigate('/')
    setStep((s) => s - 1)
  }

  function setField(key, value) {
    setInfo((p) => ({ ...p, [key]: key === 'phone' ? formatPhone(value) : value }))
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }))
  }

  const railValue = [
    PACKAGES.find((p) => p.id === packageId)?.name,
    packageId ? (addon ? `${ADDON.name} added` : 'No add-on') : '',
    date && time ? `${formatShort(date)} · ${time}` : '',
    '',
  ]

  const selectedPkg = PACKAGES.find((p) => p.id === packageId)

  return (
    <div className="flow" ref={topRef}>
      <div className="container flow__grid">
        {/* Step rail */}
        <aside className="flow__rail">
          <span className="eyebrow">Book your detail</span>
          <ol>
            {STEP_NAMES.map((n, i) => (
              <li key={n} className={`${i === step ? 'is-active' : ''} ${i < step ? 'is-done' : ''}`}>
                <button type="button" onClick={() => i < step && setStep(i)} disabled={i >= step}>
                  <span className="flow__rail-dot"><span>{i < step ? <Check size={14} /> : i + 1}</span></span>
                  <span className="flow__rail-text">
                    <strong>{n}</strong>
                    {i < step && railValue[i] && <small>{railValue[i]}</small>}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </aside>

        {/* Mobile progress */}
        <div className="flow__progress" aria-hidden="true">
          <div className="flow__progress-top">
            <span>Step {step + 1} of 4</span>
            <strong>{STEP_NAMES[step]}</strong>
          </div>
          <div className="flow__progress-bar"><i style={{ width: `${((step + 1) / 4) * 100}%` }} /></div>
        </div>

        <section className="flow__panel" key={step}>
          {step === 0 && (
            <>
              <h1 className="flow__title">Choose your package</h1>
              <p className="flow__sub">Both packages are fully mobile. You can add the Exterior Wash next.</p>
              <div className="pick-grid">
                {PACKAGES.map((p) => {
                  const on = packageId === p.id
                  return (
                    <button type="button" key={p.id} className={`pick ${on ? 'is-on' : ''}`} onClick={() => setPackageId(p.id)} aria-pressed={on}>
                      <span className="pick__check" aria-hidden="true">{on && <Check size={16} />}</span>
                      <span className="pick__top">
                        <span className="pick__tag">{p.tag}</span>
                        <span className="pick__price">${p.price}</span>
                      </span>
                      <span className="pick__name">{p.name}</span>
                      <ul className="pick__list">
                        {p.features.map((f) => <li key={f}><Check size={14} />{f}</li>)}
                      </ul>
                    </button>
                  )
                })}
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <h1 className="flow__title">Add the outside?</h1>
              <p className="flow__sub">Optional. Tap to add a full hand wash to your {selectedPkg?.name}.</p>
              <button type="button" className={`addon-card ${addon ? 'is-on' : ''}`} onClick={() => setAddon((v) => !v)} aria-pressed={addon}>
                <span className="pick__check" aria-hidden="true">{addon && <Check size={16} />}</span>
                <span className="addon-card__head">
                  <span className="addon-card__icon"><Sparkles size={22} /></span>
                  <span>
                    <span className="pick__name">{ADDON.name}</span>
                    <span className="addon-card__hint">{addon ? 'Added to your booking' : 'Tap to add'}</span>
                  </span>
                  <span className="pick__price">+${ADDON.price}</span>
                </span>
                <ul className="pick__list pick__list--2col">
                  {ADDON.features.map((f) => <li key={f}><Check size={14} />{f}</li>)}
                </ul>
                <span className={`addon-card__toggle ${addon ? 'is-on' : ''}`}>
                  {addon ? <><Check size={16} /> Added</> : <><Plus size={16} /> Add exterior wash</>}
                </span>
              </button>
              <p className="flow__fine">Skip this step to book the interior detail only.</p>
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="flow__title">Pick a date & time</h1>
              <p className="flow__sub">We book {allSlots()[0].label} – {allSlots().slice(-1)[0].label}, seven days a week. Same-day slots open 4 hours out.</p>
              <div className="when">
                <div className="cal">
                  <div className="cal__head">
                    <button type="button" onClick={() => shiftMonth(-1)} disabled={!canPrev} aria-label="Previous month"><ChevronLeft size={20} /></button>
                    <strong>{new Date(month.y, month.m, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</strong>
                    <button type="button" onClick={() => shiftMonth(1)} disabled={!canNext} aria-label="Next month"><ChevronRight size={20} /></button>
                  </div>
                  <div className="cal__grid">
                    {WEEKDAYS.map((w) => <span key={w} className="cal__wd">{w}</span>)}
                    {calendarDays.map((c, i) => c ? (
                      <button
                        type="button"
                        key={c.key}
                        className={`cal__day ${c.key === date ? 'is-on' : ''} ${c.key === tk ? 'is-today' : ''}`}
                        disabled={!c.ok}
                        onClick={() => { setDate(c.key); setTime('') }}
                        aria-label={formatLong(c.key)}
                        aria-pressed={c.key === date}
                      >{c.d}</button>
                    ) : <span key={`e${i}`} />)}
                  </div>
                </div>

                <div className="slots">
                  <div className="slots__head">
                    <strong>{date ? formatLong(date) : 'Select a date'}</strong>
                    {loadingSlots && <Loader2 size={16} className="spin" />}
                  </div>
                  {!date && <p className="slots__empty">Choose a day on the calendar to see open times.</p>}
                  {date && (
                    <div className="slots__grid">
                      {slots.map((s) => (
                        <button
                          type="button"
                          key={s.label}
                          className={`slot ${time === s.label ? 'is-on' : ''}`}
                          disabled={s.disabled || loadingSlots}
                          onClick={() => setTime(s.label)}
                          aria-pressed={time === s.label}
                        >{s.label}</button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h1 className="flow__title">Where should we meet your car?</h1>
              <p className="flow__sub">{serviceLabel(packageId, addon)} · {formatShort(date)} at {time}</p>
              <form className="form" onSubmit={(e) => { e.preventDefault(); next() }} noValidate>
                {FIELDS.map((f) => (
                  <label key={f.key} className={`field ${f.key === 'address' || f.key === 'vehicle' ? 'field--wide' : ''} ${errors[f.key] ? 'has-error' : ''}`}>
                    <span>{f.label}</span>
                    <input
                      ref={(el) => { inputs.current[f.key] = el }}
                      type={f.type}
                      inputMode={f.key === 'phone' ? 'tel' : undefined}
                      autoComplete={f.auto}
                      placeholder={f.placeholder}
                      value={info[f.key]}
                      onChange={(e) => setField(f.key, e.target.value)}
                      aria-invalid={Boolean(errors[f.key])}
                    />
                    {errors[f.key] && <em>{errors[f.key]}</em>}
                  </label>
                ))}
                <button type="submit" hidden aria-hidden="true" />
              </form>
            </>
          )}

          {/* Action bar: inline on desktop, sticky bottom on mobile */}
          <div className="flow-bar">
            <button type="button" className="btn btn-outline flow-bar__back" onClick={back}>
              <ArrowLeft size={18} /> {step === 0 ? 'Home' : 'Back'}
            </button>
            <div className="flow-bar__total" aria-live="polite">
              <small>Total</small>
              <strong>${total}</strong>
            </div>
            <button type="button" className="btn btn-primary flow-bar__next" onClick={next}>
              {step === 1 && !addon ? 'Skip' : step === 3 ? 'Checkout' : 'Continue'} <ArrowRight size={18} />
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
