"""Prepare responsive WebP layers for the Let's talk page from the supplied 4K contact originals.

Every layer stays an independent transparent cutout or room plate so the page keeps its
headings, copy and controls as real HTML. Nothing is upscaled: each variant width is
clamped to the source width.
"""
from pathlib import Path
from PIL import Image, ImageFile
import json

Image.MAX_IMAGE_PIXELS = None
ImageFile.LOAD_TRUNCATED_IMAGES = True

ROOT = Path(__file__).resolve().parent.parent
PACK = ROOT.parent / 'chatgpt inu design/INU_Media_6_Pages_4K/contact/inu_contact_page_assets_4k'
OUT = ROOT / 'src/talk/assets'
OUT.mkdir(parents=True, exist_ok=True)

manifest = {}


def export(name, im, widths, quality=90):
    im = im.convert('RGBA' if 'A' in im.getbands() else 'RGB')
    variants = []
    for width in widths:
        width = min(width, im.width)
        height = round(im.height * width / im.width)
        dest = OUT / f'{name}-{width}.webp'
        im.resize((width, height), Image.Resampling.LANCZOS).save(
            dest, quality=quality, method=6, alpha_quality=100, exact=True)
        variants.append({'src': f'home-assets/{dest.name}', 'width': width,
                         'height': height, 'bytes': dest.stat().st_size})
    manifest[name] = variants


def cutout(filename, flip=False):
    im = Image.open(PACK / filename)
    im.load()
    im = im.crop(im.getchannel('A').getbbox())
    return im.transpose(Image.Transpose.FLIP_LEFT_RIGHT) if flip else im


room = Image.open(PACK / '01_futuristic_amberlit_city_atrium.png')
room.load()
room = room.convert('RGB')

# Four scenes are stacked in the one supplied vertical plate.
export('talk-room', room.crop((0, 0, 1536, 1060)), [960, 1536], 91)
export('talk-wall', room.crop((0, 940, 1536, 1980)), [960, 1536], 90)
export('talk-lounge', room.crop((0, 1900, 1536, 2960)), [960, 1536], 91)
export('talk-sunset', room.crop((0, 2860, 1536, 3840)), [960, 1536], 91)

export('talk-seated', cutout('02_masked_man_in_a_leather_armchair.png'), [520, 900, 1400], 92)
export('talk-figure', cutout('03_masked_businessman_in_dramatic_rim_light.png'), [420, 760, 1200], 92)
export('talk-back-left', cutout('04_masked_man_in_black_suit_silhouette.png'), [300, 560, 900], 91)
export('talk-back-center', cutout('05_backlit_man_in_formal_suit.png'), [320, 600, 960], 91)
export('talk-back-right', cutout('06_mysterious_masked_suit_agent.png', flip=True), [300, 560, 900], 91)
export('talk-chair', cutout('07_luxurious_black_leather_lounge_chair.png'), [320, 620, 1000], 90)
export('talk-table', cutout('08_luxury_amber_whiskey_tabletop.png'), [280, 520, 840], 90)
export('talk-tree', cutout('09_glowing_amber_lit_indoor_tree_in_cube_planter.png'), [340, 640, 1040], 90)

(ROOT / 'src/talk/assets.json').write_text(json.dumps(manifest, indent=2), encoding='utf-8')
total = sum(v['bytes'] for vs in manifest.values() for v in vs) / 1024 / 1024
print(f"Prepared {len(manifest)} layers, {sum(map(len, manifest.values()))} responsive WebPs.")
print(f"Total across all sizes: {total:.2f} MB; browsers download only their selected sizes.")
