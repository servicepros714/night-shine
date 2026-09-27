import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, Phone, Check, Plus, Minus, MapPin, CalendarCheck, Truck, Sparkles, KeyRound,
  Droplets, ShieldCheck, CreditCard, Clock,
} from 'lucide-react'
import { BUSINESS, PACKAGES, ADDON, PREPAY_DISCOUNT } from '../config/site'
import useReveal from '../lib/useReveal'

const TICKER = ['Hand wash', 'Interior shampoo', 'Carpet extraction', 'UV protectant', 'Rim & tire detail', 'Spot-free dry', 'Mobile service', 'Book online']

const STEPS = [
  { icon: CalendarCheck, title: 'Book online', text: 'Pick your package, add the exterior wash if you want it, and choose a time that works.' },
  { icon: Truck, title: 'We pull up', text: 'We come to your home or office in San Clemente — you don’t have to drive anywhere.' },
  { icon: Sparkles, title: 'Deep detail', text: 'Vacuum, extraction, shampoo and wipe-downs done by hand, panel by panel.' },
  { icon: KeyRound, title: 'Keys back', text: 'We walk the car with you before we leave. Then it’s yours — fresh and shining.' },
]

const GALLERY = [
  { src: '/images/foam-side.webp', alt: 'Sedan covered in thick snow foam during a hand wash', cap: 'Pre-wash foam', cls: 'g-a' },
  { src: '/images/interior-brush.webp', alt: 'Detailer brushing foam into a door panel', cap: 'Door panel agitation', cls: 'g-b' },
  { src: '/images/wheel-foam.webp', alt: 'Alloy wheel foamed up during rim cleaning', cap: 'Rim & tire detail', cls: 'g-c' },
  { src: '/images/interior-vacuum.webp', alt: 'Vacuuming under the rear seat', cap: 'Triple-stage vacuum', cls: 'g-d' },
  { src: '/images/foam-rear.webp', alt: 'Rear bumper dripping with foam', cap: 'Contact-safe wash', cls: 'g-e' },
]

const FAQS = [
  { q: 'Do I need to be home during the detail?', a: 'Not necessarily. As long as we can access the vehicle and you’re reachable by phone, we can get started. We’ll text you when we arrive and when we’re finished.' },
  { q: 'Do you need water or power from me?', a: 'Access to a standard outdoor outlet and spigot helps, especially for the Exterior Wash. If that’s an issue, mention it when we call to confirm and we’ll plan around it.' },
  { q: 'How long does a detail take?', a: 'Most Basic Details take about 1.5–2 hours. A Premium Detail with extraction and shampoo usually runs 2.5–4 hours depending on the vehicle size and condition.' },
  { q: 'Can I add the exterior wash on its own?', a: 'The Exterior Wash is an add-on to a Basic or Premium Detail. Choose your interior package first, then tap to add the wash on the next step.' },
  { q: 'Do I have to pay online?', a: `No. You can pay online at booking and take $${PREPAY_DISCOUNT} off with the prepay code, or choose “I’ll pay later” and pay after the job is done.` },
  { q: 'What areas do you cover?', a: `We’re based in ${BUSINESS.city} and serve the surrounding neighborhoods and nearby South Orange County. If you’re not sure, give us a call.` },
]

