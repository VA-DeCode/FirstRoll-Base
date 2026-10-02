/* Лист для показа: числа + разбор «откуда оно» (строки со ссылками Кодекса — для карточек «Откуда число»).
   Один расчёт на всех: лист Кузницы (sheet.html), живой лист Стола и «Мой персонаж» (их считает Стол — stol/lib/forge.js
   подключает этот же файл). Рисует лист shared/sheet.js (FR.sheet). Нужны data/*.js, core.js, rules.js. */
(function () {
  const DND = window.DND, I = DND.idx;
  const AB = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
  const GEN = { str: 'Силы', dex: 'Ловкости', con: 'Телосложения', int: 'Интеллекта', wis: 'Мудрости', cha: 'Харизмы' };
  const sg = (n) => (n >= 0 ? '+' : '−') + Math.abs(n);
  DND.sheetData = function (c, d) {
    d = d || DND.rules.derive(c);
    const P = d.prof, A = I.abilities;
    const abil = (a) => `[[abil:${a}|${A[a].name}]]`;
    const abilG = (a) => `[[abil:${a}|${GEN[a]}]]`;
    const rest = (parts, total) => { const sum = parts.reduce((s, p) => s + p[2], 0); if (sum !== total) parts.push([sg(total - sum), 'прочее: умения, черты, предметы', total - sum]); return parts.map((p) => p.slice(0, 2)); };
    const abilities = AB.map((a) => { const x = d.ab[a]; return { id: a, name: A[a].name, short: A[a].short, total: x.total, mod: x.mod,
      parts: [[String(x.base), 'значение'], ...(x.src || []).map((s) => [sg(s.n), s.why])], calc: [[String(x.total), 'значение ' + abil(a)], [sg(x.mod), '[[rule:modifier|модификатор]] = (значение − 10) ÷ 2, вниз']] }; });
    const saves = d.saves.map((s) => ({ id: s.id, name: s.name, prof: s.prof, total: s.total,
      parts: rest([[sg(d.ab[s.id].mod), 'модификатор ' + abilG(s.id), d.ab[s.id].mod], ...(s.prof ? [[sg(P), '[[rule:proficiency|бонус мастерства]]: класс владеет этим спасброском', P]] : [])], s.total) }));
    const skills = d.skills.map((s) => {
      const m = d.ab[s.abil].mod, pb = s.exp ? 2 * P : s.prof ? P : s.jack ? Math.floor(P / 2) : 0;
      const why = s.exp ? '[[rule:expertise|компетентность]]: мастерство ×2' : s.prof ? '[[rule:proficiency|бонус мастерства]]: владеешь навыком' : 'половина мастерства: Мастер на все руки';
      return { id: s.id, name: s.name, abil: s.abil, prof: s.prof, exp: s.exp, total: s.total,
        parts: rest([[sg(m), 'модификатор ' + abilG(s.abil), m], ...(pb ? [[sg(pb), why, pb]] : [])], s.total) };
    });
    const initParts = rest([[sg(d.ab.dex.mod), 'модификатор ' + abilG('dex'), d.ab.dex.mod]], d.init);
    const cast = d.casting && d.casting.blocks && d.casting.blocks.length ? {
      blocks: d.casting.blocks.map((b) => ({ name: b.name, abil: b.abil, dc: b.dc, atk: b.atk, main: !!b.main, pact: b.pact || null, slots: b.slots || null })),
      spells: (d.casting.spells || []).map((s) => ({ id: s.id, name: s.sp ? s.sp.name : s.id, lvl: s.sp ? s.sp.lvl : 0, from: s.from || (s.tags || []).join(', ') }))
    } : null;
    return {
      prof: P, ac: d.ac.value, acLabel: d.ac.label, acNotes: d.ac.notes || [], acParts: d.ac.parts || null, init: d.init, initParts, speed: d.speed, hpMax: d.hp.max, hd: d.hp.hd,
      abilities, saves, skills, passive: d.passive, attacks: d.attacks, casting: cast,
      features: (d.features || []).map((f) => ({ id: f.id, name: f.name, desc: f.desc, from: f.owner && f.owner.name, uses: f.uses || '' })),
      resist: d.resist || [], senses: d.senses || [], profs: d.profs || {}
    };
  };
})();
