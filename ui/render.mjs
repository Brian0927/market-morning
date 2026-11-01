import fs from 'node:fs/promises';
import crypto from 'node:crypto';
const pages=[['home','總覽',''],['news','新聞','news/'],['markets','市場','markets/'],['companies','公司','companies/'],['library','資料庫','library/']];
export async function renderPages(root,config){
  const assetVersion=crypto.createHash('sha256').update(await fs.readFile('ui/app.js')).update(await fs.readFile('ui/style.css')).digest('hex').slice(0,12);
  await fs.mkdir(root+'/assets',{recursive:true});
  for(const file of ['app.js','style.css'])await fs.copyFile('ui/'+file,root+'/assets/'+file);
  for(const [page,label,path] of pages){const base=page==='home'?'./':'../';await fs.mkdir(root+'/'+path,{recursive:true});
    const nav=pages.map(([key,name,href])=>`<a href="${base+href}" ${page===key?'aria-current="page"':''}>${name}</a>`).join('');
    await fs.writeFile(root+'/'+path+'index.html',`<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#153f38"><meta name="description" content="市場晨讀：每日市場新聞、指數與公司走勢。"><title>${label} · ${String(config.title||'市場晨讀').replace(/[<>&"]/g,'')}</title><link rel="stylesheet" href="${base}assets/style.css?v=${assetVersion}"></head><body data-page="${page}" data-base="${base}">
    <header class="site-header"><a class="brand" href="${base}" aria-label="市場晨讀首頁"><span class="brand-mark">◒</span><span>市場晨讀<small>MARKET MORNING</small></span></a><nav aria-label="主要導覽">${nav}</nav><button class="icon-button search-toggle" aria-label="搜尋新聞">⌕</button></header>
    <main><div class="page-heading"><div><p class="eyebrow" id="eyebrow">MARKET MORNING</p><h1 id="page-title">${label==='總覽'?'市場總覽':label}</h1></div><div class="heading-tools"><span id="update-time" class="update-time"></span><button id="refresh" class="icon-button" aria-label="重新載入資料">↻</button></div></div><div id="filters"></div><div id="content" aria-live="polite"><div class="loading-grid"><div></div><div></div><div></div></div></div></main>
    <footer><span>◒ 市場晨讀</span><span>資料時間依來源 · 新聞整理與研究參考</span><a href="${base}library/">資料與來源 ↗</a></footer>
    <dialog id="reader" aria-labelledby="reader-title"><div class="reader-toolbar"><span class="reader-brand">◒ READING ROOM</span><button class="icon-button" id="close-reader" aria-label="關閉閱讀窗">×</button></div><div id="reader-body"></div></dialog>
    <dialog id="search-dialog" aria-labelledby="search-title"><div class="reader-toolbar"><h2 id="search-title">搜尋新聞</h2><button class="icon-button" id="close-search" aria-label="關閉搜尋">×</button></div><div class="search-body"><label for="search-input">關鍵字</label><input id="search-input" type="search" placeholder="公司、產業或新聞關鍵字" autocomplete="off"><div id="search-results"></div></div></dialog>
    <script type="module" src="${base}assets/app.js?v=${assetVersion}"></script></body></html>`);
  }
}

