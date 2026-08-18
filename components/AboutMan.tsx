"use client";

import { useEffect, useRef } from "react";

/* ==============================================================
   The figure beside the intro line: a suited man with a CRT for a
   head, whose head turns to follow the cursor.

   The model is baked by scripts/build-about-man.mjs, which cuts the
   scan's single welded mesh into a Body and a Head and leaves the Head
   node sitting at the pivot with its geometry already measured from it.
   So turning the head here is one rotation on one node - there is no
   skinning, no bone lookup and no per-frame matrix surgery.

   The face is not in the scan. The screen is blank grey geometry, so
   the eyes are drawn here instead, as one shader-shaded quad hung in
   front of the glass and parented to the same pivot. That is the
   cheaper answer as well as the only one: two ellipses in a fragment
   shader cost one small draw call, and it means they can blink, and
   drift within the screen while the head is still moving toward you -
   which is the difference between a model that turns and a face that
   looks.

   What it costs on a weak machine was the constraint throughout:
     · nothing loads until the section is near the viewport, so a
       visitor who never scrolls this far pays nothing at all
     · the render loop is stopped outright while it is off-screen or
       the tab is in the background, not merely skipped
     · device pixel ratio is capped, and on a thin machine the loop is
       capped to 30fps as well
     · no shadow maps, no post-processing, no environment map - the
       scan is cloth, and its metalness is pinned to zero at bake time
       so there is nothing for an environment to be needed for
   ============================================================== */

const MODEL = "/assets/about/about-man.glb";

/* The CRT face in the scan's own coordinates, read off the geometry -
   the glass sits behind a bezel that stands proud of it, so the quad
   goes at z=0.182: clear of the glass's own bulge (which reaches 0.18
   at its centre) and still inside the bezel's opening. */
const SCREEN = { x: 0.0075, y: 0.86, z: 0.182, w: 0.239, h: 0.194 };

/* How far the head will go. Past about 20° of yaw the monitor's
   underside stops covering the collar and the cut starts to show. */
const MAX_YAW = 0.36;    // ~20°
const MAX_PITCH = 0.17;  // ~10°
const RESPONSE = 4.5;    // how hard the head chases the cursor

/* The whole figure leans a fraction of what the head does. Small on
   purpose: this is weight shifting, not a second turn. */
const BODY_FOLLOW = 0.16;

const vert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/* Two ellipses, a soft halo, and a scanline. The eyes sit slightly
   above the middle of the glass and carry a little of the cursor
   themselves, so a small movement still registers on the face even
   when the head has already reached the end of its travel.

   Colours arrive as plain vec3s in display terms and are written
   straight out. A ShaderMaterial is not given three's output-colour-
   space conversion, so anything handed in as a THREE.Color - which is
   converted into the linear working space on the way in - would land
   on screen darker than the hex it was written as. */
const frag = /* glsl */ `
  precision mediump float;
  varying vec2 vUv;
  uniform vec2  uLook;
  uniform float uBlink;
  uniform vec3  uGlow;
  uniform vec3  uTint;

  const float EYE_X = 0.35;
  const float EYE_Y = 0.08;
  const float EYE_RX = 0.16;
  const float EYE_RY = 0.32;

  float ellipse(vec2 p, vec2 c, vec2 r) {
    return length((p - c) / r);
  }

  void main() {
    vec2 p = vUv * 2.0 - 1.0;
    vec2 off = uLook * vec2(0.10, 0.07);

    /* the lid closing is the vertical radius collapsing */
    float ry = mix(EYE_RY, EYE_RY * 0.05, uBlink);
    float d = min(
      ellipse(p, vec2(-EYE_X, EYE_Y) + off, vec2(EYE_RX, ry)),
      ellipse(p, vec2( EYE_X, EYE_Y) + off, vec2(EYE_RX, ry))
    );

    float eye  = 1.0 - smoothstep(0.84, 1.0, d);
    float halo = (1.0 - smoothstep(0.9, 2.4, d)) * 0.3;

    float scan = 0.96 + 0.04 * sin(vUv.y * 240.0);
    vec3 col = vec3(0.030, 0.033, 0.031) * scan + uTint * halo * 0.32;
    col = mix(col, uGlow, eye);

    /* the panel dies into black before its own edge, so the quad melts
       into the bezel's shadow instead of ending on a visible line */
    float v = smoothstep(1.0, 0.84, max(abs(p.x), abs(p.y)));
    gl_FragColor = vec4(col * v, 1.0);
  }
`;

