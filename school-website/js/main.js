/* Nalanda Public School — shared behavior.
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

    // pinned hero: content holds while the lotus blooms, then lifts away
    const heroInner = document.querySelector('.hero-inner');
    const hero = document.querySelector('.hero');
    if (hero && heroInner) {
      scroll((p) => {
        const out = Math.max(0, (p - 0.72) / 0.28);
        heroInner.style.opacity = String(1 - out);
        heroInner.style.transform = 'translateY(' + (out * -90) + 'px)';
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
  const REVEAL_VARIANTS = {
    up:    { opacity: [0, 1], y: [40, 0], filter: ['blur(8px)', 'blur(0px)'] },
    left:  { opacity: [0, 1], x: [-64, 0], filter: ['blur(6px)', 'blur(0px)'] },
    right: { opacity: [0, 1], x: [64, 0], filter: ['blur(6px)', 'blur(0px)'] },
    zoom:  { opacity: [0, 1], scale: [0.86, 1], filter: ['blur(6px)', 'blur(0px)'] },
  };

  function initReveals() {
    if (!motionOk) return;
    const { animate, inView, stagger } = window.Motion;

    document.querySelectorAll('.reveal').forEach((el) => {
      const variant = REVEAL_VARIANTS[el.dataset.reveal] || REVEAL_VARIANTS.up;
      inView(el, (target) => {
        animate(target, variant, { duration: 0.8, ease: [0.22, 1, 0.36, 1] });
      }, { amount: 0.18 });
    });

    // Grids whose children cascade in one after another
    document.querySelectorAll('[data-stagger]').forEach((group) => {
      const items = Array.from(group.children);
      if (!items.length) return;
      items.forEach((it) => { it.style.opacity = '0'; });
      inView(group, () => {
        animate(
          items,
          { opacity: [0, 1], y: [40, 0], scale: [0.94, 1] },
          { duration: 0.6, delay: stagger(0.09), ease: [0.22, 1, 0.36, 1] }
        );
      }, { amount: 0.12 });
    });
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
      { opacity: [0, 1], y: [42, 0], filter: ['blur(10px)', 'blur(0px)'] },
      { duration: 0.9, delay: stagger(0.13), ease: [0.22, 1, 0.36, 1] }
    );

    const word = document.getElementById('rotate-word');
    if (!word) return;
    let i = 0;
    setInterval(() => {
      animate(word, { y: [0, '-115%'], opacity: [1, 0] }, { duration: 0.35, ease: 'easeIn' })
        .finished.then(() => {
          i = (i + 1) % ROTATE_WORDS.length;
          word.textContent = ROTATE_WORDS[i];
          animate(word, { y: ['115%', 0], opacity: [0, 1] }, { duration: 0.45, ease: [0.22, 1, 0.36, 1] });
        });
    }, 3200);
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

  /* ---------- 3D tilt on cards & tiles ---------- */
  function initTilt() {
    if (!motionOk || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    document.querySelectorAll('.photo-tile, .card').forEach((el) => {
      el.setAttribute('data-tilt', '');
      let raf = 0;
      el.addEventListener('pointermove', (e) => {
        if (raf) return;
        raf = requestAnimationFrame(() => {
          raf = 0;
          const r = el.getBoundingClientRect();
          const rx = ((e.clientY - r.top) / r.height - 0.5) * -9;
          const ry = ((e.clientX - r.left) / r.width - 0.5) * 9;
          el.style.transform = 'perspective(900px) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg) translateY(-4px)';
        });
      });
      el.addEventListener('pointerleave', () => {
        el.style.transition = 'transform 350ms cubic-bezier(0.22, 1, 0.36, 1)';
        el.style.transform = '';
        setTimeout(() => { el.style.transition = ''; }, 380);
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
    card.innerHTML =
      '<div class="thumb ' + tone + '">' + icon + '</div>' +
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
    initReveals();
    initGalleryMarquee();
    initTilt();
    initStats();
    loadNews();
    loadEvents();
    initForms();
  });
})();
