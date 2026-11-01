import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const {serviceUrl}=JSON.parse(await fs.readFile('push.config.json','utf8'));
const health=await fetch(serviceUrl+'/health');assert.ok(health.ok);assert.equal((await health.json()).configured,true);
const r=await fetch(serviceUrl+'/api/config');assert.ok(r.ok);const config=await r.json();assert.equal(Buffer.from(config.publicKey,'base64url').length,65);assert.equal(r.headers.get('access-control-allow-origin'),'https://brian0927.github.io');
const denied=await fetch(serviceUrl+'/api/dispatch',{method:'POST',body:'{}'});assert.equal(denied.status,401);
const origin=await fetch(serviceUrl+'/api/subscribe',{method:'POST',headers:{origin:'https://bad.test','content-type':'application/json'},body:'{}'});assert.equal(origin.status,403);
console.log('PASS: live public push backend ready, valid public key, frontend CORS and unauthorized publisher/origin rejected; no device was subscribed');
