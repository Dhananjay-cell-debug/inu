# INU Media — Let’s talk page

Route: `/lets-talk` (the design's "Contact" page, renamed). Production: https://inuxsynapsis.vercel.app/lets-talk

Built from `chatgpt inu design/INU_Media_6_Pages_4K/contact/06_contact_page.png` and the nine 4K
cutouts beside it. Sections, in order: hero, Send a message, Other ways to reach us, What's next, footer.

## Work on this version

- `src/talk/content.json` — copy, navigation, form fields, contact routes, endpoint, fallback email.
- `src/talk/template.html` — semantic structure. No screenshot page backgrounds; every heading,
  label, button and address is real HTML.
- `src/talk/talk.css` and `responsive.css` — visual language, and the separate phone/tablet layouts.
- `src/talk/experience.js` — navigation, Lenis, parallax, reveals, embers, film layers, sound, form.
- `src/talk/assets.json` + `src/talk/assets/` — responsive WebP layers.
- `build/render-talk.js` — renders `lets-talk.html`, `talk.css`, `talk.js` into `site/` and `dist/`.
  Images and fonts are content-fingerprinted into the shared `home-assets/` folder, so the fonts a
  visitor already downloaded on the home page are reused here.
- `build/verify-talk.js` — runs in `npm run check`.

Regenerating artwork or media needs the private design folders and Pillow/FFmpeg:
`npm run talk-images`, `npm run talk-media`. The generated files are checked in, so a clone builds
without them.

## Layers, not screenshots

`01_futuristic_amberlit_city_atrium.png` is one tall plate holding all four rooms; the build slices
it into `talk-room`, `talk-wall`, `talk-lounge` and `talk-sunset`. Everything else is an independent
transparent cutout: the seated man, the rim-lit figure, the three closing figures (the right one
mirrored so its mask turns inward, as in the reference), the lounge chair, the whiskey table and the
amber tree.

One honest limitation: the supplied pack has no full-length front-facing figure for the *Send a
message* wall. Asset `03_masked_businessman_in_dramatic_rim_light.png` — which matches that
figure's pose, mask and rim light exactly — is a chest-up bust, so it is masked with a gradient and
dissolves into the dark base of the wall instead of showing cut-off legs.

## Mobile is a separate composition

Not a shrunk desktop. On phones: the hero puts the copy over the dark window wall with the seated
man owning the lower half, and the vertical wall signage becomes one horizontal strip; the form
section opens with a short art band (note left, figure right) then full-width fields with hairline
borders and 16px text so iOS does not zoom on focus; the three contact routes become hairline rows
with the icon beside the label rather than three cards; the closing scene spreads all three figures
across the bottom with the sunset kept in the top-right. Reviewed at 360, 390, 768 and 1440 with no
horizontal overflow.

Chrome will not resize a window below its minimum width, so phone widths are reviewed through
`build/qa-frames.html`, copied into `site/` by the build: open
`http://localhost:3200/qa-frames.html?sizes=390x812,360x780` and drive `qa.ready()` / `qa.scroll(y)`.

## Motion and sound

Extends the existing engine — the same Lenis instance, cached-geometry parallax, and transform and
opacity only. The heading reveals line by line, the seated figure fades and settles once and stops,
and low-count embers run capped at 24 fps only while the hero is on screen. The opening film burn is
a different cut from the home page's: the lateral bloom at 25.85s in the supplied compilation,
slowed slightly, with its sound kept as a separate file so it plays only when sound is on.
`prefers-reduced-motion` and hidden tabs are honoured, and no measured frame rate is claimed.

Sound is opt-in on both pages. The choice is remembered for the browsing session, so enabling it on
the home page and following the link resumes the same score here; if the browser refuses to autoplay
after the navigation, the button simply stays on "Sound off".

## The form

Client-side validation with per-field messages, an `aria-live` status, a hidden honeypot, and a POST
to `/api/contact`. `api/contact.js` forwards through Resend and needs three environment variables in
the Vercel project:

| Variable | Value |
| --- | --- |
| `RESEND_API_KEY` | an API key from resend.com |
| `CONTACT_TO` | where enquiries should land |
| `CONTACT_FROM` | a verified sender on the domain |

Until those are set the endpoint answers 503 and the page tells the visitor to email directly,
rather than pretending the message was sent.

## Two values to confirm before launch

`Singapore / Creative studio` and `hello@inumedia.com` are transcribed from the supplied design.
Both live in `src/talk/content.json` and should be checked against the real studio address and a
mailbox that actually exists.
