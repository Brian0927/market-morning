import {marketResponse} from './market.mjs';
const FRONTEND='https://brian0927.github.io';
const HOME=FRONTEND+'/market-morning/morning/';
const API_ORIGIN='https://brian-market-push.brianhsieh0927.chatgpt.site';
const ISSUER='https://token.actions.githubusercontent.com';
const JWKS_URL=ISSUER+'/.well-known/jwks';
const SOURCE=FRONTEND+'/market-morning/data/newsletter.json';
const encoder=new TextEncoder();
export const b64=bytes=>btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
export const unb64=s=>Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
const digest=async s=>b64(await crypto.subtle.digest('SHA-256',encoder.encode(s)));
const random=()=>b64(crypto.getRandomValues(new Uint8Array(32)));
const day=d=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit'}).format(d);
const hour=d=>Number(new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Taipei',hour:'numeric',hour12:false}).format(d));
let jwksCache;
export function validEndpoint(value){try{const u=new URL(value);return value.length<=4096&&u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&!u.hash&&(u.hostname==='web.push.apple.com'||u.hostname.endsWith('.push.apple.com')||u.hostname==='fcm.googleapis.com'||u.hostname==='updates.push.services.mozilla.com'||u.hostname.endsWith('.push.services.mozilla.com'));}catch{return false;}}
export async function authorizeGithub(token,{fetcher=fetch,now=Date.now(),audience=API_ORIGIN,jwks}={}){
  try{if(!token||token.length>16000)return false;const [header,body,sig,extra]=token.split('.');if(extra||!sig)return false;const h=JSON.parse(new TextDecoder().decode(unb64(header))),c=JSON.parse(new TextDecoder().decode(unb64(body)));
    if(h.alg!=='RS256'||typeof h.kid!=='string'||c.iss!==ISSUER||c.aud!==audience||!Number.isFinite(c.exp)||c.exp<=now/1000||!Number.isFinite(c.nbf)||c.nbf>now/1000+30||c.repository!=='Brian0927/market-morning'||c.ref!=='refs/heads/main'||c.workflow_ref!=='Brian0927/market-morning/.github/workflows/pages.yml@refs/heads/main')return false;
    if(!jwks){if(!jwksCache||jwksCache.until<now){const r=await fetcher(JWKS_URL,{signal:AbortSignal.timeout(10000)});if(!r.ok)return false;jwksCache={keys:(await r.json()).keys,until:now+3600000};}jwks=jwksCache;}
    const key=jwks.keys?.find(k=>k.kid===h.kid&&k.kty==='RSA');if(!key)return false;
    const imported=await crypto.subtle.importKey('jwk',key,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);return await crypto.subtle.verify('RSASSA-PKCS1-v1_5',imported,unb64(sig),encoder.encode(header+'.'+body));
  }catch{return false;}
}
export async function sendPush(endpoint,env,fetcher=fetch,now=Date.now()){
  const header=b64(encoder.encode(JSON.stringify({typ:'JWT',alg:'ES256'}))),claims=b64(encoder.encode(JSON.stringify({aud:new URL(endpoint).origin,exp:Math.floor(now/1000)+3600,sub:HOME})));
  const key=await crypto.subtle.importKey('jwk',JSON.parse(env.VAPID_PRIVATE_JWK),{name:'ECDSA',namedCurve:'P-256'},false,['sign']);
  const signature=await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},key,encoder.encode(header+'.'+claims));
  // Empty standards-based push: no article or private data is transmitted in the payload.
  const r=await fetcher(endpoint,{method:'POST',headers:{TTL:'43200',Urgency:'normal',Authorization:'vapid t='+header+'.'+claims+'.'+b64(signature)+', k='+env.VAPID_PUBLIC_KEY},signal:AbortSignal.timeout(12000)});
  return {accepted:r.ok,expired:r.status===404||r.status===410,status:r.status};
}
export async function dispatch(env,{now=new Date(),fetcher=fetch,send=sendPush}={}){
  if(hour(now)<8||hour(now)>=13)return {status:'outside-window',sent:0};
  const response=await fetcher(SOURCE+'?push='+now.getTime(),{signal:AbortSignal.timeout(12000),headers:{'cache-control':'no-cache'}});if(!response.ok)throw Error('edition-unavailable');const edition=await response.json(),published=new Date(edition.generatedAt);
  if(edition.version!==1||edition.date!==day(now)||isNaN(+published)||day(published)!==day(now)||hour(published)<8||+published>+now+300000||edition.availableCount<1||edition.items?.length!==10||edition.publicUrl!==HOME)return {status:'waiting-for-edition',sent:0};
  const list=await env.BUCKET.list({prefix:'subscriptions/',limit:100}),result={status:'completed',sent:0,alreadySent:0,expired:0,failed:0};
  for(const object of list.objects){const record=await env.BUCKET.get(object.key);if(!record)continue;const subscription=await record.json();if(!validEndpoint(subscription.endpoint))continue;
    const claim='deliveries/'+edition.date+'/'+subscription.id;
    const acquired=await env.BUCKET.put(claim,JSON.stringify({state:'sending',at:now.toISOString()}),{onlyIf:new Headers({'if-none-match':'*'})});
    if(!acquired){result.alreadySent++;continue;}
    try{const delivery=await send(subscription.endpoint,env,fetcher,+now);if(delivery.accepted){await env.BUCKET.put(claim,JSON.stringify({state:'accepted',at:now.toISOString()}));result.sent++;}else if(delivery.expired){await env.BUCKET.delete(object.key);result.expired++;}else{await env.BUCKET.delete(claim);result.failed++;}}catch{await env.BUCKET.delete(claim);result.failed++;}
  }
  return result;
}
function response(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json;charset=utf-8','cache-control':'no-store','access-control-allow-origin':FRONTEND,'access-control-allow-methods':'GET,POST,OPTIONS','access-control-allow-headers':'content-type,authorization',vary:'Origin','x-content-type-options':'nosniff'}});}
async function body(request){const value=await request.text();if(value.length>8192)throw Error('invalid-body');return JSON.parse(value);}
async function managed(payload,env){if(!/^[A-Za-z0-9_-]{43}$/.test(payload.id||'')||typeof payload.token!=='string'||payload.token.length>128)return null;const item=await env.BUCKET.get('subscriptions/'+payload.id);if(!item)return null;const record=await item.json();return record.tokenHash===await digest(payload.token)?record:null;}
export default {async fetch(request,env){
  const path=new URL(request.url).pathname;
  if(path==='/api/market'&&request.method==='GET')return marketResponse(request,env);
  if(path==='/'||path==='/health')return response({service:'市場晨讀通知服務',version:1,configured:!!(env.BUCKET&&env.VAPID_PUBLIC_KEY&&env.VAPID_PRIVATE_JWK),readingUrl:HOME});
  if(path==='/api/config'&&request.method==='GET')return response({publicKey:env.VAPID_PUBLIC_KEY||'',readingUrl:HOME});
  if(request.method==='OPTIONS'){if(request.headers.get('origin')!==FRONTEND)return response({error:'origin-denied'},403);return response({ok:true});}
  if(request.method!=='POST')return response({error:'not-found'},404);
  if(!env.BUCKET||!env.VAPID_PRIVATE_JWK||!env.VAPID_PUBLIC_KEY)return response({error:'service-not-ready'},503);
  try{
    if(path==='/api/dispatch'){
      const token=request.headers.get('authorization')?.replace(/^Bearer\s+/i,'');
      if(!await authorizeGithub(token))return response({error:'publisher-not-authorized'},401);
      return response(await dispatch(env));
    }
    if(request.headers.get('origin')!==FRONTEND)return response({error:'origin-denied'},403);
    const payload=await body(request);
    if(path==='/api/subscribe'){
      if(typeof payload.endpoint!=='string'||!validEndpoint(payload.endpoint))return response({error:'invalid-endpoint'},400);
      const id=await digest(payload.endpoint),key='subscriptions/'+id,existing=await env.BUCKET.get(key);
      if(existing){const old=await existing.json();if(!payload.token||old.tokenHash!==await digest(payload.token))return response({error:'subscription-owned-on-device'},409);return response({id,token:payload.token,status:'subscribed'});}
      if((await env.BUCKET.list({prefix:'subscriptions/',limit:101})).objects.length>=100)return response({error:'device-limit'},429);
      const token=random();await env.BUCKET.put(key,JSON.stringify({id,endpoint:payload.endpoint,tokenHash:await digest(token),createdAt:new Date().toISOString()}));return response({id,token,status:'subscribed'},201);
    }
    const record=await managed(payload,env);if(!record)return response({error:'device-not-authorized'},403);
    if(path==='/api/unsubscribe'){await env.BUCKET.delete('subscriptions/'+record.id);return response({status:'unsubscribed'});}
    if(path==='/api/test'){
      const key='tests/'+day(new Date())+'/'+record.id+'/'+Math.floor(Date.now()/60000);
      if(!await env.BUCKET.put(key,'pending',{onlyIf:new Headers({'if-none-match':'*'})}))return response({error:'test-rate-limited'},429);
      try{const sent=await sendPush(record.endpoint,env);if(sent.expired)await env.BUCKET.delete('subscriptions/'+record.id);if(!sent.accepted){await env.BUCKET.delete(key);return response({error:'push-service-rejected',status:sent.status},502);}return response({status:'accepted',note:'推播服務已接受，手機顯示仍需實際確認。'});}catch{await env.BUCKET.delete(key);return response({error:'push-service-unavailable'},502);}
    }
    return response({error:'not-found'},404);
  }catch{return response({error:'request-failed'},400);}
}};
