/* Выгрузка персонажа в Markdown: всё, что есть на листе (числа с разбором, умения с описаниями, заклинания с текстом,
   снаряжение, описание и код для загрузки обратно). Кнопка «Скачать .md» — на шаге «Итог» конструктора.
   Нужны data/*.js, core.js, rules.js; tips.js — по желанию (строка заклинания). */
(function () {
  const D = DND.data, I = DND.idx, U = DND.util, R = DND.rules;
  const sg = U.sgn;
  // ячейка таблицы: без переводов строк и с экранированной чертой
  const cell = (v) => String(v == null || v === '' ? '—' : v).replace(/\|/g, '\\|').replace(/\r?\n+/g, '<br>');
  const table = (head, rows) => rows.length ? `| ${head.join(' | ')} |\n|${head.map(() => '---').join('|')}|\n${rows.map((r) => `| ${r.map(cell).join(' | ')} |`).join('\n')}\n` : '';
  // свободный текст: одиночный перенос строки — жёсткий перенос Markdown (два пробела), пустые строки — абзацы
  const text = (v) => String(v || '').trim().replace(/\r\n/g, '\n').replace(/[ \t]*\n(?!\n)/g, (m, i, s) => s[i - 1] === '\n' ? '\n' : '  \n');
  const ownerLabel = { race: 'Раса', class: 'Класс', subclass: 'Подкласс', background: 'Предыстория', feat: 'Черта' };

  DND.exportMd = function (C, code) {
    const dv = R.derive(C), i = C.info, ab = dv.ab;
    const out = [];
    const add = (s) => out.push(s == null ? '' : s);
    const sec = (t) => { add(''); add('## ' + t); add(''); };

    /* Шапка */
    const who = [dv.subrace ? dv.subrace.name : dv.race && dv.race.name, dv.cls && (dv.cls.name + ' ' + C.level), dv.sub && dv.sub.name].filter(Boolean).join(' · ');
    const bgV = R.bgVariant(C);
    const bg = dv.bg ? dv.bg.name + (bgV ? ' (' + bgV.name + ')' : '') : '';
    const al = (I.alignments[i.alignment] || {}).name || '';
    const dty = i.deity && I.deities[i.deity];
    const eth = i.ethnicity && (D.ethnicities || []).find((e) => e.id === i.ethnicity);
    add('# ' + (C.name || 'Безымянный герой'));
    add('');
    add('*' + (who || 'Раса и класс не выбраны') + '*');
    add('');
    add(table(['Поле', 'Значение'], [
      ['Игрок', C.player], ['Раса', dv.subrace ? dv.subrace.name : dv.race && dv.race.name], ['Класс', dv.cls && dv.cls.name + ' ' + C.level],
      ['Подкласс', dv.sub && dv.sub.name], ['Предыстория', bg], ['Мировоззрение', al], ['Божество', dty && dty.name],
      ['Народ', eth && eth.name], ['Размер', dv.size], ['Опыт', D.xp ? D.xp[C.level - 1] : '']
    ].filter(([, v]) => v != null && v !== '')));

    /* Боевые числа */
    sec('Основное');
    const speed = [dv.speed.walk + ' фт', dv.speed.swim ? 'плавание ' + dv.speed.swim + ' фт' : '', dv.speed.climb ? 'лазание ' + dv.speed.climb + ' фт' : '', dv.speed.fly ? 'полёт ' + dv.speed.fly + ' фт' : ''].filter(Boolean).join(', ');
    add(table(['КД', 'Хиты', 'Кости Хитов', 'Инициатива', 'Скорость', 'Бонус мастерства'],
      [[dv.ac.value, dv.hp.max || '—', dv.hp.hd, sg(dv.init), speed, sg(dv.prof)]]));
    add('- **КД ' + dv.ac.value + '** — ' + (dv.ac.parts || []).map(([v, w]) => v + ' ' + w).join(', ') + (dv.ac.notes.length ? ' (' + dv.ac.notes.join('; ') + ')' : ''));
    if (dv.cls) add('- **Хиты** — 1 уровень: ' + dv.cls.hd + ' + мод. Телосложения' + (C.level > 1 ? '; далее ' + (C.opt.hp === 'roll' ? 'броски к' + dv.cls.hd : 'среднее ' + (dv.cls.hd / 2 + 1)) + ' + мод. Телосложения за уровень' : ''));
    add('- **Пассивная Внимательность** ' + dv.passive.perception + ' · **Пассивный Анализ** ' + dv.passive.investigation + ' · **Пассивная Проницательность** ' + dv.passive.insight);

    /* Характеристики */
    sec('Характеристики');
    add(table(['Характеристика', 'Значение', 'Мод.', 'Спасбросок', 'Откуда значение'], R.ABILS.map((a) => {
      const x = ab[a], s = dv.saves.find((y) => y.id === a);
      const from = x.total == null ? 'не распределено' : [String(x.base)].concat((x.src || []).map((p) => sg(p.n) + ' ' + p.why)).join(', ');
      return [I.abilName(a), x.total == null ? '—' : x.total, x.total == null ? '—' : sg(x.mod), sg(s.total) + (s.prof ? ' ●' : ''), from];
    })));
    add('● — владение спасброском.');

    /* Навыки */
    sec('Навыки');
    add(table(['Навык', 'Хар.', 'Бонус', 'Владение'], dv.skills.map((s) =>
      [s.name, I.abilShort(s.abil), sg(s.total), s.exp ? 'компетентность' : s.prof ? 'владение' : s.jack ? 'Мастер на все руки' : ''])));

    /* Атаки */
    if (dv.attacks.length) {
      sec('Атаки');
      add(table(['Название', 'Бонус / Сл', 'Урон', 'Вид урона', 'Примечания'], dv.attacks.map((a) => [a.name, a.hit, a.dmg, a.dt, a.notes])));
    }

    /* Владения */
    sec('Владения и особенности тела');
    const P = dv.profs;
    [['Доспехи', P.armor], ['Оружие', P.weapons], ['Инструменты', P.tools], ['Языки', P.languages], ['Чувства', dv.senses], ['Сопротивление', dv.resist], ['Иммунитет', dv.immune]]
      .forEach(([k, v]) => { if (v && v.length) add('- **' + k + '.** ' + v.join(', ')); else if (k !== 'Чувства' && k !== 'Сопротивление' && k !== 'Иммунитет') add('- **' + k + '.** —'); });

    /* Умения */
    if (dv.features.length) {
      sec('Умения и особенности');
      dv.features.forEach((f) => {
        const from = [(f.owner && f.owner.name) || ownerLabel[f.kind] || '', f.level ? f.level + ' ур.' : ''].filter(Boolean).join(' · ');
        add('### ' + f.name);
        add('');
        const meta = [from, f.uses].filter(Boolean).join(' · ');
        if (meta) { add('*' + meta + '*'); add(''); }
        if (f.desc) { add(text(f.desc)); add(''); }
        (f.picks || []).forEach((p) => add('- **' + p.name + '**' + (p.desc ? ' — ' + text(p.desc).replace(/\n+/g, ' ') : '')));
        if ((f.picks || []).length) add('');
      });
    }

    /* Заклинания */
    if (dv.casting.has) {
      sec('Заклинания');
      dv.casting.blocks.forEach((b) => {
        add('- **' + b.name + '** — базовая характеристика ' + I.abilName(b.abil) + ', Сл спасброска ' + b.dc + ', бонус атаки ' + b.atk);
        if (b.pact) add('  - Ячейки договора: ' + b.pact.n + ' × ' + b.pact.lvl + ' круг (восстанавливаются после короткого отдыха)');
        else if (b.slots && b.slots.some(Boolean)) add('  - Ячейки: ' + b.slots.map((n, k) => n ? (k + 1) + ' круг — ' + n : '').filter(Boolean).join(', ') + ' (восстанавливаются после продолжительного отдыха)');
      });
      const by = {};
      dv.casting.spells.forEach((s) => (by[s.sp.lvl] = by[s.sp.lvl] || []).push(s));
      Object.keys(by).sort((a, b) => a - b).forEach((l) => {
        add('');
        add('### ' + (+l ? l + ' круг' : 'Заговоры'));
        by[l].forEach((s) => {
          const sp = s.sp;
          add('');
          add('#### ' + sp.name + (sp.conc ? ' (К)' : '') + (sp.ritual ? ' (Р)' : ''));
          add('');
          const tags = (s.tags || []).filter(Boolean);
          add(table(['Школа', 'Время', 'Дистанция', 'Компоненты', 'Длительность'], [[D.schools[sp.school] || sp.school, sp.time, sp.range, sp.comp, sp.dur]]).trimEnd());
          if (tags.length || s.innate) { add(''); add('*' + (tags.length ? tags.join(', ') : 'врождённое') + '*'); }
          if (sp.desc) { add(''); add(text(sp.desc)); }
        });
      });
      add('');
      add('К — концентрация, Р — ритуал.');
    }

    /* Снаряжение */
    sec('Снаряжение');
    if (dv.inv.items.length) dv.inv.items.forEach((x) => add('- ' + x.name + (x.qty > 1 ? ' ×' + x.qty : '') + (x.equipped ? ' *(надето)*' : '') + (x.contents ? ' — ' + x.contents.join(', ') : '')));
    else add('Снаряжения нет.');
    const co = dv.inv.coins;
    add('');
    add('**Монеты:** ' + ([co.gp ? co.gp + ' зм' : '', co.sp ? co.sp + ' см' : '', co.cp ? co.cp + ' мм' : ''].filter(Boolean).join(', ') || '0 зм'));

    /* Описание */
    const look = [['Возраст', i.age], ['Рост', i.height], ['Вес', i.weight], ['Глаза', i.eyes], ['Кожа', i.skin], ['Волосы', i.hair]].filter(([, v]) => v);
    const traits = [['Черты характера', i.traits], ['Идеалы', i.ideals], ['Привязанности', i.bonds], ['Слабости', i.flaws]].filter(([, v]) => text(v));
    if (look.length || i.appearance || (i.portrait && /^https?:/i.test(i.portrait))) {
      sec('Внешность');
      if (i.portrait && /^https?:/i.test(i.portrait)) { add('![Портрет](' + i.portrait + ')'); add(''); }
      if (look.length) add(table(['Признак', 'Значение'], look));
      if (i.appearance) { add(''); add(text(i.appearance)); }
    }
    if (traits.length) {
      sec('Личность');
      traits.forEach(([k, v]) => { add('**' + k + '.** ' + text(v)); add(''); });
    }
    if (dty) { sec('Божество'); add('**' + dty.name + '**' + (dty.title ? ' — ' + dty.title : '') + (dty.symbol ? '. Символ: ' + dty.symbol + '.' : '')); }
    [['Предыстория персонажа', i.backstory], ['Союзники и организации', i.allies], ['Заметки', i.notes]]
      .forEach(([k, v]) => { if (text(v)) { sec(k); add(text(v)); } });

    /* Что ещё не выбрано */
    const hard = dv.warnings.filter((x) => !x.soft), soft = dv.warnings.filter((x) => x.soft);
    if (hard.length || soft.length) {
      sec('Осталось выбрать');
      hard.forEach((x) => add('- ' + x.text));
      soft.forEach((x) => add('- *(по желанию)* ' + x.text));
    }

    add('');
    add('---');
    add('*Кузница героев FirstRoll · D&D 5e (2014) · ' + new Date().toLocaleDateString('ru-RU') + '*');

    /* Код — последней строкой файла, как есть: «1.<код>» */
    if (code) {
      sec('Код персонажа');
      add('Вставь на странице «Загрузить по коду» в Кузнице героев, чтобы открыть персонажа снова' + (DND.codec.link ? ' (или [открой лист](' + DND.codec.link(code) + '))' : '') + '.');
      add('');
      add(code);
    }
    return out.join('\n').replace(/\n{3,}/g, '\n\n') + '\n';
  };

  /* Скачать как файл «Имя.md» */
  DND.downloadMd = function (C, code) {
    const md = DND.exportMd(C, code);
    const name = (String(C.name || '').trim() || 'Персонаж').replace(/[\\/:*?"<>|\x00-\x1f]+/g, '_').slice(0, 80) + '.md';
    const url = URL.createObjectURL(new Blob([md], { type: 'text/markdown;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return name;
  };
})();
