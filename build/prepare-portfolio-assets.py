"""Responsive exports of supplied layers; reference artwork crops never upscaled.

Page copy remains HTML. Poster crops stop above reference captions. Logo artwork
is the only reference text retained. Normal builds use the checked-in exports.
"""
from pathlib import Path
from PIL import Image
import json

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT.parent / 'chatgpt inu design/INU_Media_6_Pages_4K/portfolio'
PACK = SOURCE / 'INU_Portfolio_4K_Assets'
OUT = ROOT / 'src/portfolio/assets'
OUT.mkdir(parents=True, exist_ok=True)
manifest = {}

def export(key, im, widths):
    variants = []
    for width in sorted(set(min(w, im.width) for w in widths)):
        height = round(im.height * width / im.width)
        file = OUT / f'{key}-{width}.webp'
        im.resize((width, height), Image.Resampling.LANCZOS).save(file, 'WEBP', quality=90, method=6)
        variants.append(dict(src=f'portfolio-assets/{file.name}', width=width, height=height))
    manifest[key] = variants

for key, number, widths in [('director',2,(420,800,1300)),('workstation',3,(800,1500,2300)),('filmstrip',9,(300,600,900)),('studio',8,(480,900,1300))]:
    p = next(PACK.glob(f'{number:02}_*.png'))
    with Image.open(p) as im:
        export(key, im.crop(im.getchannel('A').getbbox()), widths)
with Image.open(PACK/'01_full_background_4K.png') as im:
    export('hero-room',im.crop((0,270,2161,1160)),(800,1440,2161))
    export('texture',im.crop((0,1200,2161,2680)),(800,1440,2161))
    export('closing-room',im.crop((0,2990,2161,3840)),(800,1440,2161))
# Remove the curtain's baked slogan by using its unlettered side as a repeatable
# scene texture in CSS; the full sign in the reference is recreated as real text.
with Image.open(PACK/'10_banner_curtain_4K.png') as im:
    export('curtain',im.crop((450,660,980,3320)),(200,400,530))
with Image.open(SOURCE/'INU_Media_portfolio_page_4K.png') as ref:
    scale=ref.width/878
    def crop(box): return ref.crop(tuple(round(v*scale) for v in box))
    for key,box in [
        ('maarrich',(19,563,300,691)),('lavaste',(311,563,565,696)),('jay',(576,563,858,701)),
        ('lodha',(19,779,243,882)),('aerobott',(257,779,455,889)),('bliss',(469,779,658,896)),('zouq',(672,779,858,890)),
        ('dom',(19,966,282,1072)),('online',(294,966,564,1063)),('mini',(578,966,858,1065))]:
        export('project-'+key,crop(box),(320,640,960))
    for i,key in enumerate(['lodha','aerobott','sunblond','home-mentors','chemist-king','bliss','maarrich','lavaste','jay','mini','zouq','dom']):
        x=[44,173,302,443,585,720][i%6]; right=[162,297,434,575,709,834][i%6]
        y=1506 if i<6 else 1566
        export('logo-'+key,crop((x+6,y+2,right-6,y+44)),(240,400))
    export('story-collage',crop((175,1132,346,1323)),(300,600))
(OUT.parent/'assets.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
print(f'Prepared {len(manifest)} portfolio artworks without enlarging sources.')
