# Keyword research, place discovery and the page plan

The goal is a short list of pages that real people search for, that this business can realistically win, and that convert. Fifteen pages that pass the gate beat three hundred guesses.

This applies to **search** and **both** archives. **Resource** archives (lead magnets and events reached from content, social posts and email) skip the gate. Their pages are planned from the offer inventory and judged on conversion. A resource can still be checked here, and if it passes, its archive role for that page becomes `both`.

**The one rule: never invent or estimate a number.** Every volume, cost-per-click and difficulty figure comes from a named source and is saved with that source. If there is no data, write "no data" and use the evidence steps instead.

## Step 1: Understand how this business gets searched

From the offer inventory (`offers-and-archives.md`), work out which of these patterns real customers use. Most businesses use only some of them.

| Pattern | Example shape | Usually becomes |
|---|---|---|
| The offering | `[offering]`, `[offering] cost`, `best [offering]` | Offering page |
| The offering + a place | `[offering] [place]`, `[offering] near [place]` | Place page, or offering-in-place page |
| The problem | `how to fix [problem]`, `why does [problem] happen` | FAQ answers on offering pages, or a lead magnet |
| The audience | `[offering] for [audience]` | Audience page |
| The comparison | `[brand] vs [brand]`, `[brand] alternatives` | Comparison page |
| The resource | `[thing] template`, `[thing] checklist`, `free [thing]` | Lead magnet page (role `both`) |
| The brand | `[business name]`, `[business name] reviews` | Home page and the review profiles |

Get the customers' own words. Ask the owner what people say on the phone and in emails, and collect real phrasing from:
- Google autocomplete, "People also ask" and "Related searches" for the top seeds (use the web search tool, or ask the owner to look and tell you).
- Competitors' landing pages: which pages do the strongest 3-5 competitors have?
- Reviews of this business and its competitors: the words customers use for the problem and the result.
- Social comments and DMs, for questions people actually ask.

## Step 2: Place discovery (only if places matter)

Skip this whole step for businesses that do not serve specific places (most online businesses, software, national products, coaches who work remotely). They have no place pages, and that is normal.

For businesses that do serve places, find the real service area first, then find the right level of detail. Never start from a hard-coded list of cities.

**2a. Find where the business really works**
- Ask the owner where they serve, where they will travel, and where they don't want work.
- Read the service area on their Google Business Profile.
- If they can export past customers or jobs (CRM, invoicing, booking tool), group them by postal code and town. Real customer locations are the best signal of where demand and fit already exist. Keep this data private: never publish addresses.
- Note travel limits (for example, "45 minutes from the office") and any places they serve only for some offerings.

**2b. List every place inside that area, at every level**
Region or metro area, counties, cities and towns, neighbourhoods and districts that people actually name, postal codes, and well-known areas or venues (a shopping district, a hospital campus, a business park) if people search them. Save the list to `research/places.csv` with columns:
`place, place_type, parent_place, in_service_area, offerings_served, past_customers, notes`

**2c. Check demand at each level**
For each place, check demand for the main offerings at that place (`[offering] [place]` and the variants customers use), with the data sources in Step 3. Set the data source's location to the place where it allows, and record the level the data is reported at.

