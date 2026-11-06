# Zivio Digital website

The Zivio Digital agency site: complete branding, custom websites, digital marketing, managed IT and cloud services for Calgary businesses.

- Live: https://ziviodigital.com (Netlify deploys automatically from `main` on GitHub `grai72/zivio-digital-site`)
- Domains: ziviodigital.com is the main address and ziviodigital.ca redirects to it (both managed in Netlify DNS)
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
- [ ] After confirming the form email reaches hello@ through Resend, turn off the backup Netlify form notification (it goes to the Netlify login email).
- [ ] Send each client their quote so they know it's on the site.
- [ ] Phone number, social media links and a booking link (e.g. Calendly) to add to the site.

Domain follow-ups:

- [x] https://ziviodigital.ca redirects to ziviodigital.com (confirmed 2026-11-06).
- [x] Site added to Google Search Console with `sitemap.xml` submitted, and Google Business Profile created (check that verification finishes).
- [ ] Add https://tapprofile.ziviodigital.com to Google Search Console if the ziviodigital.com property does not already cover it.

Ideas for later:

- [ ] Website visitor stats (privacy-friendly, e.g. Netlify Analytics or Plausible). Update the privacy page if added.
- [ ] Founder section, more case studies, a short blog or FAQ for local search.

## History

- 2026-11-06: contact form submissions now also email hello@ziviodigital.com through Resend, with the customer as reply-to.
- 2026-11-06: moved the site to ziviodigital.com and the contact address to hello@ziviodigital.com.
- 2026-10-30: merged the redesign layout with the original colours; added branding services, Our Work portfolio with client quotes, light/dark look, SEO setup, privacy page, share image, and the TapProfile redirect.
