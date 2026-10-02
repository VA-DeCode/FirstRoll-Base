/* FirstRoll · вложенные подсказки (стек карточек).
   Компьютер: наведение → карточка через ~300 мс вплотную к ссылке → курсор переходит в неё, не выходя за границы →
   ссылка в карточке → следующая карточка, и так до maxDepth уровней. Пока курсор внутри ссылки-источника или любой
   карточки цепочки, ничего не закрывается; вышел за все границы — закрывается всё. Esc закрывает один уровень.
   Повторно открыть статью, которая уже есть выше в цепочке, нельзя — существующая карточка подсвечивается.
   Телефон: касание → нижняя шторка; ссылка в шторке → новая шторка сверху, хлебные крошки, «назад» (и системная кнопка «назад»).
   Любой элемент с data-ref="вид:id[#блок]" становится источником подсказки; с data-ref-mode="hover" — только наведением
   (щелчок остаётся за элементом: чип выбора в Кузнице). Нужен shared/codex.js. */
(function () {
  const FR = window.FR = window.FR || {};
  const C = FR.codex, esc = C.esc;

  const T = FR.tips = {
    opts: {
      showDelay: 300,     // мс до появления карточки
      closeDelay: 250,    // мс до закрытия, после того как курсор вышел за границы цепочки
      view: 'auto',       // 'auto' | 'sheet' (принудительно шторки, для проверки на компьютере)
      maxDepth: 6,
      dm: false           // показывать заметки мастера (dmNotes)
    },
    renderers: {}
  };
  const O = T.opts;

  /* ───────────── Содержимое карточки ───────────── */
  const SRC = (a) => a.src ? `<span class="badge-source" title="${esc(a.src + (a.pg ? ', с. ' + a.pg : ''))}">${esc(a.src)}${a.pg ? ' <small>' + esc(String(a.pg).split(/[,–-]/)[0]) + '</small>' : ''}</span>` : '';
  const ico = (a) => (FR.icons && a ? FR.icons.forAtom(a) : '');
  const head = (kindLabel, title, en, a, ia) => `<div class="tip-head"><div><div class="tip-kind">${ico(ia || a)}${kindLabel}</div><div class="tip-title">${title}</div>${en ? `<div class="tip-en">${esc(en)}</div>` : ''}</div>${a ? SRC(a) : ''}</div>`;
  const see = (a) => a.see && a.see.length ? `<div class="tip-see">См. также: ${a.see.map((r) => { const p = C.parse(r); return p ? C.link(p.kind, p.id, p.block) : ''; }).join(', ')}</div>` : '';
  const dm = (a) => O.dm && a.dmNotes ? `<div class="tip-dm"><b>Мастеру.</b> ${C.inline(a.dmNotes)}</div>` : '';
  const chips = (arr) => { arr = arr.filter(Boolean); return arr.length ? `<div class="tip-chips">${arr.map((x) => `<span class="chip">${x}</span>`).join('')}</div>` : ''; };

  /* Общие необязательные поля атома: chips — строки-чипы (с разметкой), levels — таблица [[ключ, текст]] */
  const costChip = (a) => a.cost && FR.icons ? `<span class="chip chip-cost cost-${esc(a.cost)}">${FR.icons.svg('cost-' + a.cost)}${esc(FR.icons.COST[a.cost] || a.cost)}</span>` : '';
  const extras = (a) => (a.cost ? `<div class="tip-chips">${costChip(a)}</div>` : '') + (a.chips && a.chips.length ? chips(a.chips.map((c) => C.inline(c))) : '') +
    (a.levels ? `<div class="tip-table">${a.levels.map((r) => `<div class="r"><span>${esc(r[0])}</span><span>${C.inline(r[1])}</span></div>`).join('')}</div>` : '');
  T.renderers.default = (a) => head(esc(C.kinds[a.kind] || a.kind), esc(a.name), a.en, a) + `<div class="fr-md">${C.md(a.summary)}</div>` + extras(a) + see(a) + dm(a);
  T.renderers.cond = (a) => T.renderers.default(a).replace(esc(C.kinds.cond), 'Состояние');

  const RAR = { common: 'обычный', uncommon: 'необычный', rare: 'редкий', 'very rare': 'очень редкий', legendary: 'легендарный', artifact: 'артефакт' };
  const TRIG = { hit: 'При попадании', use: 'Использование', passive: 'Постоянно' };
  const USE = { melee: 'рукопашное', ranged: 'дальнобойное' }, ARM = { light: 'лёгкий доспех', medium: 'средний доспех', heavy: 'тяжёлый доспех', shield: 'щит' };
  T.renderers.item = (a) => {
    const b = a.base ? C.get('item', a.base) : null, w = Object.assign({}, b || {}, a);
    const add = (on) => (a.mods || []).filter((m) => m.on === on && m.add).reduce((s, m) => s + m.add, 0);
    const atk = add('attack'), dmgAdd = add('damage');
    const what = b ? C.link('item', b.id) : w.dmg ? `${w.cat === 'martial' ? 'воинское' : 'простое'} ${USE[w.use || w.type] || ''} оружие` : ARM[w.type] || '';
    const sub = [what, RAR[a.rarity] || '', a.rarity ? (a.attune ? 'требует настройки' : 'без настройки') : ''].filter(Boolean).join(' · ');
    if (a.unknown) return head('Предмет · не опознан', esc(a.name), null, a) + `<div class="fr-md">${C.md(a.summary)}</div>` +
      (a.look ? `<p class="tip-look">${C.inline(a.look)}</p>` : '') + chips(['<span class="chip-in is-unknown">Не опознан</span>']);
    const magic = !!(a.rarity || (a.mods && a.mods.length) || (a.effects && a.effects.length));
    let h = head(magic ? 'Магический предмет' + (RAR[a.rarity] ? ' · ' + RAR[a.rarity] : '') : esc(C.kinds.item), esc(a.name), a.en, a) + (sub ? `<div class="tip-sub">${sub[0].toUpperCase() + sub.slice(1)}</div>` : '');
    if (magic) h += chips(['<span class="chip-in is-magic">◆ Магический</span>', a.id && /^hb:/.test(a.id) ? 'Своё в кампании' : '']);
    const price = [w.cost ? w.cost + ' зм' : '', w.weight ? w.weight + ' фнт.' : ''];
    if (w.dmg) h += chips([atk ? `+${atk} к атаке` : '', `${C.inline(w.dmg + (dmgAdd ? ' + ' + dmgAdd : ''))} ${w.dt ? C.link('dmg', w.dt) : ''}`]
      .concat((w.props || []).map((p) => C.link('prop', p) + (p === 'thrown' && w.range ? ' ' + esc(w.range) : p === 'versatile' && w.vers ? ' ' + esc(w.vers) : '')), a.base ? [] : price));
    else if (w.ac) h += chips([w.type === 'shield' ? '+2 КД' : `КД ${w.ac}${w.dexMax === 0 ? '' : w.dexMax ? ' + Лов (макс. 2)' : ' + Лов'}`].concat(price));
    if (a.effects && a.effects.length) h += `<ul class="tip-list">${a.effects.map((e) => `<li><b>${esc(TRIG[e.trigger] || e.trigger)}.</b> ${C.inline(e.text)}</li>`).join('')}</ul>`;
    else h += `<div class="fr-md">${C.md(a.summary)}</div>`;
    if (!w.dmg && !w.ac) h += chips(price);
    if (a.look) h += `<p class="tip-look">${C.inline(a.look)}</p>`;
    return h + see(a) + dm(a);
  };

  T.renderers.spell = (a) => head('Заклинание', esc(a.name), a.en, a) +
    `<div class="tip-sub">${esc([a.lvl ? a.lvl + ' круг' : 'Заговор', a.school, a.time, a.range, a.comp, a.dur].filter(Boolean).join(' · '))}</div>` +
    `<div class="fr-md">${C.md(a.summary)}</div>` + extras(a) + see(a) + dm(a);

  T.renderers.calc = (a) => {
    const rows = (a.parts || []).map(([v, t, f]) => `<div class="r${f && f.dm ? ' is-dm' : ''}${f && f.state ? ' is-state' : ''}"><span>${/к\d/.test(v) ? C.inline(v) : esc(v)}</span><span>${f && f.dm ? '✎ мастер: ' : ''}${C.inline(t)}</span></div>`).join('');
    return head('Откуда число', esc(a.name), null, null, a) +
      `<div class="tip-calc">${rows}${a.total != null && a.total !== '' ? `<div class="r total"><b>${/к\d/.test(a.total) ? C.inline(a.total) : esc(a.total)}</b><span>${a.totalLabel ? C.inline(a.totalLabel) : ''}</span></div>` : ''}</div>` +
      (a.summary ? `<div class="fr-md">${C.md(a.summary)}</div>` : '');
  };

  /* ref → { html, title, url } */
  T.content = function (ref) {
    const r = C.resolve(ref); if (!r) return null;
    const a = r.atom;
    if (r.block) {
      const body = r.block.dm && !C.showDm() ? '<p class="tip-muted">Этот блок видит только мастер.</p>' : C.md(r.block.md);
      return { title: r.block.title, url: C.url(ref),
        kind: r.block.dm ? 'dm' : 'block',
        html: head(`${esc(C.kinds[a.kind] || a.kind)} · блок`, `${esc(a.name)} › ${esc(r.block.title)}`, null, a) + `<div class="fr-md">${body}</div>` +
          `<div class="tip-see">Вся статья: ${C.link(a.kind, a.id)}</div>` };
    }
    const fn = T.renderers[a.kind] || T.renderers.default;
    const url = a.kind === 'calc' ? (a.see && a.see[0] ? C.url(a.see[0]) : null) : C.url(ref);
    let html = fn(a);
    // v2: статья только для мастера — метка «· только мастеру» киноварью
    if (a.vis === 'dm') html = html.replace(/(<div class="tip-kind">[\s\S]*?)(<\/div>)/, '$1 · только мастеру$2');
    const kind = a.vis === 'dm' ? 'dm' : a.kind === 'item' ? (a.unknown ? 'itemUnknown' : (a.rarity || (a.mods && a.mods.length) || (a.effects && a.effects.length)) ? 'itemMagic' : 'item') : a.kind;
    return { title: a.name, url, kind, html };
  };

  /* Справочник открывается в новой вкладке — кроме самого приложения Кодекса (там переход внутри страницы) */
  const inCodex = () => document.body && document.body.dataset.section === 'codex';
  const tgt = () => inCodex() ? '' : ' target="_blank" rel="noopener"';
  const extIco = () => inCodex() || !FR.icons ? ' →' : FR.icons.svg('ext');

  /* ───────────── Режим: мышь или касание ───────────── */
  let lastPointer = 'mouse';
  const sheetMode = () => O.view === 'sheet' || lastPointer === 'touch' || (lastPointer !== 'mouse' && matchMedia('(hover: none)').matches);
  const refOf = (el) => el && el.closest && el.closest('[data-ref]');
  const levelOf = (el) => { const c = el && el.closest && el.closest('.tip-card'); return c ? +c.dataset.level : 0; };

  /* ───────────── Компьютер: стек карточек ─────────────
     Карточка появляется вплотную к ссылке и держится, пока курсор внутри «цепочки»:
     ссылка-источник + все открытые карточки (+ мостик между ссылкой и её карточкой).
     Курсор вышел за все границы — через closeDelay закрывается всё. Новая ссылка внутри карточки
     заменяет более глубокие карточки. Ссылка на статью, которая уже открыта выше по цепочке,
     новую карточку не открывает, а подсвечивает существующую (без «рекурсии»). */
  const stack = [];          // { level, ref, anchor, el }
  let pending = null, closing = 0;

  const ancestorsHave = (ref, level) => stack.slice(0, level - 1).some((e) => e.ref === ref);

  function flash(e) { e.el.classList.remove('is-flash'); void e.el.offsetWidth; e.el.classList.add('is-flash'); }

  /* Ссылки на статьи, уже открытые в цепочке, помечаются .is-chain (приглушены, повторно не открываются) */
  function markChain(list, sel) {
    const refs = new Set(list.map((e) => e.ref));
    list.forEach((e) => e.el.querySelectorAll(sel).forEach((a) => a.classList.toggle('is-chain', refs.has(a.getAttribute('data-ref')))));
  }

  function open(anchor, level) {
    const ref = anchor.getAttribute('data-ref');
    if (ancestorsHave(ref, level)) { flash(stack.find((e) => e.ref === ref)); return; }
    const c = T.content(ref);
    if (!c) return;
    collapseNow(level - 1);
    const el = document.createElement('div');
    el.className = 'tip-card'; el.dataset.level = level; el.dataset.kind = c.kind || ''; el.setAttribute('role', 'tooltip');
    el.style.zIndex = 100 + level;
    el.innerHTML = `<div class="tip-body">${c.html}</div>` +
      `<div class="tip-foot"><span class="tip-hint">${c.kind === 'calc' && c.url ? 'Строка — ссылка на правило' : 'Esc — закрыть'}</span>${c.url ? `<a class="tip-open" href="${esc(c.url)}"${tgt()}>В справочник${extIco()}</a>` : ''}</div>`;
    document.body.appendChild(el);
    const e = { level, ref, anchor, el };
    stack.push(e);
    anchor.classList.add('is-open');
    place(e);
    el.querySelector('.tip-body').addEventListener('scroll', () => collapseNow(level), { passive: true });
    markChain(stack, '.tip-body [data-ref]');
  }

  function collapseNow(n) {
    clearTimeout(closing); closing = 0;
    while (stack.length > n) {
      const e = stack.pop();
      e.anchor.classList.remove('is-open');
      e.el.remove();
    }
    markChain(stack, '.tip-body [data-ref]');
  }
  /* Закрыть через closeDelay всё глубже уровня n (n = 0 — всё). Таймер один: если курсор ушёл ещё выше по цепочке,
     цель понижается без перезапуска; вернулся в более глубокую карточку — отмена. */
  let closingTo = 0;
  function closeLater(n) {
    n = n || 0;
    if (stack.length <= n) { keep(); return; }
    if (closing) { closingTo = Math.min(closingTo, n); return; }
    closingTo = n; closing = setTimeout(() => { closing = 0; collapseNow(closingTo); }, O.closeDelay);
  }
  function keep() { clearTimeout(closing); closing = 0; }

  /* Точка внутри цепочки? Ссылка-источник (с запасом 3 px), карточка и мостик между ними. */
  const inRect = (x, y, r, m) => x >= r.left - m && x <= r.right + m && y >= r.top - m && y <= r.bottom + m;
  /* Самый глубокий уровень цепочки под курсором: карточка уровня k, её ссылка-источник или мостик между ними; 0 — вне цепочки */
  function depthAt(x, y) {
    for (let i = stack.length - 1; i >= 0; i--) {
      const e = stack[i], a = e.anchor.getBoundingClientRect(), c = e.el.getBoundingClientRect();
      if (inRect(x, y, c, 0) || inRect(x, y, a, 3)) return i + 1;
      const l = Math.max(a.left, c.left), r = Math.min(a.right, c.right);
      if (x >= l && x <= r && y >= Math.min(a.bottom, c.bottom) - 1 && y <= Math.max(a.top, c.top) + 1) return i + 1;
    }
    return 0;
  }
  const inChain = (x, y) => depthAt(x, y) > 0;

  /* Карточка — вплотную под ссылкой (или над ней, если снизу не влезает), по горизонтали перекрывает ссылку,
     чтобы курсор переходил из ссылки в карточку, не выходя за границы. */
  function place(e) {
    const el = e.el, vw = document.documentElement.clientWidth, vh = window.innerHeight, pad = 8;
    const w = Math.min(344, vw - pad * 2);
    el.style.width = w + 'px';
    const r = e.anchor.getBoundingClientRect();
    let h = el.offsetHeight;
    let x = Math.max(pad, Math.min(r.left - 14, vw - pad - w));
    if (x > r.right - 16) x = Math.max(pad, r.right - 16 - 24);
    const below = vh - pad - r.bottom, above = r.top - pad;
    let down = true;
    if (h > below) {
      if (h <= above) down = false;
      else {
        down = below >= above;
        const body = el.querySelector('.tip-body');
        body.style.maxHeight = Math.max(110, (down ? below : above) - (h - body.offsetHeight)) + 'px';
        h = el.offsetHeight;
      }
    }
    const y = down ? r.bottom - 1 : r.top - h + 1;
    el.classList.toggle('is-up', !down);
    el.style.left = (x + window.scrollX) + 'px';
    el.style.top = (y + window.scrollY) + 'px';
  }

  function onOver(ev) {
    if (ev.pointerType && ev.pointerType !== 'mouse') return;
    if (sheetMode()) return;
    const a = refOf(ev.target);
    if (!a) return;
    const lvl = levelOf(a);
    if (stack[lvl] && stack[lvl].anchor === a) return;          // уже открыта
    if (pending && pending.anchor === a) return;
    if (lvl + 1 > O.maxDepth) return;
    clearTimeout(pending && pending.t);
    if (ancestorsHave(a.getAttribute('data-ref'), lvl + 1)) { pending = null; flash(stack.find((e) => e.ref === a.getAttribute('data-ref'))); return; }
    pending = { anchor: a, t: setTimeout(() => { pending = null; open(a, lvl + 1); }, O.showDelay) };
  }
  function onOut(ev) {
    if (!pending) return;
    const a = refOf(ev.target);
    if (a && a === pending.anchor && !(ev.relatedTarget && a.contains(ev.relatedTarget))) { clearTimeout(pending.t); pending = null; }
  }
  let raf = 0, px = 0, py = 0;
  function onMove(ev) {
    if (ev.pointerType && ev.pointerType !== 'mouse') return;
    px = ev.clientX; py = ev.clientY;
    if (raf) return;
    // курсор в карточке уровня d: всё, что глубже (и не под курсором), закрывается тем же таймером, что и вся цепочка
    raf = requestAnimationFrame(() => { raf = 0; if (stack.length) { const d = depthAt(px, py); if (d >= stack.length) keep(); else closeLater(d); } });
  }

  /* ───────────── Телефон: шторки ───────────── */
  const sheets = [];          // { ref, el, title }
  let root = null, hist = 0;

  function ensureRoot() {
    if (root) return root;
    root = document.createElement('div');
    root.className = 'tip-sheets';
    root.innerHTML = '<div class="tip-backdrop"></div>';
    root.firstChild.addEventListener('click', () => closeSheets(0));
    document.body.appendChild(root);
    return root;
  }

  function sheetHtml(c, i) {
    const crumbs = sheets.slice(0, i).map((s, j) => `<button type="button" class="crumb" data-go="${j + 1}">${esc(s.title)}</button><span class="sep">›</span>`).join('');
    return `<div class="tip-sheet-head"><div class="tip-grip" aria-hidden="true"></div>` +
      (i ? `<nav class="tip-crumbs" aria-label="Цепочка подсказок"><button type="button" class="back" data-go="${i}" aria-label="Назад">‹</button><div class="trail">${crumbs}<b>${esc(c.title)}</b></div></nav>` : '') + `</div>` +
      `<div class="tip-body">${c.html}</div>` +
      `<div class="tip-sheet-foot">${c.url ? `<a class="tip-open btn" href="${esc(c.url)}"${tgt()}>В справочник ↗</a>` : ''}<button type="button" class="btn tip-close">Закрыть</button></div>`;
  }

  function openSheet(ref, fresh) {
    // статья уже открыта ниже в стопке — вернуться к ней, а не класть копию сверху
    const at = fresh ? -1 : sheets.findIndex((s) => s.ref === ref);
    if (at >= 0) { closeSheets(at + 1); return; }
    const c = T.content(ref); if (!c) return;
    ensureRoot();
    if (fresh && sheets.length) closeSheetsNow(0);
    if (sheets.length >= O.maxDepth + 2) return;
    const i = sheets.length;
    const el = document.createElement('div');
    el.className = 'tip-sheet'; el.dataset.kind = c.kind || ''; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', c.title);
    el.tabIndex = -1;
    el.style.zIndex = 130 + i;
    sheets.push({ ref, el, title: c.title });
    el.innerHTML = sheetHtml(c, i);
    root.appendChild(el);
    root.classList.add('is-on');
    document.documentElement.classList.add('tip-lock');
    restack();
    wireSheet(el);
    const tr = el.querySelector('.trail'); if (tr) tr.scrollLeft = tr.scrollWidth;
    markChain(sheets, '.tip-body [data-ref]');
    setTimeout(() => el.focus({ preventScroll: true }), 30);
    try { history.pushState({ frTip: sheets.length }, ''); hist = sheets.length; } catch (e) { /* file:// в некоторых браузерах */ }
  }

  function restack() {
    sheets.forEach((s, j) => {
      const behind = sheets.length - 1 - j;
      s.el.classList.toggle('is-behind', behind > 0);
      s.el.style.setProperty('--behind', behind);
    });
  }

  function popNow() {
    const s = sheets.pop(); if (!s) return;
    s.el.classList.add('is-leaving');
    setTimeout(() => s.el.remove(), 220);
    restack();
    markChain(sheets, '.tip-body [data-ref]');
    if (!sheets.length) { root.classList.remove('is-on'); document.documentElement.classList.remove('tip-lock'); }
    else sheets[sheets.length - 1].el.focus({ preventScroll: true });
  }
  function closeSheetsNow(n) { while (sheets.length > n) popNow(); }
  /* Закрыть до n шторок (через историю, чтобы системная кнопка «назад» работала согласованно) */
  function closeSheets(n) {
    const k = sheets.length - n; if (k <= 0) return;
    if (hist >= sheets.length) { try { history.go(-k); return; } catch (e) { /* ниже */ } }
    closeSheetsNow(n);
  }
  window.addEventListener('popstate', (ev) => {
    if (!sheets.length) return;
    const want = (ev.state && ev.state.frTip) || 0;
    hist = want;
    closeSheetsNow(Math.min(want, sheets.length));
  });

  function wireSheet(el) {
    el.addEventListener('click', (ev) => {
      const g = ev.target.closest('[data-go]');
      if (g) { ev.preventDefault(); closeSheets(+g.dataset.go); return; }
      if (ev.target.closest('.tip-close')) { ev.preventDefault(); closeSheets(0); }
    });
    // смахнуть вниз — закрыть верхнюю шторку
    const hd = el.querySelector('.tip-sheet-head');
    let y0 = null, dy = 0;
    hd.addEventListener('pointerdown', (ev) => { if (ev.target.closest('button')) return; y0 = ev.clientY; dy = 0; hd.setPointerCapture(ev.pointerId); el.style.transition = 'none'; });
    hd.addEventListener('pointermove', (ev) => { if (y0 == null) return; dy = Math.max(0, ev.clientY - y0); el.style.transform = `translateY(${dy}px)`; });
    const end = () => { if (y0 == null) return; y0 = null; el.style.transition = ''; el.style.transform = ''; if (dy > 80) closeSheets(sheets.length - 1); };
    hd.addEventListener('pointerup', end); hd.addEventListener('pointercancel', end);
  }

  /* ───────────── Общие обработчики ───────────── */
  function onClick(ev) {
    const a = refOf(ev.target);
    if (!a || ev.button !== 0 || ev.ctrlKey || ev.metaKey || ev.shiftKey) return;
    if (a.dataset.refMode === 'hover') return;   // у элемента своё действие на щелчок (чип выбора в Кузнице): карточка — только наведением
    if (sheetMode()) {
      ev.preventDefault();
      openSheet(a.getAttribute('data-ref'), !a.closest('.tip-sheet'));
      return;
    }
    // Мышь: ссылка ведёт в справочник (вне Кодекса — в новой вкладке). Элемент без href (число на листе) — карточка сразу, без задержки.
    if (a.getAttribute('href') && !inCodex() && !a.target) { ev.preventDefault(); window.open(a.href, '_blank', 'noopener'); return; }
    if (!a.getAttribute('href')) {
      ev.preventDefault();
      const lvl = levelOf(a);
      if (stack[lvl] && stack[lvl].anchor === a) return;
      clearTimeout(pending && pending.t); pending = null;
      open(a, lvl + 1);
    }
  }

  function onKey(ev) {
    if (ev.key !== 'Escape') return;
    if (sheets.length) { closeSheets(sheets.length - 1); ev.preventDefault(); return; }
    if (stack.length) {
      const top = stack[stack.length - 1];
      collapseNow(stack.length - 1);
      if (document.activeElement && document.activeElement.closest('.tip-card')) top.anchor.focus({ preventScroll: true });
      ev.preventDefault();
    }
  }

  /* Клавиатура: фокус на ссылке сразу показывает карточку */
  let kbd = false;
  function onFocus(ev) {
    if (!kbd || sheetMode()) return;
    const a = refOf(ev.target);
    const lvl = levelOf(ev.target);
    if (!a) { collapseNow(lvl); return; }
    if (stack[lvl] && stack[lvl].anchor === a) return;
    open(a, lvl + 1);
  }

  T.closeAll = () => { collapseNow(0); closeSheets(0); };
  T.open = (ref, anchor) => { if (sheetMode() || !anchor) openSheet(ref, true); else open(anchor, levelOf(anchor) + 1); };
  T.state = () => ({ cards: stack.map((e) => ({ level: e.level, ref: e.ref })), sheets: sheets.map((s) => s.ref) });

  T.init = function () {
    if (T._init) return; T._init = true;
    document.addEventListener('pointerdown', (ev) => {
      lastPointer = ev.pointerType || 'mouse'; kbd = false;
      if (lastPointer === 'mouse' && stack.length && !inChain(ev.clientX, ev.clientY)) collapseNow(0);
    }, true);
    document.addEventListener('pointerover', (ev) => { if (ev.pointerType === 'mouse') lastPointer = 'mouse'; onOver(ev); });
    document.addEventListener('pointerout', onOut);
    document.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', () => closeLater(0));
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', (ev) => { if (ev.key === 'Tab') kbd = true; onKey(ev); });
    document.addEventListener('focusin', onFocus);
    window.addEventListener('resize', () => collapseNow(0));
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', T.init); else T.init();
})();
