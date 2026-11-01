import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
const manifest=JSON.parse(await fs.readFile('_site/manifest.webmanifest','utf8'));assert.equal(manifest.display,'standalone');assert.equal(manifest.start_url,'/market-morning/morning/');assert.equal(manifest.scope,'/market-morning/');
for(const page of ['', 'morning/','news/','markets/','companies/','library/']){const html=await fs.readFile('_site/'+page+'index.html','utf8');assert.ok(html.includes('manifest.webmanifest'));assert.ok(html.includes('apple-touch-icon'));assert.ok(html.includes('assets/push.js'));}
for(const size of [180,192,512]){const png=await fs.readFile('_site/assets/icon-'+size+'.png');assert.equal(png.readUInt32BE(16),size);assert.equal(png.readUInt32BE(20),size);}
const handlers={},shown=[],opened=[],navigated=[],focused=[];let windows=[],pending;
const scope='https://brian0927.github.io/market-morning/';
const context={URL,Promise,self:{registration:{scope,showNotification:async(...args)=>shown.push(args)},clients:{claim:async()=>{},matchAll:async()=>windows,openWindow:async url=>opened.push(url)},skipWaiting:async()=>{},addEventListener:(name,fn)=>handlers[name]=fn}};
vm.createContext(context);vm.runInContext(await fs.readFile('ui/sw.js','utf8'),context);
handlers.push({data:{json:()=>({url:'https://attacker.test'})},waitUntil:p=>pending=p});await pending;assert.equal(shown[0][0],'市場晨讀');assert.equal(shown[0][1].data.url,scope+'morning/');
const click={notification:{close:()=>{}},waitUntil:p=>pending=p};handlers.notificationclick(click);await pending;assert.deepEqual(opened,[scope+'morning/']);
windows=[{url:'https://attacker.test/',navigate:async u=>navigated.push(u),focus:async()=>focused.push(true)},{url:scope+'companies/',navigate:async u=>navigated.push(u),focus:async()=>focused.push(true)}];handlers.notificationclick(click);await pending;assert.deepEqual(navigated,[scope+'morning/']);assert.equal(focused.length,1);assert.equal(opened.length,1);
assert.equal(handlers.fetch,undefined);new Function(await fs.readFile('ui/push.js','utf8').then(s=>s.replace('import.meta.url',JSON.stringify(scope+'assets/push.js'))));
const config=JSON.parse(await fs.readFile('push.config.json','utf8'));assert.ok(config.serviceUrl.startsWith('https://'));assert.ok(!JSON.stringify(config).includes('PRIVATE'));
assert.ok((await fs.readFile('_site/push/index.html','utf8')).includes('assets/push.js'));
console.log('PASS: installable PWA, correct scoped URLs/icons, visible push notification, direct reading click, existing app focus, no stale fetch cache, public-only config');
