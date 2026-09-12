# INU Media — the About page

Route: `/about` · Production: https://inuxsynapsis.vercel.app/about

Built from `chatgpt inu design/INU_Media_6_Pages_4K/about/about page.png` and the
nine 4K plates in that folder's `inu_media_assets_4k/`. Every object on the page
is one of those nine plates; nothing was invented, recoloured or upscaled.

## Work on this version

- `src/about/content.json` — all copy: hero wordmark and taglines, the three
  section headings, the founder quote, the four hand-written notes, the making
  chain, the footer note.
- `src/about/template.html` — the `<main>` only. The header, footer, grain,
  burn, soundtrack, consent bar and post-footer reveal all come from the shared
  shell (`dist/index.html`).
- `src/about/about.css` — page styles, including the two typefaces this page
  introduces.
- `src/about/experience.js` — one job: fire the shared warm flare when the
  founder and philosophy bands arrive, the way Home and Portfolio already do.
  Everything else (parallax, reveals, embers, Lenis, sound) is `home.js`.
- `src/about/assets.json` + `src/about/assets/` — responsive WebP plates and the
  two page-only fonts.
- `build/render-about.js` — writes `about.html`, `about.css`, `about.js` and
  `about-assets/` into `dist/` and `site/`.
- `build/verify-about.js` — runs inside `npm run check`.

## Sections

| Band | What it is |
| --- | --- |
| Hero | Studio plate, fresnel, INU director's chair, road case, foreground camera rig, the `INU / MEDIA` wordmark and two hand notes. |
| Story | "Not an agency…", the taped set photograph with a film strip taped over its corner, and the `Ideas → People → Camera → Edit → Real emotion` chain. |
| Founder | Sahil Kohli, his quote, and the taped Kodak Portra frame. |
| Philosophy | "Good work should make you feel something.", the clapperboard, and the closing link to Let's talk. |
| Reveal | The reserved `end-about` plate — "Same people. Different stories." made literal. |

## Type

This page introduces two families, and both are demanded by the artwork rather
than by preference:

- **Playfair Display** (`about-assets/playfair.woff2`, variable 400–900) is the
  serif the 4K comp is set in. It carries the wordmark, the three headings, the
  prose and the founder quote.
- **Architects Daughter** (`about-assets/hand.woff2`) is the thin marker hand
  that is already chalked onto the supplied road case and clapperboard. The
  site's usual Caveat Brush is a fat brush script and visibly fights that chalk
  where the two sit side by side.

Both are SIL OFL; licences are in `licenses/`. Archivo still carries every
eyebrow, label and UI string, so the page stays inside the system.

## Light

The studio plate already contains a real beam falling from the upper right onto
the floor. The fresnel is positioned *on* that beam and only adds a hot bulb
that ticks like a practical; no CSS light cone is drawn over the photograph.
The hero background is framed so the wall/floor horizon sits just under the
headline and the reflected floor stays in shot.

## Motion

- The hand-written notes are not faded in. Each line wipes left to right in the
  order a hand would put it down, and the orange rule under it is drawn last.
- The taped plates lift and straighten under the cursor, like prints on a wall.
- The making chain sends a slow orange pulse along its arrows once it is on
  screen.
- The `INU` wordmark carries a second, clipped copy of the studio plate that
  drifts slowly inside the letterforms. Where `background-clip: text` is
  unavailable it simply never paints and the solid word underneath is untouched.
- The page has its own opening burn (`media/burn-about.*`, the slow amber
  light-leak at 6.35s of the user's burn compilation) and its own gated sound.
- Everything above is switched off under `prefers-reduced-motion: reduce`.

## Rebuilding the assets

Only needed if the source plates change; the exports are checked in.

```sh
npm run about-images   # python build/prepare-about-assets.py
npm run about-media    # python build/prepare-about-media.py  (needs ffmpeg)
npm run build
npm run check
```

## Known gap

`Watch our story` is styled exactly as the comp draws it but there is no film to
play yet, so it scrolls to the story band. When a film exists, point
`hero.playTarget` in `content.json` at it and give the control a dialog.
