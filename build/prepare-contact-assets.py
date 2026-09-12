"""Responsive exports from client originals. No grading and no upscaling."""
from pathlib import Path
from PIL import Image, ImageOps
import json

root=Path(__file__).resolve().parents[1]
design=root.parent/'chatgpt inu design'
scene=design/'INU_Media_6_Pages_4K/contact/lets_talk_4k_assets'
creative=design/'creative images for inu media'
out=root/'src/contact-assets'
out.mkdir(parents=True,exist_ok=True)
manifest={}

def export(key, source, widths, crop=None):
    im=ImageOps.exif_transpose(Image.open(source))
    if crop: im=im.crop(crop)
    im=im.convert('RGBA' if 'A' in im.getbands() else 'RGB')
    variants=[]
    for w in sorted(set(min(w,im.width) for w in widths)):
        h=round(w*im.height/im.width)
        target=out/f'{key}-{w}.webp'
        im.resize((w,h),Image.Resampling.LANCZOS).save(target,'WEBP',quality=88,method=6)
        variants.append({'src':f'contact-assets/{target.name}','width':w,'height':h,'bytes':target.stat().st_size})
    manifest[key]=variants
    print(key, f'{im.width}x{im.height}', ', '.join(f'{v["width"]}w {v["bytes"]//1024}KB' for v in variants))

export('room',scene/'4k_lets_talk_background.png',[960,1920,2560,3840])
export('desk',scene/'4k_lets_talk_background.png',[960,1920,2560],(0,1740,3840,2160))
export('listener',scene/'4k_listener_maskman.png',[600,1000,1600])
export('speaker',scene/'4k_speaker_maskman.png',[400,700,1100])
export('device',scene/'4k_tin_can_voice_device.png',[400,800])
for page in ['home','about','services','portfolio','contact']:
    export('end-'+page,creative/f'{page}.png',[640,1100,2200])
gallery=[
    ('headphones','11_32_46 AM','A brighter feed. A braver world.'),
    ('rabbit','11_42_58 AM','Good stories travel far.'),
    ('cinema','11_56_04 AM','Good people. Greater ideas.'),
    ('televisions','12_10_47 PM','Good content. Better people.'),
    ('portrait','12_20_22 PM','Make brands famous.'),
    ('sculpture','12_28_04 PM','Different humans. Different cultures.'),
    ('rooftop','12_28_30 PM','Same city. Bigger stories.'),
    ('culture','12_34_30 PM','Good people make great content.')
]
for key,time,alt in gallery:
    source=next(creative.glob(f'*{time}.png'))
    export('creative-'+key,source,[640,1100,2200])
manifest['_gallery']=[{'key':'creative-'+key,'alt':alt} for key,_,alt in gallery]
(root/'src/contact-assets.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
