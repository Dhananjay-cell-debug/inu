const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const root = path.join(__dirname, '..');
const src = path.join(root, 'src/home');
const data = JSON.parse(fs.readFileSync(path.join(src, 'content.json'), 'utf8'));
const assets = JSON.parse(fs.readFileSync(path.join(src, 'assets.json'), 'utf8'));
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const image = (key, cls='', sizes='100vw', priority=false) => {
  const variants=assets[key];
  if(!variants) throw new Error(`Unknown artwork ${key}`);
  const chosen=variants[1]||variants[0];
  return `<img class="${cls}" src="${chosen.src}" srcset="${variants.map(v=>`${v.src} ${v.width}w`).join(', ')}" sizes="${sizes}" width="${chosen.width}" height="${chosen.height}" alt="" ${priority?'fetchpriority="high"':'loading="lazy"'} decoding="async">`;
};
const icon=(name,cls='')=>`<svg class="${cls}" aria-hidden="true"><use href="#icon-${escape(name)}"></use></svg>`;
const arrow='<span class="button-arrow" aria-hidden="true">↗</span>';
const heading=lines=>lines.map(l=>`<span class="heading-line">${l.accent?`<em>${escape(l.text)}</em>`:escape(l.text)}${l.inlineAccent?`<em>${escape(l.inlineAccent)}</em>`:''}</span>`).join('');
const render={
  title:escape(data.brand.title), description:escape(data.brand.description),
  brand:escape(data.brand.name), suffix:escape(data.brand.suffix), talkLabel:escape(data.talk.label),
  nav:data.navigation.map((n,i)=>`<a href="${escape(n.href)}" ${i===0?'aria-current="page"':''}>${escape(n.label)}</a>`).join(''),
  mobileNav:[...data.navigation,{label:data.talk.label,href:data.talk.href}].map(n=>`<a href="${escape(n.href)}">${escape(n.label)}<span aria-hidden="true">↗</span></a>`).join(''),
  heroBackground:image('hero-room','hero-room layer-image','100vw',true),
  heroPerson:image('hero-person','hero-person layer-image','(max-width:700px) 70vw, 42vw',true),
  heroDesk:image('hero-desk','hero-desk layer-image','100vw',true),
  heroWords:data.hero.words.map((w,i)=>`<span class="hero-word word-${i+1}">${escape(w)}</span>`).join(''),
  heroRail:data.hero.rail.map(escape).join('<br>'), scrollLabel:escape(data.hero.scrollLabel),
  belief:`<p class="eyebrow">${escape(data.belief.eyebrow)}</p><h2>${escape(data.belief.heading)}<br>${escape(data.belief.prefix)} <em>${escape(data.belief.accent)}</em></h2><p class="belief-copy">${escape(data.belief.description)}</p><blockquote>“${escape(data.belief.quote)}”</blockquote>`,
  clientLabel:`${escape(data.clients.eyebrow)}<br><span>${escape(data.clients.label)}</span>`,
  clientLogos:data.clients.items.map(c=>`<img src="home-assets/${escape(c.image)}" alt="${escape(c.name)}" width="90" height="40" loading="lazy">`).join(''),
  clientMore:escape(data.clients.more),
  serviceEyebrow:escape(data.services.eyebrow),serviceHeading:heading(data.services.heading),serviceDescription:escape(data.services.description),serviceButton:escape(data.services.button),
  serviceCards:data.services.items.map((s,i)=>`<button class="service-card reveal" data-service="${i}" style="--stagger:${i%3}"><span class="card-number">0${i+1}</span><span class="service-art">${image('service-'+s.image,'','(max-width:700px) 82px, (max-width:1100px) 25vw, 16vw')}</span><span class="card-copy"><strong>${s.lines.map(escape).join('<br>')}</strong><span>${escape(s.tagline)}</span></span><span class="service-arrow" aria-hidden="true">↗</span></button>`).join(''),
  portfolioEyebrow:escape(data.portfolio.eyebrow),portfolioHeading:heading(data.portfolio.heading),portfolioDescription:escape(data.portfolio.description),portfolioButton:escape(data.portfolio.button),
  portfolioArt:image('film-scene','film-art layer-image','100vw'),
  workCards:data.portfolio.items.map((p,i)=>`<button class="work-card" data-work="${i}"><span class="work-image"><img src="home-assets/${escape(p.image)}" width="158" height="107" loading="lazy" alt="${escape(p.title)}"><span class="view-project" aria-hidden="true">View project ↗</span></span><span class="work-caption"><strong>${escape(p.title)}</strong><span>${escape(p.category)}${arrow}</span></span></button>`).join(''),
  stats:data.stats.map(s=>`<div class="stat reveal ${s.icon==='infinity'?'infinity-stat':''}">${icon(s.icon)}<p>${s.value?`<strong>${escape(s.value)}</strong>`:''}<span>${s.label.map(escape).join('<br>')}</span></p></div>`).join(''),
  contactArt:image('sunset-room','sunset-room layer-image','100vw'),contactPerson:image('closing-person','closing-person layer-image','(max-width:700px) 50vw, 25vw'),
  contactEyebrow:escape(data.contact.eyebrow),contactHeading:heading(data.contact.heading),contactDescription:escape(data.contact.description),contactNote:data.contact.wallNote.map(escape).join('<br>'),
  contactHref:escape(data.talk.href),footerBrand:escape(data.footer.brand),footerWords:data.footer.words.map(w=>`<span>${escape(w)}</span>`).join(''),footerNote:data.footer.note.map(escape).join('<br>'),
  socials:data.footer.socials.map(s=>`<a href="${escape(s.href)}" aria-label="${escape(s.label)}" ${s.href.startsWith('https')?'target="_blank" rel="noopener noreferrer"':''}>${icon(s.icon)}</a>`).join(''),
  musicCreditHref:escape(data.music.source),musicCredit:escape(data.music.credit),
  content:JSON.stringify(data).replace(/</g,'\\u003c')
};
let html=fs.readFileSync(path.join(src,'template.html'),'utf8').replace(/\{\{(\w+)\}\}/g,(_,key)=>{
 if(!(key in render)) throw new Error(`Unresolved template field ${key}`);
 return render[key];
});
const usedFiles=new Set();
for(const match of html.matchAll(/home-assets\/([\w.-]+)/g)) usedFiles.add(match[1]);
for(const p of data.portfolio.items)usedFiles.add(p.image);
let css=fs.readFileSync(path.join(src,'cinematic.css'),'utf8')+'\n'+fs.readFileSync(path.join(src,'responsive.css'),'utf8');
for(const match of css.matchAll(/home-assets\/([\w.-]+)/g))usedFiles.add(match[1]);
for(const name of usedFiles)if(!fs.existsSync(path.join(src,'assets',name)))throw new Error(`Missing image or font ${name}`);
let script=fs.readFileSync(path.join(src,'experience.js'),'utf8');
const fingerprints=new Map();
for(const name of usedFiles){
 const digest=crypto.createHash('sha256').update(fs.readFileSync(path.join(src,'assets',name))).digest('hex').slice(0,10);
 const extension=path.extname(name),hashed=name.slice(0,-extension.length)+'.'+digest+extension;
 fingerprints.set(name,hashed);
 html=html.split(`home-assets/${name}`).join(`home-assets/${hashed}`).split(`"image":"${name}"`).join(`"image":"${hashed}"`);
 css=css.split(`home-assets/${name}`).join(`home-assets/${hashed}`);
}
const mediaDigest=crypto.createHash('sha256');
for(const name of fs.readdirSync(path.join(src,'media')))mediaDigest.update(fs.readFileSync(path.join(src,'media',name)));
const mediaRevision=mediaDigest.digest('hex').slice(0,10);
html=html.replace(/media\/([\w-]+\.(?:mp3|webm))/g,`media/$1?v=${mediaRevision}`);
script=script.replace('media/burn-sound.mp3',`media/burn-sound.mp3?v=${mediaRevision}`);
const revision=crypto.createHash('sha256').update(html+css+script).digest('hex').slice(0,10);
html=html.replace('home.css"',`home.css?v=${revision}"`).replace('home.js"',`home.js?v=${revision}"`);
for(const destination of ['site','dist']){
 const dest=path.join(root,destination);fs.mkdirSync(dest,{recursive:true});
 fs.writeFileSync(path.join(dest,'index.html'),html);
 fs.writeFileSync(path.join(dest,'home.css'),css);fs.writeFileSync(path.join(dest,'home.js'),script);
 fs.copyFileSync(path.join(src,'favicon.svg'),path.join(dest,'favicon.svg'));
 fs.mkdirSync(path.join(dest,'home-assets'),{recursive:true});
 for(const name of usedFiles)fs.copyFileSync(path.join(src,'assets',name),path.join(dest,'home-assets',fingerprints.get(name)));
 fs.mkdirSync(path.join(dest,'vendor'),{recursive:true});
 for(const name of ['lenis.min.js','lenis.css'])fs.copyFileSync(path.join(root,'node_modules/lenis/dist',name),path.join(dest,'vendor',name));
 fs.cpSync(path.join(src,'media'),path.join(dest,'media'),{recursive:true});
}
console.log(`Built INU home: editable content + ${usedFiles.size} assets. Revision ${revision}.`);
