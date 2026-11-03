// check-site.mjs: one command that checks every built page for SEO, AI search
// (GEO/AEO), page speed budget, site structure and copy quality.
// Usage: node scripts/check-site.mjs [built-html-folder] [--site <your site address>] [--freeform]
// Works on the HTML output of any stack (dist, out, build, _site, public, or a folder
// saved by fetch-site.mjs). --freeform turns layout conventions (footer archive links,
// one goal per page, success pages, breadcrumbs) into suggestions instead of failures.
// No dependencies. Exits 1 if anything FAILS, so it can gate every publish.

import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const distDir = path.resolve(args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--site') || 'dist');
const siteArg = args.includes('--site') ? args[args.indexOf('--site') + 1] : null;
const freeform = args.includes('--freeform');

// Budgets. Change them here if a page legitimately needs more.
const budget = {
  titleMin: 25, titleMax: 65,
  descMin: 70, descMax: 160,
  htmlKB: 120,           // one page's HTML
  jsKB: 60,              // total first-party JS a page loads
  imageKB: 250,          // any single image file
  minWordsDetail: 350,   // every landing page (location, service, lead magnet, offer...)
  minWordsArchive: 60,   // archive pages
  minWordsResource: 120, // resource pages (role: resource) only need enough to show what they get
  maxSimilarity: 0.55,   // two pages sharing more than this = near-duplicate
  answerMin: 15, answerMax: 90, // words in the first paragraph after a question heading
};

const aiBots = ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-User',
  'Claude-SearchBot', 'PerplexityBot', 'Perplexity-User', 'Google-Extended', 'Applebot-Extended',
  'Bingbot', 'CCBot'];

const bannedWords = ['delve', 'tapestry', 'realm', 'embark', 'multifaceted', 'robust', 'leverage',
  'utilize', 'streamline', 'foster', 'enhance', 'elevate', 'pivotal', 'comprehensive',
  'groundbreaking', 'unprecedented', 'seamless', 'seamlessly', 'cutting-edge', 'innovative',
  'harness', 'underscore', 'facilitate', 'elucidate', 'holistic', 'paradigm', 'synergy',
  'endeavor', 'beacon', 'testament', 'myriad', 'plethora', 'bustling', 'vibrant', 'intricate',
  'paramount', 'meticulous', 'meticulously', 'bespoke', 'cognizant', 'transformative',
  'commendable', 'noteworthy', 'game-changer', 'unlock', 'empower', 'elevated', 'nestled',
  'top-notch', 'second to none', 'one-stop shop', 'look no further'];
const bannedPhrases = [/in today'?s (fast-paced|digital|modern|ever)/i, /ever-evolving/i,
  /it'?s (important|worth) (to note|noting)/i, /let'?s dive/i, /when it comes to/i,
  /in conclusion/i, /\bfurthermore\b/i, /\bmoreover\b/i, /whether you'?re an? .{1,40}, an? .{1,40},? or/i,
  /\bnot (just|only) [^.?!]{1,40}, but\b/i, /\bit'?s not [^.?!]{1,40}[,;] it'?s\b/i,
  /we pride ourselves/i, /your (one-stop|go-to) /i, /peace of mind/i, /look no further/i];

const results = []; // {level, page, msg}
const fail = (page, msg) => results.push({ level: 'FAIL', page, msg });
const warn = (page, msg) => results.push({ level: 'WARN', page, msg });
// Layout conventions: must-fix in the interview build, suggestions in freeform.
const conv = (page, msg) => (freeform ? warn : fail)(page, msg);

if (!fs.existsSync(distDir)) { console.error(`No build folder at ${distDir}. Run the build first.`); process.exit(1); }

const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e =>
  e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
const files = walk(distDir);
const htmlFiles = files.filter(f => f.endsWith('.html'));
const rel = f => '/' + path.relative(distDir, f).split(path.sep).join('/');
const urlOf = f => rel(f).replace(/index\.html$/, '').replace(/\.html$/, '/');
const read = f => fs.readFileSync(f, 'utf8');
const kb = f => fs.statSync(f).size / 1024;

