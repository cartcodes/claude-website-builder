#!/usr/bin/env node
// build-magnet.mjs: turns one lead magnet's source into the files people download.
// Source folder: lead-magnets/<slug>/ with magnet.md (front matter + Markdown body)
// and any extra files to hand over (CSV templates, images, .ics).
// Output, in lead-magnets/<slug>/build/:
//   <slug>.html   print-ready, branded, readable on a phone
//   <slug>.pdf    the download (made with Chrome, Edge or Chromium if one is installed)
//   cover.png     1080x1350 cover image for the landing page preview, posts and ads
//   square.png    1080x1080 version for feeds and ads
// --site <folder> also copies the PDF, the phone-friendly HTML and extras into <folder>/downloads/ and the
// cover images into <folder>/images/lead-magnets/ (for Astro: --site public).
// Usage: node scripts/build-magnet.mjs lead-magnets/<slug> [--site public] [--letter|--a4]
// No dependencies. Works on macOS, Windows and Linux.

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const args = process.argv.slice(2);
const SRC = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--site');
if (!SRC || !fs.existsSync(path.join(SRC, 'magnet.md'))) {
  console.error('Usage: node scripts/build-magnet.mjs lead-magnets/<slug> [--site public]\nThe folder needs a magnet.md file.');
  process.exit(1);
}
const SITE = args.includes('--site') ? args[args.indexOf('--site') + 1] : null;
const PAGE = args.includes('--a4') ? 'A4' : 'Letter';
const slug = path.basename(path.resolve(SRC));
const OUT = path.join(SRC, 'build');
fs.mkdirSync(OUT, { recursive: true });

// ---------- front matter ----------
const raw = fs.readFileSync(path.join(SRC, 'magnet.md'), 'utf8').replace(/\r\n/g, '\n');
const fm = {}; let body = raw;
const m = raw.match(/^---\n([\s\S]*?)\n---\n?/);
if (m) {
  body = raw.slice(m[0].length);
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^([A-Za-z][\w-]*):\s*(.*)$/);
    if (kv) fm[kv[1]] = kv[2].replace(/^["']|["']$/g, '').trim();
  }
}
const need = ['title', 'business'];
const missing = need.filter(k => !fm[k]);
if (missing.length) { console.error(`magnet.md front matter is missing: ${missing.join(', ')}`); process.exit(1); }
const brand = fm.color || '#1f4fd1';
const ink = fm.ink || '#16181d';
const font = fm.font || 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

