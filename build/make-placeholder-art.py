"""Draw an on-brand 16:9 plate for a project that has no photograph yet.

The free Creative Commons catalogues are thin and rate-limited, and a wrong
photograph is worse than none — a masala brand shown as a bowl of spices tells
the visitor about spice, not about the design work. Rather than leave a hole or
ship something irrelevant, these projects get a deliberate plate in the site's
own palette, carrying the discipline's motif. Swap them for real project stills
whenever those exist.

Run: python build/make-placeholder-art.py <project-id> ...
"""
import json
import math
import pathlib
import sys

from PIL import Image, ImageDraw, ImageFilter

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "src/portfolio"
ASSETS = SRC / "assets"
WIDTHS = (480, 800, 1200)
RATIO = 16 / 9
INK = (243, 241, 235)
ORANGE = (255, 121, 10)

# One motif per discipline, drawn as line art rather than an icon dump.
MOTIFS = {
    "brand": "grid",        # a layout grid, the bones of an identity system
    "web": "window",        # a browser frame
    "film": "frame",        # a film frame with sprocket holes
    "performance": "chart",  # a rising plot
    "social": "feed",       # stacked cards
    "pr": "waves",          # broadcast arcs
}


def chapter_of(project, chapters):
    for chapter in chapters:
        if any(tag in chapter["tags"] for tag in project["tags"]):
            return chapter
    return chapters[0]


