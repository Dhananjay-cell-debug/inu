/* The services list and the portfolio list, and every piece of markup that
   shows them.

   These two lists are what the client edits in WordPress. Everything that
   draws a service or a project - Home's cards, the /services grid, the
   /portfolio chapters and each /services/<slug> page - is written here once,
   as a template with {{placeholders}}. The Node build fills the templates
   from the content.json files; WordPress fills the very same templates (shipped
   in dist/catalog.json) from what the client saved. One markup, two sources,
   so the two sites cannot drift apart.

   Placeholder values are always HTML-safe already: text goes through esc(),
   markup is built from templates. */
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=path.join(__dirname,'..');
const read=f=>JSON.parse(fs.readFileSync(path.join(root,f),'utf8'));
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fill=(tpl,vars)=>tpl.replace(/\{\{(\w+)\}\}/g,(_,k)=>{if(!(k in vars))throw Error(`Catalog template field ${k} missing`);return vars[k];});
const pad=n=>String(n).padStart(2,'0');

/* Title helpers - mirrored in the WordPress plugin (includes/catalog.php). */
// "Web & tech solutions" -> "Web<br>& tech solutions" for the two-line cards.
const titleLines=t=>esc(t).replace(/ &amp; /,'<br>&amp; ');
// Last word in the orange brush: "Web &amp; tech <em>solutions</em>".
const titleAccent=t=>{const w=String(t).trim().split(/\s+/);if(w.length<2)return esc(t);const last=w.pop();return `${esc(w.join(' '))} <em>${esc(last)}</em>`;};
const firstPart=c=>String(c).split(' · ')[0];
const words=['Zero','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve'];
const countWord=n=>words[n]||String(n);

/* Images: {src, srcset, width, height}. */
const digest=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').slice(0,10);
const hashedName=(name,file)=>{const ext=path.extname(name);return name.slice(0,-ext.length)+'.'+digest(file)+ext;};
// variants: [{src:'services-assets/x-640.webp',width,height}, ...]; srcDir holds the originals.
function imageOf(variants,srcDir,publicDir,{hashed=true}={}){
 const list=variants.map(v=>{const name=path.basename(v.src);return {...v,src:hashed?`${publicDir}/${hashedName(name,path.join(root,srcDir,name))}`:v.src};});
 const chosen=list[1]||list[0];
 return {src:chosen.src,full:list.at(-1).src,srcset:list.map(v=>`${v.src} ${v.width}w`).join(', '),width:chosen.width,height:chosen.height};
}
const img=(i,alt='')=>({src:esc(i.src),srcset:esc(i.srcset),width:String(i.width),height:String(i.height),alt:esc(alt)});

