import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import toast from 'react-hot-toast'
import { ArrowLeft, Lock, Tag, Loader2, Check, X, CalendarDays, MapPin, Car } from 'lucide-react'
import { PREPAY_CODE, PREPAY_DISCOUNT } from '../config/site'
import { formatLong } from '../lib/time'
import {
  loadDraft, clearDraft, priceFor, serviceLabel, createPaymentIntent, createBooking,
  saveConfirmed, API_LIVE,
} from '../lib/api'

const PK = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || ''
const STRIPE_READY = PK.startsWith('pk_') && !PK.includes('REPLACE_ME') && API_LIVE
const stripePromise = STRIPE_READY ? loadStripe(PK) : null

const appearance = {
  theme: 'night',
  variables: {
    colorPrimary: '#d0283a',
    colorBackground: '#16181c',
    colorText: '#eef0f2',
    colorTextSecondary: '#a4a9b1',
    colorDanger: '#ff6b78',
    fontFamily: 'Manrope, system-ui, sans-serif',
    borderRadius: '6px',
    spacingUnit: '4px',
  },
  rules: {
    '.Input': { border: '1px solid #2c3036', boxShadow: 'none' },
    '.Input:focus': { border: '1px solid #d0283a', boxShadow: '0 0 0 3px rgba(208,40,58,.25)' },
    '.Tab': { border: '1px solid #2c3036' },
    '.Tab--selected': { borderColor: '#d0283a' },
  },
  fonts: [{ cssSrc: 'https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700&display=swap' }],
}

function toBookingPayload(draft, total, coupon, payment_status) {
  const discountNote = coupon ? ` (${PREPAY_CODE} −$${PREPAY_DISCOUNT})` : ''
  return {
    date: draft.date,
    time: draft.time,
    service: serviceLabel(draft.packageId, draft.addon),
    name: draft.name,
    phone: draft.phone,
    email: draft.email,
    vehicle: draft.vehicle,
    address: draft.address,
    notes: `Total $${total}${discountNote}`,
    payment_status,
  }
}

function PayForm({ draft, total, coupon, onDone }) {
  const stripe = useStripe()
  const elements = useElements()
  const [busy, setBusy] = useState(false)
  const [ready, setReady] = useState(false)

  async function submit(e) {
    e.preventDefault()
    if (!stripe || !elements) return
    setBusy(true)
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
      confirmParams: {
        return_url: `${window.location.origin}/confirmation`,
        receipt_email: draft.email,
      },
    })
    if (error) {
      toast.error(error.message || 'Payment failed. Please try again.')
      setBusy(false)
      return
    }
    if (paymentIntent && ['succeeded', 'processing'].includes(paymentIntent.status)) {
      await onDone('Paid', paymentIntent.id)
    } else {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="pay-form">
      <PaymentElement onReady={() => setReady(true)} options={{ layout: 'tabs', defaultValues: { billingDetails: { name: draft.name, email: draft.email } } }} />
      <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={!stripe || !ready || busy}>
        {busy ? <><Loader2 size={18} className="spin" /> Processing…</> : <><Lock size={18} /> Pay ${total} & confirm</>}
      </button>
    </form>
  )
}

