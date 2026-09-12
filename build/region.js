/* Screenshot an exact page region: node build/region.js <y> <h> <name> [width] */
const puppeteer=require('puppeteer'),path=require('path'),fs=require('fs');
(async()=>{
 const y=Number(process.argv[2]||0),h=Number(process.argv[3]||900),name=process.argv[4]||'region',w=Number(process.argv[5]||1440);
 const b=await puppeteer.launch({headless:'shell',args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
 const p=await b.newPage();await p.setViewport({width:w,height:h});
 await p.goto('http://localhost:3200/'+(process.env.QA_PAGE||'about'),{waitUntil:'networkidle2'});
 await p.evaluate(async()=>{const H=()=>document.documentElement.scrollHeight;
  for(let i=0;i<H();i+=400){window.scrollTo(0,i);await new Promise(r=>setTimeout(r,90));}
  window.scrollTo(0,0);await new Promise(r=>setTimeout(r,500));});
 await p.addStyleTag({content:'#cookie-consent,.consent,.cookie-consent,[class*=consent]{display:none!important}'});
 await p.evaluate(v=>{document.documentElement.classList.remove('lenis');window.scrollTo(0,v);},y);
 await new Promise(r=>setTimeout(r,500));
 fs.mkdirSync(path.join(__dirname,'..','qa'),{recursive:true});
 await p.screenshot({path:path.join(__dirname,'..','qa',name+'.png')});
 console.log('scrollY now',await p.evaluate(()=>Math.round(scrollY)));
 await b.close();})();
