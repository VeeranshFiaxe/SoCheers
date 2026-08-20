/* ============================================================
   Bakes the about page's 3D figure.

   The source (assets/about-3d-man.src.glb) is a raw photogrammetry scan:
   one merged 262k-triangle mesh, no bones, no nodes, and three 2048²
   JPEGs - 14.3MB in total. Two things are wrong with shipping that as-is.

   The first is weight. 14MB of model on a page that already carries a
   scroll engine is not a fair ask of a laptop on a hotel wifi, and the
   detail is spent at a size nobody sees it: the figure renders about 500
   CSS pixels tall, where a 2048² albedo is roughly sixteen texels per
   pixel and a quarter of a million triangles is about four per pixel.

   The second is that the head has to turn, and in the source it cannot.
   The scan is a single primitive - the monitor is welded to the collar -
   so there is nothing to rotate. This script cuts it in two.

   Where it cuts is not a guess. Sliced horizontally, the scan's own
   silhouette says where the neck is: from y=0.62 to the crown the width
   holds flat at 0.333 (the monitor is a box), at y=0.61 it pinches to
   0.318, and one slice below that it flares past 0.57 into the shoulders.
   So the cut goes at CUT_Y, the pinch, and the head pivots about a point
   just under it, inside the collar - which is also what keeps the join
   honest: the monitor's underside overhangs the collar, so at the angles
   AboutMan.tsx actually drives (25° of yaw, 16° down, 10° up) the seam
   stays covered and no cap geometry is needed. Nodding down covers it
   further still, which is why that limit is the loosest of the three.

   Vertices sitting on the cut are locked before simplification, so the
   two halves keep matching boundaries and the seam cannot drift open.

   Output: public/assets/about/about-man.glb, two nodes, ~1.6MB.
   Baked, not computed at runtime - the split and the decimation are the
   same every time, and doing them in the browser would cost every visitor
   a few hundred milliseconds of main thread to arrive at this exact file.

   Needs `sharp` and `meshoptimizer`, both build-time only; nothing here
   ships. Re-run after changing any constant below:

   Run: node scripts/build-about-man.mjs
   ============================================================ */
import { readFileSync, writeFileSync, statSync } from "node:fs";
import sharp from "sharp";
import { MeshoptSimplifier } from "meshoptimizer/simplifier";

const SRC = "assets/about-3d-man.src.glb";
const OUT = "public/assets/about/about-man.glb";

/* Where the neck pinches (see the header) and the point the head turns
   about: centred on the neck, a shade below the cut so the monitor swings
   like a head on a spine rather than spinning on its own base. Both are
   in the scan's own units, where the figure stands from y=-1 to y=1. */
const CUT_Y = 0.617;
const PIVOT = [0.002, 0.6, 0.039];

/* Where the figure stops. The page shows a torso now, not a whole man -
   the figure stands in the middle of the frame at four times the size it
   used to be at the edge of one, and at that scale a full-length body is
   mostly trouser doing nothing while the part that acts (the shoulders
   and the head on top of them) is too small to read.

   So the legs come off here rather than being framed out at runtime.
   Cropping with the camera would still have downloaded them, uploaded
   them to the GPU and transformed them every frame to be drawn off the
   bottom of a canvas nobody can see.

   Where it cuts is read off the same silhouette the neck cut was. Below
   the shoulders the slices hold a depth of ~0.44 all the way down the
   jacket; at y=-0.18 the depth collapses to 0.33 and one slice further to
   0.28, which is the jacket hem ending and the trousers carrying on
   alone. FLOOR_Y sits below that, so the hem is kept whole and what the
   cut actually runs through is plain trouser - and the canvas fades that
   last stretch out to nothing anyway (see .ab-man__canvas in about.css),
   so the open edge is never on screen. */
const FLOOR_Y = -0.28;

/* Triangle budgets. The head is a box with a bezel - hard surfaces, flat
   panels, and almost nothing that a triangle earns its keep on - so it
   takes the harder cut. The body is cloth: the lapel roll, the sleeve
   creases and the trouser break are the whole reason the figure reads as
   photographed rather than modelled, and they go first if pushed. */