const T={
 homeService:`<a class="service-card reveal" href="{{href}}" style="--stagger:{{stagger}}"><span class="card-number">{{number}}</span><span class="service-art"><img class="" src="{{src}}" srcset="{{srcset}}" sizes="(max-width:700px) 82px, (max-width:1100px) 25vw, 16vw" width="{{width}}" height="{{height}}" alt="" loading="lazy" decoding="async"></span><span class="card-copy"><strong>{{title}}</strong><span>{{tagline}}</span></span><span class="service-arrow" aria-hidden="true">↗</span></a>`,
 homeWork:`<button class="work-card" data-work="{{index}}"><span class="work-image"><img src="{{src}}" srcset="{{srcset}}" sizes="(max-width:700px) 62vw, (max-width:1100px) 30vw, 20vw" width="{{width}}" height="{{height}}" loading="lazy" decoding="async" alt="{{alt}}"><span class="view-project" aria-hidden="true">View project ↗</span></span><span class="work-caption"><strong>{{title}}</strong><span>{{category}}<span class="button-arrow" aria-hidden="true">↗</span></span></span></button>`,
 servicesCard:`<article class="offer-card reveal" id="{{id}}" style="--stagger:{{stagger}}" aria-labelledby="service-title-{{index}}"><div class="offer-art"><img class="layer-image " src="{{src}}" srcset="{{srcset}}" sizes="(max-width:700px) 44vw, (max-width:1100px) 29vw, 22vw" width="{{width}}" height="{{height}}" alt="" loading="lazy" decoding="async"><span class="offer-number" aria-hidden="true">{{number}}</span></div><div class="offer-copy"><h3 id="service-title-{{index}}">{{title}}</h3><p>{{tagline}}</p><ul>{{offerings}}</ul></div><a href="{{href}}" class="offer-open" aria-label="Explore {{title}}"><span>Explore service</span><span aria-hidden="true">→</span></a></article>`,
 servicesOffering:`<li>{{name}}</li>`,
 folioCard:`<a class="folio-card reveal lightning" data-tilt href="{{href}}" data-work="{{index}}" data-tags="{{tags}}" style="--stagger:{{stagger}};--art-position:{{position}}" aria-label="View {{title}} project"><span class="folio-card-art"><img class="" src="{{src}}" srcset="{{srcset}}" sizes="(max-width:700px) 66vw, (max-width:1000px) 38vw, 26vw" width="{{width}}" height="{{height}}" alt="" loading="lazy" decoding="async"></span><span class="folio-card-copy"><strong>{{title}}</strong>{{subtitle}}<span class="folio-card-category">{{category}}</span></span><span class="folio-card-arrow" aria-hidden="true">↗</span></a>`,
 folioSubtitle:`<span class="folio-card-subtitle">{{subtitle}}</span>`,
 folioChapter:`<div class="studio-row content-chapter" id="chapter-{{id}}" data-chapter="{{id}}"><div class="studio-row__title reveal"><span>{{number}} / WORK</span><h3>{{title}}</h3><p>{{description}}</p><b>{{meta}}</b><em class="studio-row__count">{{count}}</em></div><div class="content-rail" data-speed="{{speed}}" role="group" aria-label="{{label}} projects"><div class="content-rail__track">{{cards}}</div></div></div>`,
 folioLedgerItem:`<li><a href="#chapter-{{id}}" data-chapter-link="{{id}}"><i aria-hidden="true">{{number}}</i><span>{{label}}</span><b>{{count}}</b></a></li>`,
 folioFigure:`<div><strong>{{value}}</strong><span>{{label}}</span></div>`,
 detailMain:`<section class="hero sd-hero" aria-labelledby="sd-title" data-scene><div class="sd-hero-art"><div class="sd-hero-plate parallax" data-depth="0.04"><img class="layer-image" src="{{src}}" srcset="{{srcset}}" sizes="100vw" width="{{width}}" height="{{height}}" alt="" fetchpriority="high" decoding="async"></div><div class="sd-hero-shade" aria-hidden="true"></div><canvas class="embers" aria-hidden="true"></canvas></div><div class="sd-hero-copy"><div class="sd-hero-title"><nav class="sd-crumbs" aria-label="Breadcrumb"><a href="/services">Services</a><span aria-hidden="true">/</span><span aria-current="page">{{number}}</span></nav><h1 id="sd-title">{{titleAccent}}</h1></div><div class="sd-hero-aside"><p class="sd-index" aria-hidden="true"><b>{{number}}</b><span>/ {{total}}</span></p><p class="sd-tagline">{{tagline}}</p></div></div></section><section class="sd-intro fluid-section" aria-label="About this service"><p class="eyebrow reveal">The service</p><p class="sd-summary reveal">{{summary}}</p><aside class="sd-facts reveal"><dl><div><dt>Disciplines</dt><dd>{{offeringCount}}</dd></div><div><dt>Projects</dt><dd>{{workCount}}</dd></div></dl><a class="pill" href="/lets-talk">Start a project<span class="button-arrow" aria-hidden="true">→</span></a></aside></section><section class="sd-included" aria-labelledby="sd-included-title"><div class="sd-included-head reveal"><p class="eyebrow">What’s included</p><h2 id="sd-included-title">{{offeringWord}} ways<br>we <em>help</em></h2></div><ol class="sd-list">{{offerings}}</ol></section>{{work}}<section class="sd-next" aria-label="More services"><a class="sd-next-link" href="{{nextHref}}"><span class="sd-next-label">Next service <b>{{nextNumber}}</b></span><strong>{{nextTitle}}</strong><span class="sd-next-art" aria-hidden="true"><img src="{{nextSrc}}" srcset="{{nextSrcset}}" sizes="(max-width:700px) 40vw, 22vw" width="{{nextWidth}}" height="{{nextHeight}}" alt="" loading="lazy" decoding="async"></span><span class="sd-next-arrow" aria-hidden="true">→</span></a><nav class="sd-all" aria-label="All services">{{allServices}}</nav></section>{{closing}}`,
 detailOffering:`<li class="sd-row reveal" style="--stagger:{{stagger}}"><span class="sd-row-num">{{number}}</span><h3>{{name}}</h3><p>{{line}}</p></li>`,
 detailWork:`<section class="sd-work fluid-section" aria-labelledby="sd-work-title"><div class="sd-work-head reveal"><div><p class="eyebrow">Selected work</p><h2 id="sd-work-title">Proof, <em>not promises</em></h2></div><a class="sd-more" href="{{href}}">See all the work<span aria-hidden="true">→</span></a></div><div class="sd-work-grid">{{cards}}</div></section>`,
 detailWorkCard:`<a class="sd-work-card reveal" href="{{href}}" style="--stagger:{{stagger}}"><span class="sd-work-art"><img src="{{src}}" srcset="{{srcset}}" sizes="(max-width:700px) 72vw, 24vw" width="{{width}}" height="{{height}}" alt="" loading="lazy" decoding="async"></span><strong>{{title}}</strong><span>{{category}}</span></a>`,
 detailAllLink:`<a href="{{href}}"{{current}}>{{title}}</a>`
};

