/* FirstRoll · Кодекс: загрузка атомов, индекс, разметка ссылок [[вид:id#блок|словоформа]] и мини-разметка текста.
   Без сборки и модулей: подключается обычным <script src>, работает и с диска (file://).
   Статьи лежат в codex/data/*.js и складываются в window.DND.atoms (см. README). */
(function () {
  const FR = window.FR = window.FR || {};
  const DND = window.DND = window.DND || {};
  DND.atoms = DND.atoms || [];

  FR.config = Object.assign({
    /* Адрес статьи справочника. {kind} и {id} подставляются, блок добавляется как #якорь.
       null — по умолчанию: от <body data-root> страницы (с диска codex/index.html?{kind}/{id}, на сайте codex/{kind}/{id}).
       Свой шаблон задают Кодекс (codex/app.js) и страницы Стола (абсолютные /fr/codex/…). */
    codexUrl: null,
    /* Свой адрес для отдельных видов: { guide: '../start/#{id}' }. guide по умолчанию — «Первые шаги» от data-root */
    kindUrl: {}
  }, FR.config || {});
  const defUrl = (kind) => {
    const body = typeof document !== 'undefined' && document.body;
    const root = (body && body.dataset.root) || './';
    const file = typeof location !== 'undefined' && location.protocol === 'file:';
    return kind === 'guide' ? root + 'start/' + (file ? 'index.html' : '') + '#{id}' : root + 'codex/' + (file ? 'index.html?' : '') + '{kind}/{id}';
  };

  /* Виды атомов = префиксы ссылок. Подпись — для шапки карточки. */
  const KINDS = {
    rule: 'Правило', action: 'Действие', cond: 'Состояние', dmg: 'Вид урона', prop: 'Свойство оружия',
    abil: 'Характеристика', skill: 'Навык', race: 'Раса', subrace: 'Разновидность расы', class: 'Класс', sub: 'Подкласс',
    feature: 'Умение', option: 'Вариант умения', feat: 'Черта', bg: 'Предыстория', spell: 'Заклинание', item: 'Предмет',
    guide: 'Первые шаги', lang: 'Язык', tool: 'Инструменты', deity: 'Божество', align: 'Мировоззрение', mon: 'Монстр', npc: 'NPC', loc: 'Место',
    hazard: 'Опасность',   // ловушки, болезни, опасности местности (поле type: 'trap' | 'disease' | 'environment')
    calc: 'Откуда число'
  };
  /* В тексте эти виды по умолчанию пишутся со строчной: [[cond:poisoned]] → «отравленный». */
  const LOWER = { rule: 1, action: 0, cond: 1, dmg: 1, prop: 1 };

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const lcfirst = (s) => s ? s[0].toLowerCase() + s.slice(1) : s;
  const norm = (s) => String(s || '').toLowerCase().replace(/ё/g, 'е');
  const REF = /\[\[([a-z]+):([^\]|#]+)(?:#([^\]|]+))?(?:\|([^\]]+))?\]\]/g;

  let idx = null, seen = 0;
  function index() {
    if (idx && seen === DND.atoms.length) return idx;
    idx = new Map();
    for (const a of DND.atoms) {
      const k = a.kind + ':' + a.id;
      if (idx.has(k)) console.warn('[Кодекс] повтор id', k);
      idx.set(k, a);
    }
    seen = DND.atoms.length;
    return idx;
  }

  const C = FR.codex = { kinds: KINDS, esc, norm };
  /* Показывать ли мастерское (блоки {#id dm}, заметки): FR.config.dm или «взгляд мастера» в подсказках */
  C.showDm = () => !!(FR.config.dm || (FR.tips && FR.tips.opts && FR.tips.opts.dm));

  C.add = (list) => { DND.atoms.push(...[].concat(list)); };
  /* Добавить или заменить атом (для разборов чисел, которые пересчитываются на лету) */
  C.put = (atom) => { const i = DND.atoms.findIndex((x) => x.kind === atom.kind && x.id === atom.id); if (i >= 0) DND.atoms[i] = atom; else DND.atoms.push(atom); idx = null; };
  C.all = () => { index(); return DND.atoms; };
  C.byKind = (kind) => C.all().filter((a) => a.kind === kind);

  /* 'cond:poisoned#x' или (kind, id) → атом */
  C.parse = function (ref) {
    const m = /^([a-z]+):([^#]+)(?:#(.+))?$/.exec(ref || '');
    return m ? { kind: m[1], id: m[2], block: m[3] || null, key: m[1] + ':' + m[2] } : null;
  };
  C.get = (kind, id) => index().get(id == null ? String(kind).split('#')[0] : kind + ':' + id) || null;

  /* Блок внутри статьи: заголовок вида «### Наполовину {#half}» в body. */
  C.block = function (atom, bid) {
    if (!atom || !atom.body || !bid) return null;
    const lines = atom.body.split('\n');
    const H = /^(#{2,4})\s+(.+?)\s*\{#([\w-]+)(\s+dm)?\}\s*$/;
    for (let i = 0; i < lines.length; i++) {
      const m = H.exec(lines[i]);
      if (!m || m[3] !== bid) continue;
      const lvl = m[1].length, out = [];
      for (let j = i + 1; j < lines.length; j++) {
        const h = /^(#{2,4})\s/.exec(lines[j]);
        if (h && h[1].length <= lvl) break;
        out.push(lines[j]);
      }
      return { id: bid, title: m[2], md: out.join('\n').trim(), dm: !!m[4] };
    }
    return null;
  };
  C.blocks = function (atom) {
    const r = []; if (!atom || !atom.body) return r;
    atom.body.replace(/^(#{2,4})\s+(.+?)\s*\{#([\w-]+)(\s+dm)?\}\s*$/gm, (_, l, t, id, dm) => { r.push({ id, title: t, dm: !!dm }); });
    return r;
  };

  /* Разрешить ссылку: { atom, block, ref } или null */
  C.resolve = function (ref) {
    const p = typeof ref === 'string' ? C.parse(ref) : ref; if (!p) return null;
    const atom = C.get(p.key); if (!atom) return null;
    const block = p.block ? C.block(atom, p.block) : null;
    if (p.block && !block) return null;
    return { atom, block, ref: p };
  };

  C.url = function (ref) {
    const p = typeof ref === 'string' ? C.parse(ref) : ref; if (!p) return '#';
    const own = FR.config.kindUrl && FR.config.kindUrl[p.kind];   // например, guide → «Первые шаги»
    const tpl = own || (p.kind === 'guide' || !FR.config.codexUrl ? defUrl(p.kind) : FR.config.codexUrl);
    return tpl.replace('{kind}', p.kind).replace('{id}', encodeURIComponent(p.id)) + (p.block ? '#' + p.block : '');
  };

  /* Текст ссылки по умолчанию */
  C.word = function (r) {
    const a = r.atom, lower = LOWER[a.kind];
    if (r.block) return lower ? lcfirst(r.block.title) : r.block.title;
    if (a.word) return a.word;
    return lower ? lcfirst(a.name) : a.name;
  };

  /* Одна ссылка → HTML */
  C.link = function (kind, id, block, label) {
    const ref = kind + ':' + id + (block ? '#' + block : '');
    const r = C.resolve(ref);
    if (!r) {
      if (C.debug !== false) console.warn('[Кодекс] нет статьи для ссылки', ref);
      return `<span class="ref is-missing" title="Нет статьи: ${esc(ref)}">${label ? label : esc(id)}</span>`;
    }
    const I = FR.icons, ico = I && I.inline[kind] ? I.forAtom(r.atom) : '';
    // vis:'hidden' — атом только этой страницы (предмет инвентаря, разбор числа): подсказка есть, статьи в справочнике нет
    const href = r.atom.vis === 'hidden' ? 'role="button" tabindex="0"' : `href="${esc(C.url(ref))}"`;
    return `<a class="ref ref-${kind}" ${href} data-ref="${esc(ref)}">${ico}${label ? label : esc(C.word(r))}</a>`;
  };

  /* Строка: экранирование, ссылки, **жирный**, *курсив* */
  C.inline = function (s) {
    if (s == null) return '';
    const parts = [];
    let out = esc(s).replace(REF, (_, k, id, b, lab) => { parts.push(C.link(k, id, b, lab ? fmt(lab) : null)); return '\u0000' + (parts.length - 1) + '\u0000'; });
    out = fmt(C.auto(out, parts));
    return out.replace(/\u0000(\d+)\u0000/g, (_, i) => parts[i]);
  };
  /* Автовыделение ключевого: кости (1к8 + 3 — жирным и со значком кости), «Сл 12», «КД 14», модификаторы «+2», расстояния «30 фт».
     Работает по уже экранированному тексту; готовый HTML уходит в parts под заглушкой, чтобы следующие шаги его не трогали. */
  const LET = 'A-Za-zА-Яа-яЁё';
  const DICE = new RegExp(`(^|[^0-9${LET}])(\\d*)к(100|20|12|10|8|6|4)(?![0-9${LET}])((?:\\s*[+−]\\s*\\d+(?![0-9]))*)`, 'g');
  C.auto = function (s, parts) {
    const hold = (html) => { parts.push(html); return '\u0000' + (parts.length - 1) + '\u0000'; };
    const I = FR.icons;
    return s
      .replace(DICE, (_, pre, n, d, mod) => pre + hold(`<b class="dice">${I ? I.die(d) : ''}${n}к${d}${mod.replace(/\s*([+−])\s*/g, ' $1 ')}</b>`))
      .replace(new RegExp(`(^|[\\s(«])(Сл|КД)\\s?(\\d+)(?![0-9])`, 'g'), (_, pre, w, n) => pre + hold(`<b class="kw">${w} ${n}</b>`))
      .replace(new RegExp(`(^|[\\s(«/])([+−]\\d+)(?![0-9${LET}])`, 'g'), (_, pre, v) => pre + hold(`<b class="kw">${v}</b>`))
      .replace(new RegExp(`(^|[^0-9${LET}\\u0000])(\\d+(?:\\/\\d+)?)\\s?(фт\\.?|футов|фута|фут)(?![${LET}])`, 'g'), (_, pre, n, u) => pre + hold(`<b class="kw">${n} ${u}</b>`));
  };
  function fmt(s) {
    return s.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/(^|[^*\w])\*(?!\s)(.+?)\*(?!\w)/g, '$1<i>$2</i>');
  }

  /* Блоки: абзацы, «- » списки, «1. » списки, «> » врезка, таблицы «| a | b |», заголовки «## Текст {#якорь}» */
  C.md = function (text, opt) {
    if (!text) return '';
    const hShift = (opt && opt.hShift) || 0;
    const L = String(text).replace(/\r/g, '').split('\n');
    const out = []; let para = [], i = 0;
    const flush = () => { if (para.length) { out.push('<p>' + C.inline(para.join(' ')) + '</p>'); para = []; } };
    while (i < L.length) {
      const line = L[i], t = line.trim();
      let m;
      if (!t) { flush(); i++; continue; }
      if ((m = /^(#{2,4})\s+(.+?)(?:\s*\{#([\w-]+)(\s+dm)?\})?\s*$/.exec(t))) {
        flush();
        if (m[4]) {   // блок только для мастера: «## Заголовок {#id dm}» — до следующего заголовка того же уровня или выше
          const lvl = m[1].length, sub = [];
          i++;
          while (i < L.length) { const h = /^(#{2,4})\s/.exec(L[i].trim()); if (h && h[1].length <= lvl) break; sub.push(L[i]); i++; }
          if (C.showDm()) out.push(`<section class="dm-only"${m[3] ? ` id="${m[3]}"` : ''}><div class="dm-label">${FR.icons ? FR.icons.svg('dm') : ''}Только мастеру</div>` + C.md(`${m[1]} ${m[2]}\n${sub.join('\n')}`, opt) + '</section>');
          continue;
        }
        const n = Math.min(6, m[1].length + hShift);
        out.push(`<h${n}${m[3] ? ` id="${m[3]}"` : ''}>${C.inline(m[2])}</h${n}>`); i++; continue;
      }
      if (/^\|/.test(t)) {
        flush(); const rows = [];
        while (i < L.length && /^\|/.test(L[i].trim())) { const r = L[i].trim(); if (!/^\|[\s:|-]+\|$/.test(r)) rows.push(cells(r)); i++; }
        const [hd, ...body] = rows;
        out.push('<div class="md-table"><table><thead><tr>' + hd.map((c) => `<th>${C.inline(c)}</th>`).join('') + '</tr></thead><tbody>' +
          body.map((r) => '<tr>' + r.map((c) => `<td>${C.inline(c)}</td>`).join('') + '</tr>').join('') + '</tbody></table></div>');
        continue;
      }
      if (/^[-*]\s+/.test(t) || /^\d+\.\s+/.test(t)) {
        flush(); const ol = /^\d+\./.test(t), items = [];
        while (i < L.length && (ol ? /^\d+\.\s+/ : /^[-*]\s+/).test(L[i].trim())) { items.push(L[i].trim().replace(/^([-*]|\d+\.)\s+/, '')); i++; }
        out.push(`<${ol ? 'ol' : 'ul'}>` + items.map((x) => `<li>${C.inline(x)}</li>`).join('') + `</${ol ? 'ol' : 'ul'}>`);
        continue;
      }
      if (/^>\s?/.test(t)) {
        flush(); const q = [];
        while (i < L.length && /^>\s?/.test(L[i].trim())) { q.push(L[i].trim().replace(/^>\s?/, '')); i++; }
        out.push('<blockquote>' + C.md(q.join('\n')) + '</blockquote>');
        continue;
      }
      para.push(t); i++;
    }
    flush();
    return out.join('');
  };

  /* Ячейки строки таблицы: «|» внутри [[…|…]] не делит ячейку */
  function cells(row) {
    const r = row.replace(/^\|/, '').replace(/\|$/, ''), out = []; let cur = '', d = 0;
    for (let i = 0; i < r.length; i++) {
      if (r[i] === '[' && r[i + 1] === '[') { d++; cur += '[['; i++; continue; }
      if (r[i] === ']' && r[i + 1] === ']') { d = Math.max(0, d - 1); cur += ']]'; i++; continue; }
      if (r[i] === '|' && !d) { out.push(cur.trim()); cur = ''; continue; }
      cur += r[i];
    }
    out.push(cur.trim());
    return out;
  }

  /* Все ссылки в строках атома (рекурсивно по полям) */
  C.refsIn = function (obj) {
    const found = [];
    (function walk(v) {
      if (typeof v === 'string') { let m; REF.lastIndex = 0; while ((m = REF.exec(v))) found.push(m[1] + ':' + m[2] + (m[3] ? '#' + m[3] : '')); }
      else if (Array.isArray(v)) v.forEach(walk);
      else if (v && typeof v === 'object') Object.values(v).forEach(walk);
    })(obj);
    return found;
  };

  /* Проверка базы: битые ссылки, пустые summary. В консоли: FR.codex.check() */
  C.check = function () {
    const bad = [], thin = [];
    for (const a of C.all()) {
      if (!a.summary && a.kind !== 'calc') thin.push(a.kind + ':' + a.id);
      for (const r of C.refsIn(a)) if (!C.resolve(r)) bad.push({ from: a.kind + ':' + a.id, ref: r });
      for (const s of a.see || []) if (!C.resolve(s)) bad.push({ from: a.kind + ':' + a.id, ref: s, field: 'see' });
    }
    return { atoms: C.all().length, broken: bad, noSummary: thin };
  };

  /* Кто ссылается на атом */
  C.backlinks = function (key) {
    return C.all().filter((a) => C.refsIn(a).concat(a.see || []).some((r) => r.split('#')[0] === key) && a.kind + ':' + a.id !== key);
  };

  /* Поиск по названию, английскому названию и тегам */
  const TOP = { cond: 5, rule: 5, action: 5, dmg: 3 };   // при равенстве — то, что чаще ищут за столом
  C.search = function (q) {
    q = norm(q).trim(); if (!q) return [];
    const res = [];
    for (const a of C.all()) {
      if (a.vis === 'hidden' || a.kind === 'calc') continue;
      const n = norm(a.name), e = norm(a.en);
      let s = n === q ? 100 : n.startsWith(q) ? 80 : n.includes(q) ? 60 : e.includes(q) ? 50 : (a.tags || []).some((t) => norm(t).includes(q)) ? 30 : norm(a.summary).includes(q) ? 10 : 0;
      if (s) res.push([s + (TOP[a.kind] || 0), a]);
    }
    return res.sort((x, y) => y[0] - x[0] || x[1].name.localeCompare(y[1].name, 'ru')).map((x) => x[1]);
  };
})();
