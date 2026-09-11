(() => {
  'use strict';
  const content = JSON.parse(document.querySelector('#site-content').textContent);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(pointer: fine)');
  const menuButton = document.querySelector('.menu-toggle');
  const mobileNav = document.querySelector('#mobile-nav');
  const header = document.querySelector('.header');
  const dialog = document.querySelector('#detail-dialog');
  const dialogContent = document.querySelector('#dialog-content');
  const track = document.querySelector('#work-track');
  const hero = document.querySelector('.hero');
  const character = document.querySelector('.character-reveal');
  const grain = document.querySelector('#film-grain');
  const burn = document.querySelector('#film-burn');
  const soundtrack = document.querySelector('#soundtrack');
  const soundButton = document.querySelector('#sound-toggle');
  const soundLabel = document.querySelector('#sound-label');
  const soundStatus = document.querySelector('#sound-status');
  const burnSound = new Audio();
  burnSound.preload = 'none';
  burnSound.volume = 0.26;
  let soundEnabled = false, audioPending = false, volumeTimer = 0;
  let lenis = null;
  const escape = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const external = href => /^https?:/.test(href);
  const talk = () => `<a class="pill" href="${escape(content.talk.href)}"${external(content.talk.href) ? ' target="_blank" rel="noopener noreferrer"' : ''}>${escape(content.talk.label)}<span class="button-arrow" aria-hidden="true">↗</span></a>`;

  function closeMenu(){menuButton.setAttribute('aria-expanded','false');menuButton.setAttribute('aria-label','Open menu');mobileNav.hidden=true;}
  menuButton.addEventListener('click',()=>{const open=menuButton.getAttribute('aria-expanded')!=='true';menuButton.setAttribute('aria-expanded',String(open));menuButton.setAttribute('aria-label',open?'Close menu':'Open menu');mobileNav.hidden=!open;});
  mobileNav.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu();});
  document.addEventListener('click',e=>{if(!e.target.closest('.header'))closeMenu();});
  matchMedia('(max-width:700px)').addEventListener('change',closeMenu);

  function openDetails(markup){
    dialogContent.innerHTML=markup;
    if(!dialog.open){dialog.showModal();document.body.classList.add('dialog-open');lenis?.stop();}
  }
  function showService(index){const s=content.services.items[index];openDetails(`${s.art?`<img class="dialog-service-art" src="${escape(s.art)}" alt="">`:''}<p class="eyebrow">${escape(content.services.eyebrow)} / 0${index+1}</p><h2 id="dialog-title">${escape(s.title)}</h2><p>${escape(s.tagline)}</p><ul>${s.offerings.map(t=>`<li>${escape(t)}</li>`).join('')}</ul>${talk()}`);}
  function showWork(index){const p=content.portfolio.items[index];openDetails(`<img class="dialog-project-image" src="${escape(p.art || `home-assets/${p.image}`)}" alt="${escape(p.title)}"><p class="eyebrow">${escape(p.category)}</p><h2 id="dialog-title">${escape(p.title)}</h2>${talk()}`);}
  document.querySelectorAll('[data-service]').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();showService(Number(b.dataset.service));}));
  if(content.page==='services')document.documentElement.classList.add('services-enhanced');
  document.querySelectorAll('[data-work]').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();showWork(Number(b.dataset.work));}));
  document.querySelector('#explore-services')?.addEventListener('click',()=>{
    openDetails(`<p class="eyebrow">${escape(content.services.eyebrow)}</p><h2 id="dialog-title">Full-service<br><em>creative media</em></h2><div class="dialog-service-list">${content.services.items.map((s,i)=>`<button data-detail="${i}">${escape(s.title)}<span>↗</span></button>`).join('')}</div>`);
  });
  document.querySelector('#view-portfolio')?.addEventListener('click',()=>{
    openDetails(`<p class="eyebrow">${escape(content.portfolio.eyebrow)}</p><h2 id="dialog-title">Real brands.<br><em>Real results.</em></h2><div class="dialog-service-list">${content.portfolio.items.map((p,i)=>`<button data-project="${i}">${escape(p.title)}<span>↗</span></button>`).join('')}</div>`);
  });
  dialogContent.addEventListener('click',e=>{const s=e.target.closest('[data-detail]'),p=e.target.closest('[data-project]');if(s)showService(Number(s.dataset.detail));if(p)showWork(Number(p.dataset.project));});
  document.querySelector('.dialog-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>{document.body.classList.remove('dialog-open');lenis?.start();});
  dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});

  let carouselBusy=false,trackTarget=0,trackFrame=0;
  const trackMax=()=>Math.max(0,track.scrollWidth-track.clientWidth);
  function easeTrack(){
    const next=track.scrollLeft+(trackTarget-track.scrollLeft)*.18;
    if(Math.abs(trackTarget-next)<.4){trackFrame=0;track.scrollLeft=trackTarget;return;}
    // Keep a non-zero frame handle while assigning scrollLeft so the scroll
    // listener knows this is our interpolation rather than a user drag.
    trackFrame=requestAnimationFrame(easeTrack);
    track.scrollLeft=next;
  }
  function nudgeTrack(amount){
    trackTarget=clamp(trackTarget+amount,0,trackMax());
    if(!trackFrame)trackFrame=requestAnimationFrame(easeTrack);
  }
  function moveProjects(direction){
    if(carouselBusy)return;
    const gap=parseFloat(getComputedStyle(track).columnGap)||0;
    const amount=track.querySelector('.work-card').getBoundingClientRect().width+gap;
    const max=trackMax();
    if(max>4){const target=direction>0&&track.scrollLeft>=max-5?0:direction<0&&track.scrollLeft<=5?max:track.scrollLeft+direction*amount;track.scrollTo({left:target,behavior:reduce.matches?'instant':'smooth'});}
    else {
      // FLIP keeps the five-card desktop row continuous instead of snapping.
      carouselBusy=true;
      const cards=[...track.children],before=new Map(cards.map(e=>[e,e.getBoundingClientRect().left]));
      if(direction>0)track.append(track.firstElementChild);else track.prepend(track.lastElementChild);
      for(const card of cards){const delta=before.get(card)-card.getBoundingClientRect().left;if(!reduce.matches)card.animate([{transform:`translateX(${delta}px)`,opacity:Math.abs(delta)>amount*2?0:1},{transform:'translateX(0)',opacity:1}],{duration:650,easing:'cubic-bezier(.22,1,.36,1)'});}
      setTimeout(()=>carouselBusy=false,reduce.matches?0:650);
    }
    document.querySelector('#carousel-status').textContent=`Browsing ${content.portfolio.items.length} featured projects.`;
  }
  document.querySelector('#previous-work')?.addEventListener('click',()=>moveProjects(-1));
  document.querySelector('#next-work')?.addEventListener('click',()=>moveProjects(1));
  track?.addEventListener('keydown',e=>{if(e.target!==track)return;if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();moveProjects(e.key==='ArrowRight'?1:-1);}});
  track?.addEventListener('scroll',()=>{if(!trackFrame)trackTarget=track.scrollLeft;},{passive:true});
  // The rail used to borrow the vertical wheel and turn it into sideways
  // movement, which pinned the reader to this section for the length of the
  // rail whenever the cursor crossed a thumbnail. The wheel now always belongs
  // to the page; the rail moves by drag, by its arrows and by the keyboard.
  track?.addEventListener('wheel',e=>{
    if(Math.abs(e.deltaX)<=Math.abs(e.deltaY)||trackMax()<4)return;
    e.preventDefault();
    nudgeTrack(e.deltaX*.9);
  },{passive:false});

  function configureScrolling(){lenis?.destroy();lenis=null;if(!reduce.matches&&finePointer.matches&&window.Lenis){lenis=new Lenis({autoRaf:true,lerp:0.085,smoothWheel:true,syncTouch:false,anchors:content.page==='portfolio'?false:{offset:-90},prevent:node=>node.hasAttribute('data-lenis-prevent')});}}
  configureScrolling();
  finePointer.addEventListener('change',configureScrolling);
  document.querySelectorAll('a[href^="#"]').forEach(link=>link.addEventListener('click',event=>{
    const target=document.querySelector(link.getAttribute('href'));
    if(!target)return;
    event.preventDefault();
    const top=link.hash==='#home'?0:Math.max(0,target.getBoundingClientRect().top+scrollY-90);
    if(lenis){lenis.resize();lenis.scrollTo(top,{duration:1.35});}
    else window.scrollTo({top,behavior:reduce.matches?'instant':'smooth'});
    history.replaceState(null,'',link.hash);
  }));
  let frame=0,mouseX=0,mouseY=0,currentX=0,currentY=0;
  let bounds=[],documentHeight=1,heroHeight=1;
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
  function measure(){bounds=[...document.querySelectorAll('[data-scene]')].map(section=>({section,top:section.getBoundingClientRect().top+scrollY,height:section.offsetHeight,layers:[...section.querySelectorAll('.parallax')]}));documentHeight=Math.max(1,document.documentElement.scrollHeight-innerHeight);heroHeight=hero.offsetHeight;requestFrame();}
  function requestFrame(){if(!frame&&!document.hidden)frame=requestAnimationFrame(update);}
  function update(){
    frame=0;
    const y=scrollY,small=innerWidth<=700;
    header.classList.toggle('is-sticky',y>64);
    header.style.setProperty('--progress',clamp(y/documentHeight,0,1).toFixed(4));
    currentX+=(mouseX-currentX)*.045;currentY+=(mouseY-currentY)*.045;
    if(!reduce.matches){
      for(const b of bounds){if(y+innerHeight<b.top-150||y>b.top+b.height+150)continue;const distance=clamp(y-b.top,-innerHeight,b.height);for(const layer of b.layers){const depth=Number(layer.dataset.depth)||0;layer.style.setProperty('--py',`${(distance*depth*(small?.35:1)+currentY*depth*28).toFixed(2)}px`);layer.style.setProperty('--px',`${(currentX*depth*35).toFixed(2)}px`);}}
      character.style.setProperty('--character-scale',(1+clamp(y/(heroHeight*.55),0,1)*.075).toFixed(4));
    }
    if(Math.abs(mouseX-currentX)>.003||Math.abs(mouseY-currentY)>.003)requestFrame();
  }
  addEventListener('scroll',requestFrame,{passive:true});
  addEventListener('resize',measure,{passive:true});
  hero.addEventListener('pointermove',e=>{if(reduce.matches||!finePointer.matches)return;mouseX=e.clientX/innerWidth-.5;mouseY=e.clientY/innerHeight-.5;requestFrame();},{passive:true});
  hero.addEventListener('pointerleave',()=>{mouseX=mouseY=0;requestFrame();});
  document.fonts.ready.then(measure);addEventListener('load',measure,{once:true});measure();

  const flare=document.querySelector('.section-flare');
  const revealedSections=new Set();
  const revealObserver=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){entry.target.classList.add('is-visible');revealObserver.unobserve(entry.target);}},{threshold:.08,rootMargin:'0px 0px 25px 0px'});
  if(!reduce.matches){document.documentElement.classList.add('motion-ready');document.querySelectorAll('.reveal').forEach(el=>revealObserver.observe(el));}
  const sceneObserver=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting&&!revealedSections.has(entry.target)&&!reduce.matches){revealedSections.add(entry.target);flare.classList.remove('is-active');requestAnimationFrame(()=>flare.classList.add('is-active'));}}},{threshold:.24});
  document.querySelectorAll('.portfolio,.contact').forEach(el=>sceneObserver.observe(el));
  const navObserver=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){const id=scrollY<80?'home':entry.target.id||'home';document.querySelectorAll('.desktop-nav a').forEach(a=>{if(a.hash==='#'+id)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});}},{rootMargin:'-15% 0px -65% 0px'});
  if(!content.page)document.querySelectorAll('#home,#about,#services,#portfolio,#contact').forEach(el=>navObserver.observe(el));

  // Tiny abstract embers, capped at 24 fps and paused outside the hero.
  const canvas=document.querySelector('.embers'),ctx=canvas.getContext('2d',{alpha:true});
  let emberFrame=0,heroVisible=true,lastParticleTime=0,canvasW=1,canvasH=1;
  const particles=Array.from({length:content.page==='portfolio'?40:24},(_,i)=>({x:(Math.sin(i*23.1)+1)/2,y:(i*.137)%1,speed:.014+(i%4)*.004,radius:.5+(i%3)*.3,phase:i*1.7}));
  function sizeCanvas(){const r=canvas.getBoundingClientRect();const dpr=Math.min(devicePixelRatio,1.5);canvasW=r.width;canvasH=r.height;canvas.width=Math.round(r.width*dpr);canvas.height=Math.round(r.height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);}
  function renderEmbers(now){emberFrame=0;if(!heroVisible||document.hidden||reduce.matches)return;emberFrame=requestAnimationFrame(renderEmbers);if(now-lastParticleTime<1000/24)return;const dt=Math.min((now-lastParticleTime)/1000,.05);lastParticleTime=now;ctx.clearRect(0,0,canvasW,canvasH);const count=content.page==='portfolio'?(innerWidth<700?20:40):(innerWidth<700?12:24);for(let i=0;i<count;i++){const p=particles[i];p.y=(p.y-p.speed*dt+1)%1;const opacity=Math.sin(p.y*Math.PI)*(.25+.25*Math.sin(now*.0005+p.phase));ctx.fillStyle=`rgba(255,${125+i%3*24},35,${Math.max(0,opacity)})`;ctx.shadowBlur=content.page==='portfolio'?6:0;ctx.shadowColor='#ff7519';ctx.beginPath();ctx.ellipse(canvasW*(.32+p.x*.38)+Math.sin(now*.0002+p.phase)*9,canvasH*(.12+p.y*.72),p.radius,p.radius*1.8,0,0,Math.PI*2);ctx.fill();}}
  function startEmbers(){if(!emberFrame&&!reduce.matches&&!document.hidden&&heroVisible)emberFrame=requestAnimationFrame(renderEmbers);}
  new IntersectionObserver(entries=>{heroVisible=entries[0].isIntersecting;if(heroVisible)startEmbers();else{cancelAnimationFrame(emberFrame);emberFrame=0;}},{threshold:0}).observe(hero);
  sizeCanvas();addEventListener('resize',sizeCanvas,{passive:true});startEmbers();

  function mediaSource(video){if(video.src)return;video.src=video.canPlayType('video/webm; codecs="vp9"')?video.dataset.src:video.dataset.src.replace('.webm','.mp4');}
  let burnTimeout=0;
  function endBurn(){burn.classList.remove('is-playing');burn.pause();clearTimeout(burnTimeout);}
  function playBurn(withSound=false){
    if(reduce.matches||navigator.connection?.saveData)return;
    mediaSource(burn);burn.currentTime=0;burn.muted=true;
    burn.play().then(()=>{burn.classList.add('is-playing');if(withSound&&soundEnabled){if(!burnSound.src)burnSound.src=burn.dataset.soundSrc||'media/burn-sound.mp3';burnSound.currentTime=0;burnSound.play().catch(()=>{});}}).catch(endBurn);
    clearTimeout(burnTimeout);burnTimeout=setTimeout(endBurn,2200);
  }
  burn.addEventListener('ended',endBurn);burn.addEventListener('error',endBurn);
  const startAtmosphere=()=>{if(reduce.matches||navigator.connection?.saveData)return;mediaSource(grain);grain.muted=true;grain.play().catch(()=>{});};
  if(document.readyState==='complete'){startAtmosphere();playBurn();}else addEventListener('load',()=>{startAtmosphere();playBurn();},{once:true});

  function fadeVolume(target,complete){clearInterval(volumeTimer);const start=soundtrack.volume,started=performance.now();volumeTimer=setInterval(()=>{const t=clamp((performance.now()-started)/650,0,1);soundtrack.volume=start+(target-start)*t;if(t===1){clearInterval(volumeTimer);complete?.();}},35);}
  async function setSound(enabled){
    if(audioPending)return;
    if(!enabled){soundEnabled=false;soundButton.setAttribute('aria-pressed','false');soundButton.setAttribute('aria-label','Enable cinematic soundtrack');soundLabel.textContent='Sound off';fadeVolume(0,()=>soundtrack.pause());burnSound.pause();return;}
    audioPending=true;soundLabel.textContent='Loading';
    try{if(!soundtrack.src)soundtrack.src=soundtrack.dataset.src;soundtrack.volume=0;await soundtrack.play();soundEnabled=true;soundButton.setAttribute('aria-pressed','true');soundButton.setAttribute('aria-label','Mute cinematic soundtrack');soundLabel.textContent='Sound on';fadeVolume(content.music.volume||.3);playBurn(true);soundStatus.textContent='Cinematic soundtrack enabled.';}
    catch{soundEnabled=false;soundLabel.textContent='Sound off';soundStatus.textContent='Audio could not start. Tap Sound off to try again.';}
    finally{audioPending=false;}
  }
  soundButton.addEventListener('click',()=>setSound(!soundEnabled));
  document.addEventListener('visibilitychange',()=>{if(document.hidden){grain.pause();burn.pause();burnSound.pause();soundtrack.pause();cancelAnimationFrame(emberFrame);emberFrame=0;cancelAnimationFrame(frame);frame=0;}else{startAtmosphere();startEmbers();requestFrame();if(soundEnabled)soundtrack.play().catch(()=>setSound(false));}});
  reduce.addEventListener('change',()=>{configureScrolling();if(reduce.matches){document.documentElement.classList.remove('motion-ready');grain.pause();endBurn();cancelAnimationFrame(emberFrame);emberFrame=0;document.querySelectorAll('.parallax').forEach(e=>{e.style.removeProperty('--px');e.style.removeProperty('--py');});}else{startAtmosphere();startEmbers();}requestFrame();});
})();
