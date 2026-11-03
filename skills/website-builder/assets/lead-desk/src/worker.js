// Lead Desk: a small lead inbox (CRM) that runs in the business's own Cloudflare
// account. Forms on any website send leads here. Admins sign in at /admin/ to see
// and work them. Optional alerts by email (Cloudflare Email Routing), chat webhook
// (Slack, Discord, Google Chat, Teams, Zapier, Make) or phone push (ntfy).
// No dependencies. Runs on the free plan.

import { EmailMessage } from 'cloudflare:email';

const statuses = ['new', 'contacted', 'qualified', 'customer', 'lost'];
const sessionDays = 30;
const now = () => new Date().toISOString();
const later = ms => new Date(Date.now() + ms).toISOString();

// ---------- helpers ----------
const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers } });
const bad = (msg, status = 400) => json({ ok: false, error: msg }, status);
const clean = (v, max = 2000) => (v == null ? '' : String(v)).replace(/\u0000/g, '').trim().slice(0, max);
const isEmail = v => /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/.test(v || '');
const toHex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
const randomId = (bytes = 24) => { const a = new Uint8Array(bytes); crypto.getRandomValues(a); return btoa(String.fromCharCode(...a)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
const sha256 = async text => toHex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)));

async function hashPass(pass, saltHex) {
  const salt = saltHex ? Uint8Array.from(saltHex.match(/../g).map(h => parseInt(h, 16))) : crypto.getRandomValues(new Uint8Array(16));
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(pass), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 100000 }, base, 256);
  return { hash: toHex(bits), salt: toHex(salt) };
}
const sameText = (a, b) => { if (a.length !== b.length) return false; let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i); return d === 0; };

async function readBody(request) {
  const type = request.headers.get('content-type') || '';
  if (type.includes('application/json')) return await request.json().catch(() => ({}));
  if (type.includes('form')) { const f = await request.formData(); const o = {}; for (const [k, v] of f) if (typeof v === 'string') o[k] = v; return o; }
  return {};
}

async function getSettings(db) {
  const rows = (await db.prepare('SELECT name, value FROM settings').all()).results || [];
  return Object.fromEntries(rows.map(r => [r.name, r.value]));
}

// Simple limiter stored in D1: at most `max` hits per bucket per window.
async function limited(db, bucket, max, windowMs) {
  const row = await db.prepare('SELECT count, reset_at FROM attempts WHERE bucket = ?').bind(bucket).first();
  if (!row || row.reset_at < now()) { await db.prepare('INSERT OR REPLACE INTO attempts (bucket, count, reset_at) VALUES (?, 1, ?)').bind(bucket, later(windowMs)).run(); return false; }
  if (row.count >= max) return true;
  await db.prepare('UPDATE attempts SET count = count + 1 WHERE bucket = ?').bind(bucket).run();
  return false;
}
const visitorBucket = async request => (await sha256((request.headers.get('cf-connecting-ip') || 'unknown') + new Date().toISOString().slice(0, 10))).slice(0, 24);

function allowedOrigins(bindings, settings) {
  return (settings.allowed_origins || bindings.site_origins || '').split(/[\s,]+/).map(s => s.trim().replace(/\/$/, '')).filter(Boolean);
}
function originAllowed(origin, list) {
  if (!list.length) return true; // not set up yet: accept, and the admin page says so
  // Browsers always send Origin with a form post from another site. No Origin means a
  // server-to-server post (Zapier, Make, an ad platform), which the rate limit still covers.
  if (!origin) return true;
  return list.includes(origin.replace(/\/$/, ''));
}

// ---------- sessions ----------
async function currentAdmin(request, db) {
  const m = (request.headers.get('cookie') || '').match(/(?:^|;\s*)desk_session=([^;]+)/);
  if (!m) return null;
  const s = await db.prepare('SELECT email, expires_at FROM sessions WHERE id_hash = ?').bind(await sha256(m[1])).first();
  if (!s || s.expires_at < now()) return null;
  return await db.prepare('SELECT email, name, role, notify FROM admins WHERE email = ?').bind(s.email).first();
}
async function startSession(db, email) {
  const id = randomId(32);
  await db.prepare('INSERT INTO sessions (id_hash, email, expires_at) VALUES (?, ?, ?)').bind(await sha256(id), email, later(sessionDays * 864e5)).run();
  await db.prepare('UPDATE admins SET last_login = ? WHERE email = ?').bind(now(), email).run();
  return `desk_session=${id}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${sessionDays * 86400}`;
}

