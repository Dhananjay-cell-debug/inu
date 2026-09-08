# INU Media — current cinematic home page

Production: https://inuxsynapsis.vercel.app
GitHub: https://github.com/Dhananjay-cell-debug/inu.git

## Work on this version

- `src/home/content.json`: copy, navigation, services, portfolio records, statistics, contact links, soundtrack settings.
- `src/home/template.html`: editable semantic page structure; no screenshot page backgrounds or baked headings.
- `src/home/cinematic.css` and `responsive.css`: shared visual language and phone/tablet layouts.
- `src/home/experience.js`: navigation, accessible dialogs, carousel, Lenis, reveal/parallax, embers, media and sound controls.
- `src/home/assets.json`: responsive artwork variants prepared from the supplied 4K originals.
- `src/home/media/`: optimized, selected cinematic media.
- `build/render-home.js`: creates standalone HTML/CSS/JS in `dist/`, and updates only the home page in the existing `site/` preview directory. Static text is rendered at build time; JS enhances it.

The older `src/home/index.html`, `home.css`, `home.js`, `build/home.js`, and five-page builders are retained locally/history for reference and are not the current authoring path.

## Commands

```sh
npm install
npm run build
npm run check
npm run dev
```

The preview serves http://localhost:3200. A source edit needs another build and browser reload; this small static project has no HMR. Preprocessed assets are checked in, so a normal clone/build does not require Python, FFmpeg, or the original private workspace folders.

## Visual and motion behavior

The hero is built from a room, editable brush headline, separate masked person, desk, atmosphere, and belief copy. It has no detached rectangular text panel. Service objects and the closing room/person use responsive WebPs derived from the provided high-resolution artwork. Project thumbnails are still limited by their supplied reference-resolution originals; format conversion cannot invent missing detail.

The desktop has generous section spacing and a six-column service row. Tablets use three service columns. Phones use compact two-column service tiles and a swipeable portfolio. White display type uses Barlow Condensed; orange lettering uses Caveat Brush; UI/body uses Archivo. Fonts are self-hosted with licenses included.

Smooth wheel scrolling uses [Lenis](https://github.com/darkroomengineering/lenis). Native touch scrolling remains intact. Scroll movement uses cached geometry and transform/opacity, following [web.dev's animation performance guidance](https://web.dev/articles/animations-guide). Reveals, finite mask scaling, low-count embers, and hover transitions complement the art. Motion and video honor reduced-motion preferences; hidden tabs pause audio/video and animation loops. No measured frame-rate guarantee is claimed.

The grain and burn visuals have no audio streams. The opening burn is a two-second export with a roughly 1.3-second visible warm burst. The soundtrack is the exact user-selected 66-second Hero Entry music, converted to MP3. Sound is opt-in and fades; activating it also replays the opening burn with its separate sound effect. See `licenses/MEDIA-SOURCES.md` and `build/prepare-cinematic-media.py`.

## WordPress later

Content is separate from the template and motion code. Sections can become PHP template parts; service/project/stat arrays can become repeaters or custom post types. Asset choices can map to attachment IDs and WordPress image sizes. This deliverable is a static site, not a WordPress install or a CMS editor.

## Publishing

Vercel project: `inuxsynapsis` in the user's existing account. `vercel.json` builds to `dist/`; image/font names are content-fingerprinted for safe immutable caching. Media and CSS/JS revisions prevent stale updates.

Commit the intended current source, push to `origin/main` first, then deploy the pushed source with Vercel and verify Ready status. The project is linked to the specified GitHub repo. Do not overwrite the separate `inumedia` deployment. `.openai/hosting.json` refers to the earlier private Sites preview; the user's explicit Vercel request is the current publishing destination.

Read `NEXT-ASTRA-PROMPT.md` before building another page.
