const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.join(__dirname,'../dist'),html=fs.readFileSync(path.join(root,'portfolio.html'),'utf8');
assert(!/\{\{\w+\}\}/.test(html),'Unresolved portfolio fields');
const data=JSON.parse(html.match(/<script type="application\/json" id="site-content">([\s\S]*?)<\/script>/)[1]);
assert.equal(data.page,'portfolio');
const content=JSON.parse(fs.readFileSync(path.join(__dirname,'../src/portfolio/content.json'),'utf8'));
assert.equal(data.portfolio.items.length,content.projects.length);
// Every project must carry its own picture: repeated art across the rails was
// the whole reason this page looked thin.
const art=new Set(data.portfolio.items.map(p=>p.art));
assert.equal(art.size,content.projects.length,`${content.projects.length-art.size} projects share artwork`);
const cards=(html.match(/class="folio-card reveal lightning"/g)||[]).length;
assert.equal((html.match(/class="folio-logo reveal"/g)||[]).length,12);
assert.equal((html.match(/data-chapter-link=/g)||[]).length,content.chapters.length);
assert.equal((html.match(/class="studio-row content-chapter"/g)||[]).length,content.chapters.length);
// Every chapter needs a drag rail, and every project needs a chapter to live in.
assert.equal((html.match(/data-drag-rail/g)||[]).length,content.chapters.length);
const placed=content.chapters.reduce((n,c)=>n+content.projects.filter(p=>p.tags.some(t=>c.tags.includes(t))).length,0);
assert.equal(cards,placed,`Rendered ${cards} cards but chapters cover ${placed}`);
for(const project of content.projects)assert(content.chapters.some(c=>project.tags.some(t=>c.tags.includes(t))),`${project.id} belongs to no chapter`);
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
console.log(`Verified portfolio: ${files.size} assets/routes, ${content.projects.length} project details, ${content.chapters.length} chapters holding ${cards} cards, 12 logos, navigation and media.`);
