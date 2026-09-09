"""Turn the 4K design packs into web assets.

Cutouts keep their alpha and are trimmed to their real bounding box.
Backgrounds are the full-page architectural plates: they get sliced into
per-section bands (with overlap, so the curved cuts interlock).
"""
import os, sys, json
from PIL import Image, ImageFile, ImageFilter
ImageFile.LOAD_TRUNCATED_IMAGES = True

SRC = r"F:\INU media\chatgpt inu design\INU_Media_6_Pages_4K"
OUT = r"F:\INU media\inu-cinematic\site\assets\img"

S = lambda *p: os.path.join(SRC, *p)
ABOUT = lambda f: S("about", "INU_About_Page_4K_Assets", f)
HOME = lambda f: S("home", "INU_Media_Home_4K_Assets", f)
PORT = lambda f: S("portfolio", "INU_Portfolio_4K_Assets", f)
CONT = lambda f: S("contact", "inu_contact_page_assets_4k", f)
SERV = lambda f: S("services", "services asset", f)
SERV4 = lambda f: S("services", "services asset", "4K Upscaled", f)

G = "ChatGPT Image Sep 8, 2026, 08_20_51 AM (%s).png"

# ---------------------------------------------------------------- cutouts
# name -> (source, target height in px)
CUTOUTS = {
    # about
    "ab-hero-figure":     (ABOUT("02_hero_maskman_4K.png"), 1500),
    "ab-seated":          (ABOUT("03_seated_maskman_armchair_4K.png"), 1300),
    "ab-table":           (ABOUT("04_coffee_table_props_4K.png"), 900),
    "ab-walking":         (ABOUT("05_walking_businessman_4K.png"), 1200),
    "ab-team-center":     (ABOUT("06_central_maskman_laptop_4K.png"), 1500),
    "ab-team-left":       (ABOUT("07_left_maskman_laptop_4K.png"), 1300),
    "ab-team-right":      (ABOUT("08_right_maskman_laptop_4K.png"), 1300),
    "ab-presenter":       (ABOUT("09_presenter_maskman_4K.png"), 1400),
    "ab-lamp":            (ABOUT("10_amber_globe_lamp_4K.png"), 1100),
    # home
    "hm-center":          (HOME("02_hero_center_maskman_4K.png"), 1600),
    "hm-left":            (HOME("03_hero_left_maskman_laptop_4K.png"), 1400),
    "hm-right":           (HOME("04_hero_right_maskman_laptop_4K.png"), 1400),
    "hm-window":          (HOME("05_window_maskman_backview_4K.png"), 1400),
    "hm-lounge":          (HOME("06_lounge_maskman_chair_4K.png"), 1200),
    "hm-team":            (HOME("07_team_maskmen_meeting_4K.png"), 1200),
    "hm-desk":            (HOME("08_curved_desk_4K.png"), 900),
    "hm-stair":           (HOME("09_neon_staircase_4K.png"), 1000),
    "hm-tree":            (HOME("10_amber_tree_4K.png"), 1200),
    # portfolio
    "pf-director":        (PORT("02_director_chair_person_4K.png"), 1500),
    "pf-workstation":     (PORT("03_hero_workstation_desk_4K.png"), 1100),
    "pf-monitors":        (PORT("04_monitor_wall_4K.png"), 1300),
    "pf-pendant":         (PORT("05_pendant_lamp_4K.png"), 1100),
    "pf-laptop":          (PORT("06_laptop_setup_4K.png"), 1000),
    "pf-camera":          (PORT("07_camera_desk_props_4K.png"), 1000),
    "pf-spotlight":       (PORT("08_studio_spotlight_monitor_chair_4K.png"), 1300),
    "pf-filmstrip":       (PORT("09_filmstrip_collage_4K.png"), 1500),
    "pf-banner":          (PORT("10_banner_curtain_4K.png"), 1400),
    # contact
    "ct-seated":          (CONT("02_masked_man_in_a_leather_armchair.png"), 1500),
    "ct-standing":        (CONT("04_masked_man_in_black_suit_silhouette.png"), 1500),
    "ct-backlit":         (CONT("05_backlit_man_in_formal_suit.png"), 1500),
    "ct-agent":           (CONT("06_mysterious_masked_suit_agent.png"), 1500),
    "ct-chair":           (CONT("07_luxurious_black_leather_lounge_chair.png"), 1000),
    "ct-whiskey":         (CONT("08_luxury_amber_whiskey_tabletop.png"), 900),
    "ct-tree":            (CONT("09_glowing_amber_lit_indoor_tree_in_cube_planter.png"), 1300),
    # services
    "sv-smoker":          (SERV4(G % 2), 1600),
    "sv-desk-wide":       (SERV4(G % 3), 1200),
    "sv-photowall":       (SERV4(G % 4), 1300),
    "sv-chair":           (SERV4(G % 5), 1200),
    "sv-plant":           (SERV4(G % 6), 1200),
    "sv-spot":            (SERV4(G % 7), 1200),
    "sv-backview":        (SERV4(G % 8), 1600),
    "sv-desk-props":      (SERV4(G % 9), 1200),
    "sv-window":          (SERV4(G % 10), 900),
}

