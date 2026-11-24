"""Gera a sequencia de mascaras (interpola quadros pares, suaviza no tempo, borda macia) e monta o video em camadas."""
import sys, os, subprocess
import numpy as np
from PIL import Image, ImageFilter
d=sys.argv[1]; N=450; ULT=305
os.makedirs(f'{d}/mseq', exist_ok=True)
cache={}
def m(i):
    if i not in cache:
        p=f'{d}/mk2/m_{i:04d}.png'
        cache[i]=np.asarray(Image.open(p).convert('L'),dtype=np.float32) if os.path.exists(p) else None
    return cache[i]
base=[]
for i in range(1,N+1):
    if i>ULT+2: base.append(None); continue
    if m(i) is not None: base.append(m(i))
    else:
        a=m(i-1) if i>1 else None; b=m(i+1)
        base.append((a+b)/2 if a is not None and b is not None else (a if a is not None else b))
H,W=next(x for x in base if x is not None).shape
for k in range(N):
    if base[k] is None: arr=np.zeros((H,W),np.float32)
    else:
        viz=[base[j] for j in (k-1,k,k+1) if 0<=j<N and base[j] is not None]
        arr=(viz[0]*.25+base[k]*.5+viz[-1]*.25) if len(viz)==3 else base[k]
    im=Image.fromarray(np.clip(arr,0,255).astype(np.uint8)).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1.6))
    im.save(f'{d}/mseq/m_{k+1:04d}.png')
fc=("[0:v]split[bg][fg];[bg][1:v]overlay=0:0:format=auto[b1];"
    "[2:v]format=gray,scale=1080:1920[mk];[fg][mk]alphamerge[pessoa];[b1][pessoa]overlay=0:0:format=auto[b2];"
    "[b2]scale=w='trunc(1080*(1+0.03*t/15)/2)*2':h='trunc(1920*(1+0.03*t/15)/2)*2':eval=frame,crop=1080:1920[b3];"
    "[b3][3:v]overlay=0:0:format=auto,format=yuv420p[v];"
    "[4:a]atrim=0:15,afade=t=in:d=0.4,afade=t=out:st=13.4:d=1.6,loudnorm=I=-16:TP=-1.5:LRA=7,aresample=48000[a]")
subprocess.run(['ffmpeg','-y','-loglevel','error','-i',f'{d}/real_tratado.mp4','-i',f'{d}/tras.mov','-framerate','30','-i',f'{d}/mseq/m_%04d.png',
  '-i',f'{d}/frente.mov','-i',f'{d}/../pilates/trilha.wav','-filter_complex',fc,'-map','[v]','-map','[a]','-c:v','libx264','-preset','slow',
  '-crf','15','-profile:v','high','-pix_fmt','yuv420p','-r','30','-c:a','aac','-b:a','256k','-movflags','+faststart','-t','15',
  f'{d}/Reel_Flaviane_MovimentoPrevencao_camadas.mp4'],check=True)
print('ok')
