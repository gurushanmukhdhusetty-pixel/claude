import subprocess,os
U='/root/.claude/uploads/cc21f16f-1bb4-597e-9a74-1909304b7740/'
SRC={'A':'743a6819-VID_20261112_185141_1.mp4','B':'62fac38c-VID_20251013_164836.mp4','C':'ff64c5e1-VID_20251013_161212_1.mp4',
     'D':'cea2be09-VID_20251013_154840_1.mp4','E':'2ec59202-VID_20251013_163924.mp4'}
# crop-centre keyframes (source seconds -> fraction of width)
KEY={'A':[(0,.52),(2.0,.52),(2.35,.3),(2.6,.43),(3.2,.48),(3.9,.5)],
     'B':[(0,.45),(1.6,.43)],
     'C':[(0,.5),(.7,.4),(1.15,.56),(2.15,.55),(2.55,.38),(3.8,.4)],
     'D':[(0,.5),(.6,.46),(2.0,.5),(3.2,.44),(4.7,.47)],'E':None}
def cx(k):
    pts=KEY[k];e=str(pts[-1][1])
    for (t0,c0),(t1,c1) in reversed(list(zip(pts,pts[1:]))):
        e=f"if(lt(t,{t1}),{c0}+({c1}-{c0})*(t-{t0})/{t1-t0},{e})"
    return e
T=[0,1.65,3.30,4.97,6.62,8.27,9.94,11.59,13.24,14.89,15.30,15.72,16.14,16.56]
# (clip, src_in, src_out, edit_start, edit_end, extra)
SEG=[('E',0.30,2.16,0,1.65,''),('D',0.30,4.69,1.65,6.62,''),('C',0.0,3.76,6.62,9.94,''),('B',0.0,1.556,9.94,11.59,''),
     ('A',0.90,3.92,11.59,14.89,'flash')]
grade=("curves=master='0/0.045 0.25/0.23 0.75/0.79 1/0.965',"
       "colorbalance=rs=-0.03:bs=0.035:rm=0.02:bm=-0.01:rh=0.045:gh=0.012:bh=-0.04,"
       "eq=contrast=1.04:saturation=1.07")
os.makedirs('seg',exist_ok=True);parts=[]
for i,(k,a,b,s,e,x) in enumerate(SEG):
    n=round(e*24)-round(s*24);sp=(b-a)/(n/24);f=f'seg/{i:02d}.mp4';parts.append(f)
    if KEY[k]: crop=f"crop=w=ih*9/16:h=ih:x='max(0,min(iw-ow,iw*({cx(k)})-ow/2))':y=0,"
    else: crop=''
    lift='eq=brightness=0.05:gamma=1.22:saturation=1.05,' if k=='A' else ''
    vf=f"trim={a}:{b},{crop}setpts=(PTS-STARTPTS)/{sp:.5f},scale=1080:1920:flags=lanczos,{lift}framerate=fps=24,trim=end_frame={n},setpts=PTS-STARTPTS,{grade},setsar=1"
    if x=='flash': vf+=",fade=t=in:st=0:d=0.17:color=white"
    vf+=",format=yuv420p"
    subprocess.run(['ffmpeg','-v','error','-y','-i',U+SRC[k],'-an','-vf',vf,'-c:v','libx264','-crf','12','-preset','fast',f],check=True)
    print(i,k,f"speed {sp:.2f}x frames {n}")
# end card 16.56 -> 18.90
subprocess.run(['ffmpeg','-v','error','-y','-loop','1','-t','2.3334','-i','endcard.png','-vf','fps=24,format=yuv420p,fade=t=in:st=0:d=0.35','-c:v','libx264','-crf','12',f'seg/99.mp4'],check=True)
parts.append('seg/99.mp4')
open('seg/list.txt','w').write(''.join(f"file '{os.path.basename(p)}'\n" for p in parts))
ins=[];[ins.extend(['-i',p]) for p in parts]
fcj=''.join(f'[{i}:v]fps=24,setpts=PTS-STARTPTS,setsar=1,format=yuv420p[s{i}];' for i in range(len(parts)))+''.join(f'[s{i}]' for i in range(len(parts)))+f'concat=n={len(parts)}:v=1:a=0[v]'
subprocess.run(['ffmpeg','-v','error','-y',*ins,'-filter_complex',fcj,'-map','[v]','-c:v','libx264','-crf','10','-preset','fast','-r','24','seg/joined.mp4'],check=True)

fc=("[0:v]fps=24,setpts=PTS-STARTPTS[c0];"
    "[2:v]format=rgba,fade=t=in:st=0.25:d=0.45:alpha=1,fade=t=out:st=14.55:d=0.3:alpha=1[cap];"
    "[c0][cap]overlay=0:0:shortest=1,"
    "noise=c0s=17:c0f=t+u:c1s=4:c1f=t:c2s=4:c2f=t,vignette=angle=PI/4.6,format=yuv420p[v];"
    "[1:a]atrim=140.78:158.0,asetpts=PTS-STARTPTS,afade=t=in:st=0:d=0.12,afade=t=out:st=16.4:d=0.8[a]")
subprocess.run(['ffmpeg','-v','error','-y','-i','seg/joined.mp4','-i',U+'3f932e9f-Ritviz_-_Udd_Gaye_Official_AudioMP3_160K.mp3',
    '-loop','1','-t','17.22','-framerate','24','-i','caption.png','-filter_complex',fc,'-map','[v]','-map','[a]',
    '-c:v','libx264','-crf','21','-preset','slow','-tune','grain','-maxrate','16M','-bufsize','32M','-profile:v','high','-r','24','-c:a','aac','-b:a','256k','-movflags','+faststart','-t','17.22',
    'Cinematy_BTS_UddGaye.mp4'],check=True)
print('done')
