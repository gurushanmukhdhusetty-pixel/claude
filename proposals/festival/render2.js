const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const p=await b.newPage();await p.goto('file://'+__dirname+'/v2.html');
const logo=fs.readFileSync(__dirname+'/../../launch-video/assets/logo.svg','utf8').replace(/style="color:[^"]*"/,'style="color:#0b0b0b"').replace(/width="[^"]*"/,'width="100%"').replace(/height="[^"]*"/,'height="auto"');
await p.evaluate(l=>document.getElementById('logo').innerHTML=l,logo);await p.evaluate(()=>document.fonts.ready);
await p.pdf({path:__dirname+'/Cinematy_MU_Film_Festival_Proposal.pdf',format:'A4',printBackground:true,margin:{top:0,right:0,bottom:0,left:0}});await b.close()})();
