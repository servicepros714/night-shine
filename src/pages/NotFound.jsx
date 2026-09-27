import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="confirm">
      <div className="container confirm__card">
        <span className="eyebrow">404</span>
        <h1 className="flow__title">This page drove off.</h1>
        <p className="flow__sub">Let’s get you back on the road.</p>
        <div className="confirm__actions">
          <Link to="/" className="btn btn-primary">Home</Link>
          <Link to="/book" className="btn btn-outline">Book online</Link>
        </div>
      </div>
    </div>
  )
}
