const fs=require('fs');
(async()=>{
  for(const name of ['index','portfolio','services']){
    const live=await(await fetch('https://inuxsynapsis.vercel.app/'+(name==='index'?'':name))).text();
    const local=fs.readFileSync('dist/'+name+'.html','utf8');
    const normal=s=>s.replace(/\n?<section class="end-reveal"[\s\S]*?<\/section>/g,'').replace(/<link rel="stylesheet" href="end-reveal.css[^\"]*">/g,'').replace(/\?v=[a-f0-9]+/g,'').replace(/\r\n/g,'\n');
    const a=normal(live),b=normal(local);
    console.log(name,'matches production markup:',a===b);
    if(a!==b){let i=0;while(a[i]===b[i]&&i<Math.min(a.length,b.length))i++;console.log('first difference:',i,JSON.stringify(a.slice(i-30,i+130)),JSON.stringify(b.slice(i-30,i+130)));}
  }
})();
