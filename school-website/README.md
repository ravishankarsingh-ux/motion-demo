# Nalanda Public School — website

A multi-page, interactive website for a fictional K-12 school in the spirit of a large Indian public school (Delhi Public School style). Fully static — deployable on GitHub Pages or any web server — with generated demonstration content.

## Pages

| Page | Purpose |
|---|---|
| `index.html` | Homepage: Three.js hero, announcement ticker, **school updates**, quick links, stats, upcoming events, admissions CTA |
| `about.html` | Mission, principal's message, values, history timeline, house system |
| `academics.html` | Learning stages, streams & electives, facilities, board results |
| `admissions.html` | Process, age criteria, documents, **admission inquiry form** |
| `news.html` | Full news grid + school calendar |
| `virtual-classroom.html` | **Video & voice session schedule** with join links, guidelines, e-safety |
| `contact.html` | Campuses, **feedback form**, **event registration form**, directions |

## Tech

- **Motion** (`vendor/motion.min.js`, UMD) — scroll-reveal animations, staggered grids, animated statistics, the announcement marquee. Loaded on every page via `js/main.js`.
- **Three.js** (`vendor/three.module.min.js`, ES module + import map) — the homepage hero: a golden particle constellation with floating wireframe geometry, pointer parallax, and a scroll-linked camera. Pauses off-screen; renders a single static frame under `prefers-reduced-motion`.
- No build step, no framework, no external CDNs at runtime except Google Fonts.

## Updating content (for school staff)

News, the homepage ticker, and the events calendar are data-driven — edit two JSON files, no HTML knowledge needed:

- **`data/news.json`** — news cards (shown newest-first on the homepage and newsroom) and the `announcements` ticker strings.
- **`data/events.json`** — the events calendar on the homepage and `news.html#calendar`.

Each file starts with a `_comment` field describing its format. Commit the change (or upload via your host's file manager) and the site updates immediately.

## Video / voice calls

The Virtual Classroom page presents a session schedule whose join buttons link to Google Meet rooms. In production, point each link at a class-specific Meet room created in the school's **Google Workspace for Education** admin console — access is then restricted to school-domain accounts, giving authentication, host controls, and recording policies without running any custom call infrastructure. (WebRTC self-hosting was deliberately avoided: a school should not operate its own call security.)

## Forms

The inquiry, feedback, and event-registration forms include full client-side validation (visible labels, inline errors on blur, focus management, `aria-live` status). Submission is currently simulated — connect them to a form endpoint (Formspree/Netlify Forms) or the school ERP by replacing the `setTimeout` block in `js/main.js` → `initForms()`.

## Accessibility

Skip links, semantic landmarks, one `h1` per page, sequential headings, `aria-current` navigation state, keyboard-operable menu with Escape handling, visible focus rings, `prefers-reduced-motion` honored by both Motion and Three.js (content is never hidden when JS fails — reveal states are gated on an `html.motion-ok` class), form errors announced via live regions, data tables with captions and scoped headers, and WCAG AA contrast on the navy/gold palette.

## SEO

Per-page titles and meta descriptions, canonical URLs, Open Graph tags, `schema.org/School` JSON-LD on the homepage, `sitemap.xml`, and `robots.txt`. Replace `example.edu.in` with the real domain at launch.

## Local preview

```bash
cd school-website
python3 -m http.server 8080
# open http://localhost:8080
```

(A server is needed because news/events load via `fetch` and the hero uses ES modules — opening `index.html` from the filesystem won't load them.)
