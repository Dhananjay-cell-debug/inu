/* Extends the production home shell; does not use legacy src/pages. */
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=path.join(__dirname,'..'),src=path.join(root,'src/talk');
const data=JSON.parse(fs.readFileSync(path.join(src,'contact-content.json'),'utf8'));
const shared=JSON.parse(fs.readFileSync(path.join(root,'src/home/content.json'),'utf8'));
const assets=JSON.parse(fs.readFileSync(path.join(root,'src/contact-assets.json'),'utf8'));
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fingerprints=new Map();
function image(key,cls='',sizes='100vw',priority=false,alt=''){
  const variants=assets[key];
  for(const v of variants){const name=path.basename(v.src);if(!fingerprints.has(name)){const hash=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'src/contact-assets',name))).digest('hex').slice(0,10);fingerprints.set(name,name.replace('.webp',`.${hash}.webp`));}}
  const url=v=>'contact-assets/'+fingerprints.get(path.basename(v.src));
  const chosen=variants[1]||variants[0];
  return `<img class="${cls}" src="${url(chosen)}" srcset="${variants.map(v=>`${url(v)} ${v.width}w`).join(', ')}" sizes="${sizes}" width="${chosen.width}" height="${chosen.height}" alt="${esc(alt)}" ${priority?'fetchpriority="high"':'loading="lazy"'} decoding="async">`;
}
const icon=name=>`<svg aria-hidden="true"><use href="#icon-${name}"></use></svg>`;
const socials=shared.footer.socials.filter(s=>s.icon!=='youtube').map(s=>`<a href="${esc(s.href)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(s.label)}">${icon(s.icon)}</a>`).join('');
const contact=data.contact;
const fields={
 room:image('room','scene-room','100vw',true),listener:image('listener','','(max-width:700px) 55vw, 38vw',true),speaker:image('speaker','','(max-width:700px) 44vw, 27vw',true),desk:image('desk','scene-desk','100vw',true),
 closingArt:image('creative-rooftop','closing-art-img','100vw',false,''),introEyebrow:esc(data.intro.eyebrow),introDescription:esc(data.intro.description),email:esc(contact.email),address:contact.address.map(esc).join('<br>'),
 phoneLinks:contact.phones.map(p=>`<a href="${p.href}">${esc(p.label)}</a>`).join(''),instagram:contact.instagram,socials,
 mapUrl:'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(contact.mapQuery),
 mapLat:String(contact.mapLat),mapLng:String(contact.mapLng),
 dialOptions:data.dialCodes.map(c=>`<option value="${esc(c.code)}">${esc(c.label)}</option>`).join(''),
 mailIcon:icon('mail'),phoneIcon:icon('phone'),pinIcon:icon('pin'),
 projectOptions:data.projectTypes.map(p=>`<option>${esc(p)}</option>`).join(''),
 faqs:data.faqs.map((f,i)=>`<details class="faq-item reveal"><summary><span class="faq-number">${String(i+1).padStart(2,'0')}</span><span>${esc(f.question)}</span><span class="faq-plus" aria-hidden="true">+</span></summary><p>${esc(f.answer)}</p></details>`).join('')
};
const main=fs.readFileSync(path.join(src,'contact-template.html'),'utf8').replace(/\{\{(\w+)\}\}/g,(_,k)=>{if(!(k in fields))throw Error('Missing field '+k);return fields[k];});
let html=fs.readFileSync(path.join(root,'dist/index.html'),'utf8');
html=html.replace(/<main id="main">[\s\S]*?<\/main>/,main).replace('<body>','<body class="talk-page">').replace('id="home"','id="top"');
html=html.replace(/<title>.*?<\/title>/,`<title>${esc(data.brand.title)}</title>`).replace(/(<meta (?:name="description"|property="og:description") content=")[^"]*/g,`$1${esc(data.brand.description)}`).replace(/(<meta property="og:title" content=")[^"]*/,`$1${esc(data.brand.title)}`);
html=html.replace(/href="#home"/g,'href="/"').replace(/href="#about"/g,'href="/#about"').replace(/href="#portfolio"/g,'href="/portfolio"');
html=html.replace(/ aria-current="page"/g,'').replace('<a class="pill header-cta"','<a aria-current="page" class="pill header-cta"');
html=html.replace('</defs>',`<symbol id="icon-pin" viewBox="0 0 24 24"><path d="M12 22c5-6.2 7.5-10 7.5-13A7.5 7.5 0 0 0 4.5 9c0 3 2.5 6.8 7.5 13Z"/><circle cx="12" cy="9" r="2.7"/></symbol><symbol id="icon-mail" viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="1"/><path d="m3 6 9 7 9-7"/></symbol><symbol id="icon-phone" viewBox="0 0 24 24"><path d="m7 2 4 5-3 3c2 3 3 4 6 6l3-3 5 4c-1 4-4 5-7 3C9 17 6 14 3 8 1 5 3 2 7 2Z"/></symbol></defs>`);
const runtime={navigation:[...shared.navigation,{...shared.talk,current:true}],message:{sending:'Sending…',success:'Thanks — your message is on its way. We’ll be in touch.',failure:'Your message couldn’t be sent. Email us directly at'},music:shared.music,endpoint:'/api/contact',fallbackEmail:contact.email,deliveryMode:data.deliveryMode};
html=html.replace(/<script type="application\/json" id="site-content">[\s\S]*?<\/script>/,`<script type="application/json" id="page-content">${JSON.stringify(runtime).replace(/</g,'\\u003c')}</script>`);
html=html.replace(/home\.js\?v=[a-f0-9]+/,'talk.js').replace(/media\/burn-entry.webm\?v=[a-f0-9]+/,'media/burn-talk.webm');
const css=fs.readFileSync(path.join(src,'contact.css'),'utf8');
const js=fs.readFileSync(path.join(src,'experience.js'),'utf8')+'\n'+fs.readFileSync(path.join(root,'src/home/atmosphere.js'),'utf8')+'\n'+fs.readFileSync(path.join(src,'contact.js'),'utf8');
const revision=crypto.createHash('sha256').update(html+css+js).digest('hex').slice(0,10);
html=html.replace('<script src="vendor/lenis.min.js" defer></script>','<script src="vendor/lenis.min.js" defer></script><script src="vendor/leaflet.js" defer></script>')
  .replace('</head>','<link rel="stylesheet" href="vendor/leaflet.css"></head>');
html=html.replace('talk.js"',`talk.js?v=${revision}"`).replace('</head>',`<link rel="stylesheet" href="contact.css?v=${revision}"></head>`);
for(const dir of ['dist','site']){
 const dest=path.join(root,dir);fs.writeFileSync(path.join(dest,'lets-talk.html'),html);fs.writeFileSync(path.join(dest,'contact.html'),html);fs.writeFileSync(path.join(dest,'contact.css'),css);fs.writeFileSync(path.join(dest,'talk.js'),js);
 fs.mkdirSync(path.join(dest,'contact-assets'),{recursive:true});for(const [name,hashed] of fingerprints)fs.copyFileSync(path.join(root,'src/contact-assets',name),path.join(dest,'contact-assets',hashed));
}
console.log(`Built contact: cinematic layers, 5 FAQs, single-flow layout. Revision ${revision}.`);
