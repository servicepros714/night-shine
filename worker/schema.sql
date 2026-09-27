-- Shared detailing bookings table. Safe to run on an existing shared DB (IF NOT EXISTS).
CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  service TEXT,
  name TEXT,
  phone TEXT,
  email TEXT,
  vehicle TEXT,
  address TEXT,
  notes TEXT,
  source TEXT,
  created_at TEXT,
  status TEXT DEFAULT 'Confirmed',
  reschedule_date TEXT,
  reschedule_time TEXT,
  notes2 TEXT,
  original_date TEXT,
  original_time TEXT,
  payment_status TEXT DEFAULT 'Pay Later'
);
CREATE INDEX IF NOT EXISTS idx_bookings_source_date ON bookings (source, date);
