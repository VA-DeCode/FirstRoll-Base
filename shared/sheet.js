/* FirstRoll · лист персонажа — один вид в Кузнице, на Столе и в «Моём персонаже» (Общий макет v2, §8.5; Лист v2).
   Данные — DND.sheetData(c) (forge/assets/js/sheetdata.js; на Столе их считает сервер). Классы — shared/sheet.css.
   Любое число — кнопка «Откуда число»: calc-атом Кодекса (FR.codex.put) и карточка подсказки по нажатию.
   FR.sheet.vitals(sh, o) · meds(sh) · saves(sh) · skills(sh) · attacks(sh) · magic(sh) · features(sh, o)
   o.key — приставка id calc-атомов (если на странице несколько листов); o.hp = { cur, max, temp } — хиты сейчас (o.noHp — без плитки хитов: они уже в карточке рядом);
   o.dm = { ac: '+1 правка мастера' } — числа, изменённые мастером (золотая метка ✎). Нужны shared/codex.js и shared/tips.js. */
(function () {
  const FR = window.FR = window.FR || {};
  const C = FR.codex, esc = C.esc;
  const sg = (n) => (n >= 0 ? '+' : '−') + Math.abs(n);
  const link = (kind, id, text) => {
    if (kind === 'item' && !C.get('item', id) && C.get('tool', id)) kind = 'tool';   // инструменты в инвентаре — статьи вида tool
    return C.get(kind, id) ? C.link(kind, id, null, esc(text)) : esc(text);
  };
  const ico = (n) => (FR.icons ? FR.icons.svg(n) : '');
  let pre = 'sh';
  /* число с разбором: calc-атом + кнопка-источник подсказки */
  function num(key, title, value, parts, see, summary, cls, inner) {
    C.put({ kind: 'calc', id: pre + '-' + key, name: title, parts, total: value, see: see ? [see] : undefined, summary, vis: 'hidden' });
    return `<button type="button" class="${cls || 'ref'}" data-ref="calc:${pre}-${key}">${inner == null ? esc(value) : inner}</button>`;
  }
  const S = FR.sheet = { num, sg };
  const use = (o) => { pre = (o && o.key) || 'sh'; };

  S.vitals = function (sh, o) {
    use(o); o = o || {}; const dm = o.dm || {};
    const per = sh.skills.find((s) => s.id === 'perception') || { total: 0 };
    const hp = o.hp || { cur: sh.hpMax, max: sh.hpMax };
    const v = (key, k, value, parts, see, summary, extra) => num(key, k + ' ' + value, value, parts.concat(dm[key] ? [[dm[key].split(' ')[0], '✎ ' + dm[key].split(' ').slice(1).join(' '), { dm: 1 }]] : []), see, summary,
      'vit-i' + (dm[key] ? ' is-dm' : '') + (extra || ''), `<b>${esc(value)}</b><span>${k}</span>`);
    const perState = o.state && o.state.pp ? ' is-state' : '';
    return `<div class="vit">` +
      v('ac', 'КД', String(sh.ac), (sh.acParts || [[String(sh.ac), sh.acLabel || 'без доспеха']]).map((p) => [p[0], esc(p[1])]).concat((sh.acNotes || []).map((n) => ['', esc(n)])), 'rule:armor-class') +
      (o.noHp ? '' : num('hp', 'Хиты', String(hp.cur), [[String(hp.max), 'максимум хитов'], ...(hp.temp ? [['+' + hp.temp, 'временные хиты', { state: 1 }]] : []), [sh.hd || '', '[[rule:hit-dice|Кости Хитов]]']], 'rule:hit-points', null,
        'vit-i', `<b>${hp.cur}<small>/${hp.max}</small></b><span>Хиты</span>`)) +
      v('init', 'Инициатива', sg(sh.init), sh.initParts, 'rule:initiative', '[[rule:proficiency|Бонус мастерства]] к инициативе не прибавляется.') +
      v('speed', 'Скорость', sh.speed.walk + ' фт', [[sh.speed.walk + ' фт', 'пешком'], ...(sh.speed.swim ? [[sh.speed.swim + ' фт', 'плавая']] : []), ...(sh.speed.climb ? [[sh.speed.climb + ' фт', 'лазая']] : []), ...(sh.speed.fly ? [[sh.speed.fly + ' фт', 'летая']] : [])], 'rule:speed') +
      v('prof', 'Мастерство', sg(sh.prof), [[sg(sh.prof), 'на 1–4 уровнях; растёт на 5, 9, 13 и 17']], 'rule:proficiency') +
      v('pp', 'Пасс. Вним.', String(sh.passive.perception), [['10', 'основа [[rule:ability-check#passive|пассивной проверки]]'], [sg(per.total), '[[skill:perception|Внимательность]]']], 'rule:ability-check', null, perState) +
      `</div>`;
  };

  S.hpBar = function (cur, max, temp) {
    const pct = max ? Math.max(0, Math.min(100, cur / max * 100)) : 0, t = max ? Math.min(100 - pct, (temp || 0) / max * 100) : 0;
    return `<div class="hp-bar${pct < 25 ? ' is-low' : pct <= 50 ? ' is-mid' : ''}${temp ? ' has-temp' : ''}" style="--hp:${pct}%;--temp:${t}%"><b>${cur}<small>/${max}</small></b><span class="hp-track"><i></i><i class="t"></i></span><span class="hp-note">${temp ? '+' + temp + ' временных' : pct < 25 ? 'меньше четверти' : pct <= 50 ? 'половина и меньше' : 'больше половины'}</span></div>`;
  };

  S.meds = function (sh, o) {
    use(o);
    return `<div class="meds">${sh.abilities.map((a) => `<div class="med"><span class="med-k">${ico('abil-' + a.id)}${link('abil', a.id, a.short)}</span><span class="med-ring">` +
      num('ab-' + a.id, a.name + ' ' + a.total + ' (' + sg(a.mod) + ')', a.total == null ? '—' : sg(a.mod), a.calc.concat(a.parts.length > 1 ? a.parts.map((p) => [p[0], 'из них: ' + p[1]]) : []), 'rule:modifier', null, 'med-v') +
      `</span><span class="med-s">${a.total == null ? '—' : a.total}</span></div>`).join('')}</div>`;
  };

  const dot = (s) => `<i class="${s.exp ? 'prof-expert' : s.prof ? 'prof' : 'prof-none'}" title="${s.exp ? 'компетентность' : s.prof ? 'владение' : 'нет владения'}"></i>`;
  S.saves = function (sh, o) {
    use(o);
    return sh.saves.map((s) => `<div class="li">${dot(s)}<span class="li-n">${link('abil', s.id, s.name)}</span>` +
      num('sv-' + s.id, 'Спасбросок: ' + s.name + ' ' + sg(s.total), sg(s.total), s.parts, 'rule:saving-throw', null, 'li-v') + `</div>`).join('');
  };
  S.skills = function (sh, o) {
    use(o);
    const short = {}; sh.abilities.forEach((a) => { short[a.id] = a.short; });
    return sh.skills.map((s) => `<div class="li">${dot(s)}<span class="li-n">${link('skill', s.id, s.name)} <small>${esc(short[s.abil] || '')}${s.exp ? ' · компетентность' : ''}</small></span>` +
      num('sk-' + s.id, s.name + ' ' + sg(s.total), sg(s.total), s.parts, 'skill:' + s.id, null, 'li-v') + `</div>`).join('');
  };
  S.legend = () => `<span class="li-legend"><span><i class="prof"></i>владение</span><span><i class="prof-expert"></i>компетентность</span></span>`;

  S.attacks = function (sh) {
    const nm = (a) => a.kind === 'spell' ? link('spell', a.id, a.name) : a.id ? link('item', a.id, a.name) : esc(a.name);
    return `<table class="atk"><thead><tr><th>Чем</th><th>Бросок</th><th>Урон</th></tr></thead><tbody>${sh.attacks.map((a) =>
      `<tr><td>${nm(a)}${a.notes ? `<small>${C.inline(a.notes)}</small>` : ''}</td><td>${C.inline(a.hit)}</td><td>${C.inline(a.dmg === '0' ? '—' : a.dmg)} ${esc(a.dt || '')}</td></tr>`).join('') ||
      '<tr><td colspan="3" class="muted">Атак нет.</td></tr>'}</tbody></table>`;
  };

  S.magic = function (sh) {
    const cast = sh.casting; if (!cast) return '';
    const by = {}; cast.spells.forEach((s) => { (by[s.lvl] = by[s.lvl] || []).push(s); });
    return `<div class="mag-stats">${cast.blocks.map((b) => `<div class="mag-b"><span>${esc(b.name)}</span><div><b>${b.dc}</b><small>${link('rule', 'spell-dc', 'Сл')}</small></div><div><b>${esc(b.atk)}</b><small>атака</small></div>${b.pact ? `<div><b>${b.pact.n}</b><small>ячейки ${b.pact.lvl} кр.</small></div>` : ''}</div>`).join('')}</div>` +
      Object.keys(by).sort().map((l) => `<div class="mag-row"><span class="mag-l">${+l ? l + ' круг' : 'Заговоры'}</span><span>${by[l].map((s) => link('spell', s.id, s.name)).join(', ')}</span></div>`).join('');
  };

  S.features = function (sh) {
    return sh.features.map((f) => `<details class="feat-row"><summary>${C.get('feature', f.id) ? C.link('feature', f.id, null, esc(f.name)) : `<b>${esc(f.name)}</b>`}<small>${esc(f.from || '')}${f.uses ? ' · ' + esc(f.uses) : ''}</small></summary><div class="fr-md">${C.inline(f.desc || '')}</div></details>`).join('') || '<p class="muted">—</p>';
  };
})();