export default function Home() {
  const ref = useReveal()
  const [openFaq, setOpenFaq] = useState(0)

  return (
    <div className="home" ref={ref}>
      {/* ───────── HERO ───────── */}
      <section className="hero" id="hero">
        <div className="hero__glow" aria-hidden="true" />
        <div className="container hero__grid">
          <div className="hero__copy">
            <span className="eyebrow eyebrow--line">San Clemente mobile detailing</span>
            <h1 className="hero__title">
              <span className="t-solid">Shine that</span>
              <span className="t-outline">comes to</span>
              <span className="t-red">your door.</span>
            </h1>
            <p className="hero__lead">
              Deep interior details and hand exterior washes, done in your driveway. Pick a package, choose a time, and we’ll handle the rest.
            </p>
            <div className="hero__actions">
              <Link to="/book" className="btn btn-primary btn-lg">Book online <ArrowRight size={20} /></Link>
              <a href={BUSINESS.phoneHref} className="btn btn-outline btn-lg"><Phone size={18} /> {BUSINESS.phone}</a>
            </div>
            <ul className="hero__facts">
              <li><strong>$150</strong><span>Details from</span></li>
              <li><strong>7 days</strong><span>By appointment</span></li>
              <li><strong>100%</strong><span>Mobile service</span></li>
            </ul>
          </div>

          <div className="hero__visual">
            <div className="hero__shield">
              <img src="/images/foam-side.webp" alt="Car covered in snow foam during a Night Shine hand wash" width="736" height="981" fetchpriority="high" />
            </div>
            <div className="hero__chip hero__chip--top">
              <Droplets size={16} /> Hand wash only
            </div>
            <div className="hero__chip hero__chip--bottom">
              <span className="dot" /> Booking this week
            </div>
          </div>
        </div>
      </section>

      {/* ───────── TICKER ───────── */}
      <div className="ticker-wrap" aria-hidden="true">
        <div className="ticker">
          <div className="ticker__track">
            {[...TICKER, ...TICKER, ...TICKER].map((t, i) => <span key={i}>{t}<i>◆</i></span>)}
          </div>
        </div>
      </div>

      {/* ───────── SERVICES (spec sheet) ───────── */}
      <section className="section services" id="services">
        <div className="container services__grid">
          <aside className="services__intro reveal">
            <span className="eyebrow">The menu</span>
            <h2 className="h2">Two packages.<br />One optional wash.</h2>
            <p>Every detail is done by hand at your location. Start with an interior package, then add the Exterior Wash if the outside needs love too.</p>
            <div className="services__note">
              <CreditCard size={18} />
              <span>Prepay online and save <strong>${PREPAY_DISCOUNT}</strong> on any booking.</span>
            </div>
          </aside>

          <div className="services__list">
            {PACKAGES.map((p, i) => (
              <article key={p.id} className={`spec reveal ${p.featured ? 'spec--featured' : ''}`} style={{ '--d': `${i * 90}ms` }}>
                <div className="spec__head">
                  <span className="spec__num"><span>0{i + 1}</span></span>
                  <div>
                    <span className="spec__tag">{p.tag}</span>
                    <h3>{p.name}</h3>
                  </div>
                  <div className="spec__price"><sup>$</sup>{p.price}</div>
                </div>
                <p className="spec__blurb">{p.blurb}</p>
                 <ul className="spec__features">
                  {p.features.map((f) => <li key={f}><Check size={16} />{f}</li>)}
                </ul>
              </article>
            ))}

            <article className="spec spec--addon reveal" style={{ '--d': '180ms' }}>
              <div className="spec__head">
                <span className="spec__num"><span><Plus size={22} /></span></span>
                <div>
                  <span className="spec__tag">{ADDON.tag} · pairs with any detail</span>
                  <h3>{ADDON.name}</h3>
                </div>
                <div className="spec__price"><sup>+$</sup>{ADDON.price}</div>
              </div>
              <p className="spec__blurb">{ADDON.blurb}</p>
              <ul className="spec__features">
                {ADDON.features.map((f) => <li key={f}><Check size={16} />{f}</li>)}
              </ul>
            </article>

            <div className="services__cta reveal" style={{ '--d': '240ms' }}>
              <Link to="/book" className="btn btn-primary btn-lg">
                Book now <ArrowRight size={20} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── PROCESS ───────── */}
      <section className="section process" id="process">
        <div className="container">
          <div className="section-head section-head--center reveal">
            <span className="eyebrow">How it works</span>
            <h2 className="h2">From booking to <em>shine</em> in four moves</h2>
          </div>
          <ol className="process__track">
            {STEPS.map((s, i) => (
              <li key={s.title} className="process__step reveal" style={{ '--d': `${i * 110}ms` }}>
                <div className="process__badge"><s.icon size={24} /><span>{i + 1}</span></div>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ───────── GALLERY (bento) ───────── */}
      <section className="section gallery" id="gallery">
        <div className="container">
          <div className="section-head section-head--split reveal">
            <div>
              <span className="eyebrow">In the bay</span>
              <h2 className="h2">Hands-on work, up close</h2>
            </div>
            <p>No drive-through brushes. Foam, mitts, brushes and extraction — the way detailing should be done.</p>
          </div>
          <div className="bento">
            {GALLERY.map((g, i) => (
              <figure key={g.src} className={`bento__item ${g.cls} reveal`} style={{ '--d': `${i * 70}ms` }}>
                <img src={g.src} alt={g.alt} loading="lazy" />
                <figcaption><span>0{i + 1}</span>{g.cap}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── COMPARE + WHY ───────── */}
      <section className="section compare" id="compare">
        <div className="container compare__grid">
          <div className="compare__table reveal">
            <span className="eyebrow">Side by side</span>
            <h2 className="h2">Basic or Premium?</h2>
            <div className="table" role="table" aria-label="Package comparison">
              <div className="table__row table__row--head" role="row">
                <span role="columnheader">What’s included</span>
                <span role="columnheader">Basic</span>
                <span role="columnheader">Premium</span>
              </div>
              {[
                ['Triple-stage vacuuming', true, true],
                ['Interior surface wipe-down', true, true],
                ['Floor mat cleaning', true, true],
                ['Cabin application & dust elimination', false, true],
                ['Interior window cleaning', false, true],
                ['Deep carpet cleaning & extraction', false, true],
                ['Full interior shampoo', false, true],
                ['UV-protectant coating', false, true],
              ].map(([label, b, p]) => (
                <div className="table__row" role="row" key={label}>
                  <span role="cell">{label}</span>
                  <span role="cell" className={b ? 'yes' : 'no'}>{b ? <Check size={18} /> : '—'}</span>
                  <span role="cell" className={p ? 'yes' : 'no'}>{p ? <Check size={18} /> : '—'}</span>
                </div>
              ))}
              <div className="table__row table__row--foot" role="row">
                <span role="cell">Price</span>
                <span role="cell">$150</span>
                <span role="cell">$200</span>
              </div>
            </div>
          </div>

          <div className="why reveal" style={{ '--d': '120ms' }}>
            <div className="why__crest">
              <img src="/images/logo.webp" alt={`${BUSINESS.name} crest`} loading="lazy" width="684" height="475" />
            </div>
            <ul className="why__list">
              <li><Truck size={22} /><div><strong>We come to you</strong><span>Home, office or apartment lot.</span></div></li>
              <li><ShieldCheck size={22} /><div><strong>Careful by hand</strong><span>Soft brushes, mitts and extraction.</span></div></li>
              <li><Clock size={22} /><div><strong>Open 7 days</strong><span>{BUSINESS.hours}.</span></div></li>
              <li><CreditCard size={22} /><div><strong>Pay your way</strong><span>Prepay and save, or pay after.</span></div></li>
            </ul>
          </div>
        </div>
      </section>

      {/* ───────── AREA ───────── */}
      <section className="section area" id="area">
        <div className="container area__grid">
          <div className="area__copy reveal">
            <span className="eyebrow">Service area</span>
            <h2 className="h2">Based in {BUSINESS.city}</h2>
            <p>We detail across town and the neighborhoods around it. Not on the list? Call and ask — we can usually make it work.</p>
            <ul className="area__tags">
              {BUSINESS.serviceArea.map((a) => <li key={a}><MapPin size={14} />{a}</li>)}
            </ul>
            <a href={BUSINESS.phoneHref} className="btn btn-outline"><Phone size={18} /> Check your area</a>
          </div>
          <div className="area__map reveal" style={{ '--d': '120ms' }}>
            <iframe
              title={`Map of ${BUSINESS.city}, CA`}
              src={`https://maps.google.com/maps?q=${encodeURIComponent(BUSINESS.mapQuery)}&z=12&output=embed`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>

      {/* ───────── FAQ ───────── */}
      <section className="section faq" id="faq">
        <div className="container faq__grid">
          <div className="faq__head reveal">
            <span className="eyebrow">Questions</span>
            <h2 className="h2">Good to know</h2>
            <p>Anything else? We pick up the phone.</p>
            <a href={BUSINESS.phoneHref} className="faq__phone"><Phone size={18} /> {BUSINESS.phone}</a>
          </div>
          <div className="faq__list">
            {FAQS.map((f, i) => {
              const open = openFaq === i
              return (
                <div key={f.q} className={`faq__item reveal ${open ? 'is-open' : ''}`} style={{ '--d': `${i * 50}ms` }}>
                  <button className="faq__q" onClick={() => setOpenFaq(open ? -1 : i)} aria-expanded={open}>
                    <span>{f.q}</span>
                    {open ? <Minus size={20} /> : <Plus size={20} />}
                  </button>
                  <div className="faq__a" hidden={!open}><p>{f.a}</p></div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ───────── CTA ───────── */}
      <section className="cta">
        <div className="container cta__inner reveal">
          <div>
            <span className="eyebrow eyebrow--light">Your driveway · your schedule</span>
            <h2>Book your detail in under two minutes.</h2>
          </div>
          <div className="cta__actions">
            <Link to="/book" className="btn btn-light btn-lg">Book online <ArrowRight size={20} /></Link>
            <a href={BUSINESS.phoneHref} className="btn btn-ghost-light btn-lg"><Phone size={18} /> Call now</a>
          </div>
        </div>
      </section>
    </div>
  )
}