# ------------------------------------------------------------ backgrounds
# name -> (source, (top, bottom) as fractions of image height)
BACKDROPS = {
    # about — one continuous building, sliced per section
    "ab-bg-hero":    (ABOUT("01_full_background_4K.png"), (0.000, 0.150)),
    "ab-bg-philo":   (ABOUT("01_full_background_4K.png"), (0.130, 0.300)),
    "ab-bg-story":   (ABOUT("01_full_background_4K.png"), (0.280, 0.420)),
    "ab-bg-team":    (ABOUT("01_full_background_4K.png"), (0.395, 0.560)),
    "ab-bg-values":  (ABOUT("01_full_background_4K.png"), (0.540, 0.690)),
    "ab-bg-process": (ABOUT("01_full_background_4K.png"), (0.660, 0.820)),
    "ab-bg-cta":     (ABOUT("01_full_background_4K.png"), (0.800, 1.000)),
    # services
    "sv-bg-hero":    (SERV4("ChatGPT Image Sep 8, 2026, 02_37_53 PM - 4K.png"), (0.000, 0.180)),
    "sv-bg-grid":    (SERV4("ChatGPT Image Sep 8, 2026, 02_37_53 PM - 4K.png"), (0.150, 0.480)),
    "sv-bg-approach":(SERV4("ChatGPT Image Sep 8, 2026, 02_37_53 PM - 4K.png"), (0.440, 0.660)),
    "sv-bg-process": (SERV4("ChatGPT Image Sep 8, 2026, 02_37_53 PM - 4K.png"), (0.620, 0.800)),
    "sv-bg-cta":     (SERV4("ChatGPT Image Sep 8, 2026, 02_37_53 PM - 4K.png"), (0.780, 1.000)),
    # portfolio — grungy stage wall
    "pf-bg-hero":    (PORT("01_full_background_4K.png"), (0.000, 0.240)),
    "pf-bg-grid":    (PORT("01_full_background_4K.png"), (0.220, 0.520)),
    "pf-bg-stats":   (PORT("01_full_background_4K.png"), (0.480, 0.700)),
    "pf-bg-clients": (PORT("01_full_background_4K.png"), (0.660, 0.840)),
    "pf-bg-cta":     (PORT("01_full_background_4K.png"), (0.800, 1.000)),
    # contact
    "ct-bg-hero":    (CONT("01_futuristic_amberlit_city_atrium.png"), (0.000, 0.230)),
    "ct-bg-form":    (CONT("01_futuristic_amberlit_city_atrium.png"), (0.200, 0.480)),
    "ct-bg-reach":   (CONT("01_futuristic_amberlit_city_atrium.png"), (0.440, 0.740)),
    "ct-bg-cta":     (CONT("01_futuristic_amberlit_city_atrium.png"), (0.700, 1.000)),
    # home
    "hm-bg-hero":    (HOME("01_background_architecture_4K.png"), (0.000, 0.260)),
    "hm-bg-mid":     (HOME("01_background_architecture_4K.png"), (0.240, 0.560)),
    "hm-bg-low":     (HOME("01_background_architecture_4K.png"), (0.520, 0.800)),
    "hm-bg-cta":     (HOME("01_background_architecture_4K.png"), (0.760, 1.000)),
}

BG_WIDTH = 1600


def save(im, name, quality, lossless=False):
    path = os.path.join(OUT, name + ".webp")
    im.save(path, "WEBP", quality=quality, method=6)
    return os.path.getsize(path)


def do_cutouts(report):
    for name, (src, target_h) in CUTOUTS.items():
        if not os.path.exists(src):
            report.append(("MISSING", name, src)); continue
        im = Image.open(src); im.load()
        if im.mode != "RGBA":
            im = im.convert("RGBA")
        bb = im.getchannel("A").getbbox()
        if bb:
            im = im.crop(bb)
        w, h = im.size
        if h > target_h:
            im = im.resize((max(1, round(w * target_h / h)), target_h), Image.LANCZOS)
        n = save(im, name, 80)
        report.append(("cutout", name, f"{im.size[0]}x{im.size[1]}", f"{n/1024:.0f}KB"))


def do_backdrops(report):
    cache = {}
    for name, (src, (t, b)) in BACKDROPS.items():
        if not os.path.exists(src):
            report.append(("MISSING", name, src)); continue
        if src not in cache:
            im = Image.open(src); im.load()
            cache[src] = im.convert("RGB")
        full = cache[src]
        W, H = full.size
        box = (0, int(round(t * H)), W, int(round(b * H)))
        im = full.crop(box)
        w, h = im.size
        if w != BG_WIDTH:
            im = im.resize((BG_WIDTH, max(1, round(h * BG_WIDTH / w))), Image.LANCZOS)
        n = save(im, name, 74)
        report.append(("bg", name, f"{im.size[0]}x{im.size[1]}", f"{n/1024:.0f}KB"))


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    report = []
    do_cutouts(report)
    do_backdrops(report)
    miss = [r for r in report if r[0] == "MISSING"]
    for r in report:
        print("  ".join(str(x) for x in r))
    total = sum(os.path.getsize(os.path.join(OUT, f)) for f in os.listdir(OUT) if f.endswith(".webp"))
    print(f"\n{len(report)-len(miss)} images, {total/1024/1024:.1f} MB total, {len(miss)} missing")
