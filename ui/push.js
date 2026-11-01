const base=new URL('../',import.meta.url),storageKey='market-morning-push-v1';
let prepared;
const installed=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
const ios=()=>/iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const readState=()=>{try{return JSON.parse(localStorage.getItem(storageKey)||'null');}catch{return null;}};
function saveState(value){try{value?localStorage.setItem(storageKey,JSON.stringify(value)):localStorage.removeItem(storageKey);}catch{throw Error('無法保存此裝置的設定，請確認不是私密瀏覽模式。');}}
const decode=value=>Uint8Array.from(atob(value.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
async function prepare(){if(!prepared)prepared=(async()=>{const cfg=await(await fetch(new URL('push.config.json',base))).json();const api=cfg.serviceUrl.replace(/\/$/,'');const r=await fetch(api+'/api/config');if(!r.ok)throw Error('通知服務暫時無法連線。');const config=await r.json();if(!config.publicKey)throw Error('通知服務尚未就緒。');const reg=await navigator.serviceWorker.register(new URL('sw.js',base),{scope:base.pathname,updateViaCache:'none'});await navigator.serviceWorker.ready;return {api,config,reg};})().catch(error=>{prepared=null;throw error;});return prepared;}
async function post(api,path,data){const r=await fetch(api+path,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(data)});const result=await r.json();if(!r.ok){const messages={'test-rate-limited':'請等一分鐘後再測試。','device-limit':'通知裝置數量已達服務上限。','subscription-owned-on-device':'裝置紀錄已變更，請先在手機設定關閉此網站通知，再重新啟用。','device-not-authorized':'裝置授權已失效，請重新啟用通知。'};throw Error(messages[result.error]||'通知服務暫時無法完成，請稍後重試。');}return result;}
function mount(){
  if(document.body.dataset.page!=='morning'||document.querySelector('#morning-push'))return;
  const target=document.querySelector('#filters');if(!target?.querySelector('.morning-tools'))return;
  const box=document.createElement('section');box.id='morning-push';box.className='morning-push';box.setAttribute('aria-label','手機晨報通知');
  box.innerHTML='<div class="push-heading"><strong>手機晨報通知</strong><span id="push-status" role="status" aria-live="polite">正在確認此裝置…</span></div><div class="push-buttons"><button class="filter-chip" id="push-enable" disabled>啟用通知</button><button class="filter-chip" id="push-test" hidden>測試通知</button><button class="filter-chip" id="push-disable" hidden>關閉通知</button></div><details id="push-help"><summary>iPhone 啟用方式</summary><ol><li>使用 Safari 開啟此頁，點分享 → 加入主畫面。</li><li>從主畫面的「市場晨讀」圖示開啟，再按「啟用通知」並選允許。</li><li>按「測試通知」，確認手機有顯示；點通知應直接開啟晨報。</li></ol><p>需 iOS 16.4 以上。若先前加入的圖示只會開 Safari，請重新加入主畫面。每天台灣時間08:00開始更新，發布完成後通知；排程及推播可能延遲。無需 Gmail 或 AI 金鑰。</p></details>';
  target.append(box);const status=box.querySelector('#push-status'),enable=box.querySelector('#push-enable'),test=box.querySelector('#push-test'),disable=box.querySelector('#push-disable');
  const show=(message,on=false)=>{status.textContent=message;enable.hidden=on;test.hidden=!on;disable.hidden=!on;};
  const supported='serviceWorker' in navigator&&'PushManager' in window&&'Notification' in window;
  if(ios()&&!installed()){show('請先加入主畫面，並從圖示開啟。');box.querySelector('#push-help').open=true;return;}
  if(!supported){show('此瀏覽器暫不支援通知；仍可正常閱讀晨報。');return;}
  if(Notification.permission==='denied'){show('通知已被關閉，請到手機通知設定允許「市場晨讀」。');return;}
  let service;
  prepare().then(async value=>{service=value;const sub=await service.reg.pushManager.getSubscription();show(sub&&readState()?'已啟用；每日更新完成後通知。':'尚未啟用通知。',!!(sub&&readState()));enable.disabled=false;}).catch(error=>{show(error.message);enable.disabled=false;});
  enable.onclick=async()=>{
    if(!service){show('服務仍在準備，請稍後重試。');prepare().then(v=>service=v).catch(e=>show(e.message));return;}
    enable.disabled=true;
    try{try{localStorage.setItem(storageKey+'-probe','1');localStorage.removeItem(storageKey+'-probe');}catch{throw Error('請使用一般瀏覽模式，讓此裝置可以保存通知設定。');}const permission=await Notification.requestPermission();if(permission!=='granted'){show('尚未允許通知；晨報閱讀不受影響。');return;}
      const old=readState();let sub=await service.reg.pushManager.getSubscription();if(!sub)sub=await service.reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:decode(service.config.publicKey)});
      const registration=await post(service.api,'/api/subscribe',{endpoint:sub.endpoint,token:old?.token});try{saveState({id:registration.id,token:registration.token});}catch(error){await post(service.api,'/api/unsubscribe',registration).catch(()=>{});await sub.unsubscribe();throw error;}show('已啟用；按「測試通知」確認手機收得到。',true);
    }catch(error){show(error.message||'暫時無法啟用，請稍後重試。');}finally{enable.disabled=false;}
  };
  test.onclick=async()=>{test.disabled=true;try{const s=readState();if(!s)throw Error('請先啟用通知。');const ready=await prepare();await post(ready.api,'/api/test',s);show('已提交推播，請確認手機通知，再點通知測試跳轉。',true);}catch(error){show(error.message,true);}finally{test.disabled=false;}};
  disable.onclick=async()=>{disable.disabled=true;try{const ready=await prepare(),s=readState();let cleanupFailed=false;if(s)try{await post(ready.api,'/api/unsubscribe',s);}catch{cleanupFailed=true;}const sub=await ready.reg.pushManager.getSubscription();if(sub&&!await sub.unsubscribe())throw Error('裝置未完成停止訂閱，請再試一次。');saveState(null);show(cleanupFailed?'此裝置已停止訂閱；雲端清理會在失效檢查時完成。':'已關閉此裝置通知。');}catch(error){show(error.message,true);}finally{disable.disabled=false;}};
}
new MutationObserver(mount).observe(document.querySelector('#filters'),{childList:true});mount();
