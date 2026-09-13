"""Source distinct artwork for every portfolio project.

Three things were wrong with the previous set, and all three are addressed here.

  Duplicates.  Only StockSnap was searched, and it is a small library, so three
               film projects shared one photograph of a RED camera and six
               projects fell back to blank in-house placeholders. The pool is
               now StockSnap, then Rawpixel, then Flickr's half a billion
               CC images, and every chosen file is checked against every file
               already chosen this run.

  Relevance.   Queries asked for abstractions the caption index does not carry,
               so a pharma brand got a picnic drink and a hospitality site got
               a bunch of flowers. Every query below is a concrete noun phrase
               describing something a photographer actually points a camera at,
               tied to what the project is.

  Coherence.   Bright white desk flatlays and green lawns sat next to a very
               dark amber page and looked like clip art. Every picture now goes
               through one grade -- an S-curve, a shadow-to-highlight duotone
               blended over the original colour, a vignette and a little grain
               -- so twenty-seven unrelated photographs read as one body of
               work in the studio's own light.

Attribution for every file is recorded in licenses/portfolio-art.json so the
credits stay with the build.

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

import numpy as np

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
# Curated stock first, then the deep pool. Order is also a scoring bonus.
SOURCES = ("stocksnap", "rawpixel", "flickr")
# A card stands for a client's work, so it must not show a recognisable person
# who had nothing to do with it, and it must not be a scan of a painting.
BANNED = ("celebrity", "actor", "actress", "premiere", "obama", "nude", "portrait of",
          "painting", "engraving", "lithograph", "illustration", "clip art", "png",
          "map of", "coat of arms", "diagram", "chart of", "logo", "poster for")

# Concrete noun phrases, tied to what each project actually is. Abstractions
# ("brand identity design") return whatever the index feels like.
QUERIES = {
    # 01 BRAND & GRAPHIC DESIGN
    "zouq": ["spice market stall", "spices market", "spice shop"],
    "aerobott": ["drone flying sky", "quadcopter drone", "drone"],
    "bliss": ["hair salon interior", "barber shop", "beauty salon", "hairdresser", "salon"],
    "chemist-king": ["pharmacy shelves", "pharmacy interior", "apothecary bottles", "medicine bottles", "pharmacy"],
    "hexagon": ["dubai skyline night", "skyscraper night", "skyline night"],
    "dom": ["film clapperboard", "film set", "cinematography", "film production", "movie camera"],

    # 02 WEB DESIGN & TECH
    "sonali-jain": ["boutique clothing rack", "fashion boutique", "clothing rack"],
    "ditas": ["restaurant interior night", "cafe interior warm", "restaurant table"],
    "rosa": ["building under construction", "construction site", "construction crane", "scaffolding", "construction"],
    "home-mentors": ["apartment building night", "residential tower", "building windows"],

    # 03 FILM, MUSIC & VFX
    "maarrich": ["film crew camera", "movie camera", "cinema camera", "film crew", "camera operator"],
    "lavaste": ["film reel", "movie film strip", "cinema projector", "projector", "film negative"],
    "martin": ["cinema seats", "movie theatre screen", "cinema hall"],
    "jay": ["recording studio microphone", "music studio console", "recording studio"],
    "vrindavan": ["concert crowd lights", "music festival", "live band stage", "audience crowd", "concert"],
    "maa-thi": ["singer microphone stage", "singer stage", "microphone stage", "vocalist", "singer"],
    "online-247": ["green screen studio", "television studio", "film studio", "studio lighting", "video production"],
    "onyx": ["solar panels sunset", "solar farm", "solar panel"],

    # 04 PERFORMANCE & DIGITAL ADS
    "lodha": ["residential towers night", "apartment building", "residential building", "high rise building", "tower block"],
    "sunblond": ["billboard night", "neon billboard", "billboard advertising"],
    "hdfc-sky": ["stock chart", "trading floor", "financial screen", "stock market", "stock exchange"],
    "capswise": ["coins stack", "bank interior", "money coins", "calculator finance", "coins"],

    # 05 SOCIAL MEDIA & CONTENT
    "mini": ["camera tripod studio", "video camera", "photographer studio", "camera lens", "camera tripod"],
    "shaz": ["car headlights", "classic car", "vintage car", "car show", "car"],
    "manerva": ["event stage lights", "stage lights", "festival lights", "party lights", "event"],

    # 06 PR & INFLUENCER
    "khoonta": ["press conference microphones", "newspaper stack", "newspapers"],
    "namish-taneja": ["podcast microphone studio", "broadcast microphone", "studio microphone"],
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
            time.sleep(1.2 * (attempt + 1))
    raise last


def search(query, source):
    params = {
        "q": query,
        # Public domain and plain attribution only: the build crops, resizes and
        # grades every picture, which NoDerivatives licences forbid, and
        # ShareAlike would pull the whole page into its terms.
        "license": "cc0,pdm,by",
        # Photographs only. Without this the pool is mostly clip art and PNG
        # illustrations, which is where the vector "microphone png" came from.
        "category": "photograph",
        "extension": "jpg",
        "size": "large",
        "page_size": 20,
        "mature": "false",
        "source": source,
    }
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


# The studio's light, as three points on a ramp from deepest shadow to
# brightest highlight. Everything in the portfolio is lit by this.
SHADOW = np.array([0.043, 0.036, 0.028])   # #0b0907, the page itself
MIDS = np.array([0.40, 0.25, 0.115])       # warm brown
HIGH = np.array([1.00, 0.855, 0.66])       # #ffd9a8, the studio pin


def grade(image):
    """One cinematic grade for the whole portfolio.

    The source photographs come from twenty-seven unrelated places and were shot
    in every kind of light. Left alone they read as a folder of stock. Put
    through the same S-curve, the same warm duotone (blended over, not replacing,
    the original colour so a red car is still red), the same vignette and the
    same grain, they read as one shoot.
    """
    rgb = np.asarray(image, dtype=np.float32) / 255.0
    height, width = rgb.shape[:2]

    # Pull the original back from full saturation before anything else, or the
    # duotone fights whatever colour the photographer happened to have.
    luma = rgb @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
    rgb = luma[..., None] * 0.28 + rgb * 0.72

    # An S-curve: deepen the shadows, hold the highlights.
    tone = np.clip((luma - 0.46) * 1.22 + 0.47, 0.0, 1.0)

    lower = tone < 0.5
    ramp = np.where(
        lower[..., None],
        SHADOW + (MIDS - SHADOW) * (tone[..., None] / 0.5),
        MIDS + (HIGH - MIDS) * ((tone[..., None] - 0.5) / 0.5),
    )
    out = rgb * 0.44 + ramp * 0.56

    # A vignette, so the card has a centre and the rail's edges stay quiet.
    ys, xs = np.mgrid[0:height, 0:width]
    radius = np.sqrt(((xs / width - 0.5) / 0.62) ** 2 + ((ys / height - 0.5) / 0.62) ** 2)
    out *= np.clip(1.04 - 0.34 * radius ** 2.0, 0, 1)[..., None]

    # Grain, fixed seed so a rebuild does not reshuffle every thumbnail.
    noise = np.random.default_rng(7).normal(0, 0.016, (height, width, 1)).astype(np.float32)
    out = np.clip(out + noise, 0, 1)

    from PIL import Image
    return Image.fromarray((out * 255).round().astype("uint8"), "RGB")


def appeal(image):
    """How well a photograph will survive the grade.

    A blown-out white flatlay turns to porridge; something with real range and a
    clear subject keeps its shape. Prefer mid-to-dark frames with contrast.
    """
    small = np.asarray(image.resize((96, 54)), dtype=np.float32) / 255.0
    luma = small @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
    mean, spread = float(luma.mean()), float(luma.std())
    # Peak preference around a mid-dark frame, falling off either side.
    exposure = 1.0 - min(abs(mean - 0.38) / 0.38, 1.0)
    contrast = min(spread / 0.22, 1.0)
    return exposure * 0.55 + contrast * 0.45


def build(project_id, queries, taken, used_sources=()):
    from PIL import Image

    # Openverse ranks loosely, so "recording studio" can return a barn dance.
    # Candidates are scored on how much of the query the caption actually uses,
    # and anything sharing no word with the query is kept only as a fallback.
    scored = []
    for rank, source in enumerate(SOURCES):
        for query in queries:
            words = [w for w in query.lower().split() if len(w) > 2]
            for candidate in search(query, source):
                title = (candidate.get("title") or "").lower()
                if any(word in title for word in BANNED):
                    continue
                pixels = (candidate.get("width") or 0) * (candidate.get("height") or 0)
                size_bonus = min(pixels / 40_000_000, 0.4)
                hits = sum(1 for word in words if word in title)
                if not hits:
                    continue
                scored.append((hits * 1.4 + (len(SOURCES) - rank) * 0.5 + size_bonus, candidate))
    scored.sort(key=lambda pair: -pair[0])

    # Download the best handful, then pick on how they actually look rather than
    # on how they were captioned.
    shortlist = []
    for _, candidate in scored[:16]:
        url = candidate.get("url")
        landing = candidate.get("foreign_landing_url") or url
        if not url or landing in used_sources:
            continue
        try:
            raw = _get(url, retries=2)
            image = Image.open(io.BytesIO(raw)).convert("RGB")
        except Exception:                               # unreachable or undecodable
            continue
        if min(image.size) < 700:                       # too small for the largest width
            continue
        digest = hashlib.sha256(raw).hexdigest()
        if digest in taken:                             # already used by another project
            continue
        shortlist.append((appeal(image), digest, image, candidate))
        if len(shortlist) >= 6:
            break
    if not shortlist:
        print(f"   {project_id}: nothing usable")
        return None

    shortlist.sort(key=lambda row: -row[0])
    score, digest, image, candidate = shortlist[0]
    taken.add(digest)

    art = grade(crop(image))
    variants = []
    for width in WIDTHS:
        height = round(width / RATIO)
        name = f"project-{project_id}-{width}.webp"
        art.resize((width, height), Image.LANCZOS).save(ASSETS / name, "WEBP", quality=84, method=6)
        variants.append({"src": f"portfolio-assets/{name}", "width": width, "height": height,
                         "bytes": (ASSETS / name).stat().st_size})
    print(f"   {project_id}: {candidate.get('title','?')[:44]} "
          f"[{candidate.get('provider')}/{candidate.get('license')}] appeal {score:.2f}")
    return variants, {
        "project": project_id,
        "title": candidate.get("title"),
        "creator": candidate.get("creator"),
        "license": f"{candidate.get('license')} {candidate.get('license_version') or ''}".strip(),
        "source": candidate.get("foreign_landing_url") or candidate.get("url"),
        "provider": candidate.get("provider"),
        "graded": True,
    }


def main():
    wanted = sys.argv[1:] or list(QUERIES)
    assets_path = SRC / "assets.json"
    assets = json.loads(assets_path.read_text("utf8"))
    credits_path = ROOT / "licenses/portfolio-art.json"
    credits = json.loads(credits_path.read_text("utf8")) if credits_path.exists() else {}

    taken = set()
    used_sources = {c.get("source") for pid, c in credits.items()
                    if pid not in wanted and c.get("source")}
    for project_id in wanted:
        queries = QUERIES.get(project_id)
        if not queries:
            print(f"   {project_id}: no query defined")
            continue
        result = build(project_id, queries, taken, used_sources)
        if not result:
            continue
        variants, credit = result
        assets[f"project-{project_id}"] = variants
        credits[project_id] = credit
        if credit.get("source"):
            used_sources.add(credit["source"])

    assets_path.write_text(json.dumps(assets, indent=1, ensure_ascii=False) + "\n", "utf8")
    credits_path.write_text(json.dumps(credits, indent=1, ensure_ascii=False) + "\n", "utf8")
    print(f"Wrote {len(taken)} distinct graded thumbnails.")


if __name__ == "__main__":
    main()
