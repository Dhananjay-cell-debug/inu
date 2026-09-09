"""Single warm left-edge burn at 21.8s, inspected at quarter-second intervals.
Keep the user's exact shared soundtrack. Export silent overlays plus separate SFX.
"""
from pathlib import Path
import subprocess
ROOT=Path(__file__).resolve().parent.parent
SOURCE=ROOT.parent/'chatgpt inu design/cinematic feels/Level Up Your Videos with 4K Film Burn Transition Sounds.mp4'
OUT=ROOT/'src/home/media'
def ff(*args):
    subprocess.run(['ffmpeg','-hide_banner','-loglevel','error',*map(str,args)],check=True)
ff('-ss','21.8','-i',SOURCE,'-t','1.32','-an','-vf','trim=duration=0.55,setpts=2.4*PTS,scale=960:-2,fps=24,fade=t=in:d=0.12,fade=t=out:st=0.9:d=0.4','-c:v','libvpx-vp9','-crf','36','-b:v','0','-row-mt','1','-y',OUT/'burn-services.webm')
ff('-ss','21.8','-i',SOURCE,'-t','1.32','-vn','-af','atrim=duration=0.55,atempo=0.5,atempo=0.833333,afade=t=in:d=0.1,afade=t=out:st=0.9:d=0.4,loudnorm=I=-23:TP=-4:LRA=7','-c:a','libmp3lame','-b:a','96k','-y',OUT/'burn-services-sound.mp3')
ff('-i',OUT/'burn-services.webm','-an','-c:v','libx264','-crf','25','-pix_fmt','yuv420p','-movflags','+faststart','-y',OUT/'burn-services.mp4')
print('Prepared the services opening burn and its separate sound effect.')
