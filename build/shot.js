/* Screenshot the preview so the work can actually be looked at.
   node build/shot.js <page> <width> [tag]
   Captures the full page in viewport-sized slices, after scrolling through it
   once so every scroll-triggered reveal has fired. */
const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer');

// Git Bash rewrites a bare "/about.html" into a Windows path, so take the
// last segment and normalise it back to a site-root path.
const raw = process.argv[2] || 'index.html';
const page_ = '/' + raw.replace(/\\/g, '/').split('/').filter(Boolean).pop().replace(/^index\.html$/, 'index.html');
const width = parseInt(process.argv[3] || '1440', 10);
const tag = process.argv[4] || 'shot';
const height = parseInt(process.argv[5] || '900', 10);
const OUT = path.join(__dirname, '..', 'qa');
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await puppeteer.launch({
    headless: 'shell',
    args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required', '--force-device-scale-factor=1']
  });
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 1 });

  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
  page.on('requestfailed', (r) => errors.push('404/FAIL: ' + r.url()));

  const url = 'http://localhost:3200' + page_;
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });

  // walk the whole page so reveals fire, then come back to the top
  const total = await page.evaluate(async () => {
    const h = () => document.documentElement.scrollHeight;
    for (let y = 0; y < h(); y += Math.round(innerHeight * 0.6)) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 160));
    }
    window.scrollTo(0, h());
    await new Promise((r) => setTimeout(r, 700));
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 700));
    return h();
  });

  // freeze the drifting overlays so slices line up
  await page.addStyleTag({
    content: `.grain,.grain--warm,.embers,.burn,.cursor,.cursor-ring{display:none!important}
              .boot{display:none!important}`
  });

  // The page cannot scroll past its own end, so the final slice would repeat
  // whatever the last screenful was. Capture it as a clipped remainder.
  const slices = Math.ceil(total / height);
  const name = tag.replace(/[^a-z0-9-]/gi, '_');
  const maxScroll = Math.max(0, total - height);
  for (let i = 0; i < slices; i++) {
    const want = i * height;
    const at = Math.min(want, maxScroll);
    await page.evaluate((y) => window.scrollTo(0, y), at);
    await new Promise((r) => setTimeout(r, 340));
    const overlap = want - at;                       // how much of this slice we already have
    const clip = overlap > 0
      ? { clip: { x: 0, y: overlap, width, height: Math.max(1, height - overlap) } }
      : {};
    await page.screenshot({
      path: path.join(OUT, `${name}-${width}-${String(i).padStart(2, '0')}.png`),
      ...clip
    });
  }

  console.log(`${page_} @${width}  height=${total}px  ${slices} slices`);
  if (errors.length) {
    console.log('--- console/network problems ---');
    [...new Set(errors)].slice(0, 25).forEach((e) => console.log('  ' + e));
  } else {
    console.log('no console errors, no failed requests');
  }
  await browser.close();
})();
