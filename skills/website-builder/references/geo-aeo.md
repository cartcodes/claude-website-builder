# GEO and AEO: getting found and quoted by AI assistants and answer engines

GEO (generative engine optimisation) and AEO (answer engine optimisation) mean making the site easy for ChatGPT, Claude, Perplexity, Gemini, Copilot, Siri and Google's AI Overviews to find, understand, trust and quote. Good SEO is the foundation. These are the extra layers. Apply every item. Each one is small, and together they decide whether the business gets named in an AI answer.

## 1. Let the AI crawlers in

- `robots.txt` allows every major crawler and lists the sitemap. Default to allowing all of them:
  - OpenAI: `GPTBot` (training), `OAI-SearchBot` (ChatGPT search results), `ChatGPT-User` (when a user asks ChatGPT to open a page)
  - Anthropic: `ClaudeBot`, `Claude-SearchBot`, `Claude-User`
  - Perplexity: `PerplexityBot`, `Perplexity-User`
  - Google: `Googlebot` (search and AI Overviews), `Google-Extended` (Gemini training control)
  - Microsoft: `Bingbot` (Bing, Copilot, and much of ChatGPT search)
  - Apple: `Applebot`, `Applebot-Extended`
  - Others: `CCBot` (Common Crawl, used by many models), `meta-externalagent`
  If the owner does not want their content used for **training**, they can block `GPTBot`, `Google-Extended`, `Applebot-Extended` and `CCBot` while still allowing the search and user bots. Explain the trade-off and let them choose. The default is allow all.
- Check the Cloudflare AI-bot setting (see `cloudflare-setup.md`, Part 6). Confirm with `node scripts/fetch-site.mjs <site address> --bots` that each bot gets the page.
- Everything is static HTML. AI crawlers mostly do not run JavaScript, so any text that needs JavaScript to appear is invisible to them.

## 2. llms.txt and llms-full.txt

- `/llms.txt` follows the llmstxt.org format:
  ```
  # Business Name
  > One sentence: what the business does, for whom, where. Include the phone number.

  Key facts in a few short lines: years in business, licence number, service area, price ranges, warranty, hours.

  ## [Archive label, e.g. Services]
  - [Page headline](https://site.com/<archive>/<slug>/): one-line summary with the main fact.

  ## [Next archive label, e.g. Areas we serve]
  - [Page headline](https://site.com/<archive>/<slug>/): one-line summary.
  - [Nested page headline](https://site.com/<archive>/<parent>/<slug>/): one-line summary.

  ## [Resource archive label, e.g. Free guides]
  - [Resource name](https://site.com/<archive>/<slug>/): what it gives and who it is for.

  ## Optional
  - [About](https://site.com/about/), [Reviews](...), [Contact](...)
  ```
- `/llms-full.txt`: the same structure with each page's full text in plain Markdown, so an assistant can read the whole site in one request.
- Both files are generated at build time from the content files, so they never go stale.

## 3. Write content that answers can be lifted from

AI answers quote short, self-contained passages. Write so that any paragraph still makes sense when it is cut out on its own.

- **Answer first.** Under every question heading, the first paragraph is a direct 15-90 word answer that repeats the key words of the question and names the business or place where natural. Details come after. ("How much does [offering] cost in [place]? Most [customers] pay $X to $Y in 2026, depending on [the two factors that matter most]...")
- **Question headings that match real searches.** Use the exact questions from "People also ask", autocomplete, and what customers ask on calls.
- **Facts in plain sentences**: prices or ranges, timelines, warranty length, licence numbers, service area, hours, response time, materials and brands, number of jobs done. Specific numbers get quoted. Vague claims get ignored.
- **One topic per page, and the page says clearly what it is about** in the title, H1, first sentence and description.
- **Tables** for comparisons (options side by side: cost, time, lifespan, who each one suits). Assistants lift tables well.
- **Short lists** for steps ("What happens after you call: 1. ... 2. ...").
- **Original information**: numbers only this business knows ("We have completed 214 [jobs] in [place] since 2019, and the average one took 3 days", "Our 1,200 clients cut [metric] by 31% in their first quarter"). Original data is the strongest reason for an assistant to cite you over a directory.
- **Cite outside sources** for any outside fact (permit rules, building codes, rebates), with a link to the official page.
- **Show when it was updated**: a visible "Updated November 2026" on each page, matching `dateModified` in structured data. Update pages when prices or details change.
- **Consistent names**: the business name, offerings and places are spelled the same way everywhere on the site and off it.

