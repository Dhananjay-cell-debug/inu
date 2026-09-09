"""Contact sheets for selecting supplied services art; writes only ignored QA files."""
from pathlib import Path
from PIL import Image, ImageOps, ImageDraw
import subprocess
ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT.parent / 'chatgpt inu design/INU_Media_6_Pages_4K/services/services asset/4K Upscaled'
OUT = ROOT / 'qa/services'
OUT.mkdir(parents=True, exist_ok=True)
files = sorted(SOURCE.glob('*.png'))
sheet = Image.new('RGB', (1000, ((len(files)+3)//4)*220), '#222222')
draw = ImageDraw.Draw(sheet)
for i, file in enumerate(files):
    with Image.open(file) as im:
        print(i, file.name, im.size, im.mode, im.getextrema()[-1] if im.mode=='RGBA' else '')
        thumb = ImageOps.contain(im.convert('RGBA'), (244,180))
        x, y = i%4*250, i//4*220
        sheet.paste(thumb,(x+(244-thumb.width)//2,y),thumb)
        draw.text((x+5,y+182), f'{i}: {file.stem.replace("ChatGPT Image Sep 8, 2026, ", "")}\n{im.width} x {im.height}',fill='white')
sheet.save(OUT / 'supplied-art.jpg')
for name in ['ChatGPT Image Sep 8, 2026, 02_37_53 PM - 4K.png', 'ChatGPT Image Sep 8, 2026, 08_20_51 AM (1).png']:
    with Image.open(SOURCE/name) as im:
        top=im.crop((0,0,im.width,round(im.height*.25)))
        ImageOps.contain(top,(1200,700)).save(OUT/(name[:35].replace(' ','_')+'-top.jpg'))
with Image.open(SOURCE.parent.parent/'inu_media_services_page_4k.png') as im:
    print('Reference',im.size)
burn = ROOT.parent / 'chatgpt inu design/cinematic feels/Level Up Your Videos with 4K Film Burn Transition Sounds.mp4'
subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-i',str(burn),'-vf','fps=1/2,scale=240:-1,tile=5x5','-frames:v','1','-y',str(OUT/'burn-sheet.jpg')],check=True)
