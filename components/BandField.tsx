"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

/* ============================================================
   City band: three rotating wireframe landmarks in a 3D space.

   Mumbai   -> the Gateway arch
   Delhi    -> a tapering fluted tower
   Bengaluru-> a domed civic hall

   Raw WebGL, no Three.js. All geometry is generated procedurally as
   line segments and drawn with gl.LINES, so the whole scene is ~1500
   vertices across 4 draw calls and costs almost nothing per frame.
   Line art also matches the site's existing hard-edged language far
   better than a shaded solid would.

   Deliberately NOT a fill-heavy fragment effect: this sits on the same
   page as the pinned hero, so the budget goes to geometry, not pixels.
   ============================================================ */

const VERT = `
attribute vec3 aPos;
uniform mat4  uProj;
uniform mat4  uModel;
uniform vec2  uOffset;     // clip-space nudge, to sit behind its city word
varying float vDepth;
void main(){
  vec4 mv = uModel * vec4(aPos, 1.0);
  vDepth = -mv.z;
  vec4 p = uProj * mv;
  p.xy += uOffset * p.w;   // w-correct so the nudge survives the divide
  gl_Position = p;
}
`;

const FRAG = `
precision mediump float;
uniform vec3  uAccent;
uniform float uFade;
varying float vDepth;
void main(){
  // near edges read bright, far edges sink back. The floor keeps the far
  // side of the wireframe legible instead of dissolving into the page.
  float a = 0.38 + 0.62 * smoothstep(8.0, 2.0, vDepth);
  gl_FragColor = vec4(uAccent, a * uFade);
}
`;

/* ---------------------------------------------- geometry helpers */

type Pts = number[];

function ring(r: number, y: number, seg: number, out: Pts) {
  for (let i = 0; i < seg; i++) {
    const a = (i / seg) * Math.PI * 2;
    const b = ((i + 1) / seg) * Math.PI * 2;
    out.push(Math.cos(a) * r, y, Math.sin(a) * r,
             Math.cos(b) * r, y, Math.sin(b) * r);
  }
}

/** Extrude a 2D profile along z, plus the connecting edges. */
function extrude(path: [number, number][], closed: boolean, d: number, out: Pts) {
  const last = closed ? path.length : path.length - 1;
  for (let i = 0; i < last; i++) {
    const [x1, y1] = path[i];
    const [x2, y2] = path[(i + 1) % path.length];
    out.push(x1, y1, d, x2, y2, d);
    out.push(x1, y1, -d, x2, y2, -d);
  }
  for (const [x, y] of path) out.push(x, y, d, x, y, -d);
}

/** Mumbai: a gateway arch. */
function archGeo(): Pts {
  const out: Pts = [];
  const W = 1.15, H = 1.25, D = 0.45;
  const oR = 0.52, spring = 0.0;
  const outer: [number, number][] = [[-W, -H], [W, -H], [W, H], [-W, H]];

  const opening: [number, number][] = [[-oR, -H], [-oR, spring]];
  const N = 16;
  for (let i = 0; i <= N; i++) {
    const a = Math.PI - (i / N) * Math.PI;
    opening.push([Math.cos(a) * oR, spring + Math.sin(a) * oR]);
  }
  opening.push([oR, -H]);

  extrude(outer, true, D, out);
  extrude(opening, false, D, out);
  // a cap course along the top
  extrude([[-W * 1.1, H], [W * 1.1, H], [W * 1.1, H + 0.18], [-W * 1.1, H + 0.18]],
    true, D * 1.1, out);
  return out;
}

/** Delhi: a tapering fluted tower. */
function towerGeo(): Pts {
  const out: Pts = [];
  const LEV = 7, SEG = 12;
  const ys: number[] = [], rs: number[] = [];
  for (let i = 0; i < LEV; i++) {
    const t = i / (LEV - 1);
    ys.push(-1.35 + t * 2.7);
    rs.push(0.62 - t * 0.40);
  }
  for (let i = 0; i < LEV; i++) {
    ring(rs[i], ys[i], SEG, out);
    // a balcony lip on each storey
    if (i < LEV - 1) ring(rs[i] * 1.16, ys[i] + 0.06, SEG, out);
  }
  for (let i = 0; i < LEV - 1; i++) {
    for (let s = 0; s < SEG; s++) {
      const a = (s / SEG) * Math.PI * 2;
      out.push(Math.cos(a) * rs[i], ys[i], Math.sin(a) * rs[i],
               Math.cos(a) * rs[i + 1], ys[i + 1], Math.sin(a) * rs[i + 1]);
    }
  }
  return out;
}