// ---------- small Markdown renderer ----------
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const inline = s => esc(s)
  .replace(/`([^`]+)`/g, '<code>$1</code>')
  .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>')
  .replace(/\[([^\]]+)\]\((https?:[^)\s]+|mailto:[^)\s]+|tel:[^)\s]+)\)/g, '<a href="$2">$1</a>')
  .replace(/_{4,}/g, '<span class="fill"></span>');

function render(md) {
  const lines = md.split('\n'); const out = []; let i = 0;
  const isBlockStart = l => /^(#{1,4} |[-*] |\d+\. |> |```|\|)/.test(l) || /^<!--\s*page\s*-->$/.test(l.trim()) || /^:::/.test(l);
  while (i < lines.length) {
    const l = lines[i];
    if (!l.trim()) { i++; continue; }
    if (/^<!--\s*page\s*-->$/.test(l.trim())) { out.push('<div class="pb"></div>'); i++; continue; }
    if (l.startsWith('```')) { // code block: prompts, scripts, swipe text. Keeps line breaks.
      const buf = []; i++;
      while (i < lines.length && !lines[i].startsWith('```')) buf.push(lines[i++]);
      i++; out.push(`<pre class="copy">${esc(buf.join('\n'))}</pre>`); continue;
    }
    const h = l.match(/^(#{1,4}) (.*)$/);
    if (h) { const n = h[1].length + (h[1].length === 1 ? 0 : 0); out.push(`<h${n}>${inline(h[2])}</h${n}>`); i++; continue; }
    if (/^:::(tip|warning|example|note)/.test(l)) { // callout box
      const kind = l.match(/^:::(\w+)/)[1]; const label = l.replace(/^:::\w+\s*/, '') || kind[0].toUpperCase() + kind.slice(1);
      const buf = []; i++;
      while (i < lines.length && !/^:::\s*$/.test(lines[i])) buf.push(lines[i++]);
      i++; out.push(`<aside class="box ${kind}"><b>${inline(label)}</b>${render(buf.join('\n'))}</aside>`); continue;
    }
    if (l.startsWith('|')) { // table
      const rows = []; while (i < lines.length && lines[i].startsWith('|')) rows.push(lines[i++]);
      const cells = r => r.replace(/^\||\|$/g, '').split('|').map(c => c.trim());
      const head = cells(rows[0]); const rest = rows.slice(/^\|[\s:|-]+\|$/.test(rows[1] || '') ? 2 : 1);
      out.push(`<table><thead><tr>${head.map(c => `<th>${inline(c)}</th>`).join('')}</tr></thead><tbody>${
        rest.map(r => `<tr>${cells(r).map(c => `<td>${c ? inline(c) : '<span class="fill"></span>'}</td>`).join('')}</tr>`).join('')}</tbody></table>`);
      continue;
    }
    if (/^> /.test(l)) { const buf = []; while (i < lines.length && /^> ?/.test(lines[i])) buf.push(lines[i++].replace(/^> ?/, '')); out.push(`<blockquote>${render(buf.join('\n'))}</blockquote>`); continue; }
    if (/^([-*]|\d+\.) /.test(l)) { // lists, including "- [ ]" checklists
      const ordered = /^\d+\. /.test(l); const items = [];
      while (i < lines.length && /^([-*]|\d+\.) /.test(lines[i])) items.push(lines[i++].replace(/^([-*]|\d+\.) /, ''));
      const check = items.every(t => /^\[[ x]\] /i.test(t));
      const tag = ordered ? 'ol' : 'ul';
      out.push(`<${tag}${check ? ' class="check"' : ''}>${items.map(t => check
        ? `<li><span class="cb"></span>${inline(t.replace(/^\[[ x]\] /i, ''))}</li>` : `<li>${inline(t)}</li>`).join('')}</${tag}>`);
      continue;
    }
    const buf = []; while (i < lines.length && lines[i].trim() && !isBlockStart(lines[i])) buf.push(lines[i++]);
    out.push(`<p>${inline(buf.join(' '))}</p>`);
  }
  return out.join('\n');
}

// What's inside, for the covers: front matter "inside: a; b; c", or the first
// checklist items, list items or section headings of the content.
const strip = t => t.replace(/\[[ x]\] /i, '').replace(/[*`]/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').trim();
const inside = (fm.inside ? fm.inside.split(';') : (() => {
  const items = [...body.matchAll(/^[-*] \[[ x]\] (.+)$/gim)].map(x => x[1]);
  if (items.length >= 3) return items;
  const heads = [...body.matchAll(/^## (.+)$/gm)].map(x => x[1]);
  return heads.length >= 3 ? heads : [...body.matchAll(/^(?:[-*]|\d+\.) (.+)$/gm)].map(x => x[1]);
})()).map(strip).filter(Boolean).slice(0, 4);
const insideList = inside.length ? `<ul class="inside">${inside.map(t => `<li>${inline(t)}</li>`).join('')}</ul>` : '';

// ---------- page ----------
const css = `
@page { size: ${PAGE}; margin: 18mm 16mm 20mm; }
* { box-sizing: border-box; }
html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body { margin: 0; font-family: ${font}; color: ${ink}; font-size: 13.5pt; line-height: 1.5; }
main { max-width: 720px; margin: 0 auto; padding: 0 18px 40px; }
h1, h2, h3, h4 { line-height: 1.2; break-after: avoid; }
h1 { font-size: 26pt; margin: 0 0 8px; } h2 { font-size: 18pt; margin: 28px 0 8px; color: ${brand}; }
h3 { font-size: 15pt; margin: 20px 0 6px; } h4 { font-size: 13pt; margin: 16px 0 4px; text-transform: uppercase; letter-spacing: .04em; }
p, li { orphans: 3; widows: 3; } a { color: ${brand}; }
ul.check { list-style: none; padding-left: 0; } ul.check li { display: flex; gap: 10px; align-items: flex-start; margin: 8px 0; break-inside: avoid; }
.cb { flex: 0 0 15px; height: 15px; margin-top: 3px; border: 2px solid ${brand}; border-radius: 3px; }
.fill { display: inline-block; min-width: 180px; border-bottom: 1px solid #9aa0aa; height: 1.1em; vertical-align: bottom; }
td .fill { min-width: 60px; width: 100%; }
table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 12pt; break-inside: auto; }
th { background: ${brand}; color: #fff; text-align: left; } th, td { padding: 7px 9px; border: 1px solid #d9dce2; vertical-align: top; }
tr { break-inside: avoid; } td { height: 26px; }
pre.copy { white-space: pre-wrap; font: 11.5pt/1.5 ui-monospace, Menlo, Consolas, monospace; background: #f4f5f8; border-left: 4px solid ${brand}; padding: 12px 14px; break-inside: avoid; }
code { font-family: ui-monospace, Menlo, Consolas, monospace; background: #f4f5f8; padding: 1px 4px; border-radius: 3px; }
blockquote { margin: 14px 0; padding: 4px 16px; border-left: 4px solid #d9dce2; color: #444; }
.box { display: block; margin: 16px 0; padding: 12px 16px; border-radius: 8px; background: #f1f5ff; border: 1px solid ${brand}33; break-inside: avoid; }
.box.warning { background: #fff6ec; border-color: #f0b46a; } .box.example { background: #f3faf4; border-color: #8cc79a; }
.box > b { display: block; margin-bottom: 2px; }
.pb { break-after: page; height: 0; }
.cover { min-height: 230mm; display: flex; flex-direction: column; justify-content: space-between; padding: 26mm 4mm 0; break-after: page; }
.cover .kicker { font-size: 11pt; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: ${brand}; }
.cover h1 { font-size: 34pt; margin: 12px 0 14px; } .cover .sub { font-size: 15pt; color: #444; max-width: 560px; }
.cover ul.inside { list-style: none; padding: 0; margin: 26px 0 0; font-size: 13pt; } .cover ul.inside li { padding: 8px 0 8px 30px; position: relative; border-bottom: 1px solid #eceef2; }
.cover ul.inside li::before { content: '✓'; position: absolute; left: 4px; color: ${brand}; font-weight: 800; }
.cover .by { border-top: 3px solid ${brand}; padding-top: 12px; font-size: 11pt; }
.next { margin-top: 40px; padding: 22px; border-radius: 12px; background: ${brand}; color: #fff; break-inside: avoid; }
.next h2 { color: #fff; margin-top: 0; } .next a { color: #fff; font-weight: 700; }
footer.run { margin-top: 30px; font-size: 9pt; color: #777; border-top: 1px solid #e3e5ea; padding-top: 8px; }
@media screen { body { background: #e9ebef; } main { background: #fff; padding: 24px 22px 40px; margin: 16px auto; border-radius: 10px; } .cover { min-height: auto; padding: 10px 0 30px; } }
`;
const coverHtml = `<section class="cover">
  <div><div class="kicker">${inline(fm.kicker || 'Free ' + (fm.format || 'guide'))}</div>
  <h1>${inline(fm.title)}</h1>${fm.subtitle ? `<div class="sub">${inline(fm.subtitle)}</div>` : ''}${insideList}</div>
  <div class="by">${fm.logo ? `<img src="${fm.logo}" alt="" style="height:34px;display:block;margin-bottom:8px">` : ''}<b>${inline(fm.business)}</b>${fm.website ? ` · ${inline(fm.website)}` : ''}</div>
</section>`;
const nextHtml = fm.cta && fm.ctaLink ? `<section class="next"><h2>${inline(fm.ctaHeading || 'Want help with this?')}</h2>
  <p>${inline(fm.ctaText || '')}</p><p><a href="${fm.ctaLink}">${inline(fm.cta)} →</a></p></section>` : '';
const html = `<!doctype html><html lang="${fm.lang || 'en'}"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>${esc(fm.title)}</title><style>${css}</style></head>
<body><main>${coverHtml}
${render(body)}
${nextHtml}
<footer class="run">${inline(fm.business)}${fm.website ? ` · ${inline(fm.website)}` : ''}${fm.updated ? ` · Updated ${inline(fm.updated)}` : ''}</footer>
</main></body></html>`;
const htmlPath = path.join(OUT, `${slug}.html`);
fs.writeFileSync(htmlPath, html);

// Cover images for previews, posts and ads: the cover alone, sized for social.
// Headless Chrome paints a viewport about 90px shorter than the image, so the card
// stays clear of the bottom edge and the unpainted strip gets the background colour.
const coverBg = /^#[0-9a-f]{6}$/i.test(fm.coverBg || '') ? fm.coverBg : '#f4f5f8';
const coverPage = (w, h) => `<!doctype html><html><head><meta charset="utf-8"><style>
* { box-sizing: border-box; } html, body { margin: 0; width: ${w}px; height: ${h}px; overflow: hidden; background: ${coverBg}; }
body { font-family: ${font}; color: ${ink}; display: flex; align-items: center; justify-content: center; }
.doc { width: ${Math.round(w * 0.72)}px; height: ${Math.round(h * 0.74)}px; background: #fff; border-radius: 14px; box-shadow: 0 16px 34px rgba(0,0,0,.16), 0 4px 10px rgba(0,0,0,.07);
  padding: ${Math.round(w * 0.06)}px; display: flex; flex-direction: column; justify-content: space-between; border-top: 14px solid ${brand}; }
.k { font-size: ${Math.round(w * 0.022)}px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: ${brand}; }
h1 { font-size: ${Math.round(w * (h > w ? 0.058 : 0.05))}px; line-height: 1.12; margin: 18px 0 16px; }
.s { font-size: ${Math.round(w * 0.026)}px; line-height: 1.35; color: #444; }
.i { list-style: none; padding: 0; margin: ${Math.round(w * 0.03)}px 0 0; font-size: ${Math.round(w * 0.024)}px; line-height: 1.3; }
.i li { padding: ${Math.round(w * 0.011)}px 0 ${Math.round(w * 0.011)}px ${Math.round(w * 0.04)}px; position: relative; border-bottom: 1px solid #eceef2; }
.i li::before { content: '✓'; position: absolute; left: 0; color: ${brand}; font-weight: 800; }
.b { font-size: ${Math.round(w * 0.022)}px; border-top: 4px solid ${brand}; padding-top: 14px; font-weight: 700; }
</style></head><body><div class="doc"><div><div class="k">${inline(fm.kicker || 'Free ' + (fm.format || 'guide'))}</div>
<h1>${inline(fm.title)}</h1>${fm.subtitle ? `<div class="s">${inline(fm.subtitle)}</div>` : ''}${inside.length ? `<ul class="i">${inside.slice(0, h > w ? 4 : 3).map(t => `<li>${inline(t)}</li>`).join('')}</ul>` : ''}</div>
<div class="b">${inline(fm.business)}</div></div></body></html>`;
fs.writeFileSync(path.join(OUT, 'cover.html'), coverPage(1080, 1350));
fs.writeFileSync(path.join(OUT, 'square.html'), coverPage(1080, 1080));

// ---------- find a browser to print with ----------
function findBrowser() {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH;
  const c = {
    darwin: ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
      '/Applications/Chromium.app/Contents/MacOS/Chromium', '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser'],
    win32: [`${process.env.PROGRAMFILES}\\Google\\Chrome\\Application\\chrome.exe`, `${process.env['PROGRAMFILES(X86)']}\\Google\\Chrome\\Application\\chrome.exe`,
      `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`, `${process.env['PROGRAMFILES(X86)']}\\Microsoft\\Edge\\Application\\msedge.exe`,
      `${process.env.PROGRAMFILES}\\Microsoft\\Edge\\Application\\msedge.exe`],
    linux: ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/microsoft-edge', '/snap/bin/chromium'],
  }[process.platform] || [];
  return c.find(p => p && fs.existsSync(p));
}
const browser = findBrowser();
const made = [htmlPath];
if (browser) {
  const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'magnet-'));
  // Some browsers keep running after writing the file, so wait for the file
  // to appear and stop changing, then close the browser.
  const run = (extra, outFile) => new Promise((resolve, reject) => {
    try { fs.rmSync(outFile, { force: true }); } catch {}
    const p = spawn(browser, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
      '--disable-extensions', `--user-data-dir=${prof}`, ...extra], { stdio: 'ignore' });
    let last = -1, stable = 0, done = false;
    const finish = err => { if (done) return; done = true; clearInterval(t); clearTimeout(cap); try { p.kill(); } catch {} err ? reject(err) : resolve(); };
    const t = setInterval(() => {
      const size = fs.existsSync(outFile) ? fs.statSync(outFile).size : -1;
      if (size > 0 && size === last) { if (++stable >= 3) finish(); } else stable = 0;
      last = size;
    }, 250);
    p.on('exit', () => setTimeout(() => (fs.existsSync(outFile) && fs.statSync(outFile).size > 0) ? finish() : finish(new Error('no file was written')), 300));
    p.on('error', finish);
    const cap = setTimeout(() => finish(new Error('timed out after 60 seconds')), 60000);
  });
  try {
    const pdf = path.join(OUT, `${slug}.pdf`);
    await run(['--no-pdf-header-footer', `--print-to-pdf=${path.resolve(pdf)}`, pathToFileURL(path.resolve(htmlPath)).href], pdf);
    made.push(pdf);
    for (const [name, w, h] of [['cover', 1080, 1350], ['square', 1080, 1080]]) {
      const png = path.join(OUT, `${name}.png`);
      await run(['--hide-scrollbars', `--default-background-color=${coverBg.slice(1)}ff`, `--window-size=${w},${h}`, `--screenshot=${path.resolve(png)}`, pathToFileURL(path.resolve(path.join(OUT, `${name}.html`))).href], png);
      made.push(png);
    }
  } catch (e) { console.log(`The browser could not print (${e.message.split('\n')[0]}). Open ${htmlPath} and use Print > Save as PDF.`); }
  finally { await new Promise(r => setTimeout(r, 500)); try { fs.rmSync(prof, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }); } catch {} }
} else {
  console.log('No Chrome, Edge or Chromium found, so no PDF yet. Either install Google Chrome (free) and run this again,');
  console.log(`or open ${htmlPath} in any browser and use Print > Save as PDF. Set CHROME_PATH if the browser is somewhere unusual.`);
}

// Extra files handed over as they are (CSV templates, .ics, images, ready-made files).
const extras = fs.readdirSync(SRC).filter(f => !['magnet.md', 'build', 'promo.md', 'notes.md'].includes(f) && !f.startsWith('.') && fs.statSync(path.join(SRC, f)).isFile());

if (SITE) {
  const dl = path.join(SITE, 'downloads'); const img = path.join(SITE, 'images', 'lead-magnets');
  fs.mkdirSync(dl, { recursive: true }); fs.mkdirSync(img, { recursive: true });
  const pdf = path.join(OUT, `${slug}.pdf`);
  if (fs.existsSync(pdf)) fs.copyFileSync(pdf, path.join(dl, `${slug}.pdf`));
  fs.copyFileSync(htmlPath, path.join(dl, `${slug}.html`)); // opens in any phone browser, no PDF viewer needed
  for (const f of extras) fs.copyFileSync(path.join(SRC, f), path.join(dl, f));
  for (const n of ['cover', 'square']) { const p = path.join(OUT, `${n}.png`); if (fs.existsSync(p)) fs.copyFileSync(p, path.join(img, `${slug}-${n}.png`)); }
  console.log(`Copied the download into ${dl} and the cover images into ${img}.`);
}

// Quick quality report on the content itself.
const text = body.replace(/```[\s\S]*?```/g, ' ');
const wordsN = (text.match(/[A-Za-z0-9'-]+/g) || []).length;
const notes = [];
if (/—/.test(raw)) notes.push('Uses em dashes. Use a full stop, comma or colon.');
if (/\bTODO\b|lorem ipsum/i.test(raw)) notes.push('Still has TODO or placeholder text.');
if (!fm.cta || !fm.ctaLink) notes.push('No cta and ctaLink in the front matter, so the last page has no next step. Add one that leads to the main offer.');
if (fm.title.length > 70) notes.push(`Title is ${fm.title.length} characters. Shorter titles read better on a cover and in a feed.`);
console.log(`\nBuilt "${fm.title}" (${wordsN} words${fm.format ? `, ${fm.format}` : ''}):`);
for (const f of made) console.log(`  ${f}`);
for (const f of extras) console.log(`  ${path.join(SRC, f)} (handed over as is)`);
if (notes.length) { console.log('\nBefore it goes out:'); for (const n of notes) console.log(`  - ${n}`); }
