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

  /* ---------- the studio map -----------------------------------------------
     This used to be raster tiles with one long CSS filter dropped over them,
     which is a grey map wearing a costume: every road the same colour, the
     middle crushed to black by brightness(.5), and 256px labels upscaled into
     mush on any retina screen.

     It is vector tiles now (OpenFreeMap / OpenMapTiles, no key), drawn through
     our own style in map-style.json. Road class becomes heat -- motorways run
     at the studio's orange, each step down the hierarchy cools and narrows --
     and the labels are SDF text, so they stay sharp at any pixel density and
     at any zoom.

     MapLibre is a few hundred kilobytes, so it is not loaded until the map is
     actually about to come on screen. Wheel zoom stays off so the page never
     loses the scroll; drag, pinch and the +/- do the work. */
  const mapHost=document.querySelector('[data-studio-map]');
  if(mapHost){
    const lat=parseFloat(mapHost.dataset.lat),lng=parseFloat(mapHost.dataset.lng);
    const zoom=parseFloat(mapHost.dataset.zoom)||15;
    let started=false;

    const start=async()=>{
      if(started)return;started=true;
      try{
        const {Map:MLMap,Marker,NavigationControl}=await import('/vendor/maplibre-gl.mjs');
        const map=new MLMap({
          container:mapHost.querySelector('.studio-map__canvas'),
          style:mapHost.dataset.style,
          center:[lng,lat],zoom,minZoom:11,maxZoom:18,
          scrollZoom:false,attributionControl:{compact:false},
          dragRotate:false,pitchWithRotate:false,touchZoomRotate:true,
          fadeDuration:180
        });
        map.touchZoomRotate.disableRotation();
        map.addControl(new NavigationControl({showCompass:false}),'top-left');

        const dot=document.createElement('span');
        dot.className='studio-pin';
        dot.innerHTML='<i></i><i></i>';
        new Marker({element:dot}).setLngLat([lng,lat]).addTo(map);

        /* The warm lamp is anchored to the studio, not to the middle of the
           box, so panning carries the light with the pin instead of leaving a
           bright hole in the centre of the frame. */
        const lamp=()=>{
          const point=map.project([lng,lat]);
          mapHost.style.setProperty('--lamp-x',`${Math.round(point.x)}px`);
          mapHost.style.setProperty('--lamp-y',`${Math.round(point.y)}px`);
        };
        map.on('move',lamp);map.on('resize',lamp);
        map.on('load',()=>{lamp();mapHost.classList.add('is-live');});
        // The hint is only useful until they have moved it once.
        map.on('movestart',()=>mapHost.classList.add('is-touched'));
        map.on('error',e=>{if(!mapHost.classList.contains('is-live'))mapHost.classList.add('is-flat');console.warn('studio map',e&&e.error);});
      }catch(error){
        // No WebGL, or the tiles are unreachable: the address card and the
        // Open-in-Maps link underneath still do the job.
        mapHost.classList.add('is-flat');
        console.warn('studio map unavailable',error);
      }
    };

    if('IntersectionObserver' in window){
      const watch=new IntersectionObserver(entries=>{
        if(entries[0].isIntersecting){watch.disconnect();start();}
      },{rootMargin:'300px 0px'});
      watch.observe(mapHost);
    }else start();
  }
})();
