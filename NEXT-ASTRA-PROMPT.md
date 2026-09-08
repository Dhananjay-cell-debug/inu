# Paste this into the next Astra session with the next page reference image

You are continuing my INU Media website. Build **only the next page shown in my attached reference image**, inside the existing project. The reference is the visual specification: match its composition, imagery, section order, typography, proportions, lighting, and details as closely as possible. Do not substitute a generic agency template or redesign the page from your own taste. Preserve the finished home page unless I explicitly request a change to it.

## Start from the real project

- Workspace: `F:\INU media\inu-cinematic`
- GitHub: `https://github.com/Dhananjay-cell-debug/inu.git`
- Production: `https://inuxsynapsis.vercel.app`
- Run `npm install`, `npm run build`, and `npm run dev` as needed. Preview is `http://localhost:3200`.
- Read `HOME.md`, `src/home/content.json`, `src/home/template.html`, `src/home/cinematic.css`, `src/home/responsive.css`, `src/home/experience.js`, and `build/render-home.js` first. These are the current implementation. The older `src/home/index.html`, `home.css`, `home.js`, and other legacy page builders are not the current source.
- Inspect Git status before editing and preserve unrelated files. Do not work in `plum-clone`, `inu-plum`, or `inu-redesign`.
- The old `.openai/hosting.json` identifies a previous private preview. I explicitly want this project published to the existing **inuxsynapsis Vercel project**, after GitHub is pushed. Do not create another project or overwrite the separate `inumedia` Vercel project.

## My visual expectations

1. **Ditto reference fidelity.** Study the full page and zoom into the important sections. Match the reference thoughtfully, then refine against browser screenshots. Be honest if an exact font or full-resolution asset is absent; inspect my asset folders before assuming it is unavailable.
2. **Real, editable website.** No full-page screenshot backgrounds and no baking the page's headings, text, buttons, numbers, or navigation into a raster image. Use original transparent cutouts and room/background layers. Keep the text real HTML and the imagery separate so everything can move and later become WordPress fields. Brand logos and text intrinsic to supplied artwork can remain image assets.
3. **Keep this brand language.** Deep black, restrained amber/orange, strong condensed white headings, expressive orange brush lettering. The home page self-hosts Archivo for body/UI, Barlow Condensed for display headings, and Caveat Brush for orange accents. Match the next reference's typography within this language. No cartoonish glow, fat pill cards, or generic rounded dashboards.
4. **Integrate the art.** Text must feel part of the lit scene. Do not attach a black rectangular copy panel beside an image. Extend the background behind the entire composition and use soft overall gradients for legibility. Avoid hard image seams, cropped faces, floating characters, and cut-off feet.
5. **Breathing room.** Space out headings, copy, cards, statistics, and section transitions deliberately. Do not cram them together. Keep connected content visually related and avoid arbitrary empty screenfuls.

## Mobile is a separate composition

- Reflow the design for phones; do not simply shrink a desktop screenshot or stack giant cards.
- The home page uses compact two-column service tiles, roughly 128–165px wide and 110–120px tall on 320–390px screens. Use that density as a reference where appropriate, not a mandatory size for every component.
- Portfolio thumbnails use a horizontal swipe row with roughly two cards and part of the next visible. Preserve clear touch targets and readable text.
- Tablet layouts are intentional too: the service grid becomes three columns before becoming two on mobile.
- Reposition art and copy to preserve the focal point. Do not let images crowd the copy or hide behind an opaque box.
- Test 320px, 390px, 768px, and 1440px widths, plus a large desktop if your changes affect it. Check no horizontal body overflow, text clipping, broken line wraps, or controls overlapping content. Test real scrolling and interactions, not just initial screenshots.

## Cinematic motion: slow, precise, sequential

