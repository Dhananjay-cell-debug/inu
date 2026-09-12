"""Source distinct artwork for every portfolio project.

The rails repeated the same handful of thumbnails because ten projects shared
a small set of renders. Each project now gets its own picture, searched on
Openverse (commercial-use Creative Commons only), cropped to the rail's 4:5
and written as webp at three widths. Attribution for every file is recorded in
licenses/portfolio-art.md so the credits stay with the build.

Run: python build/fetch-portfolio-art.py [project-id ...]
"""
import hashlib
import io
import json
import time
import sys as _sys
import pathlib
import sys
import urllib.parse
import urllib.request

# captions carry emoji and accents; the Windows console default cannot print them
try:
    _sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "src/portfolio"
ASSETS = SRC / "assets"
WIDTHS = (480, 800, 1200)
RATIO = 16 / 9  # the rails crop everything to one cinematic shape
UA = "INU-Media-Site/1.0 (portfolio artwork build)"
# A card stands for a client's work, so it must not show a recognisable person
# who had nothing to do with it.
BANNED = ("portrait", "celebrity", "actor", "actress", "premiere", "whedon", "obama",
          "wasp", "insect", "-site:", "wikipedia", "nude", "vintage", "beach", "3d printed", "latching")

# Search terms describe the work, not the client, so the picture reads as the
# discipline the chapter is about.
# Terms a curated stock library actually captions its photographs with. The
# picture has to read as the DISCIPLINE the chapter is about — a masala brand
# illustrated with a bowl of spices described the spice, not the design work.
# Curated stock captions things with concrete nouns, so that is what we ask
# for. Abstract phrases ("brand identity design") return whatever the index
# feels like — that is how a masala brand ended up as a bowl of spices and a
# pharma brand as a Funko Pop. Each term below was checked against the library.
QUERIES = {
    # 01 BRAND & GRAPHIC DESIGN
    "zouq": ["product still", "bottle product", "package box"],
    "aerobott": ["stationery desk", "notebook pen", "workspace desk"],
    "bliss": ["color swatches", "color palette", "colors"],
    "chemist-king": ["magazine print", "printing", "paper print"],
    "hexagon": ["sketch designer", "designer sketch", "drawing sketch"],

    # 02 WEB DESIGN & TECH
    "sonali-jain": ["online shopping", "shopping laptop", "ecommerce"],
    "ditas": ["web design", "website laptop", "laptop screen"],
    "rosa": ["wireframe sketch", "wireframe", "ux sketch"],
    "home-mentors": ["coding programming", "code coding", "coding"],

    # 03 FILM, MUSIC & VFX
    "maarrich": ["film crew", "movie camera", "camera man"],
    "lavaste": ["camera red", "film camera", "cinema camera"],
    "martin": ["cinema", "theater seats", "movie screen"],
    "jay": ["recording studio", "music studio", "sound studio"],
    "vrindavan": ["music concert", "concert crowd", "concert"],
    "maa-thi": ["camera flash", "studio light", "spotlight"],
    "online-247": ["camera video", "video camera", "film studio"],
    "onyx": ["abstract light", "neon abstract", "abstract"],
    "dom": ["video editing", "editing screen", "editor computer"],

    # 04 PERFORMANCE & DIGITAL ADS
    "lodha": ["analytics", "charts data", "data screen"],
    "sunblond": ["market graph", "graph chart", "statistics chart"],
    "hdfc-sky": ["mobile phone", "smartphone screen", "phone screen"],
    "capswise": ["calculator finance", "accounting", "finance"],
    "mini": ["camera tripod", "photographer camera", "camera"],
    "shaz": ["social media", "social phone", "instagram phone"],
    "manerva": ["festival crowd", "audience", "crowd people"],

    # 06 PR & INFLUENCER
    "khoonta": ["newspaper", "newspapers", "news print"],
    "namish-taneja": ["microphone music", "microphone", "podcast microphone"],
}


CACHE = ROOT / "build/.art-cache"


def _get(url, retries=4):
    """Openverse and the CDNs both drop connections on a long run, and a DNS
    blip should not throw away the whole batch."""
    last = None
    for attempt in range(retries):
        try:
            request = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(request, timeout=45) as response:
                return response.read()
        except Exception as error:
            last = error
            time.sleep(1.5 * (attempt + 1))
    raise last


