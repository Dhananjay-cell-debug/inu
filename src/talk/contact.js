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
})();