## 4. Structured data (JSON-LD) on every page

- Home: `Organization`, or the most specific `LocalBusiness` subtype (`Dentist`, `LegalService`, `Plumber`, `AccountingService`, `HomeAndConstructionBusiness`, `ProfessionalService`, ...), with `name`, `url`, `logo`, `telephone`, `address`, `geo`, `openingHoursSpecification`, `areaServed`, `priceRange`, and `sameAs` linking every official profile (Google Business Profile, Yelp, Facebook, LinkedIn, BBB, YouTube). Also `WebSite`.
- Service pages: `Service` with `serviceType`, `provider` (the business, by `@id`), `areaServed`, and `offers`/price range if published.
- Place pages and offering-in-place pages (if the business has them): `Service` with `areaServed` set to that place (`City`, `AdministrativeArea`, `PostalCodeSpecification` or `Place`, matching the page's level), and the business as `provider`.
- Audience pages: `Service` with `audience` (`Audience` / `BusinessAudience`). Comparison pages: `WebPage` with clear `about` entities. Event pages: `Event` with `startDate`, `eventAttendanceMode`, `location` and `offers`.
- Resource pages: describe the resource (`DigitalDocument`, `CreativeWork`, `HowTo`-style content without relying on rich results).
- Every page except home: `BreadcrumbList`.
- Pages with FAQs: `FAQPage`. Google shows FAQ rich results only for a few kinds of sites now, but assistants and other engines still read it. The questions and answers must also be visible on the page, word for word.
- About page: `Person` for the owner, with credentials and `sameAs` (LinkedIn), linked to the business as `founder`.
- Reviews: only real reviews shown on the page. Never mark up reviews copied from elsewhere, and never invent ratings.
- Use one `@id` per entity (`https://site.com/#business`) and reference it everywhere, so every page points to the same business.
- Validate with the Schema.org validator (validator.schema.org) and Google's Rich Results Test.

## 5. Trust signals (E-E-A-T) that both Google and assistants weigh

- A real About page: the owner's name, photo, story, years of experience, licences and certifications.
- Real photos of real jobs and the real team, with descriptive alt text and file names.
- Testimonials with full name, town and a specific result. Link to the review source when possible.
- Clear contact details on every page: phone, address (or service area) and hours, exactly matching the Google Business Profile.
- Privacy and terms pages.
- Licence and insurance numbers where the trade has them, with a link to the official lookup.

## 6. Off-site work (often more important than the site itself)

Assistants recommend businesses that many trusted places mention consistently. Help the person do these. They are where most local AI recommendations come from.

- **Google Business Profile**: complete every field, the right primary category, every service, the service area, hours, photos, and the website link pointing to the matching location page. Post updates monthly. Answer every review.
- **Reviews**: a simple routine for asking every happy customer for a Google review. Reviews that mention the offering and the place or situation help most.
- **Bing Places for Business** (import from Google, takes minutes) and **Apple Business Connect** (Apple Maps and Siri).
- **Consistent listings** on Yelp, BBB, Facebook, Nextdoor, trade directories and the local chamber of commerce. The name, address and phone are identical everywhere.
- **Mentions where people discuss**: local Reddit threads, Nextdoor, local news, trade forums, partner sites. Honest participation only, never fake posts.
- **YouTube**: short videos answering top customer questions. They are cited often, and they can be embedded on the matching page.

## 7. Measurement

- **Google Search Console**: verify the site (Cloudflare DNS makes this one click), submit `sitemap-index.xml`. Check queries monthly.
- **Bing Webmaster Tools**: import from Search Console in one click, submit the sitemap. Turn on **IndexNow** (Cloudflare has a Crawler Hints setting that sends these notifications automatically), so Bing and Copilot learn about new pages quickly.
- **Cloudflare Web Analytics**: traffic without cookies. Watch referrals from `chatgpt.com`, `perplexity.ai`, `claude.ai`, `gemini.google.com` and `copilot.microsoft.com`. ChatGPT links often carry `utm_source=chatgpt.com`.
- **Cloudflare AI Crawl Control**: shows which AI crawlers visit and how often.
- **Monthly prompt check**: keep a list of 10 questions a customer would ask an assistant ("Who is the best [offering] provider in [place]?", "How much does [offering] cost?", "What is the best [tool] for [audience]?"). Ask ChatGPT, Perplexity, Claude, Gemini and Copilot once a month and log in `research/ai-visibility.md` whether the business is named or linked, and who is named instead. The pages and listings of whoever gets named show what to improve.
