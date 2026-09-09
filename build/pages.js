/* Assemble the five pages from one shell so the nav, footer and overlay
   stack can never drift apart between them. */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const SITE = path.join(ROOT, 'site');

/* The only contact address anywhere in the build.
   NOTE: not yet confirmed by the client — every other detail on the site
   (address, both phone numbers, Instagram, LinkedIn) is sourced from the
   proposal decks or live profiles. Change it here and it changes everywhere. */
const EMAIL = 'hello@inumedia.agency';

const PAGES = [
  { slug: 'home',      file: 'index.html',     burn: 'e',
    title: 'INU Media — Brands. People. Stories. Beyond.',
    desc: 'A 360° creative, media and PR studio in Mumbai. Digital marketing, PR, VFX, branding and web.' },
  { slug: 'about',     file: 'about.html',     burn: 'a',
    title: 'About — INU Media',
    desc: 'A new-age company with a 360-degree approach. Creative thinkers, problem solvers, storytellers.' },
  { slug: 'services',  file: 'services.html',  burn: 'b',
    title: 'Services — INU Media',
    desc: 'Digital marketing, design, video and VFX, performance, social, PR, web and strategy.' },
  { slug: 'portfolio', file: 'portfolio.html', burn: 'c',
    title: 'Portfolio — INU Media',
    desc: 'Films, music, brands and campaigns we have helped build, grow and make unforgettable.' },
  { slug: 'contact',   file: 'contact.html',   burn: 'd',
    title: 'Contact — INU Media',
    desc: 'Great ideas deserve a conversation. Talk to INU Media, Andheri West, Mumbai.' }
];

const layout = fs.readFileSync(path.join(SRC, 'layout.html'), 'utf8');

// static assets that live in src and are copied verbatim
const copy = [
  ['css/inu.css', 'assets/css/inu.css'],
  ['js/inu.js', 'assets/js/inu.js']
];

fs.mkdirSync(path.join(SITE, 'assets', 'css'), { recursive: true });
fs.mkdirSync(path.join(SITE, 'assets', 'js'), { recursive: true });

for (const [from, to] of copy) {
  let text = fs.readFileSync(path.join(SRC, from), 'utf8');
  // the stylesheet imports fonts relative to src/ during authoring
  if (to.endsWith('.css')) text = text.replace('../assets/fonts/fonts.css', '../fonts/fonts.css');
  fs.writeFileSync(path.join(SITE, to), text);
}

for (const p of PAGES) {
  const body = fs.readFileSync(path.join(SRC, 'pages', p.file), 'utf8');
  let html = layout
    .replace(/\{\{title\}\}/g, p.title)
    .replace(/\{\{desc\}\}/g, p.desc)
    .replace(/\{\{page\}\}/g, p.slug)
    .replace(/\{\{burn\}\}/g, p.burn)
    .replace(/\{\{email\}\}/g, EMAIL)
    .replace(/\{\{body\}\}/g, body);

  for (const s of ['home', 'about', 'services', 'portfolio', 'contact']) {
    html = html.replace(new RegExp(`\\{\\{cur_${s}\\}\\}`, 'g'),
      s === p.slug ? ' aria-current="page"' : '');
  }
  html = html.replace(/\{\{email\}\}/g, EMAIL);

  fs.writeFileSync(path.join(SITE, p.file), html);
  console.log(`  ${p.file.padEnd(16)} ${(html.length / 1024).toFixed(0)} KB`);
}

const leftovers = [];
for (const p of PAGES) {
  const html = fs.readFileSync(path.join(SITE, p.file), 'utf8');
  const m = html.match(/\{\{[a-z_]+\}\}/g);
  if (m) leftovers.push(`${p.file}: ${[...new Set(m)].join(', ')}`);
}
if (leftovers.length) {
  console.error('\nUNFILLED PLACEHOLDERS:\n  ' + leftovers.join('\n  '));
  process.exit(1);
}
console.log('\nbuilt ' + PAGES.length + ' pages');