function load(){
 const services=read('src/services/content.json'),portfolio=read('src/portfolio/content.json');
 const sAssets=read('src/services/assets.json'),pAssets=read('src/portfolio/assets.json'),hAssets=read('src/home/assets.json');
 return {services,portfolio,sAssets,pAssets,hAssets};
}

/* The lists as the renderers (and WordPress) see them, with images resolved.
   `hashed:false` keeps home-assets paths raw, because render-home fingerprints
   its own files after rendering. */
function resolve({homeHashed=true}={}){
 const {services,portfolio,sAssets,pAssets,hAssets}=load();
 const svc=services.services.items.map(s=>{
  const card=imageOf(sAssets['card-'+s.image],'src/services/assets','services-assets');
  const home=s.homeArt?imageOf(hAssets['service-'+s.homeArt],'src/home/assets','home-assets',{hashed:homeHashed}):card;
  return {...s,image:card,homeImage:home};
 });
 const projects=portfolio.projects.map(p=>{
  const art=imageOf(pAssets['project-'+p.id],'src/portfolio/assets','portfolio-assets');
  const home=p.homeArt?imageOf(hAssets['work-'+p.homeArt],'src/home/assets','home-assets',{hashed:homeHashed}):art;
  return {...p,image:art,homeImage:home};
 });
 return {services:svc,projects,chapters:portfolio.chapters,brands:portfolio.story.stats[0].value};
}

/* ---- renderers (mirrored in includes/catalog.php) ---- */

// Every list is wrapped in a named marker; WordPress replaces between them.
const region=(name,html)=>`<!--catalog:${name}-->${html}<!--/catalog:${name}-->`;

const homeServices=list=>region('home-services',list.filter(s=>s.home).map((s,i)=>fill(T.homeService,{...img(s.homeImage),href:`/services/${esc(s.id)}`,stagger:String(i%3),number:pad(i+1),title:titleLines(s.title),tagline:esc(s.tagline)})).join(''));

const homeWorkItems=projects=>projects.filter(p=>p.home);
const homeWork=projects=>region('home-work',homeWorkItems(projects).map((p,i)=>fill(T.homeWork,{...img(p.homeImage,p.title),index:String(i),title:esc(p.title),category:esc(firstPart(p.category))})).join(''));

const servicesCards=list=>region('services-cards',list.map((s,i)=>fill(T.servicesCard,{...img(s.image),id:esc(s.id),stagger:String(i%4),index:String(i),number:pad(i+1),title:esc(s.title),tagline:esc(s.tagline),href:`/services/${esc(s.id)}`,offerings:s.offerings.map(o=>fill(T.servicesOffering,{name:esc(o.name)})).join('')})).join(''));

