/* Screenshot a live URL region: node build/live-shot.js <url> <y> <h> <name> [w] */
const puppeteer=require('puppeteer'),path=require('path'),fs=require('fs');
(async()=>{
 const url=process.argv[2],y=Number(process.argv[3]||0),h=Number(process.argv[4]||900),name=process.argv[5]||'live',w=Number(process.argv[6]||1440);
 const b=await puppeteer.launch({headless:'shell',args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
 const p=await b.newPage();await p.setViewport({width:w,height:h});
 const errs=[];p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));
 p.on('console',m=>{if(m.type()==='error')errs.push('CONSOLE '+m.text())});
 p.on('requestfailed',r=>errs.push('FAIL '+r.url()));
 const res=await p.goto(url,{waitUntil:'networkidle2',timeout:60000});
 await p.evaluate(async()=>{const H=()=>document.documentElement.scrollHeight;
  for(let i=0;i<H();i+=400){window.scrollTo(0,i);await new Promise(r=>setTimeout(r,90));}
  window.scrollTo(0,0);await new Promise(r=>setTimeout(r,500));});
 await p.addStyleTag({content:'[class*=consent],.cookie-bar{display:none!important}'});
 await p.evaluate(v=>{document.documentElement.classList.remove('lenis');window.scrollTo(0,v);},y);
 await new Promise(r=>setTimeout(r,600));
 fs.mkdirSync(path.join(__dirname,'..','qa'),{recursive:true});
 await p.screenshot({path:path.join(__dirname,'..','qa',name+'.png')});
 console.log(JSON.stringify({url,status:res.status(),docHeight:await p.evaluate(()=>document.documentElement.scrollHeight),overflow:await p.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth),errs:[...new Set(errs)].slice(0,10)}));
 await b.close();})();
