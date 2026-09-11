(() => {
 'use strict';
 const grid=document.querySelector('#project-grid');
 const cards=[...grid.querySelectorAll('.folio-card')];
 const filters=[...document.querySelectorAll('[data-filter]')];
 const count=document.querySelector('#project-count');
 const previous=document.querySelector('#folio-prev'),next=document.querySelector('#folio-next');
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');
 let active='all',frame=0;
 document.documentElement.classList.add('portfolio-enhanced');
 const visible=()=>cards.filter(card=>!card.hidden);
 function updateRail(){frame=0;previous.disabled=grid.scrollLeft<2;next.disabled=grid.scrollLeft>=grid.scrollWidth-grid.clientWidth-2;}
 function filterProjects(button){
   if(button.dataset.filter===active)return;
   active=button.dataset.filter;
   filters.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
   grid.classList.toggle('is-filtered',active!=='all');
   cards.forEach(card=>{card.hidden=active!=='all'&&!card.dataset.tags.split(' ').includes(active);});
   const shown=visible();
   shown.forEach((card,i)=>{card.classList.add('is-visible');if(!reduce.matches)card.animate([{opacity:0,transform:'translateY(12px)'},{opacity:1,transform:'translateY(0)'}],{duration:550,delay:Math.min(i,5)*45,easing:'cubic-bezier(.22,1,.36,1)'});});
   grid.scrollTo({left:0,behavior:'instant'});
   count.textContent=`${shown.length} ${shown.length===1?'project':'projects'}${active==='all'?'':' · '+button.textContent}`;
   // The shared parallax engine caches section geometry. Filtering changes height.
   dispatchEvent(new Event('resize'));
   updateRail();
 }
 filters.forEach(button=>button.addEventListener('click',()=>filterProjects(button)));
 function move(direction){const card=visible()[0];if(!card)return;const distance=card.getBoundingClientRect().width+(parseFloat(getComputedStyle(grid).columnGap)||10);grid.scrollBy({left:distance*direction,behavior:reduce.matches?'instant':'smooth'});}
 previous.addEventListener('click',()=>move(-1));next.addEventListener('click',()=>move(1));
 grid.addEventListener('keydown',e=>{if(innerWidth>700||!['ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();move(e.key==='ArrowRight'?1:-1);});
 grid.addEventListener('scroll',()=>{if(!frame)frame=requestAnimationFrame(updateRail);},{passive:true});
 addEventListener('resize',updateRail,{passive:true});updateRail();
 // Pause finite scene animations when they are no longer visible.
 new IntersectionObserver(entries=>entries.forEach(({target,isIntersecting})=>{target.querySelectorAll('.hero-person,.folio-workstation img,.folio-aura').forEach(el=>el.style.animationPlayState=isIntersecting&&!document.hidden?'running':'paused');})).observe(document.querySelector('.folio-hero'));
 document.addEventListener('visibilitychange',()=>{document.querySelectorAll('.hero-person,.folio-workstation img,.folio-aura').forEach(el=>el.style.animationPlayState=document.hidden?'paused':'running');});
})();
