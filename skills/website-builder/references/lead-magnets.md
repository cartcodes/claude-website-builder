# Lead magnets: what to make, how to make it, how to promote it

A lead magnet is something useful a business gives away in exchange for an email (or a tap, or a comment) so it can start a relationship with the right buyer. This file covers choosing magnets that fit the business's paid offer, building the actual files, and the posts, ads, pages and emails that get them taken.

It is self-serve. The person orders, you make it. Don't ask "What are you giving away?" Ask **"What lead magnets do you want me to make for you?"** and show them a short menu of ideas you've already thought through for their business, so they only have to pick.

## 1. The ordering conversation

1. If you don't know it yet, ask one thing: **"What do you sell that you'd most like more customers for?"** (Read `about.md`, `content/offers.md` or the existing site first, and skip this if the answer is there.)
2. Think through the menu yourself (section 2), then ask with the AskUserQuestion tool (in plain words if that tool isn't available), multi-select:
   **"What lead magnets do you want me to make for you?"** Offer your 3-4 best ideas for *their* business. Each option gets a short name ("The 12-Point After-Storm Roof Check") and a one-line description of what it is and why it brings buyers ("A 1-page checklist. Homeowners find damage, then book your free inspection."). Put your top pick first with "(Recommended)". The person can always type their own idea.
3. For each one they pick, ask only what you can't work out yourself, one question at a time: facts only they know (prices, steps, their method, real results), their logo and brand colour, and where the leads should go (their email tool, CRM or a spreadsheet). Never invent the facts the magnet depends on.
4. Make it (section 4), show it to them (open the PDF and cover image), and fix what they want changed.
5. Then offer the rest in one line: "Want me to make the landing page, the social posts, the ads and the follow-up emails for it too?"

## 2. Choosing magnets that bring buyers

**Start from the paid offer, not from a topic.** Name the offer, the narrow problem the buyer has *right before* they need it, and the next problem the magnet will reveal. That next problem is the one the paid offer solves. A magnet unrelated to the offer collects people who never buy.

**Three kinds that work** (from Alex Hormozi's *$100M Leads*):

| Kind | What it does | Examples |
| --- | --- | --- |
| **Reveal a problem** | Helps them diagnose something that gets worse if ignored | Checklist, self-assessment quiz, calculator, scorecard, free audit or inspection |
| **Sample or trial** | Lets them try the real thing, limited by time or amount | Free class, tasting box, trial, first session, sample chapter |
| **One step of the process** | Gives away one step and sells the rest | Template, script, worksheet, module 1, a 30-day plan sold with done-for-you help |

**Match how aware the audience is** (Eugene Schwartz's awareness levels):
- **Cold ads and new followers** usually know the problem but not the solution. Give a diagnosis or a quick win: a checklist, a quiz, a "what it really costs" calculator.
- **Warm followers and search visitors** are comparing solutions. Give a buyer's guide, a "questions to ask before you hire" checklist, a case study, a template.
- **Ready buyers** want proof that you're the one. Give a free estimate, audit, consult, sample, trial or coupon.

**Starting points by business type.** These are ideas to think from, not defaults.
- **Local services** (dentist, contractor, salon, law firm, clinic): a free estimate, inspection or consult converts best. To catch people earlier, offer a cost guide or a "questions to ask before hiring a [trade]" checklist.
- **Products and shops** (bakery, ecommerce, brand): a sample, a first-order discount, a product-finder quiz, a buyer's guide.
- **Coaches, consultants, course creators:** one step of the method, a template or swipe file taken from the paid program, a quiz with a scored result.
- **Software:** a calculator or benchmark tool, a template that the product automates, a trial.
- **Agencies and B2B services:** a free audit or teardown, a benchmark report built from real data, a template pack.

**What makes the menu good:**
- One narrow problem, one kind of person, one promised result. If the title would suit any business, rewrite it.
- **The first win comes in about 10 minutes or less.** A checklist is 1-2 pages, a cheat sheet is 1 page, a guide is 5 pages at most. Short beats long, especially from social and ads. Skip ebooks and 7-day courses for cold traffic.
- Real value. Give away the method and sell the doing of it, the done-for-you version or the personal help. A thin magnet makes the business look thin.
- It looks like something they could have charged for, and it takes almost no effort to get and use.
- Offer variants: two or three versions of the same problem in different forms (checklist, calculator, quiz), so the business can rotate them and test.

## 3. Titles

The title is the biggest lever. Formula: **[number or format] + [specific, measurable result] + [for whom or how fast]**.
- "The 12-Point After-Storm Roof Check: spot the damage insurance pays for, in 15 minutes"
- "7 Questions to Ask Before You Hire a Divorce Lawyer in Ohio"
- "The 1-Page Weekly Meal Plan for Busy Parents (with the shopping list)"

Write 5-10 options, recommend the best one, and suggest testing the top two or three in posts or ads. Check: could two people read the title two different ways? If yes, make it sharper. Follow `copywriting.md`, including the AI-tells sweep.

## 4. Making the files

Everything for one magnet lives in `lead-magnets/<slug>/`:

```
lead-magnets/<slug>/
  magnet.md      the content, with front matter (below)
  promo.md       posts, DM flow, ads, emails (section 6)
  *.csv, *.ics   any extra files handed over as they are
  build/         made by the script: <slug>.pdf, <slug>.html, cover.png, square.png
```

Write `magnet.md`, then run:

```
node scripts/build-magnet.mjs lead-magnets/<slug> --site <public folder>
```

It makes:
- a branded **PDF** (cover, contents, last-page call to action),
- a **phone-friendly HTML** version that opens in any browser,
- a **1080x1350 cover image** and a **1080x1080 square** that show the title and what's inside, for the landing page preview, posts and ads,
- with `--site`, copies of the PDF, the HTML and the extras into the site's `downloads/` folder, and the covers into `images/lead-magnets/`.

It uses Chrome, Edge or Chromium if one is installed. If none is, it says so, and the HTML can be saved as a PDF from any browser's Print menu.

**Front matter:**

```yaml
---
title: The 12-Point After-Storm Roof Check
subtitle: Spot the damage insurance pays for, in 15 minutes, from the ground
format: checklist            # checklist, cheat sheet, guide, worksheet, template, swipe file, prompt pack, plan, scorecard
kicker: Free checklist       # small label above the title
business: Example Roofing Co.
website: example.com
color: "#b4361f"             # brand colour (quote it)
logo: https://example.com/logo.png   # optional
inside: Shingle check; Gutter dents; Photo log; What to tell your insurer   # optional, otherwise taken from the content
cta: Book a free roof inspection     # the last page's one next step, tied to the paid offer
ctaLink: https://example.com/inspection/
ctaHeading: Found something on the list?
ctaText: One or two sentences on why to take the next step now.
updated: November 2026
---
```

**Body syntax** (Markdown plus a few extras):
- `## Heading`, paragraphs, `**bold**`, lists and links.
- `- [ ] item` makes a printable tick box.
- `____` (four or more underscores) makes a fill-in line. A table with empty cells becomes a fill-in table.
- A fenced code block holds text to copy (scripts, prompts, email templates), with the line breaks kept.
- `:::tip Label` … `:::`, and the same with `warning` or `example`, makes a callout box.
- `<!-- page -->` starts a new page.

**Build standards:**
- Phone first: short sections, one column, big tick boxes, nothing that only works on a desktop.
- Start with the quick win. Put the most useful part on the first content page and say "start here".
- Every page earns its place. Checklists 1-2 pages, cheat sheets 1, guides 5 at most.
- Only the business's real facts, numbers and results. Never invent statistics, testimonials or outcomes. Ask for what's missing, or leave the claim out.
- Build in a way to see it was used: a score to reply with, a result to bring to the call, a "step 2" link.
- End with exactly one next step that leads to the paid offer, with an honest reason to act now.

**Other formats:**
- **Spreadsheet, tracker or calculator:** write a `.csv` into the folder (it's handed over as is). For a working calculator, build it as a page on the site, with the result shown on the page and an optional email of the result. An interactive page works best on phones. Optionally, the person can make a Google Sheets copy and share a "make a copy" link. That needs their own Google account, and you walk them through it.
- **Prompts, scripts and swipe text:** deliver on a copy-and-paste success page (`copy-paste` contract) so it copies easily on a phone, plus the PDF as a keepsake.
- **Quiz or assessment:** build it as a page with a `quiz-result` success page that shows the score and what it means. The questions and scoring come from the business's real criteria.
- **Free estimate, audit, inspection or consult:** no file. A short request form and a `booked-call` or `form-submitted` success page.
- **Webinar, class or challenge:** an `event` page, a `registration` success page and an `.ics` calendar file. Expect 40-60% of registrants not to attend, so send reminders and offer a replay.
- **Template for Notion, Canva or Google Docs:** the person makes it in their own account and shares a duplicate link. Always also give a PDF or HTML version for people who don't use that tool.
- Never make a zip file or a desktop-only file the only option.

## 5. Delivery and the success page

- **Deliver instantly and by email.** The success page (or the DM) gives it right away. The email gives a lasting copy and starts the relationship. Email-only delivery loses people to spam and the Promotions tab.
- Single opt-in by default. Use double opt-in only where the law or the email tool requires it (for example parts of the EU).
- The success page follows `file-delivery` or `copy-paste` in `contracts.md`: the download button, the phone-friendly version, "start with page 2", and **one** next step (book the call, claim the offer, a small paid product). It's the moment of highest intent, so never leave it as a dead end.
- The form asks for the fewest fields that serve the follow-up: usually name and email. Add a phone number only if someone will call. Add one qualifying question (timeline, budget, ZIP code) only if a person follows up.
- The landing page is a `resource` page in the lead-magnet archive (`site-structure.md`). Its headline repeats the promise made in the post or ad word for word, the cover image is the preview, and the opt-in section stays under about 200 words.

## 6. The promotion kit (`promo.md`)

Write these for each magnet, in the business's voice, following `copywriting.md`:

**Organic social**
- **Hooks:** 5 opening lines that name the result and the format ("I made a 1-page checklist that shows whether your roof needs a claim, in 15 minutes").
- **Posts:** each gives one complete, usable piece in the post itself (one checklist item, one script line, a before and after), then offers the full version. Write versions for the person's platforms:
  - **Instagram and Facebook:** a carousel previewing 2-3 items, ending "Comment ROOF and I'll send you all 12".
  - **TikTok and Reels:** a 30-45 second script with the hook in the first 2 seconds.
  - **LinkedIn:** a text post or document post, with the link in the first comment or "comment and I'll send it", not in the post itself.
  - **YouTube:** a pinned comment and a description line.
- **Comment-to-DM flow** (ManyChat or a similar tool on Instagram and Facebook): the platform allows one automatic private reply per comment, within 7 days. So the first DM thanks them and asks for a tap ("Want it? Tap Send it to me"). After the tap, send the link to the landing page, or collect the email in the DM. Always also give a link-in-bio fallback. A lead who only exists in someone's DMs isn't a lead the business owns. Get the email.
- The landing page URL is short and easy to say out loud (`/roof-check/`).

**Paid ads**
- 3 ad versions, each a different angle (the pain, the quick win, the proof), each showing the real cover image or a page of the magnet.
- Headline and landing page match word for word. One call to action, and nothing else to click on the page.
- **Native lead forms** (Meta Instant Forms, LinkedIn Lead Gen Forms, Google and TikTok lead forms) bring more leads, often with lower intent. Landing pages bring fewer leads with higher intent. If a person will call the lead, use Meta's "Higher intent" or Google's "More qualified" setting. Judge either option on cost per qualified lead or per sale, never on cost per lead alone.
- Ask before spending any money, and never set up or change ad spend without the person's okay.

**Follow-up emails** (3-5, for the person's email tool)
1. Delivers the magnet right away and says where to start.
2. Builds on the quick win: what to do with what they found.
3. Names the next problem honestly and presents the paid offer as the fix, with one call to action.
4-5. Proof from real customers, and a clear, honest reason to act now.

## 7. Measure and improve

- For each magnet, track: landing page conversion rate (by traffic source), cost per lead and per qualified lead for ads, how many leads use it (replies, scores, step 2 clicks), and how many become customers.
- Test the title first, then the cover image, then the hook.
- A magnet that gets lots of leads but no customers is the wrong magnet. Go back to section 2 and tie it more closely to the paid offer.

## Evidence notes

Hard numbers in this field are mostly vendor-published, so treat them as rough guides:
- Unbounce's 2024 benchmark: about 41,000 landing pages, median conversion 6.6%. Simpler, shorter pages convert better.
- Interact: quizzes convert about 40% of the people who start them, as reported by a quiz vendor.
- ON24: about 57-60% of webinar registrants attend, from enterprise B2B data.
- GetResponse's 2020 survey: short formats beat long ones.
- Meta's Private Replies documentation sets the one-reply, 7-day rule.

No controlled study ranks formats against each other. The rules above follow practitioner agreement (Hormozi, Porterfield, Brunson, Unbounce, CXL) and the business's own results. Never quote a statistic in a magnet or its promotion unless it comes from a real, named source.
