const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.join(__dirname,'../dist'),html=fs.readFileSync(path.join(root,'privacy.html'),'utf8');
const content=JSON.parse(fs.readFileSync(path.join(__dirname,'../src/privacy/content.json'),'utf8'));
assert(!/\{\{\w+\}\}/.test(html),'Unresolved privacy fields');
const data=JSON.parse(html.match(/<script type="application\/json" id="site-content">([\s\S]*?)<\/script>/)[1]);
assert.equal(data.page,'privacy');
assert.equal((html.match(/<article id="/g)||[]).length,content.sections.length);
assert.equal((html.match(/data-legal-link=/g)||[]).length,content.sections.length);
assert.equal((html.match(/<h1 /g)||[]).length,1);
/* The policy describes four cookie purposes; the panel must actually offer them. */
for(const category of ['essential','functional','analytics','marketing']){
 assert(html.includes(`data-category="${category}"`),`Consent panel is missing ${category}`);
 assert(html.includes(`>${category[0].toUpperCase()+category.slice(1)}</h3>`),`Panel copy is missing ${category}`);
}
assert(html.includes('class="cookie-switch is-on is-locked" data-category="essential"'),'Essential must stay locked on');
assert.equal((html.match(/data-consent-accept/g)||[]).length,2);
assert.equal((html.match(/data-consent-reject/g)||[]).length,3);
assert(html.includes('data-consent-save'),'Panel needs a save action');
/* Every page must carry the consent layer and offer a way back to it. */
for(const name of ['index.html','about.html','services.html','portfolio.html','lets-talk.html','privacy.html']){
 const page=fs.readFileSync(path.join(root,name),'utf8');
 assert(page.includes('class="cookie-bar"'),`${name} is missing the consent bar`);
 assert(page.includes('data-consent-open'),`${name} is missing the cookie settings link`);
 assert(page.includes('href="/privacy"'),`${name} must link to the privacy policy`);
 assert(page.includes('class="noise"'),`${name} is missing the film grain`);
 // lets-talk is a single cinematic scene; the rest carry the drifting field.
 if(name!=='lets-talk.html')assert(/class="[^"]*fluid-section/.test(page),`${name} is missing the fluid background field`);
}
const files=new Set();
for(const m of html.matchAll(/(?:src|href|data-src|data-sound-src)="([^"#]+)"/g)){
 if(/^(https?:|data:|mailto:)/.test(m[1]))continue;
 const url=m[1].split(/[?#]/)[0];files.add(url.startsWith('/')?(url==='/'?'index.html':url.slice(1)+'.html'):url);
}
for(const f of files)assert(fs.existsSync(path.join(root,f)),`Missing privacy asset or route: ${f}`);
console.log(`Verified privacy: ${content.sections.length} sections, 4 consent categories, consent layer present on 6 pages, ${files.size} assets/routes.`);
