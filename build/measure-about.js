const puppeteer=require('puppeteer');
(async()=>{
 const b=await puppeteer.launch({headless:'shell',args:['--no-sandbox']});
 const p=await b.newPage();
 await p.setViewport({width:Number(process.argv[3]||1440),height:900});
 const slug=String(process.argv[2]||'about').split(/[\\/]/).filter(Boolean).pop();
 await p.goto('http://localhost:3200/'+slug,{waitUntil:'networkidle2'});
 const out=await p.evaluate(()=>{
  const sel=['.about-hero','.about-story','.about-founder','.about-philosophy','.footer','.end-reveal','.about-hero-copy','.about-wordmark','.about-suffix','.about-story h2','.about-plates','.about-chain','.about-plate--set','.about-plate--strip','.hand--story','.about-philosophy-copy'];
  const r={};
  for(const s of sel){const e=document.querySelector(s);if(!e)continue;const x=e.getBoundingClientRect();r[s]=[Math.round(x.left),Math.round(x.top+scrollY),Math.round(x.width),Math.round(x.height)];}
  r.doc=[0,0,0,document.documentElement.scrollHeight];
  return r;
 });
 console.log(JSON.stringify(out,null,1));
 await b.close();
})();
