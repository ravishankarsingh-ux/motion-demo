/* JDS Public School (light edition) — hero scene: the Learning Brain.
   A particle cloud assembles into a human-brain silhouette as you
   scroll, synapses flicker across it, and info labels pinned to its
   regions connect brain functions to school programmes. Pauses
   off-screen; renders the finished brain statically under
   prefers-reduced-motion. */

import * as THREE from 'three';

const canvas = document.getElementById('hero-canvas');
if (canvas) init(canvas);

function init(canvas) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xf2f6fb, 16, 44);

  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 80);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'low-power',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

  scene.add(new THREE.AmbientLight(0xffffff, 0.9));

  /* ----- Brain-shaped target cloud ----- */
  const core = new THREE.Group();

  function brainPoint() {
    // sample a direction, shape it into a two-lobed, bumpy ellipsoid
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const sx = Math.sin(phi) * Math.cos(theta);
    const sy = Math.cos(phi);
    const sz = Math.sin(phi) * Math.sin(theta);
    const bump = 1 + 0.1 * Math.sin(4 * theta + 2 * phi) + 0.07 * Math.sin(7 * phi + 1.7);
    let X = sx * 3.0 * bump;
    let Y = sy * 2.15 * bump * (sy > 0 ? 1 : 0.9);
    let Z = sz * 2.55 * bump;
    X += Math.sign(X) * 0.22;                     // hemisphere split
    if (Y < -1.35) Y = -1.35 - (Y + 1.35) * 0.45; // flatter base
    return [X, Y, Z];
  }

  const COUNT = 850;
  const targetsArr = new Float32Array(COUNT * 3);
  const startPos = new Float32Array(COUNT * 3);
  const livePos = new Float32Array(COUNT * 3);
  for (let i = 0; i < COUNT; i++) {
    const bp = brainPoint();
    targetsArr[i * 3] = bp[0]; targetsArr[i * 3 + 1] = bp[1]; targetsArr[i * 3 + 2] = bp[2];
    const r = 9 + Math.random() * 10;
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    startPos[i * 3] = r * Math.sin(ph) * Math.cos(th);
    startPos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
    startPos[i * 3 + 2] = r * Math.cos(ph);
    livePos[i * 3] = startPos[i * 3];
    livePos[i * 3 + 1] = startPos[i * 3 + 1];
    livePos[i * 3 + 2] = startPos[i * 3 + 2];
  }
  const pointsGeo = new THREE.BufferGeometry();
  pointsGeo.setAttribute('position', new THREE.BufferAttribute(livePos, 3));
  const colorArr = new Float32Array(COUNT * 3);
  const palette = [new THREE.Color('#2563eb'), new THREE.Color('#b8862c'), new THREE.Color('#8052ff')];
  for (let i = 0; i < COUNT; i++) {
    const c = palette[Math.floor(Math.random() * palette.length)];
    colorArr[i * 3] = c.r; colorArr[i * 3 + 1] = c.g; colorArr[i * 3 + 2] = c.b;
  }
  pointsGeo.setAttribute('color', new THREE.BufferAttribute(colorArr, 3));
  const points = new THREE.Points(
    pointsGeo,
    new THREE.PointsMaterial({
      size: 0.075,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      sizeAttenuation: true,
      depthWrite: false,
    })
  );
  core.add(points);

  /* ----- Synapse flickers: two additive layers pulsing in waves ----- */
  function synapseLayer(n, color) {
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const bp = brainPoint();
      arr[i * 3] = bp[0] * 0.97; arr[i * 3 + 1] = bp[1] * 0.97; arr[i * 3 + 2] = bp[2] * 0.97;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    const m = new THREE.PointsMaterial({
      color: color,
      size: 0.16,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    core.add(new THREE.Points(g, m));
    return m;
  }
  const synA = synapseLayer(60, 0x8052ff);
  const synB = synapseLayer(60, 0xd9a441);

  // faint inner glow
  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(1.5, 24, 24),
    new THREE.MeshBasicMaterial({
      color: 0x8fb3ff,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  glow.scale.set(1.4, 1, 1.15);
  core.add(glow);
  scene.add(core);

  /* ----- Region labels: brain functions -> school programmes ----- */
  const labelDefs = [
    { anchor: new THREE.Vector3(2.4, 1.5, 0.9), dot: '#2563eb', title: 'Logic · Mathematics', sub: 'Olympiad training, Classes VI–XII' },
    { anchor: new THREE.Vector3(-2.4, 1.6, 0.7), dot: '#ec4899', title: 'Creativity · Arts', sub: 'Conservatory, theatre & studios' },
    { anchor: new THREE.Vector3(0.3, 0.4, 2.6), dot: '#b8862c', title: 'Language', sub: 'English · Hindi · Sanskrit · French' },
    { anchor: new THREE.Vector3(-0.6, -1.5, -2.1), dot: '#15846e', title: 'Movement · Sport', sub: '16 acres of fields & an Olympic pool' },
  ];
  const stage = document.querySelector('.hero-sticky') || canvas.parentElement;
  labelDefs.forEach((d) => {
    const el = document.createElement('span');
    el.className = 'hero-label';
    el.innerHTML = '<span><span class="lbl-dot" style="background:' + d.dot + '"></span>' + d.title + '</span><small>' + d.sub + '</small>';
    stage.appendChild(el);
    d.el = el;
  });
  const tmpVec = new THREE.Vector3();
  const camDir = new THREE.Vector3();

  function updateLabels(late) {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    camDir.copy(camera.position).sub(core.position).normalize();
    labelDefs.forEach((d) => {
      tmpVec.copy(d.anchor).applyMatrix4(core.matrixWorld);
      const facing = tmpVec.clone().sub(core.position).normalize().dot(camDir);
      const v = tmpVec.project(camera);
      const x = (v.x * 0.5 + 0.5) * w;
      const y = (-v.y * 0.5 + 0.5) * h;
      d.el.style.transform = 'translate(-50%, -150%) translate(' + x + 'px, ' + y + 'px)';
      d.el.style.opacity = String(Math.max(0, late * (0.1 + 0.9 * Math.max(0, facing))));
    });
  }

  /* ----- Layout / sizing ----- */
  let wide = true;
  function resize() {
    const w = canvas.clientWidth || canvas.parentElement.clientWidth;
    const h = canvas.clientHeight || canvas.parentElement.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    wide = w >= 940;
    core.position.set(wide ? 4.6 : 0, wide ? 0 : 2.6, 0);
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  /* ----- Scroll scrub (hero is a 160vh pinned stage) ----- */
  const heroEl = document.querySelector('.hero');
  function scrollProgress() {
    if (!heroEl) return 1;
    const range = heroEl.offsetHeight - window.innerHeight;
    if (range <= 0) return 1;
    return Math.min(1, Math.max(0, window.scrollY / range));
  }
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);

  function apply(pRaw, t) {
    const p = easeOut(Math.min(1, pRaw * 1.45));

    for (let i = 0; i < COUNT; i++) {
      const ix = i * 3;
      livePos[ix] = startPos[ix] + (targetsArr[ix] - startPos[ix]) * p;
      livePos[ix + 1] = startPos[ix + 1] + (targetsArr[ix + 1] - startPos[ix + 1]) * p;
      livePos[ix + 2] = startPos[ix + 2] + (targetsArr[ix + 2] - startPos[ix + 2]) * p;
    }
    pointsGeo.getAttribute('position').needsUpdate = true;

    glow.material.opacity = 0.22 * p;
    const late = Math.max(0, (p - 0.45) / 0.55);
    // synapses flicker in alternating waves once the brain has formed
    synA.opacity = late * (0.2 + 0.6 * Math.max(0, Math.sin(t * 1.7)));
    synB.opacity = late * (0.2 + 0.6 * Math.max(0, Math.sin(t * 1.7 + Math.PI)));

    core.rotation.y = t * 0.14;
    core.rotation.x = Math.sin(t * 0.07) * 0.06;
    core.updateMatrixWorld();

    updateLabels(late);

    const targetX = pointer.x * 1.2;
    const targetY = -pointer.y * 0.8;
    camera.position.x += (targetX - camera.position.x) * 0.04;
    camera.position.y += (targetY - camera.position.y) * 0.04;
    camera.position.z = 24 - 8 * p;
    camera.lookAt(core.position.x * 0.3, core.position.y * 0.55, 0);
  }

  const pointer = { x: 0, y: 0 };
  window.addEventListener('pointermove', (e) => {
    pointer.x = (e.clientX / window.innerWidth - 0.5) * 2;
    pointer.y = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  if (reducedMotion) {
    apply(1, 0.5);
    renderer.render(scene, camera);
    return;
  }

  let running = true;
  const io = new IntersectionObserver(([entry]) => { running = entry.isIntersecting; }, { threshold: 0 });
  io.observe(canvas);

  const clock = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    if (!running) return;
    apply(scrollProgress(), clock.getElapsedTime());
    renderer.render(scene, camera);
  });
}
