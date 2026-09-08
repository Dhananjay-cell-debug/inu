const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.join(__dirname,'../dist');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
assert(!/\{\{\w+\}\}/.test(html),'Unresolved content placeholders');
const required=new Set();
const routes=new Set();
for(const m of html.matchAll(/(?:src|href|data-src)="([^"#]+)"/g)){
 if(/^(https?:|data:|mailto:)/.test(m[1]))continue;
 // cleanUrls routes such as /lets-talk resolve to a sibling .html page, not a file on disk.
 if(m[1].startsWith('/'))routes.add(m[1]);else required.add(m[1].split('?')[0]);
}
for(const m of html.matchAll(/srcset="([^"]+)"/g))for(const candidate of m[1].split(','))required.add(candidate.trim().split(' ')[0]);
const css=fs.readFileSync(path.join(root,'home.css'),'utf8');
for(const m of css.matchAll(/url\(['"]?([^)'" ]+)/g))required.add(m[1]);
for(const file of required)assert(fs.existsSync(path.join(root,file)),`Missing asset: ${file}`);
for(const route of routes){const page=route==='/'?'index.html':route.replace(/^\//,'')+'.html';assert(fs.existsSync(path.join(root,page)),`Broken route ${route} (expected ${page})`);}
const json=JSON.parse(html.match(/<script type="application\/json" id="site-content">([\s\S]*?)<\/script>/)[1]);
for(const work of json.portfolio.items)assert(fs.existsSync(path.join(root,'home-assets',work.image)),`Missing dialog image ${work.image}`);
assert.equal((html.match(/class="service-card reveal"/g)||[]).length,json.services.items.length);
assert.equal((html.match(/class="work-card"/g)||[]).length,json.portfolio.items.length);
assert.equal(json.navigation.length+1,5,'Navigation must have four links and Let’s talk');
assert(!json.navigation.some(n=>n.label==='Contact'));
assert(!html.includes('autoplay'),'Audio must be opt-in');
for(const media of ['score.mp3','burn-sound.mp3','grain.webm','grain.mp4','burn-entry.webm','burn-entry.mp4'])assert(fs.statSync(path.join(root,'media',media)).size>1000);
assert(css.includes('prefers-reduced-motion'));
console.log(`Verified ${required.size} referenced files, editable content, dialogs, five navigation items, and cinematic media.`);
