// fetch-site.mjs: saves a live site's public pages into a folder so check-site.mjs
// can check sites that have no local build (WordPress, Webflow, Shopify, Squarespace,
// Wix, a server-rendered app...). Reads robots.txt, llms.txt, 404 and the sitemap,
// then every page the sitemap lists. Public pages only. No dependencies (Node 20+).
// Usage: node scripts/fetch-site.mjs https://<your-domain> [out-folder] [--max 300]
//        node scripts/fetch-site.mjs https://<your-domain>/page/ --bots   (can AI crawlers get this page?)

import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const start = args.find(a => /^https?:\/\//.test(a));
if (!start) { console.error('Usage: node scripts/fetch-site.mjs https://<your-domain> [out-folder] [--max 300]'); process.exit(1); }
const ORIGIN = new URL(start).origin;
const OUT = path.resolve(args.find(a => !a.startsWith('--') && a !== start && !/^\d+$/.test(a)) || 'site-snapshot');
const MAX = args.includes('--max') ? Number(args[args.indexOf('--max') + 1]) : 300;
const UA = 'Mozilla/5.0 (compatible; website-builder-check/1.0)';

const get = async u => { try { const r = await fetch(u, { headers: { 'user-agent': UA }, redirect: 'follow' }); return { status: r.status, text: await r.text(), url: r.url }; } catch (e) { return { status: 0, text: '', url: u }; } };
const save = (p, text) => { const f = path.join(OUT, p); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, text); };
const pageFile = pathname => (pathname.endsWith('/') ? pathname + 'index.html' : /\.[a-z0-9]{2,5}$/i.test(pathname) ? pathname : pathname + '/index.html');

// --bots: request one page as each AI crawler and report what it gets back.
if (args.includes('--bots')) {
  const bots = ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'PerplexityBot', 'Google-Extended', 'Bingbot'];
  let bad = 0;
  for (const b of bots) {
    let status = 0; try { status = (await fetch(start, { headers: { 'user-agent': `Mozilla/5.0 (compatible; ${b}/1.0)` }, redirect: 'follow' })).status; } catch {}
    if (status !== 200) bad++;
    console.log(`${status === 200 ? 'ok  ' : 'FAIL'}  ${b.padEnd(18)} ${status || 'no answer'}`);
  }
  console.log(bad ? `\n${bad} crawler(s) did not get the page. Check the host's or CDN's bot settings.` : '\nEvery AI crawler gets the page.');
  process.exit(bad ? 1 : 0);
}

fs.mkdirSync(OUT, { recursive: true });
for (const f of ['robots.txt', 'llms.txt', 'llms-full.txt']) { const r = await get(`${ORIGIN}/${f}`); if (r.status === 200 && !/<html/i.test(r.text.slice(0, 500))) save(f, r.text); }
const nf = await get(`${ORIGIN}/this-page-should-not-exist-${Date.now()}/`);
if (nf.status === 404) save('404.html', nf.text); else console.log(`note: a missing page returns ${nf.status}, not 404`);

// Sitemaps: from robots.txt, then the usual names; follow sitemap indexes.
const robots = fs.existsSync(path.join(OUT, 'robots.txt')) ? fs.readFileSync(path.join(OUT, 'robots.txt'), 'utf8') : '';
const queue = [...robots.matchAll(/^sitemap:\s*(\S+)/gim)].map(m => m[1]);
if (!queue.length) queue.push(`${ORIGIN}/sitemap.xml`, `${ORIGIN}/sitemap_index.xml`, `${ORIGIN}/sitemap-index.xml`);
const seenMaps = new Set(), pageUrls = new Set();
let n = 0;
while (queue.length) {
  const u = queue.shift(); if (seenMaps.has(u)) continue; seenMaps.add(u);
  const r = await get(u); if (r.status !== 200 || !/<(urlset|sitemapindex)/i.test(r.text)) continue;
  save(`sitemap-${++n}.xml`, r.text);
  const locs = [...r.text.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map(m => m[1].replace(/&amp;/g, '&'));
  if (/<sitemapindex/i.test(r.text)) queue.push(...locs); else locs.forEach(l => pageUrls.add(l));
}
if (!pageUrls.size) { console.log('No sitemap found. Fetching the home page only.'); pageUrls.add(`${ORIGIN}/`); }

let saved = 0;
for (const u of [...pageUrls].slice(0, MAX)) {
  let url; try { url = new URL(u); } catch { continue; }
  if (url.origin !== ORIGIN) continue;
  const r = await get(url.href);
  if (r.status !== 200) { console.log(`skip ${url.pathname} (status ${r.status})`); continue; }
  save(pageFile(url.pathname), r.text); saved++;
}
console.log(`Saved ${saved} page(s) from ${ORIGIN} into ${path.relative(process.cwd(), OUT) || OUT}${pageUrls.size > MAX ? ` (first ${MAX} of ${pageUrls.size}; raise --max for more)` : ''}.`);
console.log(`Next: node scripts/check-site.mjs ${path.relative(process.cwd(), OUT) || OUT} --site ${ORIGIN} --freeform`);
