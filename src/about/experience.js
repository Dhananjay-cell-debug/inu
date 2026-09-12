/* About only adds what the shared experience cannot know about: the warm
   flare that other pages fire on their scene sections, and a reveal for the
   hand-written notes that survives the shared `.reveal` observer. */
(() => {
  'use strict';
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const flare = document.querySelector('.section-flare');
  if (!flare) return;
  const fired = new WeakSet();
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting || fired.has(entry.target)) continue;
      fired.add(entry.target);
      flare.classList.remove('is-active');
      requestAnimationFrame(() => flare.classList.add('is-active'));
    }
  }, { threshold: 0.24 });
  document.querySelectorAll('.about-founder,.about-philosophy').forEach(el => observer.observe(el));
})();
