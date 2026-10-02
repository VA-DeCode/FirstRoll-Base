/* Мостик Кузница ↔ Стол (Кузница v2, макеты 2a–3b). Кузница подключает его сама; работает только когда Кузница открыта через Стол
   (/fr/forge/ на ноутбуке мастера или через туннель). Вид — классы .frb .fb-* в forge/assets/css/app.css.
   Что делает:
   1) полоса Стола над шапкой (.frb): разделы FirstRoll, статус «Стол · кампания · герой · что делаем», «← За стол»;
   2) если игрок пришёл со Стола повышать уровень или править описание (localStorage 'fr-forge-mode' =
      { mode: 'level'|'desc', ch, name, to, sub0, from, t }), закрывает шаги, которые у героя в игре не меняются
      (замок на шаге, плашка .fb-lock, содержимое приглушено .fb-dim, «Назад/Далее» работают). Настоящая проверка — на Столе
      (stol/lib/forge.js checkLevel/checkDesc), здесь — чтобы игрок не тратил время на то, что всё равно не примут;
   3) нижняя панель (.fb-float): что осталось выбрать, «Отменить», «Отправить мастеру» / «Сохранить за столом»;
      если чего-то не хватает — окно .fb-msg со списком пунктов, каждый ведёт на свой шаг;
   4) при повышении уровня на шаге «Итог» — таблица «Было → стало» (.fb-compare). */