// ---------- notifications ----------
const encodeSubject = s => `=?UTF-8?B?${btoa(unescape(encodeURIComponent(s)))}?=`;
async function sendMail(bindings, from, to, subject, text) {
  if (!bindings.MAILER || !from) return false;
  const domain = from.split('@')[1];
  const raw = [`From: Lead Desk <${from}>`, `To: ${to}`, `Subject: ${encodeSubject(subject)}`, `Message-ID: <${crypto.randomUUID()}@${domain}>`,
    `Date: ${new Date().toUTCString()}`, 'MIME-Version: 1.0', 'Content-Type: text/plain; charset=utf-8', 'Content-Transfer-Encoding: 8bit', '', text].join('\r\n');
  try { await bindings.MAILER.send(new EmailMessage(from, to, raw)); return true; } catch (e) { console.log('email failed', e.message); return false; }
}

function leadSummary(lead, deskUrl) {
  const lines = [
    lead.name && `Name: ${lead.name}`, lead.email && `Email: ${lead.email}`, lead.phone && `Phone: ${lead.phone}`,
    lead.message && `Message: ${lead.message}`, lead.magnet && `Lead magnet: ${lead.magnet}`, lead.page && `Page: ${lead.page}`,
    `Came from: ${[lead.source, lead.medium, lead.campaign].filter(Boolean).join(' / ') || 'direct'}`,
  ].filter(Boolean);
  if (deskUrl) lines.push('', `Open it: ${deskUrl}/admin/#lead=${lead.id}`);
  return lines.join('\n');
}

async function notifyAll(bindings, db, lead, deskUrl, test = false) {
  const st = await getSettings(db);
  const title = `${test ? 'Test: ' : ''}New lead${lead.name ? `: ${lead.name}` : ''}${lead.magnet ? ` (${lead.magnet})` : ''}`;
  const text = leadSummary(lead, deskUrl);
  const results = {};
  if (st.notify_email !== 'off' && bindings.MAILER && st.mail_from) {
    const people = (await db.prepare('SELECT email FROM admins WHERE notify = 1 AND pass_hash IS NOT NULL').all()).results || [];
    let sent = 0; for (const p of people) if (await sendMail(bindings, st.mail_from, p.email, title, text)) sent++;
    results.email = `${sent} sent`;
  }
  if (st.notify_webhook) {
    const hook = st.notify_webhook;
    const body = /discord/.test(hook) ? { content: `**${title}**\n${text}` } : { text: `*${title}*\n${text}`, lead };
    try { const r = await fetch(hook, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }); results.webhook = r.ok ? 'sent' : `failed (${r.status})`; }
    catch { results.webhook = 'failed'; }
  }
  if (st.notify_ntfy) {
    try {
      const r = await fetch(`https://ntfy.sh/${encodeURIComponent(st.notify_ntfy)}`, { method: 'POST', headers: { Title: title.replace(/[^\x20-\x7e]/g, ''), ...(deskUrl ? { Click: `${deskUrl}/admin/#lead=${lead.id}` } : {}) }, body: text });
      results.push = r.ok ? 'sent' : `failed (${r.status})`;
    } catch { results.push = 'failed'; }
  }
  return results;
}

