const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage();await p.goto('file://'+__dirname+'/mou_community.html');await p.evaluate(()=>document.fonts.ready);
await p.pdf({path:__dirname+'/MoU_Community_Mastershot_Cinematy_7Screens.pdf',format:'A4',printBackground:true,preferCSSPageSize:true});await b.close()})();
