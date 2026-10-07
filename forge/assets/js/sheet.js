/* Лист персонажа: экранный вид с трекером, страницы A4, печать, PDF, код и QR. */
(function () {
  const D = DND.data, I = DND.idx, U = DND.util, R = DND.rules, esc = U.esc;
  let C = null, dv = null, code = '', fromDraft = false, qrImg = '';
  const LIBS = {
    h2c: 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
    pdf: 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
    qr: 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'
  };
  const loaded = {};
  function load(url) {
    if (loaded[url]) return loaded[url];
    loaded[url] = new Promise((res, rej) => { const s = document.createElement('script'); s.src = url; s.onload = res; s.onerror = () => rej(new Error('Не удалось загрузить библиотеку (нет интернета?)')); document.head.appendChild(s); });
    return loaded[url];
  }

  /* ───── Общие куски ───── */
  const who = () => [dv.subrace ? dv.subrace.name : dv.race && dv.race.name, dv.cls && (dv.cls.name + ' ' + C.level), dv.sub && dv.sub.name].filter(Boolean).join(' · ');
  const al = () => (I.alignments[C.info.alignment] || {}).name || '';
  const deity = () => (I.deities[C.info.deity] || {}).name || '';
  const bgName = () => dv.bg ? dv.bg.name + (R.bgVariant(C) ? ' (' + R.bgVariant(C).name + ')' : '') : '';
  const speedText = () => [dv.speed.walk + ' фт', dv.speed.swim ? 'плав. ' + dv.speed.swim : '', dv.speed.climb ? 'лаз. ' + dv.speed.climb : '', dv.speed.fly ? 'полёт ' + dv.speed.fly : ''].filter(Boolean).join(', ');
  const hitDice = () => dv.cls ? `${C.level}к${dv.cls.hd}` : '—';
  const ownerLabel = { race: 'Раса', class: 'Класс', subclass: 'Подкласс', background: 'Предыстория', feat: 'Черта' };
  const fromText = (f) => (f.owner && f.owner.name ? f.owner.name : ownerLabel[f.kind] || '') + (f.level ? ' · ' + f.level + ' ур.' : '');
  const usesN = (f) => { const n = parseInt(f.uses, 10); return n >= 1 && n <= 8 && !/\(с \d/.test(f.uses || '') ? n : 0; };
  const isShort = (f) => /корот/.test(f.uses || '');
  const circles = (n, cls) => Array.from({ length: n }, () => `<i class="${cls || ''}"></i>`).join('');
  const lines = (n) => `<div class="lined" style="min-height:${n}px"></div>`;
  const mainBlock = () => dv.casting.blocks.find((b) => b.main);
  const coinsText = () => { const co = dv.inv.coins; return [co.gp ? co.gp + ' зм' : '', co.sp ? co.sp + ' см' : '', co.cp ? co.cp + ' мм' : ''].filter(Boolean).join(', ') || '0 зм'; };
  function spellsByLevel() {
    const by = {};
    dv.casting.spells.forEach((s) => (by[s.sp.lvl] = by[s.sp.lvl] || []).push(s));
    return by;
  }
  const spellTags = (s) => s.tags.filter((t) => t && !/подготовлено|в книге/.test(t));

  /* ───── Трекер игры: хиты, кости, ячейки, расход умений ─────
     Хранится отдельно от кода персонажа: kh-play-<хэш кода>. */
  let play = null;
  const playKey = () => { let h = 0; for (let i = 0; i < code.length; i++) h = (h * 31 + code.charCodeAt(i)) | 0; return 'kh-play-' + (h >>> 0).toString(36); };
  function loadPlay() {
    const p = U.ls.get(playKey(), null) || {};
    play = { hp: p.hp == null ? dv.hp.max : Math.min(p.hp, dv.hp.max), temp: p.temp || 0, hd: p.hd || 0, slots: p.slots || {}, uses: p.uses || {} };
  }
  const savePlay = () => U.ls.set(playKey(), play);

  /* ───── Броски ───── */
  /* Броски — настоящими кубиками; на листе число открывает «Откуда число» (shared/sheet.js) */
  const sh = () => DND.sheetData(C, dv);

  /* ═════════ Экранный вид ═════════ */
  function hpCard() {
    const max = dv.hp.max, hd = dv.cls ? C.level : 0;
    return `<section class="sm-card hp-card sm-sec" aria-label="Хиты">
      <div class="hd"><h2>Хиты</h2><span class="muted">Кости Хитов ${hitDice()}${hd ? ' · ' + (hd - play.hd) + ' из ' + hd : ''}</span></div>
      ${FR.sheet.hpBar(play.hp, max, play.temp)}
      <div class="hp-do"><input class="input" type="number" min="1" inputmode="numeric" id="hp-amt" placeholder="0" aria-label="Сколько хитов"><button type="button" class="btn danger" data-hpdo="dmg">− Урон</button><button type="button" class="btn" data-hpdo="heal">+ Лечение</button></div>
      <div class="hp-temp"><span>Временные хиты</span><span class="stepper-input"><button type="button" data-temp="-1" aria-label="Меньше временных хитов">−</button><span class="num">${play.temp}</span><button type="button" data-temp="1" aria-label="Больше временных хитов">+</button></span></div>
      ${hd ? `<div class="hp-hd"><span>Кости Хитов <b>${hitDice()}</b><small>отметь потраченную на коротком отдыхе; бросай к${dv.cls.hd} вживую</small></span><span class="dots">${Array.from({ length: hd }, (_, i) => `<button type="button" class="dotb ${i < play.hd ? 'used' : ''}" data-hd="${i}" aria-label="${i < play.hd ? 'Кость потрачена — вернуть' : 'Потратить Кость Хитов'}"><i></i></button>`).join('')}</span></div>` : ''}
      <div class="rest"><button type="button" class="btn" data-rest="short">Короткий отдых</button><button type="button" class="btn" data-rest="long">Продолжительный</button></div>
    </section>`;
  }
  function mobile(forPdf) {
    const ab = dv.ab;
    const intro = `<section class="sm-intro sm-sec" id="s-main">
      ${C.info.portrait && /^https?:/i.test(C.info.portrait) ? `<img class="sm-portrait" src="${esc(C.info.portrait)}" alt="" crossorigin="anonymous" onerror="this.remove()">` : ''}
      <p class="eyebrow">Лист персонажа</p><h1>${esc(C.name || 'Безымянный герой')}</h1>
      <p class="who">${esc(who() || 'Раса и класс не выбраны')}</p>
      <p class="sub">${esc([bgName(), al(), deity()].filter(Boolean).join(' · '))}</p>
      <div class="rule2" aria-hidden="true"></div></section>`;
    const anchors = forPdf ? '' : `<nav class="tabs sm-tabs no-print" aria-label="Разделы листа">${[['s-main', 'Главное'], ['s-skills', 'Навыки'], ['s-attacks', 'Атаки'], ['s-feats', 'Умения'], dv.casting.has ? ['s-spells', 'Заклинания'] : null, ['s-gear', 'Снаряжение'], ['s-desc', 'Описание']].filter(Boolean).map(([id, n], i) => `<button type="button" data-anchor="${id}" class="${i === 0 ? 'is-on' : ''}">${n}</button>`).join('')}</nav>`;
    const S = FR.sheet, d = sh(), o = { key: 'fs', hp: { cur: play.hp, max: dv.hp.max, temp: play.temp } };
    const big = `<div class="sm-sec">${S.vitals(d, o)}</div>`;
    const meds = `<section class="sm-sec" aria-label="Характеристики">${S.meds(d, o)}</section>`;
    const saves = `<section class="sm-sec" id="s-skills"><h2>Спасброски</h2><div class="rows two">${S.saves(d, o)}</div></section>`;
    const skills = `<section class="sm-sec"><div class="hd2"><h2>Навыки</h2>${S.legend()}</div>
      <div class="rows">${S.skills(d, o)}</div>
      <div class="kv-line"><span>Пассивная Внимательность</span><b>${dv.passive.perception}</b></div><div class="kv-line"><span>Пассивный Анализ · Проницательность</span><b>${dv.passive.investigation} · ${dv.passive.insight}</b></div></section>`;
    const atk = `<section class="sm-sec" id="s-attacks"><h2>Атаки</h2>${S.attacks(d)}
      ${forPdf ? '' : '<p class="note">Нажми на число — покажу, из чего оно сложено. Кости бросай настоящие.</p>'}</section>`;
    const feats = `<section class="sm-sec" id="s-feats"><h2>Умения и особенности</h2><div class="feat-list">${dv.features.map((f, i) => {
      const n = usesN(f); const key = (f.id || 'f') + ':' + i; const used = play.uses[key] || 0;
      const dots = n ? `<span class="uses">${forPdf ? circles(n) : Array.from({ length: n }, (_, j) => `<span role="checkbox" tabindex="0" aria-checked="${j < used}" aria-label="Отметить расход" class="dotb ${j < used ? 'used' : ''}" data-use="${esc(key)}" data-j="${j}"><i></i></span>`).join('')}<small>${esc(f.uses.replace(/^\d+\s*/, ''))}</small></span>` : f.uses ? `<span class="uses"><small>${esc(f.uses)}</small></span>` : '';
      // подсказка Кодекса по наведению (щелчок остаётся за <details>: раскрыть описание); в PDF — просто текст
      const ref = !forPdf && f.id && window.FR && FR.codex && FR.codex.get('feature', f.id) ? 'feature:' + f.id : '';
      return `<details class="feat"${forPdf ? ' open' : ''}><summary><span class="nm"><b${ref ? ` class="ref" data-ref="${ref}" data-ref-mode="hover"` : ''}>${esc(f.name)}</b><small>${esc(fromText(f))}</small></span>${dots}<span class="chev" aria-hidden="true">▾</span></summary><p>${esc(f.desc)}</p>${f.picks && f.picks.length ? `<p class="pk">${f.picks.map((p) => esc(p.name)).join(', ')}</p>` : ''}</details>`;
    }).join('')}</div></section>`;
    let spells = '';
    if (dv.casting.has) {
      const m = mainBlock();
      const stat = dv.casting.blocks.map((b) => `<div class="sp-stats"><div><b>${I.abilShort(b.abil)}</b><small>${esc(b.main ? 'Базовая' : b.name)}</small></div><div><b>${b.dc}</b><small>Сл спасброска</small></div><div><b>${esc(b.atk)}</b><small>Бонус атаки</small></div></div>`).join('');
      const slotRow = (lvl, n, note) => { const used = play.slots[lvl] || 0; return `<div class="slot-row"><b>Ячейки ${lvl}-го круга</b><span class="dots">${forPdf ? circles(n) : Array.from({ length: n }, (_, j) => `<button type="button" class="dotb lg ${j < used ? 'used' : ''}" data-slot="${lvl}" data-j="${j}" aria-label="${j < used ? 'Ячейка потрачена — вернуть' : 'Потратить ячейку'}"><i></i></button>`).join('')}</span><small>${note}</small></div>`; };
      const slots = m ? (m.pact ? slotRow(m.pact.lvl, m.pact.n, 'вернутся после короткого отдыха') : (m.slots || []).map((n, i) => n ? slotRow(i + 1, n, 'вернутся после продолжительного отдыха') : '').join('')) : '';
      const by = spellsByLevel();
      spells = `<section class="sm-sec" id="s-spells"><h2>Заклинания</h2>${stat}${slots}
        ${Object.keys(by).sort().map((l) => `<div class="sp-group"><div class="sec-head"><h3>${+l ? l + ' круг' : 'Заговоры'}</h3><span class="cnt">${+l ? '' : 'без ячеек, сколько угодно'}</span></div>
          ${by[l].map((s) => { const tg = spellTags(s); return `<details class="spell-row"${forPdf ? ' open' : ''}><summary><span class="nm"><b>${esc(s.sp.name)}</b><small>${esc(DND.tips.spellHeader(s.sp))}${s.sp.conc ? ' · концентрация' : ''}${s.sp.ritual ? ' · ритуал' : ''}</small></span>${tg.length ? `<span class="badge">${esc(tg.join(', '))}</span>` : ''}</summary><p>${esc(s.sp.desc)}</p></details>`; }).join('')}</div>`).join('')}</section>`;
    }
    const gear = `<section class="sm-sec" id="s-gear"><h2>Снаряжение</h2>
      <div class="rows">${dv.inv.items.map((x) => `<div class="item-row"><span class="nm"><span>${esc(x.name)}${x.qty > 1 ? ` <b>×${x.qty}</b>` : ''}</span>${x.contents ? `<span class="sub">${esc(x.contents.join(', '))}</span>` : ''}</span>${x.equipped ? '<span class="badge ok">надето</span>' : ''}</div>`).join('')}</div>
      <div class="coins">${[['мм', dv.inv.coins.cp], ['см', dv.inv.coins.sp], ['эм', 0], ['зм', dv.inv.coins.gp], ['пм', 0]].map(([k, v]) => `<div class="${v ? 'has' : ''}"><b>${v || 0}</b><small>${k}</small></div>`).join('')}</div>
      <p class="profs"><b>Доспехи.</b> ${esc(dv.profs.armor.join(', ') || '—')}. <b>Оружие.</b> ${esc(dv.profs.weapons.join(', ') || '—')}. <b>Инструменты.</b> ${esc(dv.profs.tools.join(', ') || '—')}. <b>Языки.</b> ${esc(dv.profs.languages.join(', ') || '—')}.${dv.senses.length ? ` <b>Чувства.</b> ${esc(dv.senses.join(', '))}.` : ''}${dv.resist.length ? ` <b>Сопротивление.</b> ${esc(dv.resist.join(', '))}.` : ''}${dv.immune.length ? ` <b>Иммунитет.</b> ${esc(dv.immune.join(', '))}.` : ''}</p></section>`;
    const i = C.info;
    const look = [['Возраст', i.age], ['Рост', i.height], ['Вес', i.weight], ['Глаза', i.eyes], ['Кожа', i.skin], ['Волосы', i.hair]].filter(([, v]) => v);
    const traits = [['Черты характера', i.traits], ['Идеалы', i.ideals], ['Привязанности', i.bonds], ['Слабости', i.flaws]].filter(([, v]) => v);
    const story = (i.backstory || '').trim();
    const about = `<section class="sm-sec" id="s-desc"><h2>Описание</h2>
      ${look.length ? `<div class="looks-grid">${look.map(([k, v]) => `<div><small>${k}</small>${esc(v)}</div>`).join('')}</div>` : ''}
      ${i.appearance ? `<p class="prose">${esc(i.appearance)}</p>` : ''}
      ${traits.length ? `<div class="trait-cards">${traits.map(([k, v]) => `<div><small>${k}</small><span>${esc(v)}</span></div>`).join('')}</div>` : ''}
      ${story ? `<p class="prose story"><span class="drop">${esc(story.charAt(0))}</span>${esc(story.slice(1))}</p>` : ''}
      ${[['Союзники и организации', i.allies], ['Заметки', i.notes]].filter(([, v]) => v).map(([k, v]) => `<h3>${k}</h3><p class="prose">${esc(v)}</p>`).join('')}
      ${!look.length && !traits.length && !story && !i.appearance ? '<p class="note">Описание пока не заполнено — его можно дописать в конструкторе.</p>' : ''}</section>`;
    const codeSec = forPdf ? `<section class="sm-sec"><h2>Код персонажа</h2><p class="note">Вставь на странице «Загрузить по коду», чтобы открыть этот лист снова.</p><div class="sm-code">${esc(code)}</div></section>` : '';
    return `${intro}${anchors}${big}<div class="sm-cols"><div class="sm-left">${forPdf ? '' : hpCard()}${meds}${saves}${skills}</div><div class="sm-right">${atk}${feats}${spells}${gear}${about}${codeSec}</div></div>`;
  }

  /* ═════════ A4 ═════════ */
  const foot = (n, total) => `<div class="foot"><span>Кузница героев · D&amp;D 5e (2014)</span><span>${esc(C.name || 'Персонаж')} · стр. ${n} из ${total}</span></div>`;
  const pgTitle = (t, sub) => `<div class="pg-title"><h2>${t}</h2><span>${esc(sub || '')}</span></div><div class="rule2" aria-hidden="true"></div>`;
  const cap = (t) => `<span class="cap">${t}</span>`;
  function page1() {
    const ab = dv.ab;
    const head = [['Класс и уровень', dv.cls ? dv.cls.name + ' ' + C.level + (dv.sub ? ' · ' + dv.sub.name : '') : ''], ['Предыстория', bgName()], ['Имя игрока', C.player], ['Раса', dv.subrace ? dv.subrace.name : dv.race ? dv.race.name : ''], ['Мировоззрение', al()], ['Опыт', D.xp ? String(D.xp[C.level - 1]) : '']];
    const res = dv.features.filter((f) => usesN(f)).map((f) => `<div class="res"><span>${esc(f.name)}<small>${esc(f.uses.replace(/^\d+\s*/, ''))}</small></span><span class="c">${circles(usesN(f))}</span></div>`).join('');
    const m = mainBlock();
    const slotRes = m ? (m.pact ? `<div class="res"><span>Ячейки договора (${m.pact.lvl} круг)<small>короткий отдых</small></span><span class="c">${circles(m.pact.n)}</span></div>` : (m.slots || []).map((n, i) => n ? `<div class="res"><span>Ячейки ${i + 1} круга<small>продолжительный отдых</small></span><span class="c">${circles(n)}</span></div>` : '').join('')) : '';
    return `<section class="sheet-page p1">
      <div class="p1-head"><div class="nmblock"><span class="nm">${esc(C.name || '')}</span>${cap('Имя персонажа')}</div>
        <div class="fields">${head.map(([k, v]) => `<div><span class="v">${esc(v || '')}</span>${cap(k)}</div>`).join('')}</div></div>
      <div class="rule2" aria-hidden="true"></div>
      <div class="p1-grid">
        <div class="p1-left">
          <div class="meds">${R.ABILS.map((a) => `<div class="am">${cap(I.abilName(a))}<b>${ab[a].total == null ? '' : U.sgn(ab[a].mod)}</b><span class="sc">${ab[a].total == null ? '' : ab[a].total}</span></div>`).join('')}</div>
          <div class="p1-lc">
            <div class="box row"><span class="sqbox"></span>${cap('Вдохновение')}</div>
            <div class="box row"><b class="bn">+2</b>${cap('Бонус мастерства')}</div>
            <div class="box">${dv.saves.map((s) => `<div class="ln"><span class="d ${s.prof ? 'on' : ''}"></span><b>${U.sgn(s.total)}</b><span>${esc(s.name)}</span></div>`).join('')}${cap('Спасброски')}</div>
            <div class="box grow">${dv.skills.map((s) => `<div class="ln sm"><span class="d ${s.prof ? 'on' : ''} ${s.exp ? 'exp' : ''}"></span><b>${U.sgn(s.total)}</b><span class="t">${esc(s.name)} <small>${I.abilShort(s.abil)}</small></span></div>`).join('')}${cap('Навыки')}</div>
            <div class="box row"><b class="bn">${dv.passive.perception}</b>${cap('Пассивная Мудрость (Внимательность)')}</div>
          </div>
        </div>
        <div class="p1-mid">
          <div class="trio"><div class="shield"><b>${dv.ac.value}</b>${cap('Класс Доспеха')}<small>${esc(dv.ac.label)}</small></div><div><b>${U.sgn(dv.init)}</b>${cap('Инициатива')}</div><div><b>${dv.speed.walk}</b>${cap('Скорость')}<small>${esc(speedText().replace(/^\d+ фт,?\s*/, '') || 'фт')}</small></div></div>
          <div class="box thick"><div class="mx"><span>Максимум хитов</span><b>${dv.hp.max}</b></div><div style="height:64px"></div>${cap('Текущие хиты')}</div>
          <div class="box"><div style="height:36px"></div>${cap('Временные хиты')}</div>
          <div class="two"><div class="box"><span class="small">Итого <b>${hitDice()}</b></span><div class="cc">${circles(Math.min(C.level, 6), 'md')}</div>${cap('Кости Хитов')}</div>
            <div class="box ds"><div><span>Успехи</span><span>${circles(3)}</span></div><div><span>Провалы</span><span>${circles(3)}</span></div>${cap('Спасброски от смерти')}</div></div>
          <div class="box grow atk"><div class="r hd"><span>Название</span><span>Бонус</span><span>Урон / вид</span></div>
            ${dv.attacks.slice(0, 9).map((a) => `<div class="r"><b>${esc(a.name)}</b><b class="c">${esc(a.hit)}</b><span>${esc(a.dmg)} ${esc(a.dt)}</span></div>`).join('')}
            <div class="r blank"></div><div class="r blank"></div>
            ${dv.attacks.some((a) => a.notes) ? `<p class="nt">${dv.attacks.filter((a) => a.notes).slice(0, 5).map((a) => `<b>${esc(a.name)}:</b> ${esc(a.notes)}`).join('. ')}.</p>` : ''}
            ${cap('Атаки и заклинания')}</div>
        </div>
        <div class="p1-right">
          ${res || slotRes ? `<div class="box">${cap('Ресурсы')}${res}${slotRes}</div>` : ''}
          <div class="box feats">${cap('Особенности')}${dv.features.map((f) => `<div class="fi"><b>${esc(f.name)}</b>${f.picks && f.picks.length ? ` <small>${esc(f.picks.map((p) => p.name).join(', '))}</small>` : ''}</div>`).join('')}<small class="mut">Описания — на стр. 2</small></div>
          <div class="box grow plist">
            <div><b>Доспехи.</b> ${esc(dv.profs.armor.join(', ') || '—')}</div><div><b>Оружие.</b> ${esc(dv.profs.weapons.join(', ') || '—')}</div>
            <div><b>Инструменты.</b> ${esc(dv.profs.tools.join(', ') || '—')}</div><div><b>Языки.</b> ${esc(dv.profs.languages.join(', ') || '—')}</div>
            ${dv.senses.length ? `<div><b>Чувства.</b> ${esc(dv.senses.join('; '))}</div>` : ''}${dv.resist.length ? `<div><b>Сопротивление.</b> ${esc(dv.resist.join(', '))}</div>` : ''}${dv.immune.length ? `<div><b>Иммунитет.</b> ${esc(dv.immune.join(', '))}</div>` : ''}
            ${dv.ac.notes.length ? `<div><b>КД.</b> ${esc(dv.ac.notes.join('; '))}</div>` : ''}
            ${cap('Прочие владения и языки')}</div>
        </div>
      </div>__FOOT__</section>`;
  }
  function page2() {
    return `<section class="sheet-page">${pgTitle('Умения и особенности', [C.name, dv.cls && dv.cls.name + ' ' + C.level].filter(Boolean).join(' · '))}
      <div class="fl">${dv.features.map((f) => `<div class="f"><div class="fh"><b>${esc(f.name)}</b>${f.uses ? `<span class="u">${usesN(f) ? circles(usesN(f)) : ''}${esc(usesN(f) ? f.uses.replace(/^\d+\s*/, '') : f.uses)}</span>` : ''}</div>
        <div class="from">${esc(fromText(f))}</div><p>${esc(f.desc)}</p>${f.picks && f.picks.length ? `<p class="pk">${f.picks.map((p) => esc(p.name) + (p.desc ? ' — ' + esc(p.desc) : '')).join('<br>')}</p>` : ''}</div>`).join('')}</div>__FOOT__</section>`;
  }
  function page3() {
    if (!dv.casting.has) return '';
    const m = mainBlock();
    const b0 = m || dv.casting.blocks[0];
    const slots = m ? (m.pact ? `<b>Ячейки ${m.pact.lvl}-го круга</b><span class="c">${circles(m.pact.n, 'lg')}</span><small>Все заклинания накладываются на ${m.pact.lvl}-м круге. Восстанавливаются после короткого отдыха.</small>`
      : `${(m.slots || []).map((n, i) => n ? `<div><b>${i + 1} круг</b> <span class="c">${circles(n, 'lg')}</span></div>` : '').join('')}<small>Восстанавливаются после продолжительного отдыха.</small>`) : '<small>Ячеек нет — только заговоры и врождённая магия.</small>';
    const by = spellsByLevel();
    const prepType = m && (m.type === 'prepared' || m.type === 'book');
    const rows = Object.keys(by).sort().map((l) => by[l].map((s) => {
      const tg = spellTags(s); const prep = s.tags.some((t) => /подготовлено/.test(t || ''));
      return `<div class="r"><span class="d ${!+l || s.innate || prep ? 'on' : ''}"></span><span><b>${esc(s.sp.name)}</b>${s.sp.conc ? ' <em>К</em>' : ''}${s.sp.ritual ? ' <em>Р</em>' : ''}${tg.length ? `<small>${esc(tg.join(', '))}</small>` : ''}</span><b>${+l}</b><span>${esc(s.sp.time)}</span><span>${esc(s.sp.range)}</span><span>${esc(s.sp.dur)}</span><span class="ef">${esc(s.sp.desc)}</span></div>`;
    }).join('')).join('');
    const picked = dv.features.filter((f) => f.picks && f.picks.length && (f.kind === 'class' || f.kind === 'subclass')).slice(0, 4);
    return `<section class="sheet-page">${pgTitle('Заклинания', dv.casting.blocks.map((b) => b.name).join(' · '))}
      <div class="sp-head"><div class="box c"><b>${I.abilName(b0.abil)}</b>${cap('Базовая характеристика')}</div><div class="box c"><b>${b0.dc}</b>${cap('Сл спасброска')}</div><div class="box c"><b>${esc(b0.atk)}</b>${cap('Бонус атаки')}</div><div class="box slots">${slots}</div></div>
      ${dv.casting.blocks.length > 1 ? `<p class="small">${dv.casting.blocks.filter((b) => b !== b0).map((b) => `<b>${esc(b.name)}:</b> ${I.abilName(b.abil)}, Сл ${b.dc}, атака ${esc(b.atk)}`).join('; ')}</p>` : ''}
      <div class="box spt"><div class="r hd"><span></span><span>Название</span><span>Кр.</span><span>Время</span><span>Дист.</span><span>Длит.</span><span>Эффект</span></div>${rows}
        <div class="r nt">● — заговор, врождённое или подготовленное заклинание${prepType ? '; пустой кружок — отметь, если подготовишь' : ''}. К — концентрация, Р — ритуал. Круг 0 — заговор.</div></div>
      ${picked.length ? `<div class="two">${picked.map((f) => `<div class="box">${cap(esc(f.name))}${f.picks.map((p) => `<div class="pick"><b>${esc(p.name)}.</b> ${esc(p.desc || '')}</div>`).join('')}</div>`).join('')}</div>` : ''}
      <div class="box grow">${cap('Заметки о заклинаниях')}${lines(60)}</div>__FOOT__</section>`;
  }
  function page4() {
    const i = C.info;
    const look = [['Возраст', i.age], ['Рост', i.height], ['Вес', i.weight], ['Глаза', i.eyes], ['Кожа', i.skin], ['Волосы', i.hair]];
    const traits = [['Черты характера', i.traits], ['Идеалы', i.ideals], ['Привязанности', i.bonds], ['Слабости', i.flaws]];
    const story = (i.backstory || '').trim();
    const coins = dv.inv.coins;
    const dty = C.info.deity && I.deities[C.info.deity];
    return `<section class="sheet-page">${pgTitle('Описание и снаряжение', [bgName(), al()].filter(Boolean).join(' · '))}
      <div class="looks">${look.map(([k, v]) => `<div><span class="v">${esc(v || '')}</span>${cap(k)}</div>`).join('')}</div>
      <div class="two">
        <div class="stk">${traits.map(([k, v]) => `<div class="box">${cap(k)}<div class="txt">${esc(v || '')}</div>${v ? '' : lines(22)}</div>`).join('')}
          ${dty ? `<div class="box">${cap('Божество')}<div class="txt"><b>${esc(dty.name)}</b> — ${esc(dty.title)}. Символ: ${esc(dty.symbol)}.</div></div>` : ''}</div>
        <div class="box">${i.portrait && /^https?:/i.test(i.portrait) ? `<img class="portrait-img" src="${esc(i.portrait)}" crossorigin="anonymous" onerror="this.remove()" alt="">` : ''}${cap('Предыстория персонажа')}
          ${story ? `<p class="story"><span class="drop">${esc(story.charAt(0))}</span>${esc(story.slice(1))}</p>` : lines(120)}
          ${i.appearance ? `<p class="txt"><b>Внешность.</b> ${esc(i.appearance)}</p>` : ''}
          ${i.allies ? `<p class="txt"><b>Союзники и организации.</b> ${esc(i.allies)}</p>` : ''}</div>
      </div>
      <div class="two wide grow">
        <div class="box col">${cap('Снаряжение')}${dv.inv.items.map((x) => `<div class="eq"><span>${esc(x.name)}${x.qty > 1 ? ' ×' + x.qty : ''}${x.equipped ? ' ✓' : ''}${x.contents ? ` <small>— ${esc(x.contents.join(', '))}</small>` : ''}</span></div>`).join('')}
          <div class="lined grow"></div>
          <div class="coins">${[['мм', coins.cp], ['см', coins.sp], ['эм', ''], ['зм', coins.gp], ['пм', '']].map(([k, v]) => `<div><b>${v || ''}</b><small>${k}</small></div>`).join('')}</div></div>
        <div class="stk">
          <div class="box col grow">${cap('Заметки')}${i.notes ? `<div class="txt">${esc(i.notes)}</div>` : ''}<div class="lined grow"></div></div>
          <div class="box thick qrline"><div class="qr-slot">${qrImg || ''}</div><div>${cap('Код персонажа')}<code>${esc(code)}</code><small>Отсканируй QR или вставь код на странице «Загрузить по коду».</small></div></div>
        </div>
      </div>__FOOT__</section>`;
  }
  function a4() {
    const pages = [page1(), page2(), page3(), page4()].filter(Boolean);
    return pages.map((p, n) => p.replace('__FOOT__', foot(n + 1, pages.length))).join('');
  }
  function fitA4() {
    const w = document.getElementById('a4'); if (!w || w.classList.contains('is-offscreen')) return;
    const z = Math.min(1, (window.innerWidth - 24) / 800);
    w.style.setProperty('--z', z.toFixed(3));
  }

  /* ───── QR ───── */
  async function qrDataUrl(text) {
    try {
      await load(LIBS.qr);
      const box = document.createElement('div'); box.style.position = 'absolute'; box.style.left = '-9999px'; document.body.appendChild(box);
      new window.QRCode(box, { text, width: 360, height: 360, correctLevel: window.QRCode.CorrectLevel.L });
      await new Promise((r) => setTimeout(r, 60));
      const cv = box.querySelector('canvas'); const url = cv ? cv.toDataURL('image/png') : (box.querySelector('img') || {}).src;
      box.remove(); return url || null;
    } catch (e) { return null; }
  }

  /* ───── PDF ───── */
  async function pdf(kind) {
    DND.toast('Готовлю PDF…');
    try {
      await Promise.all([load(LIBS.h2c), load(LIBS.pdf)]);
      await document.fonts.ready;
      const { jsPDF } = window.jspdf;
      const fname = (C.name || 'персонаж').replace(/[\\/:*?"<>|]+/g, '') + (kind === 'phone' ? ' (телефон)' : '') + '.pdf';
      if (kind === 'phone') {
        const W = 100, H = 178; // мм, пропорции экрана телефона
        const doc = new jsPDF({ unit: 'mm', format: [W, H] });
        const prevTheme = document.documentElement.getAttribute('data-theme');
        document.documentElement.setAttribute('data-theme', 'light');
        const host = document.createElement('div');
        host.className = 'sheet-mobile is-pdf';
        host.style.cssText = 'position:absolute;left:-10000px;top:0;width:400px;padding:12px;background:#EFE5CF';
        host.innerHTML = mobile(true);
        document.body.appendChild(host);
        const secs = Array.from(host.querySelectorAll('.sm-sec'));
        const margin = 4, cw = W - margin * 2; let y = margin, first = true;
        const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#EFE5CF';
        const newPage = () => { if (!first) doc.addPage([W, H]); first = false; doc.setFillColor(bg); doc.rect(0, 0, W, H, 'F'); y = margin; };
        newPage();
        for (const s of secs) {
          // Фон задаём явно: прозрачные области в JPEG превращаются в чёрные
          const cv = await window.html2canvas(s, { scale: 2.5, backgroundColor: bg, useCORS: true });
          const h = cv.height * cw / cv.width;
          if (h <= H - margin * 2) {
            if (y + h > H - margin) newPage();
            doc.addImage(cv.toDataURL('image/jpeg', 0.92), 'JPEG', margin, y, cw, h); y += h + 3;
          } else {
            if (y > margin + 1) newPage();
            const pxPerMm = cv.width / cw; const sliceH = Math.floor((H - margin * 2) * pxPerMm);
            for (let sy = 0; sy < cv.height; sy += sliceH) {
              const part = document.createElement('canvas'); part.width = cv.width; part.height = Math.min(sliceH, cv.height - sy);
              part.getContext('2d').drawImage(cv, 0, sy, cv.width, part.height, 0, 0, cv.width, part.height);
              if (sy > 0) newPage();
              doc.addImage(part.toDataURL('image/jpeg', 0.92), 'JPEG', margin, y, cw, part.height / pxPerMm); y += part.height / pxPerMm + 3;
            }
          }
        }
        host.remove();
        if (prevTheme) document.documentElement.setAttribute('data-theme', prevTheme); else document.documentElement.removeAttribute('data-theme');
        doc.save(fname);
      } else {
        const doc = new jsPDF({ unit: 'mm', format: 'a4' });
        const wrap = document.getElementById('a4');
        const wasHidden = wrap.hidden; wrap.hidden = false; wrap.classList.add('is-offscreen');
        const pages = Array.from(wrap.querySelectorAll('.sheet-page'));
        let firstPage = true;
        for (const p of pages) {
          const cv = await window.html2canvas(p, { scale: 2.2, backgroundColor: '#ffffff', useCORS: true });
          const pxPerMm = cv.width / 210; const pageH = Math.round(297 * pxPerMm);
          for (let sy = 0; sy < cv.height - 4; sy += pageH) {
            const part = document.createElement('canvas'); part.width = cv.width; part.height = Math.min(pageH, cv.height - sy);
            const g = part.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, part.width, part.height); g.drawImage(cv, 0, sy, cv.width, part.height, 0, 0, cv.width, part.height);
            if (!firstPage) doc.addPage(); firstPage = false;
            doc.addImage(part.toDataURL('image/jpeg', 0.93), 'JPEG', 0, 0, 210, part.height / pxPerMm);
          }
        }
        wrap.classList.remove('is-offscreen'); wrap.hidden = wasHidden;
        doc.save(fname);
      }
      DND.toast('✓ PDF сохранён');
    } catch (e) { console.error(e); DND.toast('Не получилось: ' + e.message + ' Попробуй «Печать» → «Сохранить как PDF».'); }
  }

  /* ───── Модалка кода ───── */
  function codeModal() {
    const link = DND.codec.link(code);
    const prevFocus = document.activeElement;
    const bg = document.createElement('div'); bg.className = 'modal-bg';
    bg.innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="code-title">
      <div class="modal-head"><div><h2 id="code-title">Код персонажа</h2><p>Весь персонаж в одной строке. Сохрани её или отправь мастеру — ничего не хранится на сервере.</p></div><button type="button" class="modal-x" data-m="close" aria-label="Закрыть">×</button></div>
      <div class="stack-sm" style="gap:8px"><div class="code-box" id="code-box" role="textbox" aria-readonly="true" aria-label="Код" tabindex="0">${esc(code)}</div><div><button type="button" class="btn primary" data-m="code">Скопировать код</button></div></div>
      <div class="modal-link"><div class="qr" id="qr-slot">QR…</div><div><span style="font-size:14px;font-weight:700">Ссылка на лист</span><code>${esc(link)}</code><div><button type="button" class="btn sm" data-m="link">Скопировать ссылку</button></div></div></div></div>`;
    document.body.appendChild(bg);
    const close = () => { bg.remove(); document.removeEventListener('keydown', onEsc); if (prevFocus) prevFocus.focus(); };
    const onEsc = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onEsc);
    bg.querySelector('[data-m="code"]').focus();
    bg.addEventListener('click', async (e) => {
      const m = e.target.closest('[data-m]'); const k = m && m.dataset.m;
      if (e.target === bg || k === 'close') close();
      if (k === 'code') DND.toast((await DND.copy(code)) ? '✓ Код скопирован' : 'Выдели и скопируй вручную');
      if (k === 'link') DND.toast((await DND.copy(link)) ? '✓ Ссылка скопирована' : 'Не удалось');
    });
    const put = (u) => { const s = bg.querySelector('#qr-slot'); if (s) s.innerHTML = u ? `<img src="${u}" alt="QR-код ссылки на лист">` : 'QR недоступен без интернета'; };
    if (qrImg) put(/src="([^"]+)"/.exec(qrImg)[1]); else qrDataUrl(link).then(put);
  }

  /* ───── Взаимодействие с экранным листом ───── */
  function renderMobile() {
    const y = window.scrollY;
    const open = Array.from(document.querySelectorAll('#mobile details[open] > summary .nm b')).map((b) => b.textContent);
    document.getElementById('mobile').innerHTML = mobile(false);
    if (open.length) document.querySelectorAll('#mobile details > summary .nm b').forEach((b) => { if (open.includes(b.textContent)) b.closest('details').open = true; });
    window.scrollTo(0, y);
  }
  function onMobileClick(e) {
    const t = e.target;
    const hdo = t.closest('[data-hpdo]');
    if (hdo) {
      const n = Math.max(0, parseInt(document.getElementById('hp-amt').value, 10) || 0); if (!n) return;
      if (hdo.dataset.hpdo === 'dmg') { const fromTemp = Math.min(play.temp, n); play.temp -= fromTemp; play.hp = Math.max(0, play.hp - (n - fromTemp)); }
      else play.hp = Math.min(dv.hp.max, play.hp + n);
      savePlay(); renderMobile(); return;
    }
    const an = t.closest('[data-anchor]');
    if (an) { const s = document.getElementById(an.dataset.anchor); if (s) { const top = s.getBoundingClientRect().top + window.scrollY - 124; window.scrollTo({ top: an.dataset.anchor === 's-main' ? 0 : top, behavior: 'smooth' }); } return; }
    const max = dv.hp.max;
    const hp = t.closest('[data-hp]');
    if (hp) {
      const d = +hp.dataset.hp;
      if (d < 0 && play.temp > 0) play.temp--; else play.hp = Math.max(0, Math.min(max, play.hp + d));
      savePlay(); renderMobile(); return;
    }
    const tp = t.closest('[data-temp]'); if (tp) { play.temp = Math.max(0, play.temp + +tp.dataset.temp); savePlay(); renderMobile(); return; }
    const hd = t.closest('[data-hd]');
    if (hd) {
      const i = +hd.dataset.hd;
      if (i < play.hd) { play.hd = i; }
      else {
        play.hd = i + 1;
        DND.toast(`Брось к${dv.cls.hd} ${dv.ab.con.mod >= 0 ? '+' : '−'} ${Math.abs(dv.ab.con.mod)} (Тел) и впиши результат в «+ Лечение»`);
      }
      savePlay(); renderMobile(); return;
    }
    const sl = t.closest('[data-slot]');
    if (sl) { const l = sl.dataset.slot, j = +sl.dataset.j; const used = play.slots[l] || 0; play.slots[l] = j < used ? j : j + 1; savePlay(); renderMobile(); return; }
    const us = t.closest('[data-use]');
    if (us) { e.preventDefault(); const k = us.dataset.use, j = +us.dataset.j; const used = play.uses[k] || 0; play.uses[k] = j < used ? j : j + 1; savePlay(); renderMobile(); return; }
    const rest = t.closest('[data-rest]');
    if (rest) {
      const m = mainBlock();
      if (rest.dataset.rest === 'short') {
        if (m && m.pact) play.slots[m.pact.lvl] = 0;
        dv.features.forEach((f, i) => { if (isShort(f)) play.uses[(f.id || 'f') + ':' + i] = 0; });
        DND.toast('Короткий отдых: восстановлены умения «на короткий отдых»' + (m && m.pact ? ' и ячейки договора' : '') + '. Трать Кости Хитов, чтобы лечиться.');
      } else {
        play.hp = max; play.temp = 0; play.slots = {}; play.uses = {};
        play.hd = Math.max(0, play.hd - Math.max(1, Math.floor(C.level / 2)));
        DND.toast('Продолжительный отдых: хиты, ячейки и умения восстановлены.');
      }
      savePlay(); renderMobile();
    }
  }
  function onMobileKey(e) {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[data-use]')) { e.preventDefault(); e.target.click(); }
  }
  function spyTabs() {
    const ids = ['s-main', 's-skills', 's-attacks', 's-feats', 's-spells', 's-gear', 's-desc'];
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (ticking) return; ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        let curId = 's-main';
        ids.forEach((id) => { const s = document.getElementById(id); if (s && s.getBoundingClientRect().top < 180) curId = id; });
        document.querySelectorAll('[data-anchor]').forEach((b) => b.classList.toggle('is-on', b.dataset.anchor === curId));
      });
    }, { passive: true });
  }

  /* ───── Запуск ───── */
  async function boot() {
    DND.tips.init();
    const h = location.hash;
    const m = /(?:^#|&)c=([^&]+)/.exec(h);
    const want = (/(?:&|#)pdf=(a4|phone)/.exec(h) || [])[1];
    const wantPrint = /(?:&|#)print=1/.test(h);
    try {
      if (m) { code = m[1]; C = await DND.codec.decode(code); }
      else { C = DND.state.loadDraft(); fromDraft = true; code = await DND.codec.encode(C); }
    } catch (e) {
      document.getElementById('mobile').innerHTML = `<section class="sm-intro"><p class="eyebrow">Лист персонажа</p><h1>Не удалось открыть лист</h1><div class="orn"><span>◆</span></div><p class="lead">${esc(e.message)} Проверь, что код скопирован целиком.</p><p><a class="btn primary" href="load.html">Вставить код заново</a></p></section>`;
      document.querySelectorAll('.sheet-bar button').forEach((b) => { b.disabled = true; });
      const tb = document.getElementById('theme'); if (tb) tb.onclick = () => DND.theme.toggle();
      return;
    }
    dv = R.derive(C);
    if (window.FR && FR.config) FR.config.level = C.level;
    DND.state.remember(C, code, /(?:&|#)stol=1/.test(h));
    loadPlay();
    document.title = (C.name || 'Персонаж') + ' — лист персонажа';
    renderMobile();
    const a4el = document.getElementById('a4');
    a4el.innerHTML = a4();
    fitA4(); window.addEventListener('resize', fitA4);
    const qrReady = qrDataUrl(DND.codec.link(code)).then((u) => { if (u) { qrImg = `<img src="${u}" alt="QR-код ссылки на лист">`; a4el.innerHTML = a4(); } });
    const note = [];
    if (fromDraft) note.push('<p class="hint">Показан черновик из этого браузера. Чтобы поделиться, скопируй код персонажа.</p>');
    const hard = dv.warnings.filter((w) => !w.soft);
    if (hard.length) note.push(`<p class="hint">Не всё выбрано (${hard.length}): ${esc(hard.slice(0, 3).map((w) => w.text).join(' '))}${hard.length > 3 ? '…' : ''} <a href="index.html#edit=${code}">Дособрать →</a></p>`);
    document.getElementById('draft-note').innerHTML = note.join('');
    const setView = (v) => {
      document.querySelectorAll('[data-view]').forEach((b) => { b.classList.toggle('is-on', b.dataset.view === v); b.setAttribute('aria-checked', String(b.dataset.view === v)); });
      document.getElementById('mobile').hidden = v !== 'mobile'; a4el.hidden = v !== 'a4';
      U.ls.set('kh-view', v); fitA4();
    };
    setView(U.ls.get('kh-view', window.innerWidth >= 900 ? 'a4' : 'mobile'));
    document.getElementById('mobile').addEventListener('click', onMobileClick);
    document.getElementById('mobile').addEventListener('keydown', onMobileKey);
    spyTabs();
    const doPrint = () => { const v = a4el; const was = v.hidden; v.hidden = false; window.print(); v.hidden = was; };
    document.addEventListener('click', (e) => {
      const b = e.target.closest('[data-do],[data-view]'); if (!b) return;
      if (b.dataset.view) return setView(b.dataset.view);
      const d = b.dataset.do;
      if (d === 'edit') location.href = 'index.html#edit=' + code;
      if (d === 'pdf-a4') pdf('a4');
      if (d === 'pdf-phone') pdf('phone');
      if (d === 'print') doPrint();
      if (d === 'code') codeModal();
    });
    const tb = document.getElementById('theme'); if (tb) tb.onclick = () => DND.theme.toggle();
    if (want || wantPrint) history.replaceState(null, '', location.pathname + '#c=' + code);
    if (want) setTimeout(() => pdf(want), 400);
    if (wantPrint) { setView('a4'); Promise.race([qrReady, new Promise((r) => setTimeout(r, 2500))]).then(() => document.fonts.ready).then(() => setTimeout(doPrint, 300)); }
  }
  document.addEventListener('DOMContentLoaded', boot);
})();