def search(query, source=None):
    params = {
        "q": query,
        # Public domain and plain attribution only: the build crops and
        # resizes every picture, which NoDerivatives licences forbid, and
        # ShareAlike would pull the whole page into its terms.
        "license": "cc0,pdm,by",
        # Photographs only. Without this the pool is mostly clip art and PNG
        # illustrations, which is where the vector "microphone png" came from.
        "category": "photograph",
        "extension": "jpg",
        "page_size": 20,
        "mature": "false",
    }
    # Rawpixel is Openverse's actual stock-photography source. The general pool
    # is mostly snapshots, which is how a masala brand ended up illustrated by a
    # bowl of spices instead of by design work.
    if source:
        params["source"] = source
    url = "https://api.openverse.org/v1/images/?" + urllib.parse.urlencode(params)
    CACHE.mkdir(exist_ok=True)
    cached = CACHE / (hashlib.sha256(url.encode()).hexdigest()[:16] + ".json")
    if cached.exists():
        return json.loads(cached.read_text("utf8")).get("results", [])
    try:
        payload = json.loads(_get(url))
    except Exception as error:
        print(f"   search failed ({error}); continuing")
        return []
    cached.write_text(json.dumps(payload), "utf8")
    return payload.get("results", [])


def fetch(url):
    return _get(url, retries=2)


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

    # Openverse ranks loosely, so "recording studio" can return a barn dance.
    # Candidates are scored on how much of the query the caption actually uses,
    # and anything sharing no word with the query is discarded outright.
    scored = []
    for rank, source in enumerate(("stocksnap",)):
        for query in queries[:2]:
            words = [w for w in query.lower().split() if len(w) > 2]
            for candidate in search(query, source):
                title = (candidate.get("title") or "").lower()
                if any(word in title for word in BANNED):
                    continue
                hits = sum(1 for word in words if word in title)
                if not hits:
                    continue
                pixels = (candidate.get("width") or 0) * (candidate.get("height") or 0)
                scored.append((hits + (1 - rank) * 2 + min(pixels / 40_000_000, 0.4), candidate))
    scored.sort(key=lambda pair: -pair[0])
    # A loose pass keeps a project from ending up with no picture at all when
    # the caption wording simply does not match.
    loose = [c for q in queries for c in search(q, "stocksnap")
             if not any(w in (c.get("title") or "").lower() for w in BANNED)]

    for _, candidate in scored + [(0, c) for c in loose]:
        source = candidate.get("url")
        if not source:
            continue
        try:
            raw = fetch(source)
            image = Image.open(io.BytesIO(raw)).convert("RGB")
        except Exception as error:                      # unreachable or undecodable
            print(f"   skip {source[:60]}: {error}")
            continue
        if min(image.size) < 800:                       # too small for the largest width
            continue
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
            "provider": candidate.get("source"),
            "stock": True,
        }
    return None, None                                # reported by the caller


def main():
    wanted = sys.argv[1:] or list(QUERIES)
    assets = json.loads((SRC / "assets.json").read_text("utf8"))
    credits_file = ROOT / "licenses/portfolio-art.json"
    credits = json.loads(credits_file.read_text("utf8")) if credits_file.exists() else {}

    explicit = bool(sys.argv[1:])
    missing = []
    for project_id in wanted:
        if not explicit and all((ASSETS / f"project-{project_id}-{w}.webp").exists() for w in WIDTHS)                 and credits.get(project_id, {}).get("stock"):
            print(f"-- {project_id}: already illustrated")
            continue
        queries = QUERIES[project_id]
        print(f"-> {project_id}: {queries[0]}")
        variants, credit = build(project_id, queries)
        if not variants:
            print("   !! nothing usable found — left as is")
            missing.append(project_id)
            continue
        assets[f"project-{project_id}"] = variants
        credits[project_id] = credit
        print(f"   {credit['title'][:48]} — {credit['license']}")

    (SRC / "assets.json").write_text(json.dumps(assets, indent=1), "utf8")
    credits_file.parent.mkdir(exist_ok=True)
    credits_file.write_text(json.dumps(credits, indent=1), "utf8")
    print(f"\n{len(wanted)} projects illustrated; credits in {credits_file.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