(function () {
  const D = document, FR = window.FR || {};
  const onStol = !!((window.FR_BRIDGE || {}).stol || (FR.site && FR.site.onStol));
  if (!onStol) return;
  const ls = { get(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }, del(k) { try { localStorage.removeItem(k); } catch (e) {} } };
  const KEY = 'fr-forge-mode';
  let mode = ls.get(KEY);
  if (mode && (!mode.t || Date.now() - mode.t > 12 * 3600e3)) { ls.del(KEY); mode = null; }
  const token = () => { try { return localStorage.getItem('fr-stol-token'); } catch (e) { return null; } };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const ico = (n) => (FR.icons ? FR.icons.svg(n) : '');
  const back = token() ? '/play' : '/';
  const builder = () => window.DND && DND.builder && D.getElementById('step');
  const STEP = { basics: 'Основа', race: 'Раса', class: 'Класс', abilities: 'Характеристики', background: 'Предыстория', spells: 'Заклинания', equipment: 'Снаряжение', details: 'Описание', summary: 'Итог' };

  const LOCK = mode ? {
    level: { steps: ['basics', 'race', 'abilities', 'background', 'equipment'], acts: ['cls', 'swap', 'reset', 'level', 'hpmode'].concat(mode.sub0 ? ['sub'] : []),
      why: 'Герой уже в игре: при повышении уровня меняется только то, что даёт новый уровень.',
      hint: 'Расу, характеристики, предысторию и снаряжение при необходимости правит мастер в Ширме. «Назад» и «Далее» работают.' },
    desc: { steps: ['basics', 'race', 'class', 'abilities', 'background', 'spells', 'equipment'], acts: ['reset', 'level', 'cls', 'sub', 'swap'],
      why: 'Без мастера меняется только описание героя.',
      hint: 'Механику — хиты, снаряжение, заклинания — меняет мастер в Ширме или повышение уровня.' }
  }[mode.mode] : null;
  const what = mode ? (mode.mode === 'level' ? `повышение до ${mode.to}-го уровня` : 'правка описания') : '';

  /* ── 1. Полоса Стола и шапка ── */
  function bar() {
    if (!mode) return;   // без режима Стола хватает пилюли «К столу» в общей шапке
    const el = D.createElement('div'); el.className = 'frb';
    el.innerHTML = `<nav aria-label="Разделы FirstRoll"><a class="fb-brand" href="/fr/">FirstRoll</a><a href="/fr/start/" target="_blank" rel="noopener">Первые шаги ↗</a>` +
      `<a href="/fr/codex/" target="_blank" rel="noopener">Кодекс знаний ↗</a><a href="/fr/forge/" aria-current="page">Кузница героев</a></nav><span class="sp"></span>` +
      `<span class="fb-st"><i></i><span>Стол<span class="fb-camp"></span>${mode ? ' · ' + esc(mode.name) + ' · ' + what : ''}</span></span>` +
      `<a class="btn primary sm fb-back" href="${back}">← За стол</a>`;
    D.body.insertBefore(el, D.body.firstChild);
    fetch('/api/ping', { cache: 'no-store' }).then((r) => r.json()).then((j) => { if (j && j.campaign) el.querySelector('.fb-camp').textContent = ' · ' + j.campaign; }).catch(() => {});
    const head = D.getElementById('site-head'); if (!head) return;
    head.classList.add('fb-moded');
    const brand = head.querySelector('.brand');
    const t = D.createElement('span'); t.className = 'fb-head';
    t.innerHTML = mode.mode === 'level' ? `<b>Повышение уровня</b> · ${esc(mode.name)}, ${mode.to - 1} → ${mode.to}` : `<b>Правка описания</b> · ${esc(mode.name)}, только шаг «Описание»`;
    if (brand) brand.after(t);
  }

  /* ── 2. Замки шагов ── */
  const curStep = () => { const b = D.querySelector('#stepper [aria-current="step"]'); return b ? b.dataset.step : null; };
  function lockTree(root, keep) {
    for (const ch of [...root.children]) {
      if (ch.classList.contains('fb-lock') || ch.matches('.eyebrow, h1, .orn, .lead')) continue;
      if (keep && ch.contains(keep)) { if (ch !== keep) lockTree(ch, keep); continue; }
      ch.inert = true; ch.classList.add('fb-dim');
    }
  }
  let applying = false;
  function apply() {
    if (!LOCK || !builder() || applying) return;
    applying = true;
    D.querySelectorAll('#stepper [data-step]').forEach((b) => {
      const locked = LOCK.steps.includes(b.dataset.step);
      b.classList.toggle('is-locked', locked);
      const n = b.querySelector('.n'); if (locked && n && !n.querySelector('svg')) n.innerHTML = ico('lock');
    });
    const step = D.getElementById('step'), s = curStep();
    if (LOCK.steps.includes(s)) {
      if (!step.querySelector('.fb-lock')) {
        const n = D.createElement('div'); n.className = 'fb-lock'; n.setAttribute('role', 'note');
        n.innerHTML = `<span class="lk">${ico('lock')}</span><span><b>${esc(LOCK.why)}</b><span>${esc(LOCK.hint)}</span></span>`;
        const h = step.querySelector('.orn') || step.querySelector('h1');
        const lead = step.querySelector('.lead');
        if (lead) lead.textContent = 'Этот шаг закрыт, но его можно посмотреть.';
        (lead || h || step.firstChild).after(n);
        const eb = step.querySelector('.eyebrow'); if (eb && !eb.querySelector('.fb-chip')) eb.insertAdjacentHTML('beforeend', ' <span class="fb-chip">закрыт</span>');
      }
      lockTree(step, step.querySelector('.step-nav'));
    } else {
      step.querySelectorAll('[data-act]').forEach((b) => { if (LOCK.acts.includes(b.dataset.act)) { b.inert = true; b.classList.add('fb-dim'); } });
      if (mode.mode === 'level' && s === 'summary') compare();
    }
    status();
    Promise.resolve().then(() => { applying = false; });
  }
  function guard(ev) {   // запасной замок: щелчки и ввод в закрытых местах не проходят
    if (!LOCK || !builder()) return;
    const t = ev.target; if (!t || !t.closest || t.closest('.fb-msg-ov, .fb-float, .frb')) return;
    const a = t.closest('[data-act]');
    if (a && LOCK.acts.includes(a.dataset.act)) { ev.preventDefault(); ev.stopImmediatePropagation(); return; }
    if (t.closest('#step') && LOCK.steps.includes(curStep()) && !t.closest('.step-nav, [data-act="goto"], .fb-lock, .info-btn, [data-ref]')) { ev.preventDefault(); ev.stopImmediatePropagation(); }
  }

  /* ── 3. Что осталось, отправка ── */
  const missing = () => {
    const dv = DND.builder.dv; if (!dv) return [];
    return dv.warnings.filter((w) => !w.soft && w.step !== 'equipment' && !(LOCK && LOCK.steps.includes(w.step))).map((w) => ({ step: w.step, text: w.text }));
  };
  const plural = (n, a, b, c) => n % 10 === 1 && n % 100 !== 11 ? a : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? b : c;
  let before = null;   // числа героя до повышения — для «было → стало»
  function status() {
    const el = D.querySelector('.fb-stat'); if (!el || !DND.builder.dv) return;
    const m = missing(), dv = DND.builder.dv;
    if (m.length) {
      const st = [...new Set(m.map((x) => STEP[x.step] || x.step))];
      el.className = 'fb-stat is-warn';
      el.innerHTML = `<i></i>Не хватает ${m.length} ${plural(m.length, 'выбора', 'выборов', 'выборов')} на ${st.length > 1 ? 'шагах' : 'шаге'} «${esc(st.join('», «'))}»`;
    } else {
      el.className = 'fb-stat is-ok';
      const hp = before && mode.mode === 'level' ? ` · хиты ${before.hp} → ${dv.hp.max}` : '';
      el.innerHTML = `<i></i>Всё выбрано${hp}${mode.mode === 'level' && dv.sub && (!before || before.sub !== dv.sub.name) ? ' · ' + esc(dv.sub.name) : ''}`;
    }
  }
  function msgList(kicker, title, items, note) {
    D.querySelectorAll('.fb-msg-ov').forEach((x) => x.remove());
    const ov = D.createElement('div'); ov.className = 'fb-msg-ov';
    ov.innerHTML = `<div class="fb-msg" role="dialog" aria-modal="true" aria-label="${esc(title)}"><span class="k">${esc(kicker)}</span><b class="t">${esc(title)}</b>` +
      (note ? `<p>${esc(note)}</p>` : '') +
      items.map((x, i) => `<button type="button" class="fb-item${x.locked ? ' is-locked' : ''}"${x.step ? ` data-step="${x.step}"` : ''}><i>${i + 1}</i><span>${x.step ? `<small>${x.locked ? ico('lock') : ''}${esc(STEP[x.step] || x.step)}</small>` : ''}${esc(x.text)}</span>${x.step ? '<em>Открыть →</em>' : ''}</button>`).join('') +
      `<div class="acts"><button type="button" class="btn" data-x>Закрыть</button>${items.some((x) => x.step) ? '<button type="button" class="btn primary" data-first>К первому пункту</button>' : ''}</div></div>`;
    const close = () => ov.remove();
    const go = (s) => { close(); const b = D.querySelector(`#stepper [data-step="${s}"]`); if (b) b.click(); };
    ov.addEventListener('click', (e) => {
      if (e.target === ov || e.target.closest('[data-x]')) return close();
      if (e.target.closest('[data-first]')) { const f = items.find((x) => x.step); return f && go(f.step); }
      const it = e.target.closest('.fb-item[data-step]'); if (it) go(it.dataset.step);
    });
    D.addEventListener('keydown', function k(e) { if (e.key === 'Escape') { close(); D.removeEventListener('keydown', k); } });
    D.body.appendChild(ov);
    const f = ov.querySelector('[data-first], [data-x]'); if (f) f.focus();
  }
  const nWord = (n) => ({ 1: 'один пункт', 2: 'два пункта', 3: 'три пункта', 4: 'четыре пункта' }[n] || n + ' ' + plural(n, 'пункт', 'пункта', 'пунктов'));
  async function send() {
    const C = JSON.parse(JSON.stringify(DND.builder.C));
    if ((C.name || '') !== (mode.name || '')) return msgList('Запрос не отправлен', 'Это другой персонаж', [{ text: `В Кузнице открыт «${C.name || 'без имени'}», а за столом — «${mode.name}». Вернись за стол и начни оттуда.` }]);
    const m = missing();
    if (m.length) return msgList('Запрос не отправлен', 'Поправь ' + nWord(m.length), m, 'Нажми на пункт — откроется нужный шаг. Мастер получит запрос, когда всё будет готово.');
    const btn = D.getElementById('fb-send'); btn.classList.add('is-loading'); btn.disabled = true;
    try {
      const r = await fetch(mode.mode === 'level' ? '/api/me/levelup' : '/api/me/describe', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token() }, body: JSON.stringify({ c: C }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) return msgList(mode.mode === 'level' ? 'Запрос не отправлен' : 'Не сохранено', j.error || 'Стол не принял (' + r.status + ')', (j.missing || []).map((t) => ({ text: t })));
      ls.del(KEY); ls.del('fr-levelup');
      location.href = '/play';
    } catch (e) { msgList('Запрос не отправлен', 'Стол не отвечает', [{ text: 'Проверь связь с мастером и попробуй ещё раз.' }]); }
    finally { btn.classList.remove('is-loading'); btn.disabled = false; }
  }
  function float() {
    const f = D.createElement('div'); f.className = 'fb-float';
    f.innerHTML = `<span class="fb-stat"></span><button type="button" class="btn" id="fb-cancel">Отменить</button>` +
      `<button type="button" class="btn primary" id="fb-send">${mode.mode === 'level' ? 'Отправить мастеру' : 'Сохранить за столом'}</button>`;
    D.body.appendChild(f); D.body.classList.add('has-fb-float');
    D.getElementById('fb-send').onclick = send;
    D.getElementById('fb-cancel').onclick = () => { ls.del(KEY); ls.del('fr-levelup'); location.href = back; };
  }

  /* ── 4. Было → стало (повышение уровня, шаг «Итог») ── */
  function snap(dv) { return { lvl: dv.L, hp: dv.hp.max, hd: dv.hp.hd, prof: dv.prof, sub: dv.sub ? dv.sub.name : '', feats: (dv.features || []).map((x) => x.name) }; }
  function compare() {
    const step = D.getElementById('step'); if (!before || step.querySelector('.fb-compare')) return;
    const now = snap(DND.builder.dv), sg = (n) => (n >= 0 ? '+' : '−') + Math.abs(n);
    const fresh = now.feats.filter((n) => !before.feats.includes(n));
    const row = (k, a, b, note) => `<div class="r${String(a) !== String(b) ? ' is-new' : ''}"><span>${k}</span><span>${esc(a)}</span><i>→</i><span><b>${esc(b)}</b>${note ? `<small>${esc(note)}</small>` : ''}</span></div>`;
    const html = `<section class="fb-compare"><div class="hd"><span></span><span>Было</span><i></i><span>Стало</span></div>` +
      row('Уровень', before.lvl, now.lvl) + row('Хиты', before.hp, now.hp) + row('Кости Хитов', before.hd, now.hd) +
      row('Бонус мастерства', sg(before.prof), sg(now.prof), now.prof === before.prof ? 'вырастет на 5-м уровне' : '') +
      row('Подкласс', before.sub || '—', now.sub || '—') + row('Новые умения', '—', fresh.length ? fresh.join(', ') : '—') + '</section>';
    const h = step.querySelector('.orn') || step.querySelector('h1');
    if (h) h.insertAdjacentHTML('afterend', html);
  }

  function start() {
    bar();
    if (!mode || !builder()) return;
    float();
    ['click', 'pointerdown', 'keydown', 'beforeinput', 'change', 'dragstart', 'drop'].forEach((t) => D.addEventListener(t, guard, true));
    if (mode.from && DND.codec) DND.codec.decode(mode.from).then((c) => { before = snap(DND.rules.derive(c)); status(); apply(); }).catch(() => {});
    let jumped = mode.mode !== 'desc';   // правка описания — сразу на шаг «Описание» (Кузница после загрузки кода открывает «Итог»)
    const jump = () => { if (jumped) return; const b = D.querySelector('#stepper [data-step="details"]'); if (b && D.querySelector('#stepper [aria-current="step"]') && DND.builder.C && DND.builder.C.name === mode.name) { jumped = true; if (curStep() !== 'details') b.click(); } };
    const mo = new MutationObserver(() => { jump(); apply(); });
    mo.observe(D.getElementById('step'), { childList: true });
    mo.observe(D.getElementById('stepper'), { childList: true, subtree: true });
    D.getElementById('live') && mo.observe(D.getElementById('live'), { childList: true });
    jump(); apply();
  }
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', () => setTimeout(start, 0)); else setTimeout(start, 0);
})();
