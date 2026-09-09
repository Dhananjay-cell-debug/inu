"""Export supplied services layers and artwork-only reference crops, without upscaling.

Reproduction needs the user's original workspace. Normal builds use checked-in exports.
"""
from pathlib import Path
from PIL import Image
import json
import sys
ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT.parent / 'chatgpt inu design/INU_Media_6_Pages_4K/services'
PACK = SOURCE / 'services asset/4K Upscaled'
OUT = ROOT / 'src/services/assets'
OUT.mkdir(parents=True, exist_ok=True)
manifest = json.loads((OUT.parent/'assets.json').read_text(encoding='utf-8')) if '--foreground-only' in sys.argv else {}
def export(key, im, widths):
    variants=[]
    for width in sorted(set(min(w, im.width) for w in widths)):
        height=round(im.height*width/im.width)
        file=OUT/f'{key}-{width}.webp'
        im.resize((width,height),Image.Resampling.LANCZOS).save(file,'WEBP',quality=88,method=6)
        variants.append(dict(src=f'services-assets/{file.name}',width=width,height=height))
    manifest[key]=variants
def layer(key, number, widths):
    with Image.open(PACK/f'ChatGPT Image Sep 8, 2026, 08_20_51 AM ({number}).png') as im:
        if im.mode=='RGBA':
            im=im.crop(im.getchannel('A').getbbox())
        export(key,im,widths)
with Image.open(ROOT/'src/home/assets/hero-desk-2160.webp') as im:
    export('foreground-table',im.crop((0,round(im.height*.87),im.width,im.height)),(800,1440,2160))
if '--foreground-only' in sys.argv:
    (OUT.parent/'assets.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
    print('Prepared foreground tabletop from the existing supplied desk artwork.')
    raise SystemExit
with Image.open(PACK/'ChatGPT Image Sep 8, 2026, 08_20_51 AM (1).png') as im:
    export('hero-room',im.crop((0,0,im.width,round(im.height*.235))),(800,1440,2161))
with Image.open(PACK/'ChatGPT Image Sep 8, 2026, 02_37_53 PM - 4K.png') as im:
    export('closing-room',im.crop((0,round(im.height*.804),im.width,round(im.height*.94))),(640,1200,1920))
layer('hero-person',2,(400,720,1100))
layer('hero-desk',9,(640,1200,1800))
layer('closing-desk',3,(640,1200,1800))
layer('closing-person',8,(320,600,900))
layer('chair',5,(320,640))
layer('plant',6,(240,480))
layer('lamp',7,(200,400))
# Reference is 1920 x 3840. These coordinates are specified in its 1024 x 2048
# preview space. The images contain only the photographed artwork: page numbers,
# headings, buttons and lists remain HTML. Intrinsic laptop lettering is artwork.
with Image.open(SOURCE/'inu_media_services_page_4k.png') as ref:
    for key, x, y in [('digital',39,578),('design',281,578),('video',519,578),('performance',758,578),('social',39,943),('pr',281,943),('web',519,943),('strategy',758,943)]:
        box=(x+35,y,x+223,y+154)
        crop=ref.crop(tuple(round(v*ref.width/1024) for v in box))
        export('card-'+key,crop,(180,360))
(OUT.parent/'assets.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
print(f'Prepared {len(manifest)} responsive services artworks. Card crops retain reference resolution.')
