/* JDS Public School — ambient triangle constellation field.
   Adapted from the devadigm.com design: faint outlined triangles
   drifting across the whole page behind the content. Renders a
   single static frame under prefers-reduced-motion. */

(function () {
  'use strict';

  const PALETTE = ['#8052ff', '#ffb829', '#15846e', '#ff5fa8', '#4f8bff', '#a37bff'];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function rand(min, max) { return Math.random() * (max - min) + min; }
  function pick() { return PALETTE[Math.floor(Math.random() * PALETTE.length)]; }

  function drawTriangle(ctx, x, y, size, rotation, color, alpha) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(size * 0.87, size * 0.5);
    ctx.lineTo(-size * 0.87, size * 0.5);
    ctx.closePath();
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
      const count = Math.floor((window.innerWidth * docHeight()) / 55000);
      particles = [];
      for (let i = 0; i < count; i++) {
        particles.push({
          x: rand(0, window.innerWidth),
          y: rand(0, docHeight()),
          size: rand(1.6, 4),
          rotation: rand(0, Math.PI * 2),
          spin: rand(-0.0022, 0.0022),
          color: pick(),
          alpha: rand(0.07, 0.26),
          phase: rand(0, Math.PI * 2),
          driftAmp: rand(3, 10),
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
        const dx = Math.sin(t * p.driftSpeed + p.phase) * p.driftAmp;
        const dy = Math.cos(t * p.driftSpeed * 0.8 + p.phase) * p.driftAmp;
        drawTriangle(ctx, p.x + dx, p.y + dy, p.size, p.rotation, p.color, p.alpha);
      }
    }

    resize();
    window.addEventListener('resize', resize);
    // async content (news/events) changes the document height — rebuild once settled
    setTimeout(() => { if (Math.abs(canvas.clientHeight - docHeight()) > 200) resize(); }, 2500);

    if (reducedMotion) { draw(0); return; }
    (function loop(t) {
      draw(t || 0);
      requestAnimationFrame(loop);
    })(0);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
