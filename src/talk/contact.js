(() => {
  'use strict';
  const reduce=matchMedia('(prefers-reduced-motion: reduce)');
  const stage=document.querySelector('.contact-stage');
  const listener=stage.querySelector('.scene-listener');
  const speaker=stage.querySelector('.scene-speaker');
  const wire=stage.querySelector('.conversation-wire path');
  // The attachment points are measured in each ORIGINAL cutout's normalized
  // coordinates. A common SVG/scene coordinate system keeps the string attached
  // across both responsive compositions. Never independently parallax the cans.
  function attachWire(){
    const w=stage.clientWidth,h=stage.clientHeight;
    const x1=(listener.offsetLeft+listener.offsetWidth*.671)/w*1600;
    const y1=(listener.offsetTop+listener.offsetHeight*.170)/h*900;
    const x2=(speaker.offsetLeft+speaker.offsetWidth*.295)/w*1600;
    const y2=(speaker.offsetTop+speaker.offsetHeight*.305)/h*900;
    const sag=Math.max(y1,y2)+120;
    wire.setAttribute('d',`M ${x1.toFixed(2)},${y1.toFixed(2)} C ${(x1+190).toFixed(2)},${sag.toFixed(2)} ${(x2-170).toFixed(2)},${sag.toFixed(2)} ${x2.toFixed(2)},${y2.toFixed(2)}`);
  }
  const resize=new ResizeObserver(attachWire);resize.observe(stage);resize.observe(listener);resize.observe(speaker);
  stage.querySelectorAll('img').forEach(img=>img.addEventListener('load',attachWire,{once:true}));attachWire();
  // A short, shared settle after the connection is drawn; no continuous drift.
  if(!reduce.matches&&!navigator.connection?.saveData){
    stage.querySelector('.scene-cast').animate([{transform:'translateY(0)'},{transform:'translateY(-3px)'},{transform:'translateY(0)'}],{duration:1700,delay:4100,easing:'ease-in-out',iterations:1});
  }
  const form=document.querySelector('#message-form'),message=document.querySelector('#field-message'),counter=document.querySelector('#message-count');
  const count=()=>counter.textContent=`${message.value.length} / ${message.maxLength}`;
  message.addEventListener('input',count);form.addEventListener('contact-reset',count);count();
  // E.164 allows 15 digits in total, so the country code eats into the
  // number's budget rather than sitting outside it.
  const dial=document.querySelector('#field-dial'),phone=document.querySelector('#field-phone');
  if(dial&&phone){
    const cap=()=>{const used=dial.value.replace(/\D/g,'').length;
      phone.maxLength=Math.max(4,15-used);
      if(phone.value.length>phone.maxLength)phone.value=phone.value.slice(0,phone.maxLength);};
    phone.addEventListener('input',()=>{
      const digits=phone.value.replace(/\D/g,'').slice(0,phone.maxLength);
      if(digits!==phone.value)phone.value=digits;});
    dial.addEventListener('change',cap);cap();
  }

  // A map you can actually move around in, without leaving the page. Wheel zoom
  // is off so the page never loses the scroll; drag, pinch and the +/- do the work.
  const mapHost=document.querySelector('[data-studio-map]');
  if(mapHost&&window.L){
    const lat=parseFloat(mapHost.dataset.lat),lng=parseFloat(mapHost.dataset.lng);
    const zoom=parseInt(mapHost.dataset.zoom,10)||15;
    const map=L.map(mapHost.querySelector('.studio-map__canvas'),{
      center:[lat,lng],zoom,minZoom:12,maxZoom:18,
      zoomControl:true,scrollWheelZoom:false,dragging:true,touchZoom:true,
      doubleClickZoom:true,keyboard:true,attributionControl:true
    });
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{
      maxZoom:19,crossOrigin:true,
      attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'
    }).addTo(map);
    const pin=L.divIcon({className:'studio-pin',html:'<i></i><i></i>',iconSize:[16,16],iconAnchor:[8,8]});
    L.marker([lat,lng],{icon:pin,keyboard:false,alt:'INU Media studio'}).addTo(map);
    map.whenReady(()=>mapHost.classList.add('is-live'));
    // The hint is only useful until they have moved it once.
    map.on('movestart zoomstart',()=>mapHost.classList.add('is-touched'),{once:true});
    new ResizeObserver(()=>map.invalidateSize()).observe(mapHost);
  }
})();
