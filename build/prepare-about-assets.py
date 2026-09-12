"""Export the supplied 4K About artwork as responsive WebP.

Every source is one of the user's nine `inu_media_assets_4k` PNGs. Cutouts are
trimmed to their own alpha bounding box (threshold 4, so the soft glow around
the lamp survives) and then scaled down only -- nothing is upscaled, recoloured
or retouched. The film strip additionally ships a two-frame crop, because the
About collage uses a short strip, not the full five-frame length.
"""
import json
import os

import numpy as np
from PIL import Image

SOURCE = r"F:\INU media\chatgpt inu design\INU_Media_6_Pages_4K\about\inu_media_assets_4k"
OUT = os.path.join(os.path.dirname(__file__), "..", "src", "about", "assets")
MANIFEST = os.path.join(os.path.dirname(__file__), "..", "src", "about", "assets.json")

# key -> (file, widths, crop)  crop is a fraction box (l, t, r, b) of the trimmed art
PLAN = {
    "hero-room": ("moody_amber_spotlight_studio_4k.png", [900, 1500, 2161], None),
    "spotlight": ("vintage_fresnel_spotlight_on_stand_4k.png", [520, 900, 1400], None),
    "chair": ("cinematic_inu_director_s_chair_4k.png", [520, 900, 1400], None),
    "roadcase": ("rugged_black_road_case_with_chalk_lettering_4k.png", [460, 800, 1200], None),
    "camera": ("cinematic_black_camera_rig_with_orange_rim_light_4k.png", [560, 950, 1450], None),
    "photo": ("taped_vintage_studio_photograph_4k.png", [560, 960, 1500], None),
    "filmframe": ("vintage_kodak_portrait_film_frame_4k.png", [560, 960, 1500], None),
    "filmstrip": ("vintage_film_strip_with_orange_light_leaks_4k.png", [260, 460, 700], (0, 0.18, 1, 0.62)),
    "clapper": ("gritty_cinematic_clapperboard_slate_4k.png", [620, 1050, 1600], None),
}


def trimmed(path):
    im = Image.open(path)
    if im.mode != "RGBA":
        return im.convert("RGB")
    alpha = np.array(im.getchannel("A"))
    ys, xs = np.where(alpha > 4)
    return im.crop((int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1))


def main():
    os.makedirs(OUT, exist_ok=True)
    manifest = {}
    for key, (name, widths, crop) in PLAN.items():
        art = trimmed(os.path.join(SOURCE, name))
        if crop:
            w, h = art.size
            art = art.crop((int(w * crop[0]), int(h * crop[1]), int(w * crop[2]), int(h * crop[3])))
        variants = []
        for width in widths:
            if width > art.width:
                continue
            height = round(art.height * width / art.width)
            resized = art.resize((width, height), Image.LANCZOS)
            filename = f"{key}-{width}.webp"
            target = os.path.join(OUT, filename)
            resized.save(target, "WEBP", quality=90, method=6)
            variants.append({
                "src": f"about-assets/{filename}",
                "width": width,
                "height": height,
                "bytes": os.path.getsize(target),
            })
        manifest[key] = variants
        print(f"{key:10s} {art.size} -> {[v['width'] for v in variants]}")
    with open(MANIFEST, "w", encoding="utf-8") as handle:
        json.dump(manifest, handle, indent=1)
        handle.write("\n")


if __name__ == "__main__":
    main()
