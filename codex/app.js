/* Кодекс знаний · сайт-читалка (макеты Claude Design «Главная кодекса», «Раздел кодекса», «Статья кодекса», «Поиск»,
   «Служебные состояния»). Одностраничное приложение без сборки.
   Адреса: на сайте — /codex/, /codex/rules/, /codex/cond/poisoned#effects (GitHub Pages — через 404.html, Стол — /fr/codex/…);
   с диска — index.html, index.html?rules, index.html?cond/poisoned#effects.
   Мастерское (vis:'dm', блоки {#id dm}, Бестиарий): ?dm=1 включает на этом устройстве, ?dm=0 — выключает. */
(function () {
  const FR = window.FR, C = FR.codex, S = FR.site, I = FR.icons, esc = C.esc;
  const SECS = FR.codexSections, PL = FR.codexPlural;
  const D = document, app = D.getElementById('app');
  const file = location.protocol === 'file:';
  const store = { get(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* без хранилища */ } } };

  /* ───── мастер ───── */
  const dmParam = /[?&]dm=([01])/.exec(location.search);
  if (dmParam) store.set('fr-codex-dm', dmParam[1] === '1');
  FR.config.dm = !S.public && (!!store.get('fr-codex-dm', false) || (S.onStol && /^(localhost|127\.|\[::1\])/.test(location.hostname)));   // на ноутбуке мастера — сразу; в публичной версии мастерского нет
  if (S.public) SECS.forEach((s) => { if (s.dm) s.hidden = true; });   // публичная версия: разделов мастера (Бестиарий) нет совсем
  const visible = (a) => a && a.kind !== 'calc' && a.vis !== 'hidden' && (a.vis !== 'dm' || FR.config.dm);
  /* Хоумбрю (id «hb:…», codex/data/homebrew): скрыто, пока мастер не откроет. Открывать и переносить предметы кампании
     можно только на ноутбуке мастера через Стол (API /api/dm/codex/homebrew). */
  const isHb = (a) => /^hb:/.test(a.id);
  const canEdit = S.onStol && !S.public && /^(localhost|127\.|\[::1\])/.test(location.hostname);

  /* ───── адреса ───── */
  let BASE = '';
  if (!file) { const p = location.pathname, i = p.indexOf('/codex/'); BASE = i >= 0 ? p.slice(0, i + 7) : '/codex/'; }
  const SITE = file ? '../' : BASE.replace(/codex\/$/, '');
  FR.config.codexUrl = file ? 'index.html?{kind}/{id}' : BASE + '{kind}/{id}';
  FR.config.kindUrl = Object.assign(FR.config.kindUrl || {}, { guide: SITE + 'start/' + (file ? 'index.html' : '') + '#{id}' });
  const U = {
    home: () => file ? 'index.html' : BASE,
    sec: (k) => k === 'start' ? SITE + 'start/' + (file ? 'index.html' : '') : file ? 'index.html?' + k : BASE + k + '/',
    art: (a, b) => C.url(a.kind + ':' + a.id + (b ? '#' + b : '')),
    abs: (u) => new URL(u, location.href).href
  };

  function route() {
    let path;
    if (file) path = decodeURIComponent(location.search.slice(1)).replace(/(^|&)dm=[01]/, '');
    else {
      path = decodeURIComponent(location.pathname.slice(BASE.length));
      const p = new URLSearchParams(location.search).get('p');      // пришли через 404.html
      if (p) { path = p.replace(/^\//, ''); history.replaceState(null, '', BASE + p.replace(/^\//, '') + location.hash); }
    }
    path = path.replace(/^\/+|\/+$/g, '');
    if (!path) return { page: 'home', key: 'home' };
    const [a, b] = path.split('/');
    if (!b) { const sec = SECS.find((s) => s.key === a && !s.external); return sec ? { page: 'section', sec, key: 's:' + a } : { page: '404', path, key: '404' }; }
    const atom = C.get(a, b);
    if (atom && atom.kind === 'guide') { location.replace(C.url('guide:' + atom.id)); return { page: 'wait', key: 'wait' }; }
    return visible(atom) ? { page: 'article', atom, key: a + ':' + b } : { page: '404', path, key: '404' };
  }

  /* ───── раскладка статей по разделам и группам ───── */
  const PLACE = new Map(), LISTS = {};
  (function place() {
    const all = C.all().filter(visible).sort((x, y) => x.name.localeCompare(y.name, 'ru'));
    const lists = SECS.filter((s) => s.groups);
    lists.forEach((s) => { LISTS[s.key] = s.groups.map((g) => ({ t: g.t, s: g.s, items: [] })); });
    for (const s of lists) s.groups.forEach((g, gi) => (g.ids || []).forEach((k) => {
      const a = C.get(k); if (!visible(a) || PLACE.has(k)) return;
      PLACE.set(k, { sec: s, g: gi }); LISTS[s.key][gi].items.push(a);
    }));
    for (const a of all) {
      const k = a.kind + ':' + a.id; if (PLACE.has(k)) continue;
      for (const s of lists) {
        const gi = s.groups.findIndex((g) => g.test && g.test(a));
        if (gi >= 0) { PLACE.set(k, { sec: s, g: gi }); LISTS[s.key][gi].items.push(a); break; }
        if (s.owns && s.owns(a)) { PLACE.set(k, { sec: s, g: -1 }); break; }
      }
    }
    // порядок внутри групп: где keep — как в данных; заклинания — по кругу
    lists.forEach((s) => s.groups.forEach((g, gi) => {
      const it = LISTS[s.key][gi].items;
      if (g.keep) it.sort((x, y) => C.all().indexOf(x) - C.all().indexOf(y));
      if (s.view === 'spell') it.sort((x, y) => (x.lvl || 0) - (y.lvl || 0) || x.name.localeCompare(y.name, 'ru'));
    }));
    lists.forEach((s) => { LISTS[s.key] = LISTS[s.key].filter((g) => g.items.length); });
  })();
  const secCount = (s, only) => s.count ? s.count(C) : (LISTS[s.key] || []).reduce((n, g) => n + g.items.length, 0) +
    (s.more && !only ? secCount(SECS.find((x) => x.key === s.more.key)) : 0);   // «Магия» считается вместе с заклинаниями

  /* ───── мелочи ───── */
  const plural = (n, a, b, c) => { const m10 = n % 10, m100 = n % 100; return n + ' ' + (m10 === 1 && m100 !== 11 ? a : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? b : c); };
  const arts = (n) => plural(n, 'статья', 'статьи', 'статей');
  const REF = /\[\[([a-z]+):([^\]|#]+)(?:#([^\]|]+))?(?:\|([^\]]+))?\]\]/g;
  const plain = (s) => String(s || '').replace(/(^|\n)\s*(?:[-*]|\d+\.)\s+/g, ' ').replace(/\s+/g, ' ').trim().replace(REF, (_, k, id, b, lab) => { if (lab) return lab; const r = C.resolve(k + ':' + id + (b ? '#' + b : '')); return r ? C.word(r) : id; })
    .replace(/\*\*(.+?)\*\*/g, '$1').replace(/(^|\W)\*(.+?)\*/g, '$1$2');
  const ico = (n, cls) => I ? I.svg(n, cls) : '';
  const aIco = (a) => I ? I.forAtom(a) : '';
  const isCond = (a) => a && a.kind === 'cond';
  const crumbs = (list, last) => `<nav class="cx-crumbs" aria-label="Путь">${list.map(([h, t]) => `<a href="${esc(h)}">${esc(t)}</a><span aria-hidden="true">›</span>`).join('')}<span class="cur">${esc(last)}</span></nav>`;
  const orn = (w) => `<div class="orn" aria-hidden="true"${w ? ` style="width:${w}"` : ''}><span>◆</span></div>`;
  const lock = (n) => ico('dm', n ? 'ico-' + n : '');
  const secOf = (a) => { const p = PLACE.get(a.kind + ':' + a.id); return p ? p.sec : null; };
  const secChip = (s) => `<a class="chip has-ico${s.dm ? ' is-dm' : ''}${s.icon === 'cond' ? ' is-cond' : ''}" href="${esc(U.sec(s.key))}">${ico(s.dm ? 'dm' : s.icon)}${esc(s.title)}</a>`;
  const popularChips = (cls) => FR.codexPopular.map((k) => C.get(k)).filter(visible).map((a) => {
    const i = a.kind === 'cond' ? ico('cond') : a.kind === 'action' ? ico('cost-action') : '';
    return `<a class="chip${cls ? ' ' + cls : ''}${i ? ' has-ico' : ''}${isCond(a) ? ' is-cond' : ''}" href="${esc(U.art(a))}">${i}${esc(a.kind === 'cond' || a.kind === 'rule' ? a.name.toLowerCase().replace(/^сл /, 'Сл ') : a.name)}</a>`;
  }).join('');
  const recent = { get: () => store.get('fr-codex-recent', []).map((k) => C.get(k)).filter(visible),
    add: (a) => { const k = a.kind + ':' + a.id; store.set('fr-codex-recent', [k].concat(store.get('fr-codex-recent', []).filter((x) => x !== k)).slice(0, 12)); } };
  const kindLabel = (a) => {
    if (a.kind === 'spell') return a.lvl ? 'Заклинание · ' + a.lvl + ' круг' : 'Заклинание · заговор';
    if (a.kind === 'item' && a.rarity) return 'Магический предмет';
    return C.kinds[a.kind] || a.kind;
  };
  const badges = (a) => (a.src ? `<span class="badge">${esc(a.src)}${a.pg ? ' · с. ' + esc(String(a.pg).split(/[,–-]/)[0]) : ''}</span>` : '') +
    (a.vis === 'dm' ? `<span class="badge dm">${lock()}Только мастер</span>` : '') + (isHb(a) ? `<span class="badge">Хоумбрю${a.camp ? ' · ' + esc(a.camp) : ''}</span>` : '');

  /* ───── главная ───── */
  function home() {
    D.title = 'Кодекс знаний · FirstRoll';
    const total = C.all().filter((a) => visible(a) && a.kind !== 'guide').length;
    const tiles = SECS.filter((s) => !s.hidden).map((s) => {
      const n = secCount(s);
      const count = s.dm && !FR.config.dm ? 'Только мастер' : s.unit ? plural(n, ...s.unit) : arts(n);
      return `<a class="cx-tile${s.dm ? ' is-dm' : ''}" href="${esc(U.sec(s.key))}">${s.dm ? `<span class="cx-tile-lock">${lock()}</span>` : ''}
        <span class="round-ico${s.icon === 'cond' ? ' is-cond' : ''}">${ico(s.icon)}</span><b>${esc(s.title)}</b><span class="cx-tile-t">${esc(s.text)}</span><span class="cx-tile-n">${esc(count)}</span></a>`;
    }).join('');
    const rec = recent.get().slice(0, 4);
    app.innerHTML = `<div class="cx-home">
      <section class="cx-hero">
        <p class="eyebrow">D&amp;D 5e · ${esc(arts(total))}</p>
        <h1 class="h-display">Кодекс знаний</h1>
        <p class="lead">Правила своими словами. Любой термин в тексте раскрывается подсказкой — прямо за столом.</p>
        <button class="cx-bigsearch" type="button" data-search>${S.svg.search(22)}<span class="d">Например: помеха, отравлен, укрытие, КД</span><span class="m">Помеха, отравлен, КД…</span><kbd>/</kbd></button>
        ${orn('200px')}
      </section>
      <section class="cx-sec"><p class="eyebrow">Разделы</p><div class="cx-tiles">${tiles}</div></section>
      <section class="cx-two">
        <div class="cx-sec"><p class="eyebrow">Чаще всего ищут за столом</p><div class="chips">${popularChips()}</div></div>
        <div class="cx-sec cx-recent"><div class="cx-row"><p class="eyebrow">Ты недавно смотрел</p>${rec.length ? '<button class="cx-link" type="button" data-clear>Очистить</button>' : ''}</div>
          ${rec.length ? `<div class="cx-rlist">${rec.map((a) => `<a class="cx-r${isCond(a) ? ' is-cond' : ''}" href="${esc(U.art(a))}">${aIco(a)}<span><span class="cx-rn"><b>${esc(a.name)}</b><small>${esc(C.kinds[a.kind] || '')}</small>${a.src === 'hb' || a.camp ? `<span class="badge">${esc(a.camp || 'Кампания')}</span>` : ''}</span><span class="cx-rs">${esc(plain(a.summary))}</span></span></a>`).join('')}</div>`
            : `<div class="empty"><div class="orn3" style="width:140px" aria-hidden="true"><span>◆◆◆</span></div>Здесь появятся статьи, которые ты открывал в этом браузере.</div>`}
        </div>
      </section>
      <section class="install"><img data-brand="fr-mark" src="${esc(S.brandSrc('fr-mark'))}" alt=""><div><b>Установить как приложение</b><span>Кодекс откроется без сети — даже в подвале таверны.</span></div><button class="btn" type="button" data-install>Установить</button></section>
    </div>`;
    const cl = app.querySelector('[data-clear]'); if (cl) cl.onclick = () => { store.set('fr-codex-recent', []); home(); };
  }

  /* ───── раздел ───── */
  const ST = {};   // состояние фильтров раздела
  function section(sec) {
    D.title = sec.title + ' · Кодекс знаний';
    const st = ST[sec.key] = ST[sec.key] || { f: 'all', q: '', conc: false, ritual: false, school: '', cls: '', time: '' };
    const parent = sec.parent && SECS.find((s) => s.key === sec.parent);
    const n = secCount(sec);
    const locked = sec.dm && !FR.config.dm;
    app.innerHTML = `<div class="cx-section">
      <section class="cx-shead">
        ${crumbs([[U.home(), 'Кодекс знаний']].concat(parent ? [[U.sec(parent.key), parent.title]] : []), sec.title)}
        <div class="cx-shero"><div class="cx-sh-l"><span class="round-ico${sec.icon === 'cond' ? ' is-cond' : ''}">${ico(sec.icon)}</span>
          <div><p class="eyebrow cx-eb">Раздел · ${esc(arts(n))}${sec.dm ? `<span class="badge dm">${lock()}Только мастер</span>` : ''}</p>
          <h1 class="h-display">${esc(sec.title)}</h1><p class="lead">${esc(sec.intro)}</p></div></div>
          ${sec.print ? `<button class="btn cx-print" type="button" data-print><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M7 9V3h10v6M7 17H4v-7h16v7h-3M7 14h10v7H7z"/></svg>Шпаргалка A4</button>` : ''}
        </div>${orn()}
      </section>
      ${locked ? '' : `<section class="cx-tools"><label class="cx-filter">${S.svg.search(18)}<input type="search" placeholder="${esc(sec.search || 'Искать в разделе')}" value="${esc(st.q)}" aria-label="Фильтр раздела"></label><div class="cx-chips" id="chips"></div></section>`}
      <div id="list"></div>
      ${sec.more ? `<a class="cx-more" href="${esc(U.sec(sec.more.key))}">${ico(sec.more.icon || 'spell')}<span><b>${esc(sec.more.title)}</b><small>${esc(sec.more.text)} · ${esc(arts(secCount(SECS.find((s) => s.key === sec.more.key))))}</small></span><i>→</i></a>` : ''}
      <section class="cx-others"><p class="eyebrow">Другие разделы</p><div class="chips">${SECS.filter((s) => s.key !== sec.key && !s.hidden && !(sec.parent === s.key)).map(secChip).join('')}</div></section>
    </div>`;
    const pr = app.querySelector('[data-print]'); if (pr) pr.onclick = () => { st.f = 'all'; st.q = ''; draw(); setTimeout(() => print(), 50); };
    const inp = app.querySelector('.cx-filter input'); if (inp) inp.addEventListener('input', () => { st.q = inp.value; draw(); });
    draw();

    function draw() {
      const list = D.getElementById('list'), chipsEl = D.getElementById('chips');
      if (locked) { list.innerHTML = dmNote('Раздел виден только мастеру — после входа мастера на Столе. Игроки видят монстра, только когда ты его покажешь.'); return; }
      const groups = LISTS[sec.key] || [];
      const q = C.norm(st.q).trim();
      const hit = (a) => !q || C.norm(a.name).includes(q) || C.norm(a.en).includes(q) || C.norm(plain(a.summary)).includes(q);
      const chip = (label, key, cnt) => `<button class="chip${st.f === key ? ' on' : ''}" type="button" data-f="${esc(key)}">${st.f === key ? '<span>✓</span>' : ''}${esc(label)}${cnt != null ? `<span class="n">${cnt}</span>` : ''}</button>`;
      let chips = '', html = '';
      if (sec.view === 'list') {
        if (groups.length > 1) chips = chip('Все', 'all') + groups.map((g, i) => chip(g.s, 'g' + i, g.items.length)).join('');
        const gs = groups.map((g, i) => ({ g, i, items: g.items.filter(hit) })).filter((x) => x.items.length && (st.f === 'all' || st.f === 'g' + x.i));
        html = gs.map(({ g, items }) => `<section class="cx-group"><div class="cx-gh"><h2>${esc(g.t)}</h2><span>${esc(arts(items.length))}</span></div>
          <div class="cx-li-grid">${items.map((a) => `<a class="cx-li" href="${esc(U.art(a))}"><span class="cx-li-n"><b>${esc(a.name)}</b>${a.en ? `<i>${esc(a.en)}</i>` : ''}</span><span class="cx-li-s">${esc(plain(a.summary))}</span></a>`).join('')}</div></section>`).join('');
      }
      if (sec.view === 'memo') {
        const all = groups.length ? groups[0].items : [];
        chips = chip('Все', 'all', all.length) + chip('Тяжёлые', 'heavy', all.filter((a) => sec.heavy.includes(a.id)).length) + chip('Мешают атаковать', 'atk', all.filter((a) => sec.hurtsAttack.includes(a.id)).length);
        const items = all.filter(hit).filter((a) => st.f === 'all' || (st.f === 'heavy' && sec.heavy.includes(a.id)) || (st.f === 'atk' && sec.hurtsAttack.includes(a.id)));
        const heavyTag = '<span class="cx-heavy">Тяжёлое</span>';
        html = `<div class="cx-memo-grid">${items.map((a) => { const h = sec.heavy.includes(a.id); return `<a class="cx-memo${h ? ' is-heavy' : ''}" href="${esc(U.art(a))}">
          <span class="cx-memo-top">${ico('cond')}${h ? heavyTag : ''}</span><span class="cx-memo-b"><span class="cx-memo-n"><b lang="ru">${esc(a.name)}</b>${h ? heavyTag : ''}</span><span class="cx-memo-s">${esc(plain(a.summary))}</span></span></a>`; }).join('')}</div>
          <div class="cx-memo-note"><span></span>Тяжёлые состояния почти выводят персонажа из боя: по нему легко попасть, а вблизи каждое попадание — критическое.</div>`;
      }
      if (sec.view === 'spell') html = spells(sec, st, hit, (c) => { chips = c; });
      if (sec.view === 'mon') html = mons(sec, st, hit, (c) => { chips = c; });
      if (sec.hb && FR.config.dm && sec.view !== 'mon') html = dmNote('Ты видишь всё хоумбрю; игроки — только открытые статьи. Открыть статью — кнопка «Открыть игрокам» в ней (на ноутбуке, через Стол) или <code>node tools/homebrew.js open вид:hb:id</code>.') + html;
      if (!html.replace(/<[^>]+>/g, '').trim()) html += `<div class="empty">${q ? `По запросу «${esc(st.q)}» в разделе ничего нет.` : sec.hb ? 'Мастер пока ничего не открыл.' : 'В этом разделе пока пусто.'}</div>`;
      if (chipsEl) chipsEl.innerHTML = chips;
      list.innerHTML = html;
      app.querySelectorAll('[data-f]').forEach((b) => { b.onclick = () => { st.f = b.dataset.f; draw(); }; });
      app.querySelectorAll('[data-tg]').forEach((b) => { b.onclick = () => { st[b.dataset.tg] = !st[b.dataset.tg]; draw(); }; });
      app.querySelectorAll('[data-sel]').forEach((s) => { s.onchange = () => { st[s.dataset.sel] = s.value; draw(); }; });
    }
  }

  const dmNote = (t) => `<div class="cx-dm">${lock()}<span><b>Мастеру.</b> ${t}</span></div>`;
  const costOfTime = (t) => { t = String(t || '').toLowerCase(); return /бонус/.test(t) ? 'bonus' : /реакц/.test(t) ? 'reaction' : /действ/.test(t) ? 'action' : 'free'; };
  const spellClasses = (a) => { const m = /Классы:\s*(.+)/.exec(a.body || ''); return m ? plain(m[1]).split(/,\s*/).map((s) => s.trim()).filter(Boolean) : []; };

  function spells(sec, st, hit, setChips) {
    const all = (LISTS[sec.key][0] || { items: [] }).items;
    const lv = [...new Set(all.map((a) => a.lvl || 0))].sort((x, y) => x - y);
    const chip = (label, key) => `<button class="chip${st.f === key ? ' on' : ''}" type="button" data-f="${key}">${st.f === key ? '<span>✓</span>' : ''}${esc(label)}</button>`;
    setChips(chip('Все круги', 'all') + lv.map((l) => chip(l ? l + ' круг' : 'Заговоры', 'l' + l)).join(''));
    const schools = [...new Set(all.map((a) => a.school).filter(Boolean))].sort((x, y) => x.localeCompare(y, 'ru'));
    const classes = [...new Set([].concat(...all.map(spellClasses)))].sort((x, y) => x.localeCompare(y, 'ru'));
    const TIMES = { action: 'Действие', bonus: 'Бонусное', reaction: 'Реакция', free: 'Дольше' };
    const items = all.filter(hit).filter((a) => (st.f === 'all' || st.f === 'l' + (a.lvl || 0)) && (!st.conc || a.conc) && (!st.ritual || a.ritual) &&
      (!st.school || a.school === st.school) && (!st.cls || spellClasses(a).includes(st.cls)) && (!st.time || costOfTime(a.time) === st.time));
    const sel = (k, label, vals, names) => `<label class="cx-sel"><span>${label}:</span><select data-sel="${k}"><option value="">все</option>${vals.map((v) => `<option value="${esc(v)}"${st[k] === v ? ' selected' : ''}>${esc(names ? names[v] : v)}</option>`).join('')}</select></label>`;
    const tg = (k, label) => `<button class="cx-tg${st[k] ? ' on' : ''}" type="button" data-tg="${k}"><span>${st[k] ? '✓' : ''}</span>${label}</button>`;
    const mark = (a) => (a.conc ? '<span class="cx-mk" title="Концентрация">К</span>' : '') + (a.ritual ? '<span class="cx-mk" title="Ритуал">Р</span>' : '');
    return `<div class="cx-spell-bar">${sel('school', 'Школа', schools)}${sel('cls', 'Класс', classes)}${sel('time', 'Время', Object.keys(TIMES), TIMES)}${tg('conc', 'Концентрация')}${tg('ritual', 'Ритуал')}
        <span class="cx-shown">Показано ${items.length} из ${all.length}</span></div>
      <div class="cx-table cx-spells"><div class="cx-tr cx-th"><span>Название</span><span>Круг</span><span>Школа</span><span>Время</span><span>Дистанция</span><span>Комп.</span><span>Длительность</span><span>Классы</span></div>
      ${items.map((a) => `<a class="cx-tr" href="${esc(U.art(a))}"><span class="nm"><b>${esc(a.name)}</b>${mark(a)}<em>${a.lvl ? a.lvl + ' круг' : 'Заговор'}</em></span><span class="lv">${a.lvl || 'З'}</span><span>${esc(a.school || '')}</span>
        <span class="tm">${ico('cost-' + costOfTime(a.time))}${esc(a.time || '')}</span><span>${esc(a.range || '')}</span><span class="mu">${esc(a.comp || '')}</span><span class="mu">${esc(a.dur || '')}</span><span class="mu">${esc(spellClasses(a).join(', '))}</span>
        <span class="mt">${esc(a.school || '')} · ${ico('cost-' + costOfTime(a.time))}${esc(a.time || '')} · ${esc(a.range || '')}${spellClasses(a).length ? ' · ' + esc(spellClasses(a).join(', ')) : ''}</span></a>`).join('')}</div>`;
  }

  function mons(sec, st, hit, setChips) {
    const all = (LISTS[sec.key][0] || { items: [] }).items;
    const cr = (a) => { const v = String(a.cr == null ? '' : a.cr); return v.includes('/') ? eval(v) : +v; };   // eslint-disable-line no-eval
    const inB = (v) => st.f === 'all' || (st.f === 'a' && v <= 0.5) || (st.f === 'b' && v >= 1 && v <= 4) || (st.f === 'c' && v >= 5 && v <= 10) || (st.f === 'd' && v >= 11);
    const chip = (label, key) => `<button class="chip${st.f === key ? ' on' : ''}" type="button" data-f="${key}">${st.f === key ? '<span>✓</span>' : ''}${esc(label)}</button>`;
    setChips(chip('Все', 'all') + chip('ПО 0–½', 'a') + chip('ПО 1–4', 'b') + chip('ПО 5–10', 'c') + chip('ПО 11+', 'd'));
    const items = all.filter(hit).filter((a) => inB(cr(a))).sort((x, y) => cr(x) - cr(y) || x.name.localeCompare(y.name, 'ru'));
    return (sec.hb && FR.config.dm ? dmNote('Ты видишь всё хоумбрю; игроки — только открытое. Открыть монстра — кнопка «Открыть игрокам» в его статье (на ноутбуке, через Стол) или <code>node tools/homebrew.js open mon:hb:id</code>.') : '') +
      (items.length ? `<div class="cx-table cx-mons"><div class="cx-tr cx-th"><span>Монстр</span><span class="c">ПО</span><span>Тип</span><span>Размер</span><span class="c">КД</span><span class="c">Хиты</span></div>
      ${items.map((a) => `<a class="cx-tr" href="${esc(U.art(a))}"><span class="nm"><b>${esc(a.name)}</b><em>${esc([a.size, a.type].filter(Boolean).join(' '))}</em></span><span class="c"><i class="cx-cr">${esc(a.cr == null ? '—' : a.cr)}</i></span><span>${esc(a.type || '')}</span><span class="mu">${esc(a.size || '')}</span><span class="c b">${esc(a.ac || '')}</span><span class="c b">${esc(a.hp || '')}</span></a>`).join('')}</div>`
        : `<div class="empty">${sec.hb ? (FR.config.dm ? 'Своих монстров пока нет. Их пишут в codex/data/homebrew/bestiary.js (tools/homebrew.js add).' : 'Мастер пока ничего не открыл.') : 'Монстров в Кодексе пока нет: бестиарий D&D наполняется.'}</div>`);
  }

  /* ───── статья ───── */
  const ABIL = { str: 'Сила', dex: 'Ловкость', con: 'Телосложение', int: 'Интеллект', wis: 'Мудрость', cha: 'Харизма' };
  const abilLinks = (arr) => (arr || []).map((k) => C.link('abil', k, null, esc(ABIL[k] || k))).join(', ');
  const RAR = { common: 'Обычный', uncommon: 'Необычный', rare: 'Редкий', 'very rare': 'Очень редкий', legendary: 'Легендарный', artifact: 'Артефакт' };
  const TRIG = { hit: 'При попадании', use: 'Использование', passive: 'Постоянно' };
  const ARM = { light: 'Лёгкий доспех', medium: 'Средний доспех', heavy: 'Тяжёлый доспех', shield: 'Щит' };
  function facts(a) {
    const f = [];
    if (a.kind === 'spell') f.push(['Круг', a.lvl ? a.lvl + '-й' : 'Заговор'], ['Школа', esc(a.school || '—')], ['Время', esc(a.time || '—')], ['Дистанция', C.inline(a.range || '—')], ['Компоненты', esc(a.comp || '—')], ['Длительность', esc(a.dur || '—')]);
    if (a.kind === 'class') { if (a.hd) f.push(['Кость Хитов', C.inline('к' + a.hd)]); if (a.primary) f.push(['Основные', abilLinks(a.primary)]); if (a.saves) f.push(['Спасброски', abilLinks(a.saves)]); }
    if (a.kind === 'item') {
      const b = a.base ? C.get('item', a.base) : null, w = Object.assign({}, b || {}, a);
      if (a.rarity) f.push(['Редкость', esc(RAR[a.rarity] || a.rarity)], ['Настройка', a.attune ? 'Требуется' : 'Не требуется']);
      if (w.dmg) f.push(['Урон', C.inline(w.dmg) + (w.dt ? ' ' + C.link('dmg', w.dt) : '')]);
      if (w.props && w.props.length) f.push(['Свойства', w.props.map((p) => C.link('prop', p) + (p === 'thrown' && w.range ? ' ' + C.inline(w.range + ' фт') : p === 'versatile' && w.vers ? ' ' + C.inline(w.vers) : '')).join(', ')]);
      if (w.dmg && !b) f.push(['Вид', (w.cat === 'martial' ? 'Воинское' : 'Простое') + (w.use === 'ranged' ? ' дальнобойное' : ' рукопашное')]);
      if (w.ac) f.push(['Класс Доспеха', w.type === 'shield' ? C.inline('+2') : C.inline('КД ' + w.ac) + (w.dexMax === 0 ? '' : w.dexMax ? ' + Лов (макс. 2)' : ' + Лов')], ['Вид', esc(ARM[w.type] || '')]);
      if (b) f.push(['Основа', C.link('item', b.id)]);
      if (w.cost && !a.rarity) f.push(['Цена', esc(w.cost + ' зм')]);
      if (w.weight) f.push(['Вес', esc(w.weight + ' фнт')]);
    }
    return f.length ? `<div class="cx-facts">${f.map(([k, v]) => `<div><span>${esc(k)}</span><span>${v}</span></div>`).join('')}</div>` : '';
  }
  function chipsOf(a) {
    const out = [];
    if (a.kind === 'spell') {
      const c = costOfTime(a.time);
      out.push(`<span class="cx-cc on">${ico('cost-' + c)}${esc(c === 'free' ? a.time : I.COST[c])}</span>`);
      out.push(`<span class="cx-cc${a.conc ? ' gold' : ''}">${ico('conc')}${a.conc ? 'Концентрация' : 'Без концентрации'}</span>`);
      out.push(`<span class="cx-cc${a.ritual ? ' gold' : ''}">${ico('ritual')}${a.ritual ? 'Ритуал' : 'Не ритуал'}</span>`);
    } else if (a.cost && I.COST[a.cost]) out.push(`<span class="cx-cc on">${ico('cost-' + a.cost)}${esc(I.COST[a.cost])}</span>`);
    if (a.chips && a.chips.length && a.kind !== 'class') a.chips.forEach((c) => out.push(`<span class="cx-cc plain">${C.inline(c)}</span>`));
    return out.length ? `<div class="cx-ccs">${out.join('')}</div>` : '';
  }
  function extraBody(a) {
    let h = '';
    if (a.kind === 'item') {
      if (a.effects && a.effects.length) h += `<h2 id="effects">Свойства</h2><ul>${a.effects.map((e) => `<li><b>${esc(TRIG[e.trigger] || e.trigger)}.</b> ${C.inline(e.text)}</li>`).join('')}</ul>`;
      if (a.look) h += `<h2 id="look">Облик</h2><p class="cx-look">${C.inline(a.look)}</p>`;
    }
    if (FR.config.dm && a.dmNotes) h += `<aside class="dm-only cx-dmnote">${lock()}<span><b>Мастеру.</b> ${C.inline(a.dmNotes)}</span></aside>`;
    return h;
  }

  /* строки тела, которые уже показаны в карточке фактов, не повторяем */
  const DUP = { class: /^- (Кость Хитов|Главные характеристики|\[\[rule:saving-throw\|Спасброски\]\]):.*$/gm, spell: /^- Компоненты:.*$/gm };
  const dedupe = (a) => String(a.body || '').replace(DUP[a.kind] || /$^/, '').replace(/^\n+/, '');

  function article(a) {
    D.title = a.name + ' · Кодекс знаний';
    recent.add(a);
    const sec = secOf(a), parent = sec && sec.parent && SECS.find((s) => s.key === sec.parent);
    const cr = [[U.home(), 'Кодекс знаний']].concat(parent ? [[U.sec(parent.key), parent.title]] : []).concat(sec ? [[U.sec(sec.key), sec.title]] : []);
    // соседи по группе раздела → «Предыдущая / Следующая»
    let prev = null, next = null;
    if (sec && LISTS[sec.key]) {
      const flat = [].concat(...LISTS[sec.key].map((g) => g.items)), i = flat.indexOf(a);
      if (i >= 0) { prev = flat[i - 1] || null; next = flat[i + 1] || null; }
    }
    const see = (a.see || []).map((r) => C.resolve(r)).filter((r) => r && visible(r.atom));
    const back = C.backlinks(a.kind + ':' + a.id).filter((x) => visible(x) && x.kind !== 'guide');
    app.innerHTML = `<div class="cx-art-grid">
      <article class="cx-article">
        ${crumbs(cr, a.name)}
        <header class="cx-ah">
          <div class="cx-meta"><span class="tip-kind${isCond(a) ? ' is-cond' : ''}">${aIco(a)}${esc(kindLabel(a))}</span>${badges(a)}</div>
          <h1>${esc(a.name)}</h1>${a.en ? `<div class="cx-en">${esc(a.en)}</div>` : ''}${orn()}
        </header>
        ${a.summary ? `<div class="cx-lead">${C.inline(a.summary)}</div>` : ''}
        <details class="cx-toc-m" hidden><summary><span></span><i aria-hidden="true">▾</i></summary><nav></nav></details>
        ${facts(a)}${chipsOf(a)}
        ${hbBar(a)}
        <div class="fr-md cx-body">${C.md(dedupe(a))}${extraBody(a)}</div>
        ${/^SRD/.test(a.src || '') ? '<p class="cx-srd">Текст по System Reference Document 5.1 © Wizards of the Coast LLC, лицензия <a href="https://creativecommons.org/licenses/by/4.0/legalcode" target="_blank" rel="noopener">CC BY 4.0</a>.</p>' : ''}
        ${see.length || back.length ? `<div class="cx-after">
          ${see.length ? `<div><p class="eyebrow">См. также</p><div class="chips">${see.map((r) => `<a class="chip has-ico${isCond(r.atom) ? ' is-cond' : ''}" href="${esc(C.url(r.ref.kind + ':' + r.ref.id + (r.block ? '#' + r.block.id : '')))}">${aIco(r.atom)}${esc(r.block ? r.atom.name + ' › ' + r.block.title : r.atom.name)}</a>`).join('')}</div></div>` : ''}
          ${back.length ? `<div class="cx-back"><b>Где упоминается:</b> ${back.slice(0, 30).map((x) => C.link(x.kind, x.id, null, esc(x.name))).join(' · ')}${back.length > 30 ? ` · и ещё ${back.length - 30}` : ''}</div>` : ''}
        </div>` : ''}
        ${prev || next ? `<nav class="cx-pager">${prev ? `<a href="${esc(U.art(prev))}"><small>← Предыдущая</small><b>${esc(prev.name)}</b></a>` : '<span></span>'}${next ? `<a class="nx" href="${esc(U.art(next))}"><small>Следующая →</small><b>${esc(next.name)}</b></a>` : ''}</nav>` : ''}
      </article>
      <aside class="cx-aside"><nav class="cx-toc" hidden><p>В этой статье</p></nav><button class="btn cx-copy" type="button" data-copy>${ico('link')}Скопировать ссылку</button></aside>
    </div>`;
    decorate(a);
  }

  /* Хоумбрю: кому видна статья; мастеру на ноутбуке — «Открыть игрокам / Скрыть» или «В Кодекс» (предмет кампании со Ширмы) */
  function hbBar(a) {
    if (!isHb(a) || !FR.config.dm) return '';
    const shown = a.vis === 'public';
    const t = a.camp ? `<b>Предмет кампании «${esc(a.camp)}».</b> Он живёт в папке кампании, игроки знают его только по своему инвентарю. «В Кодекс» — перенести в хоумбрю Кодекса (сначала скрытым).`
      : shown ? '<b>Хоумбрю · открыто игрокам.</b> Статью видят игроки на Столе; на публичный сайт она уйдёт со следующим publish.bat.'
        : '<b>Хоумбрю · видит только мастер.</b> Игроки увидят статью, когда ты её откроешь.';
    const b = !canEdit ? '' : a.camp ? '<button class="btn" type="button" data-hb="copy">В Кодекс</button>'
      : `<button class="btn" type="button" data-hb="${shown ? 'dm' : 'public'}">${shown ? 'Скрыть от игроков' : 'Открыть игрокам'}</button>`;
    return `<div class="cx-dm cx-hb">${lock()}<span>${t}</span>${b}</div>`;
  }
  function hbWire(a) {
    const b = app.querySelector('[data-hb]'); if (!b) return;
    b.onclick = async () => {
      b.disabled = true;
      const op = b.dataset.hb === 'copy' ? { op: 'copy', id: a.id } : { op: 'vis', ref: a.kind + ':' + a.id, vis: b.dataset.hb };
      try {
        const r = await fetch('/api/dm/codex/homebrew', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(op) });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j.error || 'Стол ответил ' + r.status);
        S.toast(op.op === 'copy' ? 'Перенесено в хоумбрю Кодекса' : op.vis === 'public' ? 'Открыто игрокам' : 'Скрыто от игроков');
        setTimeout(() => location.reload(), 600);
      } catch (e) { S.toast('Не получилось: ' + e.message); b.disabled = false; }
    };
  }

  /* Оформление тела статьи: «Не путать» — врезка, блоки с «Ссылка на блок», оглавление, подсветка блока из адреса */
  function decorate(a) {
    const body = app.querySelector('.cx-body');
    body.querySelectorAll('h2').forEach((h) => {
      if (!/^Не путать/i.test(h.textContent.trim())) return;
      const box = D.createElement('aside'); box.className = 'cx-callout'; if (h.id) { box.id = h.id; h.removeAttribute('id'); }
      h.parentNode.insertBefore(box, h);
      const t = D.createElement('span'); t.className = 'cx-callout-t'; t.textContent = h.textContent; box.appendChild(t); h.remove();
      while (box.nextSibling && !/^H[23]$/.test(box.nextSibling.nodeName) && !(box.nextSibling.classList && box.nextSibling.classList.contains('dm-only'))) box.appendChild(box.nextSibling);
    });
    body.querySelectorAll('.dm-only>.dm-label').forEach((l) => { l.innerHTML = lock() + 'Мастеру'; });
    const heads = [...body.querySelectorAll('h2[id], .cx-callout[id], .dm-only[id]')].filter((h) => h.nodeName === 'H2' || h.matches('.cx-callout,.dm-only'));
    body.querySelectorAll('h2[id], h3[id]').forEach((h) => {
      const b = D.createElement('button'); b.type = 'button'; b.className = 'cx-block-link'; b.innerHTML = ico('link') + '<span>Ссылка на блок</span>';
      b.onclick = () => S.copy(U.abs(U.art(a, h.id)), 'Ссылка на блок скопирована');
      h.appendChild(b);
    });
    const title = (el) => el.matches('.cx-callout') ? el.querySelector('.cx-callout-t').textContent : el.matches('.dm-only') ? ((el.querySelector('h2,h3') || {}).textContent || 'Мастеру').replace('Ссылка на блок', '') : el.firstChild.textContent;
    if (heads.length >= 3) {
      const items = heads.map((h) => `<a href="#${esc(h.id)}" data-to="${esc(h.id)}">${esc(title(h))}</a>`).join('');
      const toc = app.querySelector('.cx-toc'); toc.hidden = false; toc.insertAdjacentHTML('beforeend', items);
      const tm = app.querySelector('.cx-toc-m'); tm.hidden = false; tm.querySelector('span').textContent = 'Содержание · ' + plural(heads.length, 'блок', 'блока', 'блоков'); tm.querySelector('nav').innerHTML = items;
      app.querySelectorAll('[data-to]').forEach((l) => { l.onclick = (e) => { e.preventDefault(); jump(l.dataset.to, true); tm.open = false; }; });
      if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((es) => {
          es.forEach((e) => { if (e.isIntersecting) app.querySelectorAll('.cx-toc [data-to]').forEach((l) => l.classList.toggle('on', l.dataset.to === e.target.id)); });
        }, { rootMargin: '-10% 0px -70% 0px' });
        heads.forEach((h) => io.observe(h));
      }
    }
    app.querySelector('[data-copy]').onclick = () => S.copy(U.abs(U.art(a)));
    hbWire(a);
    if (location.hash) jump(decodeURIComponent(location.hash.slice(1)), false);
  }
  function jump(id, push) {
    const el = D.getElementById(id); if (!el) return;
    if (push) history.replaceState(history.state, '', '#' + id);
    el.scrollIntoView({ block: 'start', behavior: push ? 'smooth' : 'auto' });
    el.classList.remove('is-flash'); void el.offsetWidth; el.classList.add('is-flash');
    if (!push && !el.querySelector('.cx-came')) { const n = D.createElement('span'); n.className = 'cx-came'; n.textContent = 'пришли по ссылке #' + id; el.appendChild(n); setTimeout(() => n.remove(), 4000); }
  }

  /* ───── 404 ───── */
  function notFound(path) {
    D.title = 'Статьи нет · Кодекс знаний';
    app.innerHTML = `<section class="cx-404">
      <div class="orn3" style="width:200px" aria-hidden="true"><span>◆◆◆</span></div>
      <p class="eyebrow">Ошибка 404</p><h1 class="h-display">Такой статьи нет</h1>
      <p class="lead">По адресу <code>${esc(file ? '?' + path : BASE + path)}</code> ничего не нашлось. Может, в ссылке опечатка или статья переехала.</p>
      <button class="cx-bigsearch sm" type="button" data-search>${S.svg.search(20)}<span class="d">Поищи по Кодексу</span><span class="m">Поищи по Кодексу</span></button>
      <p class="eyebrow">Чаще всего ищут</p><div class="chips" style="justify-content:center">${popularChips('')}</div>
      <a class="btn" href="${esc(U.home())}">На главную Кодекса</a></section>`;
  }

  /* ───── поиск ───── */
  const lev = (a, b) => { const m = a.length, n = b.length; if (Math.abs(m - n) > 2) return 9; let p = Array.from({ length: n + 1 }, (_, j) => j);
    for (let i = 1; i <= m; i++) { const c = [i]; for (let j = 1; j <= n; j++) c[j] = Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); p = c; } return p[n]; };
  function fuzzy(q) {      // опечатка: ближайшее слово из названий (1 ошибка на короткое слово, 2 — на длинное)
    const lim = q.length >= 7 ? 2 : 1; let best = null, bd = lim + 1;
    for (const a of C.all()) {
      if (!visible(a)) continue;
      for (const w of C.norm(a.name).split(/[\s,()«»-]+/)) {
        if (w.length < 3) continue;
        const d = Math.min(lev(q, w), lev(q, w.slice(0, q.length)), lev(q, w.slice(0, q.length + 1)));
        if (d < bd) { bd = d; best = w; }
      }
    }
    return bd <= lim ? best : null;
  }
  function openSearch(initial) {
    if (D.querySelector('.search-ov')) return;
    if (FR.tips) FR.tips.closeAll();
    const ov = D.createElement('div'); ov.className = 'search-ov';
    ov.innerHTML = `<div class="search-box" role="dialog" aria-modal="true" aria-label="Поиск по Кодексу">
      <div class="search-in"><button class="back" type="button" aria-label="Назад">‹</button>${S.svg.search(22)}<input type="search" autocomplete="off" spellcheck="false" placeholder="Например: помеха, отравлен, укрытие, КД" aria-label="Что найти"><button class="x" type="button" aria-label="Очистить" hidden>✕</button><kbd>Esc</kbd></div>
      <div class="search-res" role="listbox"></div>
      <div class="search-foot"><span><kbd>↑</kbd><kbd>↓</kbd> выбрать</span><span><kbd>↵</kbd> открыть</span><span><kbd>/</kbd> поиск с любой страницы</span><span class="r">ё = е, опечатки прощаются</span></div></div>`;
    D.body.appendChild(ov);
    const inp = ov.querySelector('input'), res = ov.querySelector('.search-res'), x = ov.querySelector('.x');
    if (matchMedia('(max-width: 899px)').matches) inp.placeholder = 'Помеха, отравлен, КД…';
    let sel = 0, links = [];
    const close = () => { ov.remove(); D.removeEventListener('keydown', key, true); };
    const hl = (text, q) => { const t = String(text || ''), i = C.norm(t).indexOf(q); return !q || i < 0 ? esc(t) : esc(t.slice(0, i)) + '<mark>' + esc(t.slice(i, i + q.length)) + '</mark>' + esc(t.slice(i + q.length)); };
    const remember = (q) => { if (q.trim().length > 1) store.set('fr-codex-q', [q.trim()].concat(store.get('fr-codex-q', []).filter((z) => z !== q.trim())).slice(0, 6)); };
    function draw() {
      const raw = inp.value, q = C.norm(raw).trim(); x.hidden = !raw;
      let found = q ? C.search(q).filter(visible) : [], shown = q, note = '';
      if (q && !found.length && q.length >= 4) { const f = fuzzy(q); if (f) { found = C.search(f).filter(visible); shown = f; note = `<div class="sr-note"><span>Показаны результаты для</span><b>«${esc(f)}»</b><span class="muted">· искать</span><a data-exact>«${esc(raw.trim())}»</a></div>`; } }
      if (!q) {
        const rq = store.get('fr-codex-q', []);
        res.innerHTML = (rq.length ? `<div class="sr-recent"><p class="sr-gh"><span>Ты недавно искал</span></p>${rq.map((z) => `<a data-q="${esc(z)}">${ico('clock')}${esc(z)}</a>`).join('')}</div>` : '') +
          `<div><p class="sr-gh"><span>Чаще всего ищут за столом</span></p><div class="chips">${popularChips('')}</div></div>`;
      } else if (!found.length) {
        const s = C.get('rule:advantage');
        res.innerHTML = `<div class="sr-none"><div class="orn3" style="width:140px" aria-hidden="true"><span>◆◆◆</span></div><b>Ничего не нашлось</b><p>По запросу «${esc(raw.trim())}» статей нет.${s ? ` Может, <a data-q="помеха">«помеха»</a>?` : ''}</p></div>
          <div><p class="sr-gh"><span>Чаще всего ищут за столом</span></p><div class="chips">${popularChips('')}</div></div>`;
      } else {
        const groups = new Map();
        found.slice(0, 60).forEach((a) => { if (!groups.has(a.kind)) groups.set(a.kind, []); if (groups.get(a.kind).length < 6) groups.get(a.kind).push(a); });
        res.innerHTML = note + [...groups].map(([k, xs]) => `<div class="sr-g"><div class="sr-gh"><span>${esc(PL[k] || k)}</span><span>${found.filter((a) => a.kind === k).length}</span></div>
          ${xs.map((a) => `<a class="sr${isCond(a) ? ' is-cond' : ''}" role="option" href="${esc(U.art(a))}">${aIco(a) || ico('rule')}<span class="sr-t"><span class="sr-n"><span>${hl(a.name, shown)}</span>${a.camp ? `<span class="badge">${esc(a.camp)}</span>` : ''}</span><span class="sr-s">${hl(plain(a.summary), shown)}</span></span><span class="sr-k">↵</span></a>`).join('')}</div>`).join('');
      }
      links = [...res.querySelectorAll('a.sr')]; sel = 0; mark();
      res.querySelectorAll('[data-q]').forEach((l) => { l.onclick = (e) => { e.preventDefault(); inp.value = l.dataset.q; draw(); inp.focus(); }; });
      const ex = res.querySelector('[data-exact]'); if (ex) ex.onclick = () => { res.innerHTML = '<div class="sr-none"><b>Ничего не нашлось</b></div>'; links = []; };
      res.querySelectorAll('a[href]').forEach((l) => l.addEventListener('click', () => { remember(raw); close(); }));
    }
    function mark() { links.forEach((l, i) => l.classList.toggle('sel', i === sel)); if (links[sel]) links[sel].scrollIntoView({ block: 'nearest' }); }
    function key(e) {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); }
      else if (e.key === 'ArrowDown' && links.length) { e.preventDefault(); sel = (sel + 1) % links.length; mark(); }
      else if (e.key === 'ArrowUp' && links.length) { e.preventDefault(); sel = (sel - 1 + links.length) % links.length; mark(); }
      else if (e.key === 'Enter' && links[sel] && D.activeElement === inp) { e.preventDefault(); remember(inp.value); const h = links[sel].getAttribute('href'); close(); go(h); }
    }
    D.addEventListener('keydown', key, true);
    ov.addEventListener('click', (e) => { if (e.target === ov) close(); });
    ov.querySelector('.back').onclick = close;
    x.onclick = () => { inp.value = ''; draw(); inp.focus(); };
    inp.addEventListener('input', draw);
    inp.value = initial || ''; draw(); inp.focus();
  }

  /* ───── навигация внутри приложения ───── */
  let cur = null;
  function render(force) {
    const r = route();
    if (!force && cur && r.key === cur.key) { if (r.page === 'article' && location.hash) jump(decodeURIComponent(location.hash.slice(1)), false); return; }
    cur = r;
    B.dataset.page = r.page;
    if (r.page === 'home') home(); else if (r.page === 'section') section(r.sec); else if (r.page === 'article') article(r.atom); else if (r.page === '404') notFound(r.path);
    if (r.page !== 'article' || !location.hash) scrollTo(0, 0);
  }
  const B = D.body;
  function go(href) {
    const u = new URL(href, location.href);
    history.pushState(null, '', u.pathname + u.search + u.hash);
    render();
  }
  const mine = (u) => u.origin === location.origin && (file ? u.pathname === location.pathname : u.pathname.startsWith(BASE));
  const onLink = (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest('a[href]'); if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
    if (a.closest('.tip-sheet')) return;                      // из шторки подсказки — обычный переход (шторки живут в истории браузера)
    const u = new URL(a.getAttribute('href'), location.href); if (!mine(u)) return;
    if (u.pathname === location.pathname && u.search === location.search && u.hash) return;   // якорь на этой же странице
    e.preventDefault(); if (FR.tips) FR.tips.closeAll(); go(u.href);
  };
  // после обработчика подсказок (он вешается на DOMContentLoaded): на телефоне касание ссылки открывает шторку, а не переход
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', () => D.addEventListener('click', onLink)); else D.addEventListener('click', onLink);
  addEventListener('popstate', () => render());
  D.addEventListener('click', (e) => { const s = e.target.closest('[data-search]'); if (s && app.contains(s)) openSearch(''); });

  /* ───── запуск ───── */
  S.onSearch = openSearch;
  S.menuExtra = `<h4 class="eyebrow">Разделы Кодекса</h4>` + SECS.filter((s) => !s.hidden).map((s) => `<a href="${esc(U.sec(s.key))}">${ico(s.dm ? 'dm' : s.icon)}${esc(s.title)}</a>`).join('');
  S.init();
  render(true);
  FR.codexApp = { go, route, LISTS, PLACE, openSearch };
})();
