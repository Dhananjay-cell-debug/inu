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

 /* Arrow buttons and keyboard paging for each rail; dragging is handled by
    the shared atmosphere layer. */
 chapters.forEach(chapter=>{
  const rail=chapter.querySelector('.content-rail');
  const previous=chapter.querySelector('[data-rail-prev]'),next=chapter.querySelector('[data-rail-next]');
  if(!rail)return;
  const step=()=>{
    const card=rail.querySelector('.folio-card');
    const gap=parseFloat(getComputedStyle(rail.querySelector('.content-rail__track')).columnGap)||14;
    return (card?card.getBoundingClientRect().width:260)+gap;
  };
  const sync=()=>{
    if(!previous||!next)return;
    const max=rail.scrollWidth-rail.clientWidth;
    previous.disabled=rail.scrollLeft<2;
    next.disabled=rail.scrollLeft>=max-2;
  };
  const move=direction=>rail.scrollBy({left:step()*direction,behavior:reduce.matches?'instant':'smooth'});
  previous?.addEventListener('click',()=>move(-1));
  next?.addEventListener('click',()=>move(1));
  rail.addEventListener('keydown',event=>{
    if(!['ArrowLeft','ArrowRight'].includes(event.key))return;
    event.preventDefault();move(event.key==='ArrowRight'?1:-1);
  });
  let frame=0;
  rail.addEventListener('scroll',()=>{if(!frame)frame=requestAnimationFrame(()=>{frame=0;sync();});},{passive:true});
  addEventListener('resize',sync,{passive:true});
  sync();
 });

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
