-- Lead Desk database (Cloudflare D1). Safe to run more than once.

CREATE TABLE IF NOT EXISTS admins (
  email TEXT PRIMARY KEY,
  name TEXT,
  pass_hash TEXT,
  pass_salt TEXT,
  role TEXT NOT NULL DEFAULT 'admin',      -- owner or admin
  notify INTEGER NOT NULL DEFAULT 1,       -- 1 = email this person about new leads
  created_at TEXT NOT NULL,
  last_login TEXT
);

CREATE TABLE IF NOT EXISTS invites (
  code_hash TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  expires_at TEXT NOT NULL,
  used INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS sessions (
  id_hash TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  name TEXT,
  email TEXT,
  phone TEXT,
  message TEXT,
  fields TEXT,            -- every other form field, as JSON
  page TEXT,              -- the landing page the form was on
  goal TEXT,              -- the page's conversion goal (data-cta)
  magnet TEXT,            -- the lead magnet, if any
  source TEXT,            -- utm_source, else the referring site, else direct
  medium TEXT,
  campaign TEXT,
  referrer TEXT,
  status TEXT NOT NULL DEFAULT 'new',   -- new, contacted, qualified, customer, lost
  value REAL                            -- money from this lead, once a customer
);
CREATE INDEX IF NOT EXISTS leads_created ON leads(created_at);
CREATE INDEX IF NOT EXISTS leads_status ON leads(status);

CREATE TABLE IF NOT EXISTS notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id INTEGER NOT NULL,
  author TEXT,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS notes_lead ON notes(lead_id);

-- Page views and success-page views per day, page and source. Counts only:
-- no cookies, no IP addresses, nothing that identifies a visitor.
CREATE TABLE IF NOT EXISTS daily (
  day TEXT NOT NULL,
  page TEXT NOT NULL,
  kind TEXT NOT NULL,      -- view or success
  source TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, page, kind, source)
);

CREATE TABLE IF NOT EXISTS settings (
  name TEXT PRIMARY KEY,
  value TEXT
);

CREATE TABLE IF NOT EXISTS attempts (
  bucket TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  reset_at TEXT NOT NULL
);
