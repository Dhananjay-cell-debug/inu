(() => {
  'use strict';
  const content = JSON.parse(document.querySelector('#page-content').textContent);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(pointer: fine)');
  const menuButton = document.querySelector('.menu-toggle');
  const mobileNav = document.querySelector('#mobile-nav');
  const header = document.querySelector('.header');
  const hero = document.querySelector('.talk-hero');
  const seat = document.querySelector('.seat-reveal');
  const grain = document.querySelector('#film-grain');
  const burn = document.querySelector('#film-burn');
  const soundtrack = document.querySelector('#soundtrack');
  const soundButton = document.querySelector('#sound-toggle');
  const soundLabel = document.querySelector('#sound-label');
  const soundStatus = document.querySelector('#sound-status');
  const burnSound = new Audio();
  burnSound.preload = 'none';
  burnSound.volume = 0.24;
  let soundEnabled = false, audioPending = false, volumeTimer = 0;
  let lenis = null;
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  /* ---------- navigation ---------- */
  function closeMenu(){menuButton.setAttribute('aria-expanded','false');menuButton.setAttribute('aria-label','Open menu');mobileNav.hidden=true;}
  menuButton.addEventListener('click',()=>{const open=menuButton.getAttribute('aria-expanded')!=='true';menuButton.setAttribute('aria-expanded',String(open));menuButton.setAttribute('aria-label',open?'Close menu':'Open menu');mobileNav.hidden=!open;});
  mobileNav.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu();});
  document.addEventListener('click',e=>{if(!e.target.closest('.header'))closeMenu();});
  matchMedia('(max-width:700px)').addEventListener('change',closeMenu);

  function configureScrolling(){
    lenis?.destroy();lenis=null;
    if(!reduce.matches&&finePointer.matches&&window.Lenis){
      lenis=new Lenis({autoRaf:true,lerp:0.085,smoothWheel:true,syncTouch:false,anchors:{offset:-90}});
    }
  }
  configureScrolling();
  finePointer.addEventListener('change',configureScrolling);
  document.querySelectorAll('a[href^="#"]').forEach(link=>link.addEventListener('click',event=>{
    const target=document.querySelector(link.getAttribute('href'));
    if(!target)return;
    event.preventDefault();
    const top=Math.max(0,target.getBoundingClientRect().top+scrollY-88);
    if(lenis){lenis.resize();lenis.scrollTo(top,{duration:1.3});}
    else window.scrollTo({top,behavior:reduce.matches?'instant':'smooth'});
    history.replaceState(null,'',link.hash);
  }));

  /* ---------- scroll-driven layers ---------- */
  let frame=0,mouseX=0,mouseY=0,currentX=0,currentY=0;
  let bounds=[],heroHeight=1;
  function measure(){
    bounds=[...document.querySelectorAll('[data-scene]')].map(section=>({
      section,top:section.getBoundingClientRect().top+scrollY,height:section.offsetHeight,
      layers:[...section.querySelectorAll('.parallax')]
    }));
    heroHeight=Math.max(1,hero.offsetHeight);
    requestFrame();
  }
  function requestFrame(){if(!frame&&!document.hidden)frame=requestAnimationFrame(update);}
  function update(){
    frame=0;
    const y=scrollY,small=innerWidth<=700;
    header.classList.toggle('is-sticky',y>64);
    currentX+=(mouseX-currentX)*.045;currentY+=(mouseY-currentY)*.045;
    if(!reduce.matches){
      for(const b of bounds){
        if(y+innerHeight<b.top-160||y>b.top+b.height+160)continue;
        const distance=clamp(y-b.top,-innerHeight,b.height);
        for(const layer of b.layers){
          const depth=Number(layer.dataset.depth)||0;
          layer.style.setProperty('--py',`${(distance*depth*(small?.34:1)+currentY*depth*26).toFixed(2)}px`);
          layer.style.setProperty('--px',`${(currentX*depth*32).toFixed(2)}px`);
        }
      }
      // A single, finite settle on the seated figure — it stops instead of drifting.
      seat.style.setProperty('--seat-scale',(1+clamp(y/(heroHeight*.6),0,1)*.055).toFixed(4));
    }
    if(Math.abs(mouseX-currentX)>.003||Math.abs(mouseY-currentY)>.003)requestFrame();
  }
  addEventListener('scroll',requestFrame,{passive:true});
  addEventListener('resize',measure,{passive:true});
  hero.addEventListener('pointermove',e=>{if(reduce.matches||!finePointer.matches)return;mouseX=e.clientX/innerWidth-.5;mouseY=e.clientY/innerHeight-.5;requestFrame();},{passive:true});
  hero.addEventListener('pointerleave',()=>{mouseX=mouseY=0;requestFrame();});
  document.fonts.ready.then(measure);addEventListener('load',measure,{once:true});measure();

  /* ---------- sequential reveals ---------- */
  const revealObserver=new IntersectionObserver(entries=>{
    for(const entry of entries)if(entry.isIntersecting){entry.target.classList.add('is-visible');revealObserver.unobserve(entry.target);}
  },{threshold:.1,rootMargin:'0px 0px -40px 0px'});
  if(!reduce.matches){
    document.documentElement.classList.add('motion-ready');
    document.querySelectorAll('.reveal,.message-panel,.reach-list,.trio').forEach(el=>revealObserver.observe(el));
  }

  /* ---------- embers ---------- */
  const canvas=document.querySelector('.embers'),ctx=canvas.getContext('2d',{alpha:true});
  let emberFrame=0,heroVisible=true,lastParticleTime=0,canvasW=1,canvasH=1;
  const particles=Array.from({length:22},(_,i)=>({x:(Math.sin(i*23.1)+1)/2,y:(i*.137)%1,speed:.013+(i%4)*.004,radius:.5+(i%3)*.28,phase:i*1.7}));
  function sizeCanvas(){const r=canvas.getBoundingClientRect();const dpr=Math.min(devicePixelRatio,1.5);canvasW=r.width;canvasH=r.height;canvas.width=Math.round(r.width*dpr);canvas.height=Math.round(r.height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);}
  function renderEmbers(now){
    emberFrame=0;
    if(!heroVisible||document.hidden||reduce.matches)return;
    emberFrame=requestAnimationFrame(renderEmbers);
    if(now-lastParticleTime<1000/24)return;
    const dt=Math.min((now-lastParticleTime)/1000,.05);lastParticleTime=now;
    ctx.clearRect(0,0,canvasW,canvasH);
    const count=innerWidth<700?11:22;
    for(let i=0;i<count;i++){
      const p=particles[i];p.y=(p.y-p.speed*dt+1)%1;
      const opacity=Math.sin(p.y*Math.PI)*(.22+.22*Math.sin(now*.0005+p.phase));
      ctx.fillStyle=`rgba(255,${128+i%3*22},38,${Math.max(0,opacity)})`;
      ctx.beginPath();ctx.ellipse(canvasW*(.44+p.x*.42)+Math.sin(now*.0002+p.phase)*8,canvasH*(.16+p.y*.72),p.radius,p.radius*1.8,0,0,Math.PI*2);ctx.fill();
    }
  }
  function startEmbers(){if(!emberFrame&&!reduce.matches&&!document.hidden&&heroVisible)emberFrame=requestAnimationFrame(renderEmbers);}
  new IntersectionObserver(entries=>{heroVisible=entries[0].isIntersecting;if(heroVisible)startEmbers();else{cancelAnimationFrame(emberFrame);emberFrame=0;}},{threshold:0}).observe(hero);
  sizeCanvas();addEventListener('resize',sizeCanvas,{passive:true});startEmbers();

  /* ---------- grain and the finite opening burn ---------- */
  function mediaSource(video){if(video.src)return;video.src=video.canPlayType('video/webm; codecs="vp9"')?video.dataset.src:video.dataset.src.replace('.webm','.mp4');}
  let burnTimeout=0;
  function endBurn(){burn.classList.remove('is-playing');burn.pause();clearTimeout(burnTimeout);}
  function playBurn(withSound=false){
    if(reduce.matches)return;
    mediaSource(burn);burn.currentTime=0;burn.muted=true;
    burn.play().then(()=>{
      burn.classList.add('is-playing');
      if(withSound&&soundEnabled){if(!burnSound.src)burnSound.src='media/burn-talk-sound.mp3';burnSound.currentTime=0;burnSound.play().catch(()=>{});}
    }).catch(endBurn);
    clearTimeout(burnTimeout);burnTimeout=setTimeout(endBurn,2000);
  }
  burn.addEventListener('ended',endBurn);burn.addEventListener('error',endBurn);
  const startAtmosphere=()=>{if(reduce.matches||navigator.connection?.saveData)return;mediaSource(grain);grain.muted=true;grain.play().catch(()=>{});};

  /* ---------- sound, carried across pages by preference only ---------- */
  const remember=value=>{try{sessionStorage.setItem('inu-sound',value?'on':'off');}catch{}};
  const remembered=()=>{try{return sessionStorage.getItem('inu-sound')==='on';}catch{return false;}};
  function fadeVolume(target,complete){
    clearInterval(volumeTimer);
    const start=soundtrack.volume,started=performance.now();
    volumeTimer=setInterval(()=>{const t=clamp((performance.now()-started)/650,0,1);soundtrack.volume=start+(target-start)*t;if(t===1){clearInterval(volumeTimer);complete?.();}},35);
  }
  async function setSound(enabled,silentFail=false){
    if(audioPending)return;
    if(!enabled){
      soundEnabled=false;remember(false);
      soundButton.setAttribute('aria-pressed','false');soundButton.setAttribute('aria-label','Enable cinematic soundtrack');
      soundLabel.textContent='Sound off';fadeVolume(0,()=>soundtrack.pause());burnSound.pause();return;
    }
    audioPending=true;if(!silentFail)soundLabel.textContent='Loading';
    try{
      if(!soundtrack.src)soundtrack.src=soundtrack.dataset.src;
      soundtrack.volume=0;await soundtrack.play();
      soundEnabled=true;remember(true);
      soundButton.setAttribute('aria-pressed','true');soundButton.setAttribute('aria-label','Mute cinematic soundtrack');
      soundLabel.textContent='Sound on';fadeVolume(content.music?.volume||.32);
      if(!silentFail)playBurn(true);
      soundStatus.textContent='Cinematic soundtrack enabled.';
    }catch{
      soundEnabled=false;soundLabel.textContent='Sound off';
      if(!silentFail)soundStatus.textContent='Audio could not start. Tap Sound off to try again.';
    }finally{audioPending=false;}
  }
  soundButton.addEventListener('click',()=>setSound(!soundEnabled));
  if(document.readyState==='complete'){startAtmosphere();playBurn();if(remembered())setSound(true,true);}
  else addEventListener('load',()=>{startAtmosphere();playBurn();if(remembered())setSound(true,true);},{once:true});

  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){grain.pause();burn.pause();burnSound.pause();soundtrack.pause();cancelAnimationFrame(emberFrame);emberFrame=0;cancelAnimationFrame(frame);frame=0;}
    else{startAtmosphere();startEmbers();requestFrame();if(soundEnabled)soundtrack.play().catch(()=>setSound(false));}
  });
  reduce.addEventListener('change',()=>{
    configureScrolling();
    if(reduce.matches){document.documentElement.classList.remove('motion-ready');grain.pause();endBurn();cancelAnimationFrame(emberFrame);emberFrame=0;document.querySelectorAll('.parallax').forEach(e=>{e.style.removeProperty('--px');e.style.removeProperty('--py');});}
    else{document.documentElement.classList.add('motion-ready');startAtmosphere();startEmbers();}
    requestFrame();
  });

  /* ---------- the message form ---------- */
  const form=document.querySelector('#message-form');
  const status=document.querySelector('#form-status');
  const submit=form.querySelector('button[type=submit]');
  const submitLabel=submit.querySelector('.cta-label');
  const idle=submitLabel.textContent;
  const emailPattern=/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

  for(const field of form.querySelectorAll('.field')){
    const control=field.querySelector('input,textarea');
    const sync=()=>field.classList.toggle('is-filled',control.value.trim()!=='');
    control.addEventListener('input',()=>{sync();if(field.classList.contains('is-invalid'))validate(field,true);});
    control.addEventListener('blur',()=>{sync();if(control.value.trim()!=='')validate(field,true);});
    sync();
  }
  function validate(field,quiet){
    const control=field.querySelector('input,textarea');
    const error=field.querySelector('.field-error');
    const value=control.value.trim();
    let message='';
    if(control.required&&!value)message=`${control.dataset.label} is required`;
    else if(control.type==='email'&&value&&!emailPattern.test(value))message='Enter a valid email address';
    field.classList.toggle('is-invalid',Boolean(message));
    control.setAttribute('aria-invalid',message?'true':'false');
    error.textContent=message;
    if(message&&!quiet)control.focus({preventScroll:false});
    return !message;
  }
  function setStatus(text,tone){
    status.className=`form-status${tone?' is-'+tone:''}`;
    status.innerHTML=text;
  }
  form.addEventListener('submit',async event=>{
    event.preventDefault();
    const fields=[...form.querySelectorAll('.field')];
    let firstBad=null;
    for(const field of fields)if(!validate(field,true)&&!firstBad)firstBad=field;
    if(firstBad){setStatus('Please check the highlighted fields.','bad');firstBad.querySelector('input,textarea').focus();return;}

    submit.disabled=true;submitLabel.textContent=content.message.sending;
    setStatus('','');
    const payload=Object.fromEntries(new FormData(form).entries());
    try{
      const response=await fetch(content.endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      if(!response.ok)throw new Error(String(response.status));
      form.reset();
      fields.forEach(f=>f.classList.remove('is-filled','is-invalid'));
      setStatus(content.message.success,'good');
    }catch{
      const address=content.fallbackEmail;
      setStatus(`${content.message.failure} <a href="mailto:${address}">${address}</a>`,'bad');
    }finally{
      submit.disabled=false;submitLabel.textContent=idle;
    }
  });
})();
