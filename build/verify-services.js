const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.join(__dirname,'../dist'),html=fs.readFileSync(path.join(root,'services.html'),'utf8');
assert(!/\{\{\w+\}\}/.test(html),'Unresolved services template fields');
const data=JSON.parse(html.match(/<script type="application\/json" id="site-content">([\s\S]*?)<\/script>/)[1]);
assert.equal(data.services.items.length,8);assert.equal((html.match(/class="offer-card reveal"/g)||[]).length,8);
assert.equal((html.match(/class="process-number"/g)||[]).length,5);
assert.equal((html.match(/<h1 /g)||[]).length,1);
const nav=html.match(/<nav class="desktop-nav"[\s\S]*?<\/nav>/)[0];
assert(nav.includes('href="/services" aria-current="page"'),'Services navigation stays current');
assert.equal((nav.match(/<a /g)||[]).length,4);
const files=new Set();
for(const m of html.matchAll(/(?:src|href|data-src|data-sound-src)="([^"#]+)"/g)){
 if(/^(https?:|data:|mailto:)/.test(m[1]))continue;
 const url=m[1].split(/[?#]/)[0];
 if(url.startsWith('/'))files.add(url==='/'?'index.html':url.slice(1)+'.html');else files.add(url);
}
for(const m of html.matchAll(/srcset="([^"]+)"/g))for(const v of m[1].split(','))files.add(v.trim().split(' ')[0]);
for(const s of data.services.items){assert.equal(s.offerings.length,4);assert(html.includes(`href="/services/${s.id}"`),`Card links to /services/${s.id}`);assert(html.includes(s.title.replace('&','&amp;')));}
for(const f of files)assert(fs.existsSync(path.join(root,f)),`Missing services asset/route ${f}`);
for(const f of ['burn-services.webm','burn-services.mp4','burn-services-sound.mp3'])assert(fs.statSync(path.join(root,'media',f)).size>1000);
assert(!html.includes('autoplay'),'Audio remains opt-in');
/* Each service has its own page, reached from its card, and every page's
   assets resolve from one level down. */
for(const s of data.services.items){
 const page=fs.readFileSync(path.join(root,'services',s.id+'.html'),'utf8');
 assert(!/{{w+}}/.test(page),'Unresolved field on /services/'+s.id);
 assert.equal((page.match(/<h1 /g)||[]).length,1);
 assert.equal((page.match(/class="sd-row reveal"/g)||[]).length,s.offerings.length);
 for(const m of page.matchAll(/s(?:src|href|data-src|data-sound-src)="([^"#]+)"/g)){if(/^(https?:|data:|mailto:)/.test(m[1]))continue;assert(m[1].startsWith('/'),`Relative URL ${m[1]} on /services/${s.id}`);const u=m[1].split(/[?#]/)[0];const file=u==='/'?'index.html':path.extname(u)?u.slice(1):u.slice(1)+'.html';assert(fs.existsSync(path.join(root,file)),`Missing ${u} on /services/${s.id}`);}
 for(const m of page.matchAll(/srcset="([^"]+)"/g))for(const v of m[1].split(','))assert(fs.existsSync(path.join(root,v.trim().split(' ')[0].slice(1))));
}
const catalog=JSON.parse(fs.readFileSync(path.join(root,'catalog.json'),'utf8'));
assert.equal(catalog.services.length,8);assert(catalog.detailShell.includes('{{main}}'));
assert(html.includes('href="/lets-talk"'),'Closing CTA uses the real contact page');
const home=fs.readFileSync(path.join(root,'index.html'),'utf8'),talk=fs.readFileSync(path.join(root,'lets-talk.html'),'utf8');
assert(home.includes('href="/services"')&&talk.includes('href="/services"'),'Existing pages link to Services');
console.log(`Verified services: ${files.size} assets/routes, eight services and details, five process steps, shared navigation and media.`);
