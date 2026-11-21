# Horizontal 1920x1080 version: every clip once, music runs 2:20.78 -> 2:42.28
import subprocess,os
U='/root/.claude/uploads/cc21f16f-1bb4-597e-9a74-1909304b7740/'
SRC={'A':'743a6819-VID_20261112_185141_1.mp4','B':'62fac38c-VID_20251013_164836.mp4','C':'ff64c5e1-VID_20251013_161212_1.mp4',
     'D':'cea2be09-VID_20251013_154840_1.mp4','E':'2ec59202-VID_20251013_163924.mp4'}
grade=("curves=master='0/0.045 0.25/0.23 0.75/0.79 1/0.965',"
       "colorbalance=rs=-0.03:bs=0.035:rm=0.02:bm=-0.01:rh=0.045:gh=0.012:bh=-0.04,eq=contrast=1.04:saturation=1.07")
# bar lines (edit seconds): 0 1.65 3.30 4.97 6.62 8.27 9.94 11.59(hit) 13.24 14.89 16.56
SEG=[('E',0.30,2.16,0,1.65,''),('D',0.30,4.69,1.65,6.62,''),('C',0.0,3.76,6.62,9.94,''),('B',0.0,1.556,9.94,11.59,''),
     ('A',0.30,3.92,11.59,16.56,'flash')]
END=21.5; os.makedirs('seg_h',exist_ok=True); parts=[]
for i,(k,a,b,s,e,x) in enumerate(SEG):
    n=round(e*24)-round(s*24); sp=(b-a)/(n/24); f=f'seg_h/{i:02d}.mp4'; parts.append(f)
    lift='eq=brightness=0.05:gamma=1.22:saturation=1.05,' if k=='A' else ''
    tail=f"framerate=fps=24,trim=end_frame={n},setpts=PTS-STARTPTS,{grade},setsar=1"+(",fade=t=in:st=0:d=0.17:color=white" if x else '')+",format=yuv420p"
    head=f"trim={a}:{b},setpts=(PTS-STARTPTS)/{sp:.5f}"
    if k=='E':
        fc=(f"[0:v]{head},split[p][q];[p]scale=1920:-2,crop=1920:1080,boxblur=40:2,eq=brightness=-0.12[bg];"
            f"[q]scale=-2:1080:flags=lanczos[fg];[bg][fg]overlay=(W-w)/2:0,{tail}[v]")
        subprocess.run(['ffmpeg','-v','error','-y','-i',U+SRC[k],'-an','-filter_complex',fc,'-map','[v]','-c:v','libx264','-crf','12','-preset','fast',f],check=True)
    else:
        vf=f"{head},scale=1920:1080:flags=lanczos,{lift}{tail}"
        subprocess.run(['ffmpeg','-v','error','-y','-i',U+SRC[k],'-an','-vf',vf,'-c:v','libx264','-crf','12','-preset','fast',f],check=True)
    print(i,k,f"speed {sp:.2f}x frames {n}")
endlen=END-16.56
subprocess.run(['ffmpeg','-v','error','-y','-loop','1','-t',f'{endlen:.4f}','-i','endcard_h.png','-vf','fps=24,format=yuv420p,fade=t=in:st=0:d=0.4','-c:v','libx264','-crf','12','seg_h/99.mp4'],check=True)
parts.append('seg_h/99.mp4')
ins=[];[ins.extend(['-i',p]) for p in parts]
fcj=''.join(f'[{i}:v]fps=24,setpts=PTS-STARTPTS,setsar=1,format=yuv420p[s{i}];' for i in range(len(parts)))+''.join(f'[s{i}]' for i in range(len(parts)))+f'concat=n={len(parts)}:v=1:a=0[v]'
subprocess.run(['ffmpeg','-v','error','-y',*ins,'-filter_complex',fcj,'-map','[v]','-c:v','libx264','-crf','10','-preset','fast','-r','24','seg_h/joined.mp4'],check=True)
fc=("[0:v]fps=24,setpts=PTS-STARTPTS[c0];"
    "[2:v]format=rgba,fade=t=in:st=0.25:d=0.45:alpha=1,fade=t=out:st=16.2:d=0.3:alpha=1[cap];"
    "[c0][cap]overlay=0:0:shortest=1,noise=c0s=17:c0f=t+u:c1s=4:c1f=t:c2s=4:c2f=t,vignette=angle=PI/4.6,format=yuv420p[v];"
    f"[1:a]atrim=140.78:{140.78+END},asetpts=PTS-STARTPTS,afade=t=in:st=0:d=0.12,afade=t=out:st={END-2.2}:d=2.2[a]")
subprocess.run(['ffmpeg','-v','error','-y','-i','seg_h/joined.mp4','-i',U+'3f932e9f-Ritviz_-_Udd_Gaye_Official_AudioMP3_160K.mp3',
    '-loop','1','-t',str(END),'-framerate','24','-i','caption_h.png','-filter_complex',fc,'-map','[v]','-map','[a]',
    '-c:v','libx264','-crf','21','-preset','slow','-tune','grain','-maxrate','16M','-bufsize','32M','-profile:v','high','-r','24',
    '-c:a','aac','-b:a','256k','-movflags','+faststart','-t',str(END),'Cinematy_BTS_UddGaye_16x9.mp4'],check=True)
print('done')
