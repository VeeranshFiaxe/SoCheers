"""Cut the client wall's 32 wordmarks out of the supplied artwork.

Run from the repo root:  python scripts/extract-client-marks.py

Reads the 6144x4096 wall in assets/ (which is gitignored - it is 22MB of
source art and has no business in the deploy bundle), writes 32 masks to
public/assets/clients, and prints the ar/k table that BRAND_MARK in
lib/content.ts is built from. Re-run it rather than hand-editing a
number in that table.

Two things are worth knowing about how the sizing works, because they
are the difference between this reading as one wall and as 32 pasted
cut-outs.

1. The crops are TIGHT - the ink's own bounding box, no artboard. That
   is what stops a mark with generous padding around it arriving on the
   row half the size of its neighbours, which is the exact problem the
   nine hand-sourced SVGs had (Schweppes needed two and a half times
   everyone else's height just to reach the same cap).

2. The relative sizes are the ones on the supplied wall, not sizes this
   script invents. Somebody balanced that artwork - NETFLIX is set
   heavier than JioHotstar, CHANDON is letterspaced small, Belgian
   Waffle stacks over two lines - and the row reproduces those
   proportions exactly by carrying each mark's own ink height through as
   `k`, measured against NETFLIX as the ruler. Normalising every mark to
   one height would throw that away and flatten a designed wall into a
   list.
"""
from PIL import Image
import io

Image.MAX_IMAGE_PIXELS = None

SRC = "assets/SC Website Revamp/01. Home/logo wall.png"
OUT = "public/assets/clients"

# (wall name, slug, x0, y0, x1, y1) - boxes straight off detect.py, in
# reading order. "Zurich Kotak" is the one merged box: the artwork sets
# ZURICH and kotak as two cells and the wall names them as one client, so
# the crop spans both and keeps the gap the designer put between them.
MARKS = [
    ("Netflix",           "netflix",       190,  288,  902,  483),
    ("JioHotstar",        "jiohotstar",   1122,  329, 1936,  469),
    ("TCS",               "tcs",          2199,  233, 2645,  519),
    ("Pantaloons",        "pantaloons",   2927,  326, 3931,  449),
    ("Raymond",           "raymond",      4202,  242, 5018,  513),
    ("Superdry",          "superdry",     5258,  290, 6000,  461),

    ("ITC",               "itc",           189,  878,  795, 1083),
    ("Sunfeast Yippee!",  "yippee",       1116,  771, 1877, 1184),
    ("Nykaa Pro",         "nykaapro",     2120,  884, 2978, 1105),
    ("Schweppes",         "schweppes",    3193,  813, 3909, 1140),
    ("Universal Pictures", "universal",   4159,  935, 5067, 1056),
    ("Sony LIV",          "sonyliv",      5284,  924, 5989, 1054),

    ("Audi",              "audi",          160, 1510,  826, 1680),
    ("YES Bank",          "yesbank",      1088, 1531, 1967, 1666),
    ("Bingo!",            "bingo",        2198, 1391, 2854, 1775),
    ("Carlton",           "carlton",      3099, 1545, 4091, 1667),
    ("Broadway",          "broadway",     4282, 1494, 5100, 1706),
    ("Dabur",             "dabur",        5360, 1480, 6013, 1690),

    ("Haldiram's",        "haldirams",     147, 2032,  945, 2250),
    ("Chandon",           "chandon",      1152, 2122, 1933, 2221),
    ("Glenmorangie",      "glenmorangie", 2155, 2098, 3213, 2233),
    ("ASUS",              "asus",         3381, 2090, 4137, 2246),
    ("IndusInd",          "indusind",     4316, 2074, 5119, 2234),
    ("boAt",              "boat",         5347, 2021, 5987, 2287),

    ("Havmor",            "havmor",        104, 2642,  899, 2849),
    ("Belgian Waffle",    "belgianwaffle",1068, 2554, 1645, 3015),
    ("Zurich Kotak",      "zurichkotak",  1920, 2663, 3400, 2831),
    ("BHIM",              "bhim",         3586, 2679, 4338, 2835),
    ("Lupin",             "lupin",        4528, 2689, 5105, 2829),
    ("Reliance General",  "reliance",     5274, 2655, 6017, 2870),

    ("Croma",             "croma",         164, 3293, 1009, 3493),
    ("Nykaa",             "nykaa",        1222, 3276, 2096, 3562),
]

# NETFLIX is the ruler: all caps, no descender, so its ink height IS a
# cap height. Every other mark is expressed as a fraction of it.
REF_H = 483 - 288

# How many source pixels become one output pixel.
#
# The row draws the ruler at 31px * .85 = ~26px tall at its largest
# breakpoint, which is ~97px wide, so a 3x display wants ~290px of
# source. At .8 the crops were 570px - twice what anything could ever
# show, and 800KB of it. At .5 the ruler lands at 356px, which covers 3x
# with room over.
SCALE = 0.5

im = Image.open(SRC).convert("RGBA")
manifest = []
total = 0

for name, slug, x0, y0, x1, y1 in MARKS:
    box = im.crop((x0, y0, x1 + 1, y1 + 1))

    # re-tighten: the detected box came from a row-wide scan, so a mark
    # can carry a row or two of empty pixels at its edges
    bb = box.getchannel("A").getbbox()
    if bb:
        box = box.crop(bb)

    w, h = box.size
    out = box.resize((max(1, round(w * SCALE)), max(1, round(h * SCALE))), Image.LANCZOS)

    # white ink, original alpha - the mask reads the alpha and the site
    # paints its own colour behind it, so the RGB only has to be uniform
    white = Image.new("RGBA", out.size, (255, 255, 255, 0))
    white.putalpha(out.getchannel("A"))

    # Lossless WebP, not PNG. These are flat alpha shapes with hard
    # edges, which is the case WebP's lossless mode is best at - it
    # comes out a third the size of the equivalent PNG. Lossy is not an
    # option: a mask's edge artefacts show up as fringing on the letters.
    dest = "%s/%s.webp" % (OUT, slug)
    white.save(dest, "WEBP", lossless=True, quality=100, method=6)
    size = len(io.open(dest, "rb").read())
    total += size

    manifest.append({
        "name": name, "slug": slug,
        "ar": round(w / h, 2),
        "k": round(h / REF_H, 2),
        "px": "%dx%d" % out.size, "bytes": size,
    })
    print("%-20s %-14s %-11s ar=%-5.2f k=%-5.2f %6d B"
          % (name, slug, manifest[-1]["px"], w / h, h / REF_H, size))

print("\n%d marks, %.0f KB total" % (len(manifest), total / 1024))
print("\nBRAND_MARK entries for lib/content.ts:")
for m in manifest:
    print('  "%s": { slug: "%s", ar: %s, k: %s },'
          % (m["name"], m["slug"], m["ar"], m["k"]))
