/* Nalanda Public School — Three.js hero scene.
   A slowly drifting "constellation of knowledge": golden particle
   field, wireframe icosahedra and a torus-knot, with gentle mouse
   parallax and scroll-linked camera dolly. Renders a single static
   frame when prefers-reduced-motion is set. */

import * as THREE from 'three';

const canvas = document.getElementById('hero-canvas');
if (canvas) init(canvas);

function init(canvas) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x12263f, 14, 34);

  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 60);
  camera.position.set(0, 0, 16);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'low-power',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  /* ----- Lights ----- */
  scene.add(new THREE.AmbientLight(0x8fb0d8, 0.7));
  const keyLight = new THREE.DirectionalLight(0xffe3ad, 1.4);
  keyLight.position.set(6, 8, 10);
  scene.add(keyLight);
  const rimLight = new THREE.DirectionalLight(0x4f8bff, 0.8);
  rimLight.position.set(-8, -4, -6);
  scene.add(rimLight);

  /* ----- Golden particle field ----- */
  const PARTICLES = 900;
  const positions = new Float32Array(PARTICLES * 3);
  const sizes = new Float32Array(PARTICLES);
  for (let i = 0; i < PARTICLES; i++) {
    // spherical shell distribution so particles wrap the scene
    const r = 9 + Math.random() * 14;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = (r * Math.sin(phi) * Math.sin(theta)) * 0.55;
    positions[i * 3 + 2] = r * Math.cos(phi) - 6;
    sizes[i] = Math.random();
  }
  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const particles = new THREE.Points(
    particleGeo,
    new THREE.PointsMaterial({
      color: 0xd9a441,
      size: 0.09,
      transparent: true,
      opacity: 0.75,
      sizeAttenuation: true,
      depthWrite: false,
    })
  );
  scene.add(particles);

  /* ----- Floating geometry ----- */
  const shapes = new THREE.Group();

  const wireMat = new THREE.MeshStandardMaterial({
    color: 0xd9a441,
    metalness: 0.55,
    roughness: 0.3,
    wireframe: true,
    transparent: true,
    opacity: 0.85,
  });
  const solidMat = new THREE.MeshStandardMaterial({
    color: 0x2f5c96,
    metalness: 0.35,
    roughness: 0.45,
    flatShading: true,
  });

  const knot = new THREE.Mesh(new THREE.TorusKnotGeometry(2.1, 0.55, 140, 18), wireMat);
  knot.position.set(5.4, 0.4, -2);
  shapes.add(knot);

  const icoBig = new THREE.Mesh(new THREE.IcosahedronGeometry(1.5, 0), solidMat);
  icoBig.position.set(-6.5, 2.2, -4);
  shapes.add(icoBig);

  const icoSmall = new THREE.Mesh(new THREE.IcosahedronGeometry(0.8, 0), wireMat.clone());
  icoSmall.position.set(-4.2, -2.6, -1);
  shapes.add(icoSmall);

  const octa = new THREE.Mesh(new THREE.OctahedronGeometry(0.9, 0), solidMat.clone());
  octa.material.color.set(0xd9a441);
  octa.position.set(3.2, -3.1, -5);
  shapes.add(octa);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(3.4, 0.05, 12, 90),
    new THREE.MeshBasicMaterial({ color: 0x6f8fb8, transparent: true, opacity: 0.5 })
  );
  ring.position.copy(knot.position);
  ring.rotation.x = Math.PI / 2.4;
  shapes.add(ring);

  scene.add(shapes);

  /* ----- Sizing ----- */
  function resize() {
    const w = canvas.clientWidth || canvas.parentElement.clientWidth;
    const h = canvas.clientHeight || canvas.parentElement.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // pull the scene back on narrow screens so it stays composed
    camera.position.z = w < 700 ? 20 : 16;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  if (reducedMotion) {
    renderer.render(scene, camera);
    return;
  }

  /* ----- Pointer parallax (desktop only, passive) ----- */
  let targetX = 0;
  let targetY = 0;
  window.addEventListener('pointermove', (e) => {
    targetX = (e.clientX / window.innerWidth - 0.5) * 1.6;
    targetY = (e.clientY / window.innerHeight - 0.5) * 1.0;
  }, { passive: true });

  /* ----- Scroll-linked dolly ----- */
  let scrollT = 0;
  window.addEventListener('scroll', () => {
    scrollT = Math.min(1, window.scrollY / window.innerHeight);
  }, { passive: true });

  /* ----- Animation loop (paused when hero is off-screen) ----- */
  let running = true;
  const io = new IntersectionObserver(([entry]) => { running = entry.isIntersecting; }, { threshold: 0 });
  io.observe(canvas);

  const clock = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    if (!running) return;
    const t = clock.getElapsedTime();

    particles.rotation.y = t * 0.02;
    knot.rotation.x = t * 0.18;
    knot.rotation.y = t * 0.12;
    ring.rotation.z = t * 0.1;
    icoBig.rotation.y = t * 0.25;
    icoBig.position.y = 2.2 + Math.sin(t * 0.7) * 0.35;
    icoSmall.rotation.x = t * 0.3;
    icoSmall.position.y = -2.6 + Math.sin(t * 0.9 + 1.5) * 0.3;
    octa.rotation.y = t * 0.35;
    octa.position.y = -3.1 + Math.sin(t * 0.6 + 3) * 0.4;

    camera.position.x += (targetX - camera.position.x) * 0.04;
    camera.position.y += (-targetY + scrollT * 2.5 - camera.position.y) * 0.04;
    camera.lookAt(0, 0, -2);

    renderer.render(scene, camera);
  });
}