const HEAD_TRIS = 16000;
/* The body is a torso now (see FLOOR_Y), not a whole figure, so the old
   58k would have been the legs' share handed to the jacket. It is a
   smaller surface shown larger, so it does not simply scale down by the
   share of height that went: 40k over the torso alone is a finer mesh per
   square inch than 58k was over the whole man, which is what the new
   framing asks for. */
const BODY_TRIS = 40000;

/* Texture budgets. Albedo carries the read, so it keeps the most.
   The normal map is fabric weave at this size and survives half.
   Metal/rough is near-constant across the whole scan (see below), so it
   is here almost as a formality. */
const TEX = { albedo: 1024, normal: 1024, orm: 512 };

/* ---------------------------------------------------------------- glb io */

function readGlb(path) {
  const buf = readFileSync(path);
  let off = 12, json = null, bin = null;
  while (off < buf.length) {
    const len = buf.readUInt32LE(off);
    const type = buf.toString("utf8", off + 4, off + 8).trim();
    if (type === "JSON") json = JSON.parse(buf.toString("utf8", off + 8, off + 8 + len));
    else bin = Buffer.from(buf.subarray(off + 8, off + 8 + len));
    off += 8 + len;
  }
  return { json, bin };
}

const pad4 = (n) => (n + 3) & ~3;

function writeGlb(path, json, bin) {
  const js = Buffer.from(JSON.stringify(json), "utf8");
  const jsPad = Buffer.concat([js, Buffer.alloc(pad4(js.length) - js.length, 0x20)]);
  const binPad = Buffer.concat([bin, Buffer.alloc(pad4(bin.length) - bin.length)]);
  const head = Buffer.alloc(12);
  head.write("glTF", 0, "utf8");
  head.writeUInt32LE(2, 4);
  head.writeUInt32LE(12 + 8 + jsPad.length + 8 + binPad.length, 8);
  const ch = (b, tag) => {
    const h = Buffer.alloc(8);
    h.writeUInt32LE(b.length, 0);
    h.write(tag, 4, "utf8");
    return Buffer.concat([h, b]);
  };
  writeFileSync(path, Buffer.concat([head, ch(jsPad, "JSON"), ch(binPad, "BIN\0")]));
}

/* ---------------------------------------------------------------- source */

const { json: src, bin: srcBin } = readGlb(SRC);

function readAccessor(i) {
  const a = src.accessors[i];
  const v = src.bufferViews[a.bufferView];
  const comps = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 }[a.type];
  const off = (v.byteOffset || 0) + (a.byteOffset || 0);
  const n = a.count * comps;
  if (a.componentType === 5126) return new Float32Array(srcBin.buffer, srcBin.byteOffset + off, n);
  if (a.componentType === 5125) return new Uint32Array(srcBin.buffer, srcBin.byteOffset + off, n);
  if (a.componentType === 5123) return new Uint16Array(srcBin.buffer, srcBin.byteOffset + off, n);
  throw new Error(`unhandled componentType ${a.componentType}`);
}

const prim = src.meshes[0].primitives[0];
const POS = readAccessor(prim.attributes.POSITION);
const NRM = readAccessor(prim.attributes.NORMAL);
const UV = readAccessor(prim.attributes.TEXCOORD_0);
const RAW_IDX = Uint32Array.from(readAccessor(prim.indices));
const VCOUNT = POS.length / 3;

console.log(`source  ${(statSync(SRC).size / 1048576).toFixed(2)}MB  ` +
  `${VCOUNT.toLocaleString()} verts  ${(RAW_IDX.length / 3).toLocaleString()} tris`);

/* ------------------------------------------------------------- the floor */

/* The legs go before anything else looks at the mesh, so every step below
   - the seam scan, the split, both decimations, the vertex compaction -
   is working on the figure that actually ships. By centroid, for the same
   reason the head split is: a triangle is a piece of surface and belongs
   wholly on one side of a cut. */
const IDX = (() => {
  const keep = [];
  for (let t = 0; t < RAW_IDX.length; t += 3) {
    const y = (POS[RAW_IDX[t] * 3 + 1] + POS[RAW_IDX[t + 1] * 3 + 1] +
      POS[RAW_IDX[t + 2] * 3 + 1]) / 3;
    if (y >= FLOOR_Y) keep.push(RAW_IDX[t], RAW_IDX[t + 1], RAW_IDX[t + 2]);
  }
  return Uint32Array.from(keep);
})();

