/* ============================================================
   Bakes the footer's globe.

   The globe used to be a hand-drawn blob that was meant to read as India
   and a set of ellipses standing in for a graticule. At the size it
   renders that was almost enough, but "almost the right shape" is the one
   thing a map cannot be - so the real geometry is projected here, once,
   and written into lib/globe-paths.ts as flat path strings.

   Baked rather than computed at runtime on purpose: d3-geo and a copy of
   Natural Earth are ~1MB of dependency to draw four `d` attributes that
   never change. They are devDependencies; nothing here ships.

   Run: node scripts/build-globe.mjs
   ============================================================ */
import { writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { geoOrthographic, geoPath, geoGraticule } from "d3-geo";
import { feature, merge } from "topojson-client";

const require = createRequire(import.meta.url);
/* Two resolutions, because the two jobs are not the same one.

   The world coastline is context - it is read as "a planet", not as any
   particular coast - and 110m draws it in 29KB where 50m needs 354KB for
   detail that lands well under a pixel at this size.

   India is the subject. It is the shape a reader will actually check, so
   it gets 50m: the Gulf of Khambhat, the Rann of Kutch and a real
   Kanyakumari are what make the subcontinent legible at a glance, and
   110m rounds all three away. */
const worldCoarse = require("world-atlas/countries-110m.json");
const worldFine = require("world-atlas/countries-50m.json");

/* The sphere is authored at r=100 in a viewBox that gives it a little air
   (see the Globe in components/Footer.tsx). */
const R = 100;

/* Centred on the middle of India rather than on Mumbai itself: the pin
   should sit a little off-centre on the west coast, the way it does in a
   locator map, not dead in the middle of its own planet. */
const CENTRE = [79, 22];

/* How close the camera is. At 1 the disc is a full hemisphere, which is a
   planet with India as one detail on it; the subcontinent came out about a
   thumbnail wide and the whole thing read as far away. Scaling the
   projection past the sphere's own radius pulls the viewer in - the disc
   still draws at r=R, it just holds a smaller cap of the world.
   1.85 is India filling most of the face with its neighbours still around
   it for context, which is what makes it read as a globe rather than a
   map of one country. */
const ZOOM = 1.85;

/* Whatever falls outside the disc is clipped away by the sphere anyway, so
   there is no reason to project it and ship it in the path string. The cap
   the disc can actually show is asin(1/ZOOM) from the centre. */
const CLIP = (Math.asin(1 / ZOOM) * 180) / Math.PI;

const projection = geoOrthographic()
  .scale(R * ZOOM)
  .translate([0, 0])
  .rotate([-CENTRE[0], -CENTRE[1]])
  .clipAngle(CLIP);            // everything past the disc's edge, dropped

const path = geoPath(projection);

/* Every country dissolved into one outline - the coastline, without 200
   internal borders drawn over it at 150px. */
const land = merge(worldCoarse, worldCoarse.objects.countries.geometries);

/* Islands under this many square degrees are dropped. At the rendered
   size they are one pixel of speckle each, and a hundred of them read as
   dirt on the screen rather than as an archipelago. India's own islands
   go with them, which is correct here: the mainland is the shape being
   recognised. */
const MIN_AREA = 1.4;
const ringArea = (ring) => {
  let a = 0;
  for (let i = 0, n = ring.length - 1; i < n; i++) {
    a += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
  }
  return Math.abs(a / 2);
};
const dropSpeckle = (geom) => ({
  ...geom,
  coordinates: geom.type === "MultiPolygon"
    ? geom.coordinates.filter((poly) => ringArea(poly[0]) >= MIN_AREA)
    : geom.coordinates,
});

const fineCountries = feature(worldFine, worldFine.objects.countries);
const india = fineCountries.features.find((f) => f.properties.name === "India");
if (!india) throw new Error("India not found in the country list");

/* 15 degrees, which is what the reference's grid steps at.

   Stopped at ±78 rather than run to the poles: every meridian converges
   on the same point up there, and at this size that is not a grid
   converging, it is a solid starburst sitting on top of Siberia. */
const graticule = geoGraticule()
  .step([15, 15])
  .extent([[-180, -78], [180, 78]]);

const MUMBAI = [72.8777, 19.076];
const pin = projection(MUMBAI);
if (!pin) throw new Error("Mumbai did not project - is it behind the globe?");

/* Half a unit. The sphere is r=100 and renders at ~74px across its
   radius, so half a unit is about a third of a pixel - below anything the
   screen can show, and it halves the string. */
const round = (d) => d.replace(/-?\d+\.\d+/g, (n) => String(Math.round(Number(n) * 2) / 2));

const out = {
  land: round(path(dropSpeckle(land))),
  india: round(path(dropSpeckle(india.geometry))),
  graticule: round(path(graticule())),
  pin: [Math.round(pin[0] * 10) / 10, Math.round(pin[1] * 10) / 10],
};

const ts = `/* ============================================================
   The footer's globe, projected.

   GENERATED - do not edit by hand. Run \`node scripts/build-globe.mjs\`
   to rebuild (d3-geo + Natural Earth 50m, both devDependencies).

   Orthographic, disc radius ${R}, projected at ${ZOOM}x that so the view
   sits in close on India, centred on ${CENTRE[0]}E ${CENTRE[1]}N and
   clipped ${CLIP.toFixed(1)}° out - the edge of what the disc can show. Every path below is in the same coordinate space, so the
   sphere is simply a circle of r=${R} at the origin and the pin needs no
   offset of its own.
   ============================================================ */

export const GLOBE_R = ${R};

/* the coastline - every country dissolved into one outline, because at
   this size internal borders are noise */
export const GLOBE_LAND =
  "${out.land}";

/* India on its own, so it can carry the accent */
export const GLOBE_INDIA =
  "${out.india}";

/* the graticule, 15° steps */
export const GLOBE_GRATICULE =
  "${out.graticule}";

/* Mumbai, projected - 19.0760° N, 72.8777° E */
export const GLOBE_PIN = { x: ${out.pin[0]}, y: ${out.pin[1]} } as const;
`;

writeFileSync(new URL("../lib/globe-paths.ts", import.meta.url), ts);

console.log("wrote lib/globe-paths.ts");
console.log("  land      ", out.land.length, "chars");
console.log("  india     ", out.india.length, "chars");
console.log("  graticule ", out.graticule.length, "chars");
console.log("  pin       ", out.pin);