// ---------- stats ----------
async function stats(db, days) {
  const since = new Date(Date.now() - days * 864e5).toISOString();
  const sinceDay = since.slice(0, 10);
  const q = (sql, ...b) => db.prepare(sql).bind(...b).all().then(r => r.results || []);
  const [totals] = await q(`SELECT COUNT(*) leads, SUM(status = 'customer') customers, SUM(CASE WHEN status = 'customer' THEN COALESCE(value, 0) ELSE 0 END) revenue,
    SUM(status = 'new') waiting FROM leads WHERE created_at >= ?`, since);
  const group = col => q(`SELECT COALESCE(NULLIF(${col}, ''), '(none)') name, COUNT(*) leads, SUM(status = 'customer') customers,
    SUM(CASE WHEN status = 'customer' THEN COALESCE(value, 0) ELSE 0 END) revenue FROM leads WHERE created_at >= ? GROUP BY 1 ORDER BY leads DESC LIMIT 25`, since);
  const [byPage, bySource, byMagnet, byStatus, perDay, views] = await Promise.all([
    group('page'), group('source'), group('magnet'),
    q(`SELECT status name, COUNT(*) leads FROM leads WHERE created_at >= ? GROUP BY 1`, since),
    q(`SELECT substr(created_at, 1, 10) day, COUNT(*) leads FROM leads WHERE created_at >= ? GROUP BY 1 ORDER BY 1`, since),
    q(`SELECT page, SUM(CASE WHEN kind = 'view' THEN count ELSE 0 END) views, SUM(CASE WHEN kind = 'success' THEN count ELSE 0 END) successes
       FROM daily WHERE day >= ? GROUP BY page ORDER BY views DESC LIMIT 50`, sinceDay),
  ]);
  // Conversion rate per landing page: leads (or success-page views) divided by page views.
  const leadsByPage = Object.fromEntries(byPage.map(r => [r.name, r.leads]));
  const pages = views.filter(v => v.views > 0).map(v => ({ page: v.page, views: v.views, leads: leadsByPage[v.page] || 0,
    rate: Math.round(1000 * (leadsByPage[v.page] || 0) / v.views) / 10 }));
  return { days, totals, byPage, bySource, byMagnet, byStatus, perDay, pages };
}

function digestText(s, deskUrl) {
  const t = s.totals || {};
  const top = (rows, label) => rows.filter(r => r.name !== '(none)').slice(0, 3).map(r => `  ${r.name}: ${r.leads} lead(s)${r.customers ? `, ${r.customers} customer(s)` : ''}`).join('\n') || `  No ${label} yet`;
  return [`Last ${s.days} days: ${t.leads || 0} new lead(s), ${t.customers || 0} became customers${t.revenue ? `, ${t.revenue} in revenue` : ''}.`,
    t.waiting ? `${t.waiting} lead(s) still marked New. Reply to them first.` : 'Every lead has been looked at.',
    '', 'Top sources:', top(s.bySource, 'sources'), '', 'Top pages:', top(s.byPage, 'pages'), '', 'Top lead magnets:', top(s.byMagnet, 'lead magnets'),
    deskUrl ? `\nOpen the Lead Desk: ${deskUrl}/admin/` : ''].join('\n');
}

