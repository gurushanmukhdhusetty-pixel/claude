const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1400},deviceScaleFactor:1});
p.on('pageerror',e=>console.error('ERR',e.message));
await p.goto('file://'+path.join(__dirname,process.env.HTML||'carousel.html'));
const A=path.join(__dirname,'../../launch-video/assets');
await p.evaluate(([l,q])=>init(l,q),[fs.readFileSync(A+'/logo.svg','utf8'),fs.readFileSync(A+'/qr.svg','utf8')]);
await p.evaluate(()=>document.fonts.ready);fs.mkdirSync(path.join(__dirname,'slides'),{recursive:true});
const N=+(process.env.N||10),D=process.env.OUT||'slides';fs.mkdirSync(path.join(__dirname,D),{recursive:true});for(let i=1;i<=N;i++){await (await p.$('#s'+i)).screenshot({path:path.join(__dirname,D,`cinematy_24fps_${String(i).padStart(2,'0')}.png`)})}
await b.close()})();
