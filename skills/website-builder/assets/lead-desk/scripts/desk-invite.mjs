// Creates a one-time invite link so someone can set their own Lead Desk password.
// Use it for the very first owner, or when anyone forgets their password.
// Usage: npm run desk:invite -- person@example.org [--owner] [--local]
// The link works once, for 7 days. Nobody else ever sees the password.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);
const email = (args.find(a => !a.startsWith('--')) || '').toLowerCase();
if (!/^[^\s@'"]{1,64}@[^\s@'"]{1,190}\.[^\s@'"]{2,}$/.test(email)) {
  console.error('Usage: npm run desk:invite -- person@example.org [--owner]');
  process.exit(1);
}
const role = args.includes('--owner') ? 'owner' : 'admin';
const local = args.includes('--local');
const code = crypto.randomBytes(24).toString('base64url');
const codeHash = crypto.createHash('sha256').update(code).digest('hex');
const expires = new Date(Date.now() + 7 * 864e5).toISOString();
const created = new Date().toISOString();
const sql = `INSERT INTO invites (code_hash, email, role, expires_at) VALUES ('${codeHash}', '${email}', '${role}', '${expires}');
INSERT INTO admins (email, role, created_at) VALUES ('${email}', '${role}', '${created}') ON CONFLICT(email) DO UPDATE SET role = CASE WHEN '${role}' = 'owner' THEN 'owner' ELSE admins.role END;`;

const bin = path.join('node_modules', '.bin', process.platform === 'win32' ? 'wrangler.cmd' : 'wrangler');
const run = spawnSync(bin, ['d1', 'execute', 'lead-desk', local ? '--local' : '--remote', '--command', sql], { stdio: ['ignore', 'pipe', 'inherit'], shell: process.platform === 'win32' });
if (run.status !== 0) { console.error('Could not save the invite. Is the database set up (npm run desk:schema)?'); process.exit(1); }

let address = '';
try { address = JSON.parse(fs.readFileSync('desk.json', 'utf8')).address || ''; } catch {}
if (local) address = 'http://localhost:8787';
console.log(`\nInvite for ${email} (${role}) is ready. It works once, for 7 days.`);
console.log(address ? `Open this link to set the password:\n\n  ${address}/admin/#invite=${code}\n`
  : `Open your Lead Desk address followed by:\n\n  /admin/#invite=${code}\n\n(Save the address in desk.json as {"address": "..."} to get the full link next time.)\n`);
