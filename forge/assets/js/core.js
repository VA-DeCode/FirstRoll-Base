/* Ядро: утилиты, индексы данных, состояние персонажа, кодирование «кода персонажа». */
(function () {
  const D = DND.data;

  /* ───── Утилиты ───── */
  const U = DND.util = {
    mod: (v) => Math.floor((v - 10) / 2),
    sgn: (n) => (n >= 0 ? '+' + n : '−' + Math.abs(n)),
    esc: (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])),
    uniq: (a) => Array.from(new Set(a)),
    clone: (o) => JSON.parse(JSON.stringify(o)),
    d: (n) => 1 + Math.floor(Math.random() * n),
    /* «2к6» → {n:2, s:6} */
    parseDie: (s) => { const m = /(\d+)к(\d+)/.exec(s || ''); return m ? { n: +m[1], s: +m[2] } : null; },
    dieMax: (s) => { const p = U.parseDie(s); return p ? p.n * p.s : 0; },
    plural: (n, one, few, many) => { const a = Math.abs(n) % 100, b = a % 10; return (a > 10 && a < 20) ? many : b > 1 && b < 5 ? few : b === 1 ? one : many; },
    ls: {
      get(k, def) { try { const v = localStorage.getItem(k); return v == null ? def : JSON.parse(v); } catch (e) { return def; } },
      set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
      del(k) { try { localStorage.removeItem(k); } catch (e) { } }
    },
    ref(kind, id) {
      const c = DND.config; if (!c.refBase || !c.refPaths || !c.refPaths[kind]) return null;
      return c.refBase.replace(/\/?$/, '/') + c.refPaths[kind].replace('{id}', encodeURIComponent(id));
    }
  };

  /* ───── Индексы ───── */
  const by = (arr) => Object.fromEntries((arr || []).map((x) => [x.id, x]));
  const I = DND.idx = {
    races: by(D.races), classes: by(D.classes), subclasses: by(D.subclasses), backgrounds: by(D.backgrounds),
    spells: by(D.spells), feats: by(D.feats), weapons: by(D.weapons), armor: by(D.armor), gear: by(D.gear), packs: by(D.packs),
    tools: by(D.tools), skills: by(D.skills), languages: by(D.languages), abilities: by(D.abilities), deities: by(D.deities),
    alignments: by(D.alignments), options: {}
  };
  I.subraces = {};
  D.races.forEach((r) => (r.subraces || []).forEach((s) => { s.race = r.id; I.subraces[s.id] = s; }));
  Object.keys(D.options).forEach((g) => { I.options[g] = by(D.options[g]); });
  I.subclassesOf = (cls) => D.subclasses.filter((s) => s.cls === cls);
  /* Любой предмет: оружие, доспех, снаряжение, набор, инструмент */
  I.item = (id) => I.weapons[id] || I.armor[id] || I.gear[id] || I.packs[id] || I.tools[id] || null;
  I.itemKind = (id) => I.weapons[id] ? 'weapon' : I.armor[id] ? 'armor' : I.packs[id] ? 'pack' : I.tools[id] ? 'tool' : I.gear[id] ? 'gear' : null;
  I.abilName = (a) => (I.abilities[a] || {}).name || a;
  I.abilShort = (a) => (I.abilities[a] || {}).short || a;

  /* ───── Состояние персонажа ───── */
  const S = DND.state = {
    blank() {
      const d = DND.config.defaults;
      return {
        v: 1,
        name: '', player: '', level: d.level,
        opt: { exotic: d.allowExotic, custom: d.allowCustomLineage, origin: d.allowTashaOrigin, tce: d.allowTashaOptional, hp: d.hpMode },
        race: null, subrace: null, origin: {},       // origin: перенос расовых бонусов (Таша) — { 'con:2:0': 'dex' }
        cls: null, subclass: null, swap: {},          // swap: замены умений Таши { 'favored-enemy': true }
        bg: null, bgVariant: null,
        ab: { method: 'standard', base: { str: null, dex: null, con: null, int: null, wis: null, cha: null }, rolls: [] },
        hp: { rolls: [] },                            // броски Костей Хитов за 2–3 уровень
        ch: {},                                       // выборы: путь → массив значений
        eq: { mode: 'class', picks: {}, any: {}, gold: null, extra: [], removed: [], equip: {}, coins: null, bought: [] },
        info: { alignment: '', deity: '', ethnicity: '', age: '', height: '', weight: '', eyes: '', skin: '', hair: '', appearance: '',
          traits: '', ideals: '', bonds: '', flaws: '', backstory: '', allies: '', notes: '', portrait: '' }
      };
    },
    /* Заполняет отсутствующие поля (для старых кодов) */
    normalize(c) {
      const b = S.blank();
      const out = Object.assign(b, c || {});
      out.opt = Object.assign(b.opt, (c || {}).opt || {});
      out.ab = Object.assign(S.blank().ab, (c || {}).ab || {});
      out.ab.base = Object.assign(S.blank().ab.base, ((c || {}).ab || {}).base || {});
      out.hp = Object.assign({ rolls: [] }, (c || {}).hp || {});
      out.eq = Object.assign(S.blank().eq, (c || {}).eq || {});
      out.info = Object.assign(S.blank().info, (c || {}).info || {});
      out.ch = out.ch || {}; out.swap = out.swap || {}; out.origin = out.origin || {};
      out.level = Math.min(3, Math.max(1, +out.level || 1));
      return out;
    },
    loadDraft() { return S.normalize(U.ls.get('kh-draft', null)); },
    saveDraft(c) { return U.ls.set('kh-draft', c); },
    /* «Недавние персонажи» (load.html). stol — код героя со Стола: такой лист — копия, игра идёт за столом */
    remember(c, code, stol) {
      if (!c || !code) return;
      const all = U.ls.get('kh-recent', []), was = all.find((x) => x.code === code || x.name === (c.name || ''));
      const list = all.filter((x) => x !== was);
      const r = I.races[c.race], cl = I.classes[c.cls];
      list.unshift({ name: c.name || 'Без имени', desc: [r && r.name, cl && (cl.name + ' ' + c.level)].filter(Boolean).join(' · '), code, t: Date.now(), stol: !!(stol || (was && was.stol && was.name === c.name)) });
      U.ls.set('kh-recent', list.slice(0, 12));
    }
  };

  /* ───── Код персонажа ─────
     Формат: «1.» + base64url(deflate-raw(JSON)) — или «0.» + base64url(JSON), если браузер не умеет сжимать. */
  const b64u = {
    enc(bytes) { let s = ''; for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); },
    dec(str) { str = str.replace(/-/g, '+').replace(/_/g, '/'); while (str.length % 4) str += '='; const s = atob(str); const b = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) b[i] = s.charCodeAt(i); return b; }
  };
  /* Убираем пустое, чтобы код был короче */
  function prune(o) {
    if (Array.isArray(o)) return o.map(prune);
    if (o && typeof o === 'object') {
      const r = {};
      for (const [k, v] of Object.entries(o)) {
        if (v === null || v === '' || v === undefined) continue;
        if (Array.isArray(v) && !v.length) continue;
        if (v && typeof v === 'object' && !Array.isArray(v) && !Object.keys(v).length) continue;
        const p = prune(v);
        if (p && typeof p === 'object' && !Array.isArray(p) && !Object.keys(p).length) continue;
        r[k] = p;
      }
      return r;
    }
    return o;
  }
  async function pipe(bytes, stream) {
    const s = new Blob([bytes]).stream().pipeThrough(stream);
    return new Uint8Array(await new Response(s).arrayBuffer());
  }
  DND.codec = {
    async encode(c) {
      const json = JSON.stringify(prune(c));
      const bytes = new TextEncoder().encode(json);
      if (typeof CompressionStream !== 'undefined') {
        try { return '1.' + b64u.enc(await pipe(bytes, new CompressionStream('deflate-raw'))); } catch (e) { }
      }
      return '0.' + b64u.enc(bytes);
    },
    async decode(code) {
      code = String(code || '').trim().replace(/^.*[#&?]c=/, '').replace(/\s+/g, '');
      const m = /^([01])\.([A-Za-z0-9_-]+)$/.exec(code);
      if (!m) throw new Error('Не похоже на код персонажа.');
      let bytes = b64u.dec(m[2]);
      if (m[1] === '1') {
        if (typeof DecompressionStream === 'undefined') throw new Error('Браузер слишком старый, чтобы открыть сжатый код.');
        bytes = await pipe(bytes, new DecompressionStream('deflate-raw'));
      }
      const obj = JSON.parse(new TextDecoder().decode(bytes));
      if (!obj || obj.v !== 1) throw new Error('Код от другой версии конструктора.');
      return S.normalize(obj);
    },
    link(code, page) {
      const base = location.href.replace(/[#?].*$/, '').replace(/[^/]*$/, '');
      return base + (page || 'sheet.html') + '#c=' + code;
    }
  };

  /* ───── Тема ───── */
  DND.theme = {
    init() {
      const t = U.ls.get('kh-theme', null);
      if (t === 'dark' || t === 'light') document.documentElement.setAttribute('data-theme', t);
    },
    toggle() {
      const cur = document.documentElement.getAttribute('data-theme') ||
        'light';
      const next = cur === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      U.ls.set('kh-theme', next);
    }
  };
  DND.theme.init();

  /* ───── Тост ───── */
  DND.toast = function (msg) {
    let el = document.querySelector('.toast');
    if (!el) { el = document.createElement('div'); el.className = 'toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
    el.textContent = msg; el.classList.add('is-on');
    clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('is-on'), 2200);
  };
  DND.copy = async function (text) {
    try { await navigator.clipboard.writeText(text); return true; } catch (e) {
      const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      let ok = false; try { ok = document.execCommand('copy'); } catch (e2) { }
      ta.remove(); return ok;
    }
  };
})();
