// node rr.js stills t1 t2 ...  |  node rr.js video out.mp4 [start end]
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');const {spawn}=require('child_process');
const D=__dirname;
(async()=>{const [mode,...a]=process.argv.slice(2);const b=await chromium.launch();const p=await b.newPage({viewport:{width:1920,height:1080}});
p.on('pageerror',e=>console.error('PAGEERR',e.message));
await p.goto('file://'+path.join(D,'reel_h.html'));await p.evaluate(s=>init(s),fs.readFileSync('/home/user/claude/launch-video/assets/logo.svg','utf8'));
await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(300);
if(mode==='stills'){for(const t of a){await p.evaluate(t=>render(+t),t);await p.waitForTimeout(40);await p.screenshot({path:path.join(D,`h_${t}.png`)})}}
else{const file=a[0],s=+(a[1]||0),e=+(a[2]||Math.ceil(33.12*30));
 const ff=spawn('ffmpeg',['-y','-loglevel','error','-f','image2pipe','-framerate','30','-c:v','mjpeg','-i','-','-c:v','libx264','-preset','medium','-crf','16','-pix_fmt','yuv420p',file],{stdio:['pipe','inherit','inherit']});
 for(let f=s;f<e;f++){await p.evaluate(t=>render(t),f/30);const buf=await p.screenshot({type:'jpeg',quality:95});if(!ff.stdin.write(buf))await new Promise(r=>ff.stdin.once('drain',r))}
 ff.stdin.end();await new Promise(r=>ff.on('close',r))}
await b.close()})();
