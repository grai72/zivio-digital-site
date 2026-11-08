# Zivio Digital website

The Zivio Digital agency site: complete branding, custom websites, digital marketing, managed IT and cloud services for Calgary businesses.

- Live: https://ziviodigital.com (Netlify deploys automatically from `main` on GitHub `grai72/zivio-digital-site`)
- Domains: ziviodigital.com is the main address and ziviodigital.ca redirects to it (both managed in Netlify DNS)
- The old address ziviodigital.netlify.app redirects to ziviodigital.com through `_redirects`. Client site credits link to ziviodigital.com
- Sister product: Zivio TapProfile, https://tapprofile.ziviodigital.com (repo `grai72/tapprofile`)

## How the site is built

- One static page, `index.html`, with all CSS and JS inline. No build step: Netlify publishes the folder as it is.
- `privacy/index.html`: privacy policy (PIPEDA). It copies the colour tokens and light/dark switch from `index.html`; if those change, update both.
- `404.html`: page-not-found page, same look.
- `_redirects`: `/tapprofile` goes to tapprofile.ziviodigital.com (the old landing page was removed), and these notes files return 404 so they aren't readable online.
- `robots.txt`, `sitemap.xml`, `llms.txt`: search engines and AI assistants. The home page also has structured business details (JSON-LD) in the `<head>`.
- `og-image.svg` is the share image source; `og-image.png` (1200x630) is rendered from it with headless Edge, wrapped in a page that loads the Google fonts.
- `images/work/`: portfolio screenshots (ARA, Skyview, Hawk Eye), JPG quality 82.
- Contact form: Netlify Forms, form name `contact`, honeypot `bot-field`. Submissions appear in Netlify under Forms. `netlify/functions/submission-created.mjs` also emails each one to hello@ziviodigital.com through Resend, with the customer as reply-to (needs `RESEND_API_KEY` in Netlify). `_redirects` keeps `/netlify/*` from being readable online.
- Phone: 587-206-5600 is a Retell number (Bandwidth, no texting) answered by the Retell agent "Zivio Receptionist", which says the call is recorded and transcribed. Retell keeps call recordings and transcripts for 90 days (agent's Data Storage setting), as the privacy page says; change both together. After each call Retell posts `call_analyzed` to `/.netlify/functions/retell-call-summary`, which checks Retell's signature and emails a summary and transcript to hello@ from calls@ziviodigital.com (subject starts "URGENT:" when flagged; missed calls get a short email). Needs `RETELL_API_KEY` (the Retell key with the webhook badge) and `RESEND_API_KEY` in Netlify. The field names it reads (`caller_name`, `business_name`, `callback_number`, `email`, `need`, `services`, `timeline`, `best_time`, `next_step`, `urgent`, `call_type`) must match the agent's post-call extraction fields.

## Design

- Layout from the 2026 redesign (ziviodigitalredesign.netlify.app), colours from the original site: gold `#c8960c` / `#e8b84b` and blue `#4f9cf9` on near-black `#080810`.
- Fonts: Plus Jakarta Sans (headings), Inter (text).
- Light look uses the same colours as TapProfile (bg `#f6f4ee`, text `#151925`, blue `#1f5fc2`, gold `#8f6a00`). The site follows the device setting until the visitor presses the sun/moon button; the choice is kept in localStorage `zivio-theme`.
- Content shows without JavaScript: fade-in animations only apply when the `js` class is on `<html>`.

## Page sections

Hero, ticker, Services (6, plus TapProfile band), Branding (8 cards), Our Work (ARA Electrical, Skyview Football Club, Hawk Eye Immigration, then TapProfile and "your project"), Why Zivio, Process, Packages ("Complete Brand Launch" featured), Service areas, call-to-action, Contact form, footer.

- All TapProfile links open https://tapprofile.ziviodigital.com/ in a new tab.
- Client quotes: Pardeep Hansra (Owner, ARA Electrical Ltd.), Rajwinder Sidhu (Manager, Skyview FC), Harbir Nagra (Hawk Eye Immigration). Published 2026-10-30 with the owner's OK.
- Gurtej designed the Skyview FC and Hawk Eye logos.
- A "Meet the founder" section was removed on purpose; add it back once the business has grown a little.

## Open items

Waiting on Gurtej:

- [x] Email: hello@ziviodigital.com forwards to Gmail through ImprovMX (free plan) and sends through Gmail "Send mail as". Records are in Netlify DNS. Working end to end on 2026-11-06.
- [x] Contact form tested by Gurtej, 2026-11-07. Backup Netlify form notification turned off, 2026-11-08. Form emails now come only through Resend to hello@; submissions are still listed in Netlify under Forms.
- [x] Each client told their quote is on the site (confirmed 2026-11-08).
- [x] Phone number 587-206-5600 on the site (contact section, footer, business details, privacy page, llms.txt), 2026-11-07.
- [x] Instagram link https://www.instagram.com/ziviodigital/ on the site (contact section, footer, business details, llms.txt) and on the Google Business Profile, 2026-11-08.
- [ ] Other social media links and a booking link (e.g. Calendly) to add to the site.

Domain follow-ups:

- [x] https://ziviodigital.ca redirects to ziviodigital.com (confirmed 2026-11-06).
- [x] Site added to Google Search Console with `sitemap.xml` submitted, and Google Business Profile created. Gurtej reviewed the profile on 2026-11-08 and considers it verified; it wasn't showing yet in signed-out Google or Maps searches that day, so check again in a few days.
- [x] https://tapprofile.ziviodigital.com is covered by the ziviodigital.com Search Console property; its sitemap was read successfully (21 pages) on 2026-11-06.

Ideas for later:

- [ ] Website visitor stats (privacy-friendly, e.g. Netlify Analytics or Plausible). Update the privacy page if added.
- [ ] Founder section, more case studies, a short blog or FAQ for local search.

## History

- 2026-11-07: AI phone answering on 587-206-5600 (Retell), with call summaries emailed to hello@.

- 2026-11-06: contact form submissions now also email hello@ziviodigital.com through Resend, with the customer as reply-to.
- 2026-11-06: moved the site to ziviodigital.com and the contact address to hello@ziviodigital.com.
- 2026-10-30: merged the redesign layout with the original colours; added branding services, Our Work portfolio with client quotes, light/dark look, SEO setup, privacy page, share image, and the TapProfile redirect.
