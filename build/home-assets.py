from pathlib import Path
from PIL import Image
import shutil

root = Path(__file__).resolve().parent.parent
ref = Image.open(root.parent / 'chatgpt inu design/INU_Media_6_Pages_4K/home/home.png').convert('RGB')
out = root / 'src/home/assets'
out.mkdir(parents=True, exist_ok=True)
# Extract only the supplied art; navigation, body copy and controls are HTML.
regions = {
    'hero': (0, 61, 728, 417),
    'hero-mobile': (123, 61, 728, 417),
    'closing': (277, 1340, 941, 1605),
    'strategy': (33, 738, 168, 864),
    'production': (181, 738, 317, 864),
    'design': (331, 738, 466, 864),
    'digital': (480, 738, 615, 864),
    'pr': (629, 738, 763, 864),
    'web': (779, 738, 913, 864),
    'martin': (33, 1076, 191, 1183),
    'vrindavan': (212, 1076, 369, 1183),
    'lodha': (391, 1076, 547, 1183),
    'maa': (571, 1076, 731, 1183),
    'aerobott': (752, 1076, 910, 1183),
    'logo-lodha': (209, 510, 289, 534),
    'logo-aerobott': (321, 502, 373, 540),
    'logo-hdfc': (405, 510, 476, 538),
    'logo-bombay': (505, 510, 565, 538),
    'logo-dlf': (601, 508, 661, 536),
    'logo-martin': (688, 511, 751, 538),
}
for name, box in regions.items():
    ref.crop(box).save(out / f'{name}.webp', quality=97, method=6)
background = Image.open(root.parent / 'chatgpt inu design/INU_Media_6_Pages_4K/home/INU_media_assets_4k/01_background_full_vertical.png').convert('RGB')
background.crop((0, 1640, 2160, 2370)).resize((1600, 225), Image.Resampling.LANCZOS).save(out / 'film.webp', quality=92, method=6)
for font in ['archivo.woff2', 'montserrat.woff2']:
    shutil.copy2(root / 'site/assets/fonts' / font, out / font)
print(f'Prepared {len(regions)} reference artwork assets and two local fonts.')
