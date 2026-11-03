# Lead Desk: the business's own lead inbox (CRM)

The Lead Desk is a small, private website that collects every lead from every form, shows where each one came from, tracks it until it becomes a customer, and sends alerts. It runs in the business's own Cloudflare account, on the free plan. The leads belong to the business, not to a software company.

It works with **any** website: the one this skill builds, WordPress, Webflow, Squarespace, Wix, Shopify, or a hand-made page. Forms send to it, and the owner signs in at `<lead desk address>/admin/`.

**What the owner gets:**
- **Leads:** every lead, newest first, with search and a status (New, Contacted, Qualified, Customer, Lost), notes, and the money each customer brought in.
- **Where they came from**, on every lead: the page, the lead magnet, the goal, and the source (Instagram, Google, an ad campaign, a referring site).
- **Results:** leads by source, page and lead magnet, how many became customers, revenue, and each page's conversion rate (visits to leads).
- **Team:** invite other people by email. Each one sets their own password. Owners can change settings and remove people. Admins can see and work leads.
- **Alerts** (any mix): email, Slack/Discord/Google Chat/Teams, Zapier or Make (which can pass each lead to any other tool), and free phone push notifications. Plus a daily or weekly summary.
- **Download all leads as a spreadsheet** at any time, and a full database backup with one command.

Offer it whenever leads need a home ("Where should your leads go?"). Recommend it when the person has no CRM, or wants to see which pages and lead magnets bring customers. If they already use a CRM they like, the Lead Desk can still sit in front of it and pass each lead along through a webhook. Or skip it.

## Setup (Claude does the typing, the person clicks)

Give one step at a time and wait for "done". Everything below runs in a folder next to the website, for example `~/Websites/<business-name>-lead-desk`.

1. **Copy the files.** Copy `assets/lead-desk/` from this skill into that folder. Then add Cloudflare's tool to it at a fixed version: `npm install --save-dev --save-exact wrangler`.
2. **Connect to Cloudflare.** If the website is already on Cloudflare, this is already done. Otherwise follow `cloudflare-setup.md`, Parts 2 and 3, using `npm run desk:login` and `npm run desk:whoami`.
3. **Create the database.** Run `npm run desk:db`. It prints a `database_id`. Put that value into `wrangler.jsonc` where it says `FILL-IN-FROM-desk:db`. The id is not secret. Then run `npm run desk:schema`.
4. **Say which websites may send leads.** In `wrangler.jsonc`, set `site_origins` to the site's addresses separated by spaces, for example `"https://yourbusiness.com https://www.yourbusiness.com https://yourbusiness.pages.dev"`. The owner can change this later on the Settings page.
5. **Choose the address** (ask the person):
   - **Free address, nothing to set up:** the Lead Desk gets `https://lead-desk.<their-account>.workers.dev`. Fine to start with.
   - **Their own domain, if it's on Cloudflare (recommended):** something like `leads.yourbusiness.com`. Uncomment the `routes` line in `wrangler.jsonc` and put in their real subdomain. Cloudflare creates the address and its security certificate on deploy. If the domain isn't on Cloudflare yet, `cloudflare-setup.md`, Part 5, moves it there for free.
6. **Publish.** Run `npm run desk:deploy`. It prints the address. Save it in `desk.json` as `{"address": "https://..."}`, so invite links come out complete.
7. **Create the owner's account.** Run `npm run desk:invite -- <their email> --owner`. It prints a one-time link. Say: "Open this link, choose a password of at least 10 characters, and you're in. Then bookmark the page." You never see or type their password. The link works once, for 7 days.
8. **Connect the forms** (next section), then send one test lead and show them it arriving.
9. **Turn on alerts** (section after next). Say: "Open Settings in your Lead Desk, then send a test alert."

If someone forgets their password, an owner creates a new invite on the Team page. If no owner can sign in, run `npm run desk:invite -- <email> --owner` again.

## Connecting forms

**On the site this skill builds:** every form posts straight to the Lead Desk, and the helper script goes on every page.

```html
<form action="https://<lead desk address>/api/lead" method="post"
      data-cta="free-quote" data-success="/thanks/free-quote/" data-magnet="">
  <label>Name <input name="name" autocomplete="name"></label>
  <label>Email <input name="email" type="email" autocomplete="email" required></label>
  <label>Phone <input name="phone" type="tel" autocomplete="tel"></label>
  <input type="hidden" name="_success" value="https://<site>/thanks/free-quote/">
  <input type="hidden" name="_page" value="https://<site>/<this page>/">
  <button data-cta="free-quote">Get my free quote</button>
</form>
<script src="https://<lead desk address>/t.js" defer></script>
```

