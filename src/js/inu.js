/* =========================================================================
   INU MEDIA — motion engine
   Everything that makes the page feel like film: the curved cuts between
   sections, the scroll choreography, the burn between pages, and a small
   generative score.
   ========================================================================= */
(() => {
  'use strict';

  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  if (gsap && ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const TOUCH = window.matchMedia('(hover: none)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  if (REDUCED) document.documentElement.style.setProperty('--fx', '0');

  /* =======================================================================
     1. CURVED CUTS
     Each band clips its own top edge and pulls up over the band above it by
     the depth of that curve. The depth is measured in pixels, not in a share
     of the band's height, so a tall section on a phone does not end up with
     an absurd sweep across it.
     ===================================================================== */
  // [y0, c1x, c1y, c2x, c2y, y3] — y in units of the curve's amplitude
  const PROFILES = {
    swoopL: [0.06, 0.30, 1.30, 0.64, -0.20, 0.84],
    swoopR: [0.84, 0.34, -0.20, 0.70, 1.30, 0.06],
    arc:    [0.04, 0.34, 1.42, 0.66, 1.42, 0.04],
    wave:   [0.52, 0.24, -0.28, 0.56, 1.40, 0.30],
    rise:   [0.96, 0.38, 0.90, 0.58, 0.04, 0.02],
    dip:    [0.10, 0.40, 1.15, 0.72, 0.55, 0.62]
  };

  const bezier = (p, t) => {
    const [y0, , c1y, , c2y, y3] = [p[0], p[1], p[2], p[3], p[4], p[5]];
    const u = 1 - t;
    return u * u * u * y0 + 3 * u * u * t * c1y + 3 * u * t * t * c2y + t * t * t * y3;
  };

  function curveMax(p) {
    let m = 0;
    for (let i = 0; i <= 48; i++) m = Math.max(m, bezier(p, i / 48));
    return Math.max(m, p[0], p[5]);
  }

  function layoutCuts() {
    $$('.band').forEach((band) => {
      const p = PROFILES[band.dataset.cut] || PROFILES.swoopL;
      const clip = $('.band__clip', band);
      const edge = $('.band__edge', band);
      if (!clip) return;

      const h = clip.offsetHeight || band.offsetHeight;
      const amp = clamp(h * 0.088, 44, 140);
      const depth = curveMax(p) * amp + 2;
      band.style.setProperty('--cut', depth.toFixed(1) + 'px');

      // clip-path in objectBoundingBox units — responsive by construction
      const y = (v) => (v * amp / h).toFixed(5);
      const d = `M0,${y(p[0])} C${p[1]},${y(p[2])} ${p[3]},${y(p[4])} 1,${y(p[5])} L1,1 L0,1 Z`;
      const id = band.dataset.clipId || (band.dataset.clipId = 'cut' + Math.random().toString(36).slice(2, 8));
      let cp = document.getElementById(id);
      if (!cp) {
        cp = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
        cp.id = id;
        cp.setAttribute('clipPathUnits', 'objectBoundingBox');
        cp.appendChild(document.createElementNS('http://www.w3.org/2000/svg', 'path'));
        $('#cutDefs').appendChild(cp);
      }
      cp.firstChild.setAttribute('d', d);
      clip.style.setProperty('--clip', `url(#${id})`);

      // the light line that runs along the cut, drawn as a sibling so its
      // glow is free to bleed past the edge it sits on
      if (edge) {
        const ey = (v) => (v * amp).toFixed(2);
        edge.setAttribute('viewBox', `0 0 1000 ${depth.toFixed(2)}`);
        edge.setAttribute('preserveAspectRatio', 'none');
        edge.style.height = depth.toFixed(1) + 'px';
        const path = edge.querySelector('path');
        path.setAttribute('d',
          `M0,${ey(p[0])} C${(p[1] * 1000).toFixed(0)},${ey(p[2])} ${(p[3] * 1000).toFixed(0)},${ey(p[4])} 1000,${ey(p[5])}`);
        const len = path.getTotalLength();
        path.style.setProperty('--len', len);
        if (!path.dataset.drawn) {
          path.style.strokeDasharray = len;
          path.style.strokeDashoffset = len;
        }
      }
    });
  }

  function drawEdges() {
    if (!ScrollTrigger) return;
    $$('.band__edge path').forEach((path) => {
      ScrollTrigger.create({
        trigger: path.closest('.band'),
        start: 'top 92%',
        once: true,
        onEnter: () => {
          path.dataset.drawn = '1';
          gsap.to(path, {
            strokeDashoffset: 0,
            duration: REDUCED ? 0 : 1.6,
            ease: 'power2.inOut'
          });
        }
      });
    });
  }

  /* =======================================================================
     2. TEXT SPLITTING
     Words are wrapped, then grouped into the lines they actually landed on,
     so a line can be masked and pushed up from below its own edge.
     ===================================================================== */
  function splitLines(el) {
    if (el.dataset.split === 'chars') return splitChars(el);
    const source = el.dataset.raw || (el.dataset.raw = el.innerHTML);
    el.innerHTML = source;

    // Wrap every word. Words are later lifted out of their parents into line
    // wrappers, so any inline emphasis they sat inside has to be carried on
    // the word itself — otherwise <em> highlights are silently flattened.
    const wrap = (node) => {
      if (node.nodeType === 3) {
        const inEm = !!(node.parentNode.closest && node.parentNode.closest('em, i, strong, b'));
        const frag = document.createDocumentFragment();
        node.textContent.split(/(\s+)/).forEach((tok) => {
          if (!tok) return;
          if (/^\s+$/.test(tok)) { frag.appendChild(document.createTextNode(tok)); return; }
          const s = document.createElement(inEm ? 'em' : 'span');
          s.className = 'word';
          s.textContent = tok;
          frag.appendChild(s);
        });
        node.parentNode.replaceChild(frag, node);
      } else if (node.nodeType === 1 && node.tagName !== 'BR') {
        Array.from(node.childNodes).forEach(wrap);
      }
    };
    Array.from(el.childNodes).forEach(wrap);

    // group by vertical position
    const words = $$('.word', el);
    if (!words.length) return [];
    const lines = [];
    let top = null, bucket = null;
    words.forEach((w) => {
      const t = Math.round(w.offsetTop);
      if (top === null || Math.abs(t - top) > 4) { bucket = []; lines.push(bucket); top = t; }
      bucket.push(w);
    });

    // rebuild as masked lines
    const holder = document.createDocumentFragment();
    lines.forEach((bucket) => {
      const line = document.createElement('span');
      line.className = 'line';
      const inner = document.createElement('span');
      bucket.forEach((w, i) => {
        if (i) inner.appendChild(document.createTextNode(' '));
        inner.appendChild(w);
      });
      line.appendChild(inner);
      holder.appendChild(line);
    });
    el.innerHTML = '';
    el.appendChild(holder);
    return $$('.line > span', el);
  }

  function splitChars(el) {
    const source = el.dataset.raw || (el.dataset.raw = el.textContent);
    el.innerHTML = '';
    const out = [];
    source.split('').forEach((ch) => {
      const s = document.createElement('span');
      s.className = 'char';
      s.textContent = ch === ' ' ? ' ' : ch;
      el.appendChild(s);
      out.push(s);
    });
    return out;
  }

  /* =======================================================================
     3. REVEALS
     ===================================================================== */
  function reveals() {
    if (!gsap) return;

    $$('[data-split]').forEach((el) => {
      const parts = splitLines(el);
      if (!parts.length) return;
      const chars = el.dataset.split === 'chars';
      gsap.set(el, { opacity: 1 });
      gsap.set(parts, chars
        ? { yPercent: 110, opacity: 0 }
        : { yPercent: 118 });
      gsap.to(parts, {
        yPercent: 0,
        opacity: 1,
        duration: REDUCED ? 0 : (chars ? 0.8 : 1.15),
        ease: 'expo.out',
        stagger: chars ? 0.022 : 0.085,
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        delay: parseFloat(el.dataset.delay || 0)
      });
    });

    $$('[data-reveal]').forEach((el) => {
      const kind = el.dataset.reveal || 'up';
      const from = { opacity: 0 };
      if (kind === 'up') { from.y = 34; from.filter = 'blur(6px)'; }
      if (kind === 'down') { from.y = -26; }
      if (kind === 'left') { from.x = -38; }
      if (kind === 'right') { from.x = 38; }
      if (kind === 'scale') { from.scale = 1.06; from.filter = 'blur(10px)'; }
      if (kind === 'wipe') { from.clipPath = 'inset(0 0 100% 0)'; from.opacity = 1; }

      gsap.fromTo(el, from, {
        opacity: 1, x: 0, y: 0, scale: 1,
        filter: 'blur(0px)',
        clipPath: 'inset(0 0 0% 0)',
        duration: REDUCED ? 0 : 1.05,
        ease: 'expo.out',
        delay: parseFloat(el.dataset.delay || 0),
        scrollTrigger: { trigger: el.dataset.trigger ? el.closest(el.dataset.trigger) : el, start: 'top 90%', once: true }
      });
    });

    // staggered groups — cards, list items, grid cells
    $$('[data-stagger]').forEach((group) => {
      const items = Array.from(group.children);
      gsap.fromTo(items,
        { opacity: 0, y: 44, filter: 'blur(8px)' },
        {
          opacity: 1, y: 0, filter: 'blur(0px)',
          duration: REDUCED ? 0 : 1.0,
          ease: 'expo.out',
          stagger: parseFloat(group.dataset.stagger) || 0.075,
          scrollTrigger: { trigger: group, start: 'top 86%', once: true }
        });
    });

    // the small amber tick under a heading draws itself
    $$('.rule').forEach((r) => {
      gsap.fromTo(r, { scaleX: 0 }, {
        scaleX: 1, duration: REDUCED ? 0 : 0.9, ease: 'expo.out',
        scrollTrigger: { trigger: r, start: 'top 94%', once: true }
      });
    });

    $$('.step').forEach((s) => {
      ScrollTrigger.create({ trigger: s, start: 'top 82%', once: true,
        onEnter: () => s.classList.add('is-in') });
    });
  }

  /* =======================================================================
     4. TYPEWRITER
     ===================================================================== */
  function typers() {
    $$('[data-type]').forEach((el) => {
      const text = el.dataset.raw || (el.dataset.raw = el.textContent.trim());
      el.textContent = '';
      el.style.opacity = 1;
      const caret = document.createElement('i');
      caret.className = 'caret';
      let i = 0, timer = null;

      const run = () => {
        el.appendChild(caret);
        timer = setInterval(() => {
          if (i >= text.length) {
            clearInterval(timer);
            setTimeout(() => caret.remove(), 900);
            return;
          }
          caret.insertAdjacentText('beforebegin', text[i++]);
        }, 34);
      };

      if (REDUCED) { el.textContent = text; return; }
      if (ScrollTrigger) {
        ScrollTrigger.create({ trigger: el, start: 'top 88%', once: true, onEnter: run });
      } else run();
    });
  }

  /* =======================================================================
     5. PARALLAX
     ===================================================================== */
  function parallax() {
    if (!gsap || REDUCED) return;

    $$('[data-parallax]').forEach((el) => {
      const amt = parseFloat(el.dataset.parallax) || 0.12;
      gsap.fromTo(el, { yPercent: -amt * 50 }, {
        yPercent: amt * 50,
        ease: 'none',
        scrollTrigger: {
          trigger: el.closest('.band, .hero, section') || el,
          start: 'top bottom', end: 'bottom top', scrub: 1.1
        }
      });
    });

    // backgrounds drift slower than the content sitting on them
    $$('.band__bg, .hero__bg').forEach((bg) => {
      gsap.fromTo(bg, { yPercent: -7 }, {
        yPercent: 7, ease: 'none',
        scrollTrigger: {
          trigger: bg.closest('.band, .hero') || bg,
          start: 'top bottom', end: 'bottom top', scrub: 1.4
        }
      });
    });

    // the hero cast drift apart very slightly as you leave
    $$('.hero__figure').forEach((fig, i) => {
      const depth = parseFloat(fig.dataset.depth || (0.1 + i * 0.05));
      gsap.to(fig, {
        yPercent: depth * 34, scale: 1 + depth * 0.06, ease: 'none',
        scrollTrigger: { trigger: fig.closest('.hero'), start: 'top top', end: 'bottom top', scrub: 1 }
      });
    });
  }

  /* =======================================================================
     6. COUNTERS
     ===================================================================== */
  function counters() {
    $$('[data-count]').forEach((el) => {
      const target = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      const dp = (el.dataset.count.split('.')[1] || '').length;
      const obj = { v: 0 };
      const write = () => { el.textContent = obj.v.toFixed(dp) + suffix; };
      write();
      if (REDUCED || !gsap) { obj.v = target; write(); return; }
      gsap.to(obj, {
        v: target, duration: 2.1, ease: 'power3.out', onUpdate: write,
        scrollTrigger: { trigger: el, start: 'top 88%', once: true }
      });
    });
  }

  /* =======================================================================
     7. NAV
     ===================================================================== */
  function nav() {
    const bar = $('.nav');
    if (!bar) return;
    const progress = $('.nav__progress');
    let last = 0;

    const onScroll = (y) => {
      bar.classList.toggle('is-glass', y > 40);
      if (y > 220 && y > last + 4) bar.classList.add('is-hidden');
      else if (y < last - 4 || y < 220) bar.classList.remove('is-hidden');
      last = y;
      if (progress) {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        progress.style.setProperty('--p', max > 0 ? clamp(y / max, 0, 1) : 0);
      }
    };
    window.__inuScroll = onScroll;
    onScroll(window.scrollY);
    window.addEventListener('scroll', () => onScroll(window.scrollY), { passive: true });

    // the specular streak follows the pointer across the glass
    if (!TOUCH) {
      bar.addEventListener('pointermove', (e) => {
        bar.style.setProperty('--mx', ((e.clientX / window.innerWidth) * 100).toFixed(1) + '%');
      });
    }

    // drawer
    const burger = $('.nav__burger');
    const drawer = $('.drawer');
    if (burger && drawer) {
      burger.addEventListener('click', () => {
        const open = drawer.classList.toggle('is-open');
        burger.setAttribute('aria-expanded', String(open));
        document.body.classList.toggle('is-locked', open);
      });
      $$('.drawer__link', drawer).forEach((a) =>
        a.addEventListener('click', () => {
          drawer.classList.remove('is-open');
          document.body.classList.remove('is-locked');
        }));
    }
  }

  /* =======================================================================
     8. CURSOR
     ===================================================================== */
  function cursor() {
    if (TOUCH || REDUCED || !gsap) return;
    const dot = $('.cursor'), ring = $('.cursor-ring');
    if (!dot || !ring) return;
    const qx = gsap.quickTo(ring, 'x', { duration: 0.5, ease: 'power3' });
    const qy = gsap.quickTo(ring, 'y', { duration: 0.5, ease: 'power3' });
    const dx = gsap.quickTo(dot, 'x', { duration: 0.12, ease: 'power2' });
    const dy = gsap.quickTo(dot, 'y', { duration: 0.12, ease: 'power2' });

    window.addEventListener('pointermove', (e) => {
      qx(e.clientX); qy(e.clientY); dx(e.clientX); dy(e.clientY);
    });
    document.addEventListener('pointerover', (e) => {
      const hit = e.target.closest('a, button, .work, .svc, input, textarea');
      ring.classList.toggle('is-big', !!hit);
    });
  }

  /* =======================================================================
     9. WORK FILTERS
     ===================================================================== */
  function filters() {
    const bar = $('[data-filters]');
    if (!bar) return;
    const cards = $$('[data-tags]');
    $$('.filter', bar).forEach((btn) => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.filter;
        $$('.filter', bar).forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
        cards.forEach((c) => {
          const show = key === 'all' || c.dataset.tags.split(' ').includes(key);
          c.classList.toggle('is-out', !show);
        });
        if (gsap && !REDUCED) {
          gsap.fromTo(cards.filter((c) => !c.classList.contains('is-out')),
            { opacity: 0, y: 22 },
            { opacity: 1, y: 0, duration: 0.7, ease: 'expo.out', stagger: 0.035 });
        }
        if (ScrollTrigger) ScrollTrigger.refresh();
      });
    });
  }

  /* =======================================================================
     10. MARQUEE
     ===================================================================== */
  function marquees() {
    if (!gsap || REDUCED) return;
    $$('.marquee').forEach((m) => {
      const track = $('.marquee__track', m);
      if (!track) return;
      track.innerHTML += track.innerHTML;
      const dist = track.scrollWidth / 2;
      const speed = parseFloat(m.dataset.speed) || 42;
      gsap.to(track, { x: -dist, duration: dist / speed, ease: 'none', repeat: -1 });
    });
  }

  /* =======================================================================
     11. EMBERS
     Tiny drifting sparks over the sections that carry the most weight.
     ===================================================================== */
  function embers() {
    const layer = $('.embers');
    if (!layer || REDUCED) return;
    const cv = document.createElement('canvas');
    layer.appendChild(cv);
    const ctx = cv.getContext('2d');
    let w = 0, h = 0, dots = [], on = false, raf = null;

    const size = () => {
      const d = Math.min(devicePixelRatio || 1, 2);
      w = cv.width = innerWidth * d;
      h = cv.height = innerHeight * d;
      cv.style.width = innerWidth + 'px';
      cv.style.height = innerHeight + 'px';
      ctx.scale(1, 1);
    };
    size();
    addEventListener('resize', size);

    const seed = () => {
      dots = Array.from({ length: 46 }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.9 + 0.5,
        vy: -(Math.random() * 0.32 + 0.08),
        vx: (Math.random() - 0.5) * 0.16,
        a: Math.random() * 0.5 + 0.16,
        p: Math.random() * Math.PI * 2
      }));
    };
    seed();

    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      dots.forEach((d) => {
        d.y += d.vy; d.x += d.vx + Math.sin(d.p += 0.011) * 0.22;
        if (d.y < -12) { d.y = h + 12; d.x = Math.random() * w; }
        const g = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, d.r * 6);
        g.addColorStop(0, `rgba(255,180,90,${d.a})`);
        g.addColorStop(0.4, `rgba(255,110,25,${d.a * 0.35})`);
        g.addColorStop(1, 'rgba(255,90,10,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(d.x, d.y, d.r * 6, 0, 6.2832); ctx.fill();
      });
      raf = requestAnimationFrame(tick);
    };

    const warm = $('.grain--warm');
    const set = (state) => {
      if (state === on) return;
      on = state;
      layer.style.opacity = state ? '1' : '0';
      if (warm) warm.style.opacity = state ? '0.22' : '0';
      if (state && !raf) tick();
      if (!state && raf) { cancelAnimationFrame(raf); raf = null; ctx.clearRect(0, 0, w, h); }
    };

    if (!ScrollTrigger) { set(true); return; }
    const zones = $$('[data-ember]');
    if (!zones.length) return;
    zones.forEach((z) => {
      ScrollTrigger.create({
        trigger: z, start: 'top 70%', end: 'bottom 30%',
        onToggle: (self) => set(self.isActive)
      });
    });
  }

  /* =======================================================================
     12. PAGE TRANSITIONS
     A real film burn between pages: the frame flares, goes black, and the
     next page opens out of the same flare.
     ===================================================================== */
  function transitions() {
    const burn = $('.burn');
    const wipe = $('.wipe');
    const video = burn && burn.querySelector('video');

    const play = () => {
      if (!video || REDUCED) return Promise.resolve();
      burn.classList.add('is-on');
      try { video.currentTime = 0; video.play(); } catch (e) { /* autoplay guard */ }
      return new Promise((res) => setTimeout(res, 520));
    };

    // opening flare, once the page is up
    if (video && !REDUCED) {
      requestAnimationFrame(() => {
        burn.classList.add('is-on');
        video.play().catch(() => {});
        setTimeout(() => burn.classList.remove('is-on'), 1500);
      });
    }

    if (REDUCED) return;
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href]');
      if (!a) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      if (a.target === '_blank' || a.hasAttribute('download')) return;
      if (url.pathname === location.pathname && url.hash) return;   // in-page
      if (url.pathname === location.pathname) return;

      e.preventDefault();
      play();
      if (wipe) setTimeout(() => wipe.classList.add('is-on'), 260);
      setTimeout(() => { location.href = a.href; }, 620);
    });

    // coming back through history should not land on a black screen
    addEventListener('pageshow', () => {
      if (wipe) wipe.classList.remove('is-on');
      if (burn) burn.classList.remove('is-on');
    });
  }

  /* =======================================================================
     13. AMBIENT SCORE
     Written rather than licensed: a slow drone, a pad that wanders around a
     minor pentatonic, and an air bed. Scrolling opens the filter, so moving
     down the page lifts the room. Off until asked for.
     ===================================================================== */
  function score() {
    const btn = $('[data-sound]');
    if (!btn) return;
    let ctx = null, master = null, wash = null, timer = null, padTimer = null;
    let energy = 0;

    const impulse = (c, seconds = 3.4, decay = 2.6) => {
      const rate = c.sampleRate;
      const len = Math.floor(rate * seconds);
      const buf = c.createBuffer(2, len, rate);
      for (let ch = 0; ch < 2; ch++) {
        const d = buf.getChannelData(ch);
        for (let i = 0; i < len; i++) {
          d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
        }
      }
      return buf;
    };

    const start = () => {
      ctx = new (window.AudioContext || window.webkitAudioContext)();

      master = ctx.createGain();
      master.gain.value = 0;
      master.connect(ctx.destination);

      const verb = ctx.createConvolver();
      verb.buffer = impulse(ctx);
      const verbGain = ctx.createGain();
      verbGain.gain.value = 0.75;
      verb.connect(verbGain).connect(master);

      const dry = ctx.createGain();
      dry.gain.value = 0.55;
      dry.connect(master);

      wash = ctx.createBiquadFilter();
      wash.type = 'lowpass';
      wash.frequency.value = 420;
      wash.Q.value = 0.7;
      wash.connect(dry);
      wash.connect(verb);

      // drone — two detuned voices an octave and a fifth apart
      [55, 82.41, 110].forEach((f, i) => {
        const o = ctx.createOscillator();
        o.type = i === 2 ? 'triangle' : 'sine';
        o.frequency.value = f;
        o.detune.value = (i - 1) * 6;
        const g = ctx.createGain();
        g.gain.value = i === 2 ? 0.055 : 0.11;
        o.connect(g).connect(wash);
        o.start();

        // very slow drift, so the drone never sits still
        const lfo = ctx.createOscillator();
        lfo.frequency.value = 0.03 + i * 0.017;
        const lg = ctx.createGain();
        lg.gain.value = 2.2;
        lfo.connect(lg).connect(o.detune);
        lfo.start();
      });

      // air
      const noise = ctx.createBufferSource();
      const nb = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
      const nd = nb.getChannelData(0);
      for (let i = 0; i < nd.length; i++) nd[i] = (Math.random() * 2 - 1) * 0.5;
      noise.buffer = nb; noise.loop = true;
      const nf = ctx.createBiquadFilter();
      nf.type = 'bandpass'; nf.frequency.value = 760; nf.Q.value = 0.6;
      const ng = ctx.createGain(); ng.gain.value = 0.028;
      noise.connect(nf).connect(ng).connect(verb);
      noise.start();

      // pad — A minor pentatonic, one long note at a time
      const scale = [220, 261.63, 293.66, 329.63, 392, 440, 523.25];
      const voice = () => {
        if (!ctx) return;
        const f = scale[Math.floor(Math.random() * scale.length)];
        const o = ctx.createOscillator();
        o.type = 'sine';
        o.frequency.value = f;
        const g = ctx.createGain();
        g.gain.value = 0;
        o.connect(g).connect(wash);
        const t = ctx.currentTime;
        const dur = 7 + Math.random() * 6;
        g.gain.linearRampToValueAtTime(0.035 + Math.random() * 0.02, t + dur * 0.42);
        g.gain.linearRampToValueAtTime(0, t + dur);
        o.start(t); o.stop(t + dur + 0.1);
      };
      voice();
      padTimer = setInterval(voice, 4200);

      master.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 3.2);

      // scroll energy opens the filter
      let lastY = window.scrollY;
      const onScroll = () => {
        const v = Math.abs(window.scrollY - lastY);
        lastY = window.scrollY;
        energy = Math.min(1, energy + v / 900);
      };
      addEventListener('scroll', onScroll, { passive: true });
      timer = setInterval(() => {
        energy *= 0.90;
        if (wash && ctx) {
          wash.frequency.setTargetAtTime(420 + energy * 1500, ctx.currentTime, 0.4);
        }
      }, 120);
    };

    const stop = () => {
      if (!ctx) return;
      const c = ctx;
      master.gain.linearRampToValueAtTime(0, c.currentTime + 0.8);
      clearInterval(timer); clearInterval(padTimer);
      ctx = null;
      setTimeout(() => c.close(), 1100);
    };

    btn.addEventListener('click', () => {
      const on = btn.getAttribute('aria-pressed') === 'true';
      btn.setAttribute('aria-pressed', String(!on));
      btn.setAttribute('aria-label', on ? 'Play ambient score' : 'Mute ambient score');
      if (on) stop(); else start();
    });
  }

  /* =======================================================================
     14. CONTACT FORM
     There is no mail backend on this build, so Send composes the message in
     the visitor's own mail client rather than pretending to have sent it.
     ===================================================================== */
  function form() {
    const f = $('[data-mailto]');
    if (!f) return;
    const note = $('.form__note', f.parentNode) || $('.form__note');
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      const d = new FormData(f);
      const name = (d.get('name') || '').toString().trim();
      const email = (d.get('email') || '').toString().trim();
      const subject = (d.get('subject') || 'New enquiry').toString().trim();
      const message = (d.get('message') || '').toString().trim();
      if (!name || !email || !message) {
        if (note) note.textContent = 'Please add your name, email and a short message.';
        return;
      }
      const body = `${message}\n\n—\n${name}\n${email}`;
      location.href = `mailto:${f.dataset.mailto}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      if (note) note.textContent = 'Opening your mail app with the message ready to send.';
    });
  }

  /* =======================================================================
     15. LAZY IMAGES
     Native loading="lazy" does not fire for the images inside these bands —
     Chrome reports them as never intersecting, so they sit unloaded even
     while on screen. Promotion is therefore driven off the scroll position,
     which is deterministic: anything within two screens is switched to eager.
     ===================================================================== */
  function lazyImages() {
    const pending = new Set($$('img[loading="lazy"]'));
    if (!pending.size) return;
    let queued = false;

    const sweep = () => {
      queued = false;
      const margin = innerHeight * 2;
      pending.forEach((img) => {
        const r = img.getBoundingClientRect();
        if (r.bottom > -margin && r.top < innerHeight + margin) {
          img.loading = 'eager';
          pending.delete(img);
        }
      });
      if (!pending.size) {
        removeEventListener('scroll', onScroll);
        removeEventListener('resize', onScroll);
      }
    };
    const onScroll = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(sweep);
    };

    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll);
    sweep();
    // a couple of late sweeps in case layout settles after fonts/images
    setTimeout(sweep, 400);
    setTimeout(sweep, 1600);
  }

  /* =======================================================================
     16. OVERLAY PLAYBACK
     Muted autoplay is normally allowed, but it is not guaranteed. Nudge the
     grain loops, and try again on the first interaction if the nudge failed.
     ===================================================================== */
  function overlayVideo() {
    const grains = $$('.grain video');
    if (!grains.length) return;
    const kick = () => grains.forEach((v) => {
      v.muted = true;
      v.defaultMuted = true;
      const p = v.play();
      if (p && p.catch) p.catch(() => {});
    });
    kick();
    // A tab opened in the background is 'hidden', and autoplay never starts
    // there — so try again the moment the page is actually looked at, and on
    // the first interaction.
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') kick();
    });
    addEventListener('pointerdown', kick, { once: true });
    addEventListener('keydown', kick, { once: true });
    addEventListener('scroll', kick, { once: true, passive: true });
  }

  /* =======================================================================
     17. BOOT
     ===================================================================== */
  function boot() {
    const curtain = $('.boot');
    const bar = $('.boot__bar i');
    const imgs = $$('img');
    let done = 0;
    const total = Math.max(1, imgs.length);

    const bump = () => {
      done++;
      if (bar) bar.style.setProperty('--p', Math.min(1, done / total));
    };
    imgs.forEach((img) => {
      if (img.complete) bump();
      else { img.addEventListener('load', bump); img.addEventListener('error', bump); }
    });

    const lift = () => {
      if (bar) bar.style.setProperty('--p', 1);
      setTimeout(() => {
        if (curtain) curtain.classList.add('is-done');
        document.body.classList.add('is-ready');
        if (ScrollTrigger) ScrollTrigger.refresh();
      }, 260);
    };

    if (document.readyState === 'complete') lift();
    else window.addEventListener('load', lift);
    setTimeout(lift, 4200);   // never hold the page hostage to one slow image
  }

  /* =======================================================================
     18. SMOOTH SCROLL
     ===================================================================== */
  function smooth() {
    if (REDUCED || !window.Lenis) return null;
    const lenis = new window.Lenis({
      duration: 1.15,
      lerp: 0.085,
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.6
    });
    if (gsap) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
    // anchors
    $$('a[href^="#"]').forEach((a) => {
      a.addEventListener('click', (e) => {
        const id = a.getAttribute('href');
        if (id.length < 2) return;
        const t = document.querySelector(id);
        if (!t) return;
        e.preventDefault();
        lenis.scrollTo(t, { offset: -80 });
      });
    });
    return lenis;
  }

  /* ------------------------------------------------------------------ go */
  const init = () => {
    layoutCuts();
    lazyImages();
    overlayVideo();
    smooth();
    nav();
    reveals();
    typers();
    parallax();
    counters();
    drawEdges();
    cursor();
    filters();
    marquees();
    embers();
    transitions();
    score();
    form();
    boot();

    let w = innerWidth;
    let t = null;
    addEventListener('resize', () => {
      clearTimeout(t);
      t = setTimeout(() => {
        layoutCuts();
        if (Math.abs(innerWidth - w) > 60) w = innerWidth;
        if (ScrollTrigger) ScrollTrigger.refresh();
      }, 180);
    });
    // fonts change line breaks, which changes where the split lines fall
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        layoutCuts();
        if (ScrollTrigger) ScrollTrigger.refresh();
      });
    }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