const attr = (tag, name) => {
  const m = tag.match(new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'));
  return m ? (m[1] ?? m[2] ?? m[3]) : undefined;
};
const metaContent = (html, key) => {
  for (const m of html.matchAll(/<meta\b[^>]*>/gi)) {
    const t = m[0];
    if ((attr(t, 'name') || attr(t, 'property') || '').toLowerCase() === key) return attr(t, 'content');
  }
};
const stripTags = h => h.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#39;|&rsquo;/g, "'")
  .replace(/\s+/g, ' ').trim();
const words = t => t.toLowerCase().match(/[a-z0-9'-]+/g) || [];
const mainText = h => stripTags((h.match(/<main[\s\S]*?<\/main>/i) || [h])[0]);
// Page types are worked out from the URLs, so any kind of archive works
// (/locations/, /services/, /free/, /webinars/, /quizzes/, /offers/ ...).
// archive = a top-level folder page that has landing pages under it
// landing = every page under an archive (one conversion goal each)
// info    = about, contact, legal, thank-you pages
const info = /^\/(about|contact|privacy|terms|legal|reviews|thank-you|thanks|confirm)(\/|$)/;
const pageType = u => u === '/' ? 'home'
  : info.test(u) ? 'info'
  : /^\/[^/]+\/$/.test(u) && pages.some(q => q.url !== u && q.url.startsWith(u)) ? 'archive'
  : /^\/[^/]+\/.+/.test(u) ? 'landing' : 'other';

// ---------- site-level files ----------
let sitemapUrls = new Set();
const sitemapFiles = files.filter(f => /sitemap.*\.xml$/.test(f));
if (!sitemapFiles.length) fail('site', 'No sitemap.xml. Search engines and AI crawlers use it to find every page.');
for (const f of sitemapFiles) for (const m of read(f).matchAll(/<loc>([^<]+)<\/loc>/g)) {
  try { sitemapUrls.add(new URL(m[1]).pathname); } catch {}
}
const site = siteArg || (() => { for (const f of sitemapFiles) { const m = read(f).match(/<loc>(https?:\/\/[^/<]+)/); if (m) return m[1]; } })();

const robotsPath = path.join(distDir, 'robots.txt');
if (!fs.existsSync(robotsPath)) fail('site', 'No robots.txt.');
else {
  const r = read(robotsPath);
  if (!/^sitemap:/im.test(r)) warn('site', 'robots.txt has no "Sitemap:" line.');
  // A bot is blocked if a group naming it (or *) has "Disallow: /"
  const groups = r.split(/\n\s*\n/);
  for (const g of groups) {
    const agents = [...g.matchAll(/^user-agent:\s*(.+)$/gim)].map(m => m[1].trim().toLowerCase());
    if (/^disallow:\s*\/\s*$/im.test(g)) {
      if (agents.includes('*')) fail('site', 'robots.txt blocks every crawler (Disallow: / for *).');
      for (const b of aiBots) if (agents.includes(b.toLowerCase())) fail('site', `robots.txt blocks ${b}. That hides the site from that AI assistant.`);
    }
  }
}

const llmsPath = path.join(distDir, 'llms.txt');
let llmsText = '';
if (!fs.existsSync(llmsPath)) fail('site', 'No llms.txt at the site root.');
else {
  llmsText = read(llmsPath);
  if (!/^# .+/m.test(llmsText)) fail('site', 'llms.txt must start with "# Business name".');
  if (!/^> .+/m.test(llmsText)) warn('site', 'llms.txt should have a one-line "> summary" under the title.');
  if (!/^## /m.test(llmsText)) warn('site', 'llms.txt should group links under "## " sections (one per archive).');
}
if (!fs.existsSync(path.join(distDir, '404.html'))) warn('site', 'No 404.html page.');

// ---------- per page ----------
const pages = htmlFiles.filter(f => !/404\.html$/.test(f)).map(f => ({ f, url: urlOf(f), html: read(f) }));
const inbound = new Map(pages.map(p => [p.url, 0]));
const existing = new Set(pages.map(p => p.url));
const archives = pages.map(p => p.url).filter(u => /^\/[^/]+\/$/.test(u) && !info.test(u) && pages.some(q => q.url !== u && q.url.startsWith(u)));
const assetExists = u => fs.existsSync(path.join(distDir, decodeURIComponent(u.split(/[?#]/)[0])));

for (const p of pages) {
  const { html, url } = p; const type = pageType(url); p.type = type;
  // Success pages (the page after a conversion): checked against their contract, never indexed.
  const isSuccess = url.startsWith('/thanks/') || metaContent(html, 'page-role') === 'success';
  if (isSuccess) {
    p.type = 'success';
    const stype = metaContent(html, 'success-type');
    if (!/<meta[^>]+name=["']robots["'][^>]+noindex/i.test(html)) fail(url, 'Success page must be noindex (it should never show up in search).');
    if (sitemapUrls.has(url)) fail(url, 'Success page is in the sitemap. Remove it.');
    if (llmsText.includes(url)) warn(url, 'Success page is listed in llms.txt. Remove it.');
    if (!stype) warn(url, 'Add <meta name="success-type" content="<contract id>"> so the right delivery checks run.');
    const body = html.replace(/<footer[\s\S]*?<\/footer>/i, '');
    const next = new Set([...body.matchAll(/data-cta\s*=\s*["']([^"']+)["']/gi)].map(m => m[1]));
    if (next.size > 1) conv(url, `Success page offers ${next.size} next steps (${[...next].join(', ')}). Give it exactly one.`);
    if (!next.size) warn(url, 'Success page has no next step marked data-cta. Offer exactly one.');
    if (stype === 'file-delivery' && !/<a\b[^>]*(\sdownload\b|href=["'][^"']+\.(pdf|zip|docx?|xlsx?|csv|pptx?|png|jpe?g|txt|md|json)["'])/i.test(body)) fail(url, 'File delivery page has no download link (an <a download> pointing to the file).');
    if (stype === 'file-delivery') for (const m of body.matchAll(/<a\b[^>]*href=["'](\/[^"']+\.[a-z0-9]{2,5})["']/gi)) if (!assetExists(m[1])) fail(url, `Download file is missing: ${m[1]}`);
    if (stype === 'copy-paste' && !/data-copy\b/i.test(body)) fail(url, 'Copy-paste page has no element marked data-copy holding the text.');
    if (stype === 'copy-paste' && !/<button\b[^>]*>[^<]*copy/i.test(body)) warn(url, 'Copy-paste page has no "Copy" button.');
    if (stype === 'registration' && !/(data-calendar|\.ics["'])/i.test(body)) fail(url, 'Registration page has no add-to-calendar link (.ics or data-calendar).');
    continue;
  }
  if (/<meta[^>]+name=["']robots["'][^>]+noindex/i.test(html)) { warn(url, 'Page is noindex, skipping SEO checks.'); continue; }

  // Basics
  const title = stripTags((html.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || '');
  if (!title) fail(url, 'Missing <title>.');
  else if (title.length < budget.titleMin || title.length > budget.titleMax) warn(url, `Title is ${title.length} characters (aim ${budget.titleMin}-${budget.titleMax}): "${title}"`);
  p.title = title;
  const desc = metaContent(html, 'description');
  if (!desc) fail(url, 'Missing meta description.');
  else if (desc.length < budget.descMin || desc.length > budget.descMax) warn(url, `Meta description is ${desc.length} characters (aim ${budget.descMin}-${budget.descMax}).`);
  p.desc = desc;
  if (!/<html[^>]+lang=/i.test(html)) fail(url, 'Missing <html lang="...">.');
  if (!/name=["']viewport["']/i.test(html)) fail(url, 'Missing mobile viewport tag.');
  const h1s = [...html.matchAll(/<h1\b[\s\S]*?<\/h1>/gi)];
  if (h1s.length !== 1) fail(url, `Needs exactly one <h1>, found ${h1s.length}.`);
  p.h1 = h1s[0] ? stripTags(h1s[0][0]) : '';
  const canon = (html.match(/<link[^>]+rel=["']canonical["'][^>]*>/i) || [])[0];
  if (!canon) fail(url, 'Missing canonical link.');
  else {
    const href = attr(canon, 'href') || '';
    if (!/^https:\/\//.test(href)) fail(url, `Canonical must be a full https URL, got "${href}".`);
    else if (new URL(href).pathname !== url) warn(url, `Canonical points to ${new URL(href).pathname}, not this page.`);
  }
  for (const k of ['og:title', 'og:description', 'og:image']) if (!metaContent(html, k)) warn(url, `Missing ${k} (controls how links look when shared).`);
  if (!sitemapUrls.has(url)) fail(url, 'Not listed in the sitemap.');
  if (llmsText && type !== 'other' && !new RegExp(`(\\(|\\s)(${(site || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})?${url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\)|\\s|$)`, 'm').test(llmsText)) warn(url, 'Not listed in llms.txt.');

  // Structured data
  const ld = [...html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)];
  const types = new Set();
  for (const m of ld) {
    try {
      const j = JSON.parse(m[1]);
      const visit = o => { if (!o || typeof o !== 'object') return; if (Array.isArray(o)) return o.forEach(visit);
        if (o['@type']) [].concat(o['@type']).forEach(t => types.add(t)); if (o['@graph']) visit(o['@graph']); };
      visit(j);
    } catch { fail(url, 'A JSON-LD block is not valid JSON.'); }
  }
  p.types = types;
  if (!types.size) fail(url, 'No structured data (JSON-LD).');
  if (type !== 'home' && !types.has('BreadcrumbList')) conv(url, 'Missing BreadcrumbList structured data.');
  if (type === 'home' && !([...types].some(t => /Organization|LocalBusiness|Contractor|Service$/.test(t)) || types.has('Organization'))) warn(url, 'Home page should describe the business (Organization or LocalBusiness).');
  if (type === 'landing' && ![...types].some(t => !['BreadcrumbList', 'FAQPage', 'WebPage', 'WebSite', 'Organization', 'ListItem'].includes(t))) warn(url, 'Describe what this page offers in structured data (Service, Product, Event, Course, DigitalDocument...).');
  const hasFaqHtml = /<h[23][^>]*>[^<]*\?\s*<\/h[23]>/i.test(html);
  if (hasFaqHtml && !types.has('FAQPage')) warn(url, 'Has question headings but no FAQPage structured data.');

  // Breadcrumb visible
  if (type !== 'home' && !/breadcrumb/i.test(html)) warn(url, 'No visible breadcrumb trail.');

  // Answer-first: first paragraph after each question heading
  for (const m of html.matchAll(/<h([23])[^>]*>([^<]*\?)\s*<\/h\1>\s*(?:<[^p][^>]*>\s*)*<p[^>]*>([\s\S]*?)<\/p>/gi)) {
    const n = words(stripTags(m[3])).length;
    if (n < budget.answerMin || n > budget.answerMax) warn(url, `Answer to "${stripTags(m[2])}" is ${n} words. Lead with a direct ${budget.answerMin}-${budget.answerMax} word answer AI tools can quote.`);
  }

  // Images
  for (const m of html.matchAll(/<img\b[^>]*>/gi)) {
    const t = m[0]; const src = attr(t, 'src') || '';
    if (attr(t, 'alt') === undefined) fail(url, `Image without alt text: ${src}`);
    if (!attr(t, 'width') || !attr(t, 'height')) warn(url, `Image without width/height (causes layout shift): ${src}`);
    if (src.startsWith('/') && assetExists(src) && kb(path.join(distDir, src.split('?')[0])) > budget.imageKB) warn(url, `Image over ${budget.imageKB} KB: ${src}`);
  }

  // Speed budget
  const htmlKB = Buffer.byteLength(html) / 1024;
  if (htmlKB > budget.htmlKB) warn(url, `HTML is ${htmlKB.toFixed(0)} KB (budget ${budget.htmlKB}).`);
  let js = 0;
  for (const m of html.matchAll(/<script\b[^>]*src=["']([^"']+)["'][^>]*>/gi)) {
    const s = m[1];
    if (s.startsWith('/') && assetExists(s)) js += kb(path.join(distDir, s.split('?')[0]));
    else if (/^https?:/.test(s)) {
      const inHead = (html.split(/<\/head>/i)[0] || '').includes(m[0]);
      if (inHead && !/\b(async|defer|type=["']module)/i.test(m[0])) fail(url, `Third-party script blocks loading in <head>: ${s}`);
    }
  }
  if (js > budget.jsKB) warn(url, `Loads ${js.toFixed(0)} KB of JavaScript (budget ${budget.jsKB}).`);
  if (/fonts\.googleapis\.com/.test(html) && !/display=swap/.test(html)) warn(url, 'Google Fonts without display=swap. Better: self-host fonts.');

  // Links
  for (const m of html.matchAll(/<a\b[^>]*href=["']([^"'#]+)["']/gi)) {
    let h = m[1];
    if (site && h.startsWith(site)) h = h.slice(site.length) || '/';
    if (!h.startsWith('/') || h.startsWith('//')) continue;
    const clean = h.split(/[?#]/)[0];
    const norm = clean.endsWith('/') || /\.[a-z0-9]+$/i.test(clean) ? clean : clean + '/';
    if (existing.has(norm)) { if (norm !== url) inbound.set(norm, (inbound.get(norm) || 0) + 1); }
    else if (!assetExists(clean)) fail(url, `Broken internal link: ${h}`);
  }
  const footer = (html.match(/<footer[\s\S]*?<\/footer>/i) || [''])[0];
  if (!footer) conv(url, 'No <footer>. The footer is where every archive link lives.');
  else if (/href=["'][^"']*\/thanks\//i.test(footer)) conv(url, 'Footer links to a success page. Success pages are only reached by converting.');
  else for (const a of archives)
    if (!footer.includes(`href="${a}"`) && !footer.includes(`href="${site}${a}"`)) conv(url, `Footer does not link to the ${a} archive.`);

  // One conversion goal per page. Mark every call-to-action button, link and
  // form with data-cta="<goal>" (for example data-cta="free-quote").
  if (type === 'landing' || type === 'home') {
    const body = html.replace(/<footer[\s\S]*?<\/footer>/i, '');
    const goals = new Set([...body.matchAll(/data-cta\s*=\s*["']([^"']+)["']/gi)].map(m => m[1].trim().toLowerCase()));
    const succ = new Set([...body.matchAll(/data-success\s*=\s*["']([^"']+)["']/gi)].map(m => m[1].trim()));
    if (goals.size && !succ.size) warn(url, 'Call to action has no data-success="/thanks/<goal>/". Every goal should end on its success page.');
    for (const sp of succ) if (sp.startsWith('/') && !existing.has(sp.endsWith('/') ? sp : sp + '/')) conv(url, `Success page ${sp} does not exist.`);
    if (!goals.size) warn(url, 'No call to action marked with data-cta="<goal>". Every landing page needs one clear conversion goal.');
    else if (goals.size > 1) conv(url, `More than one conversion goal on this page (${[...goals].join(', ')}). Give each landing page one goal and move the others to their own pages.`);
    const forms = new Set([...((body.match(/<main[\s\S]*?<\/main>/i) || [''])[0]).matchAll(/<form\b[^>]*>/gi)].map(m => attr(m[0], 'action') || attr(m[0], 'data-cta') || 'inline'));
    if (forms.size > 1) warn(url, `Has ${forms.size} different forms. One page, one form, one goal.`);
    for (const m of ((body.match(/<main[\s\S]*?<\/main>/i) || [''])[0]).matchAll(/<form\b[\s\S]*?<\/form>/gi)) {
      const fields = [...m[0].matchAll(/<(input|select|textarea)\b[^>]*>/gi)].filter(x => !/type=["']?(hidden|submit|button|checkbox|radio)/i.test(x[0])).length;
      if (fields > 4) warn(url, `Form asks for ${fields} things. Every extra field costs conversions. Ask only what you need now (often name and email or phone).`);
    }
    if (/countdown|evergreen-timer|data-fake-scarcity/i.test(body)) warn(url, 'Looks like a countdown timer. Only show real deadlines.');
  }
  const header = (html.match(/<header[\s\S]*?<\/header>/i) || [''])[0];
  const headerLinks = [...header.matchAll(/<a\b/gi)].length;
  if (headerLinks > 2) warn(url, `Header has ${headerLinks} links. Keep the top to the logo and the one call to action.`);

  // Copy quality
  const text = mainText(html); const w = words(text); p.words = w;
  // Resource pages (lead magnets, events reached from content and social) are judged on showing
  // what the visitor gets, not on word count. Mark them <meta name="page-role" content="resource">.
  const role = metaContent(html, 'page-role') || 'search';
  if (role === 'resource' && type === 'landing' && !/data-preview\b/i.test(html)) warn(url, 'Resource page has no preview of what they get (mark it data-preview: an image, sample or agenda).');
  const min = type === 'archive' ? budget.minWordsArchive : type === 'landing' ? (role === 'resource' ? budget.minWordsResource : budget.minWordsDetail) : 0;
  if (w.length < min) warn(url, `Only ${w.length} words of real content (aim ${min}+). Thin pages rarely rank or get cited.`);
  if (/—/.test(text)) warn(url, `Copy uses em dashes (${(text.match(/—/g) || []).length}). Use a full stop, comma or colon.`);
  const lower = ' ' + text.toLowerCase() + ' ';
  const hits = bannedWords.filter(b => new RegExp(`[^a-z]${b.replace(/[-]/g, '[- ]')}[^a-z]`).test(lower));
  if (hits.length) warn(url, `Generic AI-sounding words: ${hits.join(', ')}`);
  for (const r of bannedPhrases) { const m = text.match(r); if (m) warn(url, `Stock phrase: "${m[0]}"`); }
  const sentences = text.split(/[.!?]+\s/).filter(s => words(s).length > 2);
  const avg = sentences.length ? w.length / sentences.length : 0;
  if (avg > 20) warn(url, `Sentences average ${avg.toFixed(0)} words. Aim under 16 so anyone can skim it.`);
}

// Orphans: every page needs at least one link from another page
for (const p of pages) if (p.url !== '/' && !inbound.get(p.url) && p.type !== 'other' && p.type !== 'success') conv(p.url, 'Orphan page: no other page links to it (add it to its archive).');

// Duplicate titles, descriptions, H1s
for (const key of ['title', 'desc', 'h1']) {
  const seen = new Map();
  for (const p of pages) if (p[key]) { if (seen.has(p[key])) fail(p.url, `Same ${key} as ${seen.get(p[key])}: "${p[key]}"`); else seen.set(p[key], p.url); }
}

// Near-duplicate content (the doorway-page trap for location pages)
const shingles = w => { const s = new Set(); for (let i = 0; i + 5 <= w.length; i++) s.add(w.slice(i, i + 5).join(' ')); return s; };
const detail = pages.filter(p => p.type === 'landing' && p.words?.length > 80).map(p => ({ ...p, sh: shingles(p.words) }));
for (let i = 0; i < detail.length; i++) for (let j = i + 1; j < detail.length; j++) {
  const a = detail[i].sh, b = detail[j].sh; let inter = 0; for (const x of a) if (b.has(x)) inter++;
  const sim = inter / Math.min(a.size, b.size);
  if (sim > budget.maxSimilarity) fail(detail[j].url, `${Math.round(sim * 100)}% the same text as ${detail[i].url}. Rewrite it with detail specific to this page.`);
}

// ---------- report ----------
const order = { FAIL: 0, WARN: 1 };
results.sort((a, b) => order[a.level] - order[b.level] || a.page.localeCompare(b.page));
const fails = results.filter(r => r.level === 'FAIL').length, warns = results.length - fails;
console.log(`\nChecked ${pages.length} pages in ${path.relative(process.cwd(), distDir) || distDir}${site ? ` for ${site}` : ''}\n`);
for (const r of results) console.log(`${r.level === 'FAIL' ? 'FAIL' : 'warn'}  ${r.page.padEnd(38)} ${r.msg}`);
const byType = pages.reduce((m, p) => (m[p.type] = (m[p.type] || 0) + 1, m), {});
console.log(`\nPages by type: ${Object.entries(byType).map(([k, v]) => `${k} ${v}`).join(', ')}`);
console.log(fails ? `\n${fails} must-fix problem(s), ${warns} suggestion(s). ${freeform ? 'Fixing the FAIL lines is strongly recommended.' : 'Fix the FAIL lines before publishing.'}\n`
  : `\nNo must-fix problems. ${warns} suggestion(s).\n`);
process.exit(fails ? 1 : 0);