console.log(`torso   legs cut at y=${FLOOR_Y}  ` +
  `${(IDX.length / 3).toLocaleString()} tris kept ` +
  `(${(100 - (IDX.length / RAW_IDX.length) * 100).toFixed(1)}% dropped)`);

/* ------------------------------------------------------------- the split */

/* By triangle centroid, not by vertex: a vertex is only a place, but a
   triangle is a piece of surface and has to end up wholly on one side. */
const isHeadTri = new Uint8Array(IDX.length / 3);
for (let t = 0; t < IDX.length; t += 3) {
  const y = (POS[IDX[t] * 3 + 1] + POS[IDX[t + 1] * 3 + 1] + POS[IDX[t + 2] * 3 + 1]) / 3;
  isHeadTri[t / 3] = y > CUT_Y ? 1 : 0;
}

/* Vertices the cut runs through: used by a head triangle and a body one
   at once. These are what must not move while each half is decimated -
   if they did, the two boundaries would stop agreeing and daylight would
   show at the collar.

   Locking them by index is not enough. The scan splits vertices at every
   UV seam, so one point in space is often several indices, and locking
   the one that happened to be shared while its twin stays free would tear
   the seam open exactly where it is least forgivable. So the positions
   are collected first, then every vertex standing at one of them is
   locked, twins included. */
const seamKey = (i) => `${Math.round(POS[i * 3] * 1e5)},` +
  `${Math.round(POS[i * 3 + 1] * 1e5)},${Math.round(POS[i * 3 + 2] * 1e5)}`;
const seamAt = new Set();
{
  const inHead = new Uint8Array(VCOUNT), inBody = new Uint8Array(VCOUNT);
  for (let t = 0; t < IDX.length; t += 3) {
    const mark = isHeadTri[t / 3] ? inHead : inBody;
    mark[IDX[t]] = 1; mark[IDX[t + 1]] = 1; mark[IDX[t + 2]] = 1;
  }
  for (let i = 0; i < VCOUNT; i++) if (inHead[i] && inBody[i]) seamAt.add(seamKey(i));
}
console.log(`seam    ${seamAt.size} distinct positions on the cut`);

/* Pull one half out into its own compact vertex/index pair. */
function extract(wantHead) {
  const remap = new Int32Array(VCOUNT).fill(-1);
  const idx = [];
  let n = 0;
  for (let t = 0; t < IDX.length; t += 3) {
    if (!!isHeadTri[t / 3] !== wantHead) continue;
    for (let k = 0; k < 3; k++) {
      const o = IDX[t + k];
      if (remap[o] < 0) remap[o] = n++;
      idx.push(remap[o]);
    }
  }
  const pos = new Float32Array(n * 3), nrm = new Float32Array(n * 3);
  const uv = new Float32Array(n * 2), lock = new Uint8Array(n);
  for (let o = 0; o < VCOUNT; o++) {
    const d = remap[o];
    if (d < 0) continue;
    for (let k = 0; k < 3; k++) { pos[d * 3 + k] = POS[o * 3 + k]; nrm[d * 3 + k] = NRM[o * 3 + k]; }
    uv[d * 2] = UV[o * 2]; uv[d * 2 + 1] = UV[o * 2 + 1];
    if (seamAt.has(seamKey(o))) lock[d] = 1;
  }
  return { pos, nrm, uv, lock, idx: Uint32Array.from(idx) };
}

/* --------------------------------------------------------- decimation */

await MeshoptSimplifier.ready;

/* Normals and UVs both steer the collapse. The UV weight is the higher of
   the two on purpose: this atlas is a photogrammetry bake, thousands of
   small islands rather than a laid-out chart, so a collapse that drags a
   vertex across an island boundary does not blur the texture, it fetches
   a piece of somebody's shoulder and prints it on a lapel. Normals matter
   less - there is a normal map carrying the fine shading anyway. */
const WEIGHTS = [0.35, 0.35, 0.35, 0.9, 0.9];

