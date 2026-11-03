// fetch-site.mjs: saves a live site's public pages into a folder so check-site.mjs
// can check sites that have no local build (WordPress, Webflow, Shopify, Squarespace,
// Wix, a server-rendered app...). Reads robots.txt, llms.txt, 404 and the sitemap,
// then every page the sitemap lists. Public pages only. No dependencies (Node 20+).
// Usage: node scripts/fetch-site.mjs <your site address> [out-folder] [--max 300]
//        node scripts/fetch-site.mjs <page address> --bots [--text "a phrase from the page"]
//          (can AI crawlers get this page, and is its text in the HTML?)
//        node scripts/fetch-site.mjs <page address> --speed   (Google PageSpeed Insights, mobile)

import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const start = args.find(a => /^https?:\/\//.test(a));
if (!start) { console.error('Usage: node scripts/fetch-site.mjs <your site address> [out-folder] [--max 300]'); process.exit(1); }
const origin = new URL(start).origin;
const outDir = path.resolve(args.find((a, i) => !a.startsWith('--') && a !== start && !/^\d+$/.test(a) && args[i - 1] !== '--text') || 'site-snapshot');
const max = args.includes('--max') ? Number(args[args.indexOf('--max') + 1]) : 300;
const ua = 'Mozilla/5.0 (compatible; website-builder-check/1.0)';

const get = async u => { try { const r = await fetch(u, { headers: { 'user-agent': ua }, redirect: 'follow' }); return { status: r.status, text: await r.text(), url: r.url }; } catch (e) { return { status: 0, text: '', url: u }; } };
const save = (p, text) => { const f = path.join(outDir, p); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, text); };
const pageFile = pathname => (pathname.endsWith('/') ? pathname + 'index.html' : /\.[a-z0-9]{2,5}$/i.test(pathname) ? pathname : pathname + '/index.html');

// --speed: Google PageSpeed Insights for one page (mobile). No sign-up needed for occasional checks.
if (args.includes('--speed')) {
  const api = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed');
  api.searchParams.set('url', start); api.searchParams.set('strategy', 'mobile');
  for (const c of ['performance', 'seo', 'accessibility', 'best-practices']) api.searchParams.append('category', c);
  const r = await fetch(api); const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.lighthouseResult) { console.log(`PageSpeed did not answer (${r.status}). If it says rate limited, wait a minute and try again.`); process.exit(1); }
  const cats = j.lighthouseResult.categories, au = j.lighthouseResult.audits;
  const score = k => Math.round((cats[k]?.score ?? 0) * 100);
  const field = j.loadingExperience?.metrics || {};
  const fm = (k, unit) => field[k] ? `${field[k].percentile}${unit} (${field[k].category.toLowerCase()})` : 'no field data yet';
  console.log(`${start}\nPerformance ${score('performance')}  SEO ${score('seo')}  Accessibility ${score('accessibility')}  Best practices ${score('best-practices')}`);
  console.log(`Lab: LCP ${au['largest-contentful-paint']?.displayValue}, CLS ${au['cumulative-layout-shift']?.displayValue}, TBT ${au['total-blocking-time']?.displayValue}`);
  console.log(`Real users: LCP ${fm('LARGEST_CONTENTFUL_PAINT_MS', 'ms')}, INP ${fm('INTERACTION_TO_NEXT_PAINT', 'ms')}, CLS ${field.CUMULATIVE_LAYOUT_SHIFT_SCORE ? field.CUMULATIVE_LAYOUT_SHIFT_SCORE.percentile / 100 : 'no field data yet'}`);
  const low = ['performance', 'seo', 'accessibility', 'best-practices'].filter(k => score(k) < 90);
  console.log(low.length ? `Under 90: ${low.join(', ')}. Fix these.` : 'Every score is 90 or above.');
  process.exit(0);
}

// --bots: request one page as each AI crawler and report what it gets back.
const phrase = args.includes('--text') ? args[args.indexOf('--text') + 1] : null;
if (args.includes('--bots')) {
  const bots = ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'PerplexityBot', 'Google-Extended', 'Bingbot'];
  let bad = 0;
  for (const b of bots) {
    let status = 0, html = '';
    try { const r = await fetch(start, { headers: { 'user-agent': `Mozilla/5.0 (compatible; ${b}/1.0)` }, redirect: 'follow' }); status = r.status; html = await r.text(); } catch {}
    const textOk = !phrase || html.toLowerCase().includes(phrase.toLowerCase());
    if (status !== 200 || !textOk) bad++;
    console.log(`${status === 200 && textOk ? 'ok  ' : 'FAIL'}  ${b.padEnd(18)} ${status || 'no answer'}${phrase ? (textOk ? '  text found' : '  text NOT in the HTML (is it loaded by JavaScript?)') : ''}`);
  }
  console.log(bad ? `\n${bad} crawler(s) did not get the page. Check the host's or CDN's bot settings.` : '\nEvery AI crawler gets the page.');
  process.exit(bad ? 1 : 0);
}

fs.mkdirSync(outDir, { recursive: true });
for (const f of ['robots.txt', 'llms.txt', 'llms-full.txt']) { const r = await get(`${origin}/${f}`); if (r.status === 200 && !/<html/i.test(r.text.slice(0, 500))) save(f, r.text); }
const nf = await get(`${origin}/this-page-should-not-exist-${Date.now()}/`);
if (nf.status === 404) save('404.html', nf.text); else console.log(`note: a missing page returns ${nf.status}, not 404`);

// Sitemaps: from robots.txt, then the usual names; follow sitemap indexes.
const robots = fs.existsSync(path.join(outDir, 'robots.txt')) ? fs.readFileSync(path.join(outDir, 'robots.txt'), 'utf8') : '';
const queue = [...robots.matchAll(/^sitemap:\s*(\S+)/gim)].map(m => m[1]);
if (!queue.length) queue.push(`${origin}/sitemap.xml`, `${origin}/sitemap_index.xml`, `${origin}/sitemap-index.xml`);
const seenMaps = new Set(), pageUrls = new Set();
let n = 0;
while (queue.length) {
  const u = queue.shift(); if (seenMaps.has(u)) continue; seenMaps.add(u);
  const r = await get(u); if (r.status !== 200 || !/<(urlset|sitemapindex)/i.test(r.text)) continue;
  save(`sitemap-${++n}.xml`, r.text);
  const locs = [...r.text.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map(m => m[1].replace(/&amp;/g, '&'));
  if (/<sitemapindex/i.test(r.text)) queue.push(...locs); else locs.forEach(l => pageUrls.add(l));
}
if (!pageUrls.size) { console.log('No sitemap found. Fetching the home page only.'); pageUrls.add(`${origin}/`); }

let saved = 0;
for (const u of [...pageUrls].slice(0, max)) {
  let url; try { url = new URL(u); } catch { continue; }
  if (url.origin !== origin) continue;
  const r = await get(url.href);
  if (r.status !== 200) { console.log(`skip ${url.pathname} (status ${r.status})`); continue; }
  save(pageFile(url.pathname), r.text); saved++;
}
console.log(`Saved ${saved} page(s) from ${origin} into ${path.relative(process.cwd(), outDir) || outDir}${pageUrls.size > max ? ` (first ${max} of ${pageUrls.size}; raise --max for more)` : ''}.`);
console.log(`Next: node scripts/check-site.mjs ${path.relative(process.cwd(), outDir) || outDir} --site ${origin} --freeform`);
