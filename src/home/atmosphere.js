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

  /* --- Rails ------------------------------------------------------------
     A rail is a bounded row, not an endless marquee: it rests flush with its
     first card and stops dead on the last one, so there is never a strip of
     empty page trailing the work and never a first thumbnail already half cut
     off by the time you scroll to it. It stays out of the browser's scroll
     machinery (that is what stops a thumbnail trapping the wheel) and is driven
     from one rAF loop that goes quiet as soon as nothing is moving. */
  const rails = [...document.querySelectorAll('.content-rail')];
  // ?rails=off / ?rails=static isolate this layer when the page is misbehaving.
  const railMode = new URLSearchParams(location.search).get('rails');
  const setupRail = rail => {
    // Re-entrant on every resize: it must never attach a second set of
    // listeners or start a second rAF loop, or the loops multiply until the
    // main thread is spending all its time painting the same rail.
    if (rail.relayout) { rail.relayout(); return; }
    const track = rail.querySelector('.content-rail__track');
    if (!track) return;
    // Earlier builds cloned the set to fake an infinite loop. Bounded rails do
    // not need the clones, and leaving them would double the travel.
    track.querySelectorAll('[data-marquee-clone]').forEach(clone => clone.remove());
    const cards = [...track.children];
    if (!cards.length) return;

    const gapOf = () => parseFloat(getComputedStyle(track).columnGap || '0') || 0;
    // offsetWidth, not getBoundingClientRect: the cards carry a 3D tilt and a
    // hover scale, and a transformed rect would quietly inflate the travel and
    // let the row run past its own last thumbnail.
    const measureTravel = () => {
      const gap = gapOf();
      const content = cards.reduce((total, card) => total + card.offsetWidth, 0) + gap * (cards.length - 1);
      return Math.max(0, Math.round(content - rail.clientWidth));
    };
    let travel = measureTravel();

    track.style.animation = 'none';
    let offset = 0;
    let dragging = false, held = false;
    let startX = 0, startOffset = 0, lastMoveX = 0, velocity = 0, lastTime = performance.now();

    const clamp = value => Math.min(Math.max(value, 0), travel);
    /* The edge fade only masks a side that actually has more work behind it,
       so a rail sitting at either end shows its end card whole. */
    const paint = () => {
      track.style.transform = `translate3d(${-offset}px,0,0)`;
      rail.classList.toggle('at-start', offset <= 1);
      rail.classList.toggle('at-end', offset >= travel - 1);
    };

    let onScreen = false, frame = 0;
    const step = (now) => {
      frame = 0;
      if (!onScreen || document.hidden || railMode === 'static') return;
      const dt = Math.min(50, now - lastTime) / 1000;
      lastTime = now;
      if (!dragging && Math.abs(velocity) > 4) {   // let a flick run out
        const next = clamp(offset - velocity * dt);
        // Hitting an end kills the momentum rather than grinding against it.
        if (next === offset) velocity = 0; else velocity *= 0.94;
        offset = next;
        paint();
      }
      // Nothing left to settle: let the loop go quiet until the next grab.
      if (dragging || Math.abs(velocity) > 4) frame = requestAnimationFrame(step);
    };
    const run = () => { if (!frame) { lastTime = performance.now(); frame = requestAnimationFrame(step); } };
    paint();
    // Six rails animating at once means six very wide composited layers, which
    // is enough to lock the renderer. Only the rail you can see is running.
    new IntersectionObserver(entries => {
      onScreen = entries[0].isIntersecting;
      if (onScreen) run();
    }, { rootMargin: '120px 0px' }).observe(rail);

    rail.addEventListener('pointerdown', event => {
      if (event.button !== 0 && event.pointerType === 'mouse') return;
      held = true; dragging = false; velocity = 0;
      startX = event.clientX; startOffset = offset; lastMoveX = event.clientX;
      rail.setPointerCapture?.(event.pointerId);
      run();
    });
    rail.addEventListener('pointermove', event => {
      if (!held) return;
      const dx = event.clientX - startX;
      // Six pixels of slop, so a click on a card is still a click.
      if (!dragging && Math.abs(dx) > 6) { dragging = true; rail.classList.add('is-dragging'); }
      if (!dragging) return;
      event.preventDefault();
      offset = clamp(startOffset - dx);
      velocity = (event.clientX - lastMoveX) * 30;
      lastMoveX = event.clientX;
      paint();
    });
    const release = () => {
      if (!held) return;
      held = false;
      run();
      // A real drag swallows the click so a card does not navigate.
      if (dragging) setTimeout(() => { dragging = false; rail.classList.remove('is-dragging'); }, 0);
    };
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(type => rail.addEventListener(type, release));
    rail.addEventListener('click', event => {
      if (dragging) { event.preventDefault(); event.stopPropagation(); }
    }, true);
    rail.addEventListener('dragstart', event => event.preventDefault());

    rail.relayout = () => {
      travel = measureTravel();
      offset = clamp(offset);
      paint();
      run();
    };

    rail.jumpTo = card => {                      // used by the project search
      const home = cards.indexOf(card);
      if (home < 0) return;
      const gap = gapOf();
      const before = cards.slice(0, home).reduce((total, item) => total + item.offsetWidth + gap, 0);
      offset = clamp(before - 24);
      velocity = 0;
      paint();
    };
  };
  const setupRails = () => { if (railMode === 'off') return; rails.forEach(setupRail); };
  setupRails();
  let railResizeTimer;
  addEventListener('resize', () => {
    clearTimeout(railResizeTimer);
    railResizeTimer = setTimeout(setupRails, 180);
  }, { passive: true });

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
