/* JDS Public School (light edition) — pastel ambient shape field.
   Optimized: fixed viewport-sized canvas, particles culled to the
   visible band, 30fps draw budget. Static under reduced motion. */

(function () {
  'use strict';

  const PALETTE = ['#8052ff', '#e09f13', '#15846e', '#ff5fa8', '#2563eb'];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function rand(min, max) { return Math.random() * (max - min) + min; }

  function makeParticle(w, docH) {
    return {
      x: rand(0, w),
      y: rand(0, docH),
      size: rand(2.5, 6),
      kind: Math.floor(rand(0, 3)),
      rotation: rand(0, Math.PI * 2),
      spin: rand(-0.002, 0.002),
      color: PALETTE[Math.floor(rand(0, PALETTE.length))],
      alpha: rand(0.08, 0.2),
      phase: rand(0, Math.PI * 2),
      driftAmp: rand(4, 12),
      driftSpeed: rand(0.0004, 0.001),
    };
  }

  function drawParticle(ctx, p, x, y) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(p.rotation);
    ctx.globalAlpha = p.alpha;
    ctx.strokeStyle = p.color;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    if (p.kind === 0) {
      ctx.moveTo(0, -p.size);
      ctx.lineTo(p.size * 0.87, p.size * 0.5);
      ctx.lineTo(-p.size * 0.87, p.size * 0.5);
      ctx.closePath();
    } else if (p.kind === 1) {
      ctx.arc(0, 0, p.size, 0, Math.PI * 2);
    } else {
      ctx.moveTo(-p.size, 0); ctx.lineTo(p.size, 0);
      ctx.moveTo(0, -p.size); ctx.lineTo(0, p.size);
    }
    ctx.stroke();
    ctx.restore();
  }

  function init() {
    const canvas = document.createElement('canvas');
    canvas.id = 'ambient-field';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.insertBefore(canvas, document.body.firstChild);
    const ctx = canvas.getContext('2d');
    let particles = [];
    let viewW = 0;
    let viewH = 0;

    function docHeight() { return document.body.scrollHeight; }

    // Particles live in document coordinates but the canvas is only
    // viewport-sized and fixed: each frame we draw just the particles
    // currently on screen, offset by scrollY. This keeps the canvas
    // small and the per-frame work tiny no matter how long the page is.
    function build() {
      const count = Math.min(380, Math.floor((viewW * docHeight()) / 110000));
      particles = [];
      for (let i = 0; i < count; i++) particles.push(makeParticle(viewW, docHeight()));
    }

    function resize() {
      viewW = window.innerWidth;
      viewH = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = viewW * dpr;
      canvas.height = viewH * dpr;
      canvas.style.width = viewW + 'px';
      canvas.style.height = viewH + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
    }

    function draw(t) {
      ctx.clearRect(0, 0, viewW, viewH);
      const sy = window.scrollY;
      for (const p of particles) {
        const py = p.y - sy;
        if (py < -40 || py > viewH + 40) continue;
        p.rotation += p.spin;
        const dx = Math.sin(t * p.driftSpeed + p.phase) * p.driftAmp;
        const dy = Math.cos(t * p.driftSpeed * 0.8 + p.phase) * p.driftAmp;
        drawParticle(ctx, p, p.x + dx, py + dy);
      }
    }

    resize();
    window.addEventListener('resize', resize);
    setTimeout(() => { if (particles.length && Math.abs(particles[particles.length - 1].y - docHeight()) > docHeight() * 0.5) build(); }, 2500);

    if (reducedMotion) { draw(0); return; }
    let last = 0;
    (function loop(t) {
      // 30fps is plenty for ambient drift and halves the paint cost
      if (t - last >= 33) { draw(t); last = t; }
      requestAnimationFrame(loop);
    })(0);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
