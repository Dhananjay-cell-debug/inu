"""Single rising lower-left burn, inspected at 11.5–12.1s in 0.15s steps.
The 0.6s source is slowed into one 1.5s opening gesture. Never loop the burn.
The user's existing score.mp3 and silent grain loop are shared unchanged.
"""
from pathlib import Path
import subprocess
ROOT=Path(__file__).resolve().parent.parent
SOURCE=ROOT.parent/'chatgpt inu design/cinematic feels/Level Up Your Videos with 4K Film Burn Transition Sounds.mp4'
OUT=ROOT/'src/home/media'
def ff(*args):subprocess.run(['ffmpeg','-hide_banner','-loglevel','error',*map(str,args)],check=True)
ff('-ss','11.5','-i',SOURCE,'-t','1.5','-an','-vf','trim=duration=0.6,setpts=2.5*PTS,scale=960:-2,fps=24,fade=t=in:d=0.12,fade=t=out:st=1.1:d=0.35','-c:v','libvpx-vp9','-crf','36','-b:v','0','-row-mt','1','-y',OUT/'burn-portfolio.webm')
ff('-ss','11.5','-i',SOURCE,'-t','1.5','-vn','-af','atrim=duration=0.6,atempo=0.5,atempo=0.8,afade=t=in:d=0.1,afade=t=out:st=1.1:d=0.35,loudnorm=I=-23:TP=-4:LRA=7','-c:a','libmp3lame','-b:a','96k','-y',OUT/'burn-portfolio-sound.mp3')
ff('-i',OUT/'burn-portfolio.webm','-an','-c:v','libx264','-crf','25','-pix_fmt','yuv420p','-movflags','+faststart','-y',OUT/'burn-portfolio.mp4')
print('Prepared a finite 1.5s portfolio burn, silent video and separate sound.')