/** Bengaluru: a domed civic hall on a plinth. */
function domeGeo(): Pts {
  const out: Pts = [];
  const R = 0.92, LAT = 4, LON = 12, ARC = 8, base = -0.15;

  for (let i = 1; i <= LAT; i++) {
    const phi = (i / (LAT + 1)) * (Math.PI / 2);
    ring(Math.cos(phi) * R, base + Math.sin(phi) * R, 22, out);
  }
  for (let j = 0; j < LON; j++) {
    const th = (j / LON) * Math.PI * 2;
    let px = Math.cos(th) * R, py = base, pz = Math.sin(th) * R;
    for (let k = 1; k <= ARC; k++) {
      const phi = (k / ARC) * (Math.PI / 2);
      const r = Math.cos(phi) * R;
      const x = Math.cos(th) * r, y = base + Math.sin(phi) * R, z = Math.sin(th) * r;
      out.push(px, py, pz, x, y, z);
      px = x; py = y; pz = z;
    }
  }
  // finial
  out.push(0, base + R, 0, 0, base + R + 0.3, 0);
  // plinth
  const pr = R * 1.15, pb = base - 0.95;
  ring(pr, base, 22, out);
  ring(pr, pb, 22, out);
  for (let j = 0; j < 22; j++) {
    const a = (j / 22) * Math.PI * 2;
    out.push(Math.cos(a) * pr, base, Math.sin(a) * pr,
             Math.cos(a) * pr, pb, Math.sin(a) * pr);
  }
  return out;
}

/** The ground plane they all stand on. Sells the space for ~50 lines.
    Keep S comfortably smaller than the |z| it is drawn at: a grid that
    reaches past the camera has lines crossing the near plane, and those
    project to infinity as streaks running off the canvas. */
function gridGeo(): Pts {
  const out: Pts = [];
  const N = 10, S = 12, y = -1.8;
  for (let i = -N; i <= N; i++) {
    const t = (i / N) * S;
    out.push(t, y, -S, t, y, S);
    out.push(-S, y, t, S, y, t);
  }
  return out;
}

/* ---------------------------------------------- matrices */

function perspective(out: Float32Array, fovy: number, aspect: number, near: number, far: number) {
  const f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
  out.fill(0);
  out[0] = f / aspect; out[5] = f;
  out[10] = (far + near) * nf; out[11] = -1;
  out[14] = 2 * far * near * nf;
}

/** translate(tx,ty,tz) * rotateY(a) * rotateX(b) * scale(s), column-major. */
function model(out: Float32Array, a: number, b: number, s: number,
               tx: number, ty: number, tz: number) {
  const ca = Math.cos(a), sa = Math.sin(a);
  const cb = Math.cos(b), sb = Math.sin(b);
  out[0] = ca * s;       out[1] = 0;        out[2] = -sa * s;     out[3] = 0;
  out[4] = sa * sb * s;  out[5] = cb * s;   out[6] = ca * sb * s; out[7] = 0;
  out[8] = sa * cb * s;  out[9] = -sb * s;  out[10] = ca * cb * s; out[11] = 0;
  out[12] = tx;          out[13] = ty;      out[14] = tz;         out[15] = 1;
}

/* ---------------------------------------------- component */

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type);
  if (!sh) return null;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.warn("BandField shader:", gl.getShaderInfoLog(sh));
    return null;
  }
  return sh;
}

