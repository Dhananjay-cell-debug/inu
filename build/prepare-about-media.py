"""About's opening burn: the slow amber light-leak at 6.35s in the user's burn
compilation, which ramps instead of snapping. Same treatment as the other
pages -- silent overlay plus a separate, gated sound effect."""
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT.parent / 'chatgpt inu design/cinematic feels/Level Up Your Videos with 4K Film Burn Transition Sounds.mp4'
OUT = ROOT / 'src/home/media'


def ff(*args):
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', *map(str, args)], check=True)


ff('-ss', '6.35', '-i', SOURCE, '-t', '2.1', '-an',
   '-vf', 'trim=duration=1.7,setpts=0.9*PTS,scale=960:-2,fps=24,fade=t=in:d=0.2,fade=t=out:st=1.1:d=0.42',
   '-c:v', 'libvpx-vp9', '-crf', '36', '-b:v', '0', '-row-mt', '1', '-y', OUT / 'burn-about.webm')
ff('-ss', '6.35', '-i', SOURCE, '-t', '2.1', '-vn',
   '-af', 'atrim=duration=1.7,atempo=1.111,afade=t=in:d=0.18,afade=t=out:st=1.1:d=0.42,loudnorm=I=-23:TP=-4:LRA=7',
   '-c:a', 'libmp3lame', '-b:a', '96k', '-y', OUT / 'burn-about-sound.mp3')
ff('-i', OUT / 'burn-about.webm', '-an', '-c:v', 'libx264', '-crf', '25',
   '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-y', OUT / 'burn-about.mp4')
print('Prepared the About opening burn and its separate sound effect.')
