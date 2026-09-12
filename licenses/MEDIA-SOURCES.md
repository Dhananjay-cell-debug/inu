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
