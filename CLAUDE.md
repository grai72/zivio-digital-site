# Zivio Digital website

Static agency site for Zivio Digital (Calgary). Notes, design and the open-items list: [README.md](README.md).

- Live at https://ziviodigital.netlify.app, deployed by Netlify from `main` on GitHub `grai72/zivio-digital-site`. Pushing to `main` puts changes live.
- No build step. `index.html` holds all CSS and JS inline; `privacy/index.html` and `404.html` copy its colour tokens and light/dark switch.
- Netlify serves every file in this folder publicly. Notes files are blocked in `_redirects`; add any new notes file there too.

## How the user likes to work

- Explore before building: when they say "let's explore", discuss and recommend, don't change files.
- Keep work local until they say to push or deploy.
- Plain, non-technical explanations; they're the business owner.
- Never invent facts about clients (numbers, results). Client quotes are approved by the user.

## Conventions

- Colours are CSS variables on `:root` (dark defaults) with a light set under `prefers-color-scheme: light` and `[data-theme='light']`. Light/dark choice is stored in localStorage `zivio-theme`.
- Some files have CRLF line endings; scripted edits should normalise first.
- Preview locally with `npx http-server@14.1.1 . -p 5180 -c-1`.
