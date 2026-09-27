import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Phone, CalendarCheck } from 'lucide-react'
import { BUSINESS } from '../config/site'

/** Mobile-only bottom bar. Slides in once the visitor scrolls past the hero. */
export default function MobileActionBar() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      const hero = document.getElementById('hero')
      const limit = hero ? hero.offsetTop + hero.offsetHeight - 120 : 480
      setShow(window.scrollY > limit)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className={`action-bar ${show ? 'is-visible' : ''}`} role="region" aria-label="Quick actions">
      <a href={BUSINESS.phoneHref} className="action-bar__btn action-bar__btn--call">
        <Phone size={18} /> Call Now
      </a>
      <Link to="/book" className="action-bar__btn action-bar__btn--book">
        <CalendarCheck size={18} /> Book Online
      </Link>
    </div>
  )
}