function accentRGB(host: HTMLElement): [number, number, number] {
  const FALLBACK: [number, number, number] = [0.18, 0.9, 0.54];
  const probe = document.createElement("span");
  probe.style.cssText = "position:absolute;opacity:0;color:var(--accent)";
  host.appendChild(probe);
  const raw = getComputedStyle(probe).color;
  probe.remove();

  /* Computed style keeps modern colour syntax verbatim, so --accent comes
     back as "oklch(0.86 0.22 152)". Grabbing the numbers out of that reads
     as r=0.86 g=0.22 b=152, which is why the lines rendered blue. Let a 2D
     canvas normalise whatever the syntax is down to sRGB instead. */
  let s = raw;
  try {
    const cx = document.createElement("canvas").getContext("2d");
    if (cx) {
      cx.fillStyle = "#000000";
      cx.fillStyle = raw;
      if (typeof cx.fillStyle === "string" && cx.fillStyle !== "#000000") {
        s = cx.fillStyle;
      }
    }
  } catch { /* fall through to the parsers below */ }

  if (/^#[0-9a-f]{6}$/i.test(s)) {
    return [parseInt(s.slice(1, 3), 16) / 255,
            parseInt(s.slice(3, 5), 16) / 255,
            parseInt(s.slice(5, 7), 16) / 255];
  }
  const m = s.match(/^rgba?\(([^)]+)\)/i);
  if (m) {
    const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
    if (p.length >= 3 && p.slice(0, 3).every((v) => !Number.isNaN(v))) {
      return [p[0] / 255, p[1] / 255, p[2] / 255];
    }
  }
  return FALLBACK;
}

