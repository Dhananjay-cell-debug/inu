"""Source distinct artwork for every portfolio project.

The rails repeated the same handful of thumbnails because ten projects shared
a small set of renders. Each project now gets its own picture, searched on
Openverse (commercial-use Creative Commons only), cropped to the rail's 4:5
and written as webp at three widths. Attribution for every file is recorded in
licenses/portfolio-art.md so the credits stay with the build.

Run: python build/fetch-portfolio-art.py [project-id ...]
"""
import io
import json
import pathlib
import sys
import urllib.parse
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "src/portfolio"
ASSETS = SRC / "assets"
WIDTHS = (320, 640, 900)
RATIO = 4 / 5  # the rails crop everything to a single portrait shape
UA = "INU-Media-Site/1.0 (portfolio artwork build)"
# A card stands for a client's work, so it must not show a recognisable person
# who had nothing to do with it.
BANNED = ("portrait", "celebrity", "actor", "actress", "premiere", "whedon", "obama",
          "wasp", "insect", "-site:", "wikipedia", "nude", "vintage", "beach", "3d printed", "latching")

# Search terms describe the work, not the client, so the picture reads as the
# discipline the chapter is about.
QUERIES = {
    "maarrich": ["cinema movie theatre screen", "movie theater seats", "cinema"],
    "lavaste": ["film set shooting crew", "movie camera set", "film camera"],
    "jay": ["recording studio microphone", "music studio", "microphone"],
    "vrindavan": ["indian classical dance", "dance performance stage", "dancer"],
    "maa-thi": ["concert stage lights", "live music concert", "stage lighting"],
    "martin": ["cinema screen dark auditorium", "film noir shadow light", "movie projector beam"],
    "online-247": ["green screen studio", "visual effects studio", "film studio lights"],
    "onyx": ["solar panel array field", "photovoltaic panels closeup", "solar farm"],
    "dom": ["film crew lighting rig set", "movie production spotlight studio", "studio softbox lighting"],
    "lodha": ["modern skyscraper apartments", "residential high rise", "skyscraper"],
    "sunblond": ["apartment building balconies", "housing development construction", "residential building facade"],
    "home-mentors": ["house model architecture", "property model house", "model house"],
    "hdfc-sky": ["stock market chart screen", "trading charts", "stock exchange"],
    "capswise": ["calculator financial documents", "accounting spreadsheet desk", "finance calculator"],
    "aerobott": ["drone flying sky", "quadcopter drone", "drone"],
    "zouq": ["spices bowls colourful", "turmeric chilli powder spice", "spice jars"],
    "bliss": ["hair salon styling", "beauty salon", "hairdresser"],
    "chemist-king": ["pharmacy shelves medicine", "pharmacy store", "pharmacy"],
    "sonali-jain": ["boutique clothing rack", "fashion boutique store", "clothing store"],
    "hexagon": ["dubai skyline towers", "business district skyline", "dubai"],
    "mini": ["smartphone content creator", "phone social media", "smartphone"],
    "shaz": ["car alloy wheel", "automotive wheel", "car wheel"],
    "khoonta": ["press conference microphones empty podium", "newspaper print press", "microphone podium"],
    "namish-taneja": ["camera lens collection", "dslr camera lenses", "photography equipment"],
    "ditas": ["restaurant interior table setting", "cafe interior", "restaurant food plating"],
    "rosa": ["building construction crane site", "architecture construction site", "construction crane"],
    "manerva": ["event stage conference hall", "conference audience hall", "event venue lights"],
}


def search(query):
    url = "https://api.openverse.org/v1/images/?" + urllib.parse.urlencode(
        {
            "q": query,
            # Public domain and plain attribution only: the build crops and
            # resizes every picture, which NoDerivatives licences forbid, and
            # ShareAlike would pull the whole page into its terms.
            "license": "cc0,pdm,by",
            "page_size": 12,
            "mature": "false",
        }
    )
    request = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(request, timeout=45) as response:
        return json.load(response).get("results", [])


def fetch(url):
    request = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(request, timeout=60) as response:
        return response.read()


def crop(image):
    """Centre-crop to the rail ratio, biased slightly above centre so faces
    and skylines survive the cut."""
    width, height = image.size
    if width / height > RATIO:
        new_width = int(height * RATIO)
        left = (width - new_width) // 2
        box = (left, 0, left + new_width, height)
    else:
        new_height = int(width / RATIO)
        top = int((height - new_height) * 0.38)
        box = (0, top, width, top + new_height)
    return image.crop(box)


def build(project_id, queries):
    from PIL import Image

    for candidate in (c for q in queries for c in search(q)):
        source = candidate.get("url")
        if not source:
            continue
        try:
            raw = fetch(source)
            image = Image.open(io.BytesIO(raw)).convert("RGB")
        except Exception as error:                      # unreachable or undecodable
            print(f"   skip {source[:60]}: {error}")
            continue
        if min(image.size) < 620:                       # too small for the largest width
            continue
        if any(word in (candidate.get("title") or "").lower() for word in BANNED):
            continue                                    # keeps named people off the cards
        image = crop(image)
        variants = []
        for width in WIDTHS:
            height = round(width / RATIO)
            resized = image.resize((width, height), Image.LANCZOS)
            name = f"project-{project_id}-{width}.webp"
            resized.save(ASSETS / name, "WEBP", quality=82, method=6)
            variants.append({"src": f"portfolio-assets/{name}", "width": width, "height": height})
        return variants, {
            "project": project_id,
            "title": candidate.get("title") or "Untitled",
            "creator": candidate.get("creator") or "Unknown",
            "license": f"{candidate.get('license', '')} {candidate.get('license_version', '')}".strip(),
            "source": candidate.get("foreign_landing_url") or source,
        }
    raise SystemExit(f"No usable image found for {project_id} ({queries})")


def main():
    wanted = sys.argv[1:] or list(QUERIES)
    assets = json.loads((SRC / "assets.json").read_text("utf8"))
    credits_file = ROOT / "licenses/portfolio-art.json"
    credits = json.loads(credits_file.read_text("utf8")) if credits_file.exists() else {}

    for project_id in wanted:
        queries = QUERIES[project_id]
        print(f"-> {project_id}: {queries[0]}")
        variants, credit = build(project_id, queries)
        assets[f"project-{project_id}"] = variants
        credits[project_id] = credit
        print(f"   {credit['title'][:48]} — {credit['license']}")

    (SRC / "assets.json").write_text(json.dumps(assets, indent=1), "utf8")
    credits_file.parent.mkdir(exist_ok=True)
    credits_file.write_text(json.dumps(credits, indent=1), "utf8")
    print(f"\n{len(wanted)} projects illustrated; credits in {credits_file.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
