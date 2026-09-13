const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=path.join(__dirname,'..'),assets=JSON.parse(fs.readFileSync(path.join(root,'src/contact-assets.json'),'utf8'));
const css=fs.readFileSync(path.join(root,'src/talk/end-reveal.css'),'utf8');
const cssHash=crypto.createHash('sha256').update(css).digest('hex').slice(0,10);
const js=fs.readFileSync(path.join(root,'src/talk/end-reveal.js'),'utf8');
const jsHash=crypto.createHash('sha256').update(js).digest('hex').slice(0,10);
const pages={'index':'home','about':'about','services':'services','portfolio':'portfolio','lets-talk':'contact','contact':'contact','privacy':'home'};
/* Where the plate is anchored when the viewport is shorter than its aspect and
   cover has to crop. The contact plate puts a face near its top edge, so it is
   hung from the top rather than centred, or he loses his head. */
const focus={contact:'50% 0%'};
const alt={home:'INU Media — stories worth falling for.',about:'INU Media — same people, different stories.',services:'INU Media — same scroll, different stories.',portfolio:'INU Media — ideas in motion.',contact:'INU Media — turning ideas into movement.'};
for(const dir of ['dist','site']){
 const dest=path.join(root,dir);fs.writeFileSync(path.join(dest,'end-reveal.css'),css);fs.writeFileSync(path.join(dest,'end-reveal.js'),js);fs.mkdirSync(path.join(dest,'contact-assets'),{recursive:true});
 for(const [page,key] of Object.entries(pages)){
   const variants=assets['end-'+key];
   const paths=variants.map(v=>{const name=path.basename(v.src),source=path.join(root,'src/contact-assets',name),hash=crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex').slice(0,10),hashed=name.replace('.webp',`.${hash}.webp`);fs.copyFileSync(source,path.join(dest,'contact-assets',hashed));return {...v,src:'contact-assets/'+hashed};});
   const medium=paths[1]||paths[0],ratio=medium.height/medium.width;
   const ending=`<section class="end-reveal" aria-label="${alt[key]}" style="--end-aspect:${ratio.toFixed(6)}${focus[key]?`;--end-focus:${focus[key]}`:''}"><div class="end-reveal__art"><img src="${medium.src}" srcset="${paths.map(v=>`${v.src} ${v.width}w`).join(', ')}" sizes="100vw" width="${medium.width}" height="${medium.height}" loading="lazy" decoding="async" alt="${alt[key]}"></div></section>`;
   const file=path.join(dest,page+'.html');let html=fs.readFileSync(file,'utf8');
   html=html.replace(/<section class="end-reveal"[\s\S]*?<\/section>/g,'').replace(/<link rel="stylesheet" href="end-reveal.css[^\"]*">/g,'').replace(/<script src="end-reveal\.js[^\"]*" defer><\/script>/g,'').replace(/<script src="end-reveal.js[^\"]*" defer><\/script>/g,'');
   if(!/<\/footer>\s*<\/div>/.test(html))throw Error('Footer shell boundary missing for '+page);
   html=html.replace(/(<\/footer>\s*<\/div>)/,`$1\n${ending}`).replace('</head>',`<link rel="stylesheet" href="end-reveal.css?v=${cssHash}"><script src="end-reveal.js?v=${jsHash}" defer></script></head>`);
   fs.writeFileSync(file,html);
 }
}
console.log(`Added post-footer reveals to every current route (${Object.keys(pages).length} files).`);
