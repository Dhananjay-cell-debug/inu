"""Select a distinct film burn for the Let's talk opening.

The home page uses the burn at 1.6s in the supplied compilation. This page opens on a
wide window, so it uses the lateral bloom at 25.85s instead, slowed slightly so the
warm burst reads as an arrival rather than a cut. Output lands in the shared media
folder both page builds copy to dist/media. Originals stay untouched.
"""
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT.parent / 'chatgpt inu design/cinematic feels'
OUT = ROOT / 'src/home/media'
burn = SOURCE / 'Level Up Your Videos with 4K Film Burn Transition Sounds.mp4'


def ff(*args):
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', *map(str, args)], check=True)


ff('-ss', '25.85', '-i', burn, '-t', '1.45', '-an',
   '-vf', 'setpts=1.18*PTS,scale=960:-2,fps=24,fade=t=in:d=0.18,fade=t=out:st=1.18:d=0.5',
   '-c:v', 'libvpx-vp9', '-crf', '36', '-b:v', '0', '-row-mt', '1', '-y', OUT / 'burn-talk.webm')
ff('-ss', '25.85', '-i', burn, '-t', '1.45', '-vn',
   '-af', 'atempo=0.847,afade=t=in:d=0.12,afade=t=out:st=1.18:d=0.5,loudnorm=I=-23:TP=-4:LRA=7',
   '-c:a', 'libmp3lame', '-b:a', '96k', '-y', OUT / 'burn-talk-sound.mp3')
ff('-i', OUT / 'burn-talk.webm', '-an', '-c:v', 'libx264', '-crf', '25',
   '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-y', OUT / 'burn-talk.mp4')
print('Prepared the Let’s talk opening burn (silent overlay + separate sound).')
