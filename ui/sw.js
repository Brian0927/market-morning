const READER=new URL('./morning/',self.registration.scope).href;
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('push',event=>{
  // Always show a visible notification; payload cannot change the destination.
  event.waitUntil(self.registration.showNotification('市場晨讀',{
    body:'點此閱讀最新十則晨報｜台股、美股與國內外科技',
    icon:new URL('./assets/icon-192.png',self.registration.scope).href,
    badge:new URL('./assets/icon-192.png',self.registration.scope).href,
    tag:'market-morning-'+new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Taipei'}).format(new Date()),renotify:true,data:{url:READER}
  }));
});
self.addEventListener('notificationclick',event=>{
  event.notification.close();
  event.waitUntil((async()=>{
    const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});
    for(const client of windows){if(client.url.startsWith(self.registration.scope)&&'navigate' in client){await client.navigate(READER);await client.focus();return;}}
    await self.clients.openWindow(READER);
  })());
});