// ---------- the public endpoints ----------
async function takeLead(request, bindings, ctx) {
  const db = bindings.DB;
  const st = await getSettings(db);
  const origin = request.headers.get('origin') || '';
  const wantsPage = (request.headers.get('accept') || '').includes('text/html');
  const body = await readBody(request);
  const list = allowedOrigins(bindings, st);
  const refuse = msg => wantsPage ? new Response(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><p style="font:18px system-ui;padding:24px">${msg} <a href="javascript:history.back()">Go back</a></p>`, { status: 400, headers: { 'content-type': 'text/html; charset=utf-8' } }) : bad(msg);

  if (!originAllowed(origin, list)) return refuse('This form is not allowed to send leads here.');
  if (await limited(db, 'lead:' + await visitorBucket(request), 20, 36e5)) return refuse('Too many tries. Please wait a little and try again.');

  // Spam traps: a hidden field people never fill, and a form filled in under 2 seconds.
  const trapped = clean(body._hp) || (body._t && Date.now() - Number(body._t) < 2000);
  const success = clean(body._success, 500);
  let successUrl = '';
  try { const u = new URL(success, origin || undefined); if (originAllowed(u.origin, list) || !list.length) successUrl = u.href; } catch {}
  const done = id => wantsPage && successUrl ? new Response(null, { status: 303, headers: { location: successUrl } }) : json({ ok: true, id });
  if (trapped) return done(0);

  const email = clean(body.email, 254).toLowerCase(), phone = clean(body.phone, 40);
  if (!isEmail(email) && phone.replace(/\D/g, '').length < 7) return refuse('Please enter a valid email address or phone number.');

  const known = new Set(['name', 'first_name', 'last_name', 'email', 'phone', 'message', '_hp', '_t', '_success', '_page', '_goal', '_magnet', '_ref', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'cf-turnstile-response']);
  const extra = {}; for (const [k, v] of Object.entries(body)) if (!known.has(k) && Object.keys(extra).length < 40) extra[clean(k, 60)] = clean(v, 2000);
  if (body.utm_content) extra.utm_content = clean(body.utm_content, 200);
  if (body.utm_term) extra.utm_term = clean(body.utm_term, 200);
  const referrer = clean(body._ref, 500);
  let refHost = ''; try { refHost = referrer ? new URL(referrer).hostname.replace(/^www\./, '') : ''; } catch {}
  const pageHost = (() => { try { return new URL(clean(body._page, 500) || origin).hostname.replace(/^www\./, ''); } catch { return ''; } })();
  const source = clean(body.utm_source, 120) || (refHost && refHost !== pageHost ? refHost : '') || 'direct';
  let page = clean(body._page, 500); try { if (page) page = new URL(page).pathname; } catch {}
  const name = clean(body.name, 200) || [clean(body.first_name, 100), clean(body.last_name, 100)].filter(Boolean).join(' ');
  const t = now();
  const res = await db.prepare(`INSERT INTO leads (created_at, updated_at, name, email, phone, message, fields, page, goal, magnet, source, medium, campaign, referrer)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(t, t, name, email, phone, clean(body.message, 5000), JSON.stringify(extra), page,
    clean(body._goal, 120), clean(body._magnet, 200), source, clean(body.utm_medium, 120), clean(body.utm_campaign, 200), referrer).run();
  const id = res.meta.last_row_id;
  const deskUrl = new URL(request.url).origin;
  ctx.waitUntil(notifyAll(bindings, db, { id, name, email, phone, message: clean(body.message, 600), page, magnet: clean(body._magnet, 200), source, medium: clean(body.utm_medium, 120), campaign: clean(body.utm_campaign, 200) }, deskUrl));
  return done(id);
}

async function takeEvent(request, bindings) {
  const db = bindings.DB;
  const st = await getSettings(db);
  if (!originAllowed(request.headers.get('origin') || '', allowedOrigins(bindings, st))) return new Response(null, { status: 204 });
  const body = await readBody(request);
  const kind = body.kind === 'success' ? 'success' : 'view';
  let page = clean(body.page, 300); try { page = new URL(page).pathname; } catch {}
  if (!page) return new Response(null, { status: 204 });
  if (await limited(db, 'event:' + await visitorBucket(request), 600, 36e5)) return new Response(null, { status: 204 });
  const source = clean(body.source, 120) || 'direct';
  await db.prepare(`INSERT INTO daily (day, page, kind, source, count) VALUES (?, ?, ?, ?, 1)
    ON CONFLICT(day, page, kind, source) DO UPDATE SET count = count + 1`).bind(now().slice(0, 10), page, kind, source).run();
  return new Response(null, { status: 204, headers: { 'access-control-allow-origin': request.headers.get('origin') || '*' } });
}

// ---------- admin API ----------
async function admin(request, bindings, path) {
  const db = bindings.DB;
  const method = request.method;
  const deskUrl = new URL(request.url).origin;
  // Changes must come from this site's own pages.
  if (method !== 'GET' && request.headers.get('origin') && request.headers.get('origin') !== deskUrl) return bad('Not allowed from another site.', 403);

  if (path === '/api/auth/status' && method === 'GET') {
    const me = await currentAdmin(request, db);
    const anyone = await db.prepare('SELECT COUNT(*) n FROM admins WHERE pass_hash IS NOT NULL').first();
    // Remember this address so the scheduled summary can link back here.
    await db.prepare('INSERT OR REPLACE INTO settings (name, value) VALUES (?, ?)').bind('desk_url', deskUrl).run();
    return json({ ok: true, me, hasAdmins: (anyone?.n || 0) > 0, mail: !!bindings.MAILER });
  }
  if (path === '/api/auth/login' && method === 'POST') {
    const body = await readBody(request);
    const email = clean(body.email, 254).toLowerCase(), pass = String(body.pass || '');
    if (await limited(db, 'login:' + email + ':' + await visitorBucket(request), 8, 15 * 6e4)) return bad('Too many tries. Wait 15 minutes, then try again.', 429);
    const a = await db.prepare('SELECT email, pass_hash, pass_salt FROM admins WHERE email = ?').bind(email).first();
    if (!a || !a.pass_hash || !sameText((await hashPass(pass, a.pass_salt)).hash, a.pass_hash)) return bad('That email and password do not match.', 401);
    return json({ ok: true }, 200, { 'set-cookie': await startSession(db, email) });
  }
  if (path === '/api/auth/accept' && method === 'POST') {
    const body = await readBody(request);
    const code = clean(body.invite, 200), pass = String(body.pass || '');
    if (pass.length < 10) return bad('Use at least 10 characters for your password.');
    if (await limited(db, 'accept:' + await visitorBucket(request), 10, 15 * 6e4)) return bad('Too many tries. Wait 15 minutes, then try again.', 429);
    const inv = await db.prepare('SELECT email, role, expires_at, used FROM invites WHERE code_hash = ?').bind(await sha256(code)).first();
    if (!inv || inv.used || inv.expires_at < now()) return bad('This invite link has expired or was already used. Ask for a new one.', 400);
    const h = await hashPass(pass);
    await db.batch([
      db.prepare(`INSERT INTO admins (email, name, pass_hash, pass_salt, role, created_at) VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(email) DO UPDATE SET pass_hash = excluded.pass_hash, pass_salt = excluded.pass_salt, name = COALESCE(NULLIF(excluded.name, ''), admins.name)`)
        .bind(inv.email, clean(body.name, 120), h.hash, h.salt, inv.role, now()),
      db.prepare('UPDATE invites SET used = 1 WHERE code_hash = ?').bind(await sha256(code)),
      db.prepare('DELETE FROM sessions WHERE email = ?').bind(inv.email),
    ]);
    return json({ ok: true, email: inv.email }, 200, { 'set-cookie': await startSession(db, inv.email) });
  }

  const me = await currentAdmin(request, db);
  if (!me) return bad('Please sign in.', 401);

  if (path === '/api/auth/logout' && method === 'POST') {
    const m = (request.headers.get('cookie') || '').match(/(?:^|;\s*)desk_session=([^;]+)/);
    if (m) await db.prepare('DELETE FROM sessions WHERE id_hash = ?').bind(await sha256(m[1])).run();
    return json({ ok: true }, 200, { 'set-cookie': 'desk_session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0' });
  }
  if (path === '/api/me' && method === 'PATCH') {
    const body = await readBody(request);
    if ('notify' in body) await db.prepare('UPDATE admins SET notify = ? WHERE email = ?').bind(body.notify ? 1 : 0, me.email).run();
    if (body.name != null) await db.prepare('UPDATE admins SET name = ? WHERE email = ?').bind(clean(body.name, 120), me.email).run();
    return json({ ok: true });
  }

  // Leads
  if (path === '/api/leads' && method === 'GET') {
    const u = new URL(request.url); const where = []; const b = [];
    const qs = clean(u.searchParams.get('q'), 100);
    if (qs) { where.push('(name LIKE ? OR email LIKE ? OR phone LIKE ? OR message LIKE ?)'); b.push(...Array(4).fill(`%${qs}%`)); }
    for (const col of ['status', 'source', 'page', 'magnet']) { const v = clean(u.searchParams.get(col), 300); if (v) { where.push(`${col} = ?`); b.push(v); } }
    const limit = Math.min(200, Number(u.searchParams.get('limit')) || 50), offset = Math.max(0, Number(u.searchParams.get('offset')) || 0);
    const sql = `SELECT id, created_at, name, email, phone, page, magnet, source, status, value FROM leads ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY id DESC LIMIT ? OFFSET ?`;
    const rows = (await db.prepare(sql).bind(...b, limit, offset).all()).results || [];
    return json({ ok: true, leads: rows });
  }
  if (path === '/api/leads.csv' && method === 'GET') {
    const rows = (await db.prepare('SELECT * FROM leads ORDER BY id DESC').all()).results || [];
    const cols = ['id', 'created_at', 'name', 'email', 'phone', 'message', 'page', 'goal', 'magnet', 'source', 'medium', 'campaign', 'referrer', 'status', 'value', 'fields'];
    const cell = v => { const s = v == null ? '' : String(v); return /^[=+\-@]/.test(s) ? `"'${s.replace(/"/g, '""')}"` : `"${s.replace(/"/g, '""')}"`; };
    const csv = [cols.join(','), ...rows.map(r => cols.map(c => cell(r[c])).join(','))].join('\r\n');
    return new Response(csv, { headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': `attachment; filename="leads-${now().slice(0, 10)}.csv"`, 'cache-control': 'no-store' } });
  }
  const lm = path.match(/^\/api\/leads\/(\d+)$/);
  if (lm) {
    const id = Number(lm[1]);
    if (method === 'GET') {
      const lead = await db.prepare('SELECT * FROM leads WHERE id = ?').bind(id).first();
      if (!lead) return bad('Not found.', 404);
      const notes = (await db.prepare('SELECT author, body, created_at FROM notes WHERE lead_id = ? ORDER BY id DESC').bind(id).all()).results || [];
      return json({ ok: true, lead: { ...lead, fields: JSON.parse(lead.fields || '{}') }, notes });
    }
    if (method === 'PATCH') {
      const body = await readBody(request); const ops = [];
      if (body.status && statuses.includes(body.status)) ops.push(db.prepare('UPDATE leads SET status = ?, updated_at = ? WHERE id = ?').bind(body.status, now(), id));
      if ('value' in body) ops.push(db.prepare('UPDATE leads SET value = ?, updated_at = ? WHERE id = ?').bind(body.value === '' || body.value == null ? null : Number(body.value) || 0, now(), id));
      if (clean(body.note)) ops.push(db.prepare('INSERT INTO notes (lead_id, author, body, created_at) VALUES (?, ?, ?, ?)').bind(id, me.name || me.email, clean(body.note, 4000), now()));
      if (body.status) ops.push(db.prepare('INSERT INTO notes (lead_id, author, body, created_at) VALUES (?, ?, ?, ?)').bind(id, me.name || me.email, `Marked as ${body.status}`, now()));
      if (ops.length) await db.batch(ops);
      return json({ ok: true });
    }
    if (method === 'DELETE') {
      await db.batch([db.prepare('DELETE FROM notes WHERE lead_id = ?').bind(id), db.prepare('DELETE FROM leads WHERE id = ?').bind(id)]);
      return json({ ok: true });
    }
  }

  if (path === '/api/stats' && method === 'GET') {
    const days = Math.min(365, Math.max(1, Number(new URL(request.url).searchParams.get('days')) || 30));
    return json({ ok: true, ...(await stats(db, days)) });
  }

  // Team
  if (path === '/api/team' && method === 'GET') {
    const team = (await db.prepare('SELECT email, name, role, notify, last_login, pass_hash IS NOT NULL AS active FROM admins ORDER BY created_at').all()).results || [];
    return json({ ok: true, team });
  }
  if (path === '/api/team/invite' && method === 'POST') {
    const body = await readBody(request);
    const email = clean(body.email, 254).toLowerCase();
    if (!isEmail(email)) return bad('Enter a valid email address.');
    const role = me.role === 'owner' && body.role === 'owner' ? 'owner' : 'admin';
    const code = randomId(24);
    await db.batch([
      db.prepare('INSERT INTO invites (code_hash, email, role, expires_at) VALUES (?, ?, ?, ?)').bind(await sha256(code), email, role, later(7 * 864e5)),
      db.prepare(`INSERT INTO admins (email, role, created_at) VALUES (?, ?, ?) ON CONFLICT(email) DO NOTHING`).bind(email, role, now()),
    ]);
    const link = `${deskUrl}/admin/#invite=${code}`;
    const st = await getSettings(db);
    const emailed = await sendMail(bindings, st.mail_from, email, 'You are invited to the Lead Desk',
      `${me.name || me.email} invited you to see and manage leads.\n\nSet your password here (the link works once, for 7 days):\n${link}`);
    return json({ ok: true, link, emailed });
  }
  const tm = path.match(/^\/api\/team\/(.+)$/);
  if (tm && method === 'DELETE') {
    const email = decodeURIComponent(tm[1]).toLowerCase();
    if (me.role !== 'owner') return bad('Only an owner can remove people.', 403);
    if (email === me.email) return bad('You cannot remove yourself.');
    await db.batch([db.prepare('DELETE FROM admins WHERE email = ?').bind(email), db.prepare('DELETE FROM sessions WHERE email = ?').bind(email), db.prepare('DELETE FROM invites WHERE email = ?').bind(email)]);
    return json({ ok: true });
  }

  // Settings
  const editable = ['allowed_origins', 'notify_email', 'mail_from', 'notify_webhook', 'notify_ntfy', 'digest', 'currency'];
  if (path === '/api/settings' && method === 'GET') {
    const st = await getSettings(db);
    return json({ ok: true, settings: Object.fromEntries(editable.map(k => [k, st[k] ?? ''])), mail: !!bindings.MAILER, siteOrigins: bindings.site_origins || '' });
  }
  if (path === '/api/settings' && method === 'PUT') {
    if (me.role !== 'owner') return bad('Only an owner can change settings.', 403);
    const body = await readBody(request); const ops = [];
    for (const k of editable) if (k in body) ops.push(db.prepare('INSERT OR REPLACE INTO settings (name, value) VALUES (?, ?)').bind(k, clean(body[k], 1000)));
    if (ops.length) await db.batch(ops);
    return json({ ok: true });
  }
  if (path === '/api/settings/test' && method === 'POST') {
    const results = await notifyAll(bindings, db, { id: 0, name: 'Test Person', email: 'test@example.org', page: '/test/', source: 'test' }, deskUrl, true);
    return json({ ok: true, results });
  }

  return bad('Not found.', 404);
}

// ---------- entry points ----------
export default {
  async fetch(request, bindings, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    try {
      if (request.method === 'OPTIONS' && (path === '/api/event' || path === '/api/lead')) {
        return new Response(null, { status: 204, headers: { 'access-control-allow-origin': request.headers.get('origin') || '*', 'access-control-allow-methods': 'POST', 'access-control-allow-headers': 'content-type', 'access-control-max-age': '86400' } });
      }
      if (path === '/api/lead' && request.method === 'POST') {
        const r = await takeLead(request, bindings, ctx);
        if (request.headers.get('origin')) r.headers.set('access-control-allow-origin', request.headers.get('origin'));
        return r;
      }
      if (path === '/api/event' && request.method === 'POST') return await takeEvent(request, bindings);
      if (path.startsWith('/api/')) return await admin(request, bindings, path);
      if (path === '/') return new Response(null, { status: 302, headers: { location: '/admin/' } });
      return bindings.ASSETS.fetch(request);
    } catch (e) {
      console.log('error', e.stack || e.message);
      return bad('Something went wrong. Please try again.', 500);
    }
  },

  // Daily at the hour set in wrangler.json: send the summary if it is switched on.
  async scheduled(event, bindings, ctx) {
    const db = bindings.DB;
    const st = await getSettings(db);
    await db.prepare('DELETE FROM sessions WHERE expires_at < ?').bind(now()).run();
    await db.prepare('DELETE FROM attempts WHERE reset_at < ?').bind(now()).run();
    const weekly = st.digest === 'weekly', daily = st.digest === 'daily';
    if (!(daily || (weekly && new Date().getUTCDay() === 1))) return;
    const s = await stats(db, weekly ? 7 : 1);
    const text = digestText(s, st.desk_url || '');
    const subject = `Lead Desk ${weekly ? 'weekly' : 'daily'} summary: ${s.totals?.leads || 0} new lead(s)`;
    if (bindings.MAILER && st.mail_from) {
      const people = (await db.prepare('SELECT email FROM admins WHERE notify = 1 AND pass_hash IS NOT NULL').all()).results || [];
      for (const p of people) await sendMail(bindings, st.mail_from, p.email, subject, text);
    }
    if (st.notify_webhook) ctx.waitUntil(fetch(st.notify_webhook, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(/discord/.test(st.notify_webhook) ? { content: `**${subject}**\n${text}` } : { text: `*${subject}*\n${text}` }) }).catch(() => {}));
  },
};