function simplify(part, targetTris, label) {
  const attrs = new Float32Array(part.pos.length / 3 * 5);
  for (let i = 0; i < part.pos.length / 3; i++) {
    attrs[i * 5] = part.nrm[i * 3];
    attrs[i * 5 + 1] = part.nrm[i * 3 + 1];
    attrs[i * 5 + 2] = part.nrm[i * 3 + 2];
    attrs[i * 5 + 3] = part.uv[i * 2];
    attrs[i * 5 + 4] = part.uv[i * 2 + 1];
  }
  const [idx, err] = MeshoptSimplifier.simplifyWithAttributes(
    part.idx, part.pos, 3, attrs, 5, WEIGHTS, part.lock,
    targetTris * 3, 0.02,
  );

  /* Decimation leaves the vertex buffers full of points nothing indexes
     any more; compactMesh hands back the order that drops them.

     Note it rewrites `idx` in place to the new numbering as it goes - the
     table it returns is only for gathering the vertex data (remap[old] =
     new, or 0xffffffff where a vertex went unused). Running the indices
     through that table as well would be remapping them twice. */
  const [remap, count] = MeshoptSimplifier.compactMesh(idx);
  const pos = new Float32Array(count * 3), nrm = new Float32Array(count * 3);
  const uv = new Float32Array(count * 2);
  for (let i = 0; i < Math.min(remap.length, part.pos.length / 3); i++) {
    const d = remap[i];
    if (d === 0xffffffff || d >= count) continue;
    for (let k = 0; k < 3; k++) { pos[d * 3 + k] = part.pos[i * 3 + k]; nrm[d * 3 + k] = part.nrm[i * 3 + k]; }
    uv[d * 2] = part.uv[i * 2]; uv[d * 2 + 1] = part.uv[i * 2 + 1];
  }

  let maxIdx = 0;
  for (let i = 0; i < idx.length; i++) if (idx[i] > maxIdx) maxIdx = idx[i];
  if (maxIdx >= count) throw new Error(`${label}: index ${maxIdx} past ${count} vertices`);

  console.log(`${label.padEnd(7)}${(part.idx.length / 3).toLocaleString().padStart(8)} -> ` +
    `${(idx.length / 3).toLocaleString().padStart(7)} tris   ` +
    `${count.toLocaleString().padStart(7)} verts   error ${(err * 100).toFixed(3)}%`);
  return { pos, nrm, uv, idx };
}

const head = simplify(extract(true), HEAD_TRIS, "head");
const body = simplify(extract(false), BODY_TRIS, "body");

/* The head's geometry is re-expressed around the pivot, so that at
   runtime the node's own rotation is all a turn needs to be - no offset
   matrix, no re-centring per frame. */
for (let i = 0; i < head.pos.length / 3; i++) {
  head.pos[i * 3] -= PIVOT[0];
  head.pos[i * 3 + 1] -= PIVOT[1];
  head.pos[i * 3 + 2] -= PIVOT[2];
}

/* ------------------------------------------------------------ textures */

async function bake(imageIndex, size, opts) {
  const v = src.bufferViews[src.images[imageIndex].bufferView];
  const raw = srcBin.subarray(v.byteOffset || 0, (v.byteOffset || 0) + v.byteLength);
  const out = await sharp(raw).resize(size, size, { fit: "fill" }).webp(opts).toBuffer();
  console.log(`tex     ${String(size).padStart(4)}²  ` +
    `${(raw.length / 1024).toFixed(0).padStart(5)}KB -> ${(out.length / 1024).toFixed(0).padStart(4)}KB`);
  return out;
}

const albedo = await bake(0, TEX.albedo, { quality: 88 });
/* Normal maps hate lossy compression - a wrong texel here is a wrong
   surface angle, and it reads as a dent - so this one is asked for more. */
const normal = await bake(2, TEX.normal, { quality: 90 });
const orm = await bake(1, TEX.orm, { quality: 75 });

/* ---------------------------------------------------------- quantisation */

/* Positions to int16, normals to int8, UVs to uint16 - all normalised,
   all standard KHR_mesh_quantization, which three.js reads natively. It
   halves the file and halves what the GPU holds, and at this size the
   precision it costs is invisible: the figure's whole height maps to
   65k steps.

   Positions are quantised symmetrically about the part's own origin
   rather than about its bounding box, so no offset is needed to decode
   them - a single scale on the node does it. That matters for the head:
   three composes a node as translate * rotate * scale, so a scale-only
   decode still lands inside the rotation, and the head turns about its
   pivot exactly. An offset would have had to sit outside the rotation
   and would have swung the head around the room instead. */
