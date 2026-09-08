"""Reproduce muted overlays and the user-selected score. Originals stay untouched."""
from pathlib import Path
import subprocess
ROOT=Path(__file__).resolve().parent.parent
SOURCE=ROOT.parent/'chatgpt inu design/cinematic feels'
OUT=ROOT/'src/home/media'
OUT.mkdir(parents=True,exist_ok=True)
grain=SOURCE/'grainy old film overlay ;).mp4'
burn=SOURCE/'Level Up Your Videos with 4K Film Burn Transition Sounds.mp4'
music=SOURCE/'Cinematic Action Trailer Background Music NO COPYRIGHT _ 1 Minute Hero Entry Bgm.mp4'
def ff(*args):
    subprocess.run(['ffmpeg','-hide_banner','-loglevel','error',*map(str,args)],check=True)
ff('-ss','2','-i',grain,'-t','12','-an','-vf','fps=18','-c:v','libvpx-vp9','-crf','38','-b:v','0','-row-mt','1','-y',OUT/'grain.webm')
ff('-ss','1.6','-i',burn,'-t','2','-an','-vf','setpts=0.65*PTS,scale=960:-2,fps=24,fade=t=in:d=0.15,fade=t=out:st=0.92:d=0.35','-c:v','libvpx-vp9','-crf','36','-b:v','0','-row-mt','1','-y',OUT/'burn-entry.webm')
ff('-ss','1.6','-i',burn,'-t','2','-vn','-af','atempo=1.538,afade=t=in:d=0.1,afade=t=out:st=0.92:d=0.35,loudnorm=I=-22:TP=-4:LRA=7','-c:a','libmp3lame','-b:a','96k','-y',OUT/'burn-sound.mp3')
ff('-i',music,'-map','0:a:0','-vn','-af','loudnorm=I=-18:TP=-2:LRA=9,afade=t=in:d=1.2,afade=t=out:st=63.5:d=3.3','-c:a','libmp3lame','-b:a','128k','-ar','44100','-y',OUT/'score.mp3')
for name,crf in [('grain',30),('burn-entry',25)]:
    ff('-i',OUT/f'{name}.webm','-an','-c:v','libx264','-crf',crf,'-pix_fmt','yuv420p','-movflags','+faststart','-y',OUT/f'{name}.mp4')
print('Prepared silent grain/burn overlays, separate burn sound, and the selected 66-second soundtrack.')
