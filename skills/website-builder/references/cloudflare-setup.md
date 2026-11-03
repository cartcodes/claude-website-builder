# Setup and Cloudflare connection, step by step

Give the person one step at a time and wait for "done". Check each step worked yourself before moving on.

## Part 1: Make sure the computer can build the site

1. Run `node -v`.
   - If it prints `v20` or higher, skip to Part 2.
   - If it is missing or older: tell the person, "Your computer needs a free tool called Node to build the site. I'll walk you through it."
     1. "Open nodejs.org in your browser."
     2. "Click the big green button that says LTS (Recommended)."
     3. "Open the file that downloads and click Continue / Next until it says it's finished. Use all the default options."
     4. "Tell me done." Then run `node -v` again to confirm. If the terminal still cannot find it, ask them to quit and reopen Claude Code once.
2. Create the project folder (for example `~/Websites/<business-name>`) and set up Astro + Tailwind inside it yourself. The person does not need to do anything here.
3. Install Cloudflare's publishing tool, Wrangler, into the site at a fixed version, so it never downloads anything new when it runs: `npm install --save-dev --save-exact wrangler`. Then add these scripts to `package.json`:
   ```json
   "cf:login": "wrangler login",
   "cf:whoami": "wrangler whoami",
   "cf:create": "wrangler pages project create",
   "deploy": "npm run check && wrangler pages deploy dist"
   ```

## Part 2: The Cloudflare account

Ask: **"Do you already have a Cloudflare account?"**

### If no
1. "Open dash.cloudflare.com/sign-up in your browser."
2. "Type your email and pick a password, then click Sign up." (They do not need a credit card. If a plan page appears, they choose **Free**.)
3. "Cloudflare just sent you an email. Open it and click the verify link."
4. "If Cloudflare asks you to add a domain or website, you can skip that for now. Click Skip or close it." (Domains come later, in Part 5.)
5. "Tell me done."

### If yes
Go straight to Part 3.

## Part 3: Connect Claude Code to Cloudflare

1. Say: "I'm going to connect to your Cloudflare account. A browser window will open. Make sure you are logged in to Cloudflare, then click the blue **Allow** button. Come back here and tell me done."
2. Run `npm run cf:login`.
3. When they say done, run `npm run cf:whoami` and tell them in one sentence which account you are connected to.
4. If the browser did not open, give them the link that wrangler printed and ask them to open it.
5. If it fails because they are logged in to the wrong account in the browser, ask them to log out of Cloudflare in the browser, log in to the right one, and repeat step 2.

Nothing secret was pasted anywhere. The login is saved on their computer by wrangler.

## Part 4: First publish (free web address)

1. Build and check: `npm run check`.
2. Create the project once: `npm run cf:create -- <business-name> --production-branch main`.
3. Publish: `npm run deploy -- --project-name <business-name>`.
4. Give them the live link (`https://<business-name>.pages.dev`) and open it for them.
5. Every later publish is just step 1 and step 3.

Optional, for later: connecting a GitHub repository so every saved change publishes automatically. Only offer this if they ask or plan to edit often. It needs a GitHub account and adds steps.

## Part 5: Connect their own domain (optional, ask first)

Ask: "Do you want the site on your own domain, like yourbusiness.com? It's free on Cloudflare's side. You keep paying for the domain wherever you bought it."

### If the domain is already on Cloudflare
1. "In Cloudflare, click **Workers & Pages** in the left menu."
2. "Click your site's name, then the **Custom domains** tab, then **Set up a custom domain**."
3. "Type your domain, for example yourbusiness.com, and click Continue, then **Activate domain**."
4. Repeat for `www.yourbusiness.com`. Then set up a redirect so only one version is used (pick the bare domain unless they already use www).
5. "It can take a few minutes, sometimes up to a day, to start working. I'll check it for you."

### If the domain was bought somewhere else (GoDaddy, Namecheap, Squarespace, Google/Squarespace Domains, etc.)
Moving the domain's "nameservers" to Cloudflare is the simplest long-term option, and it is free.
1. "In Cloudflare, click **Add a domain** (or **Add a site**), type your domain, and click Continue."
2. "Choose the **Free** plan and click Continue."
3. "Cloudflare will show two nameservers. They look like `anna.ns.cloudflare.com`. Keep this page open."
4. "In a new tab, log in to where you bought the domain. Find your domain and look for a setting called **Nameservers** or **DNS**. Choose **Custom nameservers**, paste the two Cloudflare ones, and save."
   - Look up the exact button names for their registrar yourself and give them those words.
   - **Warning to say out loud:** if their email runs on this domain (Google Workspace, Microsoft 365), first check that Cloudflare copied their existing MX records on the DNS page. If it did not, add them before switching, or their email will stop.
5. "Come back to Cloudflare and click **Check nameservers**. It can take a few hours. Cloudflare emails you when it's active."
6. Once active, follow the "already on Cloudflare" steps above.

## Part 6: Cloudflare settings that affect AI search (always check)

Cloudflare can block AI crawlers by default, which hides the site from ChatGPT, Claude, Perplexity and others.
1. Once a domain is on Cloudflare: "Click your domain, then look for **AI Crawl Control** (or **Security > Bots**). If **Block AI bots** or a **managed robots.txt** that blocks AI crawlers is turned on, turn it off." Explain that the site's own robots.txt already controls this.
2. Leave **Bot Fight Mode** off unless the person has a spam problem, because it can block good crawlers too.
3. Turn on **Web Analytics** (free, no cookie banner needed) under Analytics & Logs, and add the snippet it gives you to the site's layout.
4. Verify from the terminal that AI crawlers get the page:
   `curl -s -o /dev/null -w "%{http_code}" -A "GPTBot" https://<domain>/` should print 200. Repeat with `ClaudeBot`, `PerplexityBot` and `OAI-SearchBot`.
