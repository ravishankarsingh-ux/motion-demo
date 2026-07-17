/* JDS Public School (light edition) — pastel ambient shape field.
   Faint outlined triangles, circles, and plus-marks drifting across
   the page behind the content. Static frame under reduced motion. */

(function () {
  'use strict';

  const PALETTE = ['#8052ff', '#e09f13', '#15846e', '#ff5fa8', '#2563eb'];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function rand(min, max) { return Math.random() * (max - min) + min; }

  function drawShape(ctx, p) {
    ctx.save();
    ctx.translate(p.x + p.dx, p.y + p.dy);
    ctx.rotate(p.rotation);
    ctx.globalAlpha = p.alpha;
    ctx.strokeStyle = p.color;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    if (p.kind === 0) {              // triangle
      ctx.moveTo(0, -p.size);
      ctx.lineTo(p.size * 0.87, p.size * 0.5);
      ctx.lineTo(-p.size * 0.87, p.size * 0.5);
      ctx.closePath();
    } else if (p.kind === 1) {       // circle
      ctx.arc(0, 0, p.size, 0, Math.PI * 2);
    } else {                         // plus
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

    function docHeight() { return document.body.scrollHeight; }

    function build() {
      const count = Math.floor((window.innerWidth * docHeight()) / 52000);
      particles = [];
      for (let i = 0; i < count; i++) {
        particles.push({
          x: rand(0, window.innerWidth),
          y: rand(0, docHeight()),
          dx: 0, dy: 0,
          size: rand(2.5, 6),
          kind: Math.floor(rand(0, 3)),
          rotation: rand(0, Math.PI * 2),
          spin: rand(-0.002, 0.002),
          color: PALETTE[Math.floor(rand(0, PALETTE.length))],
          alpha: rand(0.08, 0.2),
          phase: rand(0, Math.PI * 2),
          driftAmp: rand(4, 12),
          driftSpeed: rand(0.0004, 0.001),
        });
      }
    }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = window.innerWidth * dpr;
      canvas.height = docHeight() * dpr;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = docHeight() + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
    }

    function draw(t) {
      ctx.clearRect(0, 0, window.innerWidth, docHeight());
      for (const p of particles) {
        p.rotation += p.spin;
        p.dx = Math.sin(t * p.driftSpeed + p.phase) * p.driftAmp;
        p.dy = Math.cos(t * p.driftSpeed * 0.8 + p.phase) * p.driftAmp;
        drawShape(ctx, p);
      }
    }

    resize();
    window.addEventListener('resize', resize);
    setTimeout(() => { if (Math.abs(canvas.clientHeight - docHeight()) > 200) resize(); }, 2500);

    if (reducedMotion) { draw(0); return; }
    (function loop(t) { draw(t || 0); requestAnimationFrame(loop); })(0);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
