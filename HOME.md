# INU Media home page

The reference-matched home page lives in `src/home/`. Run `npm run build` to copy it to `site/` for the existing preview server and `dist/` for hosting. Run `npm run dev` for the local preview at http://localhost:3200.

Only the home page is built by default. Existing pages remain intact. `npm run build:legacy` retains the earlier five-page build.

Art assets are cropped from the supplied home-page reference with `build/home-assets.py`; all navigation, service and project cards, body text, statistics, and controls are responsive HTML. The source reference is not needed to rebuild because the prepared assets are checked in. Large photographic art retains the resolution available in the supplied reference.

Mobile uses compact two-column service tiles and a horizontal portfolio. Navigation points to home-page sections. Service and portfolio buttons open accessible native dialogs. Contact opens the supplied INU Instagram profile; LinkedIn uses the founder profile from the local brand summary. No unconfirmed email or YouTube account is used.
