# Media provenance

All room backgrounds, cutout characters, service objects, logo samples and project thumbnails were supplied in the user's INU Media design folders. Responsive image exports retain their source dimensions in `src/home/assets.json`. WebP exports use quality 88–92 and appropriate responsive sizes; they are not represented as lossless or as newly created detail.

The current soundtrack is the user's selected `Cinematic Action Trailer Background Music NO COPYRIGHT _ 1 Minute Hero Entry Bgm.mp4`, converted to an audio-only MP3 with loudness normalization and short entrance/end fades. Its duration remains approximately 66 seconds. This project does not assert a third-party license based on the file's title.

The silent grain and opening burn come from the two user-supplied overlay clips. Their audio streams are removed from all visual exports. A separate excerpt of the burn compilation's audio is used as the burn sound effect, gated by the visitor's sound choice. Reproduction parameters are in `build/prepare-cinematic-media.py`.

The previously researched Scott Buckley track is **not used or shipped**.

The About page's nine plates are the user's supplied `inu_media_assets_4k` PNGs. They are trimmed to their own
alpha bounding box and scaled down only; the film strip additionally ships a two-frame crop. Nothing is upscaled,
recoloured or retouched. Its opening burn is the 6.35s light leak from the same user-supplied burn compilation,
prepared by `build/prepare-about-media.py`, with its audio exported separately and gated by the sound choice.

About adds two SIL OFL typefaces used only on that route: Playfair Display (the serif the 4K comp is set in) and
Architects Daughter (the marker hand already chalked onto the supplied road case and clapperboard). Both are the
Google Fonts latin subsets, shipped self-hosted and fingerprinted.

Font licenses are included alongside this document. Lenis is distributed under its included MIT license.

## Portfolio thumbnails (13 September 2026)

All twenty-seven project thumbnails were re-sourced by `build/fetch-portfolio-art.py`.
Previously only StockSnap was searched; it is a small library, so three film
projects shared one photograph of a RED camera and six projects fell back to
blank in-house placeholders. The search now runs StockSnap, then Rawpixel, then
Flickr, filtered to `cc0,pdm,by` photographs, and every chosen file is checked
against every other so no two projects can share a picture. The current set is
**27 distinct images, all CC0 1.0** — public domain, so no attribution is
legally required; it is recorded in `licenses/portfolio-art.json` regardless.

Every thumbnail is then put through one grade in the same script: a mild
desaturation, an S-curve, a shadow-to-highlight duotone blended over (not
replacing) the original colour, a vignette and fixed-seed grain. The photographs
come from twenty-seven unrelated places and were shot in every kind of light;
the grade is what makes them read as one body of work on a very dark amber page.
The images are cropped and graded, which is why NoDerivatives licences are
excluded from the search, and ShareAlike is excluded so the page is not pulled
into its terms.

The five Featured Work thumbnails on the home page are the user's own INU
collages from `chatgpt inu design/creative images for inu media`, prepared by
`build/prepare-home-work-art.py`. They are a deliberate stopgap until the real
project drive arrives, and they carry INU Media's own branding rather than the
clients'. They replace five 158x107 files that were being painted into a 288px
card.

## Studio map (13 September 2026)

The Let's-talk map is vector tiles from OpenFreeMap (OpenMapTiles schema, data
from OpenStreetMap), drawn through `src/talk/map-style.json`. No API key. The
attribution required by ODbL is shown in the map's own control and is not
removable from the build. MapLibre GL JS is BSD-3-Clause and is vendored from
npm rather than loaded from a CDN. Leaflet and its raster OpenStreetMap tiles
are no longer used.
