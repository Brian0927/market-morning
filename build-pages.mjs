import fs from 'node:fs/promises';
import {parseFeed,enrichArticle,mapLimit,collectMarkets} from './collectors.mjs';
import {renderPages} from './ui/render.mjs';
await import('./build.mjs');
const worker=(await import('./dist/server/index.js')).default;
const config=JSON.parse(await fs.readFile('site.config.json','utf8'));
const offline=process.argv.includes('--offline'),now=new Date().toISOString(),root='_site';
await fs.mkdir(root+'/data',{recursive:true});
async function previous(name){if(offline)return null;try{const r=await fetch(config.publicUrl+'data/'+name+'.json',{signal:AbortSignal.timeout(8000)});return r.ok?await r.json():null;}catch{return null;}}
const feedCache=new Map();
async function feed(src){if(!feedCache.has(src.url))feedCache.set(src.url,(async()=>{if(offline)throw Error('offline');const r=await fetch(src.url,{signal:AbortSignal.timeout(14000),headers:{'user-agent':'Mozilla/5.0 MarketMorning/2.0'}});if(!r.ok)throw Error(src.name+' HTTP '+r.status);const items=parseFeed(await r.text(),src.name);if(!items.length)throw Error('No valid items');return {fetchedAt:now,provider:src.name,items};})());return feedCache.get(src.url);}
const yahoo={name:'Yahoo 股市',url:'https://tw.stock.yahoo.com/rss?category=tw-market'};
const bbc={name:'BBC Business',url:'https://feeds.bbci.co.uk/news/business/rss.xml'};
const direct=(await feed(yahoo).catch(()=>null))?.items||[];
const news={},patterns={taiwan:/台股|台積電|ETF|金控|上市|台灣|臺灣/,company:/台積電|鴻海|台達電|聯發科|輝達|微軟/,tech:/半導體|AI|晶片|伺服器|電源|科技/,macro:/央行|利率|匯率|原油|油價|台幣|美元|通膨/,finance:/銀行|金控|金融|消費|零售|股息|ETF/};
await Promise.all(Object.entries(config.newsQueries).map(async([group,q])=>{
  const google={name:'Google News',url:'https://news.google.com/rss/search?q='+encodeURIComponent(q)+'&hl=zh-TW&gl=TW&ceid=TW:zh-Hant'};
  try{
    const d=group==='global'?await feed(bbc).catch(()=>feed(google)):await feed(google);
    const picked=group==='global'?[]:direct.filter(a=>patterns[group]?.test(a.title)&&!/韓國瑜|競選總部|站台|選戰/.test(a.title)).slice(0,4);
    const seen=new Set();const selected=[...picked,...d.items].filter(a=>{const title=a.title.replace(/\s*-\s*[^-]+$/,'');if(seen.has(title))return false;seen.add(title);return true;}).slice(0,12);
    const items=await mapLimit(selected,3,async(a,i)=>enrichArticle(a,group,!offline&&i<6));
    news[group]={fetchedAt:now,provider:d.provider,items};
  }catch{const old=await previous(group);news[group]=old?.items?.length?{...old,provider:old.provider+' · 備援資料'}:{fetchedAt:null,provider:'來源暫時無法讀取',items:[]};}
  await fs.writeFile(root+'/data/'+group+'.json',JSON.stringify(news[group],null,2));console.log(group+': '+news[group].items.length+' articles, '+news[group].items.filter(a=>a.extractionStatus==='article').length+' body summaries');
}));
const editorial=JSON.parse(await fs.readFile('editorial.json','utf8'));
let brief;if(editorial.items?.length){if(!editorial.title||!editorial.date||isNaN(Date.parse(editorial.date))||editorial.items.some(i=>!i.title||!i.text||!i.url?.startsWith('https://')))throw Error('Invalid editorial.json');brief=editorial;}
else{const names={taiwan:'台灣市場',global:'全球商業',macro:'總經與能源',tech:'科技產業',company:'公司追蹤',finance:'金融與消費'},seen=new Set(),items=[];for(const [group,name] of Object.entries(names)){const n=news[group].items.find(i=>!seen.has(i.title));if(n){seen.add(n.title);items.push({title:name+'｜'+n.title,text:n.abstract||'請查看原始報導。',url:n.originalUrl||n.url});}}brief={date:now,title:items.length?'晨讀精選':'資料準備中',items:items.slice(0,5)};}
await fs.writeFile(root+'/data/brief.json',JSON.stringify(brief,null,2));
const oldMarkets=await previous('markets');const markets=await collectMarkets(oldMarkets||{},offline);await fs.writeFile(root+'/data/markets.json',JSON.stringify(markets,null,2));console.log('Markets: '+markets.quotes.filter(q=>q.price!==null).length+' available');
const oldHtml=await (await worker.fetch(new Request('https://local/'),{})).text();
const diagrams=[...oldHtml.matchAll(/<svg viewBox="0 0 440 280"[\s\S]*?<\/svg>/g)].map(m=>m[0]);
const research=JSON.parse(await fs.readFile('research.json','utf8')),guide=JSON.parse(await fs.readFile('guide.json','utf8'));
const resources=[['公開資訊觀測站｜財報・重大訊息','https://mops.twse.com.tw/'],['證交所｜行情與ETF','https://www.twse.com.tw/'],['台積電｜季度營運與展望','https://investor.tsmc.com/chinese/quarterly-results/2026/q3'],['鴻海｜投資人關係','https://www.honhai.com.tw/en-us/investor-relations'],['台達電｜公告與營收','https://www.deltaww.com/en-US/press?cateid=07&dataType=6'],['中央社｜財經新聞','https://www.cna.com.tw/list/afe.aspx'],['Reuters｜全球市場','https://www.reuters.com/markets/'],['Federal Reserve｜利率與政策','https://www.federalreserve.gov/'],['證交所｜投資指南與交易成本','https://www.twse.com.tw/zh/about/company/guide.html'],['證交所｜ETF交易規則','https://www.twse.com.tw/zh/products/securities/etf/overview/rules.html']].map(([title,url])=>({title,url}));
await fs.writeFile(root+'/data/catalog.json',JSON.stringify({research,guide,diagrams,resources},null,2));
await renderPages(root,config);await fs.writeFile(root+'/.nojekyll','');console.log('Built five public reader pages in '+root);
