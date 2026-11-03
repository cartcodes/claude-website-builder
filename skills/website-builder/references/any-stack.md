# Freeform: the conventions on any stack and any host

In Freeform the person leads. They may already have a site, a platform they like, a developer's codebase, or just an idea. Work with what is there. This file says how to apply the copy, conversion, SEO and GEO/AEO conventions on whatever they use.

## How to behave

- Do what they ask, the way they ask. No interview, no required archives, contracts or success pages, and no forced phases.
- If they name a stack or host, use it. If they already have a site, work inside it and follow its existing patterns. If they name nothing, choose a sensible default for the job, say it in one sentence, and move on. A simple fast default is Astro on Cloudflare Pages (`cloudflare-setup.md`), but nothing requires it.
- Mention a problem **once**, in one sentence, only when the request clearly undercuts its own goal: an AI crawler blocked, a page set to noindex by mistake, content loaded only by JavaScript, two competing calls to action. Then do it their way.
- Offer the bigger pieces (keyword research, archives, success pages, contracts, routines) in one line when they would plainly help. Use them if the person says yes.
- Never invent facts, never handle passwords or keys, and ask before anything that costs money, changes a domain or deletes something. These hold in every mode.

## The conventions, as defaults

Apply these unless the person says otherwise:
- **Copy:** `copywriting.md`, including the AI-tells sweep on every page you write.
- **Conversion:** `conversion.md`. One clear action per page and the important things on the first screen are the defaults. If they want a menu, several offers or a long homepage, build it.
- **Search and AI search:** `technical-seo.md`, `geo-aeo.md` and `indexing.md`. These matter on every platform. Only the place where each setting lives changes.

## Where each piece lives, by platform

Find the platform's current way to do each of these: search its documentation, or look at the existing code. Platform menus change often, so never guess button names.

| Piece | Code frameworks (Next.js, Nuxt, SvelteKit, Remix, Astro, Hugo, Eleventy, Jekyll, plain HTML) | Site builders and CMSs (WordPress, Webflow, Shopify, Squarespace, Wix, Framer, Ghost) |
| --- | --- | --- |
| Title, meta description, canonical, Open Graph | The framework's head or metadata system, set per page | Each page's SEO settings, or an SEO plugin or app on WordPress and Shopify |
| Structured data (JSON-LD) | A script tag in the page head or body, built from the page's data | A custom code or embed block in the page head, or an SEO plugin or app |
| sitemap.xml | A sitemap plugin, or a generated route | Usually built in. Check that it lists every page you want found |
| robots.txt | A static file or a generated route | The platform's robots.txt setting or plugin. Make sure it doesn't block AI crawlers |
| llms.txt | A static file at the site root, or a route that lists every page | Upload it as a root file if the platform allows that. Otherwise use a redirect or worker on the host or DNS (for example a Cloudflare rule), or skip it and say so |
| noindex (success and thank-you pages) | A robots meta tag on the page | The page's "hide from search engines" setting |
| Redirects and headers | The host's config (`_redirects`, `vercel.json`, `netlify.toml`, server config) or framework config | The platform's redirects or URL settings |
| Analytics and conversion tracking | Script or tag in the layout, loaded async | The platform's analytics or code-injection setting |

Rendering: search engines and AI crawlers must get the page's text in the HTML. For frameworks, prefer static or server rendering, not client-only. For builders this is usually already true. Check it by fetching the page as a crawler: `curl -s -A "GPTBot" https://<domain>/<page>/ | grep -c "<a phrase from the page>"`.

## Hosting

Use the host the person chose (Cloudflare Pages, Vercel, Netlify, GitHub Pages, their own server, or the builder's own hosting). Publish through that host's own sign-in or command-line login, which the person completes in their browser, or through a Git push the host watches. Never ask for or store tokens. If the host's tool has to be installed, add it to the project at a fixed version (as `cloudflare-setup.md` does with Wrangler) rather than downloading it each time it runs. For AI search, check the host's and the CDN's bot settings (`cloudflare-setup.md`, Part 6, has the Cloudflare version).

## Checks on any stack

The checker reads plain HTML, so it works with anything:
- **The project builds to a folder** (`dist`, `out`, `build`, `_site`, `public`, `.output/public`): build it, then run `node scripts/check-site.mjs <folder> --site https://<domain> --freeform`.
- **No local build** (a site builder, a CMS, a server-rendered app, or a live site): run `node scripts/fetch-site.mjs https://<domain> site-snapshot`, then `node scripts/check-site.mjs site-snapshot --site https://<domain> --freeform`. The fetcher saves only public pages, starting from the sitemap.

With `--freeform`, layout conventions (footer archive links, one goal per page, success pages, breadcrumbs, orphan pages) appear as suggestions. Real problems still show as FAIL: missing titles, descriptions, canonicals or structured data, blocked crawlers, broken links, duplicate pages. Tell the person about every FAIL line in plain words and recommend fixing it. Whether to publish anyway is their call.

Then run the live speed check in `technical-seo.md` and follow `indexing.md` to get indexed. Both are the same on every platform.
