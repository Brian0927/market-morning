import {parseMarketQuote,fetchMarketQuote} from './push-service/market.mjs';
import crypto from 'node:crypto';
export const decode=s=>String(s||'').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/&#(x[\da-f]+|\d+);/gi,(_,n)=>String.fromCodePoint(n[0].toLowerCase()==='x'?parseInt(n.slice(1),16):+n)).replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&apos;|&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>');
export const text=s=>decode(String(s||'').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ')).replace(/\s+/g,' ').trim();
export const tag=(s,n)=>decode(s.match(new RegExp('<'+n+'(?:\\s[^>]*)?>([\\s\\S]*?)</'+n+'>','i'))?.[1]||'').trim();
export const idFor=url=>crypto.createHash('sha256').update(url).digest('hex').slice(0,16);
export function parseFeed(xml,provider){return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(m=>({id:idFor(tag(m[1],'link')),title:text(tag(m[1],'title')),url:tag(m[1],'link'),date:tag(m[1],'pubDate'),source:text(tag(m[1],'source'))||provider,description:text(tag(m[1],'description')),sourceHome:m[1].match(/<source[^>]*url=["']([^"']+)/)?.[1]||null})).filter(i=>i.title&&i.url.startsWith('https://')&&!isNaN(Date.parse(i.date)));}
function limited(s,max=90){const clean=text(s);if(/[\u3400-\u9fff]/.test(clean))return clean.length>max?clean.slice(0,max).replace(/[，、：；\s]+$/,'')+'…':clean;const words=clean.split(/\s+/);return words.length>40?words.slice(0,40).join(' ')+'…':clean;}
function meta(html,name){const tags=html.match(/<meta\b[^>]*>/gi)||[];for(const t of tags){if(new RegExp('(?:name|property)=["\']'+name+'["\']','i').test(t))return text(t.match(/content=["']([^"']*)["']/i)?.[1]);}return '';}
export function extractArticle(html){let articleBody='';const walk=o=>{if(!o||typeof o!=='object')return;if(typeof o.articleBody==='string'&&o.articleBody.length>articleBody.length)articleBody=o.articleBody;for(const v of Object.values(o))if(typeof v==='object')Array.isArray(v)?v.forEach(walk):walk(v);};for(const m of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)){try{walk(JSON.parse(m[1]));}catch{}}
  if(!articleBody){const region=html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i)?.[1];if(region)articleBody=[...region.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map(m=>text(m[1])).filter(t=>t.length>35&&!/訂閱|廣告|版權|copyright|登入|推薦閱讀/i.test(t)).slice(0,12).join(' ');}
  return {body:text(articleBody).replace(/將\s*Yahoo\s*設為首選來源[，,]?在\s*Google\s*上查看更多我們的精彩報導\s*/g,''),description:meta(html,'og:description')||meta(html,'description'),canonical:decode(html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)/i)?.[1]||'')};}
const contexts={taiwan:'可對照加權指數、成交量與類股表現，確認新聞影響是否反映在價格；單則報導不等於交易訊號。',global:'留意事件對全球風險偏好、利率與資金流向的影響，並確認美股交易日期與台灣時間的差異。',macro:'可追蹤匯率、利率與能源成本後續變化，對照企業營收與毛利率；不同產業的影響方向可能不同。',tech:'後續可比對訂單、資本支出、出貨與獲利，區分產業題材與已實現的營運成果。',company:'可回到公司公告、月營收與法說查核，觀察營收、獲利率及現金流是否支持報導中的展望。',finance:'留意獲利品質、資產品質、股息來源與需求變化；配息或單一數字不能取代完整判斷。'};
export function resolveArticleUrl(url){
  try{const u=new URL(url);if(u.protocol!=='https:')return null;if(u.hostname==='news.google.com'){const encoded=u.pathname.split('/').at(-1);const decoded=Buffer.from(encoded,'base64url').toString('latin1');return decoded.match(/https:\/\/[^\x00-\x20\x7f-\xff]+/)?.[0]||url;}return url;}catch{return null;}
}
export async function enrichArticle(a,group,allowFetch=true){let raw=a.description||'',originalUrl=a.url;
  const norm=s=>String(s).replace(/[\s\p{P}]/gu,'');
  let status=norm(raw).replace(norm(a.title),'').replace(norm(a.source),'').length>25?'rss':'title';
  const target=resolveArticleUrl(a.url);
  if(allowFetch&&target){try{const r=await fetch(target,{signal:AbortSignal.timeout(10000),headers:{'user-agent':'Mozilla/5.0 MarketMorningReader/2.0','accept':'text/html'}});if(r.ok){const html=await r.text();const extracted=extractArticle(html);if(extracted.body.length>80){raw=extracted.body;status='article';}else if(extracted.description.length>30&&!target.includes('news.google.com/')){raw=extracted.description;status='rss';}if(extracted.canonical.startsWith('https://')&&!extracted.canonical.includes('news.google.com/'))originalUrl=extracted.canonical;else if(!r.url.includes('news.google.com/'))originalUrl=r.url;}}catch{}}
  // Keep only a short source excerpt; never republish a publisher's full article.
  const abstract=status==='title'?'來源未提供可讀取的內文摘要。':limited(raw);
  const metrics=[...raw.matchAll(/(營收|毛利率|淨利率|EPS|每股盈餘|稅後純益|成交量|殖利率)[為是達約\s：:]*([\d,]+(?:\.\d+)?\s*(?:%|％|兆元|億元|萬元|億美元|美元|元|倍|bps))/gi)].slice(0,4).map(m=>m[1]+'：'+m[2]);
  return {...a,id:a.id||idFor(a.url),group,originalUrl,abstract,extractionStatus:status,facts:[],context:contexts[group],highlights:[...new Set(metrics)],description:undefined,sourceText:status==='article'?raw:''};
}
export async function mapLimit(items,limit,fn){const out=new Array(items.length);let next=0;await Promise.all(Array.from({length:Math.min(limit,items.length)},async()=>{while(next<items.length){const i=next++;out[i]=await fn(items[i],i);}}));return out;}
const symbols=[['^TWII','加權指數'],['^GSPC','S&P 500'],['^IXIC','NASDAQ'],['^SOX','費城半導體'],['2330.TW','台積電'],['2317.TW','鴻海'],['2308.TW','台達電'],['0050.TW','元大台灣50'],['00878.TW','國泰永續高股息']];
export function parseQuote(result,name){return parseMarketQuote(result,name);}
export async function collectMarkets(previous={},offline=false){const quotes=await mapLimit(symbols,3,async([symbol,name])=>{try{if(offline)throw Error('offline');return await fetchMarketQuote(symbol,'1y',fetch,name);}catch{const old=previous.quotes?.find(q=>q.symbol===symbol);return old?{...old,status:'cached'}:{symbol,name,currency:symbol.endsWith('.TW')?'TWD':'',price:null,change:null,changePercent:null,series:[],asOf:null,status:'unavailable',source:'https://finance.yahoo.com/quote/'+encodeURIComponent(symbol)+'/'};}});return {generatedAt:new Date().toISOString(),quotes};}
