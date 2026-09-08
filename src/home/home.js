const menuButton = document.querySelector('.menu-toggle');
const mobileNav = document.querySelector('#mobile-nav');
function closeMenu(){menuButton.setAttribute('aria-expanded','false');menuButton.setAttribute('aria-label','Open menu');mobileNav.hidden=true;}
menuButton.addEventListener('click',()=>{const open=menuButton.getAttribute('aria-expanded')!=='true';menuButton.setAttribute('aria-expanded',String(open));menuButton.setAttribute('aria-label',open?'Close menu':'Open menu');mobileNav.hidden=!open;});
mobileNav.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu();});
document.addEventListener('click',e=>{if(!e.target.closest('.header'))closeMenu();});
const services=[
 ['Strategy & consulting','Ideas with direction.',['Brand strategy & positioning','Audience insights','Campaign planning','Content strategy']],
 ['Content & production','Stories that move.',['Branded films & video production','Photography','Video editing, VFX & CGI','Short-form & social content']],
 ['Design & branding','Visuals that speak.',['Brand identity','Graphic design','Motion design','Campaign creative']],
 ['Digital & performance','Growth that scales.',['Social media marketing','Google & Meta Ads','Performance campaigns','Lead generation']],
 ['PR & ORM','Reputation that lasts.',['Film & entertainment PR','Media outreach','Influencer collaborations','Online reputation management']],
 ['Web & tech solutions','Digital experiences.',['Website design & development','UI & UX design','Landing pages','Website maintenance']]
];
const projects=[['Martin','Movie marketing','martin'],['Vrindavan Anthem','Music campaign','vrindavan'],['Lodha','Brand campaign','lodha'],['Maa Thi Toh Baat Thi','Song promotion','maa'],['Aerobott','Tech branding','aerobott']];
const dialog=document.querySelector('#detail-dialog');
const content=document.querySelector('#dialog-content');
const talk='<a class="pill" href="https://www.instagram.com/inumedia.agency/" target="_blank" rel="noopener noreferrer">Let’s talk <span aria-hidden="true">→</span></a>';
function showDialog(html){content.innerHTML=html;if(!dialog.open)dialog.showModal();}
function showService(index){const s=services[index];showDialog(`<p class="eyebrow">What we do / 0${index+1}</p><h2 id="dialog-title">${s[0]}</h2><p>${s[1]}</p><ul>${s[2].map(t=>`<li>${t}</li>`).join('')}</ul>${talk}`);}
document.querySelectorAll('[data-service]').forEach(b=>b.addEventListener('click',()=>showService(Number(b.dataset.service))));
document.querySelector('#explore-services').addEventListener('click',()=>{showDialog(`<p class="eyebrow">Full-service creative media</p><h2 id="dialog-title">Everything your<br>brand needs.</h2><div class="dialog-service-list">${services.map((s,i)=>`<button data-detail="${i}">${s[0]} <span>→</span></button>`).join('')}</div>`);content.querySelectorAll('[data-detail]').forEach(b=>b.addEventListener('click',()=>showService(Number(b.dataset.detail))));});
function showWork(index){const p=projects[index];showDialog(`<img class="dialog-project-image" src="home-assets/${p[2]}.webp" alt="${p[0]}"><p class="eyebrow">Featured work / ${p[1]}</p><h2 id="dialog-title">${p[0]}</h2><p>Let’s talk about a ${p[1].toLowerCase()} project for your brand.</p>${talk}`);}
document.querySelectorAll('[data-work]').forEach(b=>b.addEventListener('click',()=>showWork(Number(b.dataset.work))));
document.querySelector('#view-portfolio').addEventListener('click',()=>{showDialog(`<p class="eyebrow">Featured work</p><h2 id="dialog-title">Real brands.<br>Real results.</h2><div class="dialog-service-list">${projects.map((p,i)=>`<button data-project="${i}">${p[0]} <span>→</span></button>`).join('')}</div>`);content.querySelectorAll('[data-project]').forEach(b=>b.addEventListener('click',()=>showWork(Number(b.dataset.project))));});
document.querySelector('.dialog-close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
const track=document.querySelector('#work-track');
let projectOffset=0;
function moveProjects(direction){if(track.scrollWidth>track.clientWidth+4){const amount=track.querySelector('.work-card').getBoundingClientRect().width+11;const max=track.scrollWidth-track.clientWidth;const target=direction>0&&track.scrollLeft>=max-5?0:direction<0&&track.scrollLeft<=5?max:track.scrollLeft+direction*amount;track.scrollTo({left:target,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}else{if(direction>0)track.append(track.firstElementChild);else track.prepend(track.lastElementChild);projectOffset=(projectOffset+direction+projects.length)%projects.length;document.querySelector('#carousel-status').textContent=`${projects[projectOffset][0]} is the first project.`;}}
document.querySelector('#previous-work').addEventListener('click',()=>moveProjects(-1));
document.querySelector('#next-work').addEventListener('click',()=>moveProjects(1));
