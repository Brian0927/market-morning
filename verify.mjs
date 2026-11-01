import assert from 'node:assert/strict';
import worker from './dist/server/index.js';
let saved=null;const env={BUCKET:{get:async()=>saved?{json:async()=>JSON.parse(saved)}:null,put:async(k,v)=>{saved=v;}}};
const home=await worker.fetch(new Request('https://test/'),env);const html=await home.text();assert.equal(home.status,200);for(const t of ['0050','00878','2330','2317','2308','殖利率','K線','calcresult'])assert.ok(html.includes(t));
const data={date:new Date().toISOString(),title:'驗證精華',items:[{title:'驗證',text:'測試儲存與讀回',url:'https://www.twse.com.tw/'}]};
let r=await worker.fetch(new Request('https://test/api/brief',{method:'POST',body:JSON.stringify(data)}),env);assert.equal(r.status,200);r=await worker.fetch(new Request('https://test/api/brief'),env);assert.deepEqual(await r.json(),data);
r=await worker.fetch(new Request('https://test/api/brief',{method:'POST',body:'{}'}),env);assert.equal(r.status,400);
const code=html.match(/<script>([\s\S]*?)<\/script>/)[1];new Function(code);
console.log('PASS: home, research, browser JS syntax, brief write/readback and invalid input');
