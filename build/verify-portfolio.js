const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.join(__dirname,'../dist'),html=fs.readFileSync(path.join(root,'portfolio.html'),'utf8');
assert(!/\{\{\w+\}\}/.test(html),'Unresolved portfolio fields');
const data=JSON.parse(html.match(/<script type="application\/json" id="site-content">([\s\S]*?)<\/script>/)[1]);
assert.equal(data.page,'portfolio');assert.equal(data.portfolio.items.length,10);
assert.equal((html.match(/class="folio-card reveal"/g)||[]).length,10);
assert.equal((html.match(/class="folio-logo reveal"/g)||[]).length,12);
assert.equal((html.match(/data-filter=/g)||[]).length,8);
assert.equal((html.match(/<h1 /g)||[]).length,1);
const nav=html.match(/<nav class="desktop-nav"[\s\S]*?<\/nav>/)[0];
assert(nav.includes('href="/portfolio" aria-current="page"'));assert.equal((nav.match(/<a /g)||[]).length,4);
const files=new Set();
for(const m of html.matchAll(/(?:src|href|data-src|data-sound-src)="([^"#]+)"/g)){
 if(/^(https?:|data:|mailto:)/.test(m[1]))continue;
 const url=m[1].split(/[?#]/)[0];files.add(url.startsWith('/')?(url==='/'?'index.html':url.slice(1)+'.html'):url);
}
for(const m of html.matchAll(/srcset="([^"]+)"/g))for(const v of m[1].split(','))files.add(v.trim().split(' ')[0]);
for(const project of data.portfolio.items){files.add(project.art);assert(project.tags.length>0);}
for(const f of files)assert(fs.existsSync(path.join(root,f)),`Missing portfolio asset or route: ${f}`);
for(const name of ['burn-portfolio.webm','burn-portfolio.mp4','burn-portfolio-sound.mp3'])assert(fs.statSync(path.join(root,'media',name)).size>1000);
assert(!html.includes('autoplay'));assert(html.includes('id="sound-toggle"'));assert(html.includes('id="detail-dialog"'));
for(const name of ['index.html','services.html','lets-talk.html'])assert(fs.readFileSync(path.join(root,name),'utf8').includes('href="/portfolio"'),`${name} must link to the portfolio`);
console.log(`Verified portfolio: ${files.size} assets/routes, 10 project details, 8 categories, 12 logos, navigation and media.`);
