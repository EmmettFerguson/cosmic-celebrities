// Camera choreography: smooth fly-to between the overview and close-ups.
// Close-up framing puts the body in the LEFT ~45% of the screen (desktop) or the
// TOP ~36% (phones) by shifting the projection with camera.setViewOffset.
export function createCamera(S) {
  const { THREE, camera, controls, state, size } = S;
  const UP = new THREE.Vector3(0, 1, 0);
  const TILT = THREE.MathUtils.degToRad(25);
  const offset = { x: 0, y: 0 };          // fractions of the viewport
  let tween = null;

  const isMobile = () => size.w < 800;
  const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  function applyOffset() {
    if (Math.abs(offset.x) < 1e-4 && Math.abs(offset.y) < 1e-4) camera.clearViewOffset();
    else camera.setViewOffset(size.w, size.h, offset.x * size.w, offset.y * size.h, size.w, size.h);
  }
  window.addEventListener('resize', () => {
    if (state.mode === 'closeup' && !tween) { const g = closeupGoal(state.focus); offset.x = g.ox; offset.y = g.oy; camera.position.copy(g.pos); }
    else if (state.mode === 'overview' && !tween) { offset.x = offset.y = 0; }
    applyOffset();
  });

  function overviewGoal() {
    const aspect = size.w / size.h;
    const D = 215 * Math.max(1, 1.1 / aspect);
    return { pos: new THREE.Vector3(0, Math.sin(TILT) * D, Math.cos(TILT) * D), target: new THREE.Vector3(), ox: 0, oy: 0 };
  }

  function closeupGoal(slug) {
    const target = S.worldPos(slug);
    const r = S.radiusOf(slug);
    const tanHalf = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    let diameterPx, ox = 0, oy = 0;
    if (isMobile()) {
      diameterPx = Math.min(0.8 * 0.36 * size.h, 0.7 * size.w);
      oy = 0.5 - 0.18;
    } else {
      diameterPx = Math.min(0.62 * 0.45 * size.w, 0.62 * size.h);
      ox = 0.5 - 0.235;
    }
    const frac = diameterPx / size.h;
    const d = r / (frac * tanHalf);

    // view from the sun-lit side, three-quarter angle, slightly above
    const toSun = slug === 'sun' ? new THREE.Vector3(0.3, 0, 1).normalize() : target.clone().negate().normalize();
    const side = new THREE.Vector3().crossVectors(UP, toSun).normalize();
    const dir = toSun.multiplyScalar(0.55).add(side.multiplyScalar(0.8)).add(UP.clone().multiplyScalar(0.22)).normalize();
    return { pos: target.clone().add(dir.multiplyScalar(d)), target, ox, oy, d };
  }

  function fly(goal, { duration, onDone, minD, maxD }) {
    const from = { pos: camera.position.clone(), target: controls.target.clone(), ox: offset.x, oy: offset.y };
    const dur = state.reducedMotion ? 0 : duration;
    const lift = from.pos.distanceTo(goal.pos) * 0.12;
    controls.enabled = false;
    tween = { t: 0 };
    state.beforeRender = (dt) => {
      if (!tween) return;
      tween.t = dur === 0 ? 1 : Math.min(1, tween.t + dt / dur);
      const e = ease(tween.t);
      camera.position.lerpVectors(from.pos, goal.pos, e).addScaledVector(UP, Math.sin(Math.PI * e) * lift);
      controls.target.lerpVectors(from.target, goal.target, e);
      offset.x = from.ox + (goal.ox - from.ox) * e;
      offset.y = from.oy + (goal.oy - from.oy) * e;
      applyOffset();
      camera.lookAt(controls.target);
      if (tween.t >= 1) {
        tween = null;
        controls.minDistance = minD; controls.maxDistance = maxD;
        controls.enabled = true;
        onDone?.();
      }
    };
  }

  return {
    toBody(slug, onDone) {
      state.orbiting = false;          // freeze orbits so the framing holds still
      state.mode = 'closeup'; state.focus = slug;
      const g = closeupGoal(slug);
      fly(g, { duration: 1.6, onDone, minD: g.d * 0.55, maxD: g.d * 1.8 });
    },
    toOverview(onDone) {
      state.mode = 'overview'; state.focus = null;
      const g = overviewGoal();
      fly(g, { duration: 1.6, minD: 30, maxD: 700, onDone: () => { state.orbiting = true; onDone?.(); } });
    },
    placeAtOverview() {
      const g = overviewGoal();
      camera.position.copy(g.pos); controls.target.copy(g.target); camera.lookAt(g.target);
    },
  };
}
