/* FirstRoll · service worker: сайт открывается без сети.
   Страницы — сначала сеть, без сети — сохранённая копия. Остальное (скрипты, стили, шрифты, статьи) — из кэша,
   с тихим обновлением в фоне. Любой адрес /codex/… отдаёт приложение Кодекса (оно само читает адрес).
   Меняя список ядра, увеличь VER. */
const VER = 'fr-v4';
const ROOT = new URL('./', self.location).pathname;
const CORE = ['', 'index.html', 'start/', 'codex/', 'shared/tokens.css', 'shared/site.css', 'shared/tips.css', 'shared/site.js', 'shared/icons.js',
  'shared/codex.js', 'shared/tips.js', 'shared/sheet.css', 'shared/sheet.js', 'start/start.css', 'codex/app.js', 'codex/codex.css', 'codex/sections.js', 'codex/load.js', 'start/start.js', 'manifest.webmanifest',
  'forge/', 'forge/sheet.html', 'forge/load.html', 'forge/assets/css/app.css', 'forge/assets/css/sheet.css', 'forge/assets/js/core.js', 'forge/assets/js/rules.js',
  'forge/assets/js/tips.js', 'forge/assets/js/builder.js', 'forge/assets/js/sheet.js', 'forge/assets/js/sheetdata.js', 'forge/assets/js/forge-site.js', 'shared/forge-bridge.js'].concat(
  ['config', 'common', 'equipment', 'spells', 'races', 'options', 'feats', 'backgrounds', 'classes'].map((n) => 'forge/data/' + n + '.js'));

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VER).then((c) => Promise.all(CORE.map((u) => c.add(ROOT + u).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VER).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

const put = (req, res) => { if (res && (res.ok || res.type === 'opaque')) { const copy = res.clone(); caches.open(VER).then((c) => c.put(req, copy)); } return res; };

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const fonts = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (url.origin !== location.origin && !fonts) return;

  if (req.mode === 'navigate') {
    // /codex/что-угодно → приложение Кодекса (без круга через 404.html)
    const codex = url.pathname.startsWith(ROOT + 'codex/') && !/\.[a-z0-9]+$/i.test(url.pathname);
    const target = codex ? new Request(ROOT + 'codex/') : req;
    const page = fetch(target).then((r) => put(target, r)).catch(() => caches.match(target).then((r) => r || caches.match(ROOT)));
    // глубокий адрес Кодекса: сразу вписываем <base>, чтобы браузер не искал стили и скрипты от /codex/cond/
    e.respondWith(!codex || url.pathname === ROOT + 'codex/' ? page : page.then((r) => r.text().then((t) =>
      new Response(t.replace('<head>', '<head><base href="' + ROOT + 'codex/">'), { headers: { 'Content-Type': 'text/html; charset=utf-8' } }))));
    return;
  }
  e.respondWith(caches.match(req).then((hit) => {
    const net = fetch(req).then((r) => put(req, r)).catch(() => hit);
    return hit || net;
  }));
});
