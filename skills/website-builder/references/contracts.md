# Contracts: the rules every page and every success page follows

A contract is a small JSON file that says what a kind of page must contain. Contracts make the site safe to grow. Anyone, including a scheduled Claude routine, can add a page by filling in a contract, and the build refuses the page until every required fact is real.

There are two kinds:
- **Archive contracts** (`contracts/archives/<id>.json`): one per archive this business has. They set the URL, the goal, the required facts, the structured data type and the below-the-fold sections for every landing page in that archive.
- **Success contracts** (`contracts/success/<id>.json`): one per kind of success action. They set what the page after a conversion must deliver and show.

## Where they come from

The skill ships starter templates. Nothing in them is specific to any business.

`assets/contracts/archive-templates/`:

| Template | Use it for | Typical paths |
|---|---|---|
| `place` | Places served, at the level with real demand (region, county, city, neighbourhood, postal code, venue) | `/locations/`, `/areas/`, `/service-areas/`, `/offices/` |
| `offering` | Services, products, treatments, practice areas, programs | `/services/`, `/treatments/`, `/practice-areas/`, `/products/` |
| `offering-in-place` | An offering in a place, nested under the place archive, only where the keyword gate passes | `/areas/<place>/<offering>/` |
| `audience` | Audiences, industries, roles, use cases | `/for/`, `/industries/`, `/use-cases/` |
| `comparison` | Honest comparisons with alternatives | `/compare/`, `/alternatives/` |
| `lead-magnet` | Anything given away: guides, checklists, templates, prompts, scripts, calculators | `/free/`, `/guides/`, `/templates/`, `/prompts/` |
| `event` | Webinars, workshops, classes, live events | `/webinars/`, `/events/`, `/classes/` |

If the business has a kind of landing page none of these fit (recipes, listings, menus, sermons, case studies), copy the closest template and change it. The structure is the same for all of them.

`assets/contracts/success/`:

