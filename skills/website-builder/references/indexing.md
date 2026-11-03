# Getting the site indexed (Google, Bing, and the AI assistants that use them)

A page that is not indexed does not exist to Google, Bing, ChatGPT search, Copilot or Perplexity. Do all of this right after the site is live on its real domain. Walk the person through each click, one step at a time. Verifying with Cloudflare DNS makes most of it one click.

Do it on the final domain, not the `.pages.dev` address. The `.pages.dev` copy should not compete with the real site: add a `_headers` rule (or a check in the layout) that sends `X-Robots-Tag: noindex` when the host ends in `.pages.dev`, or redirect it to the real domain.

## Before submitting anything (confirm all are true)

- The site loads on `https://` at the chosen host, and the other host (www or bare) redirects to it with a 301.
- `npm run check` passes with no FAIL lines.
- `https://DOMAIN/robots.txt` loads, allows crawling, and has the `Sitemap:` line.
- `https://DOMAIN/sitemap-index.xml` loads and lists only real, indexable pages on the final domain.
- No page that should rank has `noindex`. Thank-you and confirmation pages do have `noindex`.
- Every canonical tag points to the page's own URL on the final domain.
- Every landing page is linked from its archive, and every archive is linked from the footer. Google finds pages by links as well as by the sitemap.

## 1. Google Search Console

1. "Open search.google.com/search-console and sign in with the Google account you want to own this."
2. "Click **Add property**. Choose **Domain** (the left box), type your domain without https or www, and click Continue."
3. Google shows a TXT record.
   - If the domain is on Cloudflare: "Click **Start verification** / **Verify with Cloudflare** if Google offers it, then click Authorize." Otherwise: "Copy the TXT value. In Cloudflare, open your domain, then **DNS > Records > Add record**. Type: TXT. Name: @. Content: paste. Save." Back in Search Console, click **Verify**. It can take a few minutes.
4. "Click **Sitemaps** in the left menu. Type `sitemap-index.xml` and click **Submit**." The status should say Success.
5. Ask indexing for the most important pages: "Paste the home page address in the search bar at the top, press Enter, then click **Request indexing**." Repeat for each archive page and the top landing pages. (There is a daily limit of about 10. Do the rest over the next days, or let the sitemap handle them.)
6. Add the person's business partner or marketer as a user if needed (Settings > Users and permissions).

## 2. Bing Webmaster Tools (this also covers ChatGPT search, Copilot and DuckDuckGo)

1. "Open bing.com/webmasters and sign in (a Microsoft, Google or Facebook account works)."
2. "Choose **Import from Google Search Console** and click Continue, then Allow." This copies the verified site and sitemap in one step. If it is not offered, add the site and verify with the DNS TXT method as above.
3. Check that the sitemap shows under **Sitemaps**. If not, submit `https://DOMAIN/sitemap-index.xml`.
4. Run **URL Inspection** on the home page and request indexing.
5. **IndexNow**: tells Bing, Yandex, Naver and Seznam instantly whenever a page changes. Turn it on in Cloudflare (domain > **Caching > Configuration > Crawler Hints**: On). Or add a build step that pings `https://api.indexnow.org/indexnow` with the changed URLs, using a key file in `public/`.

## 3. Local listings that feed search and AI answers

- **Google Business Profile**: the website field points to the home page (or the matching location landing page for multi-location businesses). This is often the fastest way Google discovers a new local site.
- **Bing Places for Business**: bingplaces.com, import from Google Business Profile.
- **Apple Business Connect**: businessconnect.apple.com, for Apple Maps and Siri.

## 4. Check that it worked (days 1, 3, 7 and 14)

- Search `site:DOMAIN` on Google and on Bing. The pages that show are indexed.
- Search Console > **Pages**: lists indexed pages and the reason any page is not indexed.
- Search Console > **URL Inspection** on any page: shows whether it is on Google and how Google sees it ("View crawled page").
- Report progress to the person in plain words: "Google has 9 of your 14 pages so far. That's normal for week one."

Typical timing: the home page within a few days. Most pages within 1-4 weeks. Brand-new domains are slower than older ones.

## 5. If pages are not getting indexed

| Search Console says | What it means and what to do |
|---|---|
| Discovered, currently not indexed | Google knows the page but hasn't fetched it. Usually patience. Add internal links to it from stronger pages (its archive, related landing pages, the home page body). |
| Crawled, currently not indexed | Google fetched it and didn't think it was worth indexing. Usually thin or too similar to another page. Add real, specific detail, or merge it into a stronger page. |
| Duplicate, Google chose different canonical | Two pages are too alike. Make them clearly different or merge them, and check the canonicals. |
| Excluded by noindex | A noindex tag is on the page. Remove it if the page should rank. |
| Blocked by robots.txt | Fix robots.txt. |
| Page with redirect / Not found (404) | The sitemap or a link points to an old or wrong URL. Fix the link and regenerate the sitemap. |
| Alternate page with proper canonical tag | Fine. Google indexed the canonical version instead. |

## 6. Every time a page is added

1. `npm run check` passes, and the new page appears in its archive, the sitemap and llms.txt.
2. Publish.
3. Request indexing for the new page in Search Console, and in Bing if IndexNow is off.
4. If the new page's archive is new, check that the footer links to it on every page (the checker enforces this).

## 7. Monthly

- Search Console **Performance**: queries, clicks and positions. New query ideas go into `research/keywords.csv` (see `keyword-research.md`, Ongoing).
- Search Console **Pages**: any new "not indexed" reasons.
- Bing Webmaster Tools: the same two checks.
- The AI visibility prompt check in `geo-aeo.md`, section 7.
