export const MARKET_RANGES={'1d':{range:'1d',interval:'5m'},'1mo':{range:'1mo',interval:'1d'},'3mo':{range:'3mo',interval:'1d'},'1y':{range:'1y',interval:'1d'}};
export function normalizeStockSymbol(value){const s=String(value||'').trim().toUpperCase();const symbol=/^\d{4,6}$/.test(s)?s+'.TW':s;return /^[A-Z0-9^][A-Z0-9.^=-]{0,19}$/.test(symbol)?symbol:null;}
const finite=value=>typeof value==='number'&&Number.isFinite(value);
export function parseMarketQuote(result,name){
  const m=result.meta||{},bars=result.indicators?.quote?.[0]||{};
  const series=(result.timestamp||[]).flatMap((t,i)=>{const close=bars.close?.[i];if(!finite(t)||!finite(close)||close<0)return [];const p={time:new Date(t*1000).toISOString(),close};for(const key of ['open','high','low','volume'])p[key]=finite(bars[key]?.[i])?bars[key][i]:null;return [p];}).sort((a,b)=>Date.parse(a.time)-Date.parse(b.time));
  const price=finite(m.regularMarketPrice)?m.regularMarketPrice:series.at(-1)?.close??null;
  const intraday=!!m.dataGranularity&&!['1d','1wk','1mo'].includes(m.dataGranularity);
  const previousClose=[m.previousClose,m.regularMarketPreviousClose,intraday?m.chartPreviousClose:null,series.at(-2)?.close].find(finite)??null;
  const change=finite(price)&&finite(previousClose)?price-previousClose:finite(m.regularMarketChange)?m.regularMarketChange:finite(m.fulldayChange)?m.fulldayChange:null;
  const percent=finite(change)&&previousClose?change/previousClose*100:finite(m.regularMarketChangePercent)?m.regularMarketChangePercent:finite(m.fulldayChangePercent)?m.fulldayChangePercent:null;
  return {symbol:m.symbol,name:name||m.longName||m.shortName||m.symbol,currency:m.currency||'',price,previousClose,change,changePercent:percent,asOf:m.regularMarketTime?new Date(m.regularMarketTime*1000).toISOString():series.at(-1)?.time||null,series,exchange:m.fullExchangeName||m.exchangeName||'',timezone:m.exchangeTimezoneName||(m.symbol?.match(/\.TW[O]?$/)?'Asia/Taipei':'America/New_York'),interval:m.dataGranularity||'1d',marketState:m.marketState||null,source:'https://finance.yahoo.com/quote/'+encodeURIComponent(m.symbol)+'/',status:'delayed',fetchedAt:new Date().toISOString()};
}
export async function fetchMarketQuote(input,range='1mo',fetcher=fetch,name){
  const symbol=normalizeStockSymbol(input),options=MARKET_RANGES[range];if(!symbol||!options)throw Error('invalid-symbol-or-range');
  const candidates=symbol.endsWith('.TW')?[symbol,symbol.replace(/\.TW$/,'.TWO')]:[symbol];let lastError;
  for(const candidate of candidates){try{const url='https://query1.finance.yahoo.com/v8/finance/chart/'+encodeURIComponent(candidate)+'?range='+options.range+'&interval='+options.interval+'&includePrePost=false';const r=await fetcher(url,{headers:{'user-agent':'Mozilla/5.0 MarketMorning/3.0'},signal:AbortSignal.timeout(12000)});if(!r.ok)throw Error('source-'+r.status);const data=await r.json(),value=data.chart?.result?.[0];if(!value?.meta?.symbol)throw Error('symbol-not-found');const quote=parseMarketQuote(value,name);if(!quote.series.length||quote.price===null)throw Error('no-market-data');return {...quote,range};}catch(error){lastError=error;}}
  throw lastError||Error('market-unavailable');
}
export async function marketResponse(request,env){
  const query=new URL(request.url).searchParams,symbol=normalizeStockSymbol(query.get('symbol')),range=query.get('range')||'1mo';
  const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json;charset=utf-8','access-control-allow-origin':'https://brian0927.github.io','cache-control':'public,max-age=60','x-content-type-options':'nosniff'}});
  if(!symbol||!MARKET_RANGES[range])return reply({error:'invalid-symbol-or-range'},400);
  const key='market-cache-v2/'+symbol+'/'+range;let old;
  try{const cached=await env.BUCKET.get(key);if(cached)old=await cached.json();if(old&&Date.now()-Date.parse(old.fetchedAt)<120000)return reply(old);const value=await fetchMarketQuote(symbol,range);await env.BUCKET.put(key,JSON.stringify(value));return reply(value);}catch{return old?reply({...old,status:'cached',warning:'來源暫不可用，顯示上次成功取得資料。'}):reply({symbol,error:'market-unavailable'},503);}
}
