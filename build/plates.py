"""Build the two card systems for the site.

1. WORK PLATES (16:9). The real client work was pulled out of proposal PDFs at
   wildly different sizes and shapes - a 201px magazine cover next to a 1200px
   event photo, portrait posters next to website screenshots. Dropping those
   into a grid raw is what made the old site look broken.

   So each one is graded into the same room instead: near-black ground, one
   warm light, film grain, a bottom shade for the caption. Landscape sources
   that can carry it go full bleed. Portrait and square sources sit at a
   generous size on a bed built from their own colours, inside a hairline
   frame, so they read as a deliberate poster plate rather than a stretched
   photo. Plates render at 1100x619 - about 2x the size a card is actually
   drawn at - so nothing is pushed further than it can survive.

2. SERVICE THUMBS (1:1) cut from the 4K prop packs, so the cards belong to the
   same world as the rest of the site instead of importing unrelated stock.
"""
import os
from PIL import Image, ImageFile, ImageFilter, ImageEnhance, ImageDraw, ImageChops, ImageFont
ImageFile.LOAD_TRUNCATED_IMAGES = True

REAL = r"F:\INU media\content\site_backup\images\pdf_extracted\portfolio_real"
IMG = r"F:\INU media\inu-cinematic\site\assets\img"
OUT = os.path.join(IMG, "work")

W, H = 1100, 619
INK = (7, 6, 5)
FONT_CANDIDATES = ("C:/Windows/Fonts/ariblk.ttf", "C:/Windows/Fonts/arialbd.ttf",
                   "C:/Windows/Fonts/impact.ttf")


# ------------------------------------------------------------------- helpers
def cover(im, size):
    tw, th = size
    w, h = im.size
    s = max(tw / w, th / h)
    im = im.resize((max(1, round(w * s)), max(1, round(h * s))), Image.LANCZOS)
    w, h = im.size
    x, y = (w - tw) // 2, (h - th) // 2
    return im.crop((x, y, x + tw, y + th))


