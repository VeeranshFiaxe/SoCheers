"""============================================================
Bakes the two masks the flat lockup is painted from.

The brand's stacked lockup ships as one flat PNG drawn for white paper:
the yellow shapes in #ffcb0c, the line work and the wordmark in #231f20,
over a transparent ground. The site is dark, so the line work cannot stay
the colour the sheet has it in - and a PNG cannot be recoloured.

So the two inks are separated here, once, into a pair of white-with-alpha
masks. components/SoCheersLockup.tsx paints them with CSS: the yellow
shapes take --logo, the line work takes currentColor. Same artwork,
cream over the site's black and near-black over the About page's panels,
and pixel-for-pixel the file the design book hands us either way.

Baked rather than done at runtime for the same reason the globe is
(scripts/build-globe.mjs): it never changes, and Pillow is not something
this site should ship. Nothing here is a dependency of the build.

Run (needs Pillow):  python scripts/build-logo.py
============================================================"""
from PIL import Image

SRC = "public/assets/SC Website Revamp/00. SoCheers design book/logo 3-07 (1).png"
OUT = "public/assets/logo/"
# The masks are only ever drawn a few dozen to a few hundred pixels tall.
# 900 across is comfortably past that on a 3x screen and keeps both files
# under ~40KB.
OUT_W = 900

im = Image.open(SRC).convert("RGBA")
# cropped to the ink: the source carries a wide transparent margin, and
# every position the site measures off this artwork (the footer's overlay,
# the overture's dock) is a fraction of the artwork's own box.
im = im.crop(im.getbbox())
w, h = im.size

blob = Image.new("RGBA", (w, h), (255, 255, 255, 0))
ink = Image.new("RGBA", (w, h), (255, 255, 255, 0))
bp, ip, sp = blob.load(), ink.load(), im.load()

for y in range(h):
    for x in range(w):
        r, g, b, a = sp[x, y]
        if not a:
            continue
        # The yellow has a wide red-to-blue spread (255 against 12); the
        # near-black has almost none (35 against 32). Anti-aliased edges
        # keep the source's own alpha either way, so the masks carry the
        # artwork's edges rather than a re-rasterised approximation.
        (bp if r - b > 120 else ip)[x, y] = (255, 255, 255, a)

out_h = round(OUT_W * h / w)
for img, name in ((blob, "lockup-blob.png"), (ink, "lockup-ink.png")):
    img.resize((OUT_W, out_h), Image.LANCZOS).save(OUT + name)

print(f"{SRC}\n  -> {OUT}lockup-{{blob,ink}}.png  {OUT_W}x{out_h}  (source {w}x{h})")
