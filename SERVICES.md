# Services page

Route: `/services` on the existing INU Synapsis site.

## Authoring

- `src/services/content.json`: headings, eight service records, offerings, partnership and process copy.
- `src/services/template.html`: semantic section structure and editable SVG diagram labels.
- `src/services/services.css`: page-scoped desktop, tablet and phone compositions.
- `src/services/assets.json`: responsive image choices and dimensions.
- `build/render-services.js`: reuses the rendered home shell, fonts, navigation and motion script, then adds the services composition. Run the normal `npm run build` to build all three pages.
- `build/verify-services.js`: checks service records, offering counts, image files, detail actions and links between the three pages.

Existing home and Let's talk navigation links point to the real services page. The home “Explore all services” link now opens this page. Other home content and styling are preserved.

## Phone layout

Two service columns, with image, title and a full-card touch target. JS opens the shared accessible detail dialog with the description and four offerings; Escape, backdrop and close button dismiss it and restore focus. Without JS, descriptions and lists remain inline. Desktop shows the complete service information in four columns; tablets use three columns. There is no card carousel or horizontal body navigation.

## Artwork provenance

The hero and closing scene use the supplied room exports and separate transparent character/desk layers under the services asset folder. `build/prepare-services-assets.py` documents those source mappings. The supplied pack is labelled “4K Upscaled”; exports are never enlarged again.

The eight matching card photos exist in the supplied 1920 × 3840 reference, rather than separate high-resolution files. Only the photographs are cropped; page numbers, navigation, headings, descriptions, bullets and arrows remain HTML. Laptop-screen lettering is intrinsic to the supplied artwork. The card image ceiling is approximately 350px wide; responsive WebP compression does not add detail.

## Motion and audio

Uses the existing Lenis, scroll reveals, finite character entrance, restrained parallax and embers. Shared code supports pages without a portfolio carousel. Reduced-motion disables the animation layers; data saver prevents automatic grain and entry burn downloads.

The services opening uses a single left-edge burn at 21.8s in the user's compilation, slowed to roughly 1.3 seconds. Quarter-second contact sheets were used to choose the cut. `build/prepare-services-media.py` produces silent WebM/MP4 overlays and a separate sound effect. The user's exact existing score is reused. Sound requires a gesture on each page; normal document navigation unloads the previous audio, preventing simultaneous soundtracks. Hidden tabs pause media.

## Publishing

Preserve the existing `inuxsynapsis` Vercel project and the shared site's current source. Push the validated commit to the existing GitHub repository before deploying. Images use fingerprinted filenames for immutable caching. Original workspace artwork and QA captures are not required for a production build.

This remains a static editable-content build, ready to map to WordPress template parts and field repeaters later; no WordPress backend is installed.
