/* About reuses the built home shell, its fonts, motion, grain, burn and sound.
   Only the <main>, one stylesheet and one small script are page specific. */
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=path.join(__dirname,'..'),src=path.join(root,'src/about');
const p=JSON.parse(fs.readFileSync(path.join(src,'content.json'),'utf8'));
const assets=JSON.parse(fs.readFileSync(path.join(src,'assets.json'),'utf8'));
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const image=(key,cls='layer-image',sizes='100vw',priority=false,alt='')=>{
 const variants=assets[key];if(!variants)throw Error(`Missing About artwork ${key}`);
 const v=variants[1]||variants[0];
 return `<img class="${cls}" src="${v.src}" srcset="${variants.map(x=>`${x.src} ${x.width}w`).join(', ')}" sizes="${sizes}" width="${v.width}" height="${v.height}" alt="${esc(alt)}" ${priority?'fetchpriority="high"':'loading="lazy"'} decoding="async">`;
};
/* Each line carries its own index so the note writes itself on, line by line,
   and the rule underneath is drawn last. */
const hand=lines=>lines.map((line,i)=>`<span style="--i:${i}">${esc(line)}</span>`).join('')+`<i aria-hidden="true" style="--i:${lines.length}"></i>`;
const blocks=lines=>lines.map(line=>`<span>${esc(line)}</span>`).join('');

let html=fs.readFileSync(path.join(root,'dist/index.html'),'utf8');
const shared=JSON.parse(html.match(/<script type="application\/json" id="site-content">([\s\S]*?)<\/script>/)[1]);
const navigation=[{label:'Home',href:'/'},{label:'About',href:'/about'},{label:'Services',href:'/services'},{label:'Portfolio',href:'/portfolio'}];
const data={...shared,navigation,page:'about'};

const fields={
 heroRoom:image('hero-room','layer-image','100vw',true),
 spotlight:image('spotlight','layer-image','(max-width:700px) 28vw, 18vw',true),
 chair:image('chair','layer-image','(max-width:700px) 38vw, 24vw',true),
 roadcase:image('roadcase','layer-image','(max-width:700px) 28vw, 18vw'),
 camera:image('camera','layer-image','(max-width:700px) 34vw, 22vw'),
 heroWordmark:esc(p.hero.wordmark),heroSuffix:esc(p.hero.suffix),heroTagline:esc(p.hero.tagline),
 heroSubtitle:esc(p.hero.subtitle),heroPlay:esc(p.hero.play),playTarget:esc(p.hero.playTarget),
 noteLeft:hand(p.hero.noteLeft),noteRight:hand(p.hero.noteRight),

 storyEyebrow:esc(p.story.eyebrow),storyHeading:blocks(p.story.heading),storyBody:esc(p.story.body),
 storyPhoto:image('photo','','(max-width:700px) 78vw, 38vw',false,p.story.photoAlt),
 storyStrip:image('filmstrip','','(max-width:700px) 21vw, 10vw',false,p.story.stripAlt),
 storyNote:hand(p.story.note),
 storyChain:p.story.chain.map((step,i)=>`<li style="--i:${i}">${esc(step)}</li>`).join(''),

 founderEyebrow:esc(p.founder.eyebrow),founderName:esc(p.founder.name),founderRole:esc(p.founder.role),
 founderQuote:`“${esc(p.founder.quote)}”`,founderNote:hand(p.founder.note),
 founderPortrait:image('filmframe','','(max-width:700px) 78vw, 40vw',false,p.founder.portraitAlt),

 philosophyEyebrow:esc(p.philosophy.eyebrow),philosophyHeading:blocks(p.philosophy.heading),
 philosophyBody:blocks(p.philosophy.body),philosophyCta:esc(p.philosophy.cta),
 clapper:image('clapper','','(max-width:700px) 54vw, 30vw'),
 contactHref:esc(shared.talk.href)
};
const main=fs.readFileSync(path.join(src,'template.html'),'utf8').replace(/\{\{(\w+)\}\}/g,(_,key)=>{if(!(key in fields))throw Error(`Unresolved About field ${key}`);return fields[key];});
html=html.replace(/<main id="main">[\s\S]*?<\/main>/,main).replace('<body>','<body class="about-page">');
html=html.replace(/<title>.*?<\/title>/,`<title>${esc(p.brand.title)}</title>`)
 .replace(/(<meta (?:name="description"|property="og:description") content=")[^"]*/g,`$1${esc(p.brand.description)}`)
 .replace(/(<meta property="og:title" content=")[^"]*/,`$1${esc(p.brand.title)}`);
