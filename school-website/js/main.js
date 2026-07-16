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

  /* ---------- Scroll reveal animations ---------- */
  function initReveals() {
    if (!motionOk) return;
    const { animate, inView, stagger } = window.Motion;

    document.querySelectorAll('.reveal').forEach((el) => {
      inView(el, (target) => {
        animate(
          target,
          { opacity: [0, 1], y: [34, 0] },
          { duration: 0.7, ease: [0.22, 1, 0.36, 1] }
        );
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
          { opacity: [0, 1], y: [26, 0] },
          { duration: 0.55, delay: stagger(0.08), ease: [0.22, 1, 0.36, 1] }
        );
      }, { amount: 0.15 });
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
    initReveals();
    initStats();
    loadNews();
    loadEvents();
    initForms();
  });
})();
