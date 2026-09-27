import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle2, Phone, CalendarDays, Car, MapPin, Loader2 } from 'lucide-react'
import { BUSINESS } from '../config/site'
import { formatLong } from '../lib/time'
import { loadConfirmed, loadDraft, clearDraft, createBooking, saveConfirmed, priceFor, serviceLabel } from '../lib/api'

export default function Confirmation() {
  const [params] = useSearchParams()
  const [booking, setBooking] = useState(() => loadConfirmed())
  const [working, setWorking] = useState(false)
  const ran = useRef(false)

  // Handles Stripe redirect-based payment methods returning here
  useEffect(() => {
    if (ran.current) return
    ran.current = true
    const status = params.get('redirect_status')
    const draft = loadDraft()
    if (status === 'succeeded' && draft) {
      setWorking(true)
      const { total } = priceFor({ packageId: draft.packageId, addon: draft.addon })
      const payload = {
        date: draft.date, time: draft.time, service: serviceLabel(draft.packageId, draft.addon),
        name: draft.name, phone: draft.phone, email: draft.email, vehicle: draft.vehicle, address: draft.address,
        notes: `Paid online (~$${total})`, payment_status: 'Paid',
      }
      createBooking(payload)
        .then((r) => { const b = { ...payload, id: r.id }; saveConfirmed(b); setBooking(b); clearDraft() })
        .catch(() => setBooking({ ...payload, id: '' }))
        .finally(() => setWorking(false))
    }
  }, [params])

  if (working) {
    return <div className="confirm"><div className="container confirm__card"><Loader2 className="spin" size={28} /> <p>Finalizing your booking…</p></div></div>
  }

  if (!booking) {
    return (
      <div className="confirm">
        <div className="container confirm__card">
          <h1 className="flow__title">No recent booking found</h1>
          <p className="flow__sub">Start a new booking or give us a call.</p>
          <div className="confirm__actions">
            <Link to="/book" className="btn btn-primary">Book online</Link>
            <a href={BUSINESS.phoneHref} className="btn btn-outline"><Phone size={18} /> {BUSINESS.phone}</a>
          </div>
        </div>
      </div>
    )
  }

  const paid = booking.payment_status === 'Paid'
  return (
    <div className="confirm">
      <div className="container confirm__card">
        <div className="confirm__icon"><CheckCircle2 size={44} /></div>
        <span className="eyebrow">{paid ? 'Paid · confirmed' : 'Reserved · pay after service'}</span>
        <h1 className="flow__title">You’re on the schedule, {booking.name?.split(' ')[0]}.</h1>
        <p className="flow__sub">We’ll call or text {booking.phone} before we arrive. Need to change something? Just call us.</p>

        {booking.id && <div className="confirm__id">Booking ID <strong>{booking.id}</strong></div>}

        <ul className="confirm__list">
          <li><strong>{booking.service}</strong></li>
          <li><CalendarDays size={16} /> {formatLong(booking.date)} · {booking.time}</li>
          <li><Car size={16} /> {booking.vehicle}</li>
          <li><MapPin size={16} /> {booking.address}</li>
        </ul>

        <div className="confirm__actions">
          <a href={BUSINESS.phoneHref} className="btn btn-outline"><Phone size={18} /> {BUSINESS.phone}</a>
          <Link to="/" className="btn btn-primary">Back to home</Link>
        </div>
      </div>
    </div>
  )
}
