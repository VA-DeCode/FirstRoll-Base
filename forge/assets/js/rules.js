/* Движок правил: собирает все выборы персонажа и вычисляет лист (5e 2014, уровни 1–3). */
(function () {
  const D = DND.data, I = DND.idx, U = DND.util;
  const R = DND.rules = {};
  const ABILS = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
  R.ABILS = ABILS;
  R.PB_COST = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };
  R.STANDARD = [15, 14, 13, 12, 10, 8];
  const PER = { short: 'короткий отдых', long: 'продолжительный отдых' };

  /* ───── Основные выборы ───── */
  R.race = (C) => I.races[C.race] || null;
  R.subrace = (C) => { const r = R.race(C); if (!r || !r.subraces) return null; const s = I.subraces[C.subrace]; return s && s.race === r.id ? s : null; };
  R.cls = (C) => I.classes[C.cls] || null;
  R.sub = (C) => { const c = R.cls(C); if (!c) return null; const s = I.subclasses[C.subclass]; return s && s.cls === c.id && C.level >= c.subclassLevel ? s : null; };
  R.bg = (C) => I.backgrounds[C.bg] || null;
  R.bgVariant = (C) => { const b = R.bg(C); return b && b.variants ? b.variants.find((v) => v.id === C.bgVariant) || null : null; };

  R.raceTraits = (C) => {
    const r = R.race(C); if (!r) return [];
    const s = R.subrace(C); const st = (s && s.traits) || [];
    const ids = new Set(st.map((t) => t.id));
    return (r.traits || []).filter((t) => !ids.has(t.id)).concat(st);
  };
  R.classFeatures = (C) => {
    const c = R.cls(C); if (!c) return [];
    return c.features.filter((f) => f.level <= C.level).filter((f) => {
      if (f.tce && !C.opt.tce) return false;
      if (f.replaces) return !!C.swap[f.replaces];
      if (C.opt.tce && C.swap[f.id]) return false;
      return true;
    });
  };
  R.swappable = (C) => { const c = R.cls(C); if (!c || !C.opt.tce) return []; return c.features.filter((f) => f.replaces && f.level <= C.level); };
  R.subFeatures = (C) => { const s = R.sub(C); return s ? s.features.filter((f) => f.level <= C.level) : []; };

  R.sel = (C, path, ch) => (C.ch[path] && C.ch[path].length) ? C.ch[path] : (ch && ch.def ? [ch.def] : []);
  R.optionOf = (ch, oid) => ch.options ? ch.options.find((o) => o.id === oid) || null : ((I.options[ch.group] || {})[oid] || null);
  R.optionsFor = (C, ch) => {
    let list = ch.options || D.options[ch.group] || [];
    if (ch.forClass) list = list.filter((o) => !o.for || o.for.includes(ch.forClass));
    if (ch.id === 'style' && ch.forClass === 'bard') list = list.filter((o) => o.id === 'dueling' || o.id === 'two-weapon');
    list = list.filter((o) => !o.tce || C.opt.tce);
    if (ch.group === 'beastCompanion') list = list.filter((o) => !o.tce || C.opt.tce);
    return list;
  };

  /* ───── Обход дерева выборов ───── */
  R.walk = function (C) {
    const W = { choices: [], grants: [], feats: [], options: [], features: [] };
    const visit = (node, prefix, owner, depth) => {
      if (!node || depth > 6) return;
      if (node.grants) W.grants.push({ g: node.grants, owner, prefix });
      (node.choices || []).forEach((ch) => {
        const path = prefix + '/' + ch.id;
        W.choices.push({ path, ch, owner, prefix });
        const sel = R.sel(C, path, ch);
        if (ch.type === 'option') {
          sel.forEach((oid) => {
            const opt = R.optionOf(ch, oid);
            if (opt) { W.options.push({ opt, path, owner, group: ch.group }); visit(opt, path + '>' + oid, owner, depth + 1); }
          });
        } else if (ch.type === 'feat') {
          sel.forEach((fid) => {
            const f = I.feats[fid];
            if (f) { const o = { kind: 'feat', id: fid, name: f.name }; W.feats.push({ feat: f, path: path + '>' + fid, owner }); visit(f, path + '>' + fid, o, depth + 1); }
          });
        }
      });
    };
    const r = R.race(C), s = R.subrace(C);
    if (r) {
      const owner = { kind: 'race', id: r.id, name: s ? s.name : r.name };
      W.grants.push({ g: { languages: (r.languages || []).concat((s && s.languages) || []) }, owner, prefix: 'r' });
      R.raceTraits(C).forEach((t) => { W.features.push({ f: t, owner, prefix: 'r/' + t.id }); visit(t, 'r/' + t.id, owner, 0); });
    }
    const c = R.cls(C);
    if (c) {
      const owner = { kind: 'class', id: c.id, name: c.name };
      W.grants.push({ g: { saves: c.saves, armor: c.armor, weapons: c.weapons, tools: c.tools || [] }, owner, prefix: 'c' });
      W.choices.push({ path: 'c/skills', ch: { id: 'skills', type: 'skill', count: c.skills.count, from: c.skills.from, label: 'Навыки класса' }, owner, prefix: 'c' });
      (c.toolChoices || []).forEach((tc) => W.choices.push({ path: 'c/' + tc.id, ch: tc, owner, prefix: 'c' }));
      R.classFeatures(C).forEach((f) => { W.features.push({ f, owner, prefix: 'c/' + f.id }); visit(f, 'c/' + f.id, owner, 0); });
      const sb = R.sub(C);
      if (sb) {
        const so = { kind: 'subclass', id: sb.id, name: sb.name };
        R.subFeatures(C).forEach((f) => { W.features.push({ f, owner: so, prefix: 's/' + f.id }); visit(f, 's/' + f.id, so, 0); });
      }
    }
    const b = R.bg(C);
    if (b) {
      const owner = { kind: 'background', id: b.id, name: b.name };
      const v = R.bgVariant(C);
      let skills = (b.skills || []).slice();
      if (v && v.replaceSkills) skills = skills.map((x) => v.replaceSkills[x] || x);
      W.grants.push({ g: { skills, tools: b.tools || [] }, owner, prefix: 'b' });
      visit({ choices: b.choices }, 'b', owner, 0);
    }
    return W;
  };

  /* ───── Сбор эффектов ───── */
  function aggregate(C, W) {
    const A = { skills: new Set(), saves: new Set(), armor: new Set(), weapons: new Set(), tools: new Set(), languages: new Set(),
      resist: new Set(), immune: new Set(), expertise: new Set(), spells: [], acAlt: [], natWeapons: [], initAbil: [], asi: {},
      darkvision: 0, dvAdd: 0, speedSet: 0, swim: 0, climb: 0, fly: 0, speedBonus: 0, speedUnarmored: 0, hpPerLevel: 0,
      acArmoredBonus: 0, rangedAttackBonus: 0, duelingBonus: 0, initBonus: 0, passiveBonus: 0, blindsight: 0, flags: {}, size: null, asiReplace: null };
    const addAll = (set, arr) => (arr || []).forEach((x) => set.add(x));
    const maxK = { darkvision: 1, swim: 1, climb: 1, fly: 1, blindsight: 1 };
    const sumK = { speedBonus: 1, speedUnarmored: 1, hpPerLevel: 1, acArmoredBonus: 1, rangedAttackBonus: 1, duelingBonus: 1, initBonus: 1, passiveBonus: 1, darkvisionAdd: 1 };
    const setK = { skills: 'skills', saves: 'saves', armor: 'armor', weapons: 'weapons', tools: 'tools', languages: 'languages', resist: 'resist', immune: 'immune', expertise: 'expertise' };
    W.grants.forEach(({ g, owner, prefix }) => {
      for (const [k, v] of Object.entries(g)) {
        if (setK[k]) addAll(A[setK[k]], v);
        else if (maxK[k]) A[k] = Math.max(A[k], v);
        else if (k === 'darkvisionAdd') A.dvAdd += v;
        else if (sumK[k]) A[k] += v;
        else if (k === 'speed') A.speedSet = Math.max(A.speedSet, v);
        else if (k === 'spells') v.forEach((sp) => A.spells.push(Object.assign({ owner, prefix, fixed: true }, sp, { abil: sp.abil === 'asi' ? ((C.ch[prefix + '/asi'] || [])[0] || 'cha') : sp.abil })));
        else if (k === 'acAlt') A.acAlt.push(v);
        else if (k === 'natWeapon') A.natWeapons.push(v);
        else if (k === 'initAbil') A.initAbil.push(v);
        else if (k === 'asi') for (const [a, n] of Object.entries(v)) A.asi[a] = (A.asi[a] || 0) + n;
        else if (k === 'size') A.size = v;
        else if (k === 'asiReplace') A.asiReplace = v;
        else if (k === 'saveFromAsi') { const a = (C.ch[prefix + '/asi'] || [])[0]; if (a) A.saves.add(a); }
        else A.flags[k] = v;
      }
    });
    W.choices.forEach(({ path, ch, owner, prefix }) => {
      const sel = R.sel(C, path, ch);
      if (!sel.length) return;
      switch (ch.type) {
        case 'skill': sel.forEach((x) => { if (x.startsWith('lang:')) A.languages.add(x.slice(5)); else { A.skills.add(x); if (ch.expertise) A.expertise.add(x); } }); break;
        case 'expertise': sel.forEach((x) => A.expertise.add(x)); break;
        case 'language': addAll(A.languages, sel); break;
        case 'tool': addAll(A.tools, sel); break;
        case 'weapon': addAll(A.weapons, sel); break;
        case 'skillOrTool': sel.forEach((x) => { const [t, id] = x.split(':'); (t === 'tool' ? A.tools : A.skills).add(id); }); break;
        case 'asi': sel.forEach((a) => { A.asi[a] = (A.asi[a] || 0) + (ch.amount || 1); }); break;
        case 'spell': {
          const abil = ch.abil === 'asi' ? ((C.ch[prefix + '/asi'] || [])[0] || 'cha') : ch.abil;
          sel.forEach((id) => A.spells.push({ id, abil, note: ch.note, owner, prefix, fromChoice: true }));
          break;
        }
      }
    });
    return A;
  }

  /* ───── Характеристики ───── */
  R.fixedBonuses = (C, A) => {
    const r = R.race(C), s = R.subrace(C);
    let fixed = {};
    if (A && A.asiReplace) fixed = Object.assign({}, A.asiReplace);
    else {
      [r && r.asi, s && s.asi].forEach((o) => { if (o) for (const [a, n] of Object.entries(o)) fixed[a] = (fixed[a] || 0) + n; });
    }
    return fixed;
  };
  R.originOn = (C) => !!(C.opt.origin && C.origin && C.origin.on);
  function abilityScores(C, A) {
    const fixed = R.fixedBonuses(C, A);
    const bonus = { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 };
    const src = { str: [], dex: [], con: [], int: [], wis: [], cha: [] };
    for (const [a, n] of Object.entries(fixed)) {
      let t = a;
      if (n > 0 && R.originOn(C) && C.origin[a]) t = C.origin[a];
      bonus[t] += n; src[t].push({ n, why: 'раса' });
    }
    for (const [a, n] of Object.entries(A.asi)) { bonus[a] += n; src[a].push({ n, why: 'выбор' }); }
    const out = {};
    ABILS.forEach((a) => {
      const base = C.ab.base[a];
      const has = typeof base === 'number' && !isNaN(base);
      const total = has ? Math.min(20, base + bonus[a]) : null;
      out[a] = { base: has ? base : null, bonus: bonus[a], total, mod: has ? U.mod(total) : 0, src: src[a] };
    });
    return out;
  }

  /* ───── Инвентарь ───── */
  /* Числа для раскладки по характеристикам: стандартный набор, броски на сайте или суммы, вписанные «вживую» (3–18) */
  R.abilityPool = (C) => C.ab.method === 'standard' ? R.STANDARD.slice()
    : C.ab.method === 'live' ? (C.ab.live || []).filter((v) => typeof v === 'number' && v >= 3 && v <= 18)
    : (C.ab.rolls || []).map((x) => x.total);
  R.expandToken = (tok) => { const [id, q] = String(tok).split('*'); return { id, qty: q ? +q : 1 }; };
  R.inventory = function (C) {
    const items = []; let coins = 0; const pending = [];
    const push = (tok, uid) => {
      const { id, qty } = R.expandToken(tok);
      if (id.startsWith('any:')) {
        const g = id.slice(4); const pick = C.eq.any[uid];
        if (!pick) { pending.push({ uid, group: g }); items.push({ uid, id: null, name: DND.data.anyGroups[g].name + ' — не выбрано', qty, pending: true, group: g }); return; }
        items.push({ uid, id: pick, qty, group: g }); return;
      }
      items.push({ uid, id, qty });
    };
    const c = R.cls(C), b = R.bg(C), v = R.bgVariant(C);
    if (C.eq.mode === 'gold') {
      (C.eq.bought || []).forEach((x, i) => items.push({ uid: 'g' + i, id: x.id, qty: x.qty || 1, bought: true }));
      let spent = 0; (C.eq.bought || []).forEach((x) => { const it = I.item(x.id); spent += ((it && it.cost) || 0) * (x.qty || 1); });
      coins = (C.eq.gold || 0) - spent;
    } else {
      if (c) c.equipment.forEach((row, i) => {
        let toks;
        if (Array.isArray(row)) toks = row;
        else { const p = C.eq.picks[i]; if (p == null) return; const opt = row.choose[p]; if (!opt) return; toks = Array.isArray(opt) ? opt : opt.items; }
        toks.forEach((t, k) => push(t, 'c' + i + '.' + (Array.isArray(row) ? 'x' : C.eq.picks[i]) + '.' + k));
      });
      if (b) {
        (b.equipment || []).forEach((t, k) => push((v && v.replaceEquipment && v.replaceEquipment[t]) || t, 'b.' + k));
        coins = b.gold || 0;
      }
    }
    (C.eq.extra || []).forEach((x) => items.push({ uid: x.uid, id: x.id || null, name: x.name, qty: x.qty || 1, extra: true }));
    const removed = new Set(C.eq.removed || []);
    const list = items.filter((x) => !removed.has(x.uid));
    let armorDefault = false, shieldDefault = false;
    list.forEach((x) => {
      const it = x.id ? I.item(x.id) : null;
      x.kind = x.id ? I.itemKind(x.id) : 'custom';
      x.name = x.name || (it ? it.name : '?');
      x.weight = it && it.weight != null ? it.weight * x.qty : 0;
      if (x.kind === 'pack') x.contents = it.items.map((t) => { const e = R.expandToken(t); const g = I.item(e.id); return (g ? g.name : e.id) + (e.qty > 1 ? ' ×' + e.qty : ''); });
      if (x.kind === 'armor') {
        const isShield = it.type === 'shield';
        const explicit = C.eq.equip[x.uid];
        if (explicit != null) x.equipped = !!explicit;
        else if (isShield && !shieldDefault) { x.equipped = true; shieldDefault = true; }
        else if (!isShield && !armorDefault) { x.equipped = true; armorDefault = true; }
        else x.equipped = false;
        if (x.equipped) { if (isShield) shieldDefault = true; else armorDefault = true; }
      }
    });
    const cm = C.eq.coins;
    return { items: list, coins: cm && typeof cm.gp === 'number' ? cm : { gp: Math.max(0, Math.floor(coins)), sp: Math.round((coins % 1) * 10) || 0, cp: 0 }, pending, rawGold: coins };
  };

  /* ───── Заклинательство ───── */
  R.inList = (C, sp, letter) => sp.cls.includes(letter) || !!(C.opt.tce && sp.tce && sp.tce.includes(letter));
  R.maxSpellLevel = (sc, L) => {
    if (!sc || L < (sc.start || 1)) return 0;
    if (sc.pact) return sc.pact[L - 1][1];
    return (sc.slots[L - 1] || []).length;
  };
  /* Пулы заклинаний класса/подкласса — как обычные выборы */
  R.spellPools = function (C, ab) {
    const pools = [];
    const c = R.cls(C), sb = R.sub(C), L = C.level;
    const mk = (sc, key, owner, extraLists, expanded) => {
      if (!sc || L < (sc.start || 1)) return;
      const lists = [sc.list].concat(extraLists || []);
      const maxL = R.maxSpellLevel(sc, L);
      const cantrips = sc.cantrips ? sc.cantrips[L - 1] : 0;
      if (cantrips > 0) pools.push({ path: 'sp/' + key + 'cantrips', ch: { id: 'cantrips', type: 'spell', lvl: 0, lists, count: cantrips, abil: sc.abil, label: 'Заговоры', pool: 'cantrips' }, owner });
      if (sc.type === 'known' || sc.type === 'pact') {
        const n = sc.known[L - 1];
        if (n > 0) pools.push({ path: 'sp/' + key + 'known', ch: { id: 'known', type: 'spell', lvl: [1, maxL], lists, extra: expanded || [], count: n, abil: sc.abil, schools: sc.schools, freeSchools: sc.freeSchools, label: 'Известные заклинания', pool: 'known' }, owner });
      }
      if (sc.type === 'book') {
        pools.push({ path: 'sp/' + key + 'book', ch: { id: 'book', type: 'spell', lvl: [1, maxL], lists, count: sc.book[L - 1], abil: sc.abil, label: 'Книга заклинаний', pool: 'book' }, owner });
      }
      if (sc.prep) {
        const m = ab[sc.abil].mod;
        const n = Math.max(1, m + (sc.prep === 'abil+lvl' ? L : Math.floor(L / 2)));
        pools.push({ path: 'sp/' + key + 'prep', ch: { id: 'prep', type: 'spell', lvl: [1, maxL], lists, count: n, abil: sc.abil, label: 'Подготовленные заклинания', pool: 'prep', fromBook: sc.type === 'book', soft: true }, owner });
      }
    };
    if (c && c.spellcasting) {
      const expanded = [];
      if (sb && sb.expanded) Object.entries(sb.expanded).forEach(([lv, ids]) => { if (+lv <= R.maxSpellLevel(c.spellcasting, L)) expanded.push(...ids); });
      if (sb && sb.id === 'warlock-genie') {
        const k = (C.ch['s/genie-kind/kind'] || [])[0]; const g = k && I.options.genieKind[k];
        if (g) g.spells.forEach((id) => { if (I.spells[id].lvl <= R.maxSpellLevel(c.spellcasting, L)) expanded.push(id); });
      }
      mk(c.spellcasting, '', { kind: 'class', id: c.id, name: c.name }, sb && sb.extraLists, expanded);
    }
    if (sb && sb.spellcasting) mk(sb.spellcasting, 'sub-', { kind: 'subclass', id: sb.id, name: sb.name });
    return pools;
  };
  /* Всегда подготовленные / известные заклинания подкласса */
  R.alwaysSpells = function (C) {
    const sb = R.sub(C), c = R.cls(C), out = [];
    if (!sb || !c) return out;
    const abil = (c.spellcasting && c.spellcasting.abil) || 'wis';
    const known = c.spellcasting && c.spellcasting.type !== 'prepared' && c.spellcasting.type !== 'book';
    const note = known ? 'известно всегда' : 'подготовлено всегда';
    if (sb.spells) Object.entries(sb.spells).forEach(([lv, ids]) => { if (C.level >= +lv) ids.forEach((id) => out.push({ id, abil, note, always: true, owner: { kind: 'subclass', id: sb.id, name: sb.name } })); });
    if (sb.id === 'druid-land' && C.level >= 3) {
      const t = (C.ch['s/circle-spells/land'] || [])[0]; const o = t && I.options.landCircle[t];
      if (o) o.spells.forEach((id) => out.push({ id, abil, note: 'заклинание круга', always: true, owner: { kind: 'subclass', id: sb.id, name: sb.name } }));
    }
    if (sb.id === 'sorcerer-divine-soul') {
      const a = (C.ch['s/divine-magic/affinity'] || [])[0]; const o = a && I.options.divineAffinity[a];
      if (o) out.push({ id: o.spell, abil, note: 'родство, известно всегда', always: true, owner: { kind: 'subclass', id: sb.id, name: sb.name } });
    }
    return out;
  };
  /* Список вариантов для выбора заклинания */
  R.spellChoices = function (C, ch, D2) {
    let list = D.spells;
    if (ch.only) return list.filter((s) => ch.only.includes(s.id));
    const [lo, hi] = Array.isArray(ch.lvl) ? ch.lvl : [ch.lvl, ch.lvl];
    list = list.filter((s) => s.lvl >= lo && s.lvl <= hi);
    if (ch.fromBook) {
      const book = new Set(C.ch['sp/book'] || []);
      return list.filter((s) => book.has(s.id));
    }
    if (ch.lists !== 'any') {
      const extra = new Set(ch.extra || []);
      list = list.filter((s) => extra.has(s.id) || ch.lists.some((l) => R.inList(C, s, l)));
    }
    if (ch.ritualOnly) list = list.filter((s) => s.ritual);
    if (ch.attackOnly) list = list.filter((s) => s.atk && s.atk !== 'weapon' && s.atk !== 'auto');
    if (ch.schools && ch.lists === 'any') list = list.filter((s) => ch.schools.includes(s.school));
    return list;
  };

  /* ───── Прочие утилиты ───── */
  R.usesText = function (u, C, ab) {
    if (!u) return '';
    const L = C.level; let n = u.n;
    if (Array.isArray(n)) n = n[L - 1];
    else if (n === 'prof') n = 2;
    else if (n === '2*prof') n = 4;
    else if (n === 'lvl') n = L;
    else if (n === 'lvl*5') n = L * 5;
    else if (n === '1+lvl') n = 1 + L;
    else if (typeof n === 'string' && n.startsWith('1+')) n = Math.max(1, 1 + ab[n.slice(2)].mod);
    else if (typeof n === 'string') n = Math.max(u.min || 1, ab[n].mod);
    let s = n + (u.unit ? ' ' + u.unit : '') + ' / ' + (PER[u.per] || u.per);
    if (u.minLvl && L < u.minLvl) s += ` (с ${u.minLvl} уровня)`;
    return s;
  };
  R.usesNum = function (u, C, ab) { const t = R.usesText(u, C, ab); return parseInt(t, 10) || 0; };

  /* ───── Главное: вычисление листа ───── */
  R.derive = function (C) {
    const W = R.walk(C);
    const A = aggregate(C, W);
    const ab = abilityScores(C, A);
    const L = C.level, prof = 2;
    const r = R.race(C), s = R.subrace(C), c = R.cls(C), sb = R.sub(C), b = R.bg(C);
    const out = { W, A, ab, prof, L, race: r, subrace: s, cls: c, sub: sb, bg: b, warnings: [] };

    /* Спасброски и навыки */
    out.saves = ABILS.map((a) => { const p = A.saves.has(a); return { id: a, name: I.abilName(a), prof: p, total: ab[a].mod + (p ? prof : 0) }; });
    const jack = !!A.flags.jack;
    out.skills = D.skills.map((sk) => {
      const p = A.skills.has(sk.id), e = p && A.expertise.has(sk.id);
      const bonus = e ? prof * 2 : p ? prof : jack ? Math.floor(prof / 2) : 0;
      return { id: sk.id, name: sk.name, abil: sk.abil, prof: p, exp: e, jack: !p && jack, total: ab[sk.abil].mod + bonus };
    });
    const sk = (id) => out.skills.find((x) => x.id === id).total;
    out.passive = { perception: 10 + sk('perception') + A.passiveBonus, investigation: 10 + sk('investigation') + A.passiveBonus, insight: 10 + sk('insight') };

    /* Хиты */
    if (c) {
      const con = ab.con.mod; const hd = c.hd; let hp = hd + con; const rolls = [];
      for (let i = 2; i <= L; i++) {
        const rv = C.opt.hp === 'roll' ? C.hp.rolls[i - 2] : null;
        const val = rv ? rv : hd / 2 + 1;
        if (C.opt.hp === 'roll' && !rv) out.warnings.push({ step: 'class', text: `Брось Кость Хитов (к${hd}) за ${i} уровень или переключись на среднее значение.` });
        rolls.push(val); hp += Math.max(1, val + con);
      }
      hp += A.hpPerLevel * L;
      out.hp = { max: Math.max(1, hp), hd: `${L}к${hd}`, hdie: hd, perLevel: rolls };
    } else out.hp = { max: 0, hd: '—' };

    /* Инвентарь, КД, скорость */
    const inv = R.inventory(C); out.inv = inv;
    const armorIt = inv.items.find((x) => x.kind === 'armor' && x.equipped && I.armor[x.id].type !== 'shield');
    const shieldIt = inv.items.find((x) => x.kind === 'armor' && x.equipped && I.armor[x.id].type === 'shield');
    const armor = armorIt ? I.armor[armorIt.id] : null;
    const dex = ab.dex.mod;
    const cands = [];
    const sg = (n) => (n >= 0 ? '+' : '−') + Math.abs(n);
    const abParts = (f) => f.abils.map((a) => [sg(ab[a].mod), 'модификатор ' + I.abilName(a).toLowerCase()]);
    const forced = A.acAlt.find((f) => f.forced);
    if (forced) {
      cands.push({ v: forced.base + forced.abils.reduce((t, a) => t + ab[a].mod, 0), label: forced.name, shield: forced.shield, parts: [[String(forced.base), forced.name]].concat(abParts(forced)) });
      if (armor) out.warnings.push({ step: 'equipment', text: `${forced.name}: доспех надеть нельзя — сними «${armor.name}».` });
    } else if (armor) {
      const dm = armor.type === 'heavy' ? 0 : armor.type === 'medium' ? Math.min(dex, A.flags.mediumDexMax || 2) : dex;
      cands.push({ v: armor.ac + dm + A.acArmoredBonus, label: armor.name + (A.acArmoredBonus ? ' + Оборона' : ''), shield: true,
        parts: [[String(armor.ac), armor.name]].concat(armor.type === 'heavy' ? [] : [[sg(dm), 'модификатор ловкости' + (armor.type === 'medium' ? ' (не больше +' + (A.flags.mediumDexMax || 2) + ')' : '')]], A.acArmoredBonus ? [[sg(A.acArmoredBonus), 'боевой стиль «Оборона»']] : []) });
    } else {
      cands.push({ v: 10 + dex, label: 'без доспеха', shield: true, parts: [['10', 'без доспеха'], [sg(dex), 'модификатор ловкости']] });
      A.acAlt.forEach((f) => { if (!f.shield && shieldIt) return; cands.push({ v: f.base + f.abils.reduce((t, a) => t + ab[a].mod, 0), label: f.name, shield: f.shield, parts: [[String(f.base), f.name]].concat(abParts(f)) }); });
    }
    cands.sort((x, y) => y.v - x.v);
    const best = cands[0];
    out.ac = { value: best.v + (shieldIt && best.shield ? 2 : 0), label: best.label + (shieldIt && best.shield ? ' + щит' : ''), notes: [],
      parts: (best.parts || [[String(best.v), best.label]]).concat(shieldIt && best.shield ? [['+2', 'щит']] : []) };
    if (A.flags.bladesong) out.ac.notes.push(`в Песни клинка +${Math.max(1, ab.int.mod)}`);
    if (armor && !A.armor.has(armor.type)) out.warnings.push({ step: 'equipment', text: `Нет владения: ${armor.name}. Помеха на проверки, спасброски и атаки Сил/Лов, нельзя колдовать.` });
    if (shieldIt && !A.armor.has('shield')) out.warnings.push({ step: 'equipment', text: 'Нет владения щитами — щит даёт те же штрафы, что и чужой доспех.' });
    const heavySlow = armor && armor.str && ab.str.total != null && ab.str.total < armor.str && !A.flags.heavyNoSlow;
    let speed = Math.max(r ? r.speed : 30, A.speedSet) + A.speedBonus + (!armor && !shieldIt ? A.speedUnarmored : 0) - (heavySlow ? 10 : 0);
    out.speed = { walk: speed, swim: Math.max(A.swim, (s && s.swim) || 0, (r && r.swim) || 0), climb: A.climb, fly: A.fly, heavySlow };
    if (heavySlow) out.warnings.push({ step: 'equipment', text: `${armor.name} требует Силу ${armor.str}: скорость −10 фт.` });
    if (armor && armor.stealthDis) out.ac.notes.push('помеха на Скрытность');
    if (A.fly && armor && (armor.type === 'medium' || armor.type === 'heavy') && r && r.id === 'aarakocra') out.warnings.push({ step: 'equipment', text: 'Ааракокра не может летать в среднем или тяжёлом доспехе.' });

    /* Инициатива, чувства */
    out.init = dex + A.initBonus + A.initAbil.reduce((t, a) => t + ab[a].mod, 0) + (jack ? 1 : 0);
    let dv = A.darkvision;
    if (A.dvAdd) dv = dv ? dv + A.dvAdd : 60;
    out.senses = [];
    if (dv) out.senses.push(`тёмное зрение ${dv} фт`);
    if (A.flags.devilsSight) out.senses.push('дьявольский взгляд 120 фт');
    if (A.blindsight) out.senses.push(`слепое зрение ${A.blindsight} фт`);
    out.size = A.size || (r ? r.size : 'Средний');

    /* Сопротивления */
    const anc = (C.ch['r/draconic-ancestry/ancestry'] || [])[0];
    if (A.flags.resistFromAncestry && anc) A.resist.add(I.options.dragonAncestry[anc].dt);
    out.resist = Array.from(A.resist).map((x) => D.damageNames[x] || x);
    out.immune = Array.from(A.immune).map((x) => D.damageNames[x] || x);

    /* Владения */
    const armorNames = { light: 'лёгкие доспехи', medium: 'средние доспехи', heavy: 'тяжёлые доспехи', shield: 'щиты' };
    out.profs = {
      armor: ['light', 'medium', 'heavy', 'shield'].filter((x) => A.armor.has(x)).map((x) => armorNames[x]),
      weapons: (() => { const w = []; if (A.weapons.has('simple')) w.push('простое оружие'); if (A.weapons.has('martial')) w.push('воинское оружие');
        A.weapons.forEach((id) => { if (id !== 'simple' && id !== 'martial' && I.weapons[id] && !(A.weapons.has(I.weapons[id].cat))) w.push(I.weapons[id].name.toLowerCase()); }); return w; })(),
      tools: Array.from(A.tools).map((id) => (I.tools[id] || { name: id }).name),
      languages: U.uniq(Array.from(A.languages)).map((id) => (I.languages[id] || { name: id }).name)
    };

    /* Заклинания */
    out.pools = R.spellPools(C, ab);
    out.always = R.alwaysSpells(C);
    out.casting = casting(C, out, A, ab);

    /* Атаки */
    out.attacks = attacks(C, out, A, ab, inv);

    /* Умения для листа */
    out.features = features(C, out, W, ab);

    /* Проверки */
    validate(C, out, W, A, ab);
    return out;
  };

  function weaponAbility(w, ab, A, monkW, C) {
    let a = w.kind === 'ranged' ? 'dex' : 'str';
    if (w.props.includes('finesse') || monkW) a = ab.dex.mod > ab.str.mod ? 'dex' : 'str';
    if (A.flags.hexWarrior && !w.props.includes('twohanded') && ab.cha.mod > ab[a].mod) a = 'cha';
    return a;
  }
  function attacks(C, out, A, ab, inv) {
    const list = []; const prof = out.prof;
    const isMonk = !!A.flags.martialArts;
    const kensei = new Set((C.ch['s/path-of-kensei/weapons'] || []));
    const monkWeapon = (w) => isMonk && (kensei.has(w.id) || w.id === 'shortsword' || (w.cat === 'simple' && w.kind === 'melee' && !w.props.includes('twohanded') && !w.props.includes('heavy')));
    const seen = new Set();
    inv.items.filter((x) => x.kind === 'weapon').forEach((x) => {
      if (seen.has(x.id)) return; seen.add(x.id);
      const w = I.weapons[x.id]; const mw = monkWeapon(w);
      const a = weaponAbility(w, ab, A, mw, C);
      const p = A.weapons.has(w.cat) || A.weapons.has(w.id) || (A.flags.pactBlade && false);
      let die = w.dmg;
      if (mw && U.dieMax(A.flags.martialArts) > U.dieMax(die)) die = A.flags.martialArts;
      let hit = ab[a].mod + (p ? prof : 0) + (w.kind === 'ranged' ? A.rangedAttackBonus : 0);
      let dmgMod = ab[a].mod;
      const notes = [];
      if (A.duelingBonus && w.kind === 'melee' && !w.props.includes('twohanded')) notes.push(`+${A.duelingBonus} урона (Дуэлянт, одной рукой)`);
      if (w.vers) notes.push(`двумя руками ${w.vers}`);
      if (w.range) notes.push((w.kind === 'ranged' ? '' : 'метание ') + w.range + ' фт');
      if (w.props.includes('reach')) notes.push('досягаемость 10 фт');
      if (A.flags.rage && a === 'str' && w.kind === 'melee') notes.push(`в ярости +${A.flags.rage}`);
      if (A.flags.sneak && (w.props.includes('finesse') || w.kind === 'ranged')) notes.push(`Скрытая атака +${A.flags.sneak[C.level - 1]}`);
      if (w.note) notes.push(w.note);
      if (!p) notes.push('нет владения');
      list.push({ name: w.name, hit: U.sgn(hit), dmg: w.dmg === '—' ? '—' : die + (dmgMod ? (dmgMod > 0 ? '+' : '−') + Math.abs(dmgMod) : ''), dt: w.dt ? D.damageNames[w.dt] : '', notes: notes.join('; '), kind: 'weapon', id: w.id });
    });
    // Безоружный удар
    {
      let a = isMonk ? (ab.dex.mod > ab.str.mod ? 'dex' : 'str') : 'str';
      const die = A.flags.martialArts || A.flags.unarmedDie || null;
      const m = ab[a].mod;
      list.push({ name: 'Безоружный удар', hit: U.sgn(m + prof), dmg: die ? die + (m ? (m > 0 ? '+' : '−') + Math.abs(m) : '') : String(Math.max(0, 1 + m)), dt: 'дробящий', notes: isMonk ? 'бонусным действием после атаки' : '', kind: 'unarmed' });
    }
    A.natWeapons.forEach((n) => {
      const m = ab.str.mod;
      list.push({ name: n.name, hit: U.sgn(m + prof), dmg: n.dmg + (m ? (m > 0 ? '+' : '−') + Math.abs(m) : ''), dt: D.damageNames[n.dt], notes: 'природное оружие', kind: 'natural' });
    });
    if (A.flags.breath) {
      const anc = (C.ch['r/draconic-ancestry/ancestry'] || [])[0]; const o = anc && I.options.dragonAncestry[anc];
      list.push({ name: 'Оружие дыхания', hit: 'Сл ' + (8 + ab.con.mod + out.prof), dmg: '2к6', dt: o ? D.damageNames[o.dt] : '—', notes: o ? `${o.breath}, спасбросок ${I.abilShort(o.save)}; половина при успехе; 1/кор. отдых` : 'выбери предка', kind: 'breath' });
    }
    const spAtk = (abil) => U.sgn(out.prof + ab[abil].mod), spDC = (abil) => 8 + out.prof + ab[abil].mod;
    if (A.flags.sunBolt) list.push({ name: 'Сияющий солнечный заряд', hit: U.sgn(ab.dex.mod + out.prof), dmg: A.flags.martialArts + U.sgn(ab.dex.mod).replace('+0', ''), dt: 'излучение', notes: '30 фт; вместо атаки в действии Атака', kind: 'special' });
    if (A.flags.astralArms) list.push({ name: 'Руки астрального «я»', hit: U.sgn(ab.wis.mod + out.prof), dmg: A.flags.martialArts + U.sgn(ab.wis.mod), dt: 'силовое поле', notes: 'досягаемость 10 фт; 1 ци на 10 минут', kind: 'special' });
    if (A.flags.psyBlades) list.push({ name: 'Психический клинок', hit: U.sgn(Math.max(ab.dex.mod, ab.str.mod) + out.prof), dmg: '1к6' + U.sgn(Math.max(ab.dex.mod, ab.str.mod)), dt: 'психическая энергия', notes: 'метание 60 фт; бонусным действием второй 1к4', kind: 'special' });
    if (A.flags.tentacle) list.push({ name: 'Щупальце глубин', hit: spAtk('cha'), dmg: '1к8', dt: 'холод', notes: 'бонусным действием; скорость цели −10 фт', kind: 'special' });
    if (A.flags.armorerWeapon === 'guardian') list.push({ name: 'Громовые перчатки', hit: U.sgn(ab.int.mod + out.prof), dmg: '1к8' + U.sgn(ab.int.mod), dt: 'звук', notes: 'цель атакует других с помехой', kind: 'special' });
    if (A.flags.armorerWeapon === 'infiltrator') list.push({ name: 'Молниемёт', hit: U.sgn(ab.int.mod + out.prof), dmg: '1к6' + U.sgn(ab.int.mod), dt: 'электричество', notes: '90/300 фт; раз в ход +1к6', kind: 'special' });
    // Атакующие заговоры и заклинания
    const known = allSpells(C, out, A);
    known.forEach((k) => {
      const sp = I.spells[k.id]; if (!sp || (!sp.atk && !sp.save) || sp.atk === 'weapon') return;
      if (sp.lvl > 0 && !k.show) return;
      let dmg = sp.dmg || '';
      if (sp.id === 'eldritch-blast' && A.flags.agonizing) dmg = '1к10' + U.sgn(ab.cha.mod);
      if (dmg.includes('+мод')) dmg = dmg.replace('+мод', U.sgn(ab[k.abil].mod));
      list.push({ name: sp.name, hit: sp.atk === 'auto' ? 'авто' : sp.atk ? spAtk(k.abil) : 'Сл ' + spDC(k.abil) + ' ' + I.abilShort(sp.save), dmg, dt: sp.dt ? D.damageNames[sp.dt] : '', notes: [sp.range, sp.lvl ? sp.lvl + ' круг' : 'заговор'].join('; '), kind: 'spell', id: sp.id });
    });
    return list;
  }

  /* Все известные заклинания персонажа с характеристикой */
  function allSpells(C, out, A) {
    const res = []; const seen = new Set();
    const add = (o) => { const key = o.id + '|' + o.abil; if (seen.has(key)) return; seen.add(key); res.push(o); };
    out.pools.forEach((p) => (C.ch[p.path] || []).forEach((id) => {
      if (p.ch.pool === 'book') return; // книга отдельно
      add({ id, abil: p.ch.abil, pool: p.ch.pool, owner: p.owner, show: p.ch.pool !== 'book' });
    }));
    out.always.forEach((a) => add(Object.assign({ show: true }, a)));
    A.spells.forEach((s) => { if (s.minLvl && C.level < s.minLvl) return; add({ id: s.id, abil: s.abil, note: s.note, owner: s.owner, show: true }); });
    return res;
  }
  R.allSpells = (C, out) => allSpells(C, out, out.A);

  function casting(C, out, A, ab) {
    const c = out.cls, sb = out.sub, L = C.level;
    const blocks = [];
    const sc = c && c.spellcasting && L >= (c.spellcasting.start || 1) ? c.spellcasting : (sb && sb.spellcasting && L >= sb.spellcasting.start ? sb.spellcasting : null);
    if (sc) {
      const m = ab[sc.abil].mod;
      const slots = sc.pact ? null : (sc.slots[L - 1] || []);
      blocks.push({ main: true, name: sb && sb.spellcasting === sc ? sb.name : c.name, abil: sc.abil, dc: 8 + out.prof + m, atk: U.sgn(out.prof + m),
        slots, pact: sc.pact ? { n: sc.pact[L - 1][0], lvl: sc.pact[L - 1][1] } : null, focus: sc.focus, ritual: sc.ritual, type: sc.type });
    }
    // Прочие источники (раса, черты) с другой характеристикой
    const extraAbils = U.uniq(A.spells.filter((s) => !s.minLvl || C.level >= s.minLvl).map((s) => s.abil)).filter((a) => !blocks.length || a !== blocks[0].abil);
    extraAbils.forEach((a) => blocks.push({ main: false, name: 'Врождённая магия', abil: a, dc: 8 + out.prof + ab[a].mod, atk: U.sgn(out.prof + ab[a].mod) }));
    // Список заклинаний по кругам
    const spells = [];
    const book = new Set(C.ch['sp/book'] || []);
    const prep = new Set(C.ch['sp/prep'] || []);
    const push = (id, meta) => { const sp = I.spells[id]; if (!sp) return; const ex = spells.find((x) => x.id === id); if (ex) { ex.tags = U.uniq(ex.tags.concat(meta.tags || [])); return; } spells.push(Object.assign({ id, sp, tags: [] }, meta)); };
    out.pools.forEach((p) => (C.ch[p.path] || []).forEach((id) => {
      if (p.ch.pool === 'book') push(id, { tags: [prep.has(id) ? 'подготовлено' : 'в книге'], abil: p.ch.abil });
      else if (p.ch.pool === 'prep') push(id, { tags: ['подготовлено'], abil: p.ch.abil });
      else push(id, { tags: [], abil: p.ch.abil });
    }));
    out.always.forEach((a) => push(a.id, { tags: [a.note], abil: a.abil }));
    A.spells.forEach((s) => { if (s.minLvl && C.level < s.minLvl) return; push(s.id, { tags: [s.note || (s.owner && s.owner.name) || ''].filter(Boolean), abil: s.abil, innate: true, from: s.owner && s.owner.name }); });
    // Ритуалы волшебника из книги
    spells.sort((x, y) => x.sp.lvl - y.sp.lvl || x.sp.name.localeCompare(y.sp.name, 'ru'));
    return { blocks, spells, has: blocks.length > 0 || spells.length > 0 };
  }

  function features(C, out, W, ab) {
    const list = [];
    const picksFor = (prefix) => {
      const names = [];
      W.choices.filter((x) => x.prefix === prefix).forEach(({ path, ch }) => {
        const sel = R.sel(C, path, ch);
        sel.forEach((v) => {
          if (ch.type === 'option') { const o = R.optionOf(ch, v); if (o) names.push({ name: o.name, desc: o.desc }); }
          else if (ch.type === 'feat') { const f = I.feats[v]; if (f) names.push({ name: 'Черта: ' + f.name, desc: f.desc }); }
          else if (ch.type === 'spell') { const s = I.spells[v]; if (s) names.push({ name: s.name }); }
          else if (ch.type === 'skill' || ch.type === 'expertise') { const s = I.skills[v] || (v === 'thieves' ? I.tools.thieves : null); if (s) names.push({ name: s.name }); else if (v.startsWith('lang:')) names.push({ name: (I.languages[v.slice(5)] || {}).name }); }
          else if (ch.type === 'language') names.push({ name: (I.languages[v] || { name: v }).name });
          else if (ch.type === 'tool') names.push({ name: (I.tools[v] || { name: v }).name });
          else if (ch.type === 'weapon') names.push({ name: (I.weapons[v] || { name: v }).name });
          else if (ch.type === 'asi') names.push({ name: I.abilShort(v) + ' +' + (ch.amount || 1) });
          else if (ch.type === 'skillOrTool') { const [t, id] = v.split(':'); names.push({ name: ((t === 'tool' ? I.tools : I.skills)[id] || { name: id }).name }); }
        });
      });
      return names;
    };
    W.features.forEach(({ f, owner, prefix }) => {
      if (f.id === 'darkvision') return;
      if (f.hidden) return;
      list.push({ id: f.id, name: f.name, desc: f.desc, owner, level: f.level, uses: R.usesText(f.uses, C, ab), picks: picksFor(prefix), kind: owner.kind });
    });
    const b = out.bg;
    if (b) {
      const v = R.bgVariant(C);
      list.push({ id: b.id, name: b.feature.name, desc: b.feature.desc + (v ? ' ' + v.desc : ''), owner: { kind: 'background', name: b.name + (v ? ' (' + v.name + ')' : '') }, kind: 'background', picks: [] });
    }
    W.feats.forEach(({ feat, path }) => list.push({ id: feat.id, name: 'Черта: ' + feat.name, desc: feat.desc, owner: { kind: 'feat', name: 'Черта' }, kind: 'feat', uses: R.usesText(feat.uses, C, ab), picks: picksFor(path) }));
    return list;
  }

  /* ───── Проверки заполнения ───── */
  R.choiceDone = function (C, x) { const n = R.sel(C, x.path, x.ch).length; return n >= x.ch.count; };
  R.stepOf = (owner) => ({ race: 'race', class: 'class', subclass: 'class', background: 'background', feat: 'race' }[owner.kind] || 'class');
  function validate(C, out, W, A, ab) {
    const w = out.warnings;
    const r = out.race, c = out.cls, b = out.bg;
    if (!r) w.push({ step: 'race', text: 'Выбери расу.' });
    else if (r.subraces && !out.subrace) w.push({ step: 'race', text: 'Выбери подрасу (разновидность) расы.' });
    if (r && !C.opt.exotic && r.exotic) w.push({ step: 'race', text: `Раса «${r.name}» помечена как экзотическая — согласуй с мастером.` });
    if (!c) w.push({ step: 'class', text: 'Выбери класс.' });
    else if (C.level >= c.subclassLevel && !out.sub) w.push({ step: 'class', text: `Выбери подкласс: ${c.subclassTitle.toLowerCase()}.` });
    if (!b) w.push({ step: 'background', text: 'Выбери предысторию.' });
    W.choices.forEach((x) => {
      if (!R.choiceDone(C, x)) {
        const have = (C.ch[x.path] || []).length;
        w.push({ step: x.path.startsWith('b') ? 'background' : R.stepOf(x.owner), text: `${x.owner.name}: ${x.ch.label || 'выбор'} — выбрано ${have} из ${x.ch.count}.`, path: x.path });
      }
    });
    W.feats.forEach(({ feat }) => { const e = featReqError(C, feat, out, A); if (e) w.push({ step: 'race', text: `Черта «${feat.name}»: ${e}` }); });
    // Характеристики
    const base = C.ab.base; const vals = R.ABILS.map((a) => base[a]);
    if (C.ab.method === 'live' && R.abilityPool(C).length < 6) w.push({ step: 'abilities', text: 'Впиши суммы всех шести бросков — от 3 до 18.' });
    else if (vals.some((v) => typeof v !== 'number')) w.push({ step: 'abilities', text: 'Распредели все шесть значений характеристик.' });
    else if (C.ab.method === 'pointbuy') {
      const cost = vals.reduce((t, v) => t + (R.PB_COST[v] ?? 99), 0);
      if (vals.some((v) => v < 8 || v > 15)) w.push({ step: 'abilities', text: 'При покупке значения должны быть от 8 до 15.' });
      else if (cost > 27) w.push({ step: 'abilities', text: `Потрачено ${cost} из 27 пунктов — перебор.` });
      else if (cost < 27) w.push({ step: 'abilities', text: `Осталось ${27 - cost} неизрасходованных пунктов.`, soft: true });
    } else if (C.ab.method === 'manual') {
      if (vals.some((v) => v < 3 || v > 18)) w.push({ step: 'abilities', text: 'Значения до бонусов должны быть от 3 до 18.' });
    } else if (C.ab.method === 'standard') {
      if (vals.slice().sort((x, y) => y - x).join() !== R.STANDARD.join()) w.push({ step: 'abilities', text: 'Стандартный набор: используй 15, 14, 13, 12, 10, 8 — каждое по разу.' });
    } else if (C.ab.method === 'roll' || C.ab.method === 'live') {
      const pool = R.abilityPool(C).slice().sort((x, y) => y - x).join();
      if (vals.slice().sort((x, y) => y - x).join() !== pool) w.push({ step: 'abilities', text: 'Значения должны совпадать с выброшенными.' });
    }
    if (R.originOn(C)) {
      const fixed = R.fixedBonuses(C, A); const t = Object.entries(fixed).filter(([, n]) => n > 0).map(([a]) => C.origin[a] || a);
      if (new Set(t).size !== t.length) w.push({ step: 'race', text: 'Настройка происхождения: каждый бонус — в разную характеристику.' });
    }
    // Заклинания
    out.pools.forEach((p) => {
      const n = (C.ch[p.path] || []).length;
      if (n < p.ch.count) w.push({ step: 'spells', text: `${p.ch.label}: выбрано ${n} из ${p.ch.count}.`, soft: !!p.ch.soft, path: p.path });
      if (n > p.ch.count) w.push({ step: 'spells', text: `${p.ch.label}: выбрано больше, чем можно (${n} из ${p.ch.count}).`, path: p.path });
      if (p.ch.schools && n) {
        const bad = (C.ch[p.path] || []).filter((id) => !p.ch.schools.includes(I.spells[id].school)).length;
        if (bad > (p.ch.freeSchools || 0)) w.push({ step: 'spells', text: `${p.ch.label}: не больше ${p.ch.freeSchools} заклинаний вне школ ${p.ch.schools.map((x) => D.schools[x].toLowerCase()).join(' и ')}.` });
      }
    });
    // Снаряжение
    if (c && C.eq.mode === 'class') c.equipment.forEach((row, i) => { if (!Array.isArray(row) && C.eq.picks[i] == null) w.push({ step: 'equipment', text: `Стартовое снаряжение: выбери вариант в строке ${i + 1}.` }); });
    out.inv.pending.forEach((p) => w.push({ step: 'equipment', text: `Снаряжение: выбери «${DND.data.anyGroups[p.group].name}».` }));
    if (C.eq.mode === 'gold' && out.inv.rawGold < 0) w.push({ step: 'equipment', text: 'Покупки дороже стартового золота.' });
    if (C.eq.mode === 'gold' && !C.eq.gold) w.push({ step: 'equipment', text: 'Брось или впиши стартовое золото.' });
  }
  function featReqError(C, f, out, A) {
    const q = f.req; if (!q) return null;
    if (q.abil) { const ok = Object.entries(q.abil).every(([a, n]) => (out.ab[a].total || 0) >= n) || (f.reqAlt && Object.entries(f.reqAlt.abil).every(([a, n]) => (out.ab[a].total || 0) >= n));
      if (!ok) return 'нужна ' + Object.entries(q.abil).map(([a, n]) => I.abilName(a) + ' ' + n).join(', ') + (f.reqAlt ? ' или ' + Object.entries(f.reqAlt.abil).map(([a, n]) => I.abilName(a) + ' ' + n).join(', ') : '') + '.'; }
    if (q.armor && !A.armor.has(q.armor)) return 'нужно владение: ' + ({ light: 'лёгкие', medium: 'средние', heavy: 'тяжёлые' }[q.armor]) + ' доспехи.';
    if (q.race && !q.race.includes(C.race)) return 'только для рас: ' + q.race.map((x) => I.races[x].name).join(', ') + '.';
    if (q.subrace && !q.subrace.includes(C.subrace)) return 'только для: ' + q.subrace.map((x) => I.subraces[x].name).join(', ') + '.';
    if (q.caster && !(out.cls && (out.cls.spellcasting || (out.sub && out.sub.spellcasting))) && !A.spells.length) return 'нужно умение накладывать хотя бы одно заклинание.';
    if (q.weapon && !A.weapons.has(q.weapon)) return 'нужно владение воинским оружием.';
    return null;
  }
  R.featReqError = (C, f) => { const o = R.derive(C); return featReqError(C, f, o, o.A); };
})();