- Field names: `name` (or `first_name` and `last_name`), `email`, `phone` and `message`. Any other field (ZIP code, budget, service) is saved too and shown on the lead.
- `_success` is where the visitor goes after sending. It has to be the page's success page, so the success page view still counts as the conversion. `data-magnet` names the lead magnet on lead magnet pages.
- The helper script (`t.js`) adds the source details (`utm_` tags, the referring site, the page, the goal), a hidden spam trap and a timer to each form. It also counts visits so the Lead Desk can show conversion rates. It uses no cookies and stores nothing that identifies a visitor. Forms still work if the script fails to load: the lead just arrives with less detail.
- In Astro, put the form in a component that reads the goal, success page and lead magnet from the page's contract fields, so every page gets them right automatically.

**On other platforms (Freeform):**
- **Any site where you can edit HTML** (WordPress custom HTML block, Webflow embed, Squarespace code block, Wix embed, Shopify section, plain HTML): use the form above, and add the helper script to the site-wide footer code.
- **A platform's own form builder** (Webflow forms, WordPress form plugins, Typeform, Tally, Jotform, Google Forms): point the form's webhook or "send to URL" setting at `https://<lead desk address>/api/lead`, if it has one, and send the fields as JSON or form data. Without the helper script those leads arrive without source details, so prefer the HTML form where possible.
- **Native ad lead forms** (Meta, LinkedIn, Google, TikTok): connect them through Zapier or Make to POST each lead to `/api/lead` with `utm_source` set (for example `facebook-ads`). Allow-listing only applies to browsers, so server-to-server posts from these tools are accepted.

## Alerts

The owner sets these on the Settings page. Nothing to type in a terminal.

| Alert | What it needs | Setup |
| --- | --- | --- |
| **Phone push** (free) | The ntfy app (iPhone or Android) | Install ntfy, tap +, and subscribe to a long, hard-to-guess topic name like `yourbusiness-leads-7f3k9q2`. Type the same name in Settings. |
| **Slack, Discord, Google Chat, Teams** | A webhook link from that app | In the app, create an "incoming webhook" for a channel and copy its link. Paste it in Settings. Look up the app's current steps and give them the exact button names. |
| **Zapier or Make** (to pass leads to any CRM, email list or spreadsheet) | A free Zapier or Make account | Create a Zap or scenario that starts with "Webhook: catch hook", paste its link in Settings, then add the step that sends the lead where they want it. |
| **Email** | Their domain on Cloudflare, with Email Routing turned on | See below. |
| **Daily or weekly summary** | Email or a webhook set up | Choose "Every day" or "Every Monday" in Settings. |

The person pastes webhook links straight into their own Settings page. You never need to see them. Treat them like passwords: anyone who has the link can post to that channel.

**Email alerts** (only with the domain on Cloudflare):
1. "In Cloudflare, click your domain, then **Email**, then **Email Routing**, then **Get started** or **Enable**." Cloudflare adds the DNS records it needs. If the domain already receives email elsewhere (Google Workspace, Microsoft 365), stop and check with the person first: Email Routing changes where mail for the domain goes. In that case, use phone push or a webhook instead.
2. "Under **Destination addresses**, add the email of each person who should get alerts. Cloudflare emails each of them a verify link. Click it." Cloudflare only delivers to verified addresses.
3. In `wrangler.jsonc`, uncomment `"send_email": [{ "name": "MAILER" }]` and run `npm run desk:deploy`.
4. "In your Lead Desk Settings, type a sending address on your domain, like `leads@yourbusiness.com`, turn email alerts on, save, and send a test alert."

## Looking after it

- **Backups:** `npm run desk:backup` saves the whole database to `backups/`. Suggest doing it monthly, and keep backups somewhere private, never in a public folder or a public repository.
- **Problems:** `npm run desk:logs` shows live errors while you test.
- **Updates:** copy newer files from this skill over `src/` and `public/`, then run `npm run desk:schema` (safe to run again) and `npm run desk:deploy`.
- **Free plan limits:** about 100,000 form posts and visits a day and 5 GB of data, far more than a small business uses.
- **Privacy:** leads are personal data. Add a short section to the site's Privacy page covering what the forms collect, why, that it's stored in the business's own Cloudflare account, and how to ask for deletion (an owner deletes the lead on its page). The visit counter uses no cookies and keeps no IP addresses, so it doesn't need a cookie banner.
- **Security:** passwords are stored only as salted hashes. Sign-in sessions use secure cookies. Wrong passwords lock the account for 15 minutes after 8 tries. Changes are only accepted from the Lead Desk's own pages. Forms are only accepted from the listed websites. For an extra lock on top of the password, an owner can put `/admin/*` behind Cloudflare Access (Zero Trust, free for up to 50 people), which asks for a one-time code by email before the sign-in page even appears.
