const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1920,height:1920}});
await p.goto('file://'+__dirname+'/cards.html');
const logo=fs.readFileSync(__dirname+'/../../launch-video/assets/logo.svg','utf8').replace(/style="color:[^"]*"/,'style="color:#fff"').replace(/width="[^"]*"/,'width="100%"').replace(/height="[^"]*"/,'height="auto"');
await p.evaluate(l=>{document.getElementById('logo').innerHTML=l;document.getElementById('logoh').innerHTML=l},logo);await p.evaluate(()=>document.fonts.ready);
await (await p.$('#cap')).screenshot({path:__dirname+'/caption.png',omitBackground:true});
await (await p.$('#end')).screenshot({path:__dirname+'/endcard.png'});await (await p.$('#caph')).screenshot({path:__dirname+'/caption_h.png',omitBackground:true});await (await p.$('#endh')).screenshot({path:__dirname+'/endcard_h.png'});await b.close()})();
