import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Phone, Menu, X, ArrowLeft } from 'lucide-react'
import { BUSINESS } from '../config/site'

const LEFT = [
  { to: '/#services', label: 'Services' },
  { to: '/#process', label: 'How it works' },
]
const RIGHT = [
  { to: '/#gallery', label: 'Gallery' },
  { to: '/#faq', label: 'FAQ' },
]

export default function Navbar({ minimal = false }) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => { setOpen(false) }, [pathname])
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (minimal) {
    return (
      <header className="nav nav--minimal">
        <div className="container nav__minimal">
          <Link to="/" className="nav__exit" aria-label="Back to home">
            <ArrowLeft size={18} /> <span>Home</span>
          </Link>
          <Link to="/" className="nav__crest nav__crest--sm" aria-label={BUSINESS.name}>
            <img src="/images/logo-sm.webp" alt={BUSINESS.name} width="96" height="67" />
          </Link>
          <a href={BUSINESS.phoneHref} className="nav__call-mini" aria-label={`Call ${BUSINESS.phone}`}>
            <Phone size={16} /> <span>{BUSINESS.phone}</span>
          </a>
        </div>
      </header>
    )
  }

  return (
    <header className={`nav ${scrolled ? 'is-scrolled' : ''} ${open ? 'is-open' : ''}`}>
      <div className="nav__rail">
        <div className="container nav__rail-inner">
          <span>Mobile detailing · {BUSINESS.city}, CA</span>
          <span className="nav__rail-sep" />
          <span>{BUSINESS.hours}</span>
        </div>
      </div>

      <div className="container nav__bar">
        <nav className="nav__group nav__group--left" aria-label="Primary">
          {LEFT.map((l) => <NavLink key={l.label} to={l.to} className="nav__link">{l.label}</NavLink>)}
        </nav>

        <Link to="/" className="nav__crest" aria-label={`${BUSINESS.name} home`}>
          <img src="/images/logo-sm.webp" alt={BUSINESS.name} width="150" height="104" />
        </Link>

        <div className="nav__group nav__group--right">
          {RIGHT.map((l) => <NavLink key={l.label} to={l.to} className="nav__link">{l.label}</NavLink>)}
          <Link to="/book" className="btn btn-primary btn-sm nav__cta">Book online</Link>
          <button className="nav__burger" onClick={() => setOpen((v) => !v)} aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open}>
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      <div className={`nav__drawer ${open ? 'is-open' : ''}`} aria-hidden={!open}>
        <div className="nav__drawer-links">
          {[...LEFT, ...RIGHT].map((l, i) => (
            <Link key={l.label} to={l.to} style={{ '--i': i }} onClick={() => setOpen(false)}>
              <small>0{i + 1}</small>{l.label}
            </Link>
          ))}
        </div>
        <div className="nav__drawer-meta">
          <span className="eyebrow">{BUSINESS.hours}</span>
          <p>Mobile detailing across {BUSINESS.city} and nearby South OC.</p>
        </div>
        <div className="nav__drawer-bar">
          <a href={BUSINESS.phoneHref} className="btn btn-outline"><Phone size={18} /> Call now</a>
          <Link to="/book" className="btn btn-primary" onClick={() => setOpen(false)}>Book online</Link>
        </div>
      </div>
    </header>
  )
}