const inChapter=(p,c)=>p.tags.some(t=>c.tags.includes(t));
function folio(projects,chapters,brands,talkHref){
 const live=chapters.filter(c=>projects.some(p=>inChapter(p,c)));
 const chapterHtml=live.map((c,i)=>{
  const members=projects.filter(p=>inChapter(p,c));
  const cards=members.map((p,n)=>fill(T.folioCard,{...img(p.image),href:esc(talkHref),index:String(projects.indexOf(p)),tags:esc(p.tags.join(' ')),stagger:String(n%3),position:esc(p.position||'50% 50%'),title:esc(p.title),subtitle:p.subtitle?fill(T.folioSubtitle,{subtitle:esc(p.subtitle)}):'',category:esc(p.category)})).join('');
  return fill(T.folioChapter,{id:esc(c.id),number:pad(i+1),title:c.title.map(esc).join('<br>'),description:esc(c.description),meta:esc(c.meta),count:`${members.length} ${members.length===1?'project':'projects'}`,speed:String(44+i*4),label:esc(c.label),cards});
 }).join('');
 const ledger=live.map((c,i)=>fill(T.folioLedgerItem,{id:esc(c.id),number:pad(i+1),label:esc(c.short||c.label),count:String(projects.filter(p=>inChapter(p,c)).length)})).join('');
 const figures=[[String(projects.length),'projects'],[String(live.length),'disciplines'],[brands,'brands']].map(([value,label])=>fill(T.folioFigure,{value:esc(value),label:esc(label)})).join('');
 return {chapters:region('folio-chapters',chapterHtml),ledger:region('folio-ledger',ledger),figures:region('folio-figures',figures)};
}

// The chapter a service's work lives in on /portfolio, for "See all the work".
const workFor=(s,projects)=>projects.filter(p=>p.tags.some(t=>s.work.includes(t)));
function detailMain(s,list,projects,chapters,closing){
 const i=list.indexOf(s),next=list[(i+1)%list.length],work=workFor(s,projects);
 const chapter=chapters.find(c=>c.tags.some(t=>s.work.includes(t)));
 const workHtml=work.length?fill(T.detailWork,{href:chapter?`/portfolio#chapter-${esc(chapter.id)}`:'/portfolio',cards:work.slice(0,4).map((p,n)=>fill(T.detailWorkCard,{...img(p.image),href:chapter?`/portfolio#chapter-${esc(chapter.id)}`:'/portfolio',stagger:String(n),title:esc(p.title),category:esc(p.category)})).join('')}):'';
 const nx=img(next.image);
 return fill(T.detailMain,{...img(s.image),number:pad(i+1),total:pad(list.length),titleAccent:titleAccent(s.title),tagline:esc(s.tagline),summary:esc(s.summary),offeringCount:pad(s.offerings.length),workCount:pad(work.length),offeringWord:countWord(s.offerings.length),
  offerings:s.offerings.map((o,n)=>fill(T.detailOffering,{stagger:String(n),number:pad(n+1),name:esc(o.name),line:esc(o.line||'')})).join(''),
  work:workHtml,nextHref:`/services/${esc(next.id)}`,nextNumber:pad((i+1)%list.length+1),nextTitle:esc(next.title),nextSrc:nx.src,nextSrcset:nx.srcset,nextWidth:nx.width,nextHeight:nx.height,
  allServices:list.map(x=>fill(T.detailAllLink,{href:`/services/${esc(x.id)}`,current:x===s?' aria-current="page"':'',title:esc(x.title)})).join(''),closing});
}

/* A page that lives one level down (/services/web-tech) cannot use the
   build's relative paths (`home.css`, `services-assets/...`): they would
   resolve under /services/. Make every local reference root-relative.
   (A <base> would break the SVG <use href="#icon-..."> sprites.) */
function rootRelative(html){
 const local=u=>!/^(\/|#|[a-z][a-z0-9+.-]*:)/i.test(u)&&u!=='';
 html=html.replace(/\s(src|href|data-src|data-sound-src|poster)="([^"]*)"/g,(m,a,u)=>local(u)?` ${a}="/${u}"`:m);
 html=html.replace(/\ssrcset="([^"]*)"/g,(m,set)=>` srcset="${set.split(',').map(p=>{const t=p.trim();return local(t)?'/'+t:t;}).join(', ')}"`);
 return html.replace(/url\((['"]?)(?!\/|#|data:|https?:)([^)'"]+)\1\)/g,'url($1/$2$1)');
}

module.exports={esc,fill,pad,T,resolve,homeServices,homeWork,homeWorkItems,servicesCards,folio,detailMain,workFor,rootRelative,titleLines,titleAccent,firstPart,countWord};
