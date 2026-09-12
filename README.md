# INU Media — the original production site

Production: https://inuxsynapsis.vercel.app/
Project: F:\INU media\inu-cinematic
GitHub: https://github.com/Dhananjay-cell-debug/inu.git
Preview: http://localhost:3300

This is the only active site project. Home, Services and Portfolio match the production baseline (verified 12 September 2026). The earlier Framer mirrors and alternate designs have been removed to Windows Recycle Bin.

## Workflow

Run `npm run build`, `npm run check`, then `npm start`. Rebuild and reload after source changes. No HMR. Vercel publishes `dist/`; `site/` is the local preview output. Both are generated. Do not edit either by hand.

## Source map

| Page / behavior | Authored source | Builder |
| --- | --- | --- |
| Home and shared shell | src/home/content.json, template.html, cinematic.css, responsive.css, experience.js | build/render-home.js |
| Services | src/services/ | build/render-services.js |
| Portfolio | src/portfolio/ | build/render-portfolio.js |
| Let's talk / contact | src/talk/contact-content.json, contact-template.html, contact.css, contact.js, experience.js | build/render-contact.js |
| Privacy | src/privacy/ | build/render-privacy.js |
| Post-footer reveals | src/talk/end-reveal.css, src/contact-assets.json | build/render-endings.js |
| Shared atmosphere / consent | src/home/atmosphere.css, atmosphere.js, partials/ | included by page builders |
| Contact delivery | api/contact.js | Vercel function |

About is deferred. Its named end image is exported and reserved, and the nav links to the existing About content on Home.

## Assets

Original references stay in the parent workspace under `chatgpt inu design`. `build/prepare-contact-assets.py` exports responsive WebP variants without recoloring or upscaling. Hero background is available at 3840 pixels; five named end images keep their original resolution. `src/contact-assets/` and its JSON manifest are deployable source. Eight other user-provided creatives are included in the contact gallery.

The hero uses the supplied room, listener, speaker, and device. The cans intrinsic to the people are connected with a responsive SVG path. Attachment coordinates live in `src/talk/contact.js`; actors and string share a single scene coordinate system. The wall lettering is intrinsic to the supplied background. All form, section, FAQ and navigation text stays HTML.

## Contact details

Office and phone numbers come from page 57 of `INU_Media_KHOONTA_Movie_PR_Proposal.pdf`: 311 Kuber Complex, Andheri West, Mumbai 400053; +91 91291 20707 / +91 88501 05379. The user approved `hello@inumedia.com` provisionally on 12 September 2026 and will confirm with the business later.

Vercel has no mail environment variables configured (checked 12 September 2026). The form therefore prepares a complete email draft and lets the visitor open it in their email app to send. Set `deliveryMode` to `api` in contact-content.json only after configuring `RESEND_API_KEY`, `CONTACT_TO`, and `CONTACT_FROM` in Vercel. API errors retain the brief and link to email. Never send a real test enquiry without authorization.

## Validation and cleanup

The task checklist is in `../WORK-TRACKER.md`. QA artifacts are in `qa/contact/` (ignored by Git). Legacy removal targets are explicitly recorded in `build/cleanup-legacy.ps1`. Deleted folders/files are recoverable from Windows Recycle Bin; Git history retains committed legacy sources. Do not restore alternate projects into the workspace.
