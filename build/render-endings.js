const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=path.join(__dirname,'..'),assets=JSON.parse(fs.readFileSync(path.join(root,'src/contact-assets.json'),'utf8'));
const css=fs.readFileSync(path.join(root,'src/talk/end-reveal.css'),'utf8');
const cssHash=crypto.createHash('sha256').update(css).digest('hex').slice(0,10);
const pages={'index':'home','services':'services','portfolio':'portfolio','lets-talk':'contact','contact':'contact','privacy':'home'};
const alt={home:'INU Media — stories worth falling for.',services:'INU Media — same scroll, different stories.',portfolio:'INU Media — ideas in motion.',contact:'INU Media — turning ideas into movement.'};
for(const dir of ['dist','site']){
 const dest=path.join(root,dir);fs.writeFileSync(path.join(dest,'end-reveal.css'),css);fs.mkdirSync(path.join(dest,'contact-assets'),{recursive:true});
 for(const [page,key] of Object.entries(pages)){
   const variants=assets['end-'+key];
   const paths=variants.map(v=>{const name=path.basename(v.src),source=path.join(root,'src/contact-assets',name),hash=crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex').slice(0,10),hashed=name.replace('.webp',`.${hash}.webp`);fs.copyFileSync(source,path.join(dest,'contact-assets',hashed));return {...v,src:'contact-assets/'+hashed};});
   const medium=paths[1]||paths[0],ratio=medium.height/medium.width;
   const ending=`<section class="end-reveal" aria-label="${alt[key]}" style="--end-aspect:${ratio.toFixed(6)}"><div class="end-reveal__art"><img src="${medium.src}" srcset="${paths.map(v=>`${v.src} ${v.width}w`).join(', ')}" sizes="100vw" width="${medium.width}" height="${medium.height}" loading="lazy" decoding="async" alt="${alt[key]}"></div></section>`;
   const file=path.join(dest,page+'.html');let html=fs.readFileSync(file,'utf8');
   html=html.replace(/<section class="end-reveal"[\s\S]*?<\/section>/g,'').replace(/<link rel="stylesheet" href="end-reveal.css[^\"]*">/g,'');
   if(!/<\/footer>\s*<\/div>/.test(html))throw Error('Footer shell boundary missing for '+page);
   html=html.replace(/(<\/footer>\s*<\/div>)/,`$1\n${ending}`).replace('</head>',`<link rel="stylesheet" href="end-reveal.css?v=${cssHash}"></head>`);
   fs.writeFileSync(file,html);
 }
}
console.log('Added post-footer reveals to every current route; About artwork reserved.');
