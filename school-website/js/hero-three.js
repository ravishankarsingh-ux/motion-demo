/* JDS Public School — hero scene: the Sphere of Knowledge.
   Hundreds of glowing points assemble from scattered stardust into a
   wireframe globe as you scroll; two tilted orbit rings carry glowing
   orbs around it while the camera dollies in. Pauses off-screen and
   renders the finished sphere statically under prefers-reduced-motion. */

import * as THREE from 'three';

const THEME = {
  fog: 0x0d0d14,
  ambient: 0x9a8fd8,
  key: 0xffe3ad,
  wire: 0xd9a441,
  wireOpacity: 0.38,
  glow: 0x8052ff,
  pointA: '#ffb829',
  pointB: '#a37bff',
  ringA: 0x8052ff,
  ringB: 0x4f8bff,
  ringOpacity: 0.55,
  orbA: 0xffb829,
  orbB: 0xff5fa8,
  orbC: 0x4f8bff,
  halo: 0xd9a441,
  haloOpacity: 0.5,
};

const canvas = document.getElementById('hero-canvas');
if (canvas) init(canvas);

function init(canvas) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(THEME.fog, 16, 44);

  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 80);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'low-power',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

  /* ----- Lights ----- */
  scene.add(new THREE.AmbientLight(THEME.ambient, 0.9));
  const keyLight = new THREE.DirectionalLight(THEME.key, 1.2);
  keyLight.position.set(6, 8, 10);
  scene.add(keyLight);

  /* ----- The knowledge core ----- */
  const core = new THREE.Group();

  // wireframe shell
  const shellGeo = new THREE.IcosahedronGeometry(3, 1);
  const shell = new THREE.Mesh(
    shellGeo,
    new THREE.MeshBasicMaterial({
      color: THEME.wire,
      wireframe: true,
      transparent: true,
      opacity: 0,
    })
  );
  core.add(shell);

  // inner soft glow
  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(1.35, 24, 24),
    new THREE.MeshBasicMaterial({
      color: THEME.glow,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  core.add(glow);

  // assembling points: scattered start -> sphere-surface target
  const targetGeo = new THREE.IcosahedronGeometry(3, 3);
  const targets = targetGeo.getAttribute('position');
  const COUNT = targets.count;
  const startPos = new Float32Array(COUNT * 3);
  const livePos = new Float32Array(COUNT * 3);
  for (let i = 0; i < COUNT; i++) {
    const r = 9 + Math.random() * 10;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    startPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    startPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    startPos[i * 3 + 2] = r * Math.cos(phi);
    livePos[i * 3] = startPos[i * 3];
    livePos[i * 3 + 1] = startPos[i * 3 + 1];
    livePos[i * 3 + 2] = startPos[i * 3 + 2];
  }
  const pointsGeo = new THREE.BufferGeometry();
  pointsGeo.setAttribute('position', new THREE.BufferAttribute(livePos, 3));
  const colorArr = new Float32Array(COUNT * 3);
  const cA = new THREE.Color(THEME.pointA);
  const cB = new THREE.Color(THEME.pointB);
  for (let i = 0; i < COUNT; i++) {
    const c = Math.random() < 0.5 ? cA : cB;
    colorArr[i * 3] = c.r; colorArr[i * 3 + 1] = c.g; colorArr[i * 3 + 2] = c.b;
  }
  pointsGeo.setAttribute('color', new THREE.BufferAttribute(colorArr, 3));
  const points = new THREE.Points(
    pointsGeo,
    new THREE.PointsMaterial({
      size: 0.085,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      sizeAttenuation: true,
      depthWrite: false,
    })
  );
  core.add(points);

  /* ----- Orbit rings with glowing orbs ----- */
  const orbits = [];
  const ringSpecs = [
    { radius: 4.4, tilt: [Math.PI / 2.6, 0.3], color: THEME.ringA, orbs: [THEME.orbA, THEME.orbB] },
    { radius: 5.3, tilt: [Math.PI / 1.8, -0.5], color: THEME.ringB, orbs: [THEME.orbC] },
  ];
  ringSpecs.forEach((spec) => {
    const holder = new THREE.Group();
    holder.rotation.x = spec.tilt[0];
    holder.rotation.y = spec.tilt[1];
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(spec.radius, 0.018, 8, 120),
      new THREE.MeshBasicMaterial({ color: spec.color, transparent: true, opacity: 0 })
    );
    holder.add(ring);
    const spinner = new THREE.Group();
    spec.orbs.forEach((orbColor, k) => {
      const orb = new THREE.Mesh(
        new THREE.SphereGeometry(0.14, 16, 16),
        new THREE.MeshBasicMaterial({ color: orbColor, transparent: true, opacity: 0 })
      );
      const a = (k / spec.orbs.length) * Math.PI * 2;
      orb.position.set(Math.cos(a) * spec.radius, Math.sin(a) * spec.radius, 0);
      spinner.add(orb);
    });
    holder.add(spinner);
    core.add(holder);
    orbits.push({ ring: ring, spinner: spinner, holder: holder });
  });

  scene.add(core);

  /* ----- Backdrop halo particles ----- */
  const HALO = 420;
  const haloPos = new Float32Array(HALO * 3);
  for (let i = 0; i < HALO; i++) {
    const r = 12 + Math.random() * 16;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    haloPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    haloPos[i * 3 + 1] = (r * Math.sin(phi) * Math.sin(theta)) * 0.6;
    haloPos[i * 3 + 2] = r * Math.cos(phi) - 8;
  }
  const haloGeo = new THREE.BufferGeometry();
  haloGeo.setAttribute('position', new THREE.BufferAttribute(haloPos, 3));
  const halo = new THREE.Points(
    haloGeo,
    new THREE.PointsMaterial({
      color: THEME.halo,
      size: 0.07,
      transparent: true,
      opacity: THEME.haloOpacity,
      depthWrite: false,
    })
  );
  scene.add(halo);

  /* ----- Layout / sizing ----- */
  let wide = true;
  function resize() {
    const w = canvas.clientWidth || canvas.parentElement.clientWidth;
    const h = canvas.clientHeight || canvas.parentElement.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    wide = w >= 940;
    // sphere sits right of the copy on desktop, high-center on phones
    core.position.set(wide ? 4.6 : 0, wide ? 0 : 2.6, 0);
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  /* ----- Scroll progress (hero is a 160vh pinned stage) ----- */
  const heroEl = document.querySelector('.hero');
  function scrollProgress() {
    if (!heroEl) return 1;
    const range = heroEl.offsetHeight - window.innerHeight;
    if (range <= 0) return 1;
    return Math.min(1, Math.max(0, window.scrollY / range));
  }
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);

  function apply(pRaw, t) {
    // assembly finishes at ~70% of the scrub
    const p = easeOut(Math.min(1, pRaw * 1.45));

    for (let i = 0; i < COUNT; i++) {
      const ix = i * 3;
      livePos[ix] = startPos[ix] + (targets.getX(i) - startPos[ix]) * p;
      livePos[ix + 1] = startPos[ix + 1] + (targets.getY(i) - startPos[ix + 1]) * p;
      livePos[ix + 2] = startPos[ix + 2] + (targets.getZ(i) - startPos[ix + 2]) * p;
    }
    pointsGeo.getAttribute('position').needsUpdate = true;

    shell.material.opacity = THEME.wireOpacity * p;
    shell.scale.setScalar(0.35 + 0.65 * p);
    glow.material.opacity = 0.3 * p;
    const late = Math.max(0, (p - 0.45) / 0.55);
    orbits.forEach((o) => {
      o.ring.material.opacity = THEME.ringOpacity * late;
      o.spinner.children.forEach((orb) => { orb.material.opacity = late; });
    });

    core.rotation.y = t * 0.12;
    core.rotation.x = Math.sin(t * 0.08) * 0.1;
    orbits[0].spinner.rotation.z = t * 0.5;
    orbits[1].spinner.rotation.z = -t * 0.34;
    halo.rotation.y = t * 0.015;

    // camera: dolly in as the sphere assembles
    const targetX = pointer.x * 1.2;
    const targetY = -pointer.y * 0.8;
    camera.position.x += (targetX - camera.position.x) * 0.04;
    camera.position.y += (targetY - camera.position.y) * 0.04;
    camera.position.z = 24 - 8 * p;
    // aim between the copy and the sphere so the globe stays right-of-center
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