function quantise(part) {
  const n = part.pos.length / 3;
  let maxAbs = 0;
  for (let i = 0; i < part.pos.length; i++) maxAbs = Math.max(maxAbs, Math.abs(part.pos[i]));
  /* A normalised short decodes as q/32767, so the node scale that turns
     it back into the scan's units is the half-extent itself. */
  const nodeScale = maxAbs;
  const step = maxAbs / 32767;

  const qp = new Int16Array(n * 4);   // VEC3 SHORT, padded to an 8-byte stride
  const qn = new Int8Array(n * 4);    // VEC3 BYTE,  padded to a 4-byte stride
  const qt = new Uint16Array(n * 2);  // VEC2 USHORT
  const pMin = [32767, 32767, 32767], pMax = [-32768, -32768, -32768];
  for (let i = 0; i < n; i++) {
    for (let k = 0; k < 3; k++) {
      const q = Math.max(-32767, Math.min(32767, Math.round(part.pos[i * 3 + k] / step)));
      qp[i * 4 + k] = q;
      if (q < pMin[k]) pMin[k] = q;
      if (q > pMax[k]) pMax[k] = q;
    }
    /* Renormalise: decimation moved vertices, and the normals that came
       along with them are no longer quite unit length. */
    let nx = part.nrm[i * 3], ny = part.nrm[i * 3 + 1], nz = part.nrm[i * 3 + 2];
    const len = Math.hypot(nx, ny, nz) || 1;
    qn[i * 4] = Math.max(-127, Math.min(127, Math.round(nx / len * 127)));
    qn[i * 4 + 1] = Math.max(-127, Math.min(127, Math.round(ny / len * 127)));
    qn[i * 4 + 2] = Math.max(-127, Math.min(127, Math.round(nz / len * 127)));
    qt[i * 2] = Math.max(0, Math.min(65535, Math.round(part.uv[i * 2] * 65535)));
    qt[i * 2 + 1] = Math.max(0, Math.min(65535, Math.round(part.uv[i * 2 + 1] * 65535)));
  }
  const idx = n <= 65535 ? Uint16Array.from(part.idx) : Uint32Array.from(part.idx);
  return { n, nodeScale, qp, qn, qt, idx, pMin, pMax };
}

const qHead = quantise(head);
const qBody = quantise(body);

/* ------------------------------------------------------------- assembly */

const bufferViews = [], accessors = [], chunks = [];
let cursor = 0;

function view(typedArray, extra = {}) {
  const bytes = Buffer.from(typedArray.buffer, typedArray.byteOffset, typedArray.byteLength);
  const padded = pad4(cursor);
  if (padded > cursor) { chunks.push(Buffer.alloc(padded - cursor)); cursor = padded; }
  bufferViews.push({ buffer: 0, byteOffset: cursor, byteLength: bytes.length, ...extra });
  chunks.push(bytes);
  cursor += bytes.length;
  return bufferViews.length - 1;
}

function accessor(props) { accessors.push(props); return accessors.length - 1; }

function meshFor(q) {
  const vPos = view(q.qp, { byteStride: 8, target: 34962 });
  const vNrm = view(q.qn, { byteStride: 4, target: 34962 });
  const vUv = view(q.qt, { byteStride: 4, target: 34962 });
  const vIdx = view(q.idx, { target: 34963 });
  return {
    primitives: [{
      attributes: {
        POSITION: accessor({
          bufferView: vPos, componentType: 5122, normalized: true,
          count: q.n, type: "VEC3", min: q.pMin, max: q.pMax,
        }),
        NORMAL: accessor({
          bufferView: vNrm, componentType: 5120, normalized: true,
          count: q.n, type: "VEC3",
        }),
        TEXCOORD_0: accessor({
          bufferView: vUv, componentType: 5123, normalized: true,
          count: q.n, type: "VEC2",
        }),
      },
      indices: accessor({
        bufferView: vIdx,
        componentType: q.idx.BYTES_PER_ELEMENT === 2 ? 5123 : 5125,
        count: q.idx.length, type: "SCALAR",
      }),
      material: 0,
    }],
  };
}

