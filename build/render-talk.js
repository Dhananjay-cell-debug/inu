/* Builds the Let's talk page from its own content + template, alongside the home page.
   Images and fonts land in the shared, content-fingerprinted home-assets/ folder so a
   visitor moving between pages reuses the already-cached fonts. */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.join(__dirname, '..');
const src = path.join(root, 'src/talk');
const data = JSON.parse(fs.readFileSync(path.join(src, 'content.json'), 'utf8'));
const assets = JSON.parse(fs.readFileSync(path.join(src, 'assets.json'), 'utf8'));
// Artwork is page-local; the self-hosted fonts are shared with the home build.
const assetDirs = [path.join(src, 'assets'), path.join(root, 'src/home/assets')];
const resolve = name => {
  for (const dir of assetDirs) {
    const file = path.join(dir, name);
    if (fs.existsSync(file)) return file;
  }
  throw new Error(`Missing image or font ${name}`);
};

const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const image = (key, cls = '', sizes = '100vw', priority = false) => {
  const variants = assets[key];
  if (!variants) throw new Error(`Unknown artwork ${key}`);
  const chosen = variants[1] || variants[0];
  return `<img class="${cls}" src="${chosen.src}" srcset="${variants.map(v => `${v.src} ${v.width}w`).join(', ')}" sizes="${sizes}" width="${chosen.width}" height="${chosen.height}" alt="" ${priority ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;
};
const icon = (name, cls = '') => `<svg class="${cls}" aria-hidden="true"><use href="#icon-${escape(name)}"></use></svg>`;
const lines = list => list.map((text, i) => `<span class="line" style="--i:${i}">${escape(text)}</span>`).join('');
const words = list => list.map(word => `<span class="sign-word">${escape(word)}</span>`).join('');

const field = (spec, index) => {
  const id = `field-${spec.name}`;
  const control = spec.type === 'textarea'
    ? `<textarea id="${id}" name="${escape(spec.name)}" rows="4" ${spec.required ? 'required' : ''} data-label="${escape(spec.label)}" aria-describedby="${id}-error" placeholder=" "></textarea>`
    : `<input id="${id}" name="${escape(spec.name)}" type="${escape(spec.type)}" autocomplete="${escape(spec.autocomplete)}" ${spec.required ? 'required' : ''} data-label="${escape(spec.label)}" aria-describedby="${id}-error" placeholder=" ">`;
  return `<p class="field" style="--i:${index}">${control}<label for="${id}">${escape(spec.label)}</label><span class="field-error" id="${id}-error"></span></p>`;
};

const reachItem = (item, index) => {
  const body = `${icon(item.icon)}<strong>${escape(item.title)}</strong><span>${item.lines.map(escape).join('<br>')}</span>`;
  const external = item.href.startsWith('http');
  const inner = item.href
    ? `<a class="reach-body" href="${escape(item.href)}"${external ? ' target="_blank" rel="noopener noreferrer"' : ''}>${body}</a>`
    : `<div class="reach-body">${body}</div>`;
  return `<li class="reach-item" style="--i:${index}">${inner}</li>`;
};

const render = {
  title: escape(data.brand.title), description: escape(data.brand.description),
  brand: escape(data.brand.name), suffix: escape(data.brand.suffix),
  nav: data.navigation.map(n => `<a href="${escape(n.href)}"${n.current ? ' aria-current="page"' : ''}>${escape(n.label)}</a>`).join(''),
  mobileNav: data.navigation.map(n => `<a href="${escape(n.href)}"${n.current ? ' aria-current="page"' : ''}>${escape(n.label)}<span aria-hidden="true">↗</span></a>`).join(''),
  heroRoom: image('talk-room', 'layer', '100vw', true),
  heroTree: image('talk-tree', '', '(max-width:700px) 32vw, 14vw'),
  heroSeated: image('talk-seated', '', '(max-width:700px) 80vw, 40vw', true),
  heroEyebrow: escape(data.hero.eyebrow),
  heroHeading: lines(data.hero.heading),
  heroTagline: escape(data.hero.tagline),
  tableNote: escape(data.hero.tableNote),
  heroSign: words(data.hero.sign),
  wallPlate: image('talk-wall', 'layer', '100vw'),
  wallFigure: image('talk-figure', '', '(max-width:700px) 58vw, 33vw'),
  messageNote: words(data.message.note),
  messageHeading: escape(data.message.heading),
  messageDescription: escape(data.message.description),
  fields: data.message.fields.map(field).join(''),
  messageButton: escape(data.message.button),
  loungePlate: image('talk-lounge', 'layer', '100vw'),
  loungeChair: image('talk-chair', '', '(max-width:700px) 35vw, 13vw'),
  loungeChairFar: image('talk-chair', '', '10vw'),
  loungeTable: image('talk-table', '', '(max-width:700px) 27vw, 11vw'),
  loungeTree: image('talk-tree', '', '(max-width:700px) 32vw, 12vw'),
  reachHeading: lines(data.reach.heading),
  reachItems: data.reach.items.map(reachItem).join(''),
  floorNote: data.reach.floorNote.map(escape).join('<br>'),
  reachSign: words(data.reach.sign),
  sunsetPlate: image('talk-sunset', 'layer', '100vw'),
  trioLeft: image('talk-back-left', '', '(max-width:700px) 20vw, 13vw'),
  trioCentre: image('talk-back-center', '', '(max-width:700px) 26vw, 17vw'),
  trioRight: image('talk-back-right', '', '(max-width:700px) 22vw, 14vw'),
  nextEyebrow: escape(data.next.eyebrow),
  nextHeading: escape(data.next.heading),
  nextLines: data.next.lines.map(escape).join('<br>'),
  nextButton: escape(data.next.button),
  footerBrand: escape(data.footer.brand),
  footerWords: data.footer.words.map(w => `<span>${escape(w)}</span>`).join(''),
  footerNote: data.footer.note.map(escape).join('<br>'),
  socials: data.footer.socials.map(s => `<a href="${escape(s.href)}" aria-label="${escape(s.label)}"${s.href.startsWith('https') ? ' target="_blank" rel="noopener noreferrer"' : ''}>${icon(s.icon)}</a>`).join(''),
  content: JSON.stringify(data).replace(/</g, '\\u003c')
};

let html = fs.readFileSync(path.join(src, 'template.html'), 'utf8').replace(/\{\{(\w+)\}\}/g, (_, key) => {
  if (!(key in render)) throw new Error(`Unresolved template field ${key}`);
  return render[key];
});
let css = fs.readFileSync(path.join(src, 'talk.css'), 'utf8') + '\n' + fs.readFileSync(path.join(src, 'responsive.css'), 'utf8');
const script = fs.readFileSync(path.join(src, 'experience.js'), 'utf8');

const usedFiles = new Set();
for (const match of html.matchAll(/home-assets\/([\w.-]+)/g)) usedFiles.add(match[1]);
for (const match of css.matchAll(/home-assets\/([\w.-]+)/g)) usedFiles.add(match[1]);

const fingerprints = new Map();
for (const name of usedFiles) {
  const digest = crypto.createHash('sha256').update(fs.readFileSync(resolve(name))).digest('hex').slice(0, 10);
  const extension = path.extname(name), hashed = name.slice(0, -extension.length) + '.' + digest + extension;
  fingerprints.set(name, hashed);
  html = html.split(`home-assets/${name}`).join(`home-assets/${hashed}`);
  css = css.split(`home-assets/${name}`).join(`home-assets/${hashed}`);
}

const mediaDir = path.join(root, 'src/home/media');
const mediaDigest = crypto.createHash('sha256');
for (const name of fs.readdirSync(mediaDir)) mediaDigest.update(fs.readFileSync(path.join(mediaDir, name)));
const mediaRevision = mediaDigest.digest('hex').slice(0, 10);
html = html.replace(/media\/([\w-]+\.(?:mp3|webm))/g, `media/$1?v=${mediaRevision}`);
const finalScript = script.replace("'media/burn-talk-sound.mp3'", `'media/burn-talk-sound.mp3?v=${mediaRevision}'`);

const revision = crypto.createHash('sha256').update(html + css + finalScript).digest('hex').slice(0, 10);
html = html.replace('talk.css"', `talk.css?v=${revision}"`).replace('talk.js"', `talk.js?v=${revision}"`);

for (const destination of ['site', 'dist']) {
  const dest = path.join(root, destination);
  fs.mkdirSync(dest, { recursive: true });
  fs.writeFileSync(path.join(dest, 'lets-talk.html'), html);
  fs.writeFileSync(path.join(dest, 'talk.css'), css);
  fs.writeFileSync(path.join(dest, 'talk.js'), finalScript);
  fs.copyFileSync(path.join(root, 'src/home/favicon.svg'), path.join(dest, 'favicon.svg'));
  fs.mkdirSync(path.join(dest, 'home-assets'), { recursive: true });
  for (const name of usedFiles) fs.copyFileSync(resolve(name), path.join(dest, 'home-assets', fingerprints.get(name)));
  // Local-only harness: Chrome will not resize a window below its minimum width,
  // so phone widths are reviewed through same-origin frames instead.
  if (destination === 'site') fs.copyFileSync(path.join(__dirname, 'qa-frames.html'), path.join(dest, 'qa-frames.html'));
  fs.mkdirSync(path.join(dest, 'vendor'), { recursive: true });
  for (const name of ['lenis.min.js', 'lenis.css']) fs.copyFileSync(path.join(root, 'node_modules/lenis/dist', name), path.join(dest, 'vendor', name));
  fs.cpSync(mediaDir, path.join(dest, 'media'), { recursive: true });
}
console.log(`Built INU Let’s talk: editable content + ${usedFiles.size} assets. Revision ${revision}.`);
