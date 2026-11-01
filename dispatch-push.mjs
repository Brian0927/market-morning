import fs from 'node:fs/promises';
const {serviceUrl}=JSON.parse(await fs.readFile('push.config.json','utf8'));
if(!process.env.ACTIONS_ID_TOKEN_REQUEST_URL||!process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN)throw Error('Run this dispatcher in the authorized GitHub Actions workflow.');
const requestUrl=new URL(process.env.ACTIONS_ID_TOKEN_REQUEST_URL);requestUrl.searchParams.set('audience',serviceUrl);
const tokenResponse=await fetch(requestUrl,{headers:{Authorization:'Bearer '+process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN},signal:AbortSignal.timeout(15000)});if(!tokenResponse.ok)throw Error('GitHub identity token unavailable.');
const token=(await tokenResponse.json()).value;if(!token)throw Error('GitHub identity token missing.');
let result;
for(let attempt=0;attempt<3;attempt++){
  const r=await fetch(serviceUrl+'/api/dispatch',{method:'POST',headers:{Authorization:'Bearer '+token,'content-type':'application/json'},body:'{}',signal:AbortSignal.timeout(60000)});
  if(!r.ok)throw Error('Push dispatcher HTTP '+r.status);result=await r.json();
  if(result.status!=='waiting-for-edition'&&!result.failed)break;
  if(attempt<2)await new Promise(resolve=>setTimeout(resolve,15000));
}
console.log('Morning push: '+JSON.stringify(result));if(process.env.GITHUB_STEP_SUMMARY)await fs.appendFile(process.env.GITHUB_STEP_SUMMARY,'\n## Morning web push\n'+JSON.stringify(result)+'\n');
if(result.status==='waiting-for-edition'||result.failed)throw Error('Push incomplete; inspect the workflow summary.');
