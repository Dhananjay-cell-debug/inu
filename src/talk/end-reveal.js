/* The post-footer reveal is a curtain call: once it owns the screen the fixed
   header has nothing left to navigate and is simply sitting on the artwork —
   on the contact plate it lands squarely across the face at the top of the
   frame. So the chrome steps aside while the reveal is showing, and comes
   straight back the moment you scroll off it. */
(() => {
  'use strict';
  const reveal = document.querySelector('.end-reveal');
  if (!reveal || !('IntersectionObserver' in window)) return;
  const root = document.documentElement;
  new IntersectionObserver(([entry]) => {
    root.classList.toggle('curtain-up', entry.intersectionRatio > 0.34);
  }, { threshold: [0, 0.34, 0.36, 1] }).observe(reveal);
})();
