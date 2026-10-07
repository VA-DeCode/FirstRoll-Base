/* Кодекс · импорт из данных Кузницы героев.
   Подключать ПОСЛЕ Кузница/data/*.js (window.DND.data) и ПОСЛЕ статей codex/data/*.js, ДО shared/codex.js не обязательно (индекс ленивый).
   Что делает: превращает расы, классы, подклассы, умения, предыстории, черты, заклинания, варианты умений, снаряжение,
   свойства оружия, характеристики, навыки, языки, инструменты, богов и мировоззрения Кузницы в атомы Кодекса.
   Правило слияния: статья, написанная руками в codex/data, главнее — импорт только ДОПОЛНЯЕТ её недостающими полями.
   Поэтому ручная статья может быть частичной: { kind:'race', id:'tiefling', summary:'…со [[ссылками]]…' } —
   механику (скорость, черты, таблицы) добавит импорт. id — те же, что в Кузнице (docs/forge/ids.md).
   Если данных Кузницы на странице нет, файл ничего не делает. */
(function () {
  const DND = window.DND = window.DND || {};
  const D = DND.data; if (!D || !D.races) return;
  const atoms = DND.atoms = DND.atoms || [];
  const have = new Map(atoms.map((a) => [a.kind + ':' + a.id, a]));
  const put = (a) => {
    const k = a.kind + ':' + a.id, old = have.get(k);
    if (old) { for (const [f, v] of Object.entries(a)) if (old[f] == null) old[f] = v; return old; }
    a.vis = a.vis || 'public'; a.from = 'forge';
    atoms.push(a); have.set(k, a); return a;
  };
  const src = (s) => (D.sources && D.sources[s] && D.sources[s].short) || s;
  const ABIL = {}; (D.abilities || []).forEach((x) => { ABIL[x.id] = x; });
  const abil = (id, form) => ABIL[id] ? `[[abil:${id}|${form || ABIL[id].name}]]` : id;
  const abilShort = (id) => ABIL[id] ? `[[abil:${id}|${ABIL[id].short}]]` : id;
  const SK = {}; (D.skills || []).forEach((x) => { SK[x.id] = x; });
  const skill = (id) => SK[id] ? `[[skill:${id}|${SK[id].name}]]` : id;
  const GEN = { str: 'Силы', dex: 'Ловкости', con: 'Телосложения', int: 'Интеллекта', wis: 'Мудрости', cha: 'Харизмы' };
  const ITEMS = {}; [].concat(D.weapons || [], D.armor || [], D.gear || [], D.packs || []).forEach((x) => { ITEMS[x.id] = x; });
  const itemLink = (tok) => { const m = /^([\w-]+)(?:\*(\d+))?$/.exec(tok) || []; const it = ITEMS[m[1]]; return it ? `[[item:${it.id}|${it.name}]]${m[2] > 1 ? ' ×' + m[2] : ''}` : null; };
  const SP = {}; (D.spells || []).forEach((x) => { SP[x.id] = x; });
  const spell = (id) => SP[id] ? `[[spell:${id}|${SP[id].name}]]` : id;
  const dmgName = (dt) => (D.damageNames || {})[dt] || dt;
  /* Умения классов и подклассов, черты рас и подрас: одна статья на id. Одинаковое умение у разных владельцев — одна общая статья
     (Дополнительная атака, тёмное зрение, «Мастер школы»…), различия владельцев — блоками «## Владелец {#id-владельца}». Пишутся в конце. */
  const FEAT = new Map();
  const featRef = (f, kind, id, name) => {
    let e = FEAT.get(f.id); if (!e) FEAT.set(f.id, e = []);
    if (!e.some((x) => x.o.id === id)) e.push({ f, o: { kind, id, name } });
    return f.id;
  };
  const traitList = (arr, kind, owner, ownerName) => (arr || []).map((t) => `- **[[feature:${featRef(t, kind, owner, ownerName)}|${t.name}]].** ${t.desc || ''}`).join('\n');
  const asi = (o) => o ? Object.entries(o).map(([a, n]) => (n > 0 ? '+' : '−') + Math.abs(n) + ' ' + abilShort(a)).join(', ') : '';

  /* Характеристики и навыки */
  (D.abilities || []).forEach((a) => {
    const sks = (D.skills || []).filter((s) => s.abil === a.id);
    put({ kind: 'abil', id: a.id, name: a.name, word: a.name, src: 'КИ', summary: a.desc,
      body: `Модификатор: [[rule:modifier|(значение − 10) ÷ 2]].` + (sks.length ? `\n\n## Навыки {#skills}\n${sks.map((s) => `- ${skill(s.id)} — ${s.desc}`).join('\n')}` : '\n\nНавыков у этой характеристики нет.'),
      chips: [a.short], tags: ['характеристики'] });
  });
  (D.skills || []).forEach((s) => put({ kind: 'skill', id: s.id, name: s.name, src: 'КИ', summary: `${abil(s.abil)}. ${s.desc}`,
    body: `Проверка ${abil(s.abil, GEN[s.abil])} (${s.name}). ${s.desc}\n\nСм. [[rule:ability-check|проверка характеристики]].`, tags: ['навыки'] }));

  /* Свойства оружия, оружие, доспехи, снаряжение */
  Object.entries(D.weaponProps || {}).forEach(([id, p]) => put({ kind: 'prop', id, name: p.name[0].toUpperCase() + p.name.slice(1), src: 'КИ', summary: p.desc, tags: ['оружие'] }));
  (D.weapons || []).forEach((w) => put({ kind: 'item', id: w.id, name: w.name, src: 'КИ', cat: w.cat, use: w.kind, dmg: w.dmg, dt: w.dt, props: w.props, range: w.range, vers: w.vers, cost: w.cost, weight: w.weight,
    summary: `${w.cat === 'simple' ? 'Простое' : 'Воинское'} ${w.kind === 'melee' ? 'рукопашное' : 'дальнобойное'} оружие: ${w.dmg}${w.dt ? ` [[dmg:${w.dt}|${dmgName(w.dt)}]]` : ''}.` +
      (w.props && w.props.length ? ' ' + w.props.map((p) => `[[prop:${p}]]`).join(', ') + '.' : '') + (w.note ? ' ' + w.note[0].toUpperCase() + w.note.slice(1) + '.' : ''), tags: ['оружие'] }));
  const AT = { light: 'Лёгкий доспех', medium: 'Средний доспех', heavy: 'Тяжёлый доспех', shield: 'Щит' };
  (D.armor || []).forEach((a) => put({ kind: 'item', id: a.id, name: a.name, src: 'КИ', type: a.type, ac: a.ac, dexMax: a.dexMax, str: a.str, stealthDis: a.stealthDis, cost: a.cost, weight: a.weight,
    summary: a.type === 'shield' ? '+2 к [[rule:armor-class|КД]]. Нужна свободная рука.' :
      `${AT[a.type]}: [[rule:armor-class|КД]] ${a.ac}${a.dexMax === 0 ? '' : a.dexMax ? ' + [[abil:dex|Лов]] (макс. 2)' : ' + [[abil:dex|Лов]]'}.` + (a.str ? ` Нужна Сила ${a.str}, иначе скорость −10 фт.` : '') + (a.stealthDis ? ' [[rule:advantage#disadvantage|Помеха]] на [[skill:stealth|Скрытность]].' : ''),
    tags: ['доспехи'] }));
  (D.gear || []).forEach((g) => put({ kind: 'item', id: g.id, name: g.name, src: 'КИ', cat: g.cat, cost: g.cost, weight: g.weight, summary: g.desc || `Снаряжение${g.cost ? ` · ${g.cost} зм` : ''}.`, tags: ['снаряжение'] }));
  (D.packs || []).forEach((p) => put({ kind: 'item', id: p.id, name: p.name, src: 'КИ', cost: p.cost, summary: `Набор за ${p.cost} зм: ${(p.items || []).map((t) => itemLink(t) || t).join(', ')}.`, tags: ['снаряжение'] }));

  /* Расы и разновидности */
  (D.races || []).forEach((r) => {
    const dv = [].concat(r.traits || []).map((t) => t.grants && t.grants.darkvision).filter(Boolean)[0];
    put({ kind: 'race', id: r.id, name: r.name, en: r.en, src: src(r.src), size: r.size, speed: r.speed,
      summary: r.desc, chips: [r.size, r.speed + ' фт', dv ? 'тёмное зрение ' + dv : '', asi(r.asi), r.exotic ? 'экзотика' : ''].filter(Boolean),
      body: `*${r.tagline}.* Размер: ${r.size}, скорость ${r.speed} фт.` + (r.traits && r.traits.length ? `\n\n## Черты {#traits}\n${traitList(r.traits, 'race', r.id, r.name)}` : '') +
        (r.subraces && r.subraces.length ? `\n\n## Разновидности {#subraces}\n${r.subraces.map((s) => `- [[subrace:${s.id}|${s.name}]]${s.desc ? ' — ' + s.desc : ''}`).join('\n')}` : ''),
      tags: ['расы'] });
    (r.subraces || []).forEach((s) => put({ kind: 'subrace', id: s.id, name: s.name, en: s.en, src: src(s.src || r.src), race: r.id,
      summary: s.desc || `Разновидность: [[race:${r.id}|${r.name}]].`, chips: [asi(s.asi)].filter(Boolean),
      body: `Раса: [[race:${r.id}|${r.name}]].` + (s.traits && s.traits.length ? `\n\n## Черты {#traits}\n${traitList(s.traits, 'subrace', s.id, s.name)}` : ''), tags: ['расы'] }));
  });

  /* Классы, подклассы, умения */
  const addFeature = (f, owner, ownerKind, ownerName) => featRef(f, ownerKind, owner, ownerName);
  (D.classes || []).forEach((c) => {
    const feats = (c.features || []).map((f) => [f, addFeature(f, c.id, 'class', c.name)]);
    const subs = (D.subclasses || []).filter((s) => s.cls === c.id);
    const lv = [1, 2, 3].map((l) => [String(l), feats.filter(([f]) => f.level === l && !f.replaces).map(([f, id]) => `[[feature:${id}|${f.name}]]`).concat(l === c.subclassLevel ? [`[[class:${c.id}#subclasses|${c.subclassTitle}]]`] : []).join(', ') || '—']);
    put({ kind: 'class', id: c.id, name: c.name, en: c.en, src: src(c.src), hd: c.hd, saves: c.saves, primary: c.primary,
      summary: `${c.motto}. ${c.desc}`, levels: lv,
      chips: ['к' + c.hd, 'главное: ' + (c.primary || []).map(abilShort).join('/'), 'спасброски: ' + (c.saves || []).map(abilShort).join(', '), c.difficulty],
      body: `- Кость Хитов: к${c.hd}\n- Главные характеристики: ${(c.primary || []).map((a) => abil(a)).join(', ')}\n- [[rule:saving-throw|Спасброски]]: ${(c.saves || []).map((a) => abil(a)).join(', ')}` +
        (c.skills ? `\n- Навыки: ${c.skills.count} ${Array.isArray(c.skills.from) ? 'из ' + c.skills.from.map(skill).join(', ') : 'любых'}` : '') +
        `\n\n## Уровни 1–3 {#levels}\n| Ур. | Что получаешь |\n|---|---|\n${lv.map(([l, t]) => `| ${l} | ${t} |`).join('\n')}` +
        `\n\n## Умения {#features}\n${feats.map(([f, id]) => `- **[[feature:${id}|${f.name}]]** (${f.level} ур.) — ${f.desc}`).join('\n')}` +
        (subs.length ? `\n\n## ${c.subclassTitle} {#subclasses}\nВыбирается на ${c.subclassLevel}-м уровне.\n\n${subs.map((s) => `- [[sub:${s.id}|${s.name}]] — ${s.desc}`).join('\n')}` : ''),
      tags: ['классы'] });
    subs.forEach((s) => {
      const sf = (s.features || []).map((f) => [f, addFeature(f, s.id, 'sub', s.name)]);
      const lists = [['Заклинания подкласса', s.spells], ['Расширенный список', s.expanded]].filter((x) => x[1])
        .map(([t, o]) => `\n\n## ${t} {#spells}\n${Object.entries(o).map(([l, ids]) => `- ${l}: ${ids.map(spell).join(', ')}`).join('\n')}`).join('');
      put({ kind: 'sub', id: s.id, name: s.name, en: s.en, src: src(s.src), cls: c.id, summary: s.desc,
        body: `${c.subclassTitle} · класс [[class:${c.id}|${c.name}]].` +
          (sf.length ? `\n\n## Умения {#features}\n${sf.map(([f, id]) => `- **[[feature:${id}|${f.name}]]** (${f.level} ур.) — ${f.desc}`).join('\n')}` : '') + lists,
        tags: ['подклассы'] });
    });
  });

  /* Статьи умений и черт (см. FEAT выше) */
  const most = (arr) => { const n = new Map(); arr.forEach((x) => n.set(x, (n.get(x) || 0) + 1)); return [...n].sort((a, b) => b[1] - a[1])[0][0]; };
  for (const [id, own] of FEAT) {
    const f0 = own[0].f, name = f0.common || most(own.map((x) => x.f.name)), desc = most(own.map((x) => x.f.desc || ''));
    const race = own[0].o.kind === 'race' || own[0].o.kind === 'subrace';
    const from = own.map(({ f, o }) => `[[${o.kind}:${o.id}|${o.name}]]` + (f.name !== name ? ` («${f.name}»)` : '') + (f.level ? `, ${f.level}-й уровень` : '')).join('; ');
    const blocks = own.length > 1 ? own.filter(({ f }) => (f.desc || '') !== desc)
      .map(({ f, o }) => `## ${o.name}${f.name !== name ? ': ' + f.name : ''} {#${o.id}}\n${f.desc || ''}`).join('\n\n') : '';
    put({ kind: 'feature', id, name, en: f0.en, src: f0.tce ? 'Таша' : undefined, level: f0.level, summary: desc,
      owners: own.map(({ o }) => o.kind + ':' + o.id),
      body: `Откуда: ${from}.` + (blocks ? '\n\n' + blocks : ''), tags: [race ? 'расы' : 'умения'] });
  }

  /* Предыстории и черты */
  (D.backgrounds || []).forEach((b) => put({ kind: 'bg', id: b.id, name: b.name, en: b.en, src: src(b.src), summary: b.desc,
    chips: (b.skills || []).map((s) => (SK[s] || {}).name).filter(Boolean),
    body: `- Навыки: ${(b.skills || []).map(skill).join(', ') || '—'}` + (b.tools && b.tools.length ? `\n- Инструменты: ${b.tools.map((t) => `[[tool:${t}]]`).join(', ')}` : '') +
      ((b.choices || []).length ? `\n- На выбор: ${b.choices.map((c) => c.label).join(', ')}` : '') +
      (b.equipment ? `\n- Снаряжение: ${b.equipment.map((t) => itemLink(t) || t).join(', ')}${b.gold ? `, ${b.gold} зм` : ''}` : '') +
      (b.feature ? `\n\n## ${b.feature.name} {#feature}\n${b.feature.desc}` : '') +
      (b.variants ? `\n\n## Разновидности {#variants}\n${b.variants.map((v) => `- **${v.name}.** ${v.desc || ''}`).join('\n')}` : ''),
    tags: ['предыстории'] }));
  (D.feats || []).forEach((f) => put({ kind: 'feat', id: f.id, name: f.name, en: f.en, src: src(f.src), summary: f.desc, tags: ['черты'] }));

  /* Заклинания */
  const CL = D.classLetters || {};
  const clsNames = (letters) => (letters || '').split('').map((l) => { const c = (D.classes || []).find((x) => x.id === CL[l]); return c ? `[[class:${c.id}|${c.name}]]` : null; }).filter(Boolean).join(', ');
  (D.spells || []).forEach((s) => put({ kind: 'spell', id: s.id, name: s.name, en: s.en, src: src(s.src), lvl: s.lvl, school: (D.schools || {})[s.school] || s.school,
    time: s.time, range: s.range, comp: s.comp, dur: s.dur, conc: s.conc, ritual: s.ritual,
    summary: s.desc,
    chips: [s.conc ? '[[rule:concentration|концентрация]]' : '', s.ritual ? 'ритуал' : '', s.dmg ? `${s.dmg}${s.dt ? ` [[dmg:${s.dt}|${dmgName(s.dt)}]]` : ''}` : '', s.heal ? 'лечение ' + s.heal : '',
      s.save ? `[[rule:saving-throw|спасбросок]] ${abilShort(s.save)}` : '', s.atk ? `[[rule:spell-dc#attack|${s.atk === 'ranged' ? 'дальнобойная' : 'рукопашная'} атака]]` : ''].filter(Boolean),
    body: `- Классы: ${clsNames(s.cls)}${s.tce ? `; по Таше также: ${clsNames(s.tce)}` : ''}\n- Компоненты: ${s.comp}`, tags: ['магия'] }));

  /* Варианты умений: боевые стили, воззвания, метамагия… id = группа-id */
  Object.entries(D.options || {}).forEach(([g, arr]) => Array.isArray(arr) && arr.forEach((o) => put({ kind: 'option', id: g + '-' + o.id, name: o.name, en: o.en, src: src(o.src), group: g, summary: o.desc || '', tags: ['умения'] })));

  /* Языки, инструменты, боги, мировоззрения */
  const LT = { standard: 'обычный', exotic: 'экзотический', rare: 'редкий', secret: 'тайный' };
  (D.languages || []).forEach((l) => put({ kind: 'lang', id: l.id, name: l.name, src: 'КИ', summary: `${LT[l.type] || ''} язык. Говорят: ${l.speakers}. Письменность: ${l.script}.`.replace(/^./, (c) => c.toUpperCase()), tags: ['языки'] }));
  (D.tools || []).forEach((t) => put({ kind: 'tool', id: t.id, name: t.name, src: 'КИ', summary: `${(D.toolCats || {})[t.cat] || 'инструменты'}. Владение позволяет добавлять [[rule:proficiency|бонус мастерства]] к проверкам с ними.${t.cost ? ` Цена: ${t.cost} зм.` : ''}`.replace(/^./, (c) => c.toUpperCase()), tags: ['инструменты'] }));
  (D.deities || []).forEach((d) => put({ kind: 'deity', id: d.id, name: d.name, src: src('SCAG'), summary: `${d.title[0].toUpperCase() + d.title.slice(1)}. Домены: ${d.domains.join(', ')}. Мировоззрение: ${d.al}.`, body: `${d.title[0].toUpperCase() + d.title.slice(1)}.\n\n- Домены: ${d.domains.join(', ')}\n- Мировоззрение: ${d.al}\n- Символ: ${d.symbol}`, tags: ['боги'] }));
  (D.alignments || []).forEach((a) => put({ kind: 'align', id: a.id, name: a.name, src: 'КИ', chips: [a.short], summary: a.desc, tags: ['мировоззрение'] }));
})();
