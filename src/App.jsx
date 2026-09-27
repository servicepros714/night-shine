import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import MobileActionBar from './components/MobileActionBar'
import Home from './pages/Home'
import Book from './pages/Book'
import Checkout from './pages/Checkout'
import Confirmation from './pages/Confirmation'
import NotFound from './pages/NotFound'

const FLOW_ROUTES = ['/book', '/checkout', '/confirmation']

export default function App() {
  const location = useLocation()
  const { pathname, hash } = location
  const inFlow = FLOW_ROUTES.some((r) => pathname.startsWith(r))

  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1))
      if (el) { setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 60); return }
    }
    window.scrollTo(0, 0)
  }, [pathname, hash, location.key])

  return (
    <div className={`app ${inFlow ? 'app--flow' : ''}`}>
      <Navbar minimal={inFlow} />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/book" element={<Book />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/confirmation" element={<Confirmation />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!inFlow && <Footer />}
      {!inFlow && <MobileActionBar />}
      <Toaster
        position="top-center"
        toastOptions={{
          style: { background: '#16181c', color: '#eef0f2', border: '1px solid #2c3036', fontFamily: 'Manrope, sans-serif' },
          iconTheme: { primary: '#d0283a', secondary: '#fff' },
        }}
      />
    </div>
  )
}
