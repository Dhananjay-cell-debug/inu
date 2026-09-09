# INU Media — cinematic site

A five-page site built from the 4K page designs in
`chatgpt inu design/INU_Media_6_Pages_4K`. Black room, amber light, sections
cut apart by sweeping curves with a light line running along each cut.

This is a **new build**, separate from `plum-clone` / `inu-plum` (those mirror
the old Framer template and share nothing with this design language).

```
inu-cinematic/
├── src/                     authored source
│   ├── layout.html          the shell: nav, footer, overlays, script tags
│   ├── pages/*.html         page bodies only
│   ├── css/inu.css          the whole design system
│   └── js/inu.js            the motion engine
├── build/
│   ├── images.py            4K packs  → web webp (cutouts + background slices)
│   ├── plates.py            work plates (16:9) + service thumbs (1:1)
│   ├── video.sh             grain loop + one film burn per page
│   ├── pages.js             assembles src/ → site/
│   └── shot.js              screenshot the preview in viewport slices
├── site/                    ← deploy this folder
└── server.js                preview on http://localhost:3200
```

## Working on it

```
node build/pages.js          rebuild the five pages   (run after ANY src/ edit)
node server.js               preview on :3200
python build/images.py       only if the 4K packs change
python build/plates.py       only if work imagery changes
sh build/video.sh            only if the overlay clips change
```

`src/` is the source of truth. Nothing in `site/` should be hand-edited —
`pages.js` overwrites `site/*.html`, `site/assets/css/inu.css` and
`site/assets/js/inu.js` on every build.

---

## How the curved cuts work

The thing that makes the design read is in `inu.js → layoutCuts()`.

Each `.band` clips its own **top** edge to a curve and is pulled up over the
band above it by exactly the depth of that curve, so the cut reads as one
continuous sweep rather than two shapes meeting.

- Curve shapes live in `PROFILES` — `swoopL`, `swoopR`, `arc`, `wave`, `rise`,
  `dip`. Pick one per section with `data-cut="wave"`.
- Depth is computed in **pixels** (`clamp(height * 0.088, 44, 140)`), not as a
  share of the band's height. A tall section on a phone therefore does not end
  up with an absurd sweep across it.
- The clip path is written into `<defs id="cutDefs">` in
  `clipPathUnits="objectBoundingBox"`, so it stays correct through any resize.
- The glowing line on the cut is a **sibling** of the clipped element
  (`.band__edge`), not a child — otherwise the clip would eat its own glow. It
  draws itself in with a dash offset when the section comes up.

Everything recomputes on resize and again once webfonts land (they change where
lines break, which changes section heights).

## Section anatomy

```html
<section class="band" data-cut="wave" data-ember style="--minh:680px">
  <div class="band__clip">
    <div class="band__bg" data-shade="left" style="background-image:url(...)"></div>
    <div class="band__veil"></div>
    <div class="fig fig--right" style="--w:...;--r:4%;--b:-10%">
      <img src="..." data-parallax="0.11">
    </div>
    <div class="wrap"> … copy … </div>
  </div>
  <svg class="band__edge"><path/></svg>
</section>
```

- `data-shade` — `left` / `right` / `both` / `deep`. Shades the plate away from
  wherever the copy sits, so type never fights the amber streaks behind it.
- `.scrim` on a copy column adds a local pool of dark under it. `.panel` does
  the same for a full-width row.
- `.fig` positions; the `<img>` inside is what gets parallaxed, so a transform
  never fights the positioning.
- `data-ember` marks a section as one of the "important" ones: drifting embers
  and the warm grain pass fade up while it is on screen.

## Motion vocabulary

| attribute | effect |
|---|---|
| `data-split` | splits into masked lines, each pushed up from its own edge |
| `data-split="chars"` | per-character reveal |
| `data-reveal="up\|left\|right\|scale\|wipe"` | single-element entrance |
| `data-stagger="0.06"` | staggers the element's direct children |
| `data-parallax="0.12"` | scroll-scrubbed drift |
| `data-count="35" data-suffix="+"` | counts up when it arrives |
| `data-type` | typewriter |
| `data-delay="0.2"` | delays any of the above |

`prefers-reduced-motion` switches all of it off, keeps every element visible,
and hides the grain, embers and burn overlays.

## Cinematic layer

