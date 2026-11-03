# Site structure: landing pages, archives, success pages, footer

## The idea

**The site is a collection of landing pages, organised into archives.** Each landing page is built for one kind of visitor who came for one thing, and it asks them to take one action. An archive is a page that lists every landing page of one kind. A success page is where each action ends.

The archives come from the offer inventory (`offers-and-archives.md`), not from a fixed list. One business might have places, offerings and guides. Another might have audiences, comparisons and templates. Another might have only events and a single offer. Each archive has a contract (`contracts.md`) and a role:

- **search**: built to rank in Google and Bing and be quoted by AI assistants. Full keyword gate, full SEO/AEO/GEO.
- **resource**: reached mainly from content, social posts, email and other pages. The page's job is to show exactly what the visitor gets and convert them. No keyword gate, and lighter word counts. A preview of what they get is required.
- **both**: a resource that also passed the keyword gate.

Every page is still crawlable, has full metadata and structured data, and appears in the sitemap and llms.txt. The role only changes what the page is optimised for.

The home page is a landing page too: the main offer, with one goal.

## One page, one conversion goal

The page exists to convert one action (`conversion.md`).

- Every landing page has exactly **one** goal. Every button and form on it leads to the same action. The call to action may repeat further down, but it is always the same one.
- A second offer gets its own landing page in its own archive. It never appears on this page as a second button, a pop-up, a sidebar or a "you might also like" box.
- The only other links on a landing page are the small breadcrumb at the top, and the related-page block and footer at the bottom, below everything that matters.
- Mark every call-to-action button, link and form with `data-cta="<goal>"` and `data-success="/thanks/<goal>/"`. The checker fails a page with two goals or a missing success page.
- The success page is the right place for the next offer, because the first goal is done.

## The first-screen rule

What fits on the screen before anyone scrolls (test at 1366x768 desktop and 390x844 phone) must show:

1. Logo (links home).
2. Headline: names the problem or outcome the visitor came for, in their words, matching the search, post or ad that sent them. Search pages include the main keyword.
3. Sub text: two lines at most. Who it is for, and the strongest proof.
4. The one action: form or button. Right column on desktop, directly under the headline on mobile. The button says what they get.
5. Trust next to the action: badges (credentials, guarantee, rating plus review count, years), and 2-3 short testimonials with a name and a specific result.
6. Resource pages: a preview of what they get (an image of the guide, a sample of the template or prompt, the event agenda), marked `data-preview`.

The page **can** continue below the first screen. Everything there supports the same goal: details, how it works, more proof, pricing, objections, FAQs, and the same call to action again. Nobody should need to scroll to understand the offer or to act.

Header: logo and the page's call-to-action button only. No menu, no hamburger, no links to other pages.

## Archives

Each archive is its own page at its own path, uses the same no-menu layout, and lists every landing page of its kind as a card: the page's headline, a one-line description and a link. Its own goal is to send people to the right landing page. A short intro can carry the business's main call to action.

Nesting, when it helps (defined by `parentArchive` in a contract):
- A child page sits under its parent page's URL (`/<parent-archive>/<parent>/<child>/`), and the parent page lists its children below the main content.
- Typical use: offering-in-place pages under each place page, sub-areas under a region, a series of guides under a topic.
- Every page below home shows a visible breadcrumb (Home > Archive > Parent > Page) and has BreadcrumbList structured data.

Related-page links sit in a small block below the main content ("Also nearby", "More free templates", "Other industries we help"), never above it.

Don't create an archive with fewer than two pages. Add it once it has two.

## The footer (identical on every page)

Below the first screen, at the very bottom:

- **One column per archive**: the archive's label, linking to the archive page, plus up to its `footerLinks` number of its most important landing pages. Every archive appears on every page.
- **Company**: About, Contact, Reviews (if there is a page), Privacy, Terms.
- Business name, plus address (if public) and phone exactly as on the Google Business Profile, as plain text. Consistent details matter for local search and AI answers.
- Links to the Google Business Profile and official social profiles.
- Never a link to a success page.

The footer is how the site grows without a menu: every page is at most two clicks from any other page (footer, then archive, then page).

## Success pages

- One per goal, at `/thanks/<goal>/`, built from its success contract (`contracts.md`).
- Delivers exactly what was promised, immediately: the download, the text to copy, the calendar link, the confirmation and next steps.
- One next step, marked `data-cta`.
- `noindex`, not in the sitemap, llms.txt, archives or footer. `<meta name="page-role" content="success">` and `<meta name="success-type" content="<contract id>">` in the head.
- Booking, form and checkout tools redirect here after the action, so the success page view is the conversion.

## Content files (why adding a page stays easy)

```
contracts/
  archives/<archive-id>.json      one per archive this business has
  success/<success-id>.json       one per kind of success action used
content/
  business.yaml                   name, contact, proof, testimonials, profiles, brand
  offers.md                       the offer inventory
  <archive-id>/<slug>.md          one file per landing page
  <archive-id>/<parent>/<slug>.md nested pages
  success/<goal>.md               one file per success page
research/
  keywords.csv, places.csv, page-plan.md, conversion.md
```

Each page file's front matter holds the fields its contract requires. The body holds the below-the-fold content, in the order the contract's `sections` list.

Templates generate everything else from these files:
- each landing page with its metadata, structured data, breadcrumb, goal and success link,
- each archive page and each parent page's list of children,
- the footer columns,
- `sitemap-index.xml` (with `@astrojs/sitemap`, excluding `/thanks/`),
- `llms.txt` and `llms-full.txt` (an endpoint that loops over every archive, grouped one `##` section per archive),
- `robots.txt`.

Adding a page is one command and one file (`contracts.md`, "Adding a page"). Adding a whole archive is one contract, two templates and its first pages. The footer, sitemap and llms.txt pick it up automatically.

## Build rules

- Astro, static output (`output: 'static'`), Tailwind, no client-side framework unless a piece really needs it.
- Content collections built from the contracts (`contracts.md`, setup step 4), so the build refuses any page that breaks its contract.
- All text is in the HTML at build time. No content loaded by JavaScript, and no text that only appears after a click. FAQ answers are visible (a plain `<details>` element is fine, because the text is in the HTML).
- Mark resource pages with `<meta name="page-role" content="resource">` so the checker applies resource rules.
- Use `<header>`, `<main>`, `<footer>`, one `<h1>`, and `<h2>`/`<h3>` in order.
- Images: Astro's `<Image>` (AVIF/WebP, width and height set), descriptive file names, real alt text. Lazy-load everything below the first screen and preload the main first-screen image.
- Fonts: self-host one family with two weights at most, and `font-display: swap`.
- Forms and booking widgets: if an embed is heavy, show a fast button on the first screen that opens it, or load it after the page has loaded.
- Trailing slashes everywhere (`trailingSlash: 'always'`). Set `site` in `astro.config` to the final domain.
- `public/_headers` for caching and basic security headers, `public/_redirects` for old URLs, and a helpful `404.html` that links to the archives.
