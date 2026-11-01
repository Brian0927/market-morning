import fs from 'node:fs/promises';
await import('./build.mjs');
const worker=(await import('./dist/server/index.js')).default;
const config=JSON.parse(await fs.readFile('site.config.json','utf8'));
const offline=process.argv.includes('--offline');
const now=new Date().toISOString();
const root='_site';
await fs.mkdir(root+'/data',{recursive:true});
const decode=s=>s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&#39;/g,"'");
const tag=(s,n)=>decode(s.match(new RegExp('<'+n+'(?:\\s[^>]*)?>([\\s\\S]*?)</'+n+'>','i'))?.[1]||'').trim();
async function feed(src){const r=await fetch(src.url,{signal:AbortSignal.timeout(15000),headers:{'user-agent':'MarketMorning/1.0'}});if(!r.ok)throw Error(src.name+' HTTP '+r.status);const xml=await r.text();const items=[...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0,12).map(m=>({title:tag(m[1],'title'),url:tag(m[1],'link'),date:tag(m[1],'pubDate'),source:tag(m[1],'source')||src.name})).filter(i=>i.title&&i.url.startsWith('https://')&&!isNaN(Date.parse(i.date)));if(!items.length)throw Error('No valid items');return {fetchedAt:now,provider:src.name+' · GitHub Actions 定時保存，非即時報價',items};}
const news={};
await Promise.all(Object.entries(config.newsQueries).map(async([group,q])=>{
  const sources=[{name:'Google News RSS',url:'https://news.google.com/rss/search?q='+encodeURIComponent(q)+'&hl=zh-TW&gl=TW&ceid=TW:zh-Hant'}];
  if(group==='taiwan')sources.push({name:'Yahoo 股市 RSS',url:'https://tw.stock.yahoo.com/rss?category=tw-market'});
  if(group==='global')sources.push({name:'BBC Business RSS',url:'https://feeds.bbci.co.uk/news/business/rss.xml'},{name:'CNBC RSS',url:'https://www.cnbc.com/id/100003114/device/rss/rss.html'});
  try{if(offline)throw Error('offline verification');news[group]=await Promise.any(sources.map(feed));}
  catch{let previous;try{if(offline)throw Error('offline');const r=await fetch(config.publicUrl+'data/'+group+'.json',{signal:AbortSignal.timeout(8000)});if(r.ok){const d=await r.json();if(Array.isArray(d.items)&&d.items.length)previous=d;}}catch{}
    news[group]=previous?{...previous,provider:previous.provider+' · 本次來源失敗，保留舊資料'}:{fetchedAt:null,provider:'此分類本次未取得資料，請使用來源書籤',items:[]};
  }
  await fs.writeFile(root+'/data/'+group+'.json',JSON.stringify(news[group],null,2));console.log(group+': '+news[group].items.length+' articles');
}));
const editorial=JSON.parse(await fs.readFile('editorial.json','utf8'));
let brief;
if(editorial.items?.length){if(!editorial.title||!editorial.date||isNaN(Date.parse(editorial.date))||editorial.items.some(i=>!i.title||!i.text||!i.url?.startsWith('https://')))throw Error('editorial.json requires title, ISO date, and items with title/text/https url');brief=editorial;}
else{const names={taiwan:'台灣市場',global:'全球商業',macro:'總經與能源',tech:'科技產業',company:'公司追蹤',finance:'金融與消費'};const seen=new Set();const items=[];for(const [group,name] of Object.entries(names)){const n=news[group].items.find(i=>!seen.has(i.title));if(n){seen.add(n.title);items.push({title:name+'｜'+n.title,text:'標題精選，未做全文分析。原發布時間：'+n.date+'；來源：'+n.source+'。請點原文了解背景，勿單靠標題決定交易。',url:n.url});}}brief={date:now,title:items.length?'每日新聞標題精選（非AI分析）':'本次尚未取得新聞，請查看來源書籤',items:items.slice(0,5)};}
await fs.writeFile(root+'/data/brief.json',JSON.stringify(brief,null,2));
let html=await (await worker.fetch(new Request('https://local/'),{})).text();
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
html=html.replace('<title>市場晨讀｜投資學習室</title>','<title>'+esc(config.title)+'</title>')
 .replace("fetch('/api/news?group='+group)","fetch('./data/'+group+'.json?t='+Date.now())")
 .replace("fetch('/api/brief')","fetch('./data/brief.json?t='+Date.now())")
 .replace('開啟頁面與按更新時讀取 Google News RSS；標題聚合不等於已核實的事實，請點原文確認。未提供即時股價。','新聞由 GitHub Actions 每日約 08:00（台北時間）取得；此按鈕重新讀取已發布資料。標題聚合未經全文分析，請點原文確認。')
 .replace('每日精華由排程查核後保存；若更新失敗，保留上一版並顯示日期。新聞標題自動更新與人工查核精華是兩種不同資料。','預設為自動挑選的新聞標題，並非AI查核或全文分析。維護者可編輯 editorial.json 發布人工精華；請注意資料日期。')
 .replace('通知是否啟用，以排程工具實際設定為準。','GitHub Pages 公開版 · 更新時間可能因排程延遲。')
 .replace('學習帳戶假設 · TWD','練習帳戶範例 · TWD');
await fs.writeFile(root+'/index.html',html);
await fs.writeFile(root+'/.nojekyll','');
console.log('Built public read-only GitHub Pages site in '+root);
