/* Конструктор персонажа: шаги мастера, выборы, живой лист. */
(function () {
  const D = DND.data, I = DND.idx, U = DND.util, R = DND.rules, T = DND.tips, esc = U.esc;
  const STEPS = [
    { id: 'basics', name: 'Основа', title: 'С чего начнём', intro: 'Как зовут героя и на каком он уровне. Здесь же мастер включает дополнительные правила.' },
    { id: 'race', name: 'Раса', title: 'Выбери расу', intro: 'Раса даёт бонусы к характеристикам, скорость и особые черты. Любая раса годится для любого класса, так что выбирай по душе. Наведи на карточку или нажми «i», чтобы прочитать подробнее.' },
    { id: 'class', name: 'Класс', title: 'Выбери класс', intro: 'Класс — то, чем твой герой занимается лучше всех. От него зависят хиты, владения и умения на первых уровнях.' },
    { id: 'abilities', name: 'Характеристики', title: 'Характеристики', intro: 'Шесть чисел описывают, насколько герой силён, ловок, вынослив, умён, мудр и обаятелен. Выбери способ, которым вы их определяете.' },
    { id: 'background', name: 'Предыстория', title: 'Предыстория', intro: 'Кем герой был до приключений. Предыстория даёт два навыка, инструменты или языки и одно полезное умение.' },
    { id: 'spells', name: 'Заклинания', title: 'Заклинания', intro: 'Какую магию знает герой. Счётчики сверху показывают, сколько ещё можно выбрать. «К» — концентрация, «Р» — можно наложить ритуалом.' },
    { id: 'equipment', name: 'Снаряжение', title: 'Снаряжение', intro: 'С чем герой выходит в путь. Возьми готовый набор класса или купи всё сам на стартовое золото.' },
    { id: 'details', name: 'Описание', title: 'Описание', intro: 'Как герой выглядит, во что верит и откуда пришёл. Всё, кроме мировоззрения, можно дописать потом.' },
    { id: 'summary', name: 'Итог', title: 'Итог', intro: 'Проверь, всё ли выбрано, и забери лист.' }
  ];
  let C = DND.state.loadDraft();
  let step = U.ls.get('kh-step', 'basics');
  let dv = null;
  const ui = { tok: null, pool: null, spLvl: 'all', spSchool: '', spQ: '', raceQ: '', raceSrc: '', bgQ: '', open: false, reroll: 0, shopQ: '', stepMenu: false };
  const $main = () => document.getElementById('step');
  const $live = () => document.getElementById('live');
  const SEARCH_ICO = '<svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" fill="none" stroke="var(--muted)" stroke-width="1.6"><circle cx="7.5" cy="7.5" r="5.5"/><path d="m12 12 4.5 4.5"/></svg>';

  /* ───── Сохранение ───── */
  let saveT;
  function save() {
    clearTimeout(saveT);
    saveT = setTimeout(() => {
      const ok = DND.state.saveDraft(C);
      const el = document.getElementById('saved');
      const hm = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
      if (el) { el.innerHTML = `<span>${ok ? 'Сохранено · ' + hm : 'Не сохраняется в этом браузере'}</span>`; el.classList.toggle('is-bad', !ok); el.title = ok ? 'Черновик сохранён в этом браузере' : 'Браузер не даёт сохранять'; }
    }, 250);
  }
  function setStep(s) { step = s; ui.stepMenu = false; U.ls.set('kh-step', s); T.hide(); render(); window.scrollTo({ top: 0, behavior: 'smooth' }); }

  /* ───── Хелперы разметки ───── */
  const info = () => '<span class="info-btn" role="button" tabindex="0" aria-label="Подробнее"></span>';
  const counter = (n, max) => `<span class="choice-counter ${n === max ? 'is-ok' : n > max ? 'is-over' : ''}">${n} / ${max}</span>`;
  const card = (o) => `<button type="button" class="option-card ${o.cls || ''} ${o.sel ? 'is-selected' : ''} ${o.dis ? 'is-disabled' : ''} ${o.exotic ? 'is-exotic' : ''}" data-act="${o.act}" data-id="${esc(o.id)}" ${o.tip ? `data-tip="${esc(o.tip)}"` : ''} aria-pressed="${!!o.sel}" ${o.dis ? 'aria-disabled="true"' : ''} ${o.extraAttr || ''}>
      <span class="top"><span class="t">${esc(o.name)}</span><span class="check-mark" aria-hidden="true">✓</span>${o.tip ? info() : ''}</span>${o.motto ? `<span class="motto">${esc(o.motto)}</span>` : ''}${o.sub ? `<span class="s">${o.sub}</span>` : ''}${o.desc ? `<span class="d">${esc(o.desc)}</span>` : ''}${o.why ? `<span class="why">${esc(o.why)}</span>` : ''}${o.meta ? `<span class="meta">${o.meta}</span>` : ''}</button>`;
  const src = (s) => s ? `<span class="badge-source" title="${esc((D.sources[s] || {}).name || s)}">${s}</span>` : '';
  const secHead = (title, cnt, plain) => `<div class="sec-head ${plain ? 'plain' : ''}"><h2>${title}</h2>${cnt != null ? `<span class="cnt">${cnt}</span>` : ''}</div>`;
  const cur = () => { const vis = visibleSteps(); const i = vis.findIndex((s) => s.id === step); return { vis, i, s: vis[i] || STEPS[0] }; };
  const stepHead = (lead) => { const { vis, i, s } = cur(); return `<p class="eyebrow">Шаг ${i + 1} из ${vis.length}</p><h1>${esc(s.title)}</h1><div class="orn" aria-hidden="true"><span>◆</span></div><p class="lead">${lead || esc(s.intro)}</p>`; };
  const nav = () => {
    const { vis, i } = cur();
    const prev = vis[i - 1], next = vis[i + 1];
    return `<div class="step-nav">${prev ? `<button type="button" data-act="goto" data-step="${prev.id}"><small>Назад</small><span>← ${prev.name}</span></button>` : '<span></span>'}${next ? `<button type="button" class="next" data-act="goto" data-step="${next.id}"><small>Далее</small><span>${next.name} →</span></button>` : ''}</div>`;
  };
  const visibleSteps = () => STEPS.filter((s) => s.id !== 'spells' || hasSpellStep());
  const hasSpellStep = () => dv && (dv.pools.length > 0 || dv.always.length > 0);
  const medal = (a, cls) => { const x = dv.ab[a]; return `<div class="stat-medallion ${cls || ''}" data-tip="ability:${a}"><span class="ab">${I.abilShort(a)}</span><span class="ring"><span>${x.total == null ? '—' : U.sgn(x.mod)}</span></span><span class="sc">${x.total == null ? '—' : x.total}</span></div>`; };
  const initial = () => esc((C.name || '?').trim().charAt(0).toUpperCase() || '?');
  const portrait = (size) => { const p = (C.info.portrait || '').trim(); const ok = /^https?:\/\//i.test(p); return `<div class="portrait ${size || ''}" aria-hidden="true"><div ${ok ? `style="background-image:url('${esc(p).replace(/'/g, '%27')}')"` : ''}>${ok ? '' : initial()}</div></div>`; };

  /* ───── Выборы (универсальный блок) ───── */
  function choiceValues(x) { return R.sel(C, x.path, x.ch); }
  function had(kind) { return dv ? dv.A[kind] : new Set(); }
  function choiceBlock(x, opts) {
    const { path, ch, owner } = x; const sel = choiceValues(x); const n = sel.length; const max = ch.count;
    const head = `<div class="choice-head"><h4 class="ttl">${esc(ch.label || 'Выбор')}</h4>${counter(n, max)}${opts && opts.showOwner ? `<span class="src">${esc(owner.name)}</span>` : ''}</div>`;
    const chipBtn = (v, label, tip, state) => `<button type="button" class="chip ${sel.includes(v) ? 'is-on' : ''} ${state || ''}" data-act="ch" data-path="${esc(path)}" data-v="${esc(v)}" data-max="${max}" aria-pressed="${sel.includes(v)}" ${tip ? `data-tip="${esc(tip)}"` : ''}>${esc(label)}</button>`;
    let body = '';
    switch (ch.type) {
      case 'skill': {
        const list = ch.from === 'any' ? D.skills.map((s) => s.id) : ch.from;
        const mine = new Set(sel);
        body = `<div class="chips">${list.map((id) => { const s = I.skills[id]; const h = had('skills').has(id) && !mine.has(id); return chipBtn(id, s.name + (h ? ' · уже есть' : ''), 'skill:' + id, h ? 'is-had' : ''); }).join('')}
          ${ch.orLanguage ? D.languages.filter((l) => l.type !== 'secret').map((l) => chipBtn('lang:' + l.id, 'Язык: ' + l.name, 'language:' + l.id, had('languages').has(l.id) ? 'is-had' : '')).join('') : ''}</div>`;
        if (list.some((id) => had('skills').has(id) && !mine.has(id))) body += '<p class="note">«Уже есть» — навык получен из другого источника. По правилам в таком случае выбирают другой.</p>';
        break;
      }
      case 'expertise': {
        const prof = Array.from(had('skills')).filter((id) => I.skills[id]);
        const opts2 = prof.map((id) => chipBtn(id, I.skills[id].name, 'skill:' + id));
        if (had('tools').has('thieves') && (ch.allowThieves || true)) opts2.push(chipBtn('thieves', 'Воровские инструменты', 'tool:thieves'));
        body = opts2.length ? `<div class="chips">${opts2.join('')}</div>` : '<p class="note">Сначала выбери навыки — компетентность берётся из тех, которыми ты владеешь.</p>';
        break;
      }
      case 'language': {
        const mine = new Set(sel);
        body = `<div class="chips">${D.languages.filter((l) => l.type !== 'secret').map((l) => { const h = had('languages').has(l.id) && !mine.has(l.id); return chipBtn(l.id, l.name + (l.type === 'exotic' ? ' ✦' : ''), 'language:' + l.id, h ? 'is-had' : ''); }).join('')}</div><p class="note">✦ — экзотический язык: уместно, если так задумано предысторией.</p>`;
        break;
      }
      case 'tool': {
        let list;
        const cats = Array.isArray(ch.from) ? ch.from : [ch.from];
        if (ch.from === 'any') list = D.tools.filter((t) => t.cat !== 'vehicle');
        else list = D.tools.filter((t) => cats.includes(t.cat) || cats.includes(t.id));
        body = `<div class="chips">${list.map((t) => chipBtn(t.id, t.name, 'tool:' + t.id, had('tools').has(t.id) && !sel.includes(t.id) ? 'is-had' : '')).join('')}</div>`;
        break;
      }
      case 'weapon': {
        let list = D.weapons;
        if (ch.from === 'martial') list = list.filter((w) => w.cat === 'martial');
        if (ch.from === 'kensei') list = list.filter((w) => !w.props.includes('heavy') && !w.props.includes('special'));
        if (ch.from === 'onehanded-melee') list = list.filter((w) => w.kind === 'melee' && !w.props.includes('twohanded'));
        body = `<div class="chips">${list.map((w) => chipBtn(w.id, w.name, 'item:' + w.id)).join('')}</div>`;
        break;
      }
      case 'skillOrTool': {
        body = `<div class="chips">${D.skills.map((s) => chipBtn('skill:' + s.id, s.name, 'skill:' + s.id, had('skills').has(s.id) ? 'is-had' : '')).join('')}</div>
          <div class="chips">${D.tools.filter((t) => t.cat !== 'vehicle').map((t) => chipBtn('tool:' + t.id, t.name, 'tool:' + t.id)).join('')}</div>`;
        break;
      }
      case 'asi': {
        const list = (ch.from || R.ABILS).filter((a) => !(ch.exclude || []).includes(a));
        body = `<div class="chips">${list.map((a) => chipBtn(a, I.abilName(a) + ' +' + (ch.amount || 1), 'ability:' + a)).join('')}</div>`;
        break;
      }
      case 'spell': {
        const list = R.spellChoices(C, ch);
        const knownIds = new Set(R.allSpells(C, dv).map((k) => k.id));
        body = `<div class="chips">${list.map((s) => chipBtn(s.id, s.name + (s.lvl ? ' · ' + s.lvl + ' круг' : ''), 'spell:' + s.id, knownIds.has(s.id) && !sel.includes(s.id) ? 'is-had' : '')).join('')}</div>`;
        break;
      }
      case 'feat': {
        body = `<div class="option-grid sm">${D.feats.map((f) => {
          const err = featErr(f);
          return card({ act: 'ch', cls: 'sm', id: f.id, name: f.name, meta: src(f.src) + (err ? ' <span class="badge warn">' + esc(err) + '</span>' : ''), sel: sel.includes(f.id), tip: 'feat:' + f.id,
            extraAttr: `data-path="${esc(path)}" data-v="${esc(f.id)}" data-max="${max}"` });
        }).join('')}</div>`;
        break;
      }
      case 'option': {
        const list = R.optionsFor(C, ch);
        body = `<div class="option-grid sm">${list.map((o) => card({ act: 'ch', cls: 'sm', id: o.id, name: o.name, desc: o.desc, meta: o.src ? src(o.src) : '', sel: sel.includes(o.id),
          tip: ch.group ? 'option:' + ch.group + '|' + o.id : '', extraAttr: `data-path="${esc(path)}" data-v="${esc(o.id)}" data-max="${max}"` })).join('')}</div>`;
        break;
      }
    }
    return `<div class="choice-block" id="ch-${esc(path.replace(/[^\w-]/g, '_'))}">${head}${body}</div>`;
  }
  function featErr(f) {
    const q = f.req; if (!q) return '';
    if (q.race && !q.race.includes(C.race)) return 'не для твоей расы';
    if (q.subrace && !q.subrace.includes(C.subrace)) return 'не для твоей подрасы';
    if (q.abil && dv) { const ok = Object.entries(q.abil).every(([a, n]) => (dv.ab[a].total || 0) >= n) || (f.reqAlt && Object.entries(f.reqAlt.abil).every(([a, n]) => (dv.ab[a].total || 0) >= n)); if (!ok) return 'нужна ' + Object.entries(q.abil).map(([a, n]) => I.abilShort(a) + ' ' + n).join(', '); }
    if (q.armor && dv && !dv.A.armor.has(q.armor)) return 'нужно владение доспехом';
    if (q.caster && dv && !(dv.cls && (dv.cls.spellcasting || (dv.sub && dv.sub.spellcasting)))) return 'нужна магия';
    return '';
  }
  /* Все выборы, начинающиеся с префикса (включая вложенные) */
  const choicesUnder = (prefix) => dv.W.choices.filter((x) => x.prefix === prefix || x.prefix.startsWith(prefix + '/') || x.prefix.startsWith(prefix + '>') || x.path.startsWith(prefix + '/'));
  const uniqueChoices = (arr) => { const seen = new Set(); return arr.filter((x) => (seen.has(x.path) ? false : (seen.add(x.path), true))); };

  /* ═════════ Шаги ═════════ */
  function stepBasics() {
    const sw = (k, label, note) => `<label class="switch"><span><b>${label}</b><small>${note}</small></span><input type="checkbox" role="switch" data-opt="${k}" ${C.opt[k] ? 'checked' : ''}><span class="track" aria-hidden="true"></span></label>`;
    return stepHead() + `
      <div class="stack" style="max-width:42rem">
        <div class="grid2">
          <label class="field"><span>Имя персонажа</span><input class="input" data-bind="name" value="${esc(C.name)}" placeholder="Например, Мора" autocomplete="off"></label>
          <label class="field"><span>Имя игрока <small>— необязательно</small></span><input class="input" data-bind="player" value="${esc(C.player)}" placeholder="Твоё имя" autocomplete="off"></label>
        </div>
        <div class="field"><span>Уровень</span>
          <div class="segmented big" role="radiogroup" aria-label="Уровень">${[1, 2, 3].map((l) => `<button type="button" role="radio" aria-checked="${C.level === l}" class="${C.level === l ? 'is-on' : ''}" data-act="level" data-v="${l}">${l}</button>`).join('')}</div>
          <span class="note" style="font-weight:400">Для первой игры обычно берут 1-й — спроси у мастера. Опыт: 2 ур. — 300, 3 ур. — 900. Бонус мастерства на 1–3 уровне: +2.</span>
        </div>
        <div class="opts-card">
          <span class="label-caps">Решает мастер</span>
          ${sw('exotic', 'Экзотические расы ✦', 'Ааракокра, Грунг, Локата, Вердан, Кенку, Людоящер, Юань-ти, Гит.')}
          ${sw('custom', 'Своё происхождение', 'Правило из «Котла Таши»: придумать свой народ по простым правилам.')}
          ${sw('origin', 'Настройка происхождения', 'Расовые бонусы характеристик можно перенести в другие характеристики (Таша).')}
          ${sw('tce', 'Необязательные умения классов', 'Дополнительные умения, альтернативы для следопыта и расширенные списки заклинаний (Таша).')}
          <div class="switch" style="cursor:default"><span><b>Хиты на 2–3 уровне</b><small>Среднее значение надёжнее; бросок — азартнее.</small></span>
            <span class="segmented"><button type="button" class="${C.opt.hp !== 'roll' ? 'is-on' : ''}" data-act="hpmode" data-v="avg">Среднее</button><button type="button" class="${C.opt.hp === 'roll' ? 'is-on' : ''}" data-act="hpmode" data-v="roll">Бросок</button></span></div>
        </div>
      </div>
      ${nav()}`;
  }

  function stepRace() {
    const q = ui.raceQ.trim().toLowerCase();
    let total = 0;
    const groups = D.raceGroups.filter((g) => !ui.raceSrc || ui.raceSrc === g.id).map((g) => {
      const list = D.races.filter((r) => r.group === g.id).filter((r) => (C.opt.exotic || !r.exotic || r.id === C.race) && (!r.custom || C.opt.custom || r.id === C.race))
        .filter((r) => !q || (r.name + ' ' + r.en + ' ' + (r.subraces || []).map((s) => s.name).join(' ')).toLowerCase().includes(q));
      if (!list.length) return '';
      total += list.length;
      const why = (r) => r.exotic && !C.opt.exotic ? 'Мастер выключил экзотические расы' : '';
      const cards = list.map((r) => card({ act: 'race', id: r.id, name: r.name, sub: esc(T.raceLine(r)), sel: C.race === r.id, exotic: r.exotic, why: why(r), tip: 'race:' + r.id,
        meta: src(r.src) + (r.exotic ? '<span class="badge-exotic">экзотика</span>' : '') })).join('');
      const detail = list.some((r) => r.id === C.race) ? raceDetail() : '';
      return `<section class="sec">${secHead(esc(g.name), list.length)}<div class="option-grid">${cards}</div>${detail}</section>`;
    }).join('');
    return stepHead() + `
      <div class="toolbar" style="margin-bottom:28px"><label class="search">${SEARCH_ICO}<input class="input" type="search" placeholder="Найти расу" aria-label="Поиск расы" data-ui="raceQ" value="${esc(ui.raceQ)}"></label>
        <select class="input" data-ui="raceSrc" aria-label="Книга"><option value="">Все книги</option>${D.raceGroups.map((g) => `<option value="${g.id}" ${ui.raceSrc === g.id ? 'selected' : ''}>${esc(g.name)}</option>`).join('')}</select>
        <span class="cnt">${total} ${U.plural(total, 'раса', 'расы', 'рас')}</span></div>
      ${groups || '<div class="empty">Ничего не нашлось. Попробуй другое слово или выбери «Все книги».</div>'}${nav()}`;
  }
  function raceDetail() {
    const r = dv.race; if (!r) return '';
    const subs = r.subraces || [];
    return `<div class="panel is-detail" id="race-detail">
        <div class="panel-title"><h3>${esc(dv.subrace ? (dv.subrace.name.includes(r.name) ? dv.subrace.name : r.name + ' · ' + dv.subrace.name) : r.name)}</h3><span class="en">${esc(r.en || '')}</span><span class="asi">${esc(T.raceLine(r, dv.subrace))}</span></div>
        <p class="panel-desc">${esc(r.desc)}</p>
        ${subs.length ? `<div class="choice-block"><div class="choice-head"><h4 class="ttl">Разновидность</h4>${counter(dv.subrace ? 1 : 0, 1)}</div><div class="option-grid sm">${subs.map((s) => card({ act: 'subrace', cls: 'sm', id: s.id, name: s.name, sub: esc(T.raceLine(r, s)), desc: s.desc, meta: src(s.src), sel: C.subrace === s.id, tip: 'subrace:' + s.id })).join('')}</div></div>` : ''}
        ${originBlock()}
        <div class="choice-block"><div class="choice-head"><h4 class="ttl">Особенности</h4></div>
          <div class="traits">${R.raceTraits(C).map((t) => `<div class="trait"><b>${esc(t.name)}.</b>${t.uses ? ` <span class="uses">${esc(R.usesText(t.uses, C, dv.ab))}</span>` : ''} ${esc(t.desc)}
            ${uniqueChoices(choicesUnder('r/' + t.id)).map((x) => choiceBlock(x)).join('')}</div>`).join('')}</div></div>
        <p class="hint">Языки: ${esc(dv.profs.languages.join(', ') || '—')}. Размер: ${esc(dv.size)}. Скорость: ${dv.speed.walk} фт${dv.speed.swim ? ', плавание ' + dv.speed.swim : ''}${dv.speed.fly ? ', полёт ' + dv.speed.fly : ''}${dv.speed.climb ? ', лазание ' + dv.speed.climb : ''}.</p>
      </div>`;
  }
  function originBlock() {
    if (!C.opt.origin || dv.race.custom) return '';
    const fixed = R.fixedBonuses(C, dv.A);
    const pos = Object.entries(fixed).filter(([, n]) => n > 0);
    if (!pos.length) return '';
    const on = R.originOn(C);
    return `<div class="choice-block"><label class="switch" style="border-top:0;min-height:0;padding:0"><span><b>Перенести расовые бонусы (Таша)</b><small>Каждый бонус можно перенести в другую характеристику, но не складывать вместе.</small></span><input type="checkbox" role="switch" data-act="origin-on" ${on ? 'checked' : ''}><span class="track" aria-hidden="true"></span></label>
      ${on ? pos.map(([a, n]) => `<div class="stack-sm" style="gap:8px"><span class="note" style="color:var(--fg);font-weight:700">+${n} от «${esc(I.abilName(a))}» →</span><div class="chips">${R.ABILS.map((b) => { const isOn = (C.origin[a] || a) === b; return `<button type="button" class="chip ${isOn ? 'is-on' : ''}" aria-pressed="${isOn}" data-act="origin-to" data-origin="${a}" data-v="${b}">${esc(I.abilShort(b))}</button>`; }).join('')}</div></div>`).join('') : ''}</div>`;
  }

  function stepClass() {
    const diffCls = (d) => d === 'Просто' ? 'easy' : d === 'Сложнее' ? 'hard' : '';
    const grid = `<div class="option-grid lg">${D.classes.map((c) => card({ act: 'cls', cls: 'cls', id: c.id, name: c.name, motto: c.motto, sel: C.cls === c.id, tip: 'class:' + c.id,
      meta: `<span class="pill" title="Кость Хитов">к${c.hd}</span><span class="pill" title="Главная характеристика">${c.primary.map(I.abilShort).join(' / ')}</span><span class="pill plain"><span class="diff-dot ${diffCls(c.difficulty)}"></span>${esc(c.difficulty)}</span>${c.src !== 'PHB' ? `<span class="badge-source r" title="${esc((D.sources[c.src] || {}).name || c.src)}">${c.src}</span>` : ''}` })).join('')}</div>`;
    let detail = '';
    const c = dv.cls;
    if (c) {
      const L = C.level;
      const swaps = R.swappable(C);
      const feats = R.classFeatures(C);
      const subFs = R.subFeatures(C);
      const rows = [];
      for (let l = 1; l <= 3; l++) {
        const items = [];
        if (l <= L) {
          feats.filter((f) => f.level === l).forEach((f) => items.push(featureItem(f, 'c/' + f.id)));
          if (l === c.subclassLevel) items.push(`<div><b>${esc(c.subclassTitle)}</b>${dv.sub ? ` — <span class="sub-name">${esc(dv.sub.name)}</span>` : ' <span class="badge warn">выбери выше</span>'}</div>`);
          subFs.filter((f) => f.level === l).forEach((f) => items.push(featureItem(f, 's/' + f.id, dv.sub.name)));
          if (!items.length) items.push('<span class="note">Новых умений нет: растут хиты и заклинания.</span>');
        } else {
          const names = c.features.filter((f) => f.level === l && !f.tce && !f.replaces).map((f) => esc(f.name)).concat(l === c.subclassLevel ? [esc(c.subclassTitle)] : []);
          items.push(`<span>${names.join(', ') || 'Растут хиты и заклинания'}</span><span class="note">откроется на ${l}-м уровне</span>`);
        }
        rows.push(`<div class="feature-row ${l > L ? 'locked' : ''}"><span class="lv">${l}</span><div class="body">${items.join('')}</div></div>`);
      }
      const subBlock = L >= c.subclassLevel
        ? `<div class="choice-block"><div class="choice-head"><h4 class="ttl">${esc(c.subclassTitle)}</h4>${counter(dv.sub ? 1 : 0, 1)}</div><div class="option-grid sm">${I.subclassesOf(c.id).map((s) => card({ act: 'sub', cls: 'sm', id: s.id, name: s.name, desc: s.desc, meta: src(s.src), sel: C.subclass === s.id, tip: 'subclass:' + s.id })).join('')}</div></div>`
        : `<div class="hint" style="max-width:none"><span><b>${esc(c.subclassTitle)}</b> — с ${c.subclassLevel}-го уровня. Сейчас у тебя ${L}-й.</span></div>`;
      const skillX = dv.W.choices.find((x) => x.path === 'c/skills');
      const toolX = dv.W.choices.filter((x) => x.path.startsWith('c/') && x.prefix === 'c' && x.path !== 'c/skills');
      const armorTxt = c.armor.map((a) => ({ light: 'лёгкие', medium: 'средние', heavy: 'тяжёлые', shield: 'щиты' }[a])).join(', ') || 'нет';
      const weapTxt = c.weapons.map((w) => w === 'simple' ? 'простое' : w === 'martial' ? 'воинское' : I.weapons[w].name.toLowerCase()).join(', ');
      detail = `<div class="panel is-detail" id="class-detail">
          <div class="panel-title"><h3>${esc(c.name)}</h3><span class="en">${esc(c.en || '')}</span></div>
          <p class="panel-desc">${esc(c.desc)}</p>
          <dl class="facts"><div><dt>Кость Хитов</dt><dd>к${c.hd}</dd></div><div><dt>Спасброски</dt><dd>${c.saves.map(I.abilName).join(', ')}</dd></div><div><dt>Доспехи</dt><dd>${esc(armorTxt)}</dd></div><div><dt>Оружие</dt><dd>${esc(weapTxt)}</dd></div>${c.tools ? `<div><dt>Инструменты</dt><dd>${esc(c.tools.map((t) => I.tools[t].name).join(', '))}</dd></div>` : ''}</dl>
          ${subBlock}
          ${skillX ? choiceBlock(skillX) : ''}${toolX.map((x) => choiceBlock(x)).join('')}
          ${swaps.length ? `<div class="choice-block"><div class="choice-head"><h4 class="ttl">Варианты Таши</h4></div>${swaps.map((f) => `<label class="switch"><span><b>${esc(f.name)}</b><small>${esc(f.desc)}</small></span><input type="checkbox" role="switch" data-act="swap" data-id="${f.replaces}" ${C.swap[f.replaces] ? 'checked' : ''}><span class="track" aria-hidden="true"></span></label>`).join('')}</div>` : ''}
          <div class="choice-block"><div class="choice-head"><h4 class="ttl">Что ты получаешь на 1–3 уровне</h4></div>
            <div class="feat-table"><div class="hd"><span>Ур.</span><span>Умения</span></div>${rows.join('')}</div></div>
          ${hpBlock(c)}
        </div>`;
    }
    return stepHead() + `<div class="stack">${grid}${detail}</div>` + nav();
  }
  function featureItem(f, prefix, owner) {
    const uses = f.uses ? ` <span class="uses">· ${esc(R.usesText(f.uses, C, dv.ab))}</span>` : '';
    return `<div><details><summary><b>${esc(f.name)}</b>${f.tce ? ' ' + src('TCE') : ''}${owner ? ` <span class="uses">· ${esc(owner)}</span>` : ''}${uses}</summary><p>${esc(f.desc)}</p></details>
      ${uniqueChoices(choicesUnder(prefix)).map((x) => choiceBlock(x)).join('')}</div>`;
  }
  function hpBlock(c) {
    const L = C.level;
    let rolls = '';
    if (L > 1 && C.opt.hp === 'roll') {
      rolls = `<div class="grid3">${[...Array(L - 1)].map((_, i) => `<label class="field"><span>${i + 2} уровень (к${c.hd})</span><span style="display:flex;gap:6px"><input class="input num" type="number" min="1" max="${c.hd}" inputmode="numeric" data-hp="${i}" value="${C.hp.rolls[i] || ''}"><button type="button" class="btn sm" data-act="hproll" data-i="${i}">Бросить</button></span></label>`).join('')}</div>`;
    }
    return `<div class="choice-block"><div class="choice-head"><h4 class="ttl">Хиты</h4><span class="badge">${dv.hp.max} ${U.plural(dv.hp.max, 'хит', 'хита', 'хитов')}</span></div>
      <p class="note" style="color:var(--fg)">1 уровень: ${c.hd} + мод. Телосложения. ${L > 1 ? `Далее за уровень: ${C.opt.hp === 'roll' ? 'бросок к' + c.hd : 'среднее ' + (c.hd / 2 + 1)} + мод. Телосложения.` : ''} Итого сейчас: <b>${dv.hp.max}</b>.</p>${rolls}
      ${L > 1 ? `<div><span class="segmented"><button type="button" class="${C.opt.hp !== 'roll' ? 'is-on' : ''}" data-act="hpmode" data-v="avg">Среднее</button><button type="button" class="${C.opt.hp === 'roll' ? 'is-on' : ''}" data-act="hpmode" data-v="roll">Бросок</button></span></div>` : ''}</div>`;
  }

  function stepAbilities() {
    const m = C.ab.method;
    const primary = dv.cls ? dv.cls.primary : [];
    const METHODS = [['standard', 'Стандартный набор'], ['pointbuy', 'Покупка за 27 пунктов'], ['roll', '4к6 на сайте'], ['live', '🎲 Бросаю вживую']].concat(m === 'manual' ? [['manual', 'Свои значения']] : []);
    const tabs = `<div class="tabs" role="tablist" aria-label="Способ">${METHODS.map(([k, n]) => `<button type="button" role="tab" aria-selected="${m === k}" class="${m === k ? 'is-on' : ''}" data-act="method" data-v="${k}">${n}</button>`).join('')}</div>`;
    const imp = (a) => primary.includes(a) ? '<span class="imp">◆ важно классу</span>' : '';
    let body = '';
    if (m === 'standard' || m === 'roll' || m === 'live') {
      const pool = R.abilityPool(C);
      if (m === 'live') {
        const live = C.ab.live || [], bad = live.map((v, i) => v != null && (v < 3 || v > 18) ? i : -1).filter((i) => i >= 0);
        body += `<div class="roll-card live-card"><p class="note"><b>Бросаешь настоящие кубики за столом</b>, при мастере. Брось 4к6, отбрось меньший кубик и впиши сумму трёх остальных. Так шесть раз. Потом разложи числа по характеристикам, как в стандартном наборе.</p>
          <div class="live-dice">${[0, 1, 2, 3, 4, 5].map((i) => `<label class="live-die"><span>Бросок ${i + 1}</span><input class="die is-input${bad.includes(i) ? ' is-error' : ''}" type="number" min="3" max="18" inputmode="numeric" data-live="${i}" value="${live[i] == null ? '' : live[i]}" placeholder="—" aria-label="Бросок ${i + 1}: сумма трёх к6" aria-invalid="${bad.includes(i)}"></label>`).join('')}</div>
          <p class="live-err" data-live-err>${bad.length ? `<b>Бросок ${bad.map((i) => i + 1).join(', ')}: так не бывает.</b> Сумма трёх к6 — от 3 до 18.` : ''}</p></div>`;
      }
      if (m === 'standard') body += '<p class="note">Шесть чисел одинаковы для всех. Нажми на число, потом на характеристику. На компьютере можно перетаскивать.</p>';
      if (m === 'roll') {
        const rolls = C.ab.rolls || [];
        const anim = ui.justRolled ? 'rolling' : '';
        body += `<div class="roll-wrap">
          <div class="roll-card"><p class="note">Бросаем 4к6 и отбрасываем меньший кубик. Так шесть раз. Все броски видны — лучше бросать при мастере.</p>
            <div class="actions"><button type="button" class="btn primary" data-act="roll-all">${rolls.length ? (ui.reroll ? 'Точно перебросить? Нажми ещё раз' : 'Перебросить всё') : 'Бросить 4к6 шесть раз'}</button></div>
            <div class="roll-results">${[0, 1, 2, 3, 4, 5].map((i) => `<span class="${rolls[i] ? anim : ''}">${rolls[i] ? rolls[i].total : ''}</span>`).join('')}</div></div>
          <div class="roll-hist"><span class="label-caps">История бросков${C.ab.rollCount ? ' · серия ' + C.ab.rollCount : ''}</span>
            ${rolls.length ? rolls.map((r, i) => { const low = r.dice.indexOf(Math.min(...r.dice)); return `<div class="dice-row"><span class="lbl">Бросок ${i + 1}</span>${r.dice.map((d, j) => `<span class="die sm ${j === low ? 'is-dropped' : d === 6 ? 'is-max' : d === 1 ? 'is-min' : ''} ${anim ? 'is-rolling' : ''}" style="animation-delay:${i * 60 + j * 30}ms">${d}</span>`).join('')}<b class="tot">${r.total}</b></div>`; }).join('') : '<span class="note">Пока пусто.</span>'}</div>
        </div>`;
        ui.justRolled = false;
      }
      if (pool.length) {
        const counts = {};
        R.ABILS.forEach((a) => { const v = C.ab.base[a]; if (v != null) counts[v] = (counts[v] || 0) + 1; });
        const toks = pool.map((v, i) => { let u = false; if (counts[v]) { counts[v]--; u = true; } return `<button type="button" class="token ${ui.tok === i ? 'is-on' : ''} ${u ? 'is-used' : ''}" draggable="true" data-act="token" data-i="${i}" data-v="${v}" aria-pressed="${ui.tok === i}" aria-label="Число ${v}${u ? ', уже стоит' : ''}">${v}</button>`; });
        const hasAny = R.ABILS.some((a) => C.ab.base[a] != null);
        body += `<div class="stack-sm" style="gap:16px">
          <div class="tokens">${toks.join('')}${dv.cls ? '<button type="button" class="btn link" data-act="auto-assign">Разложить по классу</button>' : ''}${hasAny ? '<button type="button" class="btn link" data-act="clear-ab">Сбросить</button>' : ''}</div>
          <div class="slots">${R.ABILS.map((a) => { const b = C.ab.base[a]; return `<button type="button" class="slot ${b != null ? 'is-filled' : ''} ${ui.tok != null ? 'is-target' : ''}" data-act="slot" data-a="${a}"><span class="nm">${I.abilName(a)}${imp(a)}</span><span class="v">${b == null ? '—' : b}</span></button>`; }).join('')}</div></div>`;
      }
    } else if (m === 'pointbuy') {
      const cost = R.ABILS.reduce((t, a) => t + (R.PB_COST[C.ab.base[a]] || 0), 0);
      const left = 27 - cost;
      body += `<div class="stack-sm" style="max-width:40rem">
        <div class="pb-head ${left === 0 ? 'is-ok' : left < 0 ? 'is-over' : ''}"><span>Осталось</span><b>${left}</b><span class="muted">из 27 пунктов</span></div>
        <div class="pb-meter ${left === 0 ? 'is-ok' : ''}"><i style="width:${Math.min(100, cost / 27 * 100)}%"></i></div>
        <div class="pb-list">${R.ABILS.map((a) => {
          const b = C.ab.base[a];
          const next = b < 15 ? R.PB_COST[b + 1] - R.PB_COST[b] : 99;
          return `<div class="pb-row"><span class="nm">${I.abilName(a)}${imp(a)}</span><span class="stepper-input"><button type="button" data-act="pb" data-a="${a}" data-d="-1" ${b <= 8 ? 'disabled' : ''} aria-label="Уменьшить: ${I.abilName(a)}">−</button><span class="num">${b}</span><button type="button" data-act="pb" data-a="${a}" data-d="1" ${b >= 15 || cost + next > 27 ? 'disabled' : ''} aria-label="Увеличить: ${I.abilName(a)}">+</button></span><span class="cost">${R.PB_COST[b] || 0} п.</span></div>`;
        }).join('')}</div>
        <span class="note">8 бесплатно, 9–13 по 1 пункту за шаг, 14 и 15 — по 2. Максимум 15 до расовых бонусов.</span></div>`;
    } else {
      body += `<p class="note">Если бросали кубики за столом — впиши результаты. От 3 до 18 до бонусов, итог не выше 20.</p>
        <div class="grid3">${R.ABILS.map((a) => { const b = C.ab.base[a]; const e = manualErr(a); return `<label class="field"><span>${I.abilName(a)}</span><input class="input manual-in ${e ? 'is-error' : ''}" type="number" min="3" max="18" inputmode="numeric" data-manual="${a}" value="${b == null ? '' : b}" placeholder="—" aria-invalid="${!!e}"><span class="err-text" data-err="${a}">${esc(e)}</span></label>`; }).join('')}</div>`;
    }
    return stepHead() + `<div class="stack">
      ${dv.cls ? `<p class="hint">${esc(dv.cls.name)}: главное — ${dv.cls.primary.map(I.abilName).join(', ')}. Телосложение даёт хиты всем.</p>` : ''}
      ${tabs}${body}
      <div class="stack-sm"><h2>Итог</h2><div class="ab-sum"><div class="r hd"><span>Характеристика</span><span>База</span><span>Раса</span><span>Выбор</span><span>Итог</span><span>Мод.</span></div>${R.ABILS.map(abRow).join('')}</div></div>
      </div>${nav()}`;
  }
  function abSplit(a) { const x = dv.ab[a]; let race = 0, other = 0; (x.src || []).forEach((s) => { if (s.why === 'раса') race += s.n; else other += s.n; }); return { race, other }; }
  function manualErr(a) {
    if (C.ab.method !== 'manual') return '';
    const b = C.ab.base[a]; if (b == null) return '';
    if (b < 3 || b > 18) return 'От 3 до 18';
    if (b + dv.ab[a].bonus > 20) return 'С бонусами больше 20';
    return '';
  }
  function abRow(a) {
    const x = dv.ab[a]; const s = abSplit(a); const primary = dv.cls ? dv.cls.primary : [];
    return `<div class="r ${manualErr(a) ? 'is-err' : ''}" data-a="${a}"><span data-tip="ability:${a}">${I.abilName(a)}${primary.includes(a) ? ' <span class="imp" title="Важно классу">◆</span>' : ''}</span><span class="b">${x.base == null ? '—' : x.base}</span><span class="rc">${s.race ? U.sgn(s.race) : '—'}</span><span class="rc">${s.other ? U.sgn(s.other) : '—'}</span><span class="tot">${x.total == null ? '—' : x.total}</span><span class="mod">${x.total == null ? '—' : U.sgn(x.mod)}</span></div>`;
  }

  function stepBackground() {
    const q = ui.bgQ.trim().toLowerCase();
    const groups = [['PHB', 'Книга игрока'], ['SCAG', 'Побережье Мечей']].map(([s, n]) => {
      const list = D.backgrounds.filter((b) => b.src === s && (!q || (b.name + ' ' + b.en).toLowerCase().includes(q)));
      if (!list.length) return '';
      return `<section class="sec">${secHead(n, list.length)}<div class="option-grid">${list.map((b) => card({ act: 'bg', id: b.id, name: b.name, sub: esc((b.skills || []).map((x) => I.skills[x].name).join(', ') || 'навыки на выбор'), sel: C.bg === b.id, tip: 'background:' + b.id,
        meta: src(b.src) + (b.variants ? `<span class="note" style="font-size:12px">+ ${b.variants.length} ${U.plural(b.variants.length, 'разновидность', 'разновидности', 'разновидностей')}</span>` : '') })).join('')}</div>${C.bg && list.some((b) => b.id === C.bg) ? bgDetail() : ''}</section>`;
    }).join('');
    const ideas = (k, label, ph) => `<label class="field"><span style="display:flex;align-items:center;gap:8px"><span style="flex:1">${label}</span><button type="button" class="hbtn" style="min-height:36px;padding:0 12px;color:var(--gold);font-weight:700;font-size:13px" data-act="idea" data-k="${k}">⚄ Подсказать</button></span><textarea class="input" data-bind="info.${k}" rows="3" placeholder="${ph}">${esc(C.info[k])}</textarea></label>`;
    return stepHead() + `
      <div class="toolbar" style="margin-bottom:28px"><label class="search">${SEARCH_ICO}<input class="input" type="search" placeholder="Найти предысторию" aria-label="Поиск предыстории" data-ui="bgQ" value="${esc(ui.bgQ)}"></label></div>
      ${groups || '<div class="empty">Ничего не нашлось.</div>'}
      <section class="sec">${secHead('Характер')}<p class="note">По одной-две фразы. Не знаешь, что написать, — нажми «Подсказать» и поправь под себя.</p>
      <div class="grid-persona">${ideas('traits', 'Черты характера', 'Как герой ведёт себя с другими')}${ideas('ideals', 'Идеалы', 'Во что он верит')}${ideas('bonds', 'Привязанности', 'Кто или что ему дорого')}${ideas('flaws', 'Слабости', 'Что может его погубить')}</div></section>
      ${nav()}`;
  }
  function bgDetail() {
    const b = dv.bg; if (!b) return '';
    const v = R.bgVariant(C);
    const eq = b.equipment.map((t) => { const e = R.expandToken(t); if (e.id.startsWith('any:')) return D.anyGroups[e.id.slice(4)].name; const it = I.item(e.id); return (it ? it.name : e.id) + (e.qty > 1 ? ' ×' + e.qty : ''); }).join(', ') + (b.equipmentNote ? '. ' + b.equipmentNote : '') + '; ' + b.gold + ' зм';
    return `<div class="panel is-detail" id="bg-detail">
        <div class="panel-title"><h3>${esc(b.name)}</h3><span class="en">${esc(b.en || '')}</span></div>
        <p class="panel-desc">${esc(b.desc)}</p>
        <dl class="facts">${(b.skills || []).length ? `<div><dt>Навыки</dt><dd>${esc(b.skills.map((x) => I.skills[(v && v.replaceSkills && v.replaceSkills[x]) || x].name).join(', '))}</dd></div>` : ''}${b.tools ? `<div><dt>Инструменты</dt><dd>${esc(b.tools.map((t) => I.tools[t].name).join(', '))}</dd></div>` : ''}<div><dt>Снаряжение</dt><dd>${esc(eq)}</dd></div></dl>
        <div class="feature-box"><b>${esc(b.feature.name)}.</b> ${esc(b.feature.desc)}</div>
        ${b.variants ? `<div class="choice-block"><div class="choice-head"><h4 class="ttl">Разновидность</h4></div><div class="radio-grid">${[{ id: '', name: b.name, desc: 'Обычная версия' }].concat(b.variants).map((x) => { const on = x.id ? v && v.id === x.id : !v; return `<button type="button" role="radio" aria-checked="${!!on}" class="radio-card ${on ? 'is-on' : ''}" data-act="bgv" data-id="${x.id}"><span class="dot"></span><span class="body"><span class="lbl" style="font-weight:700">${esc(x.name)}</span>${x.desc ? `<small>${esc(x.desc)}</small>` : ''}</span></button>`; }).join('')}</div></div>` : ''}
        ${uniqueChoices(choicesUnder('b')).map((x) => choiceBlock(x)).join('')}
      </div>`;
  }

  function stepSpells() {
    const pools = dv.pools;
    const always = dv.always;
    const innate = dv.A.spells.filter((s) => !s.minLvl || C.level >= s.minLvl);
    if (!pools.length && !always.length && !innate.length) return stepHead() + '<div class="empty">У этого персонажа нет заклинаний. Можно пропустить шаг.</div>' + nav();
    if (!ui.pool || !pools.find((p) => p.path === ui.pool)) ui.pool = (pools.find((p) => (C.ch[p.path] || []).length < p.ch.count) || pools[0] || {}).path;
    const curP = pools.find((p) => p.path === ui.pool);
    const m = dv.casting.blocks[0];
    const pills = [];
    dv.casting.blocks.forEach((b) => { pills.push(['Характеристика', I.abilName(b.abil)], ['Сл спасброска', b.dc], ['Бонус атаки', b.atk]); });
    if (m && m.pact) pills.push(['Ячейки', `${m.pact.n} × ${m.pact.lvl} круг · короткий отдых`]);
    else if (m && m.slots && m.slots.length) pills.push(['Ячейки', m.slots.map((n, i) => `${n} × ${i + 1} круг`).join(', ')]);
    const seenPill = new Set();
    const pillHtml = pills.filter(([k, v]) => { const key = k + v; if (seenPill.has(key)) return false; seenPill.add(key); return true; }).map(([k, v]) => `<span class="stat-pill"><span>${esc(k)}</span><b>${esc(String(v))}</b></span>`).join('');
    const poolCards = pools.map((p) => {
      const n = (C.ch[p.path] || []).length, need = p.ch.count;
      const st = n < need ? '' : n === need ? 'is-ok' : 'is-over';
      const note = n < need ? 'осталось ' + (need - n) : n === need ? '✓ готово' : 'лишних ' + (n - need);
      return `<button type="button" class="pool ${p.path === ui.pool ? 'is-on' : ''} ${st}" data-act="pool" data-path="${esc(p.path)}" aria-pressed="${p.path === ui.pool}"><span class="k">${esc(p.ch.label)}</span><span class="n">${n}<small> / ${need}</small></span><span class="st">${note}</span></button>`;
    }).join('');
    const fixed = [];
    if (innate.length) fixed.push(['Даны без выбора', innate.map((a) => I.spells[a.id] ? I.spells[a.id].name : a.id).join(', '), 'не занимают места']);
    if (always.length) fixed.push(['Всегда подготовлены', always.map((a) => I.spells[a.id] ? I.spells[a.id].name : a.id).join(', '), dv.sub ? dv.sub.name : 'не занимают места']);
    const fixedCards = fixed.map(([k, names, note]) => `<div class="pool fixed"><span class="k">${esc(k)}</span><span class="names">${esc(names)}</span><span class="st">${esc(note)}</span></div>`).join('');
    const chosen = [];
    pools.forEach((p) => (C.ch[p.path] || []).forEach((id) => { const s = I.spells[id]; if (s) chosen.push(`<span class="chip is-on"><span style="font-weight:500">${esc(s.name)}</span><small>${esc(p.ch.label.toLowerCase())}</small><button type="button" class="x" data-act="ch" data-path="${esc(p.path)}" data-v="${id}" data-max="${p.ch.count}" aria-label="Убрать ${esc(s.name)}" style="border:0;background:none;cursor:pointer">×</button></span>`); }));
    let listHtml = '';
    if (curP) {
      const ch = curP.ch; const sel = C.ch[curP.path] || [];
      let list = R.spellChoices(C, ch);
      const levels = U.uniq(list.map((s) => s.lvl)).sort();
      if (ui.spLvl !== 'all' && !levels.includes(+ui.spLvl)) ui.spLvl = 'all';
      if (ui.spLvl !== 'all') list = list.filter((s) => String(s.lvl) === ui.spLvl);
      if (ui.spSchool) list = list.filter((s) => s.school === ui.spSchool);
      if (ui.spQ) { const q = ui.spQ.toLowerCase(); list = list.filter((s) => (s.name + ' ' + s.en).toLowerCase().includes(q)); }
      const alwaysIds = new Set(always.map((a) => a.id));
      const otherIds = new Set(R.allSpells(C, dv).filter((k) => k.pool !== ch.pool).map((k) => k.id));
      const full = sel.length >= ch.count;
      const byL = {};
      list.forEach((s) => (byL[s.lvl] = byL[s.lvl] || []).push(s));
      const hint = { 'cantrips': 'Заговоры накладываются сколько угодно раз, без ячеек.' };
      listHtml = `<div class="stack-sm">
        <div class="choice-head"><h4 class="ttl">${esc(ch.label)}</h4>${counter(sel.length, ch.count)}${ch.soft ? '<span class="src">можно менять каждый день после продолжительного отдыха</span>' : ''}</div>
        ${ch.schools ? `<p class="note">Не больше ${ch.freeSchools} заклинания вне школ: ${ch.schools.map((x) => D.schools[x]).join(', ')}.</p>` : ''}
        ${levels.length === 1 && levels[0] === 0 ? `<p class="note">${hint.cantrips}</p>` : ''}
        ${ch.fromBook && !sel.length && !(C.ch['sp/book'] || []).length ? '<p class="hint">Сначала запиши заклинания в книгу (карточка «Книга заклинаний»).</p>' : ''}
        <div class="toolbar"><label class="search">${SEARCH_ICO}<input class="input" type="search" placeholder="Найти заклинание" aria-label="Поиск заклинания" data-ui="spQ" value="${esc(ui.spQ)}"></label>
          ${levels.length > 1 ? `<div class="segmented" role="radiogroup" aria-label="Круг">${[['all', 'Все']].concat(levels.map((l) => [String(l), l ? l + ' круг' : 'Заговоры'])).map(([v, n]) => `<button type="button" role="radio" aria-checked="${ui.spLvl === v}" class="${ui.spLvl === v ? 'is-on' : ''}" data-act="splvl" data-v="${v}">${n}</button>`).join('')}</div>` : ''}
          <select class="input" data-ui="spSchool" aria-label="Школа"><option value="">Все школы</option>${Object.entries(D.schools).map(([k, n]) => `<option value="${k}" ${ui.spSchool === k ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
        <div class="spell-list">${Object.keys(byL).sort().map((l) => `<div class="lvl-title">${+l ? l + ' круг' : 'Заговоры'}</div>${byL[l].map((s) => {
          const on = sel.includes(s.id); const h = !on && (alwaysIds.has(s.id) || otherIds.has(s.id));
          const tags = [s.conc ? '<span class="tag c">Концентрация</span>' : '', s.ritual ? '<span class="tag r">Ритуал</span>' : '', /бонусн/i.test(s.time) ? '<span class="tag">Бонусное действие</span>' : '', /реакц/i.test(s.time) ? '<span class="tag">Реакция</span>' : '', h ? '<span class="tag ok">уже есть</span>' : ''].join('');
          return `<div class="spell-row ${on ? 'is-on' : ''} ${h ? 'is-had' : ''} ${full && !on ? 'is-full' : ''}" data-act="ch" data-path="${esc(curP.path)}" data-v="${s.id}" data-max="${ch.count}" data-tip="spell:${s.id}" role="checkbox" aria-checked="${on}" tabindex="0">
            <span class="box" aria-hidden="true">${on ? '✓' : ''}</span>
            <span class="main"><span class="nmw"><span><span class="nm">${esc(s.name)}</span><span class="mt">${s.lvl ? s.lvl + ' круг' : 'Заговор'} · ${esc(D.schools[s.school])}</span></span>${tags ? `<span class="tags">${tags}</span>` : ''}</span><span class="tr"><span>${esc(s.time)}</span><span>${esc(s.range)}</span></span></span>
            ${info()}</div>`;
        }).join('')}`).join('') || '<div class="empty" style="border:0">Ничего не нашлось. Сбрось фильтры.</div>'}</div></div>`;
    }
    return stepHead() + `<div class="stack" style="gap:22px">
      <div class="stat-pills">${pillHtml}</div>
      <div class="pools">${poolCards}${fixedCards}</div>
      ${chosen.length ? `<div class="chosen"><span class="label-caps">Выбрано</span><div class="chips" style="gap:6px">${chosen.join('')}</div></div>` : ''}
      ${listHtml}</div>${nav()}`;
  }

  function stepEquipment() {
    const c = dv.cls, b = dv.bg;
    const mode = C.eq.mode;
    const top = `<div class="tabs" role="tablist" aria-label="Как собрать снаряжение"><button type="button" role="tab" aria-selected="${mode !== 'gold'}" class="${mode !== 'gold' ? 'is-on' : ''}" data-act="eqmode" data-v="class">Стартовое снаряжение класса</button><button type="button" role="tab" aria-selected="${mode === 'gold'}" class="${mode === 'gold' ? 'is-on' : ''}" data-act="eqmode" data-v="gold">Купить на золото</button></div>`;
    let body = '';
    if (mode !== 'gold') {
      if (!c) body += '<div class="empty">Сначала выбери класс.</div>';
      else {
        const choose = c.equipment.map((row, i) => [row, i]).filter(([row]) => !Array.isArray(row));
        const fixedRows = c.equipment.map((row, i) => [row, i]).filter(([row]) => Array.isArray(row));
        body += choose.map(([row, i], n) => `<div class="eq-block choice-block ${n ? '' : 'flat'}"><h3>Выбор ${n + 1} из ${choose.length}</h3><div class="radio-grid" role="radiogroup">${row.choose.map((opt, p) => {
          const items = Array.isArray(opt) ? opt : opt.items; const req = !Array.isArray(opt) && opt.req;
          const ok = !req || dv.A.armor.has(req) || dv.A.weapons.has(req);
          const on = C.eq.picks[i] === p;
          return `<button type="button" role="radio" aria-checked="${on}" class="radio-card ${on ? 'is-on' : ''} ${ok ? '' : 'is-disabled'}" data-act="eqpick" data-i="${i}" data-p="${p}" ${ok ? '' : 'disabled'}><span class="dot"></span><span class="body"><span class="l">Вариант ${'абвг'[p]}</span><span class="lbl">${items.map((t) => tokenLabel(t)).join(', ')}</span>${req && !ok ? '<small>нужно владение</small>' : ''}</span></button>`;
        }).join('')}</div>${C.eq.picks[i] != null ? anySelectors(Array.isArray(row.choose[C.eq.picks[i]]) ? row.choose[C.eq.picks[i]] : row.choose[C.eq.picks[i]].items, 'c' + i + '.' + C.eq.picks[i]) : ''}</div>`).join('');
        if (fixedRows.length) body += `<div class="eq-block choice-block"><h3>Также в комплекте</h3><div class="fixed-parts">${fixedRows.map(([row]) => row.map((t) => { const e = R.expandToken(t); return e.id.startsWith('any:') ? '' : `<span class="part">${tokenLabel(t)}</span>`; }).join('')).join('')}</div>${fixedRows.map(([row, i]) => anySelectors(row, 'c' + i + '.x')).join('')}</div>`;
      }
      if (b) body += `<div class="eq-block choice-block"><h3>От предыстории: ${esc(b.name)}</h3><div class="fixed-parts">${b.equipment.map((t) => { const e = R.expandToken(t); return e.id.startsWith('any:') ? '' : `<span class="part">${tokenLabel(t)}</span>`; }).join('')}<span class="part">${b.gold} зм</span></div>${b.equipmentNote ? `<p class="note">${esc(b.equipmentNote)}</p>` : ''}${anySelectors(b.equipment, 'b', true)}</div>`;
    } else {
      const formula = c ? c.gold : '—';
      const spent = (C.eq.bought || []).reduce((t, x) => t + ((I.item(x.id) || {}).cost || 0) * (x.qty || 1), 0);
      const gold = C.eq.gold || 0, left = +(gold - spent).toFixed(2);
      const q = ui.shopQ.toLowerCase();
      const catalog = [].concat(D.weapons.map((w) => ['Оружие', w]), D.armor.map((a) => ['Доспехи', a]), D.packs.map((p) => ['Наборы', p]), D.tools.filter((t) => t.cost).map((t) => ['Инструменты', t]), D.gear.filter((g) => g.cost && g.cat !== 'ammo').map((g) => ['Снаряжение', g]), D.gear.filter((g) => g.cat === 'ammo').map((g) => ['Боеприпасы (×20)', g]))
        .filter(([, x]) => !q || x.name.toLowerCase().includes(q));
      const itemMeta = (g, x) => g === 'Оружие' ? `${x.dmg || ''} ${x.dt ? D.damageNames[x.dt] : ''}`.trim() : g === 'Доспехи' ? (x.type === 'shield' ? 'КД +2' : 'КД ' + x.ac + (x.dexMax === 0 ? '' : x.dexMax ? ' + Лов (макс. 2)' : ' + Лов')) : g;
      body += `<div class="gold-card">
          <div><span>Стартовое золото: <b>${esc(formula)}</b> — вместо снаряжения класса и предыстории.</span>
            <span style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><input class="input num" type="number" min="0" inputmode="numeric" style="max-width:120px" data-eqgold value="${C.eq.gold || ''}" placeholder="зм" aria-label="Золото"><button type="button" class="btn primary" data-act="roll-gold" ${c ? '' : 'disabled'}>Бросить ${esc(formula)}</button></span></div>
          <div><span class="pb-head ${left < 0 ? 'is-over' : 'is-ok'}"><span>Осталось</span><b>${left}</b><span class="muted">зм из ${gold}</span></span>
            <div class="pb-meter ${left >= 0 ? 'is-ok' : ''}"><i style="width:${gold ? Math.max(0, Math.min(100, left / gold * 100)) : 0}%;${left < 0 ? 'background:var(--danger)' : ''}"></i></div></div>
        </div>
        <label class="search" style="max-width:420px">${SEARCH_ICO}<input class="input" type="search" placeholder="Что купить?" aria-label="Поиск в лавке" data-ui="shopQ" value="${esc(ui.shopQ)}"></label>
        <div class="list-box scroll">${catalog.map(([g, x]) => `<div class="item-row"><span class="nm" data-tip="item:${x.id}">${esc(x.name)}<span class="sub">${esc(itemMeta(g, x))}</span></span><span class="price">${x.cost} зм</span><button type="button" class="add-btn" data-act="buy" data-id="${x.id}" data-q="${x.cat === 'ammo' ? 20 : 1}" aria-label="Купить: ${esc(x.name)}">+</button></div>`).join('')}</div>`;
    }
    const inv = dv.inv;
    const co = inv.coins;
    const purse = [co.gp ? co.gp + ' зм' : '', co.sp ? co.sp + ' см' : '', co.cp ? co.cp + ' мм' : ''].filter(Boolean).join(', ') || '0 зм';
    const invHtml = `<section class="stack-sm">
      <div class="sec-head plain" style="flex-wrap:wrap"><h2>Инвентарь</h2><span class="cnt" style="font-size:14px">КД ${dv.ac.value} (${esc(dv.ac.label)})</span></div>
      <div class="list-box">${inv.items.length ? inv.items.map((x) => {
        const isArmor = x.kind === 'armor';
        return `<div class="item-row"><span class="nm" ${x.id ? `data-tip="item:${x.id}"` : ''}><span>${esc(x.name)}${x.qty > 1 ? ` <b>×${x.qty}</b>` : ''}${x.pending ? ' <span class="badge warn">выбери выше</span>' : ''}</span>${x.contents ? `<span class="sub">${esc(x.contents.join(', '))}</span>` : ''}</span>
          ${isArmor ? `<button type="button" class="toggle-equipped ${x.equipped ? 'is-on' : ''}" role="switch" aria-checked="${!!x.equipped}" data-act="equip" data-uid="${esc(x.uid)}">${x.equipped ? 'надето' : 'снято'}</button>` : ''}
          <button type="button" class="x-btn" data-act="rm" data-uid="${esc(x.uid)}" aria-label="Убрать: ${esc(x.name)}">−</button></div>`;
      }).join('') : '<div class="item-row"><span class="nm muted">Пусто.</span></div>'}
        <div class="item-row purse"><span class="nm" style="font-weight:700">Кошель</span><b class="num" style="font-size:17px">${esc(purse)}</b></div></div>
      ${(C.eq.removed || []).length ? `<div><button type="button" class="btn link" data-act="unremove">Вернуть убранное (${C.eq.removed.length})</button></div>` : ''}
      <div class="field"><span>Добавить своё</span><div class="row-add"><input class="input" data-newitem placeholder="Например, фамильный медальон"><button type="button" class="btn" data-act="add-item">Добавить</button></div></div>
      <div class="grid3">${['gp', 'sp', 'cp'].map((k) => `<label class="field"><span>${{ gp: 'Золото (зм)', sp: 'Серебро (см)', cp: 'Медь (мм)' }[k]}</span><input class="input num" type="number" min="0" inputmode="numeric" data-coin="${k}" value="${inv.coins[k] || 0}"></label>`).join('')}</div>
      <p class="note">КД считается по надетому доспеху и щиту — переключай «надето/снято».</p></section>`;
    return stepHead() + `<div class="stack">${top}${body}${invHtml}</div>` + nav();
  }
  function tokenLabel(t) {
    const e = R.expandToken(t);
    if (e.id.startsWith('any:')) return `<i>${esc(D.anyGroups[e.id.slice(4)].name)}</i>`;
    const it = I.item(e.id);
    return `<span data-tip="item:${esc(e.id)}">${esc(it ? it.name : e.id)}${e.qty > 1 ? ' ×' + e.qty : ''}</span>`;
  }
  function anySelectors(toks, prefix, isBg) {
    return toks.map((t, k) => {
      const e = R.expandToken(t); if (!e.id.startsWith('any:')) return '';
      const uid = isBg ? 'b.' + k : prefix + '.' + k;
      const g = D.anyGroups[e.id.slice(4)];
      const list = g.filter ? D.weapons.filter(g.filter) : D.tools.filter((x) => x.cat === g.tools);
      return `<label class="any-sel"><span>${esc(g.name)}</span><select class="input" data-any="${esc(uid)}" style="max-width:360px"><option value="">— выбери —</option>${list.map((w) => `<option value="${w.id}" ${C.eq.any[uid] === w.id ? 'selected' : ''}>${esc(w.name)}${w.dmg ? ' (' + w.dmg + ')' : ''}</option>`).join('')}</select></label>`;
    }).join('');
  }

  function stepDetails() {
    const f = (k, label, ph) => `<label class="field"><span>${label}</span><input class="input" data-bind="info.${k}" value="${esc(C.info[k])}" placeholder="${esc(ph || '')}"></label>`;
    const ta = (k, label, rows, ph) => `<label class="field"><span>${label}</span><textarea class="input" data-bind="info.${k}" rows="${rows || 3}" placeholder="${esc(ph || '')}">${esc(C.info[k])}</textarea></label>`;
    const needDeity = C.cls === 'cleric' || C.cls === 'paladin';
    const dom = C.cls === 'cleric' && dv.sub ? dv.sub.name.toLowerCase() : '';
    const fits = (d) => dom && d.domains.some((x) => dom.includes(x.toLowerCase().slice(0, 4)));
    const deityCard = (d) => { const on = C.info.deity === d.id, fit = fits(d); return `<button type="button" role="radio" aria-checked="${on}" class="deity ${on ? 'is-on' : ''} ${fit ? 'is-fit' : ''} ${dom && !fit && !on ? 'dim' : ''}" data-act="deity" data-v="${d.id}" data-tip="deity:${d.id}"><span class="nt"><b>${esc(d.name)}</b><span>${esc(d.al)}</span></span><span class="ti">${esc(d.title)}</span><span class="doms">${d.domains.map((x) => `<span class="${dom && dom.includes(x.toLowerCase().slice(0, 4)) ? 'fit' : ''}">${esc(x)}</span>`).join('')}</span></button>`; };
    return stepHead() + `<div class="stack" style="gap:30px">
      <section class="stack-sm"><div class="sec-head plain" style="align-items:center"><h2>Мировоззрение</h2>${C.info.alignment ? '' : '<span class="pdot on" aria-label="Не выбрано"></span>'}</div>
        <div class="align-grid" role="radiogroup" aria-label="Мировоззрение">${D.alignments.map((a) => `<button type="button" role="radio" aria-checked="${C.info.alignment === a.id}" class="${C.info.alignment === a.id ? 'is-on' : ''}" data-act="align" data-v="${a.id}" data-tip="alignment:${a.id}"><b>${esc(a.short)}</b><span>${esc(a.name)}</span></button>`).join('')}</div></section>
      <section class="stack-sm"><h2>Божество</h2>
        ${needDeity ? `<p class="hint">${C.cls === 'cleric' ? (dv.sub ? `Жрец служит божеству, чей домен совпадает с его собственным. Подходящие для «${esc(dv.sub.name)}» подсвечены золотом.` : 'Жрец служит конкретному божеству — выбери домен на шаге «Класс», и подходящие боги подсветятся.') : 'Паладин обычно клянётся перед божеством — выбери того, кто близок его клятве.'}</p>` : ''}
        <div class="deity-grid" role="radiogroup" aria-label="Божество"><button type="button" role="radio" aria-checked="${!C.info.deity}" class="deity ${!C.info.deity ? 'is-on' : ''}" data-act="deity" data-v=""><span class="nt"><b>Без божества</b></span><span class="ti">Можно выбрать позже</span></button>
          ${D.deities.filter((d) => !d.nonhuman).map(deityCard).join('')}
          ${D.deities.filter((d) => d.nonhuman).map(deityCard).join('')}</div>
        ${C.info.deity && I.deities[C.info.deity] ? `<p class="note">${esc(I.deities[C.info.deity].name)}: ${esc(I.deities[C.info.deity].title)}, ${I.deities[C.info.deity].al}. Символ: ${esc(I.deities[C.info.deity].symbol)}.</p>` : ''}</section>
      ${C.race === 'human' || C.race === 'half-elf' ? `<section class="stack-sm"><h2>Народ людей Фаэруна</h2><select class="input" data-bind="info.ethnicity" style="max-width:520px"><option value="">— не важно —</option>${D.ethnicities.map((e) => `<option value="${e.id}" ${C.info.ethnicity === e.id ? 'selected' : ''}>${esc(e.name)} — ${esc(e.desc)}</option>`).join('')}</select></section>` : ''}
      <section class="stack-sm"><h2>Внешность</h2>
        <div class="looks">${portrait()}<div class="grid3">${f('age', 'Возраст', '24')}${f('height', 'Рост', '5 фт 7 дюйм')}${f('weight', 'Вес', '130 фнт')}${f('eyes', 'Глаза')}${f('skin', 'Кожа')}${f('hair', 'Волосы')}</div></div>
        <div style="max-width:44rem" class="stack-sm">${ta('appearance', 'Как выглядит', 3, 'Шрам через бровь, вечно грязный плащ, смех слышно за квартал…')}
        <label class="field"><span>Портрет <small>— ссылка на картинку, необязательно</small></span><input class="input" data-bind="info.portrait" value="${esc(C.info.portrait)}" placeholder="https://…" inputmode="url"></label></div></section>
      <section class="stack-sm" style="max-width:48rem"><h2>История</h2>
        ${ta('backstory', 'Предыстория персонажа', 6, 'Откуда родом, что случилось, почему отправился в путь.')}
        ${ta('allies', 'Союзники и организации', 3)}
        ${ta('notes', 'Заметки', 3)}</section>
      </div>${nav()}`;
  }

  function stepSummary() {
    const w = dv.warnings;
    const hard = w.filter((x) => !x.soft), soft = w.filter((x) => x.soft);
    const stepName = (id) => (STEPS.find((s) => s.id === id) || {}).name || '';
    const who = [dv.subrace ? dv.subrace.name : dv.race && dv.race.name, dv.cls && (dv.cls.name + ' ' + C.level), dv.sub && dv.sub.name].filter(Boolean).join(' · ') || 'Раса и класс не выбраны';
    const sub2 = [dv.bg && dv.bg.name, (I.alignments[C.info.alignment] || {}).name].filter(Boolean).join(' · ');
    const spellsLine = dv.casting.has ? dv.casting.spells.map((s) => s.sp.name).join(', ') : '';
    return stepHead(hard.length ? 'Почти готово — осталось несколько выборов. Лист можно открыть и сейчас.' : '') + `
      <div class="summary">
        <article class="preview sheet-mobile">
          <div class="who">${portrait('sm')}<div style="min-width:0"><div class="nm">${esc(C.name || 'Безымянный герой')}</div><div class="ln">${esc(who)}</div>${sub2 ? `<div class="ln2">${esc(sub2)}</div>` : ''}</div></div>
          <div class="rule2"></div>
          <div class="big-nums"><div><b>${dv.ac.value}</b><small>КД</small></div><div><b>${dv.hp.max || '—'}</b><small>Хиты</small></div><div><b>${U.sgn(dv.init)}</b><small>Иниц.</small></div><div><b>${dv.speed.walk}</b><small>Скор.</small></div><div><b>+2</b><small>Маст.</small></div></div>
          <div class="mini-meds">${R.ABILS.map((a) => medal(a, 'sm')).join('')}</div>
          ${dv.attacks.length ? `<div class="mini-tbl"><div class="r hd"><span>Атака</span><span>Бонус</span><span>Урон</span></div>${dv.attacks.slice(0, 5).map((a) => `<div class="r"><span style="font-weight:500">${esc(a.name)}</span><b>${esc(a.hit)}</b><span>${esc(a.dmg)} ${esc(a.dt)}</span></div>`).join('')}</div>` : ''}
          ${spellsLine ? `<p style="margin:0;font-size:14px;line-height:1.5"><b>Заклинания.</b> ${esc(spellsLine)}</p>` : ''}
        </article>
        <div class="stack" style="gap:20px">
          <section class="stack-sm" style="gap:8px"><h2>Осталось выбрать</h2>
            ${hard.length ? '' : '<div class="all-done">Всё выбрано. Можно садиться за стол.</div>'}
            ${w.length ? `<ul class="warning-list">${hard.concat(soft).map((x, i) => `<li class="${x.soft ? 'soft' : ''}"><button type="button" data-act="goto" data-step="${x.step}"><span class="n">${x.soft ? '?' : i + 1}</span><span class="tx"><small>${esc(stepName(x.step))}</small><span>${esc(x.text)}</span></span><span class="go" aria-hidden="true">→</span></button></li>`).join('')}</ul>` : ''}
          </section>
          <section class="stack-sm" style="gap:10px">
            <button type="button" class="btn-main" data-act="open-sheet">Открыть лист →</button>
            <div class="act-grid">
              <button type="button" data-act="pdf" data-v="a4"><span class="ic">↓</span>Скачать PDF (A4)</button>
              <button type="button" data-act="pdf" data-v="phone"><span class="ic">▯</span>PDF для телефона</button>
              <button type="button" data-act="print"><span class="ic">⎙</span>Печать</button>
              <button type="button" data-act="copy-code"><span class="ic">⧉</span>Скопировать код</button>
              <button type="button" data-act="copy-link"><span class="ic">↗</span>Скопировать ссылку</button>
              <a href="load.html"><span class="ic">⇅</span>Загрузить другой код</a>
            </div>
          </section>
          <section class="stack-sm"><h2>Код персонажа</h2>
            <p class="note">Весь персонаж в одной строке. Сохрани её в заметках или отправь мастеру — на странице «Загрузить по коду» она восстановит героя.</p>
            <div class="code-box" id="code-box" tabindex="0" aria-label="Код персонажа">…</div>
          </section>
          <section class="stack-sm"><h2>Новый персонаж</h2>
            <p class="note">Черновик хранится только в этом браузере. Перед сбросом скопируй код.</p>
            <div><button type="button" class="btn outline" data-act="reset">${ui.resetArm ? 'Точно сбросить? Нажми ещё раз' : 'Начать заново'}</button></div>
          </section>
        </div>
      </div>
      ${nav()}`;
  }

  /* ───── Живой лист ───── */
  function renderLive() {
    const el = $live(); if (!el) return;
    const r = dv.race, c = dv.cls;
    const what = [dv.subrace ? dv.subrace.name : r && r.name, c && (c.name + ' ' + C.level), dv.sub && dv.sub.name].filter(Boolean).join(' · ') || 'Выбери расу и класс';
    const hard = dv.warnings.filter((x) => !x.soft).length;
    const prevVals = el._vals || {};
    const vals = { ac: dv.ac.value, hp: dv.hp.max, init: U.sgn(dv.init), sp: dv.speed.walk };
    R.ABILS.forEach((a) => vals[a] = dv.ab[a].total);
    el._vals = vals;
    const fl = (k) => prevVals[k] !== undefined && prevVals[k] !== vals[k] ? 'flash' : '';
    const big = `<div class="ls-big"><div class="${fl('ac')}" title="Класс Доспеха"><b>${dv.ac.value}</b><small>КД</small></div><div class="${fl('hp')}" title="Хиты"><b>${dv.hp.max || '—'}</b><small>Хиты</small></div><div class="${fl('init')}" title="Инициатива"><b>${U.sgn(dv.init)}</b><small>Иниц.</small></div><div class="${fl('sp')}" title="Скорость, фт"><b>${dv.speed.walk}</b><small>Скор.</small></div></div>`;
    el.className = 'live-sheet' + (ui.open ? ' is-open' : '');
    el.innerHTML = `<button type="button" class="handle" data-act="live-toggle" aria-expanded="${ui.open}" aria-label="${ui.open ? 'Свернуть живой лист' : 'Развернуть живой лист'}">${big}</button>
      <div class="ls-body">
        <div class="ls-who"><div class="label-caps">Живой лист</div><div class="nm">${esc(C.name || 'Безымянный герой')}</div><div class="ln">${esc(what)}</div></div>
        <div class="rule2"></div>
        ${big}
        <span class="ls-note">${esc(dv.ac.label[0].toUpperCase() + dv.ac.label.slice(1))}: КД ${dv.ac.value}</span>
        <div class="ls-meds">${R.ABILS.map((a) => medal(a, fl(a))).join('')}</div>
        <div class="ls-sec"><div class="cap">Спасброски</div><div class="ls-saves">${dv.saves.map((s) => `<div><span class="pdot ${s.prof ? 'on' : ''}"></span><span>${I.abilShort(s.id)}</span><b>${U.sgn(s.total)}</b></div>`).join('')}</div></div>
        <div class="ls-sec ls-kv"><div><span>Пассивная Внимательность</span><b>${dv.passive.perception}</b></div><div><span>Бонус мастерства</span><b>+2</b></div>${dv.senses.length ? `<div><span>Чувства</span><span style="text-align:right">${esc(dv.senses.join(', '))}</span></div>` : ''}</div>
        ${hard ? `<button type="button" class="ls-warn btn link" style="padding:0;min-height:32px;justify-content:flex-start" data-act="goto" data-step="summary">Осталось выбрать: ${hard}</button>` : ''}
        <div class="ls-actions"><button type="button" class="btn primary sm" data-act="open-sheet">Открыть лист</button><button type="button" class="btn sm" data-act="goto" data-step="summary">Итог и код</button></div>
      </div>`;
    const sc = document.getElementById('live-scrim'); if (sc) sc.classList.toggle('is-on', ui.open && window.innerWidth < 1024);
  }

  /* ───── Рендер ───── */
  function stepFilled(id) {
    switch (id) {
      case 'basics': return !!C.name;
      case 'race': return !!C.race;
      case 'class': return !!C.cls;
      case 'abilities': return R.ABILS.every((a) => C.ab.base[a] != null);
      case 'background': return !!C.bg;
      case 'spells': return hasSpellStep();
      case 'equipment': return !!C.cls;
      case 'details': return !!C.info.alignment;
      default: return false;
    }
  }
  function renderStepper() {
    const warnSteps = new Set(dv.warnings.filter((x) => !x.soft).map((x) => x.step));
    const { vis, i: ci } = cur();
    const info2 = vis.map((s, i) => {
      const isCur = s.id === step, warn = warnSteps.has(s.id) && s.id !== 'summary' && !isCur;
      const done = !isCur && !warn && stepFilled(s.id);
      return { s, i, isCur, warn, done };
    });
    const btn = (x) => `<button type="button" class="step ${x.isCur ? 'is-current' : ''} ${x.done ? 'is-done' : ''} ${x.warn ? 'has-warning' : ''}" data-act="goto" data-step="${x.s.id}" ${x.isCur ? 'aria-current="step"' : ''}><span class="n">${x.done ? '✓' : x.i + 1}</span><span class="nm">${x.s.name}</span>${x.warn ? '<span class="sr"> — не всё выбрано</span><span class="wt" aria-hidden="true"></span>' : ''}</button>`;
    const prev = vis[ci - 1], next = vis[ci + 1];
    const anyWarn = info2.some((x) => x.warn);
    document.getElementById('stepper').innerHTML = `<ol class="steps-d">${info2.map((x) => `<li>${btn(x)}</li>`).join('')}</ol>
      <div class="steps-m"><div class="bar">
        <button type="button" class="arrow" ${prev ? `data-act="goto" data-step="${prev.id}"` : 'disabled'} aria-label="Предыдущий шаг">‹</button>
        <button type="button" class="cur" data-act="step-menu" aria-expanded="${ui.stepMenu}"><span class="n">${ci + 1}</span><span class="t">${vis[ci].name}</span>${anyWarn ? '<span class="w" aria-label="Есть незаконченные шаги"></span>' : ''}<span class="of">${ci + 1} из ${vis.length} ${ui.stepMenu ? '▴' : '▾'}</span></button>
        <button type="button" class="arrow" ${next ? `data-act="goto" data-step="${next.id}"` : 'disabled'} aria-label="Следующий шаг">›</button></div>
        ${ui.stepMenu ? `<ol>${info2.map((x) => `<li>${btn(x).replace('<span class="wt" aria-hidden="true"></span>', '<span class="wt">не всё выбрано</span>')}</li>`).join('')}</ol>` : ''}</div>`;
  }
  function render() {
    dv = R.derive(C);
    if (window.FR && FR.config) FR.config.level = C.level;   // подсказка класса показывает уровни вокруг текущего
    if (step === 'spells' && !hasSpellStep()) step = 'equipment';
    if (!STEPS.some((s) => s.id === step)) step = 'basics';
    renderStepper();
    const fn = { basics: stepBasics, race: stepRace, class: stepClass, abilities: stepAbilities, background: stepBackground, spells: stepSpells, equipment: stepEquipment, details: stepDetails, summary: stepSummary }[step] || stepBasics;
    const y = window.scrollY;
    const open = Array.from(document.querySelectorAll('#step details[open] > summary')).map((s) => s.textContent);
    $main().innerHTML = fn();
    if (open.length) document.querySelectorAll('#step details > summary').forEach((s) => { if (open.includes(s.textContent)) s.parentElement.open = true; });
    if (render._keepScroll) { window.scrollTo(0, y); render._keepScroll = false; }
    renderLive();
    if (step === 'summary') fillCode();
    save();
  }
  function soft() { render._keepScroll = true; render(); }

  /* ───── Код ───── */
  function pruned() {
    const c = U.clone(C);
    const d = R.derive(c);
    const keep = new Set(d.W.choices.map((x) => x.path).concat(d.pools.map((p) => p.path)));
    Object.keys(c.ch).forEach((k) => { if (!keep.has(k) || !(c.ch[k] || []).length) delete c.ch[k]; });
    const cls = d.cls; if (cls) Object.keys(c.eq.picks).forEach((k) => { if (+k >= cls.equipment.length) delete c.eq.picks[k]; });
    return c;
  }
  async function getCode() { const c = pruned(); const code = await DND.codec.encode(c); DND.state.remember(c, code); return code; }
  async function fillCode() { const el = document.getElementById('code-box'); if (!el) return; el.textContent = await getCode(); }

  /* ───── Изменение выборов ───── */
  function toggleChoice(path, v, max) {
    const x = dv.W.choices.find((y) => y.path === path);
    const cur2 = (x ? R.sel(C, path, x.ch) : (C.ch[path] || [])).slice();
    const i = cur2.indexOf(v);
    if (i >= 0) cur2.splice(i, 1);
    else if (max === 1) { cur2.length = 0; cur2.push(v); }
    else if (cur2.length >= max) { DND.toast(`Можно выбрать только ${max}. Сними один вариант.`); return; }
    else cur2.push(v);
    // Вложенные выборы снятого варианта очищаем
    if (i >= 0) Object.keys(C.ch).forEach((k) => { if (k.startsWith(path + '>' + v + '/')) delete C.ch[k]; });
    if (max === 1 && i < 0) Object.keys(C.ch).forEach((k) => { if (k.startsWith(path + '>') && !k.startsWith(path + '>' + v + '/')) delete C.ch[k]; });
    C.ch[path] = cur2;
  }
  const clearPrefix = (...ps) => Object.keys(C.ch).forEach((k) => { if (ps.some((p) => k.startsWith(p))) delete C.ch[k]; });
  function autoAssign(pool) {
    const c = dv.cls; if (!c) return;
    const order = U.uniq(c.primary.concat(['con', 'dex', 'wis', 'cha', 'int', 'str']));
    const vals = pool.slice().sort((a, b) => b - a);
    R.ABILS.forEach((a) => C.ab.base[a] = null);
    order.forEach((a, i) => C.ab.base[a] = vals[i]);
  }
  function assignSlot(ab) {
    const pool = R.abilityPool(C);
    if (ui.tok == null) { C.ab.base[ab] = null; return; }
    const v = pool[ui.tok];
    // если это значение уже стоит у другой характеристики (и больше свободных копий нет) — меняем местами
    const count = pool.filter((x) => x === v).length;
    const usedBy = R.ABILS.filter((k) => C.ab.base[k] === v && k !== ab);
    if (usedBy.length >= count) C.ab.base[usedBy[0]] = C.ab.base[ab];
    C.ab.base[ab] = v; ui.tok = null;
  }
  const scrollToId = (id) => setTimeout(() => { const d = document.getElementById(id); if (d) d.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 30);

  function onClick(e) {
    if (e.target.closest && e.target.closest('select, option, textarea, input')) return;
    if (e.target.id === 'live-scrim') { ui.open = false; renderLive(); return; }
    const el = e.target.closest('[data-act]'); if (!el) return;
    if (el.classList.contains('is-disabled') || el.getAttribute('aria-disabled') === 'true') { if (el.dataset.act !== 'ch' || !el.classList.contains('is-selected')) return; }
    const a = el.dataset.act, id = el.dataset.id;
    switch (a) {
      case 'goto': setStep(el.dataset.step); return;
      case 'step-menu': ui.stepMenu = !ui.stepMenu; renderStepper(); return;
      case 'level': C.level = +el.dataset.v; break;
      case 'hpmode': C.opt.hp = el.dataset.v; break;
      case 'hproll': { const c = dv.cls; C.hp.rolls[+el.dataset.i] = U.d(c.hd); break; }
      case 'race': if (C.race !== id) { C.race = id; C.subrace = null; C.origin = {}; clearPrefix('r/'); const r = I.races[id]; if (r.subraces && r.subraces.length === 1) C.subrace = r.subraces[0].id; } soft(); scrollToId('race-detail'); return;
      case 'subrace': C.subrace = id; C.origin = Object.assign({}, { on: C.origin.on }); break;
      case 'origin-to': C.origin = Object.assign({}, C.origin, { [el.dataset.origin]: el.dataset.v }); break;
      case 'cls': if (C.cls !== id) { C.cls = id; C.subclass = null; C.swap = {}; clearPrefix('c/', 's/', 'sp/'); C.eq.picks = {}; C.eq.any = {}; C.eq.equip = {}; C.hp.rolls = []; } soft(); scrollToId('class-detail'); return;
      case 'sub': if (C.subclass !== id) { C.subclass = id; clearPrefix('s/', 'sp/sub-'); } break;
      case 'bg': if (C.bg !== id) { C.bg = id; C.bgVariant = null; clearPrefix('b/'); Object.keys(C.eq.any).forEach((k) => { if (k.startsWith('b.')) delete C.eq.any[k]; }); } soft(); scrollToId('bg-detail'); return;
      case 'bgv': C.bgVariant = id || null; break;
      case 'ch': toggleChoice(el.dataset.path, el.dataset.v, +el.dataset.max); break;
      case 'method': {
        const m = el.dataset.v; if (m === C.ab.method) return;
        C.ab.method = m; ui.tok = null;
        if (m === 'pointbuy') R.ABILS.forEach((k) => C.ab.base[k] = 8);
        else if (m === 'standard' || m === 'roll' || m === 'live') R.ABILS.forEach((k) => C.ab.base[k] = null);
        break;
      }
      case 'token': ui.tok = ui.tok === +el.dataset.i ? null : +el.dataset.i; soft(); return;
      case 'slot': assignSlot(el.dataset.a); break;
      case 'auto-assign': autoAssign(R.abilityPool(C)); break;
      case 'clear-ab': R.ABILS.forEach((k) => C.ab.base[k] = null); ui.tok = null; break;
      case 'pb': { const ab = el.dataset.a; C.ab.base[ab] = Math.max(8, Math.min(15, C.ab.base[ab] + +el.dataset.d)); break; }
      case 'roll-all': {
        if (C.ab.rolls.length && !ui.reroll) { ui.reroll = 1; soft(); setTimeout(() => { ui.reroll = 0; }, 4000); return; }
        ui.reroll = 0;
        C.ab.rolls = [...Array(6)].map(() => { const d = [U.d(6), U.d(6), U.d(6), U.d(6)]; return { dice: d, total: d.reduce((x, y) => x + y, 0) - Math.min(...d) }; });
        C.ab.rollCount = (C.ab.rollCount || 0) + 1; R.ABILS.forEach((k) => C.ab.base[k] = null); ui.tok = null; ui.justRolled = true; break;
      }
      case 'pool': ui.pool = el.dataset.path; ui.spLvl = 'all'; soft(); return;
      case 'splvl': ui.spLvl = el.dataset.v; soft(); return;
      case 'eqmode': C.eq.mode = el.dataset.v; break;
      case 'eqpick': C.eq.picks[el.dataset.i] = +el.dataset.p; break;
      case 'equip': {
        const inv = dv.inv; const it = inv.items.find((x) => x.uid === el.dataset.uid); if (!it) return;
        const on = !it.equipped; const isShield = I.armor[it.id].type === 'shield';
        inv.items.filter((x) => x.kind === 'armor' && (I.armor[x.id].type === 'shield') === isShield).forEach((x) => C.eq.equip[x.uid] = false);
        C.eq.equip[it.uid] = on; break;
      }
      case 'rm': {
        const uid = el.dataset.uid;
        if (uid.startsWith('x')) C.eq.extra = C.eq.extra.filter((x) => x.uid !== uid);
        else if (uid.startsWith('g')) C.eq.bought.splice(+uid.slice(1), 1);
        else C.eq.removed = U.uniq((C.eq.removed || []).concat(uid));
        break;
      }
      case 'unremove': C.eq.removed = []; break;
      case 'add-item': {
        const inp = document.querySelector('[data-newitem]'); const name = (inp.value || '').trim(); if (!name) { inp.focus(); return; }
        C.eq.extra.push({ uid: 'x' + Date.now().toString(36), name, qty: 1 }); break;
      }
      case 'roll-gold': {
        const c = dv.cls; const m = /(\d+)к(\d+)(?:\s*×\s*(\d+))?/.exec(c.gold);
        let t = 0; for (let i = 0; i < +m[1]; i++) t += U.d(+m[2]); C.eq.gold = t * (m[3] ? +m[3] : 1); C.eq.coins = null;
        DND.toast(`${c.gold}: выпало ${C.eq.gold} зм`); break;
      }
      case 'buy': { const q = +el.dataset.q || 1; const ex = C.eq.bought.find((x) => x.id === id); if (ex) ex.qty += q; else C.eq.bought.push({ id, qty: q }); C.eq.coins = null; DND.toast('В инвентаре: ' + ((I.item(id) || {}).name || id)); break; }
      case 'align': C.info.alignment = C.info.alignment === el.dataset.v ? '' : el.dataset.v; break;
      case 'deity': C.info.deity = el.dataset.v || ''; break;
      case 'idea': { const k = el.dataset.k; const arr = D.personalityIdeas[k].filter((x) => x !== C.info[k]); C.info[k] = arr[Math.floor(Math.random() * arr.length)]; break; }
      case 'live-toggle': ui.open = !ui.open; renderLive(); return;
      case 'open-sheet': getCode().then((code) => { location.href = 'sheet.html#c=' + code; }); return;
      case 'pdf': getCode().then((code) => { location.href = 'sheet.html#c=' + code + '&pdf=' + el.dataset.v; }); return;
      case 'print': getCode().then((code) => { location.href = 'sheet.html#c=' + code + '&print=1'; }); return;
      case 'copy-code': getCode().then(async (code) => DND.toast((await DND.copy(code)) ? '✓ Код скопирован' : 'Не удалось скопировать — выдели вручную')); return;
      case 'copy-link': getCode().then(async (code) => DND.toast((await DND.copy(DND.codec.link(code))) ? '✓ Ссылка скопирована' : 'Не удалось скопировать')); return;
      case 'reset': if (!ui.resetArm) { ui.resetArm = 1; soft(); setTimeout(() => { ui.resetArm = 0; }, 4000); return; } ui.resetArm = 0; C = DND.state.blank(); step = 'basics'; U.ls.set('kh-step', step); break;
      default: return;
    }
    soft();
  }
  function setBind(path, val) { const ks = path.split('.'); let o = C; for (let i = 0; i < ks.length - 1; i++) o = o[ks[i]]; o[ks[ks.length - 1]] = val; }
  function onInput(e) {
    const t = e.target;
    if (t.dataset.bind) { setBind(t.dataset.bind, t.value); save(); if (t.dataset.bind === 'name') { dv = R.derive(C); renderLive(); renderStepper(); } return; }
    if (t.dataset.ui) { ui[t.dataset.ui] = t.value; if (t.tagName === 'INPUT') { clearTimeout(onInput._t); onInput._t = setTimeout(() => { const pos = t.selectionStart; soft(); const n = document.querySelector(`[data-ui="${t.dataset.ui}"]`); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (er) { } } }, 200); } return; }
    if (t.dataset.manual) { const v = t.value === '' ? null : Math.max(1, Math.min(30, +t.value)); C.ab.base[t.dataset.manual] = v; save(); clearTimeout(onInput._m); onInput._m = setTimeout(() => { dv = R.derive(C); updateAbilityRows(); renderLive(); }, 150); return; }
    if (t.dataset.live) {
      const live = (C.ab.live || [null, null, null, null, null, null]).slice(); const v = t.value === '' ? null : Math.round(+t.value);
      live[+t.dataset.live] = Number.isFinite(v) ? v : null; C.ab.live = live; save();
      const bad = v != null && (v < 3 || v > 18); t.classList.toggle('is-error', bad); t.setAttribute('aria-invalid', String(bad));
      return;
    }
    if (t.dataset.coin) { const inv = dv.inv; const coins = Object.assign({}, inv.coins); coins[t.dataset.coin] = Math.max(0, +t.value || 0); C.eq.coins = coins; save(); return; }
    if (t.hasAttribute('data-eqgold')) { C.eq.gold = Math.max(0, +t.value || 0); C.eq.coins = null; save(); return; }
    if (t.dataset.hp) { C.hp.rolls[+t.dataset.hp] = Math.max(1, Math.min(dv.cls.hd, +t.value || 0)) || null; save(); dv = R.derive(C); renderLive(); return; }
  }
  function updateAbilityRows() {
    R.ABILS.forEach((a) => {
      const row = document.querySelector(`.ab-sum .r[data-a="${a}"]`); if (row) row.outerHTML = abRow(a);
      const inp = document.querySelector(`[data-manual="${a}"]`); const e = manualErr(a);
      if (inp) { inp.classList.toggle('is-error', !!e); inp.setAttribute('aria-invalid', String(!!e)); }
      const er = document.querySelector(`[data-err="${a}"]`); if (er) er.textContent = e;
    });
  }
  function onChange(e) {
    const t = e.target;
    if (t.dataset.opt) { C.opt[t.dataset.opt] = t.checked; soft(); return; }
    if (t.dataset.act === 'swap') { C.swap[t.dataset.id] = t.checked; clearPrefix('c/'); soft(); return; }
    if (t.dataset.act === 'origin-on') { C.origin = Object.assign({}, C.origin, { on: t.checked }); soft(); return; }
    if (t.dataset.origin && t.tagName === 'SELECT') { C.origin[t.dataset.origin] = t.value; soft(); return; }
    if (t.dataset.any) { C.eq.any[t.dataset.any] = t.value || undefined; if (!t.value) delete C.eq.any[t.dataset.any]; soft(); return; }
    if (t.dataset.ui && t.tagName === 'SELECT') { ui[t.dataset.ui] = t.value; soft(); return; }
    if (t.dataset.bind && t.tagName === 'SELECT') { setBind(t.dataset.bind, t.value); soft(); return; }
    if (t.dataset.bind === 'info.portrait') { soft(); return; }
    if (t.dataset.live) { R.ABILS.forEach((k) => C.ab.base[k] = null); ui.tok = null; soft(); return; }
    if (t.dataset.manual || t.dataset.hp || t.hasAttribute('data-eqgold') || t.dataset.coin) { soft(); return; }
  }
  function onKey(e) {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.spell-row,[role="button"].info-btn')) { e.preventDefault(); e.target.click(); }
    if (e.key === 'Escape' && (ui.open || ui.stepMenu)) { ui.open = false; ui.stepMenu = false; renderLive(); renderStepper(); }
  }
  /* Перетаскивание чисел на десктопе */
  function initDrag() {
    document.addEventListener('dragstart', (e) => { const t = e.target.closest && e.target.closest('.token'); if (!t) return; e.dataTransfer.setData('text/plain', t.dataset.i); e.dataTransfer.effectAllowed = 'move'; });
    document.addEventListener('dragover', (e) => { const s = e.target.closest && e.target.closest('.slot'); if (!s) return; e.preventDefault(); document.querySelectorAll('.slot.is-drop').forEach((x) => x !== s && x.classList.remove('is-drop')); s.classList.add('is-drop'); });
    document.addEventListener('dragleave', (e) => { const s = e.target.closest && e.target.closest('.slot'); if (s && !s.contains(e.relatedTarget)) s.classList.remove('is-drop'); });
    document.addEventListener('drop', (e) => {
      const s = e.target.closest && e.target.closest('.slot'); if (!s) return; e.preventDefault();
      const k = parseInt(e.dataTransfer.getData('text/plain'), 10); if (isNaN(k)) return;
      ui.tok = k; assignSlot(s.dataset.a); soft();
    });
  }

  /* ───── Запуск ───── */
  async function boot() {
    const h = location.hash;
    const m = /(?:^#|&)edit=([^&]+)/.exec(h);
    if (m) {
      try { C = await DND.codec.decode(m[1]); step = 'summary'; history.replaceState(null, '', location.pathname); DND.toast('Персонаж загружен в конструктор'); }
      catch (err) { DND.toast('Не удалось открыть код: ' + err.message); }
    }
    T.init();
    document.addEventListener('click', onClick);
    document.addEventListener('input', onInput);
    document.addEventListener('change', onChange);
    document.addEventListener('keydown', onKey);
    initDrag();
    let wasWide = window.innerWidth >= 1024;
    window.addEventListener('resize', () => { const w = window.innerWidth >= 1024; if (w !== wasWide) { wasWide = w; ui.open = false; renderLive(); } });
    const tb = document.getElementById('theme'); if (tb) tb.onclick = () => DND.theme.toggle();
    render();
  }
  DND.builder = { get C() { return C; }, get dv() { return dv; }, render };
  document.addEventListener('DOMContentLoaded', boot);
})();
