/* The privacy page rides the same shell, fonts, field and consent layer. */
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=path.join(__dirname,'..'),src=path.join(root,'src/privacy');
const p=JSON.parse(fs.readFileSync(path.join(src,'content.json'),'utf8'));
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const lines=a=>a.map(esc).join('<br>');
/* Body copy carries a deliberate handful of <strong> and <a> tags, so it is
   passed through instead of escaped. Everything here is authored, not user
   input, and the build fails loudly on anything else. */
const allowed=/^(?:[^<>]|<\/?strong>|<a href="(?:mailto:|\/)[^"]*">|<\/a>)*$/;
const rich=v=>{if(!allowed.test(v))throw Error(`Unsafe markup in privacy copy: ${v.slice(0,60)}`);return v;};
let html=fs.readFileSync(path.join(root,'dist/index.html'),'utf8');
const shared=JSON.parse(html.match(/<script type="application\/json" id="site-content">([\s\S]*?)<\/script>/)[1]);
const navigation=[{label:'Home',href:'/'},{label:'About',href:'/about'},{label:'Services',href:'/services'},{label:'Portfolio',href:'/portfolio'}];
const data={...shared,page:'privacy',navigation};
const fields={
 heroEyebrow:esc(p.hero.eyebrow),heroHeading:p.hero.heading.map(s=>`<span>${esc(s)}</span>`).join(''),heroAccent:esc(p.hero.accent),heroDescription:esc(p.hero.description),heroUpdated:esc(p.hero.updated),
 index:p.sections.map(s=>`<a href="#${esc(s.id)}" data-legal-link="${esc(s.id)}">${esc(s.title)}</a>`).join(''),
 articles:p.sections.map(s=>`<article id="${esc(s.id)}" class="reveal"><h2>${esc(s.title)}</h2>${s.body.map(line=>`<p>${rich(line)}</p>`).join('')}</article>`).join(''),
 closingHeading:p.closing.heading.map(s=>`<span>${esc(s)}</span>`).join(''),closingDescription:esc(p.closing.description),closingButton:esc(p.closing.button),contactHref:esc(shared.talk.href)
};
const main=fs.readFileSync(path.join(src,'template.html'),'utf8').replace(/\{\{(\w+)\}\}/g,(_,key)=>{if(!(key in fields))throw Error(`Unresolved privacy field ${key}`);return fields[key];});
html=html.replace(/<main id="main">[\s\S]*?<\/main>/,main).replace('<body>','<body class="privacy-page legal-page">');
html=html.replace(/<title>.*?<\/title>/,`<title>${esc(p.brand.title)}</title>`).replace(/(<meta (?:name="description"|property="og:description") content=")[^"]*/g,`$1${esc(p.brand.description)}`).replace(/(<meta property="og:title" content=")[^"]*/,`$1${esc(p.brand.title)}`);
const nav=mobile=>[...navigation,...(mobile?[shared.talk]:[])].map(n=>`<a href="${n.href}">${esc(n.label)}${mobile?'<span aria-hidden="true">↗</span>':''}</a>`).join('');
html=html.replace(/(<nav class="desktop-nav"[^>]*>)[\s\S]*?<\/nav>/,`$1${nav(false)}</nav>`).replace(/(<nav id="mobile-nav"[^>]*>)[\s\S]*?<\/nav>/,`$1${nav(true)}</nav>`);
html=html.replaceAll('href="#home"','href="/"').replaceAll('href="#portfolio"','href="/portfolio"').replace(/<p class="footer-note">[\s\S]*?<\/p>/,`<p class="footer-note">${lines(p.footerNote)}</p>`);
html=html.replace(/(<script type="application\/json" id="site-content">)[\s\S]*?(<\/script>)/,(_,a,b)=>a+JSON.stringify(data).replace(/</g,'\\u003c')+b);
/* This page links to itself from the footer; mark it for screen readers. */
html=html.replace('<a href="/privacy">Privacy &amp; cookies</a>','<a href="/privacy" aria-current="page">Privacy &amp; cookies</a>');
const css=fs.readFileSync(path.join(src,'privacy.css'),'utf8'),script=fs.readFileSync(path.join(src,'experience.js'),'utf8');
const revision=crypto.createHash('sha256').update(html+css+script).digest('hex').slice(0,10);
html=html.replace('</head>',`<link rel="stylesheet" href="privacy.css?v=${revision}"><script src="privacy.js?v=${revision}" defer></script></head>`);
for(const dir of ['dist','site']){const dest=path.join(root,dir);fs.writeFileSync(path.join(dest,'privacy.html'),html);fs.writeFileSync(path.join(dest,'privacy.css'),css);fs.writeFileSync(path.join(dest,'privacy.js'),script);}
console.log(`Built privacy: ${p.sections.length} sections, consent panel wired. Revision ${revision}.`);
