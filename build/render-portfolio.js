/* Portfolio uses the existing shell, fonts, motion and soundtrack. */
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=path.join(__dirname,'..'),src=path.join(root,'src/portfolio');
const p=JSON.parse(fs.readFileSync(path.join(src,'content.json'),'utf8'));
const assets=JSON.parse(fs.readFileSync(path.join(src,'assets.json'),'utf8'));
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const lines=a=>a.map(esc).join('<br>');
const image=(key,cls='',sizes='100vw',priority=false,alt='')=>{
 const variants=assets[key];if(!variants)throw Error(`Missing portfolio artwork ${key}`);
 const v=variants[1]||variants[0];
 return `<img class="${cls}" src="${v.src}" srcset="${variants.map(v=>`${v.src} ${v.width}w`).join(', ')}" sizes="${sizes}" width="${v.width}" height="${v.height}" alt="${esc(alt)}" ${priority?'fetchpriority="high"':'loading="lazy"'} decoding="async">`;
};
let html=fs.readFileSync(path.join(root,'dist/index.html'),'utf8');
const shared=JSON.parse(html.match(/<script type="application\/json" id="site-content">([\s\S]*?)<\/script>/)[1]);
const navigation=[{label:'Home',href:'/'},{label:'About',href:'/about'},{label:'Services',href:'/services'},{label:'Portfolio',href:'/portfolio'}];
const catalog=require('./catalog'),lists=catalog.resolve(),folio=catalog.folio(lists.projects,lists.chapters,lists.brands,shared.talk.href);
const data={...shared,page:'portfolio',navigation,portfolio:{eyebrow:'Our work',items:lists.projects.map(({image,homeImage,homeArt,home,...s})=>({...s,art:image.src}))}};
const fields={
 heroRoom:image('hero-room','layer-image','100vw',true),workstation:image('workstation','layer-image','(max-width:700px) 106vw, 76vw',true),director:image('director','hero-person layer-image','(max-width:700px) 64vw, 39vw',true),
 heroEyebrow:esc(p.hero.eyebrow),heroHeading:p.hero.heading.map(s=>`<span>${esc(s)}</span>`).join(''),heroAccent:esc(p.hero.accent),heroDescription:esc(p.hero.description),heroWall:lines(p.hero.wallWords),heroPrinciples:lines(p.hero.principles),chairNote:lines(p.hero.chairWords),
 workEyebrow:esc(p.work.eyebrow),workHeading:p.work.heading.map(s=>`<span>${esc(s)}</span>`).join(''),workAccent:esc(p.work.accent),workDescription:esc(p.work.description),
 ledgerFigures:folio.figures,
 ledgerList:folio.ledger,
 chapters:folio.chapters,
 texture:image('texture','layer-image'),storyCollage:image('story-collage','layer-image','25vw'),filmstrip:image('filmstrip','layer-image','(max-width:700px) 43vw, 32vw'),storyHeading:lines(p.story.heading),storyDescription:esc(p.story.description),storyPrinciples:lines(p.story.principles),storyNote:lines(p.story.note),
 stats:p.story.stats.map(s=>`<div class="reveal"><strong>${esc(s.value)}</strong><span>${lines(s.label)}</span></div>`).join(''),
 clientHeading:lines(p.clients.heading),clientNote:lines(p.clients.note),clientMore:esc(p.clients.more),logos:[0,1].map(copy=>p.clients.items.map(s=>`<div class="folio-logo"${copy?' aria-hidden="true"':''}>${image('logo-'+s.id,'','(max-width:700px) 28vw, 15vw',false,copy?'':s.name)}</div>`).join('')).join(''),
 closingRoom:image('closing-room','layer-image'),studio:image('studio','layer-image','(max-width:700px) 64vw, 43vw'),closingHeading:lines(p.closing.heading),closingDescription:esc(p.closing.description),closingButton:esc(p.closing.button),closingNote:lines(p.closing.note),contactHref:esc(shared.talk.href)
};
const main=fs.readFileSync(path.join(src,'template.html'),'utf8').replace(/\{\{(\w+)\}\}/g,(_,key)=>{if(!(key in fields))throw Error(`Unresolved portfolio field ${key}`);return fields[key];});
html=html.replace(/<main id="main">[\s\S]*?<\/main>/,main).replace('<body>','<body class="portfolio-page">');
html=html.replace(/<title>.*?<\/title>/,`<title>${esc(p.brand.title)}</title>`).replace(/(<meta (?:name="description"|property="og:description") content=")[^"]*/g,`$1${esc(p.brand.description)}`).replace(/(<meta property="og:title" content=")[^"]*/,`$1${esc(p.brand.title)}`);
const nav=mobile=>[...navigation,...(mobile?[shared.talk]:[])].map(n=>`<a href="${n.href}" ${n.label==='Portfolio'?'aria-current="page"':''}>${esc(n.label)}${mobile?'<span aria-hidden="true">↗</span>':''}</a>`).join('');
html=html.replace(/(<nav class="desktop-nav"[^>]*>)[\s\S]*?<\/nav>/,`$1${nav(false)}</nav>`).replace(/(<nav id="mobile-nav"[^>]*>)[\s\S]*?<\/nav>/,`$1${nav(true)}</nav>`);
html=html.replaceAll('href="#home"','href="/"').replaceAll('href="#portfolio"','href="/portfolio"').replace(/<p class="footer-note">[\s\S]*?<\/p>/,`<p class="footer-note">${lines(p.footerNote)}</p>`);
html=html.replace(/(<script type="application\/json" id="site-content">)[\s\S]*?(<\/script>)/,(_,a,b)=>a+JSON.stringify(data).replace(/</g,'\\u003c')+b);
html=html.replace('id="film-burn"','id="film-burn" data-sound-src="media/burn-portfolio-sound.mp3"').replace(/media\/burn-entry.webm\?v=[\w]+/,'media/burn-portfolio.webm');
let css=fs.readFileSync(path.join(src,'portfolio.css'),'utf8'),script=fs.readFileSync(path.join(src,'experience.js'),'utf8');
const fingerprints=new Map();
for(const variants of Object.values(assets))for(const v of variants){const name=path.basename(v.src),file=path.join(src,'assets',name),hash=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').slice(0,10),hashed=name.replace('.webp',`.${hash}.webp`);fingerprints.set(name,hashed);html=html.replaceAll(v.src,'portfolio-assets/'+hashed);}
const mediaHash=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'src/home/media/burn-portfolio.webm'))).digest('hex').slice(0,10);
html=html.replace(/media\/(burn-portfolio(?:-sound)?\.(?:mp3|webm))/g,`media/$1?v=${mediaHash}`);
const revision=crypto.createHash('sha256').update(html+css+script).digest('hex').slice(0,10);
html=html.replace('</head>',`<link rel="stylesheet" href="portfolio.css?v=${revision}"><script src="portfolio.js?v=${revision}" defer></script></head>`);
for(const dir of ['dist','site']){const dest=path.join(root,dir);fs.writeFileSync(path.join(dest,'portfolio.html'),html);fs.writeFileSync(path.join(dest,'portfolio.css'),css);fs.writeFileSync(path.join(dest,'portfolio.js'),script);fs.mkdirSync(path.join(dest,'portfolio-assets'),{recursive:true});for(const [name,hashed] of fingerprints)fs.copyFileSync(path.join(src,'assets',name),path.join(dest,'portfolio-assets',hashed));}
console.log(`Built portfolio: ${p.projects.length} editable projects across ${p.chapters.length} scroll chapters, 12 client logos. Revision ${revision}.`);
