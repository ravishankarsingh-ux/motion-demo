/* JDS Public School — shared behavior.
   Uses Motion (vendor/motion.min.js, window.Motion) for scroll
   animations. Everything degrades gracefully: content stays
   visible if Motion is missing or reduced motion is requested. */

(function () {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const motionOk = typeof window.Motion !== 'undefined' && !reducedMotion;
  if (motionOk) document.documentElement.classList.add('motion-ok');

  /* ---------- Sticky header shadow ---------- */
  const header = document.querySelector('.site-header');
  if (header) {
    const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- Mobile navigation ---------- */
  const navToggle = document.querySelector('.nav-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  if (navToggle && mobileMenu) {
    navToggle.addEventListener('click', () => {
      const open = mobileMenu.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileMenu.classList.contains('open')) {
        mobileMenu.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.focus();
      }
    });
  }

  /* ---------- Decorative blobs + scroll progress (injected) ---------- */
  function injectDecor() {
    const bar = document.createElement('div');
    bar.className = 'scroll-progress';
    bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);

    document.querySelectorAll('.hero-sticky, .page-hero, .section.tinted, .cta-band').forEach((host, i) => {
      const blobs = ['gold', i % 2 ? 'violet' : 'cyan', i % 2 ? 'rose' : 'violet'];
      blobs.forEach((tone, j) => {
        const b = document.createElement('div');
        b.className = 'blob ' + tone;
        b.setAttribute('aria-hidden', 'true');
        b.dataset.parallax = (0.12 + j * 0.09).toFixed(2);
        const size = 220 + j * 120;
        b.style.width = b.style.height = size + 'px';
        b.style.top = [(-8 - j * 6), 55, 20][j] + '%';
        b.style[j % 2 ? 'right' : 'left'] = [(-6), (-8), 60][j] + '%';
        host.appendChild(b);
      });
      if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
    });
    return bar;
  }

  /* ---------- Scroll-linked effects ---------- */
  function initScrollFx(bar) {
    if (!motionOk) return;
    const { scroll } = window.Motion;

    // top progress bar
    scroll((progress) => { bar.style.transform = 'scaleX(' + progress + ')'; });

    // pinned hero: the stage stays fully visible for the whole scrub —
    // only the text column lifts slightly at the very end, and the next
    // section then covers the stage naturally (no blank frame ever).
    const heroCopy = document.querySelector('.hero-copy');
    const hero = document.querySelector('.hero');
    if (hero && heroCopy) {
      scroll((p) => {
        const out = Math.max(0, (p - 0.86) / 0.14);
        heroCopy.style.opacity = String(1 - out * 0.6);
        heroCopy.style.transform = 'translateY(' + (out * -40) + 'px)';
      }, { target: hero, offset: ['start start', 'end end'] });
    }

    // parallax blobs — each moves at its own speed while its host scrolls
    document.querySelectorAll('[data-parallax]').forEach((el) => {
      const speed = parseFloat(el.dataset.parallax) || 0.15;
      scroll((p) => {
        el.style.translate = '0 ' + ((p - 0.5) * -320 * speed) + 'px';
      }, { target: el.parentElement, offset: ['start end', 'end start'] });
    });

    // photo tiles drift subtly against scroll for depth
    document.querySelectorAll('.grid-tiles .photo-tile').forEach((tile, i) => {
      scroll((p) => {
        tile.style.translate = '0 ' + ((p - 0.5) * (i % 2 ? -36 : 36)) + 'px';
      }, { target: tile.parentElement, offset: ['start end', 'end start'] });
    });
  }

  /* ---------- Scroll reveal animations ---------- */
  // Light edition: spring physics + clip wipes instead of blur fades
  const SPRING = { type: 'spring', stiffness: 130, damping: 17, mass: 0.9 };
  const REVEAL_VARIANTS = {
    up:    { opacity: [0, 1], y: [44, 0], scale: [0.97, 1] },
    left:  { opacity: [0, 1], x: [-64, 0] },
    right: { opacity: [0, 1], x: [64, 0] },
    zoom:  { opacity: [0, 1], scale: [0.8, 1] },
  };

  // Wrap each word of a heading in a span so it can flip in on its own.
  // Walks text nodes only, so nested spans (gradient phrases) survive.
  function splitWords(el) {
    if (el.dataset.split || el.querySelector('.word-rotate')) return [];
    el.dataset.split = '1';
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    while (walker.nextNode()) {
      if (walker.currentNode.textContent.trim()) textNodes.push(walker.currentNode);
    }
    const spans = [];
    textNodes.forEach((node) => {
      const frag = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
        const sp = document.createElement('span');
        sp.className = 'word-flip';
        sp.textContent = part;
        frag.appendChild(sp);
        spans.push(sp);
      });
      node.parentNode.replaceChild(frag, node);
    });
    return spans;
  }

  function initReveals() {
    if (!motionOk) return;
    const { animate, inView, stagger } = window.Motion;

    document.querySelectorAll('.reveal').forEach((el) => {
      const variant = REVEAL_VARIANTS[el.dataset.reveal] || REVEAL_VARIANTS.up;
      inView(el, (target) => { animate(target, variant, SPRING); }, { amount: 0.18 });
    });

    // Headings: every word flips up from below like a card on a hinge
    document.querySelectorAll('.section h2, .page-hero h1').forEach((h) => {
      const words = splitWords(h);
      if (!words.length) return;
      inView(h, () => {
        animate(
          words,
          { opacity: [0, 1], rotateX: [85, 0], y: ['0.5em', '0em'] },
          { type: 'spring', stiffness: 190, damping: 19, delay: stagger(0.05) }
        );
      }, { amount: 0.6 });
    });

    // Grids: cards swing in like doors (rotateY spring cascade)
    document.querySelectorAll('[data-stagger]').forEach((group) => {
      const items = Array.from(group.children);
      if (!items.length) return;
      items.forEach((it) => {
        it.style.opacity = '0';
        it.style.transformOrigin = 'left center';
      });
      inView(group, () => {
        animate(
          items,
          { opacity: [0, 1], rotateY: [55, 0], y: [36, 0] },
          Object.assign({ delay: stagger(0.09) }, SPRING)
        );
      }, { amount: 0.12 });
    });

    // Photo tiles and the campus art: clip-path curtain wipe while the
    // picture inside settles back from a zoom
    document.querySelectorAll('.photo-tile, .campus-art').forEach((el, i) => {
      inView(el, (target) => {
        animate(
          target,
          { clipPath: ['inset(0 100% 0 0 round 22px)', 'inset(0 0% 0 0 round 22px)'], opacity: [0.4, 1] },
          { duration: 0.85, delay: (i % 4) * 0.08, ease: [0.77, 0, 0.18, 1] }
        );
        const inner = target.querySelectorAll('.tile-bg, .tile-img, svg');
        if (inner.length) {
          animate(inner, { scale: [1.22, 1] }, { duration: 1.1, delay: (i % 4) * 0.08, ease: [0.22, 1, 0.36, 1] });
        }
      }, { amount: 0.25 });
    });

    // News cards flip in as they are injected (grid observed after load)
    document.querySelectorAll('.news-grid').forEach((grid) => { grid.style.perspective = '1200px'; });
  }

  /* ---------- Hero: lotus bloom scrubbed by scroll ---------- */
  function initBloom() {
    const svg = document.getElementById('bloom-svg');
    const hero = document.querySelector('.hero');
    if (!svg || !hero) return;

    const petals = Array.from(svg.querySelectorAll('.petal'));
    const core = svg.querySelector('.bloom-core');
    const glow = svg.querySelector('.bloom-glow');
    const easeOut = (t) => 1 - Math.pow(1 - t, 3);

    function setBloom(raw) {
      const t = easeOut(Math.min(1, Math.max(0, raw)));
      petals.forEach((petal) => {
        const a = parseFloat(petal.dataset.a);
        const rot = a * (0.07 + 0.79 * t);
        const sx = 0.6 + 0.4 * t;
        const sy = 0.42 + 0.58 * t;
        petal.setAttribute(
          'transform',
          'translate(100 168) rotate(' + rot + ') scale(' + sx + ' ' + sy + ') translate(-100 -168)'
        );
      });
      if (core) core.setAttribute('r', String(4 + 6 * t));
      if (glow) glow.setAttribute('opacity', String(0.08 + 0.5 * t));
    }

    if (!motionOk) { setBloom(1); return; }
    setBloom(0);
    window.Motion.scroll((p) => setBloom(p * 1.45), {
      target: hero,
      offset: ['start start', 'end end'],
    });
  }

  /* ---------- Hero: entrance + rotating headline word ---------- */
  const ROTATE_WORDS = ['confident leaders.', 'curious thinkers.', 'bold artists.', 'strong athletes.', 'kind citizens.'];

  function initHeroText() {
    const copy = document.querySelector('.hero-copy');
    if (!copy || !motionOk) return;
    const { animate, stagger } = window.Motion;

    animate(
      copy.children,
      { opacity: [0, 1], y: [56, 0], scale: [0.96, 1] },
      { type: 'spring', stiffness: 120, damping: 16, delay: stagger(0.12) }
    );

    const word = document.getElementById('rotate-word');
    if (!word) return;
    let i = 0;
    setInterval(() => {
      animate(word, { rotateX: [0, 92], opacity: [1, 0], y: [0, -10] }, { duration: 0.32, ease: 'easeIn' })
        .finished.then(() => {
          i = (i + 1) % ROTATE_WORDS.length;
          word.textContent = ROTATE_WORDS[i];
          animate(word, { rotateX: [-92, 0], opacity: [0, 1], y: [10, 0] }, { type: 'spring', stiffness: 220, damping: 20 });
        });
    }, 3200);
  }

  /* ---------- Full-page bus: rides a visible zig-zag route ---------- */
  const BUS_SVG_H =
    '<svg viewBox="-34 -32 68 42" aria-hidden="true">' +
    '<g transform="translate(0 -3)">' +
    '<rect x="-30" y="-24" width="60" height="21" rx="5" fill="#f6b93b" stroke="#b8862c" stroke-width="1.5"/>' +
    '<rect x="-25" y="-20" width="10" height="8" rx="1.5" fill="#e8f4ff" stroke="#8a6420" stroke-width="0.8"/>' +
    '<rect x="-11" y="-20" width="10" height="8" rx="1.5" fill="#e8f4ff" stroke="#8a6420" stroke-width="0.8"/>' +
    '<rect x="3" y="-20" width="10" height="8" rx="1.5" fill="#e8f4ff" stroke="#8a6420" stroke-width="0.8"/>' +
    '<rect x="17" y="-20" width="10" height="8" rx="1.5" fill="#e8f4ff" stroke="#8a6420" stroke-width="0.8"/>' +
    '<rect x="-30" y="-9" width="60" height="3.4" fill="#b8862c"/>' +
    '<circle cx="-16" cy="0" r="6.2" fill="#1e293b"/>' +
    '<g class="bus-wheel-spokes" stroke="#94a3b8" stroke-width="1.4"><path d="M-16 -4.5 V4.5 M-20.5 0 H-11.5"/></g>' +
    '<circle cx="17" cy="0" r="6.2" fill="#1e293b"/>' +
    '<g class="bus-wheel-spokes" stroke="#94a3b8" stroke-width="1.4"><path d="M17 -4.5 V4.5 M12.5 0 H21.5"/></g>' +
    '</g></svg>';

  function initPageBus() {
    if (!motionOk || !window.matchMedia('(min-width: 1100px)').matches) return;

    const SVG_NS = 'http://www.w3.org/2000/svg';
    const route = document.createElement('div');
    route.className = 'page-route';
    route.setAttribute('aria-hidden', 'true');
    route.innerHTML =
      '<svg><defs><linearGradient id="routeGrad" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="#d9a441"/><stop offset="55%" stop-color="#2563eb"/><stop offset="100%" stop-color="#8052ff"/>' +
      '</linearGradient></defs>' +
      '<path id="route-track"/><path id="route-done"/></svg>';
    document.body.appendChild(route);

    const bus = document.createElement('div');
    bus.className = 'page-bus-free';
    bus.setAttribute('aria-hidden', 'true');
    bus.innerHTML = BUS_SVG_H;
    document.body.appendChild(bus);

    const track = route.querySelector('#route-track');
    const done = route.querySelector('#route-done');
    const WAVES = 3;
    const TAU = Math.PI * 2;
    let routeLen = 0;

    // Build the on-screen zig-zag as a real SVG path so the bus can be
    // placed exactly on the line (skill guidance: motion must trace a
    // visible, meaningful track — no free-floating decoration).
    function buildRoute() {
      const W = window.innerWidth;
      const H = window.innerHeight;
      const margin = 96;
      const amp = Math.max(120, (W - margin * 2) / 2 - 40);
      const cx = W / 2;
      const yTop = 132;
      const yBot = H - 84;
      const pts = [];
      for (let i = 0; i <= 220; i++) {
        const p = i / 220;
        pts.push(
          (cx + amp * Math.sin(p * TAU * WAVES)).toFixed(1) + ' ' +
          (yTop + p * (yBot - yTop)).toFixed(1)
        );
      }
      const d = 'M ' + pts.join(' L ');
      track.setAttribute('d', d);
      done.setAttribute('d', d);
      route.querySelector('svg').setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      routeLen = done.getTotalLength();
      done.style.strokeDasharray = String(routeLen);
    }
    buildRoute();
    window.addEventListener('resize', buildRoute);

    let current = 0;
    let idleFrames = 0;
    let lastDir = 1;

    function frame() {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const target = max > 0 ? window.scrollY / max : 0;
      const delta = target - current;
      current += delta * 0.09;

      // reveal the traveled part of the route
      done.style.strokeDashoffset = String(routeLen * (1 - current));

      // place the bus exactly on the line
      const at = Math.min(routeLen, Math.max(0, current * routeLen));
      const pt = done.getPointAtLength(at);
      const ahead = done.getPointAtLength(Math.min(routeLen, at + 4));
      const behind = done.getPointAtLength(Math.max(0, at - 4));
      let dx = ahead.x - behind.x;
      let dy = ahead.y - behind.y;

      if (Math.abs(delta) > 0.00015) lastDir = delta >= 0 ? 1 : -1;
      dx *= lastDir;
      dy *= lastDir;

      const facingLeft = dx < 0;
      const tilt = Math.max(-30, Math.min(30, Math.atan2(dy, Math.abs(dx)) * 180 / Math.PI));
      bus.classList.toggle('facing-left', facingLeft);
      bus.style.transform =
        'translate(' + pt.x + 'px, ' + (pt.y - 8) + 'px) rotate(' + (facingLeft ? -tilt : tilt) + 'deg)';

      if (Math.abs(delta) > 0.0004) {
        idleFrames = 0;
        bus.classList.add('moving');
      } else if (++idleFrames > 18) {
        bus.classList.remove('moving');
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /* ---------- The JDS Journey: bus rides the road on scroll ---------- */
  function initJourney() {
    const svg = document.getElementById('journey-svg');
    if (!svg) return;
    const path = svg.querySelector('#journey-path');
    const bus = svg.querySelector('#journey-bus');
    const milestones = Array.from(svg.querySelectorAll('.milestone'));
    const len = path.getTotalLength();
    path.style.strokeDasharray = String(len);

    milestones.forEach((m) => {
      const f = parseFloat(m.dataset.f);
      const pt = path.getPointAtLength(f * len);
      m.setAttribute('transform', 'translate(' + pt.x + ' ' + pt.y + ')');
    });

    function setJourney(raw) {
      const t = Math.min(1, Math.max(0, raw));
      path.style.strokeDashoffset = String(len * (1 - t));
      milestones.forEach((m) => {
        m.classList.toggle('hit', t >= parseFloat(m.dataset.f));
      });
      if (bus) {
        const bt = Math.min(t, 0.985) * len;
        const pt = path.getPointAtLength(bt);
        const ahead = path.getPointAtLength(Math.min(len, bt + 2));
        const behind = path.getPointAtLength(Math.max(0, bt - 2));
        const ang = Math.atan2(ahead.y - behind.y, ahead.x - behind.x) * 180 / Math.PI;
        bus.setAttribute('transform', 'translate(' + pt.x + ' ' + pt.y + ') rotate(' + ang + ')');
      }
    }

    // paper plane glides along its own dotted flight path, slightly ahead
    const flight = document.getElementById('flight-path');
    const plane = document.getElementById('paper-plane');
    const flightLen = flight ? flight.getTotalLength() : 0;
    function setPlane(t) {
      if (!flight || !plane) return;
      const ft = Math.min(1, t * 1.15) * flightLen;
      const pt = flight.getPointAtLength(ft);
      const ahead = flight.getPointAtLength(Math.min(flightLen, ft + 3));
      const behind = flight.getPointAtLength(Math.max(0, ft - 3));
      const ang = Math.atan2(ahead.y - behind.y, ahead.x - behind.x) * 180 / Math.PI;
      plane.setAttribute('transform', 'translate(' + pt.x + ' ' + pt.y + ') rotate(' + ang + ')');
    }

    if (!motionOk) { setJourney(1); setPlane(1); return; }
    setJourney(0);
    setPlane(0);
    window.Motion.scroll((p) => { setJourney(p); setPlane(p); }, {
      target: svg.closest('.journey-section'),
      offset: ['start 0.85', 'end 0.5'],
    });
  }

  /* ---------- Marquee gallery ---------- */
  function initGalleryMarquee() {
    const track = document.querySelector('.gallery-track');
    if (!track) return;
    // duplicate tiles for a seamless loop
    track.append(...Array.from(track.children).map((n) => {
      const c = n.cloneNode(true);
      c.setAttribute('aria-hidden', 'true');
      return c;
    }));
    if (!motionOk) return;
    const distance = track.scrollWidth / 2;
    const anim = window.Motion.animate(
      track,
      { x: [0, -distance] },
      { duration: Math.max(30, distance / 60), ease: 'linear', repeat: Infinity }
    );
    track.addEventListener('pointerenter', () => anim.pause());
    track.addEventListener('pointerleave', () => anim.play());
  }

  /* ---------- Springy hover lift on cards & tiles ---------- */
  function initHoverLift() {
    if (!motionOk || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const { animate } = window.Motion;
    document.querySelectorAll('.photo-tile, .card, .news-card, .quick-link').forEach((el) => {
      el.addEventListener('pointerenter', () => {
        animate(el, { scale: 1.035, y: -6 }, { type: 'spring', stiffness: 320, damping: 20 });
      });
      el.addEventListener('pointerleave', () => {
        animate(el, { scale: 1, y: 0 }, { type: 'spring', stiffness: 260, damping: 22 });
      });
    });
  }

  /* ---------- Animated statistics ---------- */
  function initStats() {
    const counters = document.querySelectorAll('[data-count]');
    if (!counters.length) return;

    const run = (el) => {
      const target = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      if (!motionOk) { el.textContent = target.toLocaleString('en-IN') + suffix; return; }
      window.Motion.animate(0, target, {
        duration: 1.6,
        ease: [0.16, 1, 0.3, 1],
        onUpdate: (v) => { el.textContent = Math.round(v).toLocaleString('en-IN') + suffix; },
      });
    };

    if (!motionOk) { counters.forEach(run); return; }
    counters.forEach((el) => window.Motion.inView(el, () => run(el), { amount: 0.6 }));
  }

  /* ---------- Announcement ticker ---------- */
  function initTicker(announcements) {
    const track = document.querySelector('.announce-items');
    if (!track || !announcements.length) return;
    // duplicate the list so the marquee loops seamlessly
    const spans = announcements.concat(announcements).map((a) => {
      const s = document.createElement('span');
      s.textContent = '✦ ' + a;
      return s;
    });
    track.replaceChildren(...spans);

    if (!motionOk) return;
    const distance = track.scrollWidth / 2;
    window.Motion.animate(
      track,
      { x: [0, -distance] },
      { duration: Math.max(18, distance / 55), ease: 'linear', repeat: Infinity }
    );
  }

  /* ---------- News & updates (data/news.json) ---------- */
  const THUMB_ICONS = {
    Achievement: '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4Z"/><path d="M7 6H4a3 3 0 0 0 3 5M17 6h3a3 3 0 0 1-3 5"/></svg>',
    Event: '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/></svg>',
    Notice: '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/></svg>',
    Academics: '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M22 10 12 5 2 10l10 5 10-5ZM6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5"/></svg>',
  };
  const THUMB_TONES = { Achievement: 'gold', Event: 'green', Notice: '', Academics: '' };

  function newsCard(item) {
    const card = document.createElement('article');
    card.className = 'news-card';
    const tone = THUMB_TONES[item.category] || '';
    const icon = THUMB_ICONS[item.category] || THUMB_ICONS.Notice;
    const date = new Date(item.date).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
    const KW = { Achievement: 'trophy', Event: 'school,festival', Notice: 'school,building', Academics: 'classroom' };
    const lock = Math.abs(item.title.length * 7 + item.date.charCodeAt(9)) % 90;
    card.innerHTML =
      '<div class="thumb ' + tone + '">' +
      '<img class="thumb-img" loading="lazy" alt="" src="https://loremflickr.com/640/360/' + (KW[item.category] || 'school') + '?lock=' + lock + '" ' +
      'onload="this.parentElement.classList.add(\'has-img\')" onerror="this.remove()">' +
      icon + '</div>' +
      '<div class="news-body">' +
      '  <div class="news-meta"><span class="tag"></span><time datetime="' + item.date + '"></time></div>' +
      '  <h3></h3><p></p>' +
      '  <a class="read-more" href="news.html">Read more<span class="visually-hidden"> about ' + '</span> →</a>' +
      '</div>';
    card.querySelector('.tag').textContent = item.category;
    card.querySelector('time').textContent = date;
    card.querySelector('h3').textContent = item.title;
    card.querySelector('p').textContent = item.summary;
    card.querySelector('.visually-hidden').textContent = ' about ' + item.title;
    return card;
  }

  async function loadNews() {
    const grids = document.querySelectorAll('[data-news]');
    if (!grids.length) return;
    try {
      const res = await fetch('data/news.json');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      const items = data.items.slice().sort((a, b) => b.date.localeCompare(a.date));

      grids.forEach((grid) => {
        const limit = parseInt(grid.dataset.news, 10) || items.length;
        grid.replaceChildren(...items.slice(0, limit).map(newsCard));
        if (motionOk) {
          const cards = Array.from(grid.children);
          cards.forEach((c) => { c.style.opacity = '0'; });
          window.Motion.inView(grid, () => {
            window.Motion.animate(
              cards,
              { opacity: [0, 1], y: [26, 0] },
              { duration: 0.55, delay: window.Motion.stagger(0.08), ease: [0.22, 1, 0.36, 1] }
            );
          }, { amount: 0.1 });
        }
      });

      initTicker(data.announcements || []);
    } catch (err) {
      grids.forEach((grid) => {
        grid.innerHTML = '<p role="alert">Updates are unavailable right now. Please check back soon.</p>';
      });
    }
  }

  /* ---------- Events (data/events.json) ---------- */
  async function loadEvents() {
    const list = document.querySelector('[data-events]');
    if (!list) return;
    try {
      const res = await fetch('data/events.json');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const events = (await res.json()).events;
      list.replaceChildren(...events.map((ev) => {
        const d = new Date(ev.date);
        const row = document.createElement('article');
        row.className = 'event-row';
        row.innerHTML =
          '<div class="event-date" aria-hidden="true"><span class="day"></span><span class="month"></span></div>' +
          '<div class="event-info"><h3></h3><p></p></div>';
        row.querySelector('.day').textContent = d.getDate();
        row.querySelector('.month').textContent = d.toLocaleDateString('en-IN', { month: 'short' });
        row.querySelector('h3').textContent = ev.title;
        row.querySelector('p').textContent =
          d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) +
          ' · ' + ev.details;
        return row;
      }));
    } catch (err) {
      list.innerHTML = '<p role="alert">The events calendar is unavailable right now.</p>';
    }
  }

  /* ---------- Forms (client-side validation + demo submit) ---------- */
  function initForms() {
    document.querySelectorAll('form[data-validate]').forEach((form) => {
      const status = form.querySelector('.form-status');

      const validateField = (field) => {
        const wrap = field.closest('.field');
        const ok = field.checkValidity();
        if (wrap) wrap.classList.toggle('invalid', !ok);
        return ok;
      };

      form.querySelectorAll('input, select, textarea').forEach((field) => {
        field.addEventListener('blur', () => validateField(field));
        field.addEventListener('input', () => {
          const wrap = field.closest('.field');
          if (wrap && wrap.classList.contains('invalid') && field.checkValidity()) {
            wrap.classList.remove('invalid');
          }
        });
      });

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const fields = Array.from(form.querySelectorAll('input, select, textarea'));
        const results = fields.map((f) => validateField(f));
        const firstInvalid = fields[results.indexOf(false)];
        if (firstInvalid) {
          firstInvalid.focus();
          if (status) {
            status.className = 'form-status error';
            status.textContent = 'Please correct the highlighted fields and try again.';
          }
          return;
        }
        // Static site: no backend. Simulate a successful submission so the
        // interaction pattern (loading -> success) is in place for when a
        // form endpoint or school ERP integration is connected.
        const btn = form.querySelector('button[type="submit"]');
        const original = btn.textContent;
        btn.disabled = true;
        btn.textContent = 'Sending…';
        setTimeout(() => {
          btn.disabled = false;
          btn.textContent = original;
          form.reset();
          if (status) {
            status.className = 'form-status success';
            status.textContent = 'Thank you! Your submission has been received. Our office will respond within two working days.';
            status.focus && status.focus();
          }
        }, 900);
      });
    });
  }

  /* ---------- Boot ---------- */
  document.addEventListener('DOMContentLoaded', () => {
    const bar = injectDecor();
    initScrollFx(bar);
    initBloom();
    initHeroText();
    initJourney();
    initReveals();
    initGalleryMarquee();
    initHoverLift();
    initStats();
    loadNews();
    loadEvents();
    initForms();
  });
})();
