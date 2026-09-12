const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.join(__dirname,'../dist');
const html=fs.readFileSync(path.join(root,'about.html'),'utf8');
const css=fs.readFileSync(path.join(root,'about.css'),'utf8');

assert(!/\{\{\w+\}\}/.test(html),'Unresolved About placeholders');

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
for(const section of ['about-hero','about-story','about-founder','about-philosophy'])
  assert(html.includes(`class="${section}`)||html.includes(`about-page`)&&html.includes(section),`Missing section ${section}`);
assert.equal((html.match(/class="about-plate /g)||[]).length,3,'Three taped plates: set photo, film strip, founder frame');
assert.equal((html.match(/<li style="--i:\d+">/g)||[]).length,5,'Five steps in the making chain');
assert.equal((html.match(/class="hand hand--/g)||[]).length,4,'Four hand-written notes');
assert(/<h1[^>]*class="about-title"/.test(html),'One h1, and it is the wordmark');
assert.equal((html.match(/<h1/g)||[]).length,1,'Exactly one h1');
assert.equal((html.match(/<h2 id="about-/g)||[]).length,3,'Three h2 sections under it');

/* Type this page introduces has to actually ship, fingerprinted. */
for(const face of ['INUSerif','INUHand'])assert(css.includes(`font-family:${face}`),`Missing @font-face ${face}`);
assert(/about-assets\/playfair\.[0-9a-f]{10}\.woff2/.test(css),'Serif must be fingerprinted');
assert(/about-assets\/hand\.[0-9a-f]{10}\.woff2/.test(css),'Marker hand must be fingerprinted');
assert(html.includes('rel="preload"')&&/playfair\.[0-9a-f]{10}\.woff2/.test(html),'Preload the serif');

/* Copy comes from content.json, not from the markup. */
const page=JSON.parse(fs.readFileSync(path.join(__dirname,'../src/about/content.json'),'utf8'));
assert(html.includes(page.founder.name),'Founder name rendered');
assert(html.includes('Somewhere in between.'.toUpperCase())||html.includes('Somewhere in between.'),'Story heading rendered');
assert(html.includes(page.hero.tagline),'Hero tagline rendered');

console.log('About verified: shared shell, own burn, reserved reveal, fingerprinted type, 3 plates, 5-step chain.');
