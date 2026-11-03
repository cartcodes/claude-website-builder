# Technical SEO and page speed

## Every page

- `<title>`: 25-65 characters. Main keyword first, then the business name. "[Main keyword] | [Business name]".
- Meta description: 70-160 characters. Says what the page offers, one proof point and the action. It is the ad text in search results, so make it worth clicking.
- One `<h1>` containing the main keyword, phrased for a human.
- `<h2>`s that use secondary keywords and real customer questions naturally.
- Main keyword in the URL (`/<archive>/<slug>/`), in the first 100 words, and in at least one image's alt text and file name.
- Canonical link (full https URL of the page itself).
- Open Graph and Twitter tags: title, description, and a 1200x630 image per page type.
- `<html lang="en">` (or the right language), viewport meta, a favicon set.
- Structured data per `geo-aeo.md`, section 4.
- Visible breadcrumb on every page except home.
- Internal links in the body where they help the reader: a nested page links to its parent page, its related offering or audience page, and 2-3 sibling pages that a visitor might want instead (for nested place pages, nearby places for the same offering).
- Unique title, description, H1 and body on every page. The checker fails duplicates and near-duplicates.

## Site-wide

- `sitemap-index.xml` from `@astrojs/sitemap`, with every indexable page and nothing else.
- `robots.txt` per `geo-aeo.md`, section 1, with the `Sitemap:` line.
- `llms.txt` and `llms-full.txt` per `geo-aeo.md`, section 2.
- One version of every URL: https, one host (bare or www, redirect the other), trailing slash always.
- `404.html` with links to the archives.
- `public/_redirects` for any URLs from an old site (301 to the best matching new page).
- `public/_headers`: long cache for `/_astro/*` and images (`Cache-Control: public, max-age=31536000, immutable`), short cache for HTML. Basic security headers (`X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`).
- Thank-you and form-confirmation pages: `noindex`.

## Page speed budget

Targets, measured on mobile: Largest Contentful Paint under 2.5 s, Interaction to Next Paint under 200 ms, Cumulative Layout Shift under 0.1, Lighthouse Performance 90+.

How to stay inside them:
- Static HTML, almost no JavaScript (budget: 60 KB per page).
- First-screen image: Astro `<Image>`, AVIF/WebP, correct size, `fetchpriority="high"`, never lazy-loaded. Everything below the first screen is lazy-loaded.
- Every image has width and height (prevents layout shift). No single image over 250 KB.
- One self-hosted font family, two weights at most, `font-display: swap`, preload the main weight.
- Third-party scripts (chat widgets, pixels, embeds) never block loading. Load them `defer`/`async` or after the page is interactive, and question every one of them.
- Heavy form or booking embeds: fast button first, embed loads on click or after load.

## The checks

### Before every publish: `npm run check`
Runs `scripts/check-site.mjs` on the built site. It checks every page for:
- title, description, H1, canonical, Open Graph, lang, viewport
- valid JSON-LD, BreadcrumbList on subpages, Service on service and location pages, FAQPage where questions appear
- presence in the sitemap and llms.txt
- robots.txt not blocking any AI crawler, and a Sitemap line
- broken internal links, orphan pages (nothing links to them), footer links to every archive, and a header kept to logo + CTA
- image alt text, dimensions and size, JavaScript weight, render-blocking third-party scripts
- thin content, duplicate titles, descriptions and H1s, and near-duplicate pages (the doorway-page trap)
- answer-first paragraphs under question headings
- em dashes, generic AI-sounding words, stock phrases, and long average sentence length

FAIL lines block publishing. Fix them. Fix warnings too unless there is a stated reason not to.

The checker is one file with its budgets at the top. When the site gains a new page type, add its rules there so every future page gets checked the same way.

### After every publish: live speed check
Run Google PageSpeed Insights for the home page and one page of each type (mobile):
```
node scripts/fetch-site.mjs <page address> --speed
```
Report the four scores and LCP, INP and CLS in one line per page. Fix anything under 90. (No sign-up needed for occasional checks. If it rate-limits, wait a minute.)

### After the domain is live
- Search Console: submit the sitemap and run URL Inspection on the home page and one page of each type.
- Rich Results Test and validator.schema.org on one page of each type.
- AI crawler check: `node scripts/fetch-site.mjs <site address> --bots` (see `cloudflare-setup.md`, Part 6).
