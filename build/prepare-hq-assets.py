"""Prepare responsive WebP layers from supplied originals, without upscaling."""
from pathlib import Path
from PIL import Image
import json
ROOT = Path(__file__).resolve().parent.parent
PACK = ROOT.parent / 'chatgpt inu design/INU_Media_6_Pages_4K/home'
PROPS = PACK / 'INU_media_assets_4k'
OUT = ROOT / 'src/home/assets'
manifest = {}
def export(name, im, widths, quality=90):
    im = im.convert('RGBA' if 'A' in im.getbands() else 'RGB')
    variants = []
    for width in widths:
        width = min(width, im.width)
        height = round(im.height * width / im.width)
        dest = OUT / f'{name}-{width}.webp'
        im.resize((width, height), Image.Resampling.LANCZOS).save(dest, quality=quality, method=6, alpha_quality=100, exact=True)
        variants.append({'src':f'home-assets/{dest.name}', 'width':width, 'height':height, 'bytes':dest.stat().st_size})
    manifest[name] = variants
background = Image.open(PROPS / '01_background_full_vertical.png').convert('RGB')
export('hero-room', background.crop((0,0,2160,1020)), [960,1600,2160], 91)
export('film-scene', background.crop((0,1390,2160,2500)), [960,1600,2160], 88)
export('sunset-room', background.crop((0,2530,2160,3840)), [960,1600,2160], 91)
export('hero-person', Image.open(PROPS / '02_masked_man_cutout.png'), [480,800,1200], 92)
export('hero-desk', Image.open(PROPS / '03_executive_desk_cutout.png').crop((0,450,3840,1850)), [960,1600,2160], 91)
export('closing-person', Image.open(PACK / 'INU_Media_Home_4K_Assets/05_window_maskman_backview_4K.png'), [400,720,1000], 91)
for key,filename in [('strategy','04_chess_king_cutout.png'),('production','05_cinema_camera_cutout.png'),('design','06_design_tablet_cutout.png'),('digital','07_bar_chart_cutout.png'),('pr','08_microphones_cutout.png'),('web','09_laptop_workstation_cutout.png')]:
    im=Image.open(PROPS / filename)
    im=im.crop(im.getchannel('A').getbbox())
    export(f'service-{key}',im,[180,400,640],90)
(ROOT/'src/home/assets.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
print(f'Prepared {len(manifest)} independent artwork layers, {sum(map(len,manifest.values()))} responsive WebPs.')
print(f'Total across all sizes: {sum(v["bytes"] for vs in manifest.values() for v in vs)/1024/1024:.2f} MB; browsers download only their selected sizes.')
