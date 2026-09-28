"""Cut the Satoshi web fonts down to the characters the site can set.

The masters are in assets/fonts/ (the full 431-character files); this
writes the subsets over app/fonts/, which is what next/font serves. Kept:
Latin-1, general punctuation, currency, letterlike symbols and arrows,
maths operators, geometric shapes, and anything else found in the built
site and the source - every OpenType feature is kept. 150KB -> ~105KB for
the six cuts, and fonts are fetched at the highest priority there is, so
this comes straight off the first paint on a phone.

    npm run build && python scripts/subset-fonts.py && npm run build

(the first build is only there so out/ can be scanned for characters)
Needs: pip install fonttools brotli
"""
import glob, io, os
from fontTools import subset
from fontTools.ttLib import TTFont

used = set()
for f in glob.glob("out/**/*", recursive=True):
    if os.path.isfile(f) and f.endswith((".html", ".txt", ".js", ".json")):
        used |= set(open(f, encoding="utf-8", errors="ignore").read())
for f in glob.glob("lib/**/*.ts", recursive=True) + glob.glob("components/**/*.tsx", recursive=True):
    used |= set(open(f, encoding="utf-8").read())

base = (set(range(0x20, 0x7F)) | set(range(0xA0, 0x100)) | {0x131, 0x152, 0x153, 0x2C6, 0x2DA, 0x2DC}
        | set(range(0x2000, 0x2070)) | set(range(0x20A0, 0x20D0)) | set(range(0x2100, 0x2300))
        | set(range(0x25A0, 0x2600)))

for master in sorted(glob.glob("assets/fonts/*.woff2")):
    font = TTFont(master)
    keep = sorted((base | {ord(c) for c in used}) & set(font.getBestCmap()))
    opt = subset.Options()
    opt.flavor = "woff2"; opt.layout_features = ["*"]; opt.name_IDs = ["*"]
    opt.notdef_outline = True; opt.hinting = True
    s = subset.Subsetter(opt); s.populate(unicodes=keep); s.subset(font)
    out = os.path.join("app/fonts", os.path.basename(master))
    font.flavor = "woff2"; font.save(out)
    print(f"{os.path.basename(master):28} {os.path.getsize(master):6} -> {os.path.getsize(out):6}  ({len(keep)} chars)")