**2d. Choose the level of detail for pages**
- Build pages at the **most specific level that has real, separate demand and real, specific content**. In a big city that may be neighbourhoods. In a rural area it may be the county or a group of towns.
- Places too small for their own page are covered by the nearest larger page (in the place contract's `coveredPlaces`), named naturally in its copy, and listed in its service area.
- A place gets its own page only if you can write genuinely local content for it: work done there, local rules or conditions, what customers there ask, a testimonial from there. Otherwise it stays covered by a larger page.
- Offering-in-place pages (`[offering] [place]`) exist only where that exact pair passes the gate in Step 6. Most places will not need one for every offering.

Save the decision per place in `research/places.csv` (`page_level`: own page / covered by [page] / not now, plus the reason).

## Step 3: Get real demand numbers

Use the best source the person already has, free ones first. This skill never handles passwords, API keys or tokens itself.

1. **Google Keyword Planner** (free with a Google Ads account; no ads need to run). Walk them through it: ads.google.com, Tools, Keyword Planner, "Get search volume and forecasts", paste the list you give them, set the location, download the CSV, and drop it into the project folder. Volumes appear as ranges unless they spend on ads. Ranges are still real data.
2. **Google Search Console** (free, after launch). The queries the site already appears for. This is the best source for choosing the next pages. They export the Performance report (Export, CSV) into the project folder, or connect Search Console to Claude themselves. Check it monthly.
3. **Bing Webmaster Tools, Keyword Research** (free once the site is verified). Real Bing numbers, exported as CSV. Bing also feeds ChatGPT search and Copilot.
4. **Optional: a paid keyword tool the person already uses or chooses to add.** DataForSEO (pay as you go, usually a few dollars for a small business's whole list), Semrush or Ahrefs. Either the person connects that tool to Claude through its own connector (they sign in to it themselves; you never see their login), or they export the tool's keyword report as CSV into the project folder. With DataForSEO, the useful reports are Google Ads search volume, keyword suggestions, keyword difficulty, and live search results for a location. Show the cost before running a large batch through a paid connector. None of this is required.
5. **No data source yet.** Do not guess. Use only the evidence in Step 4, mark demand "unverified", build only the core pages, and hold narrower pages (offering-in-place, small places) until there is data.

Small numbers are normal for specific searches. Tools often report 0-10 for a narrow `[offering] [place]` even when people search it. Treat those as long-tail members of a bigger cluster. A narrow page can still be worth building if Step 4 shows clear buying signals and the parent search has real volume. Write the reasoning down.

## Step 4: Check the competition by looking at who ranks

For each keyword cluster, look at the actual results, in the right location if it is local:

| What you see | What it means |
|---|---|
| Ads at the top | Businesses pay for this click, so the search makes money. Strong buying signal. |
| A map with local businesses | Local intent. The Google Business Profile matters as much as the page. |
| Directories and marketplaces in the top 10 (review sites, lead-gen marketplaces, listing sites) | **Winnable.** No business owns the result with a strong page yet. |
| Competitors with thin or generic pages (no specifics, no prices, few words) | **Winnable** with a better, specific page. |
| Big brands, major publishers, Wikipedia or government sites filling the top 10 | Hard. Skip it, or target a more specific version. |
| Mostly articles and guides, not businesses | Informational intent. Answer it as an FAQ, or make it a lead magnet, not a sales page. |
| AI Overview or answer box at the top | Write answer-first content so the page can be the source quoted (see `geo-aeo.md`). |

Write one line of notes per cluster: who ranks, how strong they look, and your verdict.

## Step 5: Group keywords into pages (the overlap test)

Two keywords belong on the **same page** if their top 10 results share 4 or more of the same URLs. Different phrasings of the same need usually share results and make one page. Different needs usually don't, and get separate pages.

Each page gets one **main keyword** (the cluster member with the most demand, phrased naturally) and its **secondary keywords** (the rest of the cluster). Never create two pages for the same cluster. They compete with each other and both do worse.

## Step 6: The gate (a search page is built only if all five are true)

1. **Demand**: real numbers from Step 3, or strong buying signals from Step 4 (ads plus map listings) plus real volume for the parent search.
2. **Winnable**: Step 4 shows directories, thin pages or weak competitors in the top 10.
3. **Real**: the business offers this, to these people or in this place, and wants that work.
4. **Specific**: there are enough real facts to make the page clearly different from every other page. If not, ask the owner for them or hold the page.
5. **Converts**: there is a clear, valuable action for this visitor, matched to what they searched (see `conversion.md`).

Pages that fail go under "Later" in `research/page-plan.md`, with the reason, to revisit when Search Console shows demand.

## Step 7: Save and present

`research/keywords.csv`:
`keyword, cluster, page_url, archive, monthly_volume, volume_source, location, cpc, competition, difficulty, serp_notes, decision, reason`

`research/page-plan.md`: the pages to build, in priority order, each with archive, main keyword, secondary keywords, goal, demand evidence in one line, competition verdict in one line, and (for resource pages) where traffic will come from. Priority: the pages closest to money first (usually the main offerings, then the places or audiences with the most demand, then narrower pages), with resource pages added as the owner's content and social plans need them.

Present it in plain words: "I found 14 pages worth building. Here are the top five and why." Get the owner's okay before writing.

## Ongoing (offer this at hand-off)

Monthly, pull Search Console queries:
- Queries with impressions but no page of their own become candidates. Run them through the gate.
- A page sitting in positions 8-20 needs better content, proof or internal links, not a new page.
- New places showing up in queries can mean the service area is wider than assumed. Ask the owner before adding them.
