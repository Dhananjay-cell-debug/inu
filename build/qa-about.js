const puppeteer=require('puppeteer');
const run=async(reduce)=>{
 const b=await puppeteer.launch({headless:'shell',args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
 const p=await b.newPage();
 if(reduce)await p.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
 const errs=[];p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));
 p.on('console',m=>{if(m.type()==='error')errs.push('CONSOLE '+m.text())});
 p.on('requestfailed',r=>errs.push('FAIL '+r.url()));
 await p.setViewport({width:1440,height:900});
 await p.goto('http://localhost:3200/about',{waitUntil:'networkidle2'});
 await new Promise(r=>setTimeout(r,900));
 const r={reduce,errs:[...new Set(errs)]};
 // the play control must reach the story section
 r.playHref=await p.$eval('.about-play',a=>a.getAttribute('href'));
 r.storyExists=await p.$eval('#our-story',e=>!!e);
 await p.click('.about-play');
 await new Promise(t=>setTimeout(t,1800));
 r.scrolledTo=await p.evaluate(()=>Math.round(scrollY));
 r.storyTop=await p.evaluate(()=>Math.round(document.querySelector('#our-story').getBoundingClientRect().top+scrollY));
 // reveals must have fired by the time a section is on screen
 r.revealsVisible=await p.evaluate(()=>document.querySelectorAll('.reveal.is-visible').length);
 r.revealsTotal=await p.evaluate(()=>document.querySelectorAll('.reveal').length);
 r.handOpacity=await p.evaluate(()=>{const s=document.querySelector('.hand--story span');return s?getComputedStyle(s).opacity:null;});
 r.soundToggle=await p.evaluate(()=>!!document.querySelector('#sound-toggle'));
 r.horizontalOverflow=await p.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
 await b.close();return r;
};
(async()=>{console.log(JSON.stringify(await run(false),null,1));console.log(JSON.stringify(await run(true),null,1));})();
