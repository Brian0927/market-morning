import assert from 'node:assert/strict';
import worker,{authorizeGithub,sendPush,dispatch,validEndpoint,b64,unb64} from './worker.js';
class Bucket{constructor(){this.data=new Map();}async get(k){const v=this.data.get(k);return v===undefined?null:{json:async()=>JSON.parse(v)};}async put(k,v,o){if(o?.onlyIf&&this.data.has(k))return null;this.data.set(k,v);return {key:k};}async delete(k){this.data.delete(k);}async list({prefix,limit}){return {objects:[...this.data.keys()].filter(k=>k.startsWith(prefix)).slice(0,limit).map(key=>({key})),truncated:false};}}
const keys=await crypto.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},true,['sign','verify']);
const env={BUCKET:new Bucket(),VAPID_PRIVATE_JWK:JSON.stringify(await crypto.subtle.exportKey('jwk',keys.privateKey)),VAPID_PUBLIC_KEY:b64(await crypto.subtle.exportKey('raw',keys.publicKey))};
const req=(path,data,origin='https://brian0927.github.io')=>new Request('https://service.test'+path,{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify(data)});
assert.ok(validEndpoint('https://web.push.apple.com/test'));assert.ok(!validEndpoint('https://localhost/'));assert.ok(!validEndpoint('https://fcm.googleapis.com.attacker.test/push'));assert.ok(!validEndpoint('http://fcm.googleapis.com/push'));
assert.equal((await worker.fetch(req('/api/subscribe',{endpoint:'https://web.push.apple.com/test'},'https://bad.test'),env)).status,403);
const registration=await (await worker.fetch(req('/api/subscribe',{endpoint:'https://web.push.apple.com/test'}),env)).json();assert.equal(registration.status,'subscribed');assert.ok(registration.token);
assert.equal((await worker.fetch(req('/api/subscribe',{endpoint:'https://web.push.apple.com/test'}),env)).status,409);
assert.equal((await worker.fetch(req('/api/unsubscribe',{id:registration.id,token:'wrong'}),env)).status,403);
assert.equal((await worker.fetch(req('/api/dispatch',{}),env)).status,401);
let pushOptions;await sendPush('https://web.push.apple.com/test',env,async(url,options)=>{pushOptions=options;return {ok:true,status:201};});
const jwt=pushOptions.headers.Authorization.match(/t=([^,]+)/)[1].split('.');const claims=JSON.parse(new TextDecoder().decode(unb64(jwt[1])));assert.equal(claims.aud,'https://web.push.apple.com');assert.ok(await crypto.subtle.verify({name:'ECDSA',hash:'SHA-256'},keys.publicKey,unb64(jwt[2]),new TextEncoder().encode(jwt[0]+'.'+jwt[1])));assert.equal(pushOptions.body,undefined);
const rsa=await crypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify']);const publicJwk={...await crypto.subtle.exportKey('jwk',rsa.publicKey),kid:'test'};
const c={iss:'https://token.actions.githubusercontent.com',aud:'https://brian-market-push.brianhsieh0927.chatgpt.site',exp:Date.now()/1000+600,nbf:Date.now()/1000-1,repository:'Brian0927/market-morning',ref:'refs/heads/main',workflow_ref:'Brian0927/market-morning/.github/workflows/pages.yml@refs/heads/main'};
async function token(claims){const input=b64(new TextEncoder().encode(JSON.stringify({alg:'RS256',kid:'test'})))+'.'+b64(new TextEncoder().encode(JSON.stringify(claims)));return input+'.'+b64(await crypto.subtle.sign('RSASSA-PKCS1-v1_5',rsa.privateKey,new TextEncoder().encode(input)));}
const authOptions={jwks:{keys:[publicJwk]}};assert.ok(await authorizeGithub(await token(c),authOptions));assert.ok(!await authorizeGithub(await token({...c,repository:'attacker/repo'}),authOptions));assert.ok(!await authorizeGithub(await token({...c,aud:'wrong'}),authOptions));assert.ok(!await authorizeGithub(await token({...c,exp:1}),authOptions));assert.ok(!await authorizeGithub((await token(c)).slice(0,-10)+'fake',authOptions));
const now=new Date('2026-11-02T00:10:00Z'),edition={version:1,date:'2026-11-02',generatedAt:'2026-11-02T00:05:00Z',items:Array(10).fill({}),availableCount:10,publicUrl:'https://brian0927.github.io/market-morning/morning/'};
let sent=0;const options={now,fetcher:async()=>({ok:true,json:async()=>edition}),send:async()=>{sent++;return {accepted:true};}};
const first=await dispatch(env,options),second=await dispatch(env,options);assert.equal(first.sent,1);assert.equal(second.alreadySent,1);assert.equal(sent,1);
assert.equal((await dispatch(env,{...options,now:new Date('2026-11-02T07:00:00Z')})).status,'outside-window');
assert.equal((await dispatch(env,{...options,fetcher:async()=>({ok:true,json:async()=>({...edition,date:'2026-11-01'})})})).status,'waiting-for-edition');
const removed=await worker.fetch(req('/api/unsubscribe',registration),env);assert.equal(removed.status,200);assert.equal((await env.BUCKET.list({prefix:'subscriptions/',limit:100})).objects.length,0);
assert.ok(!JSON.stringify(await (await worker.fetch(new Request('https://service.test/api/config'),env)).json()).includes('private'));
console.log('PASS: VAPID signing, Github OIDC signature and claim checks, origin/endpoint restrictions, private device management, daily deduplication, stale edition and direct-reading URL');