const meshes = [meshFor(qBody), meshFor(qHead)];
const vAlbedo = view(albedo), vNormal = view(normal), vOrm = view(orm);

const gltf = {
  asset: { version: "2.0", generator: "socheers build-about-man" },
  extensionsUsed: ["KHR_mesh_quantization", "EXT_texture_webp"],
  extensionsRequired: ["KHR_mesh_quantization", "EXT_texture_webp"],
  scene: 0,
  scenes: [{ nodes: [0, 1] }],
  nodes: [
    { name: "Body", mesh: 0, scale: [qBody.nodeScale, qBody.nodeScale, qBody.nodeScale] },
    /* Head sits at the pivot with its geometry already measured from it,
       so AboutMan.tsx only ever writes a rotation onto this node. */
    { name: "Head", mesh: 1, translation: PIVOT, scale: [qHead.nodeScale, qHead.nodeScale, qHead.nodeScale] },
  ],
  meshes,
  materials: [{
    name: "scan",
    pbrMetallicRoughness: {
      baseColorTexture: { index: 0 },
      metallicRoughnessTexture: { index: 2 },
      /* The scan ships metallic=1 and leans on the texture's blue channel
         to cancel it, which averages 0.5/255 across the whole figure -
         it is cloth, it was never metal. Pinning the factor to 0 says so
         outright, and means the material cannot go black if the map ever
         fails to load: a fully metallic surface with no environment to
         reflect has nothing to show. */
      metallicFactor: 0,
      roughnessFactor: 1,
    },
    normalTexture: { index: 1 },
    doubleSided: true,
  }],
  textures: [
    { sampler: 0, extensions: { EXT_texture_webp: { source: 0 } } },
    { sampler: 0, extensions: { EXT_texture_webp: { source: 1 } } },
    { sampler: 0, extensions: { EXT_texture_webp: { source: 2 } } },
  ],
  images: [
    { mimeType: "image/webp", bufferView: vAlbedo },
    { mimeType: "image/webp", bufferView: vNormal },
    { mimeType: "image/webp", bufferView: vOrm },
  ],
  samplers: [{ magFilter: 9729, minFilter: 9987, wrapS: 10497, wrapT: 10497 }],
  bufferViews,
  accessors,
  buffers: [{ byteLength: cursor }],
};

writeGlb(OUT, gltf, Buffer.concat(chunks));

/* ---------------------------------------------------------- verification */

/* Decode what was just written and check it back against the source, so a
   quantisation or layout mistake surfaces here rather than as an empty
   canvas in a browser. */
{
  const { json: out, bin } = readGlb(OUT);
  const report = [];
  for (const node of out.nodes) {
    const p = out.meshes[node.mesh].primitives[0];
    const a = out.accessors[p.attributes.POSITION];
    const v = out.bufferViews[a.bufferView];
    const q = new Int16Array(bin.buffer, bin.byteOffset + (v.byteOffset || 0), a.count * 4);
    const s = node.scale[0], t = node.translation || [0, 0, 0];
    const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < a.count; i++) {
      for (let k = 0; k < 3; k++) {
        /* the same decode three.js does: normalised short, then the
           node's scale, then its translation */
        const w = Math.max(q[i * 4 + k] / 32767, -1) * s + t[k];
        if (w < lo[k]) lo[k] = w;
        if (w > hi[k]) hi[k] = w;
      }
    }
    report.push([node.name, lo, hi]);
  }
  console.log("\nverify  decoded world-space bounds (source: x ±0.342, y -1..1, z ±0.244)");
  for (const [name, lo, hi] of report) {
    console.log(`        ${name.padEnd(5)} x ${lo[0].toFixed(3)}..${hi[0].toFixed(3)}  ` +
      `y ${lo[1].toFixed(3)}..${hi[1].toFixed(3)}  z ${lo[2].toFixed(3)}..${hi[2].toFixed(3)}`);
  }
}

const before = statSync(SRC).size, after = statSync(OUT).size;
console.log(`\noutput  ${OUT}`);
console.log(`        ${(after / 1048576).toFixed(2)}MB, down from ${(before / 1048576).toFixed(2)}MB ` +
  `(${(before / after).toFixed(1)}x)`);
