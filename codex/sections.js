/* Кодекс · разделы сайта (макет Claude Design «Раздел кодекса»): что в каком разделе и в какой группе.
   Группа — { t: заголовок, s: короткое имя для чипа, ids: [...ключи 'вид:id' в нужном порядке] } или { t, s, test: (атом) => bool }.
   Статья попадает в первый раздел и первую группу, куда подходит. Не попавшие правила уходят в «Другое» своего раздела.
   Новая статья с новым тегом — достаточно, чтобы она подошла под test; ручной порядок — в ids. */
(function () {
  const FR = window.FR = window.FR || {};
  const R = (...ids) => ids.map((i) => i.includes(':') ? i : 'rule:' + i);
  const tag = (a, t) => (a.tags || []).includes(t);
  const hb = (a) => /^hb:/.test(a.id);   // хоумбрю наших кампаний (codex/data/homebrew, tools/homebrew.js)

  FR.codexSections = [
    { key: 'start', icon: 'guide', title: 'Первые шаги', text: 'Как играть, если ни разу не пробовал', external: 'start', count: (C) => C.byKind('guide').length, unit: ['глава', 'главы', 'глав'] },

    { key: 'rules', icon: 'rule', title: 'Правила', text: 'Проверки, спасброски, отдых, зрение и свет', view: 'list', search: 'Искать в правилах',
      intro: 'Как устроена игра: бросок к20, проверки, характеристики, путешествия и отдых. Бой и магия — в своих разделах.',
      groups: [
        { t: 'Основа: бросок к20', s: 'Основа', ids: R('how-to-play', 'dice', 'd20', 'advantage', 'dc', 'natural-rolls', 'specific-general', 'rounding') },
        { t: 'Проверки и спасброски', s: 'Проверки', ids: R('ability-check', 'saving-throw', 'skills', 'passive-check', 'contest', 'group-check', 'working-together', 'hiding') },
        { t: 'Персонаж', s: 'Персонаж', ids: R('ability-scores', 'modifier', 'generating-scores', 'proficiency', 'proficiencies', 'expertise', 'inspiration', 'experience', 'carrying-capacity') },
        { t: 'Приключения и мир', s: 'Приключения', ids: R('time', 'travel-pace', 'marching-order', 'travel-activities', 'difficult-terrain', 'climbing-swimming', 'jumping', 'falling', 'suffocating', 'vision-light', 'obscured', 'darkvision', 'blindsight', 'truesight', 'food-water', 'objects', 'social-interaction') },
        { t: 'Отдых и здоровье', s: 'Отдых', ids: R('hit-points', 'hit-dice', 'short-rest', 'long-rest') },
        { t: 'Ловушки, болезни и опасности', s: 'Опасности', test: (a) => a.kind === 'hazard' && !hb(a) },
        { t: 'Другое', s: 'Другое', test: (a) => a.kind === 'rule' && !tag(a, 'бой') && !tag(a, 'магия') }
      ] },

    { key: 'combat', icon: 'prop', title: 'Бой', text: 'Ход, действия, атаки, урон и смерть', view: 'list', search: 'Искать в правилах боя',
      intro: 'Как проходит схватка: инициатива, ход, действия, атаки, урон, хиты и спасброски от смерти.',
      groups: [
        { t: 'Порядок боя', s: 'Порядок', ids: R('combat-order', 'surprise', 'initiative', 'round', 'turn', 'bonus-action', 'reaction', 'free-interaction') },
        { t: 'Действия в бою', s: 'Действия', test: (a) => a.kind === 'action' },
        { t: 'Атака', s: 'Атака', ids: R('attack-roll', 'armor-class', 'melee-attack', 'ranged-attack', 'unarmed-strike', 'improvised-weapons', 'opportunity-attack', 'two-weapon-fighting', 'grapple', 'shove') },
        { t: 'Движение и позиция', s: 'Движение', ids: R('speed', 'movement-combat', 'size', 'squeezing', 'cover', 'unseen', 'mounted-combat', 'underwater-combat') },
        { t: 'Урон, хиты и смерть', s: 'Урон и хиты', ids: R('damage-roll', 'resistance', 'healing', 'temporary-hp', 'instant-death', 'death-saves', 'stabilizing', 'knocking-out') },
        { t: 'Виды урона', s: 'Виды урона', test: (a) => a.kind === 'dmg' },
        { t: 'Свойства оружия', s: 'Свойства', test: (a) => a.kind === 'prop' },
        { t: 'Другое', s: 'Другое', test: (a) => a.kind === 'rule' && tag(a, 'бой') && !tag(a, 'магия') }
      ] },

    { key: 'conditions', icon: 'cond', title: 'Состояния', text: 'Отравлен, опутан, ничком — памятка', view: 'memo', print: true, search: 'Искать в состояниях',
      intro: 'Что происходит с персонажем, когда он отравлен, схвачен или без сознания. Памятка на одну страницу — распечатай и положи рядом с листом.',
      heavy: ['paralyzed', 'petrified', 'unconscious'],
      hurtsAttack: ['blinded', 'frightened', 'poisoned', 'prone', 'restrained', 'incapacitated', 'paralyzed', 'stunned'],
      groups: [{ t: 'Состояния', s: 'Все', test: (a) => a.kind === 'cond' }] },

    { key: 'character', icon: 'race', title: 'Персонаж', text: 'Расы, классы, предыстории, черты', view: 'list', search: 'Раса, класс, черта…',
      intro: 'Из чего собирается герой: характеристики и навыки, расы, классы с подклассами, предыстории и черты. Собрать своего — в Кузнице героев.',
      groups: [
        { t: 'Характеристики', s: 'Характеристики', test: (a) => a.kind === 'abil', keep: true },
        { t: 'Навыки', s: 'Навыки', test: (a) => a.kind === 'skill' },
        { t: 'Расы', s: 'Расы', test: (a) => a.kind === 'race' },
        { t: 'Разновидности рас', s: 'Разновидности', test: (a) => a.kind === 'subrace' },
        { t: 'Классы', s: 'Классы', test: (a) => a.kind === 'class' },
        { t: 'Подклассы', s: 'Подклассы', test: (a) => a.kind === 'sub' },
        { t: 'Предыстории', s: 'Предыстории', test: (a) => a.kind === 'bg' },
        { t: 'Черты', s: 'Черты', test: (a) => a.kind === 'feat' },
        { t: 'Языки', s: 'Языки', test: (a) => a.kind === 'lang' },
        { t: 'Мировоззрения', s: 'Мировоззрения', test: (a) => a.kind === 'align', keep: true },
        { t: 'Боги', s: 'Боги', test: (a) => a.kind === 'deity' }
      ],
      /* умения и варианты умений в списке не показываются (к ним ведут статьи классов), но считаются частью раздела */
      owns: (a) => a.kind === 'feature' || a.kind === 'option' },

    { key: 'magic', icon: 'spell', title: 'Магия', text: 'Заклинания, ячейки, концентрация', view: 'list', search: 'Искать в правилах магии',
      intro: 'Как работает магия: ячейки, концентрация, компоненты, дистанция и области. Сами заклинания — в таблице с фильтрами.',
      more: { key: 'spells', title: 'Все заклинания', text: 'Таблица с фильтрами по кругу, школе и классу' },
      groups: [
        { t: 'Как читать заклинание', s: 'Как читать', ids: R('reading-spells', 'spell-level', 'casting-time', 'spell-range', 'components', 'spell-duration', 'spell-targets', 'areas-of-effect', 'schools-of-magic') },
        { t: 'Ячейки и подготовка', s: 'Ячейки', ids: R('spell-slots', 'higher-levels', 'cantrips', 'prepared-spells', 'rituals', 'bonus-action-spells') },
        { t: 'Сложные случаи', s: 'Сложное', ids: R('concentration', 'spell-dc', 'combining-effects', 'armor-casting') },
        { t: 'Другое', s: 'Другое', test: (a) => a.kind === 'rule' && tag(a, 'магия') }
      ] },

    { key: 'spells', icon: 'spell', title: 'Заклинания', parent: 'magic', hidden: true, view: 'spell', search: 'Название заклинания',
      intro: 'Все заклинания из Кузницы героев. Фильтруй по кругу, школе и классу; как накладывать — в разделе «Магия».',
      groups: [{ t: 'Заклинания', s: 'Все', test: (a) => a.kind === 'spell' }] },

    /* Предметы: D&D (этот раздел) и хоумбрю (дочерний). Хоумбрю скрыто от игроков, пока мастер не откроет статью */
    { key: 'equipment', icon: 'item', title: 'Предметы', text: 'Оружие, доспехи, снаряжение, магические предметы', view: 'list', search: 'Искать в предметах',
      intro: 'Предметы мира D&D: оружие, доспехи, снаряжение путешественника, инструменты, яды и магические предметы. Свои предметы наших кампаний — в «Предметах хоумбрю».',
      more: { key: 'items-hb', icon: 'item', title: 'Предметы хоумбрю', text: 'Свои предметы наших кампаний' },
      groups: [
        { t: 'Оружие', s: 'Оружие', test: (a) => a.kind === 'item' && !hb(a) && !a.rarity && tag(a, 'оружие') },
        { t: 'Доспехи и щиты', s: 'Доспехи', test: (a) => a.kind === 'item' && !hb(a) && !a.rarity && tag(a, 'доспехи') },
        { t: 'Магические предметы', s: 'Магические', test: (a) => a.kind === 'item' && !hb(a) && !!a.rarity },
        { t: 'Яды', s: 'Яды', test: (a) => a.kind === 'item' && !hb(a) && a.cat === 'poison' },
        { t: 'Снаряжение', s: 'Снаряжение', test: (a) => a.kind === 'item' && !hb(a) },
        { t: 'Инструменты', s: 'Инструменты', test: (a) => a.kind === 'tool' }
      ] },
    { key: 'items-hb', icon: 'item', title: 'Предметы хоумбрю', parent: 'equipment', hidden: true, view: 'list', hb: true, search: 'Искать в предметах хоумбрю',
      intro: 'Свои предметы наших кампаний. Игроки видят только те, что мастер открыл.',
      groups: [
        { t: 'Магические предметы', s: 'Магические', test: (a) => a.kind === 'item' && hb(a) && !!(a.rarity || (a.mods && a.mods.length) || (a.effects && a.effects.length)) },
        { t: 'Предметы', s: 'Прочие', test: (a) => a.kind === 'item' && hb(a) }
      ] },

    /* Бестиарий: D&D — классический, открыт всем; хоумбрю — монстры, NPC и места наших кампаний (по пометке мастера) */
    { key: 'bestiary', icon: 'mon', title: 'Бестиарий', text: 'Монстры мира D&D со статблоками', view: 'mon', search: 'Имя монстра',
      intro: 'Классический бестиарий D&D 5e: от крыс и гоблинов до тараски. Сортируй по показателю опасности, чтобы собрать бой по силам партии. Свои монстры наших кампаний — в «Бестиарии хоумбрю».',
      more: { key: 'bestiary-hb', icon: 'mon', title: 'Бестиарий хоумбрю', text: 'Монстры, NPC и места наших кампаний' },
      groups: [{ t: 'Монстры', s: 'Все', test: (a) => a.kind === 'mon' && !hb(a) }] },
    { key: 'bestiary-hb', icon: 'mon', title: 'Бестиарий хоумбрю', parent: 'bestiary', hidden: true, view: 'mon', hb: true, search: 'Имя монстра или NPC',
      intro: 'Монстры, NPC и места наших кампаний. Игроки видят только то, что мастер открыл.',
      groups: [{ t: 'Монстры и NPC', s: 'Все', test: (a) => a.kind === 'mon' || a.kind === 'npc' || a.kind === 'loc' }] }
  ];

  /* Частые запросы за столом (главная, поиск, 404) */
  FR.codexPopular = ['rule:advantage', 'cond:poisoned', 'cond:prone', 'rule:cover', 'rule:concentration', 'rule:opportunity-attack', 'rule:death-saves', 'action:hide', 'cond:restrained', 'rule:initiative'];

  /* Названия видов во множественном числе — группы поиска */
  FR.codexPlural = { guide: 'Первые шаги', rule: 'Правила', action: 'Действия', cond: 'Состояния', dmg: 'Виды урона', prop: 'Свойства оружия', abil: 'Характеристики', skill: 'Навыки',
    race: 'Расы', subrace: 'Разновидности рас', class: 'Классы', sub: 'Подклассы', feature: 'Умения классов', option: 'Варианты умений', feat: 'Черты', bg: 'Предыстории',
    spell: 'Заклинания', item: 'Предметы', lang: 'Языки', tool: 'Инструменты', deity: 'Боги', align: 'Мировоззрения', mon: 'Монстры', npc: 'NPC', loc: 'Места', hazard: 'Опасности' };
})();