def plate(width, height, motif, seed):
    image = Image.new("RGB", (width, height), (9, 10, 9))
    draw = ImageDraw.Draw(image, "RGBA")

    # A warm bloom off-centre, the same move the page's fluid field makes.
    glow = Image.new("RGB", (width, height), (9, 10, 9))
    gd = ImageDraw.Draw(glow)
    cx, cy = width * (0.26 + 0.5 * ((seed % 7) / 7)), height * 0.32
    for step in range(28, 0, -1):
        radius = step / 28 * max(width, height) * 0.62
        tint = int(26 * (step / 28) ** 2)
        gd.ellipse([cx - radius, cy - radius * 0.72, cx + radius, cy + radius * 0.72],
                   fill=(9 + tint, 10 + int(tint * 0.42), 9))
    image = Image.blend(image, glow.filter(ImageFilter.GaussianBlur(width / 22)), 0.92)
    draw = ImageDraw.Draw(image, "RGBA")

    unit = height / 9
    line = max(1, round(width / 520))
    pale = (*INK, 34)
    accent = (*ORANGE, 150)

    if motif == "grid":
        for column in range(1, 7):
            x = width * column / 7
            draw.line([(x, unit * 1.1), (x, height - unit * 1.1)], fill=pale, width=line)
        for row in range(1, 4):
            y = height * row / 4
            draw.line([(unit * 0.9, y), (width - unit * 0.9, y)], fill=pale, width=line)
        draw.rectangle([width * 2 / 7, height / 4, width * 4 / 7, height / 2], outline=accent, width=line * 2)

    elif motif == "window":
        box = [unit * 1.2, unit * 1.2, width - unit * 1.2, height - unit * 1.2]
        draw.rectangle(box, outline=pale, width=line * 2)
        draw.line([(box[0], box[1] + unit * 0.95), (box[2], box[1] + unit * 0.95)], fill=pale, width=line)
        for dot in range(3):
            cxx = box[0] + unit * (0.45 + dot * 0.4)
            draw.ellipse([cxx - line * 2, box[1] + unit * 0.42, cxx + line * 2, box[1] + unit * 0.42 + line * 4],
                         fill=accent if dot == 0 else pale)
        for row in range(3):
            y = box[1] + unit * (1.9 + row * 1.1)
            draw.line([(box[0] + unit * 0.6, y), (box[0] + unit * (3.4 - row * 0.7), y)], fill=pale, width=line * 2)

    elif motif == "frame":
        box = [unit * 1.5, unit * 1.6, width - unit * 1.5, height - unit * 1.6]
        draw.rectangle(box, outline=pale, width=line * 2)
        for hole in range(9):
            x = box[0] + (box[2] - box[0]) * (hole + 0.5) / 9
            for y in (unit * 0.75, height - unit * 1.05):
                draw.rounded_rectangle([x - unit * 0.16, y - unit * 0.16, x + unit * 0.16, y + unit * 0.16],
                                       radius=line * 2, outline=pale, width=line)
        draw.polygon([(width / 2 - unit * 0.35, height / 2 - unit * 0.6),
                      (width / 2 + unit * 0.7, height / 2),
                      (width / 2 - unit * 0.35, height / 2 + unit * 0.6)], outline=accent, width=line * 2)

    elif motif == "chart":
        base = height - unit * 1.6
        draw.line([(unit * 1.2, base), (width - unit * 1.2, base)], fill=pale, width=line)
        points = []
        for i in range(7):
            x = unit * 1.2 + (width - unit * 2.4) * i / 6
            y = base - unit * (0.7 + 3.4 * (i / 6) ** 1.5 + 0.35 * math.sin(i * 1.7 + seed))
            points.append((x, y))
            draw.line([(x, base), (x, base - unit * 0.22)], fill=pale, width=line)
        draw.line(points, fill=accent, width=line * 2, joint="curve")
        for x, y in points:
            draw.ellipse([x - line * 2.4, y - line * 2.4, x + line * 2.4, y + line * 2.4], fill=accent)

    elif motif == "feed":
        for card in range(3):
            top = unit * (1.2 + card * 2.3)
            box = [unit * 1.4 + card * unit * 0.5, top, width - unit * 1.4 - card * unit * 0.5, top + unit * 1.8]
            if box[1] > height - unit:
                break
            draw.rounded_rectangle(box, radius=unit * 0.18, outline=accent if card == 0 else pale, width=line * 2)
            draw.ellipse([box[0] + unit * 0.4, box[1] + unit * 0.45, box[0] + unit * 1.3, box[1] + unit * 1.35],
                         outline=pale, width=line)
            draw.line([(box[0] + unit * 1.7, box[1] + unit * 0.8), (box[2] - unit * 0.6, box[1] + unit * 0.8)],
                      fill=pale, width=line)
            draw.line([(box[0] + unit * 1.7, box[1] + unit * 1.2), (box[2] - unit * 2.0, box[1] + unit * 1.2)],
                      fill=pale, width=line)

    else:  # waves
        ox, oy = width * 0.3, height * 0.58
        draw.ellipse([ox - unit * 0.3, oy - unit * 0.3, ox + unit * 0.3, oy + unit * 0.3], fill=accent)
        for ring in range(1, 5):
            radius = unit * ring * 1.15
            draw.arc([ox - radius, oy - radius, ox + radius, oy + radius], start=-62, end=62,
                     fill=(*ORANGE, max(30, 150 - ring * 28)), width=line * 2)
        draw.line([(ox, oy), (ox, oy - unit * 2.6)], fill=pale, width=line)

    # The same film grain the page wears, so a plate sits in the set.
    noise = Image.effect_noise((width, height), 14).convert("L").point(lambda v: int(v * 0.16))
    image = Image.composite(Image.new("RGB", (width, height), (255, 255, 255)), image, noise.point(lambda v: v // 6))
    return image


def main():
    content = json.loads((SRC / "content.json").read_text("utf8"))
    chapters = content["chapters"]
    by_id = {p["id"]: p for p in content["projects"]}
    assets = json.loads((SRC / "assets.json").read_text("utf8"))
    credits_file = ROOT / "licenses/portfolio-art.json"
    credits = json.loads(credits_file.read_text("utf8")) if credits_file.exists() else {}

    wanted = sys.argv[1:] or [p["id"] for p in content["projects"]]
    for index, project_id in enumerate(wanted):
        project = by_id[project_id]
        chapter = chapter_of(project, chapters)
        motif = MOTIFS.get(chapter["id"], "grid")
        variants = []
        for width in WIDTHS:
            height = round(width / RATIO)
            name = f"project-{project_id}-{width}.webp"
            plate(width, height, motif, index * 3 + 1).save(ASSETS / name, "WEBP", quality=88, method=6)
            variants.append({"src": f"portfolio-assets/{name}", "width": width, "height": height})
        assets[f"project-{project_id}"] = variants
        credits[project_id] = {"project": project_id, "title": f"INU plate — {chapter['label']}",
                               "creator": "INU Media", "license": "in-house",
                               "source": "build/make-placeholder-art.py", "placeholder": True}
        print(f"-> {project_id}: {motif} plate ({chapter['label']})")

    (SRC / "assets.json").write_text(json.dumps(assets, indent=1), "utf8")
    credits_file.write_text(json.dumps(credits, indent=1), "utf8")
    print(f"\n{len(wanted)} plates drawn")


if __name__ == "__main__":
    main()
