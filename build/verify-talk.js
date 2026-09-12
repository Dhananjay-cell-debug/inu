const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.join(__dirname,'../dist');
const html=fs.readFileSync(path.join(root,'lets-talk.html'),'utf8');
assert(!/\{\{\w+\}\}/.test(html),'Unresolved content placeholders');
const required=new Set();
for(const m of html.matchAll(/(?:src|href|data-src)="([^"#]+)"/g))if(!/^(https?:|mailto:|tel:|\/)/.test(m[1]))required.add(m[1].split('?')[0]);
for(const m of html.matchAll(/srcset="([^"]+)"/g))for(const candidate of m[1].split(','))required.add(candidate.trim().split(' ')[0]);
// Inline data: URIs (the grain texture, the social masks) have no file on disk,
// and their own payload contains url(#id) references, so drop them wholesale.
const css=fs.readFileSync(path.join(root,'contact.css'),'utf8').replace(/url\(["']?data:[^)]*\)/g,'url()');
for(const m of css.matchAll(/url\(['"]?([^)'" ]+)/g))required.add(m[1]);
for(const file of required)assert(fs.existsSync(path.join(root,file.split('?')[0])),`Missing asset: ${file}`);

const json=JSON.parse(html.match(/<script type="application\/json" id="page-content">([\s\S]*?)<\/script>/)[1]);
assert.equal(json.navigation.length,5,'Navigation must have five items');
assert(!json.navigation.some(n=>n.label==='Contact'),'Contact was renamed to Let’s talk');
assert(json.navigation.some(n=>n.current),'The current page must be marked in the navigation');
assert.equal((html.match(/class="field(?: field-message)?"/g)||[]).length,5,'Five visible enquiry fields');
assert.equal((html.match(/class="direct-card reveal"/g)||[]).length,4,'Four direct contact cards');
assert.equal((html.match(/class="faq-item reveal"/g)||[]).length,5,'Five accessible native FAQs');
assert.equal((html.match(/class="creative-frame"/g)||[]).length,8,'Eight selected creative images');
assert(html.includes('conversation-wire')&&html.includes('scene-listener')&&html.includes('scene-speaker'),'Layered hero with anchored connection');
assert(html.includes('311 Kuber Complex')&&!html.includes('Singapore'),'Use verified address');
assert(html.includes('name="brand"')&&html.includes('name="company"'),'Brand field must not collide with spam honeypot');
assert.equal(fs.readFileSync(path.join(root,'contact.html'),'utf8'),html,'Contact alias must match Lets talk');
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
for(const name of ['index','services','portfolio','lets-talk','contact','privacy']){
 const page=fs.readFileSync(path.join(root,name+'.html'),'utf8');
 assert.equal((page.match(/class="end-reveal"/g)||[]).length,1,`One ending for ${name}`);
 assert(page.indexOf('class="end-reveal"')>page.indexOf('</footer>'),`Ending is AFTER footer on ${name}`);
}
console.log(`Verified contact: ${required.size} referenced files, 5 fields, 4 contact cards, 5 FAQs, 8 creatives and all post-footer reveals.`);
