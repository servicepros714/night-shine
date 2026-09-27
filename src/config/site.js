export const BUSINESS = {
  name: 'Night Shine Car Detailing',
  short: 'Night Shine',
  phone: '(714) 844-1247',
  phoneHref: 'tel:+17148441247',
  city: 'San Clemente',
  address: 'San Clemente, CA',
  hours: 'Mon–Sun by appointment',
  email: '',
  mapQuery: 'San Clemente, CA',
  serviceArea: ['San Clemente', 'Talega', 'Forster Ranch', 'Rancho San Clemente', 'Pier Bowl', 'Shorecliffs', 'Capistrano Beach', 'Dana Point'],
}

// Worker-side prices must match worker/worker.js PRICES
export const PACKAGES = [
  {
    id: 'basic',
    name: 'Basic Detail',
    price: 150,
    tag: 'Interior refresh',
    blurb: 'A fast, thorough interior reset for daily drivers that need the crumbs, dust and grime gone.',
    features: [
      'Triple-Stage Vacuuming for Deep Debris Removal',
      'Complete Interior Surface Wipe-Down',
      'Floor Mat Cleaning & Restoration',
    ],
  },
  {
    id: 'premium',
    name: 'Premium Detail',
    price: 200,
    tag: 'Most booked',
    featured: true,
    blurb: 'Our full interior treatment — extraction, shampoo and UV protection for a cabin that looks and smells new.',
    features: [
      'Triple-Stage Vacuuming',
      'Cabin Application',
      'Dust Elimination',
      'Interior Window Cleaning',
      'Deep Carpet Cleaning',
      'Cloth & Carpet Extraction',
      'Full Interior Shampooing',
      'UV-Protectant Coating',
    ],
  },
]

export const ADDON = {
  id: 'exterior',
  name: 'Exterior Wash',
  price: 50,
  tag: 'Add-on',
  blurb: 'Add a full hand wash to any detail so the outside matches the inside.',
  features: [
    'Hand-Washed Exterior',
    'Detailed Rim Cleaning',
    'Tire Scrub and Degrease',
    'Door Jamb & Panel Wipe-Down',
    'Premium Tire Shine Application',
    'Spot-Free Hand Drying',
  ],
}

export const PREPAY_CODE = 'PREPAY'
export const PREPAY_DISCOUNT = 15

// Booking hours (California time). Slots every hour, 7:00 AM through 7:00 PM.
export const SLOT_START_HOUR = 7
export const SLOT_END_HOUR = 19
export const LEAD_TIME_HOURS = 4
export const BOOKING_WINDOW_DAYS = 60

export const SOURCE = 'nightshine'
export const ID_PREFIX = 'NSCD-'
