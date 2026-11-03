# Step one: what will the pages give away? Then choose the archives

Before anything else, find out everything the business can give away or sell, and the one action each thing should get. Every one of those things can become a landing page built to convert that action. Things of the same kind become an archive. This decides the whole site, so do it first and do it carefully. Assume nothing about the business: no trade, no places, no page types.

## 1. The offer inventory (the first part of the interview)

Ask one question at a time, and write each answer as a row in `content/offers.md`:

1. "What's the main thing you want people to do? Book a call, request a quote, buy, sign up, visit, apply?"
2. "What do you already give away for free, or could easily? Guides, checklists, templates, prompts, scripts, calculators, price lists, videos, a quiz, a free assessment or consultation, a trial, a sample?"
3. "Do you run webinars, workshops, classes or events?"
4. "Which offerings make you the most money, or do you most want more of?"
5. "Do you serve specific places, or anyone anywhere?" (If anywhere, skip place pages entirely.)
6. "Do you serve specific kinds of customers, industries or situations?"
7. "Who do customers compare you with?"
8. "Where do people find you today, and where do you post? Search, maps, Instagram, TikTok, YouTube, LinkedIn, Facebook groups, email, ads, referrals, partners?"
9. "When you post on social media or send email, what do you ask people to do?"

For each offer, record:

| Field | Example |
|---|---|
| Offer | [the thing, in the owner's words] |
| Kind | offering / free resource / event / consultation / product / ... |
| The one action | book / request / download / copy / register / buy / join |
| What the visitor gives | nothing, email, name + phone, payment |
| What the visitor gets | the specific deliverable |
| Success contract | booked-call / form-submitted / file-delivery / copy-paste / registration / quiz-result / purchase / signup |
| Where traffic comes from | search, social, email, ads, other pages |
| Search demand | yes / no / unknown (checked in keyword research) |
| Where leads go | the CRM, email tool, booking tool or sheet |

## 2. Gated or open (for things given away)

- **Gated**: the visitor gives an email (or more) and the success page delivers it. Use for things valuable enough to trade an email for, when building a list is the point.
- **Open**: the content is on the landing page, and the page's action becomes the natural next step (book, buy, join). Use for things meant to spread on social, rank in search or be quoted by AI, because search engines and assistants can't read anything behind a form.
- Either way the page has one goal, and it is built to convert it.

## 3. Choose the archives

An archive is worth creating when **all** of these are true:
- There are, or soon will be, at least two landing pages of that kind.
- Each page can have its own clear goal and real, specific content.
- Visitors will arrive at these pages from somewhere: searches, social posts, email, ads, or links from other pages and content.

Give each archive a **role**:
- **search**: built to rank and be quoted by AI. Pages must pass the keyword gate (`keyword-research.md`) and get full SEO/AEO/GEO.
- **resource**: reached from content, social posts, email and other pages. Pages focus on showing exactly what the visitor gets (a preview is required) and on converting. No keyword gate.
- **both**: a resource archive whose pages also target searches that passed the gate.

Start from the templates in `assets/contracts/archive-templates/` (`contracts.md` lists them) and name each archive in the business's own words.

Common starting points by business model. These are prompts for thinking, not defaults. Choose only what the inventory supports.

| Business model | Archives often worth considering |
|---|---|
| Serves customers in specific places | `place` (at the level demand supports), `offering`, `offering-in-place` only where the gate passes, a `lead-magnet` resource |
| Several branches or locations | `place` as one page per branch, tied to each map listing, plus `offering` |
| Professional service (legal, financial, medical, consulting) | `offering` (practice areas, treatments, services), `audience`, `lead-magnet`, sometimes `place` |
| Coach, consultant, agency | `audience` (industries, roles, situations), `lead-magnet` resources, `event`, case studies |
| Creator, educator, course business | `lead-magnet` resources (often split: prompts, templates, guides), `event`, offers |
| Software or app | `audience` (use cases, industries), `comparison`, templates or free tools as `lead-magnet` (often role `both`) |
| Shop or product brand | product collections (from `offering`), buying guides (`lead-magnet`, role `both`), comparisons |
| Venue, club, church, school, nonprofit | `event`, programs (`offering`), ways to get involved |

How search and social shape the archives:
- **Search-led** pages need real keyword demand. Keyword research decides which get built.
- **Every social post, email or piece of content that promises something needs a landing page that delivers it.** Short, memorable URLs work best. The post says "link in bio", uses an auto-DM, or links straight to it.
- A resource that only social or email traffic will see still gets a full landing page with metadata, so it can be shared, previewed and found later.

## 4. Write the archive registry and get approval

Create `contracts/archives/<id>.json` for each archive (`contracts.md`, setup), then show the owner a plain summary:

> "Your site will have 3 archives:
> - **[Archive label]** (6 pages to start), found through search. Each page asks visitors to [goal].
> - **[Archive label]** (4 pages), found through search. Goal: [goal].
> - **[Archive label]** (2 to start), linked from your posts and emails. Each one delivers [thing] and then offers [next step].
> Every page has one button, and the footer links to all three."

Get their okay before keyword research and building.

## 5. Revisit every quarter

New offers, campaigns or content series usually mean new landing pages in an existing archive. A new kind of offer that keeps recurring means a new archive (`contracts.md`, "Adding an archive"). Conversion data (`conversion.md`) shows which offers deserve more pages and which need a better offer.