- **Film grain** — the client's `grainy old film overlay ;).mp4`, silent,
  720×540, `mix-blend-mode: overlay` at 8.5%. A second warm-tinted pass fades
  up to 22% over `data-ember` sections; it is on `screen`, deliberately not
  `color-dodge` (dodge blows the whole page out to orange).
- **Film burns** — five clips cut out of the client's burn reel by shape, one
  per page, played on entry and again on the way out of an internal link:
  `a` about (long slow bloom) · `b` services (brightest flash) ·
  `c` portfolio (hard fast strike) · `d` contact (soft double lick) ·
  `e` home (mid roll-through).
- **Embers** — a small canvas of drifting sparks, only over `data-ember`.
- **Score** — written, not licensed: a drone, an A-minor-pentatonic pad and an
  air bed built with the Web Audio API (`inu.js → score()`). Scrolling opens
  the filter, so moving down the page lifts the room. Off until the speaker
  button in the nav is pressed.

## Two things that bit, so they do not bite again

1. **`loading="lazy"` does not fire inside these bands.** Chrome reports the
   images as never intersecting, so they sit unloaded while on screen —
   IntersectionObserver agrees with it. `lazyImages()` therefore promotes
   images to `eager` off the scroll position instead. Do not remove it.
2. **Autoplay does not start in a background tab.** The grain sits paused if
   the site is opened in a tab that has never been looked at, so `overlayVideo()`
   retries on `visibilitychange` and on first interaction.

---

## Content provenance

Everything on the site is sourced. Nothing is invented.

| Fact | Source |
|---|---|
| Studio address, both phone numbers | KHOONTA proposal deck footer |
| Founder — Sahil Kohli, Founder & CEO | brand summary, LinkedIn |
| "You grow, we grow" · "Design adds value faster than it adds costs" · the awards line · the four process steps | KHOONTA proposal deck, near-verbatim |
| Service list and sub-bullets | deck's service pages |
| Client list | deck's client page |
| "35+ brands & clients" | counted from that client list |
| "15 years combined experience" | deck |
| "350M+ creator-network reach" | deck, self-reported — labelled as the studio's own figure |
| "Tadka — 1M+ views" | deck |
| Press outlets on the portfolio strip | only outlets with an actual coverage screenshot in `content/site_backup/images/pdf_extracted/portfolio_real` |

Deliberately **not** used:

- The deck's "where you could be featured" media list. That is a target list,
  not achieved coverage, and presenting it as a client logo wall would be a
  false claim.
- KHOONTA itself as a case study. It is a proposal, not delivered work.
- The 84% / 96% ad figures. Self-reported, unaudited, and load-bearing if a
  client repeats them.

### ⚠ One unconfirmed detail

`hello@inumedia.agency` is **not confirmed**. No email address for INU Media
appears on the archived site, in either proposal deck, or on any live profile.
Everything else on the site (address, both phones, Instagram, LinkedIn) is
sourced.

It is defined once, in `build/pages.js` (`const EMAIL`) and in the
`data-mailto` attribute on the contact form. Change it in those two places and
it changes everywhere. Get the real address from Sahil before launch.

### Work imagery

Nine of the fifteen portfolio cards use real client work; the extraction
filenames from the PDFs are shifted and misleading, so every image was opened
and identified by eye before being mapped (see the comment on `PROJECTS` in
`plates.py`).

The sources are small — 201×251 up to 1200×630 — so they are not shown raw.
Each is graded into the same room and either goes full-bleed or sits on a bed
of its own colours inside a hairline frame. That is what makes fifteen very
different images read as one grid.

The remaining five (Maarrich, Lodha, Aerobott, Zouq, and one spare) are
**designed slates** carrying a "Stills to come" tag, not photographs. When the
client sends imagery, drop the file into `PROJECTS` in `plates.py`, rerun it,
and remove the `<span class="work__soon">` from that card.

**Ask the client for:** film stills and key art at full resolution, event
photography, Lodha / Aerobott / Zouq campaign creatives, and 2× screenshots of
the Qilin and ANS sites. The image ceiling is the main thing holding the
portfolio back.

## Still open

- **Home is a first pass.** The layout was not signed off, so `index.html`
  establishes the language and links the finished pages together rather than
  committing to a design.
- Individual project pages do not exist yet — every card points at the grid.
- The contact form composes the message in the visitor's own mail client. It
  says so on the page. A real backend is a separate decision.