- Extend the existing motion engine. Lenis 1.3.26 is already installed and self-hosted. Desktop wheel scrolling is smoothed; touch scrolling stays native. Do not stack smooth-scroll libraries.
- Use restrained layered parallax, staggered section/card entrances, a slow mask-man fade-in and scale-up that **stops**, and subtle orange embers/aura behind the character. Give each movement a purpose. Do not move every element constantly or run endless huge blur effects.
- Buttons should have considered hover/focus/pressed feedback: the home page uses an orange fill sweep and a small rotating arrow. Cards have small image lifts, subtle border accents, and smooth carousel transitions. Navigation, links, dialogs, and mobile menus must actually work.
- Animate transform/opacity primarily. Cache geometry on resize and font loading; avoid layout reads in every animation frame. Pause animation/media when the tab is hidden or the relevant scene is outside the viewport. Respect `prefers-reduced-motion` and data-saver behavior.
- Never show a blank loader waiting for art or audio. The content should work without JS; enhancements must not permanently hide it.

## Use my exact film and music assets

Originals are in `F:\INU media\chatgpt inu design\cinematic feels`:

- `grainy old film overlay ;).mp4` — keep the grain overlay itself silent and subtle. It should add texture without whitening the page or obscuring text.
- `Level Up Your Videos with 4K Film Burn Transition Sounds.mp4` — contains multiple different burns. Inspect a contact sheet and fine-grained timestamps, then choose a distinct short burn suited to the next page's opening. Do not play the whole compilation or randomly flash it while someone reads.
- `Cinematic Action Trailer Background Music NO COPYRIGHT _ 1 Minute Hero Entry Bgm.mp4` — **this is the soundtrack I selected**. Keep it. Do not replace it with another song or invent a generated soundtrack.

Current optimized exports are in `src/home/media/`; `build/prepare-cinematic-media.py` documents the selected cut and audio processing. The home page uses the burn around 1.6 seconds into the compilation, with a warm visible burst of about 1.3 seconds. The grain is a 12-second silent loop. The soundtrack is an audio-only export of my approximately 66-second file. Film-burn sound is separate so it plays only when sound is enabled.

Keep a clear Sound on/off control. Audible playback requires a visitor gesture; never try to bypass that. Fade sound in/out, pause when hidden, and avoid starting duplicate soundtracks when adding pages. Since there are now multiple real pages, decide deliberately how the shared navigation and sound behavior work across them. Do not make up licensing claims from a filename.

## Assets and WordPress readiness

- My page references and 4K assets live under `F:\INU media\chatgpt inu design\INU_Media_6_Pages_4K`. Look in the folder corresponding to the next page.
- Use high-quality responsive WebP exports from the actual high-resolution originals; retain transparency. Supply width/height, useful `srcset`/`sizes`, eager loading only for essential hero art, and lazy loading below the fold.
- Do not upscale a tiny reference crop and call it 4K. Some home-page project thumbnails currently have only reference-resolution sources; replace them only if the matching higher-resolution artwork exists.
- Keep all editable copy, links, services, projects, stats, and image choices in a content structure separate from the template. The home page uses `content.json` plus `assets.json`. Keep presentation CSS and motion separate. Extend the build with a distinct page template and content file rather than hardcoding everything into one script.
- WordPress is **later**. Do not install WordPress or add an admin/backend now. Structure the page so its sections can become template parts, its records can become custom fields/repeaters, and its assets can map to the media library.

## Navigation and scope

Exactly five primary items: **Home, About, Services, Portfolio, Let’s talk**. Do not reintroduce a separate Contact item. Use the existing home-page sections until the corresponding real page exists, then wire the appropriate page link. Do not leave broken routes or invent case-study claims, performance numbers, email addresses, or testimonials.

## Finish the work

Implement fully, preview in the browser, inspect desktop and mobile, scroll through every reveal, and fix what you find. Test the menu, anchor/page links, dialogs, keyboard close, carousel, sound on/off, muted grain, finite opening burn, image loading, and console errors. Do not say “pixel perfect,” “lossless,” “60 fps,” or “tested” unless the evidence supports that claim.

Run `npm run build` and `npm run check`; extend relevant checks for the new page. Commit only this project's intended changes, push **first** to `https://github.com/Dhananjay-cell-debug/inu.git`, then deploy the pushed source to the existing `inuxsynapsis` project. Verify Vercel reports Ready and the production page and its assets load. Keep the home page working.

Do not stop with a plan or ask me to choose routine technical details. Make thoughtful decisions, complete the work, and show me the finished page. Deliver the live URL and a short, honest note about any remaining limitation.