export default function BandField() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const host = canvas?.parentElement;
    if (!canvas || !host) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const gl = canvas.getContext("webgl", {
      alpha: true, antialias: true, premultipliedAlpha: false,
      powerPreference: "low-power",
    });
    if (!gl) return;

    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;
    const prog = gl.createProgram();
    if (!prog) return;
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.warn("BandField link:", gl.getProgramInfoLog(prog));
      return;
    }
    gl.useProgram(prog);

    const aPos = gl.getAttribLocation(prog, "aPos");
    const u = {
      proj: gl.getUniformLocation(prog, "uProj"),
      model: gl.getUniformLocation(prog, "uModel"),
      offset: gl.getUniformLocation(prog, "uOffset"),
      accent: gl.getUniformLocation(prog, "uAccent"),
      fade: gl.getUniformLocation(prog, "uFade"),
    };
    gl.uniform3fv(u.accent, accentRGB(host));
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const upload = (pts: Pts) => {
      const b = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, b);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pts), gl.STATIC_DRAW);
      return { buf: b, count: pts.length / 3 };
    };

    const grid = upload(gridGeo());
    // order matches the city words left to right
    const monuments = [upload(archGeo()), upload(towerGeo()), upload(domeGeo())];
    const spin = [0.22, -0.17, 0.13];
    // world half-extents [x, y] per landmark, for the pointer hit test
    const extent: [number, number][] = [[1.27, 1.43], [0.72, 1.35], [1.06, 1.22]];

    /* Per landmark: a free-running spin phase, and a hover weight that eases
       0..1. Everything else is derived from those two each frame. */
    const st = monuments.map((_, i) => ({ phase: i * 1.7, hov: 0, word: false }));

    const proj = new Float32Array(16);
    const mv = new Float32Array(16);

    // where each city word sits, in clip space, so a landmark can stand behind it
    const offsets: [number, number][] = [[-0.62, 0], [0, 0], [0.62, 0]];
    const measure = () => {
      const words = host.querySelectorAll<HTMLElement>(
        ".who__bandline [data-roll]");
      const cr = canvas.getBoundingClientRect();
      if (!words || words.length < 3 || !cr.width) return;
      words.forEach((wEl, i) => {
        if (i > 2) return;
        const r = wEl.getBoundingClientRect();
        const x = ((r.left + r.width / 2 - cr.left) / cr.width) * 2 - 1;
        const yRaw = -(((r.top + r.height / 2 - cr.top) / cr.height) * 2 - 1);
        // Vertical placement is damped, not tracked 1:1 like x. .who__city
        // puts the image above the word for Mumbai/Bengaluru and below it
        // for Delhi (.is-low), so the word itself sits off-centre by a
        // different amount for each city. Anchoring the model exactly to
        // the word carried that asymmetry into the landmark's vertical
        // room: the two cities whose word sits low were left almost no
        // clearance before the canvas's bottom edge, which is why they
        // clipped while Delhi (word pushed up) never did. Damping keeps
        // a little of that stagger, which reads as intentional rhythm,
        // without spending the frustum's vertical margin on it.
        offsets[i] = [x, yRaw * 0.35];
      });
    };

    // Render at a modest cap. Lines want some resolution, but this is a
    // backdrop, not the subject, so 1.5 is plenty and 4x cheaper than 3.
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let aspect = 1;
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      if (!r.width || !r.height) return;
      canvas.width = Math.max(1, Math.round(r.width * dpr));
      canvas.height = Math.max(1, Math.round(r.height * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
      aspect = r.width / r.height;
      perspective(proj, (46 * Math.PI) / 180, aspect, 0.1, 40);
      gl.uniformMatrix4fv(u.proj, false, proj);
      measure();
    };
    resize();

    // pointer, normalised to the canvas, for a parallax tilt
    let px = 0, py = 0, sxp = 0, syp = 0;
    const onMove = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      if (!r.width) return;
      px = ((e.clientX - r.left) / r.width) * 2 - 1;
      py = ((e.clientY - r.top) / r.height) * 2 - 1;
    };
    window.addEventListener("mousemove", onMove, { passive: true });

    // hovering a city word promotes its landmark: bigger, brighter, closer,
    // and it stops spinning to turn its face toward the cursor instead
    const ac = new AbortController();
    host.querySelectorAll<HTMLElement>(".who__bandline > span[data-roll]")
      .forEach((wEl, i) => {
        if (i > 2) return;
        wEl.addEventListener("mouseenter", () => { st[i].word = true; },
          { signal: ac.signal });
        wEl.addEventListener("mouseleave", () => { st[i].word = false; },
          { signal: ac.signal });
      });

    let onScreen = false;
    const io = new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; },
      { rootMargin: "12%" });
    io.observe(host);
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    const t0 = performance.now();
    const drawSet = (
      geo: { buf: WebGLBuffer | null; count: number },
      a: number, b: number, s: number, tx: number, ty: number, tz: number,
      off: [number, number], fade: number,
    ) => {
      model(mv, a, b, s, tx, ty, tz);
      gl.uniformMatrix4fv(u.model, false, mv);
      gl.uniform2f(u.offset, off[0], off[1]);
      gl.uniform1f(u.fade, fade);
      gl.bindBuffer(gl.ARRAY_BUFFER, geo.buf);
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.LINES, 0, geo.count);
    };

    /* Sizing and brightness. WebGL clamps lineWidth to 1px in Chrome no
       matter what you ask for, so "more prominent" has to come from scale,
       alpha, and drawing the hovered one twice at a sub-pixel offset. */
    /* Sized so the tallest landmark (the arch, 1.43 world units half-height)
       still clears the frustum on hover. At z=3.5 the visible half-height is
       3.5*tan(23deg) = 1.49, so 1.43 * 0.95 = 1.36 leaves a margin. Going
       bigger than this is what pushed it off the top and bottom before. */
    const BASE_S = 0.78, HOVER_S = 0.95;     // world scale
    const BASE_Z = -4.2, HOVER_Z = -3.5;     // hovered one steps forward
    const BASE_A = 0.95, DIMMED_A = 0.32;    // others recede while one is up

    let last = performance.now();
    const render = (still: boolean) => {
      const now = performance.now();
      const dt = still ? 0 : Math.min((now - last) / 1000, 0.05);
      last = now;
      gl.clear(gl.COLOR_BUFFER_BIT);

      const tiltX = syp * 0.18, tiltY = sxp * 0.34;
      const anyHover = st.reduce((m, s) => Math.max(m, s.hov), 0);
      drawSet(grid, tiltY * 0.5, 0.60 + tiltX, 1, 0, -0.6, -16, [0, 0],
        0.30 * (1 - anyHover * 0.5));

      // draw the promoted one last so it paints over its neighbours
      const order = monuments.map((_, i) => i)
        .sort((a, b) => st[a].hov - st[b].hov);

      const TAN = Math.tan((46 * Math.PI) / 180 / 2);

      for (const i of order) {
        const s = st[i];

        /* Hit test the pointer against the landmark's own projected footprint,
           measured at the size it is RIGHT NOW. That makes the promotion
           sticky by construction: once it grows, its catch area grows with it,
           so sliding off the city word onto the model keeps it up, and it only
           drops when the pointer leaves the model itself. */
        const sNow = BASE_S + (HOVER_S - BASE_S) * s.hov;
        const zNow = Math.abs(BASE_Z + (HOVER_Z - BASE_Z) * s.hov);
        const hh = (extent[i][1] * sNow) / (zNow * TAN);
        const hw = (extent[i][0] * sNow) / (zNow * TAN * aspect);
        const cy = offsets[i][1] + -0.1 / (zNow * TAN);
        const overModel =
          Math.abs(px - offsets[i][0]) < hw * 1.08 &&
          Math.abs(-py - cy) < hh * 1.08;

        const want = s.word || overModel ? 1 : 0;
        s.hov += (want - s.hov) * (still ? 1 : 0.12);
        // spin freewheels, and winds down as the hover takes over
        s.phase += spin[i] * dt * (1 - s.hov);

        // face the cursor: yaw toward it horizontally, pitch vertically.
        // offsets[i] is the landmark's own clip position, so this is measured
        // from the landmark rather than from the middle of the canvas.
        const dx = px - offsets[i][0];
        const dy = -py - offsets[i][1];
        const yawTo = gsap.utils.clamp(-1.2, 1.2, dx * 1.6);
        const pitchTo = gsap.utils.clamp(-0.6, 0.6, -dy * 0.8);

        // shortest way round from the free spin to the cursor-facing angle
        const wrapped = Math.atan2(Math.sin(s.phase), Math.cos(s.phase));
        let d = yawTo - wrapped;
        d = Math.atan2(Math.sin(d), Math.cos(d));
        const yaw = wrapped + d * s.hov;
        const pitch = 0.10 + tiltX + (pitchTo - 0.10 - tiltX) * s.hov;

        const scale = BASE_S + (HOVER_S - BASE_S) * s.hov;
        const z = BASE_Z + (HOVER_Z - BASE_Z) * s.hov;
        // neighbours dim while one is promoted
        const fade = (BASE_A - (BASE_A - DIMMED_A) * (anyHover - s.hov)) *
          (1 + s.hov * 0.05);

        drawSet(monuments[i], yaw, pitch, scale, 0, -0.1, z, offsets[i], fade);
        // second pass, nudged half a pixel, to fake a heavier line on hover
        if (s.hov > 0.01) {
          const nudge = 1.4 / canvas.width;
          drawSet(monuments[i], yaw, pitch, scale, 0, -0.1, z,
            [offsets[i][0] + nudge, offsets[i][1]], fade * s.hov);
        }
      }
    };

    if (reduced) {
      render(true);
      return () => {
        window.removeEventListener("mousemove", onMove);
        ac.abort();
        io.disconnect(); ro.disconnect();
        gl.deleteProgram(prog); gl.deleteShader(vs); gl.deleteShader(fs);
        gl.deleteBuffer(grid.buf);
        monuments.forEach((m) => gl.deleteBuffer(m.buf));
        gl.getExtension("WEBGL_lose_context")?.loseContext();
      };
    }

    const tick = () => {
      if (!onScreen) return;
      sxp += (px - sxp) * 0.06;
      syp += (py - syp) * 0.06;
      render(false);
    };
    gsap.ticker.add(tick);

    return () => {
      gsap.ticker.remove(tick);
      window.removeEventListener("mousemove", onMove);
      ac.abort();
      io.disconnect();
      ro.disconnect();
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(grid.buf);
      monuments.forEach((m) => gl.deleteBuffer(m.buf));
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, []);

  return <canvas className="band__field" ref={ref} aria-hidden="true" />;
}
