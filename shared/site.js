/* FirstRoll · общая оболочка сайта (макет Claude Design «Общий макет v1»).
   Страница объявляет себя так: <body data-section="hub|codex|start|forge|me" data-root="../">
   и ставит пустые <header id="site-head"> и <footer id="site-foot">. FR.site.init() дорисует шапку, подвал,
   тему, меню разделов (телефон), офлайн-полосу, статус Стола, окно «Установить» и service worker.
   Поиск даёт сама страница: FR.site.onSearch = (q) => …  (кнопка поиска и клавиша «/»).
   Свои кнопки раздела в шапке — FR.site.headExtra (HTML перед кнопкой темы), в меню телефона — FR.site.menuExtra. */
(function () {
  const FR = window.FR = window.FR || {};
  const S = FR.site = { onSearch: null };
  const B = document.body, D = document;
  const file = location.protocol === 'file:';
  const onStol = !file && (/^stol\./.test(location.hostname) || location.pathname.indexOf('/fr/') === 0);
  /* Публичная версия (first-roll.ru): без Стола и «Моего персонажа». Здесь всегда false — true ставит сборка tools/publish.js */
  const PUBLIC = true;
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  S.esc = esc; S.file = file; S.onStol = onStol; S.public = PUBLIC;
  /* Постоянного адреса у Стола нет (временный Cloudflare tunnel, адрес меняется при каждом запуске): «К столу» есть только на страницах,
     открытых через сам Стол; с диска и на публичном сайте этой ссылки нет */
  const noStol = PUBLIC || !onStol;

  /* ── адреса частей сайта ── */
  S.root = () => B.dataset.root || './';
  S.href = function (part) {
    const r = S.root();
    if (part === 'hub') return file ? r + 'index.html' : r;
    if (part === 'start') return r + 'start/' + (file ? 'index.html' : '');
    if (part === 'codex') return r + 'codex/' + (file ? 'index.html' : '');
    if (part === 'forge') return r + 'forge/' + (file ? 'index.html' : '');
    if (part === 'stol') return '/';
    return r;
  };
  S.brandSrc = (name) => S.root() + 'shared/brand/' + name + '-' + S.theme() + '.svg';

  /* ── тема (общий ключ с Кузницей) ── */
  S.theme = () => D.documentElement.getAttribute('data-theme') || 'light';
  S.toggleTheme = function () {
    const nx = S.theme() === 'dark' ? 'light' : 'dark';
    D.documentElement.setAttribute('data-theme', nx);
    try { localStorage.setItem('kh-theme', JSON.stringify(nx)); } catch (e) {}
    D.querySelectorAll('img[data-brand]').forEach((i) => { i.src = S.brandSrc(i.dataset.brand); });
    D.dispatchEvent(new CustomEvent('fr-theme', { detail: nx }));
  };

  /* ── значки шапки ── */
  const SV = {
    theme: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 0 16Z" fill="currentColor"/></svg>',
    search: (n) => `<svg width="${n}" height="${n}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg>`,
    menu: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>'
  };
  S.svg = SV;

  const SUB = { codex: ['Кодекс знаний', 'codex-mark'], start: ['Первые шаги', 'fr-mark'], forge: ['Кузница героев', 'forge-mark'], me: ['Мой персонаж', 'fr-mark'], hub: ['', 'fr-mark'] };
  S.menuExtra = '';     // дополнительная часть меню (разделы Кодекса, «По коду» Кузницы) — задаёт страница
  S.headExtra = '';     // свои кнопки раздела в шапке («Сохранено», «Загрузить по коду») — задаёт страница

  function header() {
    const el = D.getElementById('site-head'); if (!el) return;
    const sec = B.dataset.section || 'hub', sub = SUB[sec] || SUB.hub;
    el.className = 'site-head';
    const nav = [['start', 'Первые шаги'], ['codex', 'Кодекс знаний'], ['forge', 'Кузница героев'], ['stol', 'К столу']].filter(([k]) => !(noStol && k === 'stol'));
    const hub = sec === 'hub';
    el.innerHTML =
      `<a class="brand${sub[0] ? '' : ' is-solo'}" href="${esc(S.href('hub'))}" aria-label="FirstRoll — на главную"><img data-brand="${sub[1]}" src="${esc(S.brandSrc(sub[1]))}" alt="">` +
      `<span class="brand-t"><b>FirstRoll</b>${sub[0] ? `<small>${sub[0]}</small>` : ''}</span></a>` +
      (hub ? '' : `<nav class="site-nav" aria-label="Части сайта">${nav.map(([k, t]) =>
        `<a href="${esc(S.href(k))}"${k === sec ? ' class="on" aria-current="page"' : ''}>${k === 'stol' ? '<span class="dot" data-stol-dot></span>' : ''}${t}</a>`).join('')}</nav>`) +
      (S.onSearch ? `<button class="head-search" type="button" data-search>${SV.search(18)}<span>Поиск по Кодексу</span><kbd>/</kbd></button>` : '') +
      `<div class="head-btns">${S.headExtra || ''}` +
      (S.onSearch ? `<button class="hbtn is-mob s-btn" type="button" aria-label="Поиск" data-search>${SV.search(20)}</button>` : '') +
      (hub ? '' : `<button class="hbtn is-mob" type="button" aria-label="Разделы" data-menu>${SV.menu}</button>`) +
      `<button class="hbtn" type="button" aria-label="Сменить тему" data-theme-btn>${SV.theme}</button></div>`;
    el.addEventListener('click', (e) => {
      if (e.target.closest('[data-theme-btn]')) S.toggleTheme();
      else if (e.target.closest('[data-search]')) S.onSearch && S.onSearch('');
      else if (e.target.closest('[data-menu]')) S.menu();
    });
  }

  /* меню разделов на телефоне */
  S.menu = function () {
    const sec = B.dataset.section;
    const I = FR.icons;
    const nav = [['start', 'Первые шаги', 'guide'], ['codex', 'Кодекс знаний', 'rule'], ['forge', 'Кузница героев', 'class'], ['stol', 'К столу', 'd20']].filter(([k]) => !(noStol && k === 'stol'));
    const ov = D.createElement('div'); ov.className = 'menu-sheet';
    ov.innerHTML = `<div role="dialog" aria-label="Разделы"><span class="grab"></span>` +
      nav.map(([k, t, i]) => `<a href="${esc(S.href(k))}"${k === sec ? ' class="on"' : ''}>${I ? I.svg(i) : ''}${t}${k === 'stol' ? `<small class="ms-st${S.stol && S.stol.open ? ' on' : ''}">${S.stol && S.stol.open ? '● открыт' : 'закрыт'}</small>` : ''}</a>`).join('') + (S.menuExtra || '') +
      `<button type="button" class="ms-theme" data-theme-btn>${SV.theme}<span>${S.theme() === 'dark' ? 'Светлая тема' : 'Тёмная тема'}</span></button></div>`;
    const close = () => { ov.remove(); D.removeEventListener('keydown', key); };
    const key = (e) => { if (e.key === 'Escape') close(); };
    ov.addEventListener('click', (e) => {
      if (e.target.closest('[data-theme-btn]')) { S.toggleTheme(); close(); return; }
      if (e.target === ov || e.target.closest('a')) close();
    });
    D.addEventListener('keydown', key);
    B.appendChild(ov);
  };

  const FOOT = {
    hub: 'Сайт для своих. Правила — по SRD 5.1 от Wizards of the Coast, лицензия CC BY 4.0.',
    forge: 'Правила — D&amp;D 5e, редакция 2014 (Книга игрока, Побережье Мечей, Занатар, Таша и книги рас Фаэруна). Описания — краткий пересказ; часть материалов — SRD 5.1, CC BY 4.0.',
    codex: 'Часть материалов — System Reference Document 5.1 от Wizards of the Coast, лицензия CC BY 4.0. Остальное — своими словами по «Книге игрока».',
    start: 'Термины в тексте открывают подсказки из Кодекса знаний. Часть материалов — SRD 5.1, CC BY 4.0.',
    me: 'Снимок листа после сессии: меняется только за столом. Нажми на число — покажу, из чего оно сложено.'
  };
  function footer() {
    const el = D.getElementById('site-foot'); if (!el) return;
    el.className = 'site-foot';
    el.innerHTML = `<div class="orn3" aria-hidden="true"><span>◆◆◆</span></div><p>${FOOT[B.dataset.section] || FOOT.hub}</p>`;
  }

  /* ── Стол: жив ли ── */
  S.stol = null;   // null — ещё проверяем; { open, campaign }
  S.pingStol = function () {   // Стол «жив» только там, где страница открыта через него самого (постоянного адреса нет)
    S.stol = onStol ? { open: true, campaign: '' } : { open: false };
    return Promise.resolve(S.stol).then((st) => { paint(); return st; });   // после текущего скрипта: страницы подписываются на fr-stol после FR.site.init()
  };
  function paint() {
    D.querySelectorAll('[data-stol-dot]').forEach((d) => { d.classList.toggle('on', !!(S.stol && S.stol.open)); d.parentNode.classList.toggle('is-live', !!(S.stol && S.stol.open)); });
    D.dispatchEvent(new CustomEvent('fr-stol', { detail: S.stol }));
  }

  /* ── офлайн ── */
  function offline() {
    let bar = null;
    const show = () => {
      if (navigator.onLine) { if (bar) { bar.remove(); bar = null; } return; }
      if (bar) return;
      let saved = ''; try { saved = localStorage.getItem('fr-saved-at') || ''; } catch (e) {}
      bar = D.createElement('div'); bar.className = 'offline-bar'; bar.setAttribute('role', 'status');
      bar.innerHTML = `<span class="o"></span><span><b>Нет сети</b> — показана сохранённая версия${saved ? `<span class="muted"> · сохранено ${esc(saved)}</span>` : ''}</span><button type="button">Обновить</button>`;
      bar.querySelector('button').onclick = () => location.reload();
      const h = D.getElementById('site-head'); h && h.after(bar);
    };
    addEventListener('online', show); addEventListener('offline', show); show();
    if (navigator.onLine) try { localStorage.setItem('fr-saved-at', new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })); } catch (e) {}
  }

  /* ── установка как приложение ── */
  let deferred = null;
  addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e; });
  const STEPS = {
    ios: [['Открой сайт в ', 'Safari', ' — в других браузерах iPhone так не умеет.'], ['Нажми ', 'Поделиться ⬆', ' внизу экрана.'], ['Выбери ', 'На экран «Домой»', ', затем «Добавить».']],
    android: [['Открой меню ', '⋮', ' в правом верхнем углу Chrome.'], ['Выбери ', 'Установить приложение', ' (или «Добавить на главный экран»).'], ['Подтверди ', 'Установить', ' — значок появится среди приложений.']]
  };
  S.install = function () {
    if (deferred) { deferred.prompt(); deferred.userChoice.finally(() => { deferred = null; }); return; }
    let os = /iphone|ipad|ipod|macintosh/i.test(navigator.userAgent) && 'ontouchend' in D ? 'ios' : 'android';
    const ov = D.createElement('div'); ov.className = 'dlg-ov';
    const draw = () => {
      ov.innerHTML = `<div class="dlg" role="dialog" aria-modal="true" aria-label="Установить как приложение">
        <div class="dlg-head"><span class="app"><img src="${esc(S.brandSrc('fr-mark'))}" alt=""></span><div><b>Установить FirstRoll</b><span>Значок на главном экране, Кодекс и снимок листа — без сети.</span></div></div>
        <div class="seg2" role="tablist">${[['ios', 'iPhone'], ['android', 'Android']].map(([k, t]) => `<button type="button" role="tab" data-os="${k}"${k === os ? ' class="on" aria-selected="true"' : ''}>${t}</button>`).join('')}</div>
        <ol>${STEPS[os].map(([a, b, c], i) => `<li><i>${i + 1}</i><span>${a}<b>${b}</b>${c}</span></li>`).join('')}</ol>
        <div class="dlg-btns"><button class="btn btn-ghost" type="button" data-x>Не сейчас</button><button class="btn btn-accent" type="button" data-x>Понятно</button></div></div>`;
    };
    const close = () => { ov.remove(); D.removeEventListener('keydown', key); };
    const key = (e) => { if (e.key === 'Escape') close(); };
    ov.addEventListener('click', (e) => {
      const t = e.target.closest('[data-os]'); if (t) { os = t.dataset.os; draw(); return; }
      if (e.target === ov || e.target.closest('[data-x]')) close();
    });
    D.addEventListener('keydown', key);
    draw(); B.appendChild(ov); ov.querySelector('[data-x]:last-child').focus();
  };
  D.addEventListener('click', (e) => { if (e.target.closest('[data-install]')) { e.preventDefault(); S.install(); } });

  /* ── тост ── */
  S.toast = function (msg) {
    const t = D.createElement('div'); t.className = 'fr-toast'; t.setAttribute('role', 'status'); t.textContent = msg;
    B.appendChild(t); setTimeout(() => t.remove(), 2200);
  };
  S.copy = function (text, msg) {
    const ok = () => S.toast(msg || 'Ссылка скопирована');
    if (navigator.clipboard && isSecureContext) navigator.clipboard.writeText(text).then(ok, () => prompt('Скопируй ссылку', text));
    else { const ta = D.createElement('textarea'); ta.value = text; B.appendChild(ta); ta.select(); try { D.execCommand('copy'); ok(); } catch (e) {} ta.remove(); }
  };

  /* «/» — поиск с любой страницы */
  D.addEventListener('keydown', (e) => {
    if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey || !S.onSearch) return;
    const t = e.target; if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    e.preventDefault(); S.onSearch('');
  });

  /* service worker: только на сайте (не с диска и не на Столе) */
  function sw() {
    if (file || onStol || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register(S.root() + 'sw.js').catch(() => {});
  }

  S.init = function () {
    header(); footer(); offline(); sw();
    S.pingStol();
  };
})();
