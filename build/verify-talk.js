const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.join(__dirname,'../dist');
const html=fs.readFileSync(path.join(root,'lets-talk.html'),'utf8');
assert(!/\{\{\w+\}\}/.test(html),'Unresolved content placeholders');
const required=new Set();
for(const m of html.matchAll(/(?:src|href|data-src)="([^"#]+)"/g))if(!/^(https?:|mailto:|\/)/.test(m[1]))required.add(m[1].split('?')[0]);
for(const m of html.matchAll(/srcset="([^"]+)"/g))for(const candidate of m[1].split(','))required.add(candidate.trim().split(' ')[0]);
const css=fs.readFileSync(path.join(root,'talk.css'),'utf8');
for(const m of css.matchAll(/url\(['"]?([^)'" ]+)/g))required.add(m[1]);
for(const file of required)assert(fs.existsSync(path.join(root,file.split('?')[0])),`Missing asset: ${file}`);

const json=JSON.parse(html.match(/<script type="application\/json" id="page-content">([\s\S]*?)<\/script>/)[1]);
assert.equal(json.navigation.length,5,'Navigation must have five items');
assert(!json.navigation.some(n=>n.label==='Contact'),'Contact was renamed to Let’s talk');
assert(json.navigation.some(n=>n.current),'The current page must be marked in the navigation');
assert.equal((html.match(/class="field"/g)||[]).length,json.message.fields.length,'Every configured field is rendered');
assert.equal((html.match(/class="reach-item"/g)||[]).length,json.reach.items.length);
assert((html.match(/class="figure /g)||[]).length===3,'The closing scene keeps its three figures');
assert(html.includes('id="message-form"')&&html.includes('type="submit"'),'The form must be a real submitting form');
assert(html.includes('name="company"'),'Spam honeypot present');
assert(!html.includes('autoplay'),'Audio must be opt-in');
for(const media of ['burn-talk.webm','burn-talk.mp4','burn-talk-sound.mp3','grain.webm','score.mp3'])
  assert(fs.statSync(path.join(root,'media',media)).size>1000,`Missing media ${media}`);
assert(css.includes('prefers-reduced-motion'));
assert(css.includes('@media(max-width:700px)')||css.includes('@media (max-width:700px)'),'Phone layout present');
// The home page must now point at the real page rather than the old anchor.
const home=fs.readFileSync(path.join(root,'index.html'),'utf8');
assert(home.includes('href="/lets-talk"'),'Home page links to the Let’s talk page');
console.log(`Verified Let’s talk: ${required.size} referenced files, ${json.message.fields.length} form fields, ${json.reach.items.length} contact routes, five navigation items.`);
