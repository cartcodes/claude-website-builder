# AI Foundations Website Builder for Claude Code

Claude builds and grows a fast website whose pages are made to turn visitors into leads and customers. It works for any kind of business. You answer questions and click a few buttons. Claude does the rest:

- **Starts with what you give away.** Claude first lists everything you offer (services, free guides, templates, consultations, events, products), then plans a landing page for each one with a single clear action.
- **One page, one goal.** Everything important is on the first screen. There's no menu to distract people, and every page is built to get its one action taken.
- **Archives that fit your business.** Places you serve, services, the people you help, free resources, events: whatever fits you, linked from the footer so visitors, Google and AI assistants can find every page.
- **Success pages that deliver.** Booked calls, sent forms, downloads, copy-and-paste resources, registrations, purchases and quiz results each get a proper success page with one next step.
- **Keyword research with real data.** Every search page targets something people actually search for and that you can win. Places are found at the right level of detail, and only if places matter to you.
- **Plain, convincing copy** with no "AI voice".
- **Full SEO and AI search setup**, plus getting indexed in Google and Bing, so ChatGPT, Claude, Perplexity and Google's AI answers can find and recommend you.
- **Free hosting on Cloudflare**, set up step by step, even if you've never made an account.
- **Contracts and a checker.** Every new page must meet the same standard before it can go live, so adding pages later (by you or a scheduled Claude routine) is quick and safe.

## Install (2 minutes)

You need Claude Code. If you don't have it yet, install it from claude.com/claude-code first.

**Easiest way**
1. Download `website-builder.zip` and leave it in your Downloads folder. Don't unzip it.
2. Open Claude Code and type:
   > Install the website-builder skill from website-builder.zip in my Downloads folder into my Claude skills folder.
3. Quit Claude Code and open it again.

**If you're comfortable with a terminal**:
```
mkdir -p ~/.claude/skills && unzip ~/Downloads/website-builder.zip -d ~/.claude/skills/
```

**As a plugin** (one command, always the latest version):
```
/plugin marketplace add cartcodes/claude-website-builder
/plugin install aif-website-builder@ai-foundations
```

## Use it

Open Claude Code in an empty folder and type:

- `Build me a website` to start. Claude begins by asking what your pages will give away.
- `Add a landing page for [the thing]` to grow the site, for example a new free guide, a new service, a new event or a new area.
- `Find keywords for new pages` to get a page plan backed by real search data.
- `Check my site` to run the speed, SEO, AI search, conversion and copy checks.
- `Publish my site` to put changes live.
- `Set up a routine to add new [guides / events / pages] every week` to automate growth under the same rules.

You can also type `/website-builder` to start it directly.

## What this plugin runs, sends and fetches

The plugin is one skill (instructions plus three small, readable Node.js scripts). It has no hooks, no MCP servers, no background processes and no telemetry. Nothing is ever sent to AI Foundations.

When you use it, Claude may, with your approval at each step:
- **Run on your computer:** `node` (the three scripts in `scripts/`, which only read and write files in your website folder), `npm` to install Astro, Tailwind and Wrangler into your website folder, `astro build`, and `curl` to check your own live pages.
- **Connect to Cloudflare** with your own account via `npx wrangler login`, to publish your site to Cloudflare Pages.
- **Send keyword lists to DataForSEO** (optional, only if you create your own DataForSEO account). Your login lives in a local `.env` file, never in the chat.
- **Fetch public pages:** Google PageSpeed Insights for your site's URLs, search results and competitor pages for keyword research, and `api.indexnow.org` to tell Bing about new pages (optional).
- **Read files you choose to provide**, such as a customer export used to find where you really work. It stays on your computer and is never published.

You make the Google Search Console, Bing Webmaster Tools and map-listing changes yourself, following Claude's step-by-step instructions.

## What's inside

```
skills/website-builder/
  SKILL.md                         the process Claude follows
  references/
    offers-and-archives.md         what the pages give away, archive roles, choosing archives
    conversion.md                  what makes a page convert, and how to measure and improve it
    contracts.md                   page and success-page contracts, adding pages, routines
    site-structure.md              first-screen rule, archives, success pages, footer, build rules
    keyword-research.md            real demand, real competition, place discovery, the page gate
    copywriting.md                 copy that converts, and how to remove AI tells
    geo-aeo.md                     every AI search (GEO/AEO) step, on and off the site
    technical-seo.md               metadata, structured data, speed budgets, the checks
    indexing.md                    getting indexed in Google and Bing, step by step
    cloudflare-setup.md            account, connection, publishing, your own domain
  assets/contracts/
    archive-templates/             place, offering, offering-in-place, audience, comparison, lead-magnet, event
    success/                       booked-call, form-submitted, file-delivery, copy-paste, registration, quiz-result, purchase, signup
  scripts/
    contracts.mjs                  turns contracts into build rules, and checks content files
    new-page.mjs                   creates a new page (and its success page) from a contract
    check-site.mjs                 the checker that runs before every publish
```
