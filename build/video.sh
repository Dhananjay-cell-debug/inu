#!/bin/sh
# Cinematic overlays: the film-grain loop and the film-burn page transitions.
# Both are meant to be blended with mix-blend-mode: screen over the page, so
# they stay on pure black and carry no audio.
set -e
SRC="F:/INU media/chatgpt inu design/cinematic feels"
OUT="F:/INU media/inu-cinematic/site/assets/video"
mkdir -p "$OUT"

GRAIN="$SRC/grainy old film overlay ;).mp4"
BURN="$SRC/Level Up Your Videos with 4K Film Burn Transition Sounds.mp4"

# --- grain: seamless-ish loop, silent, deliberately low bitrate (it is noise)
ffmpeg -y -v error -i "$GRAIN" -an -t 18.7 \
  -vf "scale=720:540,eq=contrast=1.12:brightness=-0.02" \
  -c:v libx264 -preset veryslow -crf 34 -pix_fmt yuv420p -movflags +faststart \
  "$OUT/grain.mp4"

ffmpeg -y -v error -i "$GRAIN" -an -t 18.7 \
  -vf "scale=720:540,eq=contrast=1.12:brightness=-0.02" \
  -c:v libvpx-vp9 -crf 46 -b:v 0 -deadline good -cpu-used 3 \
  "$OUT/grain.webm"

# --- burns: one per page, chosen by shape rather than at random.
#     a  long slow bloom      -> about      (the page that breathes)
#     b  brightest full flash -> services   (the loudest page)
#     c  hard fast strike     -> portfolio  (a cut, like a reel change)
#     d  soft double lick     -> contact    (a warm close)
#     e  mid roll-through     -> home
burn () { # name start duration
  ffmpeg -y -v error -ss "$2" -t "$3" -i "$BURN" -an \
    -vf "scale=1280:720,eq=contrast=1.05" \
    -c:v libx264 -preset veryslow -crf 26 -pix_fmt yuv420p -movflags +faststart \
    "$OUT/burn-$1.mp4"
}
burn a 13.30 1.45
burn b  9.72 1.15
burn c  0.34 1.05
burn d  5.52 1.20
burn e  3.12 1.05

ls -la "$OUT"
