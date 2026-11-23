// Three.js scene: Sun, bodies, faint orbits, belts, Betelgeuse, starfield,
// hover / click picking and HTML labels projected from 3D.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/OrbitControls.js';
import { BODIES, BELTS, BETELGEUSE, bySlug } from './bodies.js';

const ORBIT_COLOR = 0xc9c3fa;
const ORBIT_OPACITY = 0.12;
const TAU = Math.PI * 2;

export function createScene(canvas, labelLayer) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 1);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.05, 6000);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.rotateSpeed = 0.5;
  controls.zoomSpeed = 0.7;

  const loader = new THREE.TextureLoader();
  const tex = (url) => { const t = loader.load(url); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };

  // ── lighting ──
  scene.add(new THREE.AmbientLight(0xffffff, 0.14));
  const sunLight = new THREE.PointLight(0xfff4e0, 3.2, 0, 0);
  scene.add(sunLight);

  // ── starfield ──
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(3000, 48, 24),
    new THREE.MeshBasicMaterial({ map: tex('textures/2k_stars_milky_way.jpg'), side: THREE.BackSide, color: 0x6a6a7a, depthWrite: false })
  );
  scene.add(sky);
  scene.add(makePoints(1800, () => randomOnSphere(1500 + Math.random() * 800), 0xffffff, 1.6, 0.75, false));

  // ── bodies ──
  const nodes = {};        // slug -> { def, pivot, holder, mesh, hit, angle, speed, spin }
  const hitTargets = [];   // clickable invisible spheres

  for (const def of BODIES) {
    const pivot = new THREE.Object3D();
    const holder = new THREE.Object3D();
    pivot.add(holder);
    holder.position.x = def.orbit;
    const parentNode = def.parent ? nodes[def.parent] : null;
    (parentNode ? parentNode.holder : scene).add(pivot);

    let mesh;
    const geo = new THREE.SphereGeometry(def.radius, 64, 32);
    if (def.emissive) {
      mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex(def.texture) }));
      const glow = new THREE.Sprite(new THREE.SpriteMaterial({
        map: glowTexture(), color: 0xffb347, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
      }));
      glow.scale.setScalar(def.radius * 5.5);
      holder.add(glow);
    } else {
      const map = def.texture === 'procedural:titan' ? titanTexture() : tex(def.texture);
      mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
        map, roughness: 1, metalness: 0, color: def.tint ?? 0xffffff,
      }));
    }
    const axis = new THREE.Object3D();      // axial tilt
    axis.rotation.z = def.tilt || 0;
    axis.add(mesh);
    holder.add(axis);

    if (def.rings) axis.add(saturnRings(def.radius, tex));

    // faint orbit line
    if (def.orbit > 0) {
      const line = orbitLine(def.orbit, def.parent ? 0.07 : ORBIT_OPACITY);
      (parentNode ? parentNode.holder : scene).add(line);
    }

    // generous invisible hit sphere so small planets are easy to click
    let hit = null;
    if (def.page) {
      hit = new THREE.Mesh(new THREE.SphereGeometry(Math.max(def.radius * 1.6, 2.2), 12, 8), new THREE.MeshBasicMaterial());
      hit.visible = false;
      hit.userData.slug = def.slug;
      holder.add(hit);
      hitTargets.push(hit);
    }

    const angle = def.angle ?? hash(def.slug) * TAU;
    pivot.rotation.y = angle;
    // Kepler-ish: angular speed ∝ r^-1.5, compressed for watchability
    const speed = def.orbit ? (def.parent ? 0.25 : 0.9 * Math.pow(def.orbit / 27, -1.5) * 0.05) : 0;
    nodes[def.slug] = { def, pivot, holder, mesh, hit, speed, spin: def.emissive ? 0.02 : 0.12 };
  }

  // ── belts ──
  const beltObjs = BELTS.map(b => {
    const pts = makePoints(b.count, () => {
      const a = Math.random() * TAU, r = b.inner + Math.random() * (b.outer - b.inner);
      return new THREE.Vector3(Math.cos(a) * r, (Math.random() - 0.5) * (b.outer - b.inner) * 0.18, Math.sin(a) * r);
    }, b.color, b.size, b.opacity, true);
    scene.add(pts);
    return { def: b, pts };
  });

  // ── Betelgeuse ──
  const betel = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTexture(), color: 0xff5a2a, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  betel.position.fromArray(BETELGEUSE.position);
  betel.scale.setScalar(26);
  const betelCore = new THREE.Mesh(new THREE.SphereGeometry(2.2, 16, 8), new THREE.MeshBasicMaterial({ color: 0xffb08a }));
  betelCore.position.copy(betel.position);
  scene.add(betel, betelCore);

  // ── HTML labels ──
  const labels = [];
  const addLabel = (text, getPos, kind, sub, slug, minor) => {
    const el = document.createElement(slug ? 'button' : 'div');
    el.className = `lbl lbl-${kind}${minor ? ' lbl-minor' : ''}`;
    el.innerHTML = `<span class="lbl-name">${text}</span>${sub ? `<span class="lbl-sub">${sub}</span>` : ''}`;
    if (slug) { el.type = 'button'; el.dataset.slug = slug; el.tabIndex = -1; }
    labelLayer.appendChild(el);
    labels.push({ el, getPos, kind, slug });
    return el;
  };
  const tmp = new THREE.Vector3();
  for (const n of Object.values(nodes)) {
    const d = n.def;
    if (d.emissive) continue;
    const pos = () => n.holder.getWorldPosition(tmp).clone().add(new THREE.Vector3(0, d.radius * 1.25, 0));
    if (d.moonLabel) addLabel(d.name.toUpperCase(), pos, 'always', null, d.page ? d.slug : null, !d.page && !d.parent);
    else addLabel(d.name.toUpperCase(), pos, 'hover', d.tagline, d.slug);
  }
  addLabel('SUN', () => new THREE.Vector3(0, 7.6, 0), 'always', null, 'sun');
  for (const b of beltObjs) {
    const r = (b.def.inner + b.def.outer) / 2, a = b.def.labelAngle;
    addLabel(b.def.name.toUpperCase(), () => new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r), 'always', null, null, true);
  }
  addLabel(BETELGEUSE.name.toUpperCase(), () => betel.position.clone().add(new THREE.Vector3(0, 9, 0)), 'always', BETELGEUSE.note);

  // ── picking ──
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let hovered = null;
  let onPick = () => {};
  let pickingEnabled = true;

  function pick(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const hits = raycaster.intersectObjects(hitTargets, false);
    return hits.length ? hits[0].object.userData.slug : null;
  }
  canvas.addEventListener('pointermove', e => {
    if (!pickingEnabled || e.pointerType === 'touch') return;
    const slug = pick(e.clientX, e.clientY);
    if (slug !== hovered) { hovered = slug; canvas.style.cursor = slug ? 'pointer' : ''; }
  });
  canvas.addEventListener('pointerleave', () => { hovered = null; });
  let down = null;
  canvas.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY }; });
  canvas.addEventListener('pointerup', e => {
    if (!down || !pickingEnabled) return;
    const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
    down = null;
    if (moved > 6) return;              // it was a drag, not a click
    const slug = pick(e.clientX, e.clientY);
    if (slug) onPick(slug);
  });
  labelLayer.addEventListener('click', e => {
    const b = e.target.closest('button[data-slug]');
    if (b && pickingEnabled) onPick(b.dataset.slug);
  });

  // ── sizing ──
  const size = { w: 1, h: 1 };
  function resize() {
    size.w = window.innerWidth; size.h = window.innerHeight;
    renderer.setSize(size.w, size.h, false);
    camera.aspect = size.w / size.h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  // ── loop ──
  const state = { orbiting: true, focus: null, showLabels: true, reducedMotion: false, beforeRender: null };
  const clock = new THREE.Clock();
  const proj = new THREE.Vector3();

  // In a close-up, hide any other body sitting between the camera and the focus
  // (e.g. Mercury drifting in front of the Sun).
  const vA = new THREE.Vector3(), vB = new THREE.Vector3();
  function hideOccluders() {
    const f = state.focus && nodes[state.focus];
    for (const n of Object.values(nodes)) {
      let show = true;
      if (f && n !== f) {
        f.holder.getWorldPosition(vA).sub(camera.position);
        n.holder.getWorldPosition(vB).sub(camera.position);
        const dF = vA.length(), dN = vB.length();
        if (dN < dF) {
          const fr = f.def.radius * (f.def.rings ? 2.3 : 1.15);
          show = vA.angleTo(vB) > Math.atan2(fr + n.def.radius * 1.2, dN) * 1.05 + 0.02;
        }
      }
      n.mesh.visible = show;
    }
  }

  function frame() {
    const dt = Math.min(clock.getDelta(), 0.05);
    const motion = state.reducedMotion ? 0 : 1;
    for (const n of Object.values(nodes)) {
      if (state.orbiting) n.pivot.rotation.y += n.speed * dt * motion;
      n.mesh.rotation.y += n.spin * dt * (motion || 0.0);
    }
    if (state.orbiting) for (const b of beltObjs) b.pts.rotation.y += 0.004 * dt * motion;

    state.beforeRender?.(dt);
    if (controls.enabled) controls.update();
    hideOccluders();
    renderer.render(scene, camera);

    // labels
    for (const L of labels) {
      const visible = state.showLabels && (L.kind === 'always' || L.slug === hovered);
      if (!visible) { L.el.classList.remove('on'); continue; }
      proj.copy(L.getPos()).project(camera);
      if (proj.z > 1 || proj.z < -1) { L.el.classList.remove('on'); continue; }
      const x = (proj.x * 0.5 + 0.5) * size.w, y = (-proj.y * 0.5 + 0.5) * size.h;
      L.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -100%)`;
      L.el.classList.add('on');
      L.el.classList.toggle('hot', L.slug === hovered);
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  return {
    THREE, renderer, scene, camera, controls, nodes, size, state,
    worldPos: (slug) => nodes[slug].holder.getWorldPosition(new THREE.Vector3()),
    radiusOf: (slug) => bySlug[slug].radius * (bySlug[slug].rings ? 2.3 : 1),
    onPick: (fn) => { onPick = fn; },
    setPicking: (on) => { pickingEnabled = on; if (!on) { hovered = null; canvas.style.cursor = ''; } },
  };
}

// ── helpers ──────────────────────────────────────────────────────────────────

function orbitLine(r, opacity) {
  const pts = [];
  for (let i = 0; i <= 256; i++) { const a = (i / 256) * TAU; pts.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r)); }
  return new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(pts),
    new THREE.LineBasicMaterial({ color: ORBIT_COLOR, transparent: true, opacity, depthWrite: false })
  );
}

function makePoints(count, gen, color, size, opacity, attenuate) {
  const arr = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) { const v = gen(); arr.set([v.x, v.y, v.z], i * 3); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(arr, 3));
  return new THREE.Points(g, new THREE.PointsMaterial({
    color, size, sizeAttenuation: attenuate, transparent: true, opacity, depthWrite: false, map: dotTexture(), alphaTest: 0.01,
  }));
}

function randomOnSphere(r) {
  const u = Math.random() * 2 - 1, t = Math.random() * TAU, s = Math.sqrt(1 - u * u);
  return new THREE.Vector3(s * Math.cos(t) * r, u * r, s * Math.sin(t) * r);
}

function saturnRings(r, tex) {
  const inner = r * 1.25, outer = r * 2.3;
  const geo = new THREE.RingGeometry(inner, outer, 160, 1);
  const pos = geo.attributes.position, uv = geo.attributes.uv, v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    uv.setXY(i, (v.length() - inner) / (outer - inner), 0.5);
  }
  const map = new THREE.TextureLoader().load('textures/2k_saturn_ring_alpha.png');
  map.colorSpace = THREE.SRGBColorSpace;
  const ring = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
    map, transparent: true, side: THREE.DoubleSide, roughness: 1, metalness: 0, depthWrite: false,
  }));
  ring.rotation.x = -Math.PI / 2;
  return ring;
}

let _glow, _dot;
function glowTexture() {
  if (_glow) return _glow;
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.2, 'rgba(255,255,255,0.55)');
  grd.addColorStop(0.5, 'rgba(255,255,255,0.12)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 256, 256);
  return (_glow = new THREE.CanvasTexture(c));
}
function dotTexture() {
  if (_dot) return _dot;
  const c = document.createElement('canvas'); c.width = c.height = 32;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  grd.addColorStop(0, 'rgba(255,255,255,1)'); grd.addColorStop(0.6, 'rgba(255,255,255,0.6)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 32, 32);
  return (_dot = new THREE.CanvasTexture(c));
}
function titanTexture() {
  // Titan is wrapped in orange haze, so a soft banded texture reads correctly.
  const c = document.createElement('canvas'); c.width = 512; c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#d69a45'; g.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 90; i++) {
    const y = Math.random() * 256, h = 2 + Math.random() * 14;
    g.fillStyle = `rgba(${Math.random() < 0.5 ? '240,190,110' : '170,110,40'},${0.08 + Math.random() * 0.14})`;
    g.fillRect(0, y, 512, h);
  }
  g.fillStyle = 'rgba(120,70,25,0.25)'; g.fillRect(0, 0, 512, 22); g.fillRect(0, 234, 512, 22);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function hash(s) { let h = 2166136261; for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return ((h >>> 0) % 10000) / 10000; }
