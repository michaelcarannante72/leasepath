-- Leasebot waitlist: only an email, a language and a timestamp are kept.
CREATE TABLE IF NOT EXISTS waitlist (
  id INTEGER PRIMARY KEY,
  email TEXT UNIQUE NOT NULL COLLATE NOCASE,
  lang TEXT,
  created_at TEXT NOT NULL
);
