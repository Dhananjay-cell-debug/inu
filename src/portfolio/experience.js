(() => {
 'use strict';
 const index=[...document.querySelectorAll('[data-chapter-link]')];
 const chapters=[...document.querySelectorAll('[data-chapter]')];
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');
 document.documentElement.classList.add('portfolio-enhanced');

 /* Both sticky bars stack under the fixed header, so their real heights drive
    the offsets rather than guessed constants. */
 const header=document.querySelector('.header'),bar=document.querySelector('.content-index');
 const measure=()=>{
   const root=document.documentElement.style;
   if(header)root.setProperty('--header-h',`${Math.round(header.offsetHeight)}px`);
   if(bar)root.setProperty('--index-h',`${Math.round(bar.offsetHeight)}px`);
 };
 measure();addEventListener('resize',measure,{passive:true});
 const offset=()=>(header?.offsetHeight||0)+(bar?.offsetHeight||0);

 /* The index follows whichever chapter the reader is actually inside: the
    last one whose top has passed just under the sticky bars. */
 if(index.length&&chapters.length){
  const mark=id=>index.forEach(link=>link.classList.toggle('is-active',link.dataset.chapterLink===id));
  let frame=0;
  const sync=()=>{
    frame=0;
    const line=offset()+24;
    let current=chapters[0];
    for(const chapter of chapters)if(chapter.getBoundingClientRect().top<=line)current=chapter;
    mark(current.dataset.chapter);
  };
  addEventListener('scroll',()=>{if(!frame)frame=requestAnimationFrame(sync);},{passive:true});
  addEventListener('resize',sync,{passive:true});
  sync();
  // Anchor jumps have to clear both sticky bars, which Lenis is not managing here.
  index.forEach(link=>link.addEventListener('click',event=>{
    const target=document.querySelector(link.getAttribute('href'));
    if(!target)return;
    event.preventDefault();
    scrollTo({top:target.getBoundingClientRect().top+scrollY-offset()-18,behavior:reduce.matches?'instant':'smooth'});
  }));
 }

 /* A rail pauses under the cursor via CSS; keyboard users pause it too, and
    tabbing into a card must not leave it sliding out from under them. */
 chapters.forEach(chapter=>{
  const rail=chapter.querySelector('.content-rail');
  if(!rail)return;
  rail.addEventListener('focusin',()=>rail.classList.add('is-paused'));
  rail.addEventListener('focusout',()=>rail.classList.remove('is-paused'));
 });

 /* Find one project without hunting through six chapters. Selecting a result
    jumps to its chapter, winds that rail to the card and rings it briefly. */
 const box=document.querySelector('#project-search');
 const results=document.querySelector('#project-search-results');
 const clear=document.querySelector('.folio-search-clear');
 if(box&&results){
  const entries=[...document.querySelectorAll('.folio-card:not([data-marquee-clone])')].map(card=>{
    const chapter=card.closest('[data-chapter]');
    return {
      card, chapter,
      title:card.querySelector('strong')?.textContent||'',
      subtitle:card.querySelector('.folio-card-subtitle')?.textContent||'',
      category:card.querySelector('.folio-card-category')?.textContent||'',
      chapterName:chapter?.querySelector('.studio-row__title h3')?.textContent.replace(/\s+/g,' ')||''
    };
  });
  // A project sits in more than one chapter; offer it once.
  const seen=new Set();
  const unique=entries.filter(e=>{const key=e.title+e.subtitle;if(seen.has(key))return false;seen.add(key);return true;});
  let active=-1,shown=[];

  const close=()=>{results.hidden=true;box.setAttribute('aria-expanded','false');active=-1;};
  const reveal=entry=>{
    close();
    const top=entry.chapter.getBoundingClientRect().top+scrollY-offset()-18;
    scrollTo({top,behavior:reduce.matches?'instant':'smooth'});
    entry.chapter.querySelector('.content-rail')?.jumpTo?.(entry.card);
    document.querySelectorAll('.folio-card.is-found').forEach(c=>c.classList.remove('is-found'));
    entry.card.classList.add('is-found');
    setTimeout(()=>entry.card.classList.remove('is-found'),2600);
  };
  const render=()=>{
    const query=box.value.trim().toLowerCase();
    clear.hidden=!query;
    if(!query){close();results.innerHTML='';return;}
    shown=unique.filter(e=>`${e.title} ${e.subtitle} ${e.category} ${e.chapterName}`.toLowerCase().includes(query)).slice(0,8);
    results.innerHTML=shown.length
      ? shown.map((e,i)=>`<li role="option" aria-selected="false"><button type="button" data-result="${i}">${e.title}${e.subtitle?` <em>${e.subtitle}</em>`:''}<em>${e.chapterName}</em></button></li>`).join('')
      : '<li class="folio-search-empty">No project matches that yet.</li>';
    results.hidden=false;box.setAttribute('aria-expanded','true');active=-1;
  };
  const move=step=>{
    const buttons=[...results.querySelectorAll('button')];
    if(!buttons.length)return;
    active=(active+step+buttons.length)%buttons.length;
    buttons.forEach((b,i)=>b.classList.toggle('is-active',i===active));
    buttons[active].scrollIntoView({block:'nearest'});
  };
  // '/' anywhere on the page jumps to the search, as the hint promises.
  addEventListener('keydown',event=>{
    if(event.key!=='/'||event.metaKey||event.ctrlKey||event.altKey)return;
    const tag=(event.target.tagName||'').toLowerCase();
    if(tag==='input'||tag==='textarea'||event.target.isContentEditable)return;
    event.preventDefault();
    box.focus();
    box.scrollIntoView({block:'center',behavior:reduce.matches?'instant':'smooth'});
  });
  box.addEventListener('input',render);
  box.addEventListener('focus',()=>{if(box.value.trim())render();});
  box.addEventListener('keydown',event=>{
    if(event.key==='ArrowDown'){event.preventDefault();move(1);}
    else if(event.key==='ArrowUp'){event.preventDefault();move(-1);}
    else if(event.key==='Enter'){event.preventDefault();if(shown[active===-1?0:active])reveal(shown[active===-1?0:active]);}
    else if(event.key==='Escape'){box.value='';render();}
  });
  results.addEventListener('click',event=>{
    const button=event.target.closest('[data-result]');
    if(button)reveal(shown[Number(button.dataset.result)]);
  });
  clear.addEventListener('click',()=>{box.value='';render();box.focus();});
  document.addEventListener('pointerdown',event=>{if(!event.target.closest('.folio-search'))close();});
 }

 /* Pause finite scene animations when they are no longer visible. */
 const hero=document.querySelector('.folio-hero');
 const scenery=()=>document.querySelectorAll('.hero-person,.folio-workstation img,.folio-aura');
 if(hero)new IntersectionObserver(entries=>entries.forEach(({isIntersecting})=>{
   scenery().forEach(el=>el.style.animationPlayState=isIntersecting&&!document.hidden?'running':'paused');
 })).observe(hero);
 document.addEventListener('visibilitychange',()=>{
   scenery().forEach(el=>el.style.animationPlayState=document.hidden?'paused':'running');
 });
})();