| Success contract | Used when | The success page must |
|---|---|---|
| `booked-call` | A call, consultation, demo or appointment was booked (the booking tool redirects here) | Confirm the booking, say what to prepare and what happens on the call, explain how to reschedule, offer one next step |
| `form-submitted` | A quote, callback, application or contact form was sent | Confirm receipt, promise a response time you keep, explain what happens next, give a phone number for urgent cases, offer one next step |
| `file-delivery` | A file was requested (guide, checklist, template) | Show a download button (`<a download>` to the file), say how to use it and whether it was also emailed, offer one next step |
| `copy-paste` | Text was requested (prompt, script, email template, snippet) | Show the full text in the HTML inside an element marked `data-copy`, with a Copy button and how to use it, then one next step |
| `registration` | A seat at a webinar, workshop or event was saved | Show date and time (and in the visitor's timezone), an add-to-calendar link (`.ics`), how to join, one next step |
| `quiz-result` | A quiz or assessment was finished (one success page per result) | Give the result in plain words, what it means, what to do, and one next step matched to the result |
| `purchase` | Something was bought (checkout redirects here) | Say what they bought, how to access it now, and how to get support, then one next step |
| `signup` | Joined a newsletter, community or waitlist | Confirm, say what to expect and how often, include a check-your-inbox note if confirmation is needed, then one next step |

Rules shared by every success page:
- URL `/thanks/<goal>/`. `noindex`. Never in the sitemap, llms.txt, any archive or the footer.
- `<meta name="page-role" content="success">` and `<meta name="success-type" content="<contract id>">` in the head, so the checker runs the right checks.
- Exactly one next step, marked `data-cta`. This is the one place a second offer belongs, because the first goal is already done.
- The page view is the conversion. Ad pixels and analytics goals fire here.
- Pages that share a goal share one success page (every quote form leads to `/thanks/free-quote/`). Pages that deliver something different (each lead magnet) get their own.

## Setting up a site's contracts (phase 5)

1. For each archive chosen in phase 1, copy its template to `contracts/archives/<id>.json` and set:
   - `id`: short and in the business's words (`areas`, `treatments`, `guides`). This is also the content folder name.
   - `label`: what visitors see in the footer and on the archive ("Areas we serve").
   - `path`: the archive URL with slashes (`/areas/`).
   - `goal.defaultGoal`: for archives where every page has the same goal, a shared goal id (`free-quote`, `book-visit`, `book-call`). Keep `{slug}` where each page delivers something different.
   - `goal.defaultSuccess`: the success contract that goal ends on.
   - `parentArchive`: for nested archives (such as `offering-in-place`), the id of the parent archive.
   - Change, add or remove fields so the contract asks for the facts this business really has. Keep the shared landing-page fields (title, description, h1, keyword, subtext, goal, cta, success, testimonials, faqs, updated).
   - Drop `demandEvidence` only for archives that are purely for social or email traffic.
2. Copy the success contracts the goals use into `contracts/success/`.
3. Copy `scripts/contracts.mjs`, `scripts/new-page.mjs` and `scripts/check-site.mjs` from the skill into the site's `scripts/` folder.
4. In `src/content.config.ts`, build the collections from the contracts so Astro enforces them at build time:
   ```ts
   import { defineCollection } from 'astro:content';
   import { glob } from 'astro/loaders';
   import { z } from 'astro/zod';
   import { loadContracts, schemaFor } from '../scripts/contracts.mjs';
   const { archives, success } = loadContracts();
   export const collections = Object.fromEntries([
     ...archives.map(c => [c.id, defineCollection({
       loader: glob({ pattern: '**/*.md', base: `./content/${c.id}` }), schema: schemaFor(c, z) })]),
     ['success', defineCollection({
       loader: glob({ pattern: '**/*.md', base: './content/success' }),
       schema: z.discriminatedUnion('type', success.map(c => schemaFor(c, z, { type: c.id }))) })],
   ]);
   ```
   (Success contracts must not use `requiredIf`, because the discriminated union needs plain objects.)
5. Write one Astro template per archive contract (landing page plus archive listing), one per success contract, and the shared layout, footer, sitemap, `llms.txt` and `robots.txt` endpoints. Every template reads from the content collections. Nothing about any single page is hard-coded.
6. Add `data-cta="{goal}"` and `data-success="/thanks/{goal}/"` to every call to action and form in the landing template. Configure booking, form and checkout tools to redirect to the success page.

## Adding a page (any kind, any archive)

1. `node scripts/new-page.mjs --list` shows the archives and success contracts.
2. `node scripts/new-page.mjs <archive> <slug>` creates the page file (and the success page file if its goal doesn't have one yet). For nested archives, add `--parent <slug>`. Override the goal or success type with `--goal` and `--success`.
3. Replace every `TODO` with real facts from `content/business.yaml`, `content/offers.md` and the person. If a fact is missing, ask. Never invent one.
4. Write the below-the-fold content in the order the contract's `sections` list, following `copywriting.md`.
5. If the page targets a search, confirm it passed the keyword gate and fill `demandEvidence`.
6. `npm run check`. The contract check, the build and the site checker must all pass.
7. Confirm the page appears in its archive (and its parent page, if nested), the footer if it is a top page, the sitemap and llms.txt, and that its goal ends on a working success page.
8. Publish, then request indexing (`indexing.md`, section 6).

## Adding an archive

1. Confirm it is worth it (`offers-and-archives.md`, section 3): at least two pages, real traffic sources, one goal per page.
2. Copy the closest template to `contracts/archives/<id>.json` and set it up as above.
3. Add the success contract it needs, if the site doesn't have it yet.
4. Add the Astro templates for the new archive (landing page and archive listing). The footer, sitemap and llms.txt read from the contracts, so they pick it up automatically.
5. Add its first two pages with `new-page.mjs`, then `npm run check`.

## Routines (adding pages on a schedule, safely)

Because every page is a contract plus facts, a scheduled Claude routine can add pages without breaking the rules. A routine prompt should say:

> In [site folder], add [N] new landing pages from `research/page-plan.md` (or from [source: new lead magnets in a folder, new places from Search Console, this month's webinar]). Follow `references/contracts.md`, "Adding a page", exactly. Use only facts from the content files and the source. If a required fact is missing, skip that page and list what is missing. Run `npm run check`. Publish only if there are no FAIL lines and no TODOs. Then request indexing, update `SITE-GUIDE.md`, and report what was added, what was skipped and why.

Good routine sources:
- A folder where the owner drops new lead magnets (files or text). Each one becomes a `lead-magnet` page with a `file-delivery` or `copy-paste` success page.
- Search Console queries with impressions but no page (new places, offerings or questions), run through the keyword gate first.
- An events calendar: each new event becomes an `event` page with a `registration` success page. Past events switch to `format: replay` or are removed.
- New case studies or testimonials, added to the matching pages.

A routine must never publish a page that fails its contract, invent facts, or create an archive without the owner's okay.
