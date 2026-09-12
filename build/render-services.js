/* Reuse the built home shell, its fingerprinted fonts and the shared experience. */
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=path.join(__dirname,'..'),src=path.join(root,'src/services');
const page=JSON.parse(fs.readFileSync(path.join(src,'content.json'),'utf8'));
const assets=JSON.parse(fs.readFileSync(path.join(src,'assets.json'),'utf8'));
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const join=items=>items.map(esc).join('<br> ');
const image=(key,cls='',sizes='100vw',priority=false)=>{
 const variants=assets[key];if(!variants)throw Error(`Unknown services asset ${key}`);
 const chosen=variants[1]||variants[0];
 return `<img class="layer-image ${cls}" src="${chosen.src}" srcset="${variants.map(v=>`${v.src} ${v.width}w`).join(', ')}" sizes="${sizes}" width="${chosen.width}" height="${chosen.height}" alt="" ${priority?'fetchpriority="high"':'loading="lazy"'} decoding="async">`;
};
let html=fs.readFileSync(path.join(root,'dist/index.html'),'utf8');
const shared=JSON.parse(html.match(/<script type="application\/json" id="site-content">([\s\S]*?)<\/script>/)[1]);
const navigation=[{label:'Home',href:'/'},{label:'About',href:'/about'},{label:'Services',href:'/services'},{label:'Portfolio',href:'/portfolio'}];
const data={...shared,services:page.services,navigation,page:'services'};
data.services.items=data.services.items.map(s=>({...s,art:assets['card-'+s.image].at(-1).src}));
const p=page;
const fields={
 heroRoom:image('hero-room','','100vw',true),heroPerson:image('hero-person','hero-person','(max-width:700px) 53vw, 30vw',true),heroDesk:image('hero-desk','','(max-width:700px) 72vw, 43vw'),heroChair:image('chair','','(max-width:700px) 50vw, 31vw'),heroPlant:image('plant','','(max-width:700px) 29vw, 18vw'),heroLamp:image('lamp','','10vw'),
 heroTabletop:image('foreground-table','','100vw'),heroEyebrow:esc(p.hero.eyebrow),heroHeading:esc(p.hero.heading),heroSecond:esc(p.hero.secondLine),heroAccent:esc(p.hero.accent),heroDescription:esc(p.hero.description),heroWall:join(p.hero.wallWords),heroPrinciples:p.hero.principles.map(esc).join('<i aria-hidden="true">×</i>'),
 offerEyebrow:esc(p.services.eyebrow),offerHeading:esc(p.services.heading),offerPrefix:esc(p.services.prefix),offerAccent:esc(p.services.accent),offerDescription:esc(p.services.description),
 cards:p.services.items.map((s,i)=>`<article class="offer-card reveal" id="${esc(s.id)}" style="--stagger:${i%4}" aria-labelledby="service-title-${i}"><div class="offer-art">${image('card-'+s.image,'','(max-width:700px) 44vw, (max-width:1100px) 29vw, 22vw')}<span class="offer-number" aria-hidden="true">0${i+1}</span></div><div class="offer-copy"><h3 id="service-title-${i}">${esc(s.title)}</h3><p>${esc(s.tagline)}</p><ul>${s.offerings.map(t=>`<li>${esc(t)}</li>`).join('')}</ul></div><a href="${esc(shared.talk.href)}" class="offer-open" data-service="${i}" aria-label="Explore ${esc(s.title)}"><span>Explore service</span><span aria-hidden="true">→</span></a></article>`).join(''),
 approachEyebrow:esc(p.approach.eyebrow),approachHeading:join(p.approach.heading),approachPrefix:esc(p.approach.prefix),approachAccent:esc(p.approach.accent),approachDescription:esc(p.approach.description),circleLabels:p.approach.circles.map((s,i)=>`<text x="${[82,218,150][i]}" y="${[91,91,198][i]}">${esc(s)}</text>`).join(''),growthNote:join(p.approach.note),
 processEyebrow:esc(p.process.eyebrow),processHeading:join(p.process.heading),processAccent:esc(p.process.accent),processSteps:p.process.steps.map((s,i)=>`<li class="reveal" style="--stagger:${i}"><span class="process-number">0${i+1}</span><h3>${esc(s.title)}</h3><p>${esc(s.description)}</p></li>`).join(''),
 closingRoom:image('closing-room'),closingPerson:image('closing-person','','(max-width:700px) 43vw, 26vw'),closingDesk:image('closing-desk','','(max-width:700px) 100vw, 68vw'),closingEyebrow:join(p.closing.eyebrow),closingHeading:esc(p.closing.heading),closingAccent:esc(p.closing.accent),closingButton:esc(p.closing.button),closingNote:join(p.closing.wallNote),contactHref:esc(shared.talk.href)
};
const main=fs.readFileSync(path.join(src,'template.html'),'utf8').replace(/\{\{(\w+)\}\}/g,(_,key)=>{if(!(key in fields))throw Error(`Unresolved services field ${key}`);return fields[key];});
html=html.replace(/<main id="main">[\s\S]*?<\/main>/,main).replace('<body>','<body class="services-page">');
html=html.replace(/<title>.*?<\/title>/,`<title>${esc(p.brand.title)}</title>`).replace(/(<meta (?:name="description"|property="og:description") content=")[^"]*/g,`$1${esc(p.brand.description)}`).replace(/(<meta property="og:title" content=")[^"]*/,`$1${esc(p.brand.title)}`);
html=html.replace(/<nav class="desktop-nav"[^>]*>[\s\S]*?<\/nav>/,`<nav class="desktop-nav" aria-label="Main navigation">${navigation.map(n=>`<a href="${n.href}" ${n.label==='Services'?'aria-current="page"':''}>${esc(n.label)}</a>`).join('')}</nav>`);
html=html.replace(/(<nav id="mobile-nav"[^>]*>)[\s\S]*?<\/nav>/,`$1${[...navigation,{label:shared.talk.label,href:shared.talk.href}].map(n=>`<a href="${n.href}" ${n.label==='Services'?'aria-current="page"':''}>${esc(n.label)}<span aria-hidden="true">↗</span></a>`).join('')}</nav>`);
html=html.replaceAll('href="#home"','href="/"').replaceAll('href="#portfolio"','href="/#portfolio"').replace(/<p class="footer-note">[\s\S]*?<\/p>/,`<p class="footer-note">${join(p.footerNote)}</p>`);
html=html.replace(/(<script type="application\/json" id="site-content">)[\s\S]*?(<\/script>)/,(_,a,b)=>a+JSON.stringify(data).replace(/</g,'\\u003c')+b);
html=html.replace('id="film-burn"','id="film-burn" data-sound-src="media/burn-services-sound.mp3"').replace(/media\/burn-entry.webm\?v=[\w]+/,'media/burn-services.webm');
const css=fs.readFileSync(path.join(src,'services.css'),'utf8');
const fingerprint=new Map();
for(const variants of Object.values(assets))for(const v of variants){const name=path.basename(v.src),file=path.join(src,'assets',name),digest=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').slice(0,10),hashed=name.replace('.webp',`.${digest}.webp`);fingerprint.set(name,hashed);html=html.replaceAll(v.src,'services-assets/'+hashed);}
const mediaHash=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'src/home/media/burn-services.webm'))).digest('hex').slice(0,10);
html=html.replace(/media\/(burn-services(?:-sound)?\.(?:mp3|webm))/g,`media/$1?v=${mediaHash}`);
const revision=crypto.createHash('sha256').update(html+css).digest('hex').slice(0,10);
html=html.replace('</head>',`<link rel="stylesheet" href="services.css?v=${revision}"></head>`);
for(const dir of ['dist','site']){const dest=path.join(root,dir);fs.writeFileSync(path.join(dest,'services.html'),html);fs.writeFileSync(path.join(dest,'services.css'),css);fs.mkdirSync(path.join(dest,'services-assets'),{recursive:true});for(const [name,hashed] of fingerprint)fs.copyFileSync(path.join(src,'assets',name),path.join(dest,'services-assets',hashed));}
console.log(`Built services: eight editable services, supplied layers, responsive artwork. Revision ${revision}.`);
