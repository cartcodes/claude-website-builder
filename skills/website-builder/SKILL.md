---
name: website-builder
description: Build, grow and check a fast lead-generation website for any business, run by Claude Code for a non-technical owner. The site is a set of landing pages, each with one conversion goal and everything important on the first screen, grouped into footer-linked archives chosen for that business (places served, offerings, audiences, comparisons, lead magnets, events, or anything else it gives away or sells). Every page and every success action (booked call, submitted form, file download, copy-and-paste delivery, registration, purchase, quiz result, signup) follows a contract, so new pages can be added safely by a person or a scheduled Claude routine. Includes real keyword research backed by demand and competition data, granular service-area discovery, plain persuasive copy with no AI tells, full SEO plus GEO/AEO (AI search), indexing in Google and Bing, page-speed and quality checks, and free hosting on Cloudflare Pages. Two ways to work: a guided Interview that builds the whole system, or Freeform, which applies the same copy, conversion, SEO and GEO/AEO conventions to whatever the person asks for, on any stack and any host (Next.js, WordPress, Webflow, Shopify, Squarespace, Wix, plain HTML, Vercel, Netlify and others), without pushing back. Use when someone wants a website or landing pages, wants to add any kind of landing page or archive, find keywords or places to target, improve SEO or AI visibility, get indexed, or check their site.
---

# Website builder

This skill works for any business: a dentist, a law firm, a contractor, a coach, a software company, a bakery, a church, a course creator. Never assume a trade, a place, or a page type. Everything specific comes from the interview and from research. The examples in these files are examples, nothing more.

The person is probably not technical. They answer questions, click buttons you describe, and approve what you show them. You do everything else.

## Pick how to work (ask once, at the start)

Unless the person's request already makes it obvious, ask with the AskUserQuestion tool (in plain words if that tool isn't available). Question: "How would you like to work?" Two options:

1. **Normal interview.** "I'll guide you step by step: what your pages give away, keyword research, a full site with contracts and checks, published on Cloudflare for free."
2. **Freeform.** "You tell me what you want and I build it your way, on any setup or host you choose. I still use good copywriting, conversion, SEO and AI-search habits, but I won't push back or put you on a track."

