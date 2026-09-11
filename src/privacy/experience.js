(() => {
 'use strict';
 const links=[...document.querySelectorAll('[data-legal-link]')];
 const articles=[...document.querySelectorAll('.legal-articles article')];
 if(!links.length||!articles.length)return;
 const mark=id=>links.forEach(link=>link.classList.toggle('is-active',link.dataset.legalLink===id));
 const observer=new IntersectionObserver(entries=>{
   const seen=entries.filter(e=>e.isIntersecting).sort((a,b)=>a.boundingClientRect.top-b.boundingClientRect.top)[0];
   if(seen)mark(seen.target.id);
 },{rootMargin:'-12% 0px -70% 0px',threshold:0});
 articles.forEach(article=>observer.observe(article));
 mark(articles[0].id);
})();
