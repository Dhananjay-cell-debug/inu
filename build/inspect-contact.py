from pathlib import Path
from PIL import Image, ImageOps, ImageDraw
import fitz, zipfile, subprocess

root = Path(__file__).resolve().parents[1]
design = root.parent / 'chatgpt inu design'
out = root / 'qa/contact'
out.mkdir(parents=True, exist_ok=True)
folder = design / 'INU_Media_6_Pages_4K/contact'
with zipfile.ZipFile(folder / 'lets_talk_4k_assets.zip') as archive:
    print('ZIP entries:', archive.namelist())

def sheet(paths, filename, cols=2):
    canvas = Image.new('RGB', (cols*600, ((len(paths)+cols-1)//cols)*390), '#242424')
    draw = ImageDraw.Draw(canvas)
    for i,p in enumerate(paths):
        im=Image.open(p).convert('RGBA')
        print(p.name, im.size, 'alpha bbox', im.getchannel('A').getbbox())
        tile=ImageOps.contain(im,(590,345))
        x=(i%cols)*600; y=(i//cols)*390
        canvas.paste(tile,(x+(600-tile.width)//2,y),tile)
        draw.text((x+10,y+350),p.name[:68],fill='white')
    canvas.save(out/filename)

sheet(list((folder/'lets_talk_4k_assets').glob('*.png')),'layers.jpg')
sheet(list((design/'creative images for inu media').glob('*.png')),'creatives.jpg',3)
for p in (root.parent/'content').glob('*.pdf'):
    doc=fitz.open(p)
    for i,page in enumerate(doc):
        txt=page.get_text()
        if '@' in txt or '912-' in txt or 'Contact' in txt or 'contact' in txt:
            print('CONTACT SOURCE',p.name,'PAGE',i+1,txt)
            page.get_pixmap(matrix=fitz.Matrix(1,1)).save(out/(p.stem[:15]+f'-{i+1}.png'))
for slug,filename in [('portfolio','Screen Recording 2026-09-12 180341.mp4'),('reveal','Screen Recording 2026-09-12 124111.mp4')]:
    p=Path('C:/Users/Dhananjay/Videos/Screen Recordings')/filename
    if p.exists():
        subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-i',str(p),'-vf','fps=1/3,scale=480:-1,tile=4x3','-frames:v','1','-y',str(out/(slug+'-recording.jpg'))],check=True)