def warm_light(im, x, y, r, power, gamma=2.4):
    """One amber source. The gamma keeps the falloff tight, so a plate stays
    black instead of turning into a brown wash."""
    w, h = im.size
    g = Image.new("L", (w, h), 0)
    cx, cy, rr = w * x, h * y, min(w, h) * r
    ImageDraw.Draw(g).ellipse([cx - rr, cy - rr, cx + rr, cy + rr], fill=255)
    g = g.filter(ImageFilter.GaussianBlur(min(w, h) * 0.20))
    g = g.point(lambda v: int(255 * (v / 255) ** gamma * power))
    warm = Image.merge("RGB", (g,
                               g.point(lambda v: v * 42 // 100),
                               g.point(lambda v: v * 12 // 100)))
    return ImageChops.add(im, warm)


def grade(im, sat=0.72, contrast=1.10, shadow_pull=0.30):
    """Desaturate a touch, deepen, then pull the shadows toward page black.
    The warmth comes from the light, never from a filter over everything."""
    im = ImageEnhance.Color(im).enhance(sat)
    im = ImageEnhance.Contrast(im).enhance(contrast)
    if shadow_pull:
        w, h = im.size
        shade = im.convert("L").point(lambda v: int(255 * (1 - (v / 255) ** 0.55)))
        im = Image.composite(Image.blend(im, Image.new("RGB", (w, h), INK), shadow_pull), im, shade)
    return im


def vignette(im, strength=0.62):
    w, h = im.size
    mask = Image.new("L", (w, h), 0)
    ImageDraw.Draw(mask).ellipse([-w * 0.16, -h * 0.24, w * 1.16, h * 1.24], fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(min(w, h) * 0.20))
    return Image.composite(im, Image.blend(im, Image.new("RGB", (w, h), (0, 0, 0)), strength), mask)


def caption_shade(im, start=0.44, power=1.8, depth=0.90):
    w, h = im.size
    col = Image.new("L", (1, h))
    for i in range(h):
        t = i / (h - 1)
        col.putpixel((0, i), 0 if t < start else int(255 * depth * ((t - start) / (1 - start)) ** power))
    return Image.composite(Image.new("RGB", (w, h), (4, 3, 3)), im, col.resize((w, h)))


def add_grain(im, sigma=10, amount=0.30):
    n = Image.effect_noise(im.size, sigma).convert("L").convert("RGB")
    return Image.blend(im, ImageChops.overlay(im, n), amount)


def finish(im, shade=True):
    im = vignette(im)
    if shade:
        im = caption_shade(im)
    return add_grain(im)


def load_font(size):
    for c in FONT_CANDIDATES:
        if os.path.exists(c):
            return ImageFont.truetype(c, size)
    return None


# --------------------------------------------------------------- plate types
def full_bleed(art):
    im = grade(cover(art, (W, H)), 0.78, 1.08, 0.22)
    im = warm_light(im, 0.16, 0.06, 0.55, 0.34)
    return finish(im)


def poster_plate(art):
    """Portrait / square artwork on a bed of its own colours, pushed almost to
    black so the artwork is the only lit thing in the frame."""
    bed = cover(art, (W, H)).filter(ImageFilter.GaussianBlur(38))
    bed = ImageEnhance.Color(bed).enhance(0.42)
    bed = ImageEnhance.Brightness(bed).enhance(0.24)
    bed = Image.blend(bed, Image.new("RGB", (W, H), INK), 0.42)
    bed = warm_light(bed, 0.5, 1.06, 0.62, 0.34)

    # Keep the artwork clear of the bottom third: that band belongs to the
    # card's title and it has to stay readable over every plate.
    aw, ah = art.size
    s = min(H * 0.58 / ah, W * 0.60 / aw, 2.2)
    nw, nh = max(1, round(aw * s)), max(1, round(ah * s))
    art = grade(art.resize((nw, nh), Image.LANCZOS), 0.88, 1.04, 0.06)

    x, y = (W - nw) // 2, int((H - nh) * 0.20)

    sh = Image.new("L", (W, H), 0)
    ImageDraw.Draw(sh).rectangle([x, y, x + nw, y + nh], fill=225)
    sh = sh.filter(ImageFilter.GaussianBlur(30))
    bed = Image.composite(Image.blend(bed, Image.new("RGB", (W, H), (0, 0, 0)), 0.62), bed, sh)

    bed.paste(art, (x, y))
    ImageDraw.Draw(bed, "RGBA").rectangle(
        [x, y, x + nw - 1, y + nh - 1], outline=(255, 165, 80, 70), width=1)
    return finish(bed)


def slate(mark):
    """For work whose imagery the client has not sent yet: a black plate, one
    light on the floor, an outlined monogram, film perforations. Reads as a
    designed card, and swaps for a photograph in one line."""
    im = Image.new("RGB", (W, H), (8, 7, 6))
    im = warm_light(im, 0.50, 1.10, 0.72, 0.40, gamma=2.8)
    im = warm_light(im, 0.14, -0.04, 0.44, 0.16, gamma=3.0)

    # Outline-only monogram. PIL will not honour a zero-alpha fill, so the
    # glyph is rasterised to a mask, dilated, and the solid core subtracted -
    # what is left is a true hairline outline that can be laid in faintly.
    f = load_font(int(H * 0.34))
    if f:
        txt = mark[:2].upper()
        solid = Image.new("L", (W, H), 0)
        sd = ImageDraw.Draw(solid)
        bb = sd.textbbox((0, 0), txt, font=f)
        sd.text(((W - (bb[2] - bb[0])) / 2 - bb[0], (H - (bb[3] - bb[1])) / 2 - bb[1] - H * 0.05),
                txt, font=f, fill=255)
        outline = ImageChops.subtract(solid.filter(ImageFilter.MaxFilter(5)), solid)
        outline = outline.point(lambda v: v * 46 // 100)
        im.paste(Image.new("RGB", (W, H), (255, 158, 78)), (0, 0), outline)

    d = ImageDraw.Draw(im, "RGBA")
    d.rectangle([38, 32, W - 39, H - 33], outline=(255, 160, 70, 26), width=1)
    for i in range(9):
        x = 78 + i * ((W - 156) / 8)
        d.rectangle([x - 10, 14, x + 10, 24], fill=(255, 160, 70, 26))
        d.rectangle([x - 10, H - 25, x + 10, H - 15], fill=(255, 160, 70, 26))
    return finish(im)


# ------------------------------------------------------------------ manifest
# The filenames the extractor produced are shifted and misleading - every one
# of these was opened and identified by eye before being mapped, and the plate
# treatment is chosen per image rather than guessed from the aspect ratio.
PROJECTS = [
    ("marvel-audible", "film_predatorz.jpeg",                     "bleed"),   # event photo 1200x630
    ("la-vaste",       "film_marvel_audible_event.jpeg",          "bleed"),   # La Vaste still
    ("tadka",          "film_martin_teaser.jpeg",                 "poster"),  # Tadka key art
    ("opa-bites",      "glam_gram_event_poster.jpeg",             "poster"),  # Opa! Bites & Bottles
    ("opa-gamenight",  "opa_bar_menu_grid.jpeg",                  "poster"),  # Opa! Game Night / Sidhu Moosewala
    ("martin",         "film_tadka_music_video.jpeg",             "poster"),  # Martin poster
    ("predator-z",     "film_lavaste.jpeg",                       "poster"),  # Predator Z poster
    ("perfect-woman",  "film_perfect_woman_manisha_koirala.jpeg", "poster"),  # magazine cover
    ("glam-gram",      "travel_hotel_package_promo.jpeg",         "poster"),  # Glam & Gram poster
    ("qilin-global",   "website_qilin_global.jpeg",               "poster"),  # site screenshot
    ("ans-weddings",   "website_ans_weddings.jpeg",               "poster"),  # site screenshot
]

SLATES = [("maarrich", "MA"), ("lodha", "LO"), ("aerobott", "AE"),
          ("zouq", "ZQ"), ("khoonta", "KH")]

SERVICE_THUMBS = [
    ("sv-01", "pf-monitors"),      # digital marketing
    ("sv-02", "pf-camera"),        # design & creative
    ("sv-03", "pf-spotlight"),     # video production & vfx
    ("sv-04", "pf-laptop"),        # performance marketing
    ("sv-05", "sv-desk-wide"),     # social media
    ("sv-06", "sv-photowall"),     # pr & branding
    ("sv-07", "pf-workstation"),   # web & tech
    ("sv-08", "sv-desk-props"),    # strategy & consulting
]


def build_projects():
    for pid, fn, mode in PROJECTS:
        p = os.path.join(REAL, fn)
        if not os.path.exists(p):
            print("  MISSING", pid, fn); continue
        art = Image.open(p); art.load(); art = art.convert("RGB")
        aw, ah = art.size
        ar = aw / ah
        im = full_bleed(art) if mode == "bleed" else poster_plate(art)
        im.save(os.path.join(OUT, pid + ".webp"), "WEBP", quality=82, method=6)
        print(f"  {mode:6s} {pid:16s} {aw}x{ah}  ar={ar:.2f}")


def build_slates():
    for pid, mark in SLATES:
        slate(mark).save(os.path.join(OUT, pid + ".webp"), "WEBP", quality=82, method=6)
        print(f"  slate  {pid}")


def build_service_thumbs():
    SZ = 860
    for out_id, src_id in SERVICE_THUMBS:
        p = os.path.join(IMG, src_id + ".webp")
        if not os.path.exists(p):
            print("  MISSING", out_id, src_id); continue
        art = Image.open(p).convert("RGBA")

        base = Image.new("RGB", (SZ, SZ), (9, 8, 7))
        base = warm_light(base, 0.50, 1.06, 0.62, 0.46, gamma=2.6)
        base = warm_light(base, 0.16, 0.02, 0.40, 0.14, gamma=3.0)

        aw, ah = art.size
        s = min(SZ * 0.90 / aw, SZ * 0.84 / ah)
        art = art.resize((max(1, round(aw * s)), max(1, round(ah * s))), Image.LANCZOS)
        x, y = (SZ - art.size[0]) // 2, int(SZ * 0.955) - art.size[1]
        base.paste(art, (x, max(0, y)), art)

        base = vignette(base, 0.50)
        base = add_grain(base, 9, 0.22)
        base.save(os.path.join(IMG, out_id + ".webp"), "WEBP", quality=84, method=6)
        print(f"  thumb  {out_id} <- {src_id}")


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    print("work plates:");    build_projects()
    print("slates:");         build_slates()
    print("service thumbs:"); build_service_thumbs()