export default function Checkout() {
  const navigate = useNavigate()
  const draft = useMemo(() => loadDraft(), [])
  const [codeInput, setCodeInput] = useState('')
  const [coupon, setCoupon] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [piError, setPiError] = useState('')
  const [laterBusy, setLaterBusy] = useState(false)

  useEffect(() => {
    if (!draft) navigate('/book', { replace: true })
  }, [draft, navigate])

  const { subtotal, total } = priceFor({ packageId: draft?.packageId, addon: draft?.addon, coupon })

  // (Re)create the PaymentIntent whenever the amount changes
  useEffect(() => {
    if (!draft || !STRIPE_READY) return
    let alive = true
    setClientSecret('')
    setPiError('')
    createPaymentIntent({ packageId: draft.packageId, addon: draft.addon, coupon, email: draft.email, name: draft.name })
      .then((d) => { if (alive) setClientSecret(d.clientSecret) })
      .catch((e) => { if (alive) setPiError(e.message || 'Could not start payment.') })
    return () => { alive = false }
  }, [draft, coupon])

  if (!draft) return null

  function applyCode(e) {
    e.preventDefault()
    const c = codeInput.trim().toUpperCase()
    if (!c) return toast.error('Enter a coupon code.')
    if (c !== PREPAY_CODE) return toast.error('That code isn’t valid.')
    setCoupon(c)
    toast.success(`$${PREPAY_DISCOUNT} off applied`)
  }

  async function finish(payment_status) {
    const amount = payment_status === 'Paid' ? total : subtotal
    const payload = toBookingPayload(draft, amount, payment_status === 'Paid' ? coupon : '', payment_status)
    const res = await createBooking(payload)
    saveConfirmed({ ...payload, id: res.id })
    clearDraft()
    navigate('/confirmation', { replace: true })
  }

  async function payLater() {
    setLaterBusy(true)
    try {
      await finish('Pay Later')
    } catch (e) {
      toast.error(e.status === 409 ? 'That time was just booked. Please choose another slot.' : e.message || 'Something went wrong.')
      if (e.status === 409) navigate('/book')
      setLaterBusy(false)
    }
  }

  async function onPaid(status) {
    try { await finish(status) } catch (e) {
      toast.error('Payment received, but we couldn’t save the booking. We’ll call you to confirm.')
      navigate('/confirmation', { replace: true })
    }
  }

  return (
    <div className="checkout">
      <div className="container checkout__wrap">
        <Link to="/book" className="checkout__back"><ArrowLeft size={16} /> Edit booking</Link>
        <span className="eyebrow"><Lock size={13} /> Secure checkout</span>
        <h1 className="flow__title">Confirm & pay</h1>

        {!coupon && (
          <div className="prepay-banner">
            <span className="prepay-banner__badge">${PREPAY_DISCOUNT} OFF</span>
            <div>
              <strong>Prepay online and save ${PREPAY_DISCOUNT}</strong>
              <span>Use code <b>{PREPAY_CODE}</b> below.</span>
            </div>
          </div>
        )}

        <div className="order">
          <div className="order__line">
            <div>
              <span className="order__label">Service</span>
              <strong>{serviceLabel(draft.packageId, draft.addon)}</strong>
            </div>
            <span className="order__amt">${subtotal}</span>
          </div>
          <ul className="order__meta">
            <li><CalendarDays size={15} /> {formatLong(draft.date)} · {draft.time}</li>
            <li><Car size={15} /> {draft.vehicle}</li>
            <li><MapPin size={15} /> {draft.address}</li>
          </ul>
          {coupon && (
            <div className="order__line order__line--discount">
              <span><Tag size={14} /> {coupon}</span>
              <span>−${PREPAY_DISCOUNT}</span>
            </div>
          )}
          <div className="order__line order__line--total">
            <span>Total</span>
            <strong>${total}</strong>
          </div>
        </div>

        {coupon ? (
          <div className="coupon coupon--applied">
            <Check size={16} /> <span>Code <b>{coupon}</b> applied</span>
            <button type="button" onClick={() => { setCoupon(''); setCodeInput('') }} aria-label="Remove coupon"><X size={16} /></button>
          </div>
        ) : (
          <form className="coupon" onSubmit={applyCode}>
            <input value={codeInput} onChange={(e) => setCodeInput(e.target.value)} placeholder="Coupon code" aria-label="Coupon code" autoCapitalize="characters" />
            <button type="submit" className="btn btn-outline btn-sm">Apply</button>
          </form>
        )}

        <div className="pay-box">
          {!STRIPE_READY && (
            <p className="pay-box__note">Online payment isn’t connected yet. Choose “I’ll pay later” to reserve your time — you’ll pay after the job.</p>
          )}
          {STRIPE_READY && piError && <p className="pay-box__note pay-box__note--err">{piError}</p>}
          {STRIPE_READY && !clientSecret && !piError && (
            <div className="pay-box__loading"><Loader2 size={20} className="spin" /> Loading secure payment…</div>
          )}
          {STRIPE_READY && clientSecret && (
            <Elements stripe={stripePromise} options={{ clientSecret, appearance }} key={clientSecret}>
              <PayForm draft={draft} total={total} coupon={coupon} onDone={onPaid} />
            </Elements>
          )}
        </div>

        <button type="button" className="pay-later" onClick={payLater} disabled={laterBusy}>
          {laterBusy ? 'Reserving your time…' : `I’ll pay later ($${subtotal} after service)`}
        </button>
      </div>
    </div>
  )
}
