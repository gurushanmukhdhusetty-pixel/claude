// usage: node render.js stills t1 t2 ...   |  node render.js chunk <startFrame> <endFrame> <out.mp4>
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');const {spawn}=require('child_process');
(async()=>{const [mode,...a]=process.argv.slice(2);
 const b=await chromium.launch();const VT=process.env.VERT==='1';const p=await b.newPage({viewport:VT?{width:1080,height:1920}:{width:1920,height:1080}});
 p.on('pageerror',e=>console.error('PAGEERR',e.message));
 await p.goto('file://'+path.resolve(__dirname,process.env.PAGE||'index.html')+(VT?'#v':''));
 await p.evaluate(([s,q])=>init(s,q),[fs.readFileSync(path.join(__dirname,'assets/logo.svg'),'utf8'),fs.readFileSync(path.join(__dirname,'assets/qr.svg'),'utf8')]);
 await p.evaluate(()=>document.fonts.ready);
 const out=path.join(__dirname,'out');fs.mkdirSync(out,{recursive:true});
 if(mode==='stills'){for(const t of a){await p.evaluate(t=>render(+t),t);await p.waitForTimeout(30);await p.screenshot({path:path.join(out,`${process.env.PAGE?'s_':''}${VT?'v':''}still_${t}.png`)});}}
 else{const [s,e,file]=[+a[0],+a[1],a[2]];
  const ff=spawn('ffmpeg',['-y','-loglevel','error','-f','image2pipe','-framerate','30','-c:v','mjpeg','-i','-','-c:v','libx264','-preset','medium','-crf','17','-pix_fmt','yuv420p',file],{stdio:['pipe','inherit','inherit']});
  for(let f=s;f<e;f++){await p.evaluate(t=>render(t),f/30);const buf=await p.screenshot({type:'jpeg',quality:95});if(!ff.stdin.write(buf))await new Promise(r=>ff.stdin.once('drain',r));if(f%150===0)console.log('frame',f);}
  ff.stdin.end();await new Promise(r=>ff.on('close',r));}
 await b.close();})();