const nav=mobile=>[...navigation,...(mobile?[shared.talk]:[])].map(n=>`<a href="${n.href}" ${n.label==='About'?'aria-current="page"':''}>${esc(n.label)}${mobile?'<span aria-hidden="true">↗</span>':''}</a>`).join('');
html=html.replace(/(<nav class="desktop-nav"[^>]*>)[\s\S]*?<\/nav>/,`$1${nav(false)}</nav>`)
 .replace(/(<nav id="mobile-nav"[^>]*>)[\s\S]*?<\/nav>/,`$1${nav(true)}</nav>`);
html=html.replaceAll('href="#home"','href="/"').replaceAll('href="#portfolio"','href="/portfolio"')
 .replace(/<p class="footer-note">[\s\S]*?<\/p>/,`<p class="footer-note">${p.footerNote.map(esc).join('<br>')}</p>`);
html=html.replace(/(<script type="application\/json" id="site-content">)[\s\S]*?(<\/script>)/,(_,a,b)=>a+JSON.stringify(data).replace(/</g,'\\u003c')+b);
html=html.replace('id="film-burn"','id="film-burn" data-sound-src="media/burn-about-sound.mp3"').replace(/media\/burn-entry.webm\?v=[\w]+/,'media/burn-about.webm');

let css=fs.readFileSync(path.join(src,'about.css'),'utf8');
const script=fs.readFileSync(path.join(src,'experience.js'),'utf8');
/* Fingerprint every file this page actually references -- artwork from the
   manifest plus the two page-only font faces named in the stylesheet. */
const referenced=new Set(Object.values(assets).flat().map(v=>path.basename(v.src)));
for(const match of css.matchAll(/about-assets\/([\w.-]+)/g))referenced.add(match[1]);
const fingerprints=new Map();
for(const name of referenced){
 const file=path.join(src,'assets',name);
 if(!fs.existsSync(file))throw Error(`Missing About asset ${name}`);
 const extension=path.extname(name);
 const digest=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').slice(0,10);
 const hashed=name.slice(0,-extension.length)+'.'+digest+extension;
 fingerprints.set(name,hashed);
 html=html.split(`about-assets/${name}`).join(`about-assets/${hashed}`);
 css=css.split(`about-assets/${name}`).join(`about-assets/${hashed}`);
}
const mediaHash=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'src/home/media/burn-about.webm'))).digest('hex').slice(0,10);
html=html.replace(/media\/(burn-about(?:-sound)?\.(?:mp3|webm))/g,`media/$1?v=${mediaHash}`);
const revision=crypto.createHash('sha256').update(html+css+script).digest('hex').slice(0,10);
html=html.replace('</head>',`<link rel="preload" href="about-assets/${fingerprints.get('playfair.woff2')}" as="font" type="font/woff2" crossorigin><link rel="preload" href="about-assets/${fingerprints.get('hand.woff2')}" as="font" type="font/woff2" crossorigin><link rel="stylesheet" href="about.css?v=${revision}"><script src="about.js?v=${revision}" defer></script></head>`);
for(const dir of ['dist','site']){
 const dest=path.join(root,dir);
 fs.writeFileSync(path.join(dest,'about.html'),html);
 fs.writeFileSync(path.join(dest,'about.css'),css);
 fs.writeFileSync(path.join(dest,'about.js'),script);
 fs.mkdirSync(path.join(dest,'about-assets'),{recursive:true});
 for(const [name,hashed] of fingerprints)fs.copyFileSync(path.join(src,'assets',name),path.join(dest,'about-assets',hashed));
 fs.cpSync(path.join(root,'src/home/media'),path.join(dest,'media'),{recursive:true});
}
console.log(`Built About: hero scene, story, founder and philosophy from ${Object.keys(assets).length} supplied plates. Revision ${revision}.`);
