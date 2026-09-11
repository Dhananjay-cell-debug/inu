/* ==========================================================================
   Atmosphere behaviour, shared by every page.

   The scroll maths that drives the fluid field is paparazzientertainment.in's
   (app.js, updateScroll); the drag-to-scrub rail is paparazzi.krildigital.com's
   enableDragScroll (movies.js) unchanged; the consent model — four categories,
   one locked, a versioned record that lapses after a year — is
   welcome-woods.vercel.app's.
   ========================================================================== */
(() => {
  'use strict';
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lowPowerDevice = matchMedia('(max-width: 900px), (pointer: coarse)').matches;

  /* --- Fluid field drift, their loop unchanged --------------------------- */
  const fields = [...document.querySelectorAll('.fluid-section')];
  if (fields.length && !reduceMotion && !lowPowerDevice) {
    let ticking = false;
    const updateFields = () => {
      ticking = false;
      fields.forEach((section, i) => {
        const rect = section.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > innerHeight) return;
        const local = (innerHeight - rect.top) / (innerHeight + rect.height);
        section.style.setProperty('--section-y', `${(local - .5) * 85}px`);
        section.style.setProperty('--section-x', `${(local - .5) * (i % 2 ? -45 : 45)}px`);
        section.style.setProperty('--section-grid', `${(local - .5) * 24}px`);
      });
    };
    const requestFields = () => { if (!ticking) { ticking = true; requestAnimationFrame(updateFields); } };
    addEventListener('scroll', requestFields, { passive: true });
    addEventListener('resize', requestFields, { passive: true });
    updateFields();
  }

  /* --- Click-and-drag scrubbing on horizontal rails ----------------------
     Verbatim from paparazzi.krildigital.com/movies/movies.js: mouse only, so
     touch keeps native momentum, and a real drag swallows the click so a card
     doesn't navigate when you were only pushing the rail along. */
  function enableDragScroll(el) {
    if (!el) return;
    let down = false, startX = 0, startLeft = 0, moved = false;
    el.addEventListener('mousedown', e => {
      if (e.button !== 0) return;
      down = true; moved = false;
      startX = e.clientX; startLeft = el.scrollLeft;
    });
    document.addEventListener('mousemove', e => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 6) { moved = true; el.classList.add('dragging'); }
      if (moved) { el.scrollLeft = startLeft - dx; e.preventDefault(); }
    });
    document.addEventListener('mouseup', () => {
      if (!down) return;
      down = false;
      setTimeout(() => el.classList.remove('dragging'), 0);
    });
    el.addEventListener('click', e => {
      if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; }
    }, true);
    el.addEventListener('dragstart', e => e.preventDefault());
    /* No wheel handler on purpose. The rails carry data-lenis-prevent, so Lenis
       leaves their wheel events alone and the browser's own scroll chaining
       does the right thing: sideways inside the rail, vertical on to the page.
       Anything that calls preventDefault here traps the reader the moment the
       cursor crosses a thumbnail. */
  }
  document.querySelectorAll('[data-drag-rail]').forEach(enableDragScroll);

  /* --- Light 3D response on poster cards, theirs verbatim ---------------- */
  if (!reduceMotion && matchMedia('(pointer:fine)').matches) {
    document.querySelectorAll('[data-tilt]').forEach(card => {
      card.addEventListener('pointermove', event => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - .5;
        const y = (event.clientY - rect.top) / rect.height - .5;
        card.style.setProperty('--card-y', `${x * 5.5}deg`);
        card.style.setProperty('--card-x', `${y * -5.5}deg`);
      }, { passive: true });
      card.addEventListener('pointerleave', () => {
        card.style.setProperty('--card-y', '0deg');
        card.style.setProperty('--card-x', '0deg');
      });
    });
  }

  /* --- Consent ----------------------------------------------------------- */
  const STORE = 'inu-consent', VERSION = 1, DAYS = 365;
  const CATEGORIES = [
    { id: 'essential', locked: true },
    { id: 'functional', locked: false },
    { id: 'analytics', locked: false },
    { id: 'marketing', locked: false }
  ];
  const optional = CATEGORIES.filter(c => !c.locked).map(c => c.id);
  const noneChosen = () => ({ essential: true, ...Object.fromEntries(optional.map(id => [id, false])) });
  const allChosen = () => ({ essential: true, ...Object.fromEntries(optional.map(id => [id, true])) });

  function readRecord() {
    let raw = null;
    try { raw = localStorage.getItem(STORE); } catch { return null; }
    if (!raw) return null;
    let record = null;
    try { record = JSON.parse(raw); } catch { return null; }
    if (!record || record.version !== VERSION || !record.choices) return null;
    if (Date.now() - (record.at || 0) > DAYS * 24 * 60 * 60 * 1000) return null;
    return record;
  }
  const currentChoices = () => readRecord()?.choices || noneChosen();
  function store(choices) {
    const record = { version: VERSION, at: Date.now(), choices: { ...noneChosen(), ...choices, essential: true } };
    try { localStorage.setItem(STORE, JSON.stringify(record)); } catch { /* private mode: honour for this visit only */ }
    document.documentElement.dataset.consent = optional.filter(id => record.choices[id]).join(' ') || 'essential';
    dispatchEvent(new CustomEvent('inu:consent', { detail: record.choices }));
  }

  const bar = document.querySelector('.cookie-bar');
  const panel = document.querySelector('.cookie-panel');
  if (bar && panel) {
    const switches = [...panel.querySelectorAll('.cookie-switch')];
    let draft = currentChoices();
    let opener = null;

    const paintSwitches = () => switches.forEach(button => {
      const id = button.dataset.category, on = id === 'essential' || draft[id];
      button.classList.toggle('is-on', !!on);
      button.setAttribute('aria-checked', String(!!on));
    });

    const showBar = show => {
      bar.classList.toggle('is-visible', show);
      bar.inert = !show;
      if (show) bar.removeAttribute('aria-hidden'); else bar.setAttribute('aria-hidden', 'true');
      // Keep the sound toggle clear of the bar, the way their offset var does.
      document.documentElement.style.setProperty('--cookie-offset', show ? `${bar.offsetHeight}px` : '0px');
    };

    const settle = choices => { store(choices); showBar(false); closePanel(); };

    function openPanel() {
      opener = document.activeElement;
      draft = currentChoices();
      paintSwitches();
      document.body.style.overflow = 'hidden';
      panel.showModal();
    }
    function closePanel() {
      if (!panel.open) return;
      panel.close();
      document.body.style.overflow = '';
      opener?.focus?.({ preventScroll: true });
    }

    switches.forEach(button => button.addEventListener('click', () => {
      const id = button.dataset.category;
      if (id === 'essential') return;
      draft = { ...draft, [id]: !draft[id] };
      paintSwitches();
    }));

    panel.addEventListener('cancel', e => { e.preventDefault(); closePanel(); });
    panel.addEventListener('click', e => { if (e.target === panel) closePanel(); });
    panel.querySelector('.cookie-panel-close')?.addEventListener('click', closePanel);

    document.querySelectorAll('[data-consent-open]').forEach(el => el.addEventListener('click', e => { e.preventDefault(); openPanel(); }));
    document.querySelectorAll('[data-consent-choose]').forEach(el => el.addEventListener('click', openPanel));
    document.querySelectorAll('[data-consent-reject]').forEach(el => el.addEventListener('click', () => settle(noneChosen())));
    document.querySelectorAll('[data-consent-accept]').forEach(el => el.addEventListener('click', () => settle(allChosen())));
    document.querySelectorAll('[data-consent-save]').forEach(el => el.addEventListener('click', () => settle(draft)));

    const decided = readRecord() !== null;
    if (decided) {
      document.documentElement.dataset.consent = optional.filter(id => currentChoices()[id]).join(' ') || 'essential';
      showBar(false);
    } else {
      // Let the entry burn play out before asking anything.
      setTimeout(() => showBar(true), 1400);
    }
    if (typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(([entry]) => {
        if (bar.classList.contains('is-visible')) document.documentElement.style.setProperty('--cookie-offset', `${Math.round(entry.contentRect.height + 2)}px`);
      }).observe(bar);
    }
  }
})();
