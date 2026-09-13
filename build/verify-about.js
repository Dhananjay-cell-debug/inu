const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.join(__dirname,'../dist');
const html=fs.readFileSync(path.join(root,'about.html'),'utf8');
const css=fs.readFileSync(path.join(root,'about.css'),'utf8');

assert(!/\{\{\w+\}\}/.test(html),'Unresolved About placeholders');
const page0=JSON.parse(fs.readFileSync(path.join(__dirname,'../src/about/content.json'),'utf8'));

/* Every local file the page or its stylesheet names must exist in the build. */
const required=new Set();
for(const m of html.matchAll(/(?:src|href|data-src)="([^"#]+)"/g))if(!/^(https?:|mailto:|tel:|\/)/.test(m[1]))required.add(m[1].split('?')[0]);
for(const m of html.matchAll(/srcset="([^"]+)"/g))for(const candidate of m[1].split(','))required.add(candidate.trim().split(' ')[0]);
for(const m of css.replace(/url\(["']?data:[^)]*\)/g,'url()').matchAll(/url\(['"]?([^)'" ]+)/g))required.add(m[1]);
for(const file of required)assert(fs.existsSync(path.join(root,file.split('?')[0])),`Missing About asset: ${file}`);

/* The page is the shared shell, not a one-off: same nav, same atmosphere. */
const data=JSON.parse(html.match(/<script type="application\/json" id="site-content">([\s\S]*?)<\/script>/)[1]);
assert.equal(data.page,'about','About must identify itself to the shared experience');
assert.equal(data.navigation.length,4,'Four navigation items');
assert(data.navigation.some(n=>n.label==='About'&&n.href==='/about'),'About links to its own page');
assert(/<a href="\/about" aria-current="page">About<\/a>/.test(html),'About is the current page in the nav');
assert(html.includes('id="film-grain"')&&html.includes('id="film-burn"'),'Grain and burn overlays present');
assert(/data-sound-src="media\/burn-about-sound\.mp3\?v=/.test(html),'About has its own burn sound');
assert(/media\/burn-about\.webm\?v=/.test(html),'About has its own opening burn');
assert(html.includes('id="soundtrack"')&&html.includes('id="sound-toggle"'),'Shared soundtrack and its toggle');
assert(!html.includes('autoplay'),'Audio stays opt-in');
assert(html.includes('class="end-reveal"')&&html.includes('end-about-'),'Post-footer reveal uses the reserved About plate');

/* Structure the design depends on. */
assert(html.includes('class="character-reveal"'),'Shared hero scale hook must exist or experience.js throws');
assert(html.includes('<canvas class="embers"'),'Embers canvas present');
/* One continuous flow, not five stacked slides: every band below the hero
   lives inside .about-flow and opens on the same column. */
assert(/class="about-flow[ "]/.test(html),'The bands must sit inside one flow wrapper');
for(const section of ['about-hero','about-story','about-craft','about-process','about-founder','about-philosophy'])
  assert(html.includes(section),`Missing section ${section}`);
assert.equal((html.match(/class="about-band /g)||[]).length,5,'Five bands share the page grid');
assert.equal((html.match(/class="about-band-copy"/g)||[]).length,5,'Every band opens on the same column');
assert.equal((html.match(/class="about-plate /g)||[]).length,3,'Three taped plates: set photo, film strip, founder frame');
assert.equal((html.match(/<li style="--i:\d+">/g)||[]).length,5,'Five steps in the making chain');
assert.equal((html.match(/<li class="reveal" style="--i:\d+"><i aria-hidden="true">0\d<\/i><h3>/g)||[]).length,
  page0.craft.items.length+page0.philosophy.creed.length,'Six disciplines and three creed lines');
// The numbers row, the story note and the clapper were cut as filler.
assert(!html.includes('about-facts')&&!html.includes('hand--story')&&!html.includes('about-clapper'),
  'the trimmed About furniture must stay out');
assert.equal((html.match(/class="hand hand--/g)||[]).length,3,'Three hand-written notes: two in the hero, one on the founder');
assert(/<h1[^>]*class="about-title"/.test(html),'One h1, and it is the wordmark');
assert.equal((html.match(/<h1/g)||[]).length,1,'Exactly one h1');
assert.equal((html.match(/<h2 id="about-/g)||[]).length,5,'Five h2 movements under it');

/* Type this page introduces has to actually ship, fingerprinted. */
for(const face of ['INUSerif','INUHand'])assert(css.includes(`font-family:${face}`),`Missing @font-face ${face}`);
assert(/about-assets\/playfair\.[0-9a-f]{10}\.woff2/.test(css),'Serif must be fingerprinted');
assert(/about-assets\/hand\.[0-9a-f]{10}\.woff2/.test(css),'Marker hand must be fingerprinted');
assert(html.includes('rel="preload"')&&/playfair\.[0-9a-f]{10}\.woff2/.test(html),'Preload the serif');

/* Copy comes from content.json, not from the markup. */
const page=page0;
assert(html.includes(page.founder.name),'Founder name rendered');
assert(html.includes('Somewhere in between.'.toUpperCase())||html.includes('Somewhere in between.'),'Story heading rendered');
assert(html.includes(page.hero.tagline),'Hero tagline rendered');

assert(html.includes(page.founder.signature),'The founder signs off');
const escd=v=>String(v).replace(/&/g,'&amp;');
assert(html.includes(escd(page.craft.items[0].title)),'The disciplines index is rendered');
console.log('About verified: one flow of 5 bands on a shared grid, shared shell, own burn, reserved reveal, fingerprinted type, 3 plates, 6 disciplines, 5-step chain, 3 creed lines.');