Remember the answer in `content/notes.md` (or the project's notes file) so you don't ask again. The person can switch at any time by saying so.

### Freeform mode

Follow `references/any-stack.md`. In short:
- **Their words decide.** Build what they ask, in the order they ask, on the stack, platform and host they name or already have. If they name none, pick something sensible for the job and say what you picked in one sentence. Don't run the interview, don't require contracts or archives, and don't argue with layout or design choices.
- **The conventions are your defaults, not rules.** Write copy with `references/copywriting.md` (including the AI-tells sweep), shape pages with `references/conversion.md`, and apply `references/technical-seo.md`, `references/geo-aeo.md` and `references/indexing.md` wherever they fit. If a request clearly works against its own goal (two competing buttons, a blocked AI crawler, a page hidden from search), mention it once, in one sentence, then do it their way.
- **Use any other reference when it helps** (keyword research, archives, success pages, contracts), and only when they ask for it or it plainly serves what they asked.
- **Checks still run** where they can: point `scripts/check-site.mjs --freeform` at the site's built HTML folder, or fetch a live site first with `scripts/fetch-site.mjs`. In freeform, layout conventions show as suggestions, not failures.
- **Still always:** the "How to work with the person" rules below, no invented facts, no handling of passwords or keys, and asking before anything that costs money, changes a domain or deletes something.

Everything from "Choose the job" onward is the Normal interview. In Freeform, use those sections only as reference.

## The goal: convert the action

Every landing page exists to get one action taken: the booking, the form, the download, the registration, the purchase. Search, AI answers, social posts and ads only bring people to the page. The page works when they act. When a choice helps ranking but hurts conversion, conversion wins. Read `references/conversion.md` before designing or writing any page, and measure every page by its conversion rate.

## The idea behind the site (explain it in these words)

Your website is a collection of landing pages. Each landing page is built for one kind of visitor who wants one thing, and it asks them to do one thing: book a call, get a quote, download a guide, save a seat, buy. Everything they need to decide is on the first screen, and there is no menu to distract them. After they act, they land on a success page that delivers what they asked for and offers one next step.

Landing pages of the same kind are grouped into an **archive**, which is a simple page that lists them all. Your archives depend on what you give away or sell. They might be places you serve, your services, the people you help, free guides, events, or something else entirely. The footer at the bottom of every page links to every archive. Visitors who want to look around can scroll down and find everything, and Google and AI assistants follow those footer links to discover every page.

The site grows by adding landing pages, never by adding menu items. Every page follows a contract (a checklist of required facts and rules), so new pages are quick to add and always meet the standard.

## How to work with the person (always)

- One step at a time. Plain words. Wait for "done" before the next step.
- When they must click something, say exactly what the button says and where it is on screen.
- Never handle passwords, API keys or tokens. Never ask for them in the chat, and never read them from files or the computer. Services that need a login are connected by the person themselves: Cloudflare through its browser login, other tools through their own Claude connectors or CSV exports.
- Ask before anything that costs money, changes a domain, or deletes something.
- After each step, say what you did in one sentence. No jargon.
- Show, don't describe: start the local preview and give them the link whenever there is something to see.
- Never invent facts: no made-up numbers, reviews, places, credentials or search volumes. If a fact is missing, ask.

## Choose the job (Normal interview)

1. **Build a new site.** Every phase, in order.
2. **Add a landing page** of any kind, in any existing archive. Follow "Adding a page" in `references/contracts.md`.
3. **Add a new archive** (a new kind of landing page). Follow "Adding an archive" in `references/contracts.md`.
4. **Find keywords and places, and plan new pages.** Phase 4, then hand back the page plan.
5. **Check, fix and index an existing site.** Phases 8, 9 and 10.
6. **Set up a routine** that adds pages on a schedule. See "Routines" in `references/contracts.md`.

## Phase 1: What will the pages give away? (always first in the interview)

Follow `references/offers-and-archives.md`:
- Build the **offer inventory**: everything the business gives away or sells, and the one action each offer asks for.
- Learn the business model, where customers come from, and the social media plan. Every social post that promises something needs a landing page that delivers it.
- Decide whether places matter at all. Many businesses have no location pages.
- Choose the archives from the templates. Name them in the business's own words and get the person's okay.

## Phase 2: Gather the facts

Read `about.md` and `voice.md` first if they exist, and skip anything they already answer. Then ask, one question at a time, only for what the chosen archives need:
- Proof: years in business, numbers served, credentials or licences, guarantees, awards, rating and review count, and 3+ testimonials with name, place (if relevant) and a specific result.
- Prices or ranges they are happy to publish, and how long things take.
- For each offer, the specific facts its page needs (the contract's fields tell you which).
- Where leads go: booking tool, form tool, CRM, email tool, spreadsheet. If they have none, suggest a free one and help set it up.
- Brand: logo, colours, real photos of their work and people.
- Name, address (if public) and phone exactly as on their Google Business Profile, plus links to every official profile.
- Whether they own a domain, and where they bought it.

Save everything in `content/business.yaml`, `content/offers.md` and `content/notes.md` so nothing is asked twice.

## Phase 3: Set up and connect Cloudflare

Follow `references/cloudflare-setup.md`: Node (if missing), a free Cloudflare account, Wrangler installed into the site at a fixed version, `npm run cf:login`, then `npm run cf:whoami` to confirm.

## Phase 4: Keyword research, place discovery and page plan

Follow `references/keyword-research.md`:
- Build candidates from the offer inventory, the customers' own words, and (only if places matter) the places discovered at the right level of detail.
- Get **real demand** from a named source and check **real competition** in the actual search results.
- Group keywords that share search results into one page, and run each page through the gate.
- Save `research/keywords.csv`, `research/places.csv` (if places matter) and `research/page-plan.md`. Show the person the plan in plain words and get their okay.

## Phase 5: Set up the contracts

Follow `references/contracts.md`:
- Create `contracts/archives/<id>.json` for each chosen archive from `assets/contracts/archive-templates/`, with the business's own id, label, path and goal.
- Copy the success contracts the site needs from `assets/contracts/success/`.
- Copy `scripts/contracts.mjs`, `scripts/new-page.mjs` and `scripts/check-site.mjs` into the site's `scripts/` folder.
- Scaffold every planned page with `node scripts/new-page.mjs`.

## Phase 6: Build the site

Follow `references/site-structure.md`. The stack is Astro + Tailwind with static output. Content collections are generated from the contracts, so the build refuses any page that breaks its contract.

The rules that matter most:
- **One conversion goal per landing page.** Every button and form leads to the same action, marked `data-cta="<goal>"` and `data-success="/thanks/<goal>/"`. A second offer gets its own page.
- **Everything important on the first screen**: logo, a headline that names the problem and contains the page's main keyword, two lines of sub text at most, the one conversion, and trust (badges plus 2-3 short testimonials). The page may scroll, but nobody should need to.
- **No top navigation menu.** The header holds the logo and the call to action only.
- **Archives** list every landing page of their kind. The footer on every page links to every archive.
- **Each archive has a role.** `search` archives are built to rank and be quoted by AI (keyword gate, full SEO/AEO/GEO). `resource` archives hold things linked from content, social posts and email; their pages focus on showing exactly what the visitor gets (a preview is required) and skip the keyword gate. `both` means a resource that also passed the gate.
- **Success pages** follow their success contract: deliver what was promised, offer one next step, never indexed.

## Phase 7: Write the copy

Follow `references/copywriting.md` and `references/conversion.md`: problem-aware, solution-focused, built around the page's keyword, short plain sentences, facts instead of adjectives. Run the AI-tells sweep on every page before showing it.

## Phase 8: Checks

- `references/geo-aeo.md`: the full AI search checklist. Apply all of it.
- `references/technical-seo.md`: metadata, structured data, sitemap, robots.txt, llms.txt, speed.
- Add `"check": "node scripts/contracts.mjs check && astro build && node scripts/check-site.mjs dist"` to `package.json` and run `npm run check` after every change. **Never publish with a FAIL line.** Fix warnings unless there is a stated reason not to, and tell the person which ones you left and why.

## Phase 9: Publish

1. Show the local preview and wait for their okay.
2. `npm run deploy` (it runs the checks first; the first time, create the project as in the setup guide).
3. Give them the live link, then open each archive, one landing page with its success page, `/sitemap-index.xml` and `/llms.txt`.
4. Offer to connect their own domain (setup guide, Part 5). Indexing needs the final domain, so do this before phase 10 if they want one.
5. After publishing, run the live speed check in `references/technical-seo.md`.

## Phase 10: Get indexed

Follow `references/indexing.md`: pre-flight checks, Google Search Console, Bing Webmaster Tools, IndexNow, map listings, and keeping the `.pages.dev` copy out of search. Check progress with the person on days 3, 7 and 14.

## Phase 11: Hand off

1. Three short lines:
   - To add a page: "Tell Claude: add a landing page for [the thing] to [the archive]."
   - To publish changes: "Tell Claude: publish my site."
   - To check health: "Tell Claude: check my site."
2. Write `SITE-GUIDE.md`: those lines, the live links, every archive with its pages, goals and success pages, and where each kind of content lives.
3. Offer the monthly routine (conversion rate per page and one improvement at a time, new page ideas from Search Console, indexing check, AI visibility check) and, if they want, a scheduled Claude routine that adds pages under the contracts.

## Never

In both modes:
- Invent search volumes, reviews, testimonials, statistics, credentials, places or local details.
- Handle passwords, API keys or tokens.
- Block AI crawlers, or leave a host's AI-bot blocking on, without asking.

In the Normal interview (in Freeform, mention these once if relevant, then follow the person):
- Assume the business has places, services, or any particular archive.
- Build two pages that only swap a place or offering name. The checker fails near-duplicates.
- Put two conversion goals on one landing page, or add a top menu.
- Hide content behind JavaScript, tabs that load text later, or client-side rendering. AI crawlers do not run JavaScript.
- Publish with a FAIL line, or with TODO left in any content file.
- Use em dashes in site copy.
