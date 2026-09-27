import { Link } from 'react-router-dom'
import { Phone, MapPin, Clock, ArrowUpRight } from 'lucide-react'
import { BUSINESS, PACKAGES, ADDON } from '../config/site'

export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="footer">
      <div className="container footer__top">
        <div className="footer__brand">
          <img src="/images/logo-sm.webp" alt={BUSINESS.name} width="180" height="125" loading="lazy" />
          <p>Mobile interior and exterior detailing that comes to your driveway, office or garage in {BUSINESS.city}.</p>
        </div>

        <div className="footer__col">
          <h4>Services</h4>
          {PACKAGES.map((p) => <Link key={p.id} to={`/book?package=${p.id}`}>{p.name} <span>${p.price}</span></Link>)}
          <Link to="/book">{ADDON.name} <span>+${ADDON.price}</span></Link>
        </div>

        <div className="footer__col">
          <h4>Contact</h4>
          <a href={BUSINESS.phoneHref}><Phone size={15} /> {BUSINESS.phone}</a>
          <span><MapPin size={15} /> {BUSINESS.address}</span>
          <span><Clock size={15} /> {BUSINESS.hours}</span>
        </div>

        <div className="footer__cta">
          <h4>Ready when you are</h4>
          <Link to="/book" className="btn btn-primary">Book online <ArrowUpRight size={18} /></Link>
          <a href={BUSINESS.phoneHref} className="footer__phone">{BUSINESS.phone}</a>
        </div>
      </div>

      <div className="footer__word" aria-hidden="true">NIGHT SHINE</div>

      <div className="container footer__bottom">
        <span>© {year} {BUSINESS.name}. All rights reserved.</span>
        <span>{BUSINESS.address}</span>
      </div>
    </footer>
  )
}
