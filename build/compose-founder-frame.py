"""Seat the founder's own portrait inside the taped film frame.

The frame plate ships as one flat image with a stock photo baked into its
window, so the portrait has to be perspective-mapped onto that window's quad
(the frame hangs a few degrees off square) and then re-aged, or it reads as a
sticker rather than a print someone taped to the wall.
"""
from PIL import Image, ImageFilter, ImageEnhance
import numpy as np, pathlib, sys

SRC   = pathlib.Path(r'F:\INU media\chatgpt inu design\INU_Media_6_Pages_4K\about\sahil bhai.png')
ASSETS = pathlib.Path(__file__).resolve().parent.parent / 'src/about/assets'
MASTER = ASSETS / 'filmframe-1500.webp'
# The window, measured off the master plate (see build/measure-about.js notes).
QUAD = [(284, 78), (1348, 247), (1195, 1613), (120, 1418)]
# Keep the handwritten "Good Films, Better Stories" whole and stop at x=1225,
# where the sprocket strip printed into the source photo begins.
CROP = (223, 0, 1224, 1254)
WIDTHS = (560, 960, 1500)


def coeffs(target, source):
    """Solve the 8 perspective coefficients mapping target quad -> source quad."""
    a = []
    for (tx, ty), (sx, sy) in zip(target, source):
        a.append([tx, ty, 1, 0, 0, 0, -sx * tx, -sx * ty])
        a.append([0, 0, 0, tx, ty, 1, -sy * tx, -sy * ty])
    A = np.array(a, dtype=float)
    B = np.array(sum(([sx, sy] for sx, sy in source), []), dtype=float)
    return np.linalg.solve(A, B)


frame = Image.open(MASTER).convert('RGBA')
W, H = frame.size

photo = Image.open(SRC).convert('RGB').crop(CROP)
# Warm the grade a touch and firm up the blacks so it survives a dark page.
photo = ImageEnhance.Contrast(photo).enhance(1.08)
photo = ImageEnhance.Color(photo).enhance(1.06)

pw, ph = photo.size
warped = photo.convert('RGBA').transform(
    (W, H), Image.PERSPECTIVE,
    coeffs(QUAD, [(0, 0), (pw, 0), (pw, ph), (0, ph)]),
    resample=Image.BICUBIC)

# The window mask, softened by a pixel so the print meets the frame cleanly.
mask = Image.new('L', (W, H), 0)
Image.Image.paste  # noqa - keep the import list honest
from PIL import ImageDraw
ImageDraw.Draw(mask).polygon(QUAD, fill=255)
mask = mask.filter(ImageFilter.GaussianBlur(1.1))

# Lift the frame's own dust and scratches back on top, so the new print ages
# with the plate instead of sitting cleanly in front of it.
inner = frame.convert('RGB')
grit = np.asarray(inner, dtype=np.float32) - np.asarray(
    inner.filter(ImageFilter.GaussianBlur(2.4)), dtype=np.float32)
grit = np.clip(grit, 0, None) * 0.85

base = np.asarray(warped.convert('RGB'), dtype=np.float32)
# Screen blend keeps the scratches bright without washing the midtones.
aged = 255.0 - (255.0 - base) * (255.0 - grit) / 255.0

# A gentle corner vignette, matching the falloff painted into the plate.
yy, xx = np.mgrid[0:H, 0:W]
cx, cy = np.mean([p[0] for p in QUAD]), np.mean([p[1] for p in QUAD])
r = np.sqrt(((xx - cx) / (W * 0.62)) ** 2 + ((yy - cy) / (H * 0.62)) ** 2)
aged *= np.clip(1.06 - 0.30 * r ** 2.1, 0, 1)[..., None]

print_ = Image.fromarray(np.clip(aged, 0, 255).astype('uint8'), 'RGB').convert('RGBA')
out = frame.copy()
out.paste(print_, (0, 0), mask)

for w in WIDTHS:
    h = round(H * w / W)
    out.resize((w, h), Image.LANCZOS).save(ASSETS / f'filmframe-{w}.webp',
                                           'WEBP', quality=92, method=6)
    print(f'filmframe-{w}.webp  {w}x{h}')
