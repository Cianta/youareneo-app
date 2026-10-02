/* Public shell only. Never store navigations, APIs, audio, notes or sessions. */
const SHELL='neo-public-shell-v4';
const ASSETS=['/offline.html','/pwa/purple-sun-192.png','/pwa/purple-sun-512.png','/pwa/purple-sun-maskable-512.png'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(SHELL).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key==='trinity-os-proxy-v1'||key==='trinity-os-static-v1'||(key.startsWith('neo-public-shell-')&&key!==SHELL)).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  if(event.request.method!=='GET'||url.origin!==self.location.origin)return;
  if(ASSETS.includes(url.pathname)) {event.respondWith(caches.match(url.pathname).then(cached=>cached||fetch(event.request)));return;}
  if(event.request.mode==='navigate' && !url.pathname.startsWith('/api/'))event.respondWith(fetch(event.request).catch(()=>caches.match('/offline.html')));
});
