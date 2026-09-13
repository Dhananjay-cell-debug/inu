"""Rebuild the five Featured Work thumbnails on the home page.

Two things were wrong with the old set. They were 158x107 files being painted
into a 288px-wide card, so on any retina screen they were upscaled to roughly
four times their own resolution -- that is the blur. And the pictures were
generic stock that had nothing to do with the studio.

Until the real project drive arrives they are the INU collages from
`chatgpt inu design/creative images for inu media`, matched by subject to each
card's discipline, cropped to the card's 3:2 and exported at three widths so
the browser can pick one that fits.
"""
from PIL import Image
import json, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = pathlib.Path(r'F:\INU media\chatgpt inu design\creative images for inu media')
OUT = ROOT / 'src/home/assets'
RATIO = 1.5                      # .work-image is aspect-ratio:1.5
WIDTHS = (320, 640, 960)

# Card -> source collage, and how far down the crop sits (0 = top, 1 = bottom).
# Only two of the ten collages in that folder are not already carrying a card on
# /services, so some overlap between the two pages is unavoidable until the real
# project drive arrives; the picks below keep it to the minimum.
PLATES = {
    'martin':    ('ChatGPT Image Sep 12, 2026, 12_30_43 PM.png', 0.46),  # film / ads / social
    'vrindavan': ('ChatGPT Image Sep 12, 2026, 11_32_46 AM.png', 0.50),  # headphones, music
    'lodha':     ('ChatGPT Image Sep 12, 2026, 11_42_58 AM.png', 0.52),  # skyline, big campaign
    'maa':       ('ChatGPT Image Sep 12, 2026, 11_56_04 AM.png', 0.46),  # sunset, pop
    'aerobott':  ('ChatGPT Image Sep 12, 2026, 12_10_47 PM.png', 0.50),  # screens, tech
}


def crop(image, bias):
    width, height = image.size
    if width / height > RATIO:
        keep = int(height * RATIO)
        left = (width - keep) // 2
        return image.crop((left, 0, left + keep, height))
    keep = int(width / RATIO)
    top = int((height - keep) * bias)
    return image.crop((0, top, width, top + keep))


assets = json.loads((ROOT / 'src/home/assets.json').read_text('utf8'))
for name, (plate, bias) in PLATES.items():
    source = Image.open(SRC / plate).convert('RGB')
    art = crop(source, bias)
    variants = []
    for width in WIDTHS:
        height = round(width / RATIO)
        out = OUT / f'work-{name}-{width}.webp'
        art.resize((width, height), Image.LANCZOS).save(out, 'WEBP', quality=86, method=6)
        variants.append({'src': f'home-assets/{out.name}', 'width': width,
                         'height': height, 'bytes': out.stat().st_size})
    assets[f'work-{name}'] = variants
    print(f'work-{name}: {art.size[0]}x{art.size[1]} -> ' +
          ', '.join(f"{v['width']}w {v['bytes']//1024}kB" for v in variants))

(ROOT / 'src/home/assets.json').write_text(
    json.dumps(assets, indent=1, ensure_ascii=False) + '\n', 'utf8')
print('assets.json updated')
