/* ============================================================
   The mark, suspended: the engine.

   What the object *is* - the SoCheers bulb revolved into a volume and
   filled with grains - is lib/particle-cloud.ts. This file is what
   happens to it: the invisible force that holds it together, the
   cursor moving through it like a hand through floating sand, the
   brightening where it has just been, and the slow turn that says the
   thing has depth.

   How the work is divided, and why it stays cheap:

     · positions       one Float32Array, simulated on the CPU and
                       uploaded once a frame. ~30k grains of spring,
                       damping and one swept-segment force is around a
                       millisecond, and it is the only per-frame work
                       the main thread does;
     · everything else the shader. Size, the key light, depth fall-off,
                       the ambient float and how agitated a grain is
                       are all derived from what the GPU already has,
                       so none of them costs an upload or a branch up
                       here;
     · nothing at all  when the field is home and the cursor is
                       elsewhere the simulation stops dead and only the
                       draw call remains.

   Nothing here touches React. Nothing here allocates inside the loop.
   Every number worth arguing about is in TUNE.
   ============================================================ */

import {
  BufferAttribute,
  BufferGeometry,
  DynamicDrawUsage,
  NormalBlending,
  PerspectiveCamera,
  Plane,
  Points,
  Quaternion,
  Raycaster,
  Scene,
  ShaderMaterial,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import { buildCloud, EXTENT } from "./particle-cloud";

/* ============================================================
   TUNING
   One place for every number worth arguing about - except the ones
   that decide the object's shape rather than its behaviour, which are
   FORM at the top of lib/particle-cloud.ts.
   ============================================================ */
const TUNE = {
  /* ---- population ---- */
  /* Grains at full fat. Scaled down per device in `budget()` - the field
     has to stay dense enough to read as matter, but density past the
     point where the silhouette is solid buys nothing and costs a frame. */
  count: 30000,
  /* Device pixel ratio ceiling. Points are fill-rate hungry and the
     grains are ~2px - past 1.75 nobody can tell and the GPU can. */
  dprCap: 1.75,

  /* ---- grain ---- */
  softness: 0.34,        // where the sprite starts falling off (0..1 of its radius)
  alpha: 0.42,           // resting opacity of one grain
  alphaHot: 0.82,        // ...and while it is being pushed around

  /* ---- colour + light ----
     Two materials, one axis. `tone` is the mark's own cream off the page
     palette and it is what the base is made of - the bottom of a bulb is
     metal and metal takes the colour of the room it is in. `toneCore` is
     the light *in* the glass, and how far a grain travels from one to the
     other is FORM.tint in lib/particle-cloud.ts: the base sits at zero
     and stays cream, the envelope carries a little of it, the ball inside
     is all of it. Which is what a lit bulb looks like - the colour is in
     the glass and the fitting underneath it is not.

     Cool, not saturated: at full strength this lands on the core, which
     is a fifth of the population seen through a shell, so a true blue
     here reads as neon by the time it is on screen. */
  tone: "#efe9dd",
  toneCore: "#a6c8ff",   // the inner light - soft, cold, barely off white
  toneHot: "#eff4ff",    // where the hand has just been
  light: [-0.38, 0.52, 0.76] as const,
  keyFloor: 0.66,        // brightness of a grain facing fully away from the key
  depthDim: 0.6,         // brightness of the rearmost grains
  depthFade: 0.55,       // ...and their opacity
  hotMix: 0.45,          // how far an agitated grain's colour travels
  hotGain: 0.34,         // ...and how much brighter it gets
  hotRef: 26,            // displacement (world units) that counts as fully agitated

  /* ---- the invisible force that holds the mark together ----
     Underdamped on purpose - the pair below sit at about 0.55 of
     critical, so the mass overshoots home by a hair and settles, which
     is what makes reforming read as matter finding its level rather
     than a transform running out. The spring itself is per grain and
     baked at build time: FORM.spring in lib/particle-cloud.ts. */
  damping: 3.0,          // 1/s - viscosity of the air the grains hang in
  /* Past `reach` the spring stiffens in proportion to how far past it a
     grain has got, so the harder the field is worked the harder the mark
     holds on to it. Progressive rather than a step: a stiffness that
     changed all at once would put a seam in the force field at exactly
     the distance grains are travelling through. Together these keep even
     a sustained sweep inside about one glass radius of home - the mark
     deforms and sheds a little from its edges, it never comes apart. */
  reach: 55,             // world units a grain may stray before it bites
  leash: 16,             // ...and how fast it bites once it has

  /* ---- the hand ---- */
  brushRadius: 62,       // world units around the cursor's path that feel it
  brushDepth: 0.55,      // <1 stretches that reach through the object's depth
  push: 5.6,             // 1/s - cursor velocity -> grain acceleration
  spread: 0.55,          // share of the push that parts grains around the path
  follow: 20,            // 1/s - how hard the hand chases the actual pointer
  velEase: 14,           // 1/s - smoothing on the hand's velocity
  velCap: 900,           // world units/s - ceiling, so a flick can't detonate it
  velFloor: 4,           // below this the hand is standing still and does nothing

  /* ---- the turn ---- */
  spin: 0.1,             // rad/s about the mark's own axis
  spinCalm: 0.5,         // share of that speed kept while the cursor is working
  /* The nod, and the small standing tilt it swings around. Held to a few
     degrees and biased to look at the object from just below: seen from
     above, the faces of the base discs fill the gaps between them and
     the three printed bars stop reading as three. */
  tiltX: -0.03,
  swayX: 0.07,
  swayXRate: 0.11,
  swayZ: 0.035,          // rad - a lean, just enough to kill the turntable feel
  swayZRate: 0.077,

  /* ---- the air ---- */
  ambient: 0.95,         // world units of per-grain float, shader-side

  /* ---- framing ----
     Mild perspective - enough that the near side of the field reads
     bigger than the far side, not so much that the object looks like it
     is being photographed with a wide angle. Both margins are multiples
     of the mark's own half-extent, so the framing follows the geometry
     if the geometry ever changes: the object takes about seven eighths of
     the frame's height, and the rest is room for it to be pushed around
     in. These describe the *frame* - the element's own box. The canvas
     hangs past it (--plogo-bleed in globals.css) and resize() widens the
     lens to match, which changes what is visible without moving or
     resizing anything.

     Tightened from 1.27/1.16: at the old margins the mark sat in a
     noticeable ring of nothing inside its own box. Pulling the frame in
     grows the bulb by about a tenth without touching the layout - the
     element, the halo and the grid around it are all exactly where they
     were, the lens is just closer. The side margin stays the looser of
     the two on purpose: the canvas only bleeds top and bottom, so a
     grain pushed sideways has no overhang to run into. */
  fov: 30,
  frame: 1.15,
  frameSide: 1.10,
};

/* Colours go to the GPU as plain triples in the space the framebuffer
   is already in, rather than as THREE.Color: a ShaderMaterial does no
   output conversion of its own, so a managed colour would arrive here
   linear, be written as if it were sRGB, and land duller than the value
   written above. Everything the shader does to these is a multiply, and
   a multiply is a multiply in either space. */
const rgb = (hex: string) =>
  new Vector3(
    parseInt(hex.slice(1, 3), 16) / 255,
    parseInt(hex.slice(3, 5), 16) / 255,
    parseInt(hex.slice(5, 7), 16) / 255,
  );

/* ============================================================
   SHADERS
   Everything that can be worked out from a grain's own position is
   worked out here: the ambient float, the key light, the depth
   fall-off, and how hard the hand has just hit it. The CPU only ever
   sends positions.
   ============================================================ */
const VERT = /* glsl */ `
  uniform float uTime;
  uniform float uSizeScale;
  uniform float uAmbient;
  uniform float uHotRef;
  uniform float uNear;
  uniform float uFar;
  uniform float uDepthDim;
  uniform float uDepthFade;
  uniform float uKeyFloor;
  uniform float uAlpha;
  uniform float uAlphaHot;
  uniform float uHotMix;
  uniform float uHotGain;
  uniform vec3  uLight;
  uniform vec3  uTone;
  uniform vec3  uToneCore;
  uniform vec3  uToneHot;

  attribute vec3 aHome;
  attribute vec3 aNrm;
  attribute vec4 aMisc;      // x size · y core tint · z opacity · w seed

  varying vec4 vTint;        // rgb + alpha
  varying vec3 vShape;       // cos · sin · squash

  void main() {
    float seed = aMisc.w;

    /* Air, not animation. Every grain floats on its own three phases at
       an amplitude around one percent of the object - invisible one at
       a time, and the difference between a field that is suspended and
       one that is frozen when you look at all of them at once. */
    vec3 drift = vec3(
      sin(uTime * 0.53 + seed * 23.13),
      sin(uTime * 0.61 + seed * 17.71),
      sin(uTime * 0.47 + seed * 11.37)
    );
    vec3 p = position + drift * uAmbient * (0.6 + 0.8 * fract(seed * 0.618));

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    float depth = -mv.z;
    gl_Position = projectionMatrix * mv;

    /* Perspective-correct size, with the sub-pixel guard that keeps a
       dense field from shimmering: below one pixel a point stops
       shrinking and starts fading instead. */
    float size = aMisc.x * uSizeScale / max(depth, 1.0);
    float thin = clamp(size, 0.0, 1.0);
    gl_PointSize = max(size, 1.0);

    /* The key. Grains carry the normal of the surface they were sampled
       off, so the shell shades like a shell and the base discs wrap
       like cylinders - which is most of what says "volume" while the
       object is still. */
    vec3 n = normalize(normalMatrix * aNrm);
    float key = uKeyFloor + (1.0 - uKeyFloor) * clamp(dot(n, uLight) * 0.5 + 0.5, 0.0, 1.0);

    float dn = clamp((uFar - depth) / (uFar - uNear), 0.0, 1.0);
    dn = dn * dn * (3.0 - 2.0 * dn);
    float lit = key * mix(uDepthDim, 1.0, dn);
    /* the only per-grain brightness variation there is: about 5%, so the
       field reads as one material rather than a scatter of hot spots */
    lit *= 0.975 + 0.05 * fract(seed * 91.73);

    /* Agitation is just distance from home - a grain that has been
       shoved is lit until it has found its way back, and the fade is
       the recovery itself rather than a timer. */
    float agit = clamp(length(position - aHome) / uHotRef, 0.0, 1.0);
    agit = agit * (2.0 - agit);

    vec3 tone = mix(uTone, uToneCore, aMisc.y);
    tone = mix(tone, uToneHot, agit * uHotMix);
    vTint = vec4(
      min(tone * lit * (1.0 + agit * uHotGain), vec3(1.0)),
      aMisc.z * thin * thin * mix(uAlpha, uAlphaHot, agit) * mix(uDepthFade, 1.0, dn)
    );

    float a = seed * 6.2831;
    vShape = vec3(cos(a), sin(a), 0.84 + 0.28 * fract(seed * 37.19));
  }
`;

const FRAG = /* glsl */ `
  uniform float uSoft;
  varying vec4 vTint;
  varying vec3 vShape;

  void main() {
    /* A sprite with a soft shoulder, turned and squashed a little per
       grain. Perfect circles at this size read as a screen door; these
       read as powder. */
    vec2 c = gl_PointCoord - 0.5;
    c = vec2(c.x * vShape.x + c.y * vShape.y, c.y * vShape.x - c.x * vShape.y);
    c.x *= vShape.z;
    float d = length(c) * 2.0;
    float a = 1.0 - smoothstep(uSoft, 1.0, d);
    if (a < 0.004) discard;
    gl_FragColor = vec4(vTint.rgb, vTint.a * a);
  }
`;

/* ============================================================
   THE ENGINE
   ============================================================ */
export type Stop = () => void;

function budget(): number {
  const n = TUNE.count;
  if (typeof navigator === "undefined") return n;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  if (coarse) return Math.round(n * 0.4);
  const cores = navigator.hardwareConcurrency || 4;
  if (cores <= 4) return Math.round(n * 0.6);
  if (cores <= 6) return Math.round(n * 0.8);
  return n;
}

export function initParticleLogo(host: HTMLElement): Stop {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ antialias: false, alpha: true, powerPreference: "high-performance" });
  } catch {
    return () => {};
  }
  if (!renderer.getContext()) { renderer.dispose(); return () => {}; }

  renderer.setClearAlpha(0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, TUNE.dprCap));
  /* Placement and the overhang past the frame are CSS's business (see
     .plogo canvas in globals.css) - setSize is called with updateStyle
     off throughout so nothing here ever writes over it. */
  const canvas = renderer.domElement;
  host.appendChild(canvas);

  const scene = new Scene();
  const camera = new PerspectiveCamera(TUNE.fov, 1, 1, 4000);

  /* ---------------------------------------------------- geometry */
  const cloud = buildCloud(budget());
  const n = cloud.count;
  const pos = new Float32Array(cloud.home);          // live positions
  const vel = new Float32Array(n * 3);

  const geom = new BufferGeometry();
  const posAttr = new BufferAttribute(pos, 3);
  posAttr.setUsage(DynamicDrawUsage);
  geom.setAttribute("position", posAttr);
  geom.setAttribute("aHome", new BufferAttribute(cloud.home, 3));
  geom.setAttribute("aNrm", new BufferAttribute(cloud.nrm, 3));
  geom.setAttribute("aMisc", new BufferAttribute(cloud.misc, 4));

  /* Straight alpha, not additive. Grains here are lit, not luminous:
     added together, the dense limb of the shell would blow out to a
     white ring and the whole thing would read as neon. Layered instead,
     a crowd of half-opaque grains simply becomes solid cream - which is
     exactly what powder does. */
  const material = new ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: NormalBlending,
    uniforms: {
      uTime: { value: 0 },
      uSizeScale: { value: 1 },
      uAmbient: { value: reduced ? 0 : TUNE.ambient },
      uHotRef: { value: TUNE.hotRef },
      uNear: { value: 1 },
      uFar: { value: 2 },
      uDepthDim: { value: TUNE.depthDim },
      uDepthFade: { value: TUNE.depthFade },
      uKeyFloor: { value: TUNE.keyFloor },
      uAlpha: { value: TUNE.alpha },
      uAlphaHot: { value: TUNE.alphaHot },
      uHotMix: { value: TUNE.hotMix },
      uHotGain: { value: TUNE.hotGain },
      uSoft: { value: TUNE.softness },
      uLight: { value: new Vector3(...TUNE.light).normalize() },
      uTone: { value: rgb(TUNE.tone) },
      uToneCore: { value: rgb(TUNE.toneCore) },
      uToneHot: { value: rgb(TUNE.toneHot) },
    },
  });

  const points = new Points(geom, material);
  points.frustumCulled = false;                       // grains stray past any bound
  scene.add(points);

  /* ---------------------------------------------------- framing */
  let rect = canvas.getBoundingClientRect();

  function resize() {
    /* Two boxes, and the difference between them is the whole trick.
       The *frame* is the element - the footprint the composition is
       centred and sized to. The *canvas* hangs past it, top and bottom,
       by however much the CSS says. Everything is framed to the frame;
       the canvas simply sees more of the world than the frame does, so
       a grain thrown upward carries on into open air instead of
       shearing off against the edge of the drawing surface. */
    const frameH = Math.max(1, host.clientHeight);
    const w = Math.max(1, canvas.clientWidth);
    const h = Math.max(1, canvas.clientHeight);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;

    /* Sit back far enough that the tighter of the frame's two axes still
       holds the mark plus room for it to be pushed around. */
    const tan = Math.tan((TUNE.fov / 2) * (Math.PI / 180));
    const dist = Math.max(
      (EXTENT.y * TUNE.frame) / tan,
      (EXTENT.x * TUNE.frameSide) / (tan * (w / frameH)),
    );
    camera.position.set(0, 0, dist);
    camera.near = Math.max(1, dist - 400);
    camera.far = dist + 400;

    /* Then widen the lens by exactly the overhang. Same distance, same
       world units per pixel, same object at the same size in the same
       place - there is just more room around it now. */
    const tanCanvas = tan * (h / frameH);
    camera.fov = 2 * Math.atan(tanCanvas) * (180 / Math.PI);
    camera.updateProjectionMatrix();

    material.uniforms.uNear.value = dist - 110;
    material.uniforms.uFar.value = dist + 130;
    /* pixels per world unit at the object's own depth, which is what a
       point sprite's size has to be expressed in */
    material.uniforms.uSizeScale.value = (h * renderer.getPixelRatio()) / (2 * tanCanvas);

    rect = canvas.getBoundingClientRect();
    draw = true;
  }

  /* ---------------------------------------------------- the hand */
  const ray = new Raycaster();
  const ndc = new Vector2();
  const plane = new Plane(new Vector3(0, 0, 1), 0);    // the object's own centre plane
  const hit = new Vector3();
  const handNow = new Vector3();
  const handWas = new Vector3();
  const handVel = new Vector3();
  const segA = new Vector3();
  const segB = new Vector3();
  const force = new Vector3();
  const invQ = new Quaternion();

  let px = 0, py = 0;          // last pointer, in client coordinates
  let hasPointer = false;      // ...and whether we have ever had one
  let primed = false;          // the hand has a position to move *from*
  let stir = 0;                // 0..1 how hard the field is being worked

  const onMove = (e: PointerEvent) => { px = e.clientX; py = e.clientY; hasPointer = true; };
  const onLeave = () => { hasPointer = false; primed = false; };

  if (canHover && !reduced) {
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
  }

  /* ---------------------------------------------------- the loop */
  let raf = 0;
  let last = 0;
  let clock = 0;
  let inView = false;
  let settled = true;          // nothing has been disturbed; skip the physics
  let draw = true;             // something changed; the frame is worth drawing

  function hand(dt: number) {
    if (!hasPointer) { handVel.multiplyScalar(Math.exp(-TUNE.velEase * dt)); return; }

    /* Re-read every frame rather than caching on scroll: Lenis moves the
       page on its own schedule, and a box that is one frame stale puts
       the hand somewhere the cursor isn't. */
    rect = canvas.getBoundingClientRect();
    ndc.set(
      ((px - rect.left) / Math.max(1, rect.width)) * 2 - 1,
      -(((py - rect.top) / Math.max(1, rect.height)) * 2 - 1),
    );
    ray.setFromCamera(ndc, camera);
    if (!ray.ray.intersectPlane(plane, hit)) return;

    /* First frame with a pointer, or the first after the section has
       been away: take the position and no velocity at all, or the gap
       since the last reading gets spent as one shove. */
    if (!primed) {
      handNow.copy(hit);
      handWas.copy(hit);
      handVel.set(0, 0, 0);
      primed = true;
      return;
    }

    handWas.copy(handNow);
    handNow.lerp(hit, 1 - Math.exp(-TUNE.follow * dt));

    /* Velocity is smoothed rather than differenced raw: a pointer that
       jumps 300px between two frames should push hard, not teleport the
       field. The cap is the backstop for the same problem. */
    const k = 1 - Math.exp(-TUNE.velEase * dt);
    handVel.x += ((handNow.x - handWas.x) / dt - handVel.x) * k;
    handVel.y += ((handNow.y - handWas.y) / dt - handVel.y) * k;
    handVel.z += ((handNow.z - handWas.z) / dt - handVel.z) * k;
    const speed = handVel.length();
    if (speed > TUNE.velCap) handVel.multiplyScalar(TUNE.velCap / speed);
  }

  function simulate(dt: number, working: boolean) {
    const home = cloud.home;
    const stiff = cloud.stiff;
    const damp = Math.exp(-TUNE.damping * dt);
    const leash2 = TUNE.reach * TUNE.reach;
    const invReach = 1 / TUNE.reach;

    const rad2 = TUNE.brushRadius * TUNE.brushRadius;
    const invRad2 = 1 / rad2;
    const squash = TUNE.brushDepth;

    const ax = segA.x, ay = segA.y, az = segA.z;
    const sx = segB.x - ax, sy = segB.y - ay, sz = segB.z - az;
    const segLen2 = sx * sx + sy * sy + sz * sz;
    const invSeg = segLen2 > 1e-6 ? 1 / segLen2 : 0;

    const fx = working ? force.x * dt : 0;
    const fy = working ? force.y * dt : 0;
    const fz = working ? force.z * dt : 0;
    const bow = working ? TUNE.spread * force.length() * dt : 0;

    let peakD2 = 0;
    let peakV2 = 0;

    for (let idx = 0, j = 0; idx < n; idx++, j += 3) {
      let x = pos[j], y = pos[j + 1], z = pos[j + 2];
      let vx = vel[j], vy = vel[j + 1], vz = vel[j + 2];

      /* home, on a spring that stiffens the further a grain has strayed
         (the sqrt only runs for the handful that are past the leash) */
      const dx = home[j] - x, dy = home[j + 1] - y, dz = home[j + 2] - z;
      const d2 = dx * dx + dy * dy + dz * dz;
      const kk = d2 > leash2
        ? stiff[idx] * (1 + TUNE.leash * (Math.sqrt(d2) * invReach - 1)) * dt
        : stiff[idx] * dt;
      vx += dx * kk; vy += dy * kk; vz += dz * kk;

      if (working) {
        /* Distance to the *segment* the hand swept this frame, not to
           where it happens to be now: at speed the two are far apart,
           and this is what leaves a continuous wake instead of a
           string of dents. */
        const qx = x - ax, qy = y - ay, qz = z - az;
        let t = (qx * sx + qy * sy + qz * sz) * invSeg;
        t = t < 0 ? 0 : t > 1 ? 1 : t;
        const ex = qx - sx * t;
        const ey = qy - sy * t;
        const ez = qz - sz * t;
        const ezs = ez * squash;
        const r2 = ex * ex + ey * ey + ezs * ezs;
        if (r2 < rad2) {
          /* squared falloff: nothing at the edge, and no corner in the
             gradient on the way there */
          const w = 1 - r2 * invRad2;
          const w2 = w * w;
          vx += fx * w2; vy += fy * w2; vz += fz * w2;
          /* and matter parts around the hand rather than only ahead of
             it - the bow wave that makes it read as something physical
             moving *through* the field */
          const s = (bow * w2) / (Math.sqrt(r2) + 14);
          vx += ex * s; vy += ey * s; vz += ez * s;
        }
      }

      vx *= damp; vy *= damp; vz *= damp;
      x += vx * dt; y += vy * dt; z += vz * dt;

      pos[j] = x; pos[j + 1] = y; pos[j + 2] = z;
      vel[j] = vx; vel[j + 1] = vy; vel[j + 2] = vz;

      if (d2 > peakD2) peakD2 = d2;
      const v2 = vx * vx + vy * vy + vz * vz;
      if (v2 > peakV2) peakV2 = v2;
    }

    /* Once the whole field is home to within a fraction of a grain,
       stop simulating it: park every position exactly on home, upload
       that once, and let the shader's ambient float carry the object
       until the cursor comes back. */
    if (!working && peakD2 < 0.0025 && peakV2 < 0.25) {
      pos.set(home);
      vel.fill(0);
      settled = true;
    }
    posAttr.needsUpdate = true;
    draw = true;
  }

  function frame(now: number) {
    raf = requestAnimationFrame(frame);
    /* Off-screen or in a background tab it costs one comparison a frame.
       Resetting `last` on the way past is what stops the object taking a
       three-second step the moment it comes back. */
    if (!inView || document.hidden) { last = now; return; }

    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
    last = now;
    clock += dt;
    material.uniforms.uTime.value = clock;

    /* The turn. Sinusoidal on every axis, so there is never a change of
       direction to notice - only the mark showing a little more of one
       side than the other, indefinitely. It eases down while the field
       is being worked and comes back up on its own afterwards. */
    if (!reduced) {
      const ease = 1 - stir * (1 - TUNE.spinCalm);
      points.rotation.y += TUNE.spin * ease * dt;
      points.rotation.x = TUNE.tiltX + TUNE.swayX * Math.sin(clock * TUNE.swayXRate);
      points.rotation.z = TUNE.swayZ * Math.sin(clock * TUNE.swayZRate);
      points.updateMatrixWorld();
      draw = true;
    }

    hand(dt);

    /* The hand lives in world space; the field is simulated in the
       object's own, so both ends of the sweep and the direction of the
       shove get carried across the turn. */
    let working = false;
    let speed = 0;
    if (primed && hasPointer) {
      speed = handVel.length();
      if (speed > TUNE.velFloor) {
        segA.copy(handWas); points.worldToLocal(segA);
        segB.copy(handNow); points.worldToLocal(segB);
        /* ignore the cursor entirely while it is nowhere near the mark */
        if (segB.lengthSq() < 260 * 260) {
          invQ.copy(points.quaternion).invert();
          force.copy(handVel).applyQuaternion(invQ).multiplyScalar(TUNE.push);
          working = true;
          settled = false;
        }
      }
    }

    const level = working ? Math.min(1, speed / 420) : 0;
    stir += (level - stir) * (1 - Math.exp(-(level > stir ? 6 : 1.6) * dt));

    if (!settled || working) simulate(dt, working);

    if (draw) {
      renderer.render(scene, camera);
      draw = false;
    }
  }

  /* ---------------------------------------------------- lifecycle */
  const ro = new ResizeObserver(() => resize());
  ro.observe(host);

  const io = new IntersectionObserver(
    ([e]) => {
      inView = e.isIntersecting;
      if (inView) {
        last = 0;
        /* the cursor may have moved half the page while this was away -
           take the hand's position afresh instead of shoving the field
           by the difference */
        primed = false;
        rect = canvas.getBoundingClientRect();
        host.classList.add("is-live");
      }
    },
    { rootMargin: "120px" },
  );
  io.observe(host);

  /* If the GPU pulls the rug out - a driver reset, a laptop switching
     cards - stop drawing and let the flat mark fade back in, rather than
     leaving a hole where the visual was. */
  const onLost = () => { inView = false; host.classList.remove("is-live"); };
  canvas.addEventListener("webglcontextlost", onLost);

  resize();
  if (reduced) {
    /* one frame, held: the mark is there, it simply does not move */
    renderer.render(scene, camera);
    host.classList.add("is-live");
  }
  raf = requestAnimationFrame(frame);

  return () => {
    cancelAnimationFrame(raf);
    io.disconnect();
    ro.disconnect();
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerdown", onMove);
    document.removeEventListener("pointerleave", onLeave);
    canvas.removeEventListener("webglcontextlost", onLost);
    host.classList.remove("is-live");
    geom.dispose();
    material.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    canvas.remove();
  };
}
