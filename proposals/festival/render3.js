const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage();await p.goto('file://'+__dirname+'/v3.html');await p.evaluate(()=>document.fonts.ready);
await p.pdf({path:__dirname+'/Cinematy_Partnership_Proposal_Mastershot_7Screens.pdf',format:'A4',printBackground:true,preferCSSPageSize:true});await b.close()})();