export default function AboutMan() {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canHover = window.matchMedia("(hover: hover)").matches;

    /* A rough read on what this machine is willing to do. Both hints
       are advisory and both are missing on some browsers, so absence is
       treated as "probably fine" rather than "probably not". */
    const nav = navigator as Navigator & { deviceMemory?: number };
    const thin = (nav.hardwareConcurrency ?? 8) <= 4 || (nav.deviceMemory ?? 8) <= 4;

    let teardown = () => {};
    let cancelled = false;

    /* Nothing is fetched - not three, not the model - until the section
       is within a screen of the viewport. */
    const gate = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      gate.disconnect();
      void start().catch(() => {});
    }, { rootMargin: "300px" });
    gate.observe(el);

    async function start() {
      const THREE = await import("three");
      const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
      if (cancelled) return;

      const gltf = await new GLTFLoader().loadAsync(MODEL).catch(() => null);
      if (cancelled || !gltf) return;

      const headNode = gltf.scene.getObjectByName("Head");
      const bodyNode = gltf.scene.getObjectByName("Body");
      if (!headNode || !bodyNode) return;

      /* No WebGL, no figure. The burst and the bulbs either side of it
         are their own elements and stand up without this, so the section
         loses a layer rather than breaking. */
      let renderer: InstanceType<typeof THREE.WebGLRenderer>;
      try {
        renderer = new THREE.WebGLRenderer({
          alpha: true,
          antialias: !thin,
          powerPreference: "high-performance",
        });
      } catch {
        return;
      }
      renderer.setClearAlpha(0);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, thin ? 1.25 : 1.75));
      renderer.domElement.className = "ab-man__canvas";
      el!.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(20, 1, 0.1, 40);

      /* Lit to sit on a near-black panel: a cool key, a dimmer fill so
         the shadowed side does not go to nothing, and a touch of the
         page's own green raking across from behind the right shoulder,
         which is what separates a grey figure from a grey background
         without needing a rim pass to do it. */
      scene.add(new THREE.HemisphereLight(0xcfe0ff, 0x090a0b, 0.85));
      const key = new THREE.DirectionalLight(0xfff4e8, 2.1);
      key.position.set(-1.6, 2.4, 3.2);
      const fill = new THREE.DirectionalLight(0x9fc4ff, 0.7);
      fill.position.set(2.6, 0.4, 1.8);
      const rim = new THREE.DirectionalLight(0x2fe589, 1.15);
      rim.position.set(2.2, 1.6, -2.4);
      scene.add(key, fill, rim);

      const root = new THREE.Group();
      scene.add(root);

      /* The pivot takes over the head node's placement so that the node
         itself is left holding nothing but its own dequantising scale -
         then a rotation written here turns the head about the neck and
         about nothing else. Its position is read off the model rather
         than repeated as a constant, so the bake stays the one place
         the pivot is decided. */
      const pivot = new THREE.Group();
      pivot.position.copy(headNode.position);
      pivot.rotation.order = "YXZ";
      headNode.position.set(0, 0, 0);
      pivot.add(headNode);
      root.add(pivot, bodyNode);

      const eyeMat = new THREE.ShaderMaterial({
        vertexShader: vert,
        fragmentShader: frag,
        uniforms: {
          uLook: { value: new THREE.Vector2() },
          uBlink: { value: 0 },
          uGlow: { value: new THREE.Vector3(0.945, 0.925, 0.882) },  // #f1ece1
          uTint: { value: new THREE.Vector3(0.184, 0.898, 0.537) },  // #2fe589
        },
      });
      const eyes = new THREE.Mesh(new THREE.PlaneGeometry(SCREEN.w, SCREEN.h), eyeMat);
      eyes.position.set(
        SCREEN.x - pivot.position.x,
        SCREEN.y - pivot.position.y,
        SCREEN.z - pivot.position.z,
      );
      pivot.add(eyes);

      /* Three objects, all of them on screen whenever any of them is:
         culling them per frame is measurement for a question already
         answered. Set after reparenting, so it reaches what moved. */
      root.traverse((o) => { o.frustumCulled = false; });

      /* ---------------------------------------------------- framing */

      const FRAME_H = 2.24;   // the figure is 2 tall; this leaves it air
      function resize() {
        const w = el!.clientWidth, h = el!.clientHeight;
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        /* Fit by height and let width fall where it may - the figure is
           a third as wide as it is tall, so height is always the
           binding constraint and solving for it keeps the framing
           identical at every column width. */
        camera.position.set(0, 0.04, (FRAME_H / 2) / Math.tan((camera.fov * Math.PI) / 360));
        camera.lookAt(0, 0.04, 0);
        camera.updateProjectionMatrix();
      }
      resize();
      const ro = new ResizeObserver(resize);
      ro.observe(el!);

      /* ---------------------------------------------------- the cursor */

      /* The pointer is only recorded here; where it sits relative to the
         figure is worked out once per frame in the loop. The element
         moves under a stationary cursor all the way down this page, so
         the answer has to be recomputed on scroll anyway - and doing it
         per frame rather than per mousemove keeps it to one layout read
         however fast the mouse is going. */
      let px = 0, py = 0, moved = false;
      function onMove(e: MouseEvent) { px = e.clientX; py = e.clientY; moved = true; }
      if (canHover && !reduced) window.addEventListener("mousemove", onMove, { passive: true });

      /* ---------------------------------------------------- the loop */

      let yaw = 0, pitch = 0;
      let raf = 0, last = 0;
      let blinkIn = 2 + Math.random() * 3, blinking = -1;
      const minFrame = thin ? 1000 / 30 : 0;
      const look = eyeMat.uniforms.uLook.value as InstanceType<typeof THREE.Vector2>;

      function frame(now: number) {
        raf = requestAnimationFrame(frame);
        if (now - last < minFrame) return;
        const dt = Math.min((now - last) / 1000, 0.1);
        last = now;

        const t = now / 1000;
        /* Two targets, not one. The head is held to what the neck can do;
           the eyes are given the whole angle, unclipped. Their difference
           is what the eyes then show - which covers both of the cases
           that make a face look like it is paying attention: the lag
           while the head is still coming round, and the cursor sitting
           somewhere the head cannot reach, where the head stops at its
           limit and the eyes stay pointed the rest of the way. */
        let wantYaw: number, wantPitch: number, reachY: number, reachP: number;
        if (moved) {
          const r = el!.getBoundingClientRect();
          /* measured against the viewport, not the element: the head
             should keep following while the cursor is off reading the
             paragraph beside it, which is most of the time */
          const dx = (px - (r.left + r.width / 2)) / (window.innerWidth / 2);
          const dy = (py - (r.top + r.height / 2)) / (window.innerHeight / 2);
          wantYaw = Math.max(-1, Math.min(1, dx)) * MAX_YAW;
          wantPitch = Math.max(-1, Math.min(1, dy)) * MAX_PITCH;
          reachY = Math.max(-2.5, Math.min(2.5, dx)) * MAX_YAW;
          reachP = Math.max(-2.5, Math.min(2.5, dy)) * MAX_PITCH;
        } else {
          /* Never perfectly still: with no cursor to answer to - a
             touch screen, or a pointer that has not moved yet - the
             head keeps a slow sweep of its own, which reads as alive
             where a frozen figure reads as a failed asset. */
          wantYaw = Math.sin(t * 0.34) * MAX_YAW * 0.5;
          wantPitch = Math.sin(t * 0.23 + 1.1) * MAX_PITCH * 0.4;
          reachY = wantYaw;
          reachP = wantPitch;
        }

        /* frame-rate independent easing: the same pull per second
           whether this machine is managing 30fps or 144 */
        const k = 1 - Math.exp(-dt * RESPONSE);
        yaw += (wantYaw + Math.sin(t * 0.5) * 0.012 - yaw) * k;
        pitch += (wantPitch + Math.sin(t * 0.37 + 0.6) * 0.008 - pitch) * k;

        pivot.rotation.set(pitch, yaw, -yaw * 0.1);
        root.rotation.y = yaw * BODY_FOLLOW;
        root.position.y = Math.sin(t * 0.8) * 0.004;   // breathing

        look.set(
          (reachY - yaw) / MAX_YAW * 1.5,
          -(reachP - pitch) / MAX_PITCH * 1.1,
        ).clampScalar(-1, 1);

        blinkIn -= dt;
        if (blinkIn <= 0 && blinking < 0) { blinking = 0; blinkIn = 2.6 + Math.random() * 4.5; }
        if (blinking >= 0) {
          blinking += dt / 0.13;
          if (blinking >= 1) blinking = -1;
        }
        eyeMat.uniforms.uBlink.value = blinking >= 0 ? Math.sin(blinking * Math.PI) : 0;

        renderer.render(scene, camera);
      }

      /* One loop, started and stopped rather than left running to return
         early - an animation frame that only decides not to paint is
         still the browser keeping a 60Hz appointment on a page that has
         scrolled somewhere else entirely. */
      let onScreen = false;
      function play() {
        if (raf || reduced || !onScreen || document.hidden) return;
        last = performance.now() - minFrame;
        raf = requestAnimationFrame(frame);
      }
      function pause() {
        if (!raf) return;
        cancelAnimationFrame(raf);
        raf = 0;
      }

      const io = new IntersectionObserver((entries) => {
        onScreen = entries.some((e) => e.isIntersecting);
        if (onScreen) play(); else pause();
      }, { rootMargin: "10%" });
      io.observe(el!);

      const onVis = () => { if (document.hidden) pause(); else play(); };
      document.addEventListener("visibilitychange", onVis);

      /* A lost context cannot be drawn to; stop asking. */
      const onLost = (e: Event) => { e.preventDefault(); pause(); };
      renderer.domElement.addEventListener("webglcontextlost", onLost);

      /* With motion turned off the figure is a still: one frame, facing
         front, and no loop behind it. */
      if (reduced) renderer.render(scene, camera);

      el!.dataset.ready = "1";

      teardown = () => {
        pause();
        io.disconnect();
        ro.disconnect();
        window.removeEventListener("mousemove", onMove);
        document.removeEventListener("visibilitychange", onVis);
        renderer.domElement.removeEventListener("webglcontextlost", onLost);
        root.traverse((o) => {
          const mesh = o as InstanceType<typeof THREE.Mesh>;
          if (!mesh.isMesh) return;
          mesh.geometry.dispose();
          const mat = mesh.material as InstanceType<typeof THREE.MeshStandardMaterial>;
          for (const slot of ["map", "normalMap", "roughnessMap", "metalnessMap"] as const) {
            mat?.[slot]?.dispose();
          }
          mat?.dispose();
        });
        renderer.dispose();
        renderer.domElement.remove();
      };
    }

    return () => {
      cancelled = true;
      gate.disconnect();
      teardown();
    };
  }, []);

  return (
    <div
      className="ab-man"
      ref={host}
      data-clip
      role="img"
      aria-label="A figure in a suit with a vintage computer monitor for a head, watching the cursor"
    />
  );
}
