/* Расы Фаэруна (редакция 2014). Названия — как в КИ и на dnd.su.
   Механика: asi — фиксированные бонусы; traits[].grants — эффекты; traits[].choices — выборы игрока.
   exotic: true — редкая/необычная раса, лучше согласовать с мастером. */
window.DND = window.DND || {};
DND.data = DND.data || {};

(function () {
  const DV = (ft) => ({ id: 'darkvision', name: ft > 60 ? 'Превосходное тёмное зрение' : 'Тёмное зрение',
    desc: `В темноте в пределах ${ft} фт видишь как при тусклом свете, а тусклый свет — как яркий. Цвета в темноте не различаешь.`, grants: { darkvision: ft } });
  const FEY = { id: 'fey-ancestry', name: 'Наследие фей', desc: 'Преимущество на спасброски от очарования; магия не может тебя усыпить.' };
  const SUN = { id: 'sunlight-sensitivity', name: 'Чувствительность к солнцу', desc: 'На прямом солнечном свету — помеха на броски атаки и проверки Мудрости (Внимательность), основанные на зрении.' };
  const POWERFUL = { id: 'powerful-build', name: 'Мощное телосложение', desc: 'Для грузоподъёмности, толкания и поднятия ты считаешься на размер больше.' };
  const LANG1 = { id: 'lang', type: 'language', count: 1, label: 'Дополнительный язык' };

  DND.data.races = [
    /* ═════════ Книга игрока ═════════ */
    {
      id: 'dwarf', name: 'Дварф', en: 'Dwarf', src: 'PHB', group: 'PHB', size: 'Средний', speed: 25,
      tagline: 'Крепкие мастера камня и стали',
      desc: 'Невысокие, широкоплечие и упрямые. Живут кланами в горных твердынях Севера, чтят предков, помнят обиды веками. Отличные воины и жрецы.',
      asi: { con: 2 }, languages: ['common', 'dwarvish'],
      traits: [
        DV(60),
        { id: 'dwarven-speed', name: 'Скорость дварфов', desc: 'Тяжёлый доспех не снижает твою скорость (25 фт), даже если не хватает Силы.', grants: { heavyNoSlow: true } },
        { id: 'dwarven-resilience', name: 'Дварфийская устойчивость', desc: 'Преимущество на спасброски от яда и сопротивление урону ядом.', grants: { resist: ['poison'] } },
        { id: 'dwarven-combat', name: 'Дварфийская боевая тренировка', desc: 'Владеешь боевым топором, ручным топором, лёгким и боевым молотом.', grants: { weapons: ['battleaxe', 'handaxe', 'light-hammer', 'warhammer'] } },
        { id: 'dwarven-tools', name: 'Владение инструментами', desc: 'Владеешь одним набором: кузнеца, пивовара или каменщика.',
          choices: [{ id: 'tool', type: 'tool', count: 1, from: ['smith', 'brewer', 'mason'], label: 'Инструменты дварфа' }] },
        { id: 'stonecunning', name: 'Знание камня', desc: 'Проверки Истории о каменной кладке — с удвоенным бонусом мастерства.' }
      ],
      subraces: [
        { id: 'dwarf-hill', name: 'Холмовой дварф', en: 'Hill Dwarf', src: 'PHB', asi: { wis: 1 },
          desc: 'Проницательные и выносливые. В Фаэруне — золотые дварфы юга.',
          traits: [{ id: 'dwarven-toughness', name: 'Дварфийская выдержка', desc: 'Максимум хитов +1 за каждый уровень.', grants: { hpPerLevel: 1 } }] },
        { id: 'dwarf-mountain', name: 'Горный дварф', en: 'Mountain Dwarf', src: 'PHB', asi: { str: 2 },
          desc: 'Сильные и привычные к суровой жизни. В Фаэруне — щитовые дварфы Севера.',
          traits: [{ id: 'dwarven-armor', name: 'Владение доспехами дварфов', desc: 'Владеешь лёгкими и средними доспехами.', grants: { armor: ['light', 'medium'] } }] },
        { id: 'dwarf-duergar', name: 'Дуэргар (серый дварф)', en: 'Duergar', src: 'SCAG', asi: { str: 1 },
          desc: 'Мрачные дварфы Подземья, веками бывшие рабами иллитидов. Владеют псионической магией.',
          replaceDarkvision: 120,
          traits: [
            DV(120),
            { id: 'duergar-resilience', name: 'Устойчивость дуэргаров', desc: 'Преимущество на спасброски от иллюзий, очарования и паралича.' },
            { id: 'duergar-magic', name: 'Магия дуэргаров', desc: 'С 3 уровня раз в продолжительный отдых можешь наложить на себя «Увеличение/уменьшение» (только увеличение), с 5 — «Невидимость». Без материальных компонентов; характеристика — Интеллект.',
              grants: { spells: [{ id: 'enlarge-reduce', abil: 'int', minLvl: 3, note: 'только увеличение, 1/прод. отдых' }] } },
            SUN
          ], languages: ['undercommon'] }
      ]
    },
    {
      id: 'elf', name: 'Эльф', en: 'Elf', src: 'PHB', group: 'PHB', size: 'Средний', speed: 30,
      tagline: 'Изящный долгожитель с кровью фей',
      desc: 'Живут столетиями, любят красоту, магию и свободу. В Фаэруне — лунные и солнечные эльфы Эвермита и Кормантора, лесные эльфы, дроу Подземья.',
      asi: { dex: 2 }, languages: ['common', 'elvish'],
      traits: [
        DV(60),
        { id: 'keen-senses', name: 'Обострённые чувства', desc: 'Владеешь навыком Внимательность.', grants: { skills: ['perception'] } },
        FEY,
        { id: 'trance', name: 'Транс', desc: 'Не спишь: 4 часа медитации заменяют 8 часов сна.' }
      ],
      subraces: [
        { id: 'elf-high', name: 'Высший эльф', en: 'High Elf', src: 'PHB', asi: { int: 1 },
          desc: 'Лунные и солнечные эльфы Фаэруна: утончённые, с врождённым даром к магии.',
          traits: [
            { id: 'elf-weapon-training', name: 'Эльфийская боевая тренировка', desc: 'Владеешь длинным и коротким мечом, коротким и длинным луком.', grants: { weapons: ['longsword', 'shortsword', 'shortbow', 'longbow'] } },
            { id: 'high-elf-cantrip', name: 'Заговор', desc: 'Знаешь один заговор волшебника (характеристика — Интеллект).',
              choices: [{ id: 'cantrip', type: 'spell', lvl: 0, lists: ['w'], count: 1, abil: 'int', label: 'Заговор волшебника' }] },
            { id: 'extra-language', name: 'Дополнительный язык', desc: 'Знаешь ещё один язык на выбор.', choices: [LANG1] }
          ] },
        { id: 'elf-wood', name: 'Лесной эльф', en: 'Wood Elf', src: 'PHB', asi: { wis: 1 },
          desc: 'Лесные (медные) эльфы: быстрые, скрытные, живут в чащах Высокого леса.',
          traits: [
            { id: 'elf-weapon-training', name: 'Эльфийская боевая тренировка', desc: 'Владеешь длинным и коротким мечом, коротким и длинным луком.', grants: { weapons: ['longsword', 'shortsword', 'shortbow', 'longbow'] } },
            { id: 'fleet-of-foot', name: 'Быстрые ноги', desc: 'Базовая скорость — 35 фт.', grants: { speed: 35 } },
            { id: 'mask-of-the-wild', name: 'Маскировка в дикой местности', desc: 'Можешь пытаться спрятаться, даже если тебя лишь слегка заслоняют листва, дождь, снег, туман.' }
          ] },
        { id: 'elf-drow', name: 'Тёмный эльф (дроу)', en: 'Drow', src: 'PHB', asi: { cha: 1 },
          desc: 'Изгнанники Подземья, служители Лолс. На поверхности им не доверяют — отличный повод для драмы.',
          traits: [
            DV(120), SUN,
            { id: 'drow-magic', name: 'Магия дроу', desc: 'Знаешь «Пляшущие огоньки». С 3 уровня раз в продолжительный отдых — «Огонь фей», с 5 — «Тьма». Характеристика — Харизма.',
              grants: { spells: [{ id: 'dancing-lights', abil: 'cha' }, { id: 'faerie-fire', abil: 'cha', minLvl: 3, note: '1/прод. отдых' }] } },
            { id: 'drow-weapons', name: 'Владение оружием дроу', desc: 'Владеешь рапирой, коротким мечом и ручным арбалетом.', grants: { weapons: ['rapier', 'shortsword', 'hand-crossbow'] } }
          ] },
        { id: 'elf-eladrin', name: 'Эладрин', en: 'Eladrin', src: 'MTF', asi: { cha: 1 },
          desc: 'Эльфы Страны Фей, чьё настроение меняется, как времена года.',
          traits: [
            { id: 'fey-step', name: 'Фейский шаг', desc: 'Бонусным действием телепортируешься на 30 фт (1 раз за короткий или продолжительный отдых). С 3 уровня шаг даёт эффект твоего сезона (Сл = 8 + мастерство + Хар).',
              uses: { n: 1, per: 'short' },
              choices: [{ id: 'season', type: 'option', count: 1, label: 'Сезон', options: [
                { id: 'autumn', name: 'Осень', desc: 'После шага до двух существ в 10 фт проходят спасбросок Мудрости или очарованы тобой на 1 минуту.' },
                { id: 'winter', name: 'Зима', desc: 'Перед шагом существо в 5 фт проходит спасбросок Мудрости или испугано до конца твоего следующего хода.' },
                { id: 'spring', name: 'Весна', desc: 'Вместо себя можешь телепортировать союзника в 5 фт.' },
                { id: 'summer', name: 'Лето', desc: 'После шага существа в 5 фт получают урон огнём, равный модификатору Харизмы.' }] }] }
          ] },
        { id: 'elf-sea', name: 'Морской эльф', en: 'Sea Elf', src: 'MTF', asi: { con: 1 },
          desc: 'Эльфы океанских глубин, давно ушедшие под воду. Друзья дельфинов и тюленей.',
          swim: 30, languages: ['primordial'],
          traits: [
            { id: 'sea-elf-training', name: 'Боевая тренировка морских эльфов', desc: 'Владеешь копьём, трезубцем, лёгким арбалетом и сетью.', grants: { weapons: ['spear', 'trident', 'light-crossbow', 'net'] } },
            { id: 'child-of-the-sea', name: 'Дитя моря', desc: 'Скорость плавания 30 фт; дышишь и воздухом, и водой.', grants: { swim: 30 } },
            { id: 'friend-of-the-sea', name: 'Друг моря', desc: 'Простыми образами общаешься со зверями, умеющими плавать.' }
          ] },
        { id: 'elf-shadar-kai', name: 'Шадар-кай', en: 'Shadar-kai', src: 'MTF', asi: { con: 1 },
          desc: 'Эльфы Царства Теней, слуги загадочной Королевы Воронов.',
          traits: [
            { id: 'necrotic-resistance', name: 'Некротическое сопротивление', desc: 'Сопротивление урону некротической энергией.', grants: { resist: ['necrotic'] } },
            { id: 'raven-queen-blessing', name: 'Благословение Королевы Воронов', desc: 'Бонусным действием телепортируешься на 30 фт (1/прод. отдых). С 3 уровня после этого до начала следующего хода у тебя сопротивление всему урону.', uses: { n: 1, per: 'long' } }
          ] }
      ]
    },
    {
      id: 'halfling', name: 'Полурослик', en: 'Halfling', src: 'PHB', group: 'PHB', size: 'Маленький', speed: 25,
      tagline: 'Маленький, удачливый, отважный',
      desc: 'Уютные домоседы, которых иногда тянет к приключениям. Удача сопутствует им в самых безнадёжных ситуациях.',
      asi: { dex: 2 }, languages: ['common', 'halfling'],
      traits: [
        { id: 'lucky', name: 'Везучий', desc: 'Выбросив «1» на к20 при атаке, проверке или спасброске, перебрось кость и используй новый результат.' },
        { id: 'brave', name: 'Храбрый', desc: 'Преимущество на спасброски от испуга.' },
        { id: 'halfling-nimbleness', name: 'Проворство полуросликов', desc: 'Можешь проходить через пространство существ крупнее тебя.' }
      ],
      subraces: [
        { id: 'halfling-lightfoot', name: 'Легконогий', en: 'Lightfoot', src: 'PHB', asi: { cha: 1 },
          desc: 'Самые распространённые полурослики Фаэруна: общительные странники.',
          traits: [{ id: 'naturally-stealthy', name: 'Естественная скрытность', desc: 'Можешь прятаться за существом, которое хотя бы на размер больше тебя.' }] },
        { id: 'halfling-stout', name: 'Коренастый', en: 'Stout', src: 'PHB', asi: { con: 1 },
          desc: 'Сильные сердцем (в Фаэруне — «сильносердые»), говорят, в них течёт дварфийская кровь.',
          traits: [{ id: 'stout-resilience', name: 'Устойчивость коренастых', desc: 'Преимущество на спасброски от яда и сопротивление урону ядом.', grants: { resist: ['poison'] } }] },
        { id: 'halfling-ghostwise', name: 'Призрачный полурослик', en: 'Ghostwise', src: 'SCAG', asi: { wis: 1 },
          desc: 'Замкнутые лесные кланы, общающиеся мыслями.',
          traits: [{ id: 'silent-speech', name: 'Безмолвная речь', desc: 'Телепатически говоришь с существом в 30 фт, знающим хотя бы один язык.' }] }
      ]
    },
    {
      id: 'human', name: 'Человек', en: 'Human', src: 'PHB', group: 'PHB', size: 'Средний', speed: 30,
      tagline: 'Самые разные и амбициозные',
      desc: 'Люди живут недолго и потому спешат: строят империи, торгуют, воюют. Фаэрун полон их народов — от калишитов юга до иллусканцев Севера.',
      languages: ['common'],
      traits: [],
      subraces: [
        { id: 'human-standard', name: 'Человек', en: 'Human', src: 'PHB', asi: { str: 1, dex: 1, con: 1, int: 1, wis: 1, cha: 1 },
          desc: 'Классический человек: +1 ко всем характеристикам.',
          traits: [{ id: 'human-lang', name: 'Дополнительный язык', desc: 'Знаешь ещё один язык на выбор.', choices: [LANG1] }] },
        { id: 'human-variant', name: 'Человек (вариант)', en: 'Variant Human', src: 'PHB',
          desc: 'Альтернатива из Книги игрока: меньше бонусов, но навык и черта уже на 1 уровне. Отличный выбор для особенной задумки.',
          traits: [
            { id: 'variant-asi', name: 'Увеличение характеристик', desc: 'Две разные характеристики на выбор получают +1.',
              choices: [{ id: 'asi', type: 'asi', count: 2, amount: 1, label: '+1 к двум характеристикам' }] },
            { id: 'variant-skill', name: 'Навык', desc: 'Владеешь одним навыком на выбор.', choices: [{ id: 'skill', type: 'skill', count: 1, from: 'any', label: 'Навык' }] },
            { id: 'variant-feat', name: 'Черта', desc: 'Получаешь одну черту на выбор.', choices: [{ id: 'feat', type: 'feat', count: 1, label: 'Черта' }] },
            { id: 'human-lang', name: 'Дополнительный язык', desc: 'Знаешь ещё один язык на выбор.', choices: [LANG1] }
          ] }
      ]
    },
    {
      id: 'dragonborn', name: 'Драконорождённый', en: 'Dragonborn', src: 'PHB', group: 'PHB', size: 'Средний', speed: 30,
      tagline: 'Гордый потомок драконов с огненным дыханием',
      desc: 'Высокие чешуйчатые гуманоиды. В Фаэруне многие бежали из павшего Тимантера; ценят честь клана выше жизни.',
      asi: { str: 2, cha: 1 }, languages: ['common', 'draconic'],
      traits: [
        { id: 'draconic-ancestry', name: 'Драконье происхождение', desc: 'Выбери дракона-предка: он определяет вид урона дыхания и сопротивление.',
          choices: [{ id: 'ancestry', type: 'option', count: 1, group: 'dragonAncestry', label: 'Дракон-предок' }] },
        { id: 'breath-weapon', name: 'Оружие дыхания', desc: 'Действием выдыхаешь разрушительную энергию (форма и спасбросок — по предку). Сл = 8 + мод. Телосложения + мастерство; урон 2к6 (половина при успехе). 1 раз за короткий отдых.',
          uses: { n: 1, per: 'short' }, grants: { breath: true } },
        { id: 'damage-resistance', name: 'Сопротивление урону', desc: 'Сопротивление виду урона твоего предка.', grants: { resistFromAncestry: true } }
      ]
    },
    {
      id: 'gnome', name: 'Гном', en: 'Gnome', src: 'PHB', group: 'PHB', size: 'Маленький', speed: 25,
      tagline: 'Любопытный изобретатель и иллюзионист',
      desc: 'Неугомонные, весёлые, увлечённые. Живут долго и тратят жизнь на изобретения, розыгрыши и исследования.',
      asi: { int: 2 }, languages: ['common', 'gnomish'],
      traits: [
        DV(60),
        { id: 'gnome-cunning', name: 'Гномья хитрость', desc: 'Преимущество на спасброски Интеллекта, Мудрости и Харизмы против магии.' }
      ],
      subraces: [
        { id: 'gnome-forest', name: 'Лесной гном', en: 'Forest Gnome', src: 'PHB', asi: { dex: 1 },
          desc: 'Скрытные обитатели лесов, прирождённые иллюзионисты.',
          traits: [
            { id: 'natural-illusionist', name: 'Природный иллюзионист', desc: 'Знаешь заговор «Малая иллюзия» (характеристика — Интеллект).', grants: { spells: [{ id: 'minor-illusion', abil: 'int' }] } },
            { id: 'speak-small-beasts', name: 'Общение с маленькими зверями', desc: 'Простыми звуками и жестами объясняешься с маленькими зверями.' }
          ] },
        { id: 'gnome-rock', name: 'Скальный гном', en: 'Rock Gnome', src: 'PHB', asi: { con: 1 },
          desc: 'Изобретатели и мастера механических игрушек.',
          traits: [
            { id: 'artificers-lore', name: 'Знание ремесленника', desc: 'Проверки Истории о магических, алхимических и технических предметах — с удвоенным бонусом мастерства.' },
            { id: 'tinker', name: 'Жестянщик', desc: 'Владеешь инструментами жестянщика; можешь собирать крошечные механизмы (игрушка, огниво, музыкальная шкатулка).', grants: { tools: ['tinker'] } }
          ] },
        { id: 'gnome-deep', name: 'Глубинный гном (свирфнеблин)', en: 'Deep Gnome', src: 'SCAG', asi: { dex: 1 },
          desc: 'Серокожие гномы Подземья, осторожные и молчаливые.',
          replaceDarkvision: 120, languages: ['undercommon'],
          traits: [
            DV(120),
            { id: 'stone-camouflage', name: 'Каменный камуфляж', desc: 'Преимущество на проверки Скрытности, когда прячешься на каменистой местности.' }
          ] }
      ]
    },
    {
      id: 'half-elf', name: 'Полуэльф', en: 'Half-Elf', src: 'PHB', group: 'PHB', size: 'Средний', speed: 30,
      tagline: 'Свой среди чужих, чужой среди своих',
      desc: 'Дети двух миров — харизматичные дипломаты и вечные странники. На Побережье Мечей полуэльфов очень много.',
      asi: { cha: 2 }, languages: ['common', 'elvish'],
      traits: [
        { id: 'half-elf-asi', name: 'Увеличение характеристик', desc: 'Харизма +2 и ещё две другие характеристики на выбор +1.',
          choices: [{ id: 'asi', type: 'asi', count: 2, amount: 1, exclude: ['cha'], label: '+1 к двум характеристикам (не Хар)' }] },
        DV(60), FEY,
        { id: 'half-elf-heritage', name: 'Наследие', desc: 'По умолчанию — Универсальность навыков (2 навыка). «Побережье Мечей» разрешает взамен взять черту эльфийского родителя.',
          choices: [{ id: 'heritage', type: 'option', count: 1, def: 'skill-versatility', label: 'Наследие', options: [
            { id: 'skill-versatility', name: 'Универсальность навыков', src: 'PHB', desc: 'Владеешь двумя навыками на выбор.', choices: [{ id: 'skills', type: 'skill', count: 2, from: 'any', label: '2 навыка' }] },
            { id: 'elf-weapon-training', name: 'Эльфийская боевая тренировка', src: 'SCAG', desc: 'Лунный/солнечный или лесной родитель: длинный и короткий меч, короткий и длинный лук.', grants: { weapons: ['longsword', 'shortsword', 'shortbow', 'longbow'] } },
            { id: 'high-cantrip', name: 'Заговор высших эльфов', src: 'SCAG', desc: 'Лунный или солнечный родитель: один заговор волшебника (Инт).', choices: [{ id: 'cantrip', type: 'spell', lvl: 0, lists: ['w'], count: 1, abil: 'int', label: 'Заговор волшебника' }] },
            { id: 'fleet', name: 'Быстрые ноги', src: 'SCAG', desc: 'Лесной родитель: скорость 35 фт.', grants: { speed: 35 } },
            { id: 'mask', name: 'Маскировка в дикой местности', src: 'SCAG', desc: 'Лесной родитель: прятаться можно даже за листвой, дождём, туманом.' },
            { id: 'drow-magic', name: 'Магия дроу', src: 'SCAG', desc: 'Родитель-дроу: «Пляшущие огоньки», с 3 уровня «Огонь фей» 1/прод. отдых (Хар).', grants: { spells: [{ id: 'dancing-lights', abil: 'cha' }, { id: 'faerie-fire', abil: 'cha', minLvl: 3, note: '1/прод. отдых' }] } },
            { id: 'swim', name: 'Плавание', src: 'SCAG', desc: 'Родитель — морской эльф: скорость плавания 30 фт.', grants: { swim: 30 } }] }] },
        { id: 'half-elf-lang', name: 'Дополнительный язык', desc: 'Знаешь ещё один язык на выбор.', choices: [LANG1] }
      ]
    },
    {
      id: 'half-orc', name: 'Полуорк', en: 'Half-Orc', src: 'PHB', group: 'PHB', size: 'Средний', speed: 30,
      tagline: 'Сила, ярость и упрямство',
      desc: 'Сильные, грозные и часто непонятые. Живут и среди орков, и в людских городах, где приходится доказывать, что ты не чудовище.',
      asi: { str: 2, con: 1 }, languages: ['common', 'orc'],
      traits: [
        DV(60),
        { id: 'menacing', name: 'Угрожающий вид', desc: 'Владеешь навыком Запугивание.', grants: { skills: ['intimidation'] } },
        { id: 'relentless-endurance', name: 'Непоколебимая стойкость', desc: 'Если хиты падают до 0, но ты не убит сразу, остаёшься с 1 хитом. 1 раз за продолжительный отдых.', uses: { n: 1, per: 'long' } },
        { id: 'savage-attacks', name: 'Свирепые атаки', desc: 'При критическом попадании оружием ближнего боя бросаешь ещё одну кость урона оружия.' }
      ]
    },
    {
      id: 'tiefling', name: 'Тифлинг', en: 'Tiefling', src: 'PHB', group: 'PHB', size: 'Средний', speed: 30,
      tagline: 'Наследник адской крови',
      desc: 'Рога, хвост и глаза без зрачков — следы древнего договора с Преисподней. Им редко доверяют, и они привыкли полагаться на себя.',
      languages: ['common', 'infernal'],
      traits: [
        DV(60),
        { id: 'hellish-resistance', name: 'Адское сопротивление', desc: 'Сопротивление урону огнём.', grants: { resist: ['fire'] } }
      ],
      subraces: [
        { id: 'tiefling-asmodeus', name: 'Тифлинг (Асмодей)', en: 'Tiefling (Asmodeus)', src: 'PHB', asi: { int: 1, cha: 2 },
          desc: 'Классический тифлинг из Книги игрока. «Побережье Мечей» даёт варианты внешности и наследия.',
          traits: [
            { id: 'infernal-legacy', name: 'Дьявольское наследие', desc: 'Выбери вариант наследия (по умолчанию — из Книги игрока).',
              choices: [{ id: 'legacy', type: 'option', count: 1, def: 'infernal', label: 'Наследие', options: [
                { id: 'infernal', name: 'Дьявольское наследие', src: 'PHB', desc: '«Чудотворство»; с 3 уровня — «Адское возмездие» 2 круга 1/прод. отдых (Хар).', grants: { spells: [{ id: 'thaumaturgy', abil: 'cha' }, { id: 'hellish-rebuke', abil: 'cha', minLvl: 3, note: 'как 2 круг, 1/прод. отдых' }] } },
                { id: 'devils-tongue', name: 'Язык дьявола', src: 'SCAG', desc: '«Злая насмешка»; с 3 уровня — «Очарование личности» 2 круга 1/прод. отдых (Хар).', grants: { spells: [{ id: 'vicious-mockery', abil: 'cha' }, { id: 'charm-person', abil: 'cha', minLvl: 3, note: 'как 2 круг, 1/прод. отдых' }] } },
                { id: 'hellfire', name: 'Адский огонь', src: 'SCAG', desc: '«Чудотворство»; с 3 уровня — «Огненные ладони» 2 круга 1/прод. отдых (Хар).', grants: { spells: [{ id: 'thaumaturgy', abil: 'cha' }, { id: 'burning-hands', abil: 'cha', minLvl: 3, note: 'как 2 круг, 1/прод. отдых' }] } },
                { id: 'winged', name: 'Крылатый', src: 'SCAG', desc: 'Вместо заклинаний — перепончатые крылья: скорость полёта 30 фт.', grants: { fly: 30 } }] }] },
            { id: 'feral', name: 'Внешность', desc: 'Вариант «Дикий тифлинг» меняет бонусы: Ловкость +2, Интеллект +1 вместо Инт +1, Хар +2.',
              choices: [{ id: 'appearance', type: 'option', count: 1, def: 'standard', label: 'Внешность', options: [
                { id: 'standard', name: 'Обычная', src: 'PHB', desc: 'Инт +1, Хар +2.' },
                { id: 'feral', name: 'Дикий тифлинг', src: 'SCAG', desc: 'Лов +2, Инт +1 вместо стандартных бонусов.', grants: { asiReplace: { dex: 2, int: 1 } } }] }] }
          ] },
        { id: 'tiefling-baalzebul', name: 'Тифлинг Баалзебула', en: 'Baalzebul', src: 'MTF', asi: { int: 1, cha: 2 },
          desc: 'Потомки Повелителя Мух: порча и лживые обещания.',
          traits: [{ id: 'legacy-maladomini', name: 'Наследие Маладомини', desc: '«Чудотворство»; с 3 уровня — «Луч болезни» 2 круга 1/прод. отдых (Хар).', grants: { spells: [{ id: 'thaumaturgy', abil: 'cha' }, { id: 'ray-of-sickness', abil: 'cha', minLvl: 3, note: 'как 2 круг, 1/прод. отдых' }] } }] },
        { id: 'tiefling-dispater', name: 'Тифлинг Диспатера', en: 'Dispater', src: 'MTF', asi: { dex: 1, cha: 2 },
          desc: 'Потомки параноидального владыки Дита — шпионы и тайные агенты.',
          traits: [{ id: 'legacy-dis', name: 'Наследие Дита', desc: '«Чудотворство»; с 3 уровня — «Маскировка» 1/прод. отдых (Хар).', grants: { spells: [{ id: 'thaumaturgy', abil: 'cha' }, { id: 'disguise-self', abil: 'cha', minLvl: 3, note: '1/прод. отдых' }] } }] },
        { id: 'tiefling-fierna', name: 'Тифлинг Фиерны', en: 'Fierna', src: 'MTF', asi: { wis: 1, cha: 2 },
          desc: 'Потомки владычицы Флегетоса — обаятельные манипуляторы.',
          traits: [{ id: 'legacy-phlegethos', name: 'Наследие Флегетоса', desc: '«Дружба»; с 3 уровня — «Очарование личности» 2 круга 1/прод. отдых (Хар).', grants: { spells: [{ id: 'friends', abil: 'cha' }, { id: 'charm-person', abil: 'cha', minLvl: 3, note: 'как 2 круг, 1/прод. отдых' }] } }] },
        { id: 'tiefling-glasya', name: 'Тифлинг Глазии', en: 'Glasya', src: 'MTF', asi: { dex: 1, cha: 2 },
          desc: 'Потомки покровительницы преступников — воры и авантюристы.',
          traits: [{ id: 'legacy-malbolge', name: 'Наследие Малболджа', desc: '«Малая иллюзия»; с 3 уровня — «Маскировка» 1/прод. отдых (Хар).', grants: { spells: [{ id: 'minor-illusion', abil: 'cha' }, { id: 'disguise-self', abil: 'cha', minLvl: 3, note: '1/прод. отдых' }] } }] },
        { id: 'tiefling-levistus', name: 'Тифлинг Левистуса', en: 'Levistus', src: 'MTF', asi: { con: 1, cha: 2 },
          desc: 'Потомки узника ледяной Стигии — холодные и терпеливые.',
          traits: [{ id: 'legacy-stygia', name: 'Наследие Стигии', desc: '«Луч холода»; с 3 уровня — «Доспех Агатиса» 2 круга 1/прод. отдых (Хар).', grants: { spells: [{ id: 'ray-of-frost', abil: 'cha' }, { id: 'armor-of-agathys', abil: 'cha', minLvl: 3, note: 'как 2 круг, 1/прод. отдых' }] } }] },
        { id: 'tiefling-mammon', name: 'Тифлинг Маммона', en: 'Mammon', src: 'MTF', asi: { int: 1, cha: 2 },
          desc: 'Потомки алчного владыки Минаурос — торговцы и ростовщики.',
          traits: [{ id: 'legacy-minauros', name: 'Наследие Минаурос', desc: '«Волшебная рука»; с 3 уровня — «Тензеров парящий диск» 1/прод. отдых (Хар).', grants: { spells: [{ id: 'mage-hand', abil: 'cha' }, { id: 'tensers-floating-disk', abil: 'cha', minLvl: 3, note: '1/прод. отдых' }] } }] },
        { id: 'tiefling-mephistopheles', name: 'Тифлинг Мефистофеля', en: 'Mephistopheles', src: 'MTF', asi: { int: 1, cha: 2 },
          desc: 'Потомки архидьявола-чародея Кании — прирождённые маги.',
          traits: [{ id: 'legacy-cania', name: 'Наследие Кании', desc: '«Волшебная рука»; с 3 уровня — «Огненные ладони» 2 круга 1/прод. отдых (Хар).', grants: { spells: [{ id: 'mage-hand', abil: 'cha' }, { id: 'burning-hands', abil: 'cha', minLvl: 3, note: 'как 2 круг, 1/прод. отдых' }] } }] },
        { id: 'tiefling-zariel', name: 'Тифлинг Зариэль', en: 'Zariel', src: 'MTF', asi: { str: 1, cha: 2 },
          desc: 'Потомки падшего ангела-воительницы Авернуса — воины.',
          traits: [{ id: 'legacy-avernus', name: 'Наследие Авернуса', desc: '«Чудотворство»; с 3 уровня — «Палящая кара» 2 круга 1/прод. отдых (Хар).', grants: { spells: [{ id: 'thaumaturgy', abil: 'cha' }, { id: 'searing-smite', abil: 'cha', minLvl: 3, note: 'как 2 круг, 1/прод. отдых' }] } }] }
      ]
    },

    /* ═════════ Руководство Воло ═════════ */
    {
      id: 'aasimar', name: 'Аасимар', en: 'Aasimar', src: 'VGM', group: 'VGM', size: 'Средний', speed: 30,
      tagline: 'Смертный с искрой небес',
      desc: 'Люди, отмеченные небожителями: у каждого есть ангел-наставник, являющийся во снах. Не все выдерживают это бремя.',
      asi: { cha: 2 }, languages: ['common', 'celestial'],
      traits: [
        DV(60),
        { id: 'celestial-resistance', name: 'Небесное сопротивление', desc: 'Сопротивление некротической энергии и излучению.', grants: { resist: ['necrotic', 'radiant'] } },
        { id: 'healing-hands', name: 'Исцеляющие руки', desc: 'Действием касанием восстанавливаешь хиты, равные твоему уровню. 1/прод. отдых.', uses: { n: 1, per: 'long' } },
        { id: 'light-bearer', name: 'Несущий свет', desc: 'Знаешь заговор «Свет» (Хар).', grants: { spells: [{ id: 'light', abil: 'cha' }] } }
      ],
      subraces: [
        { id: 'aasimar-protector', name: 'Аасимар-защитник', en: 'Protector', src: 'VGM', asi: { wis: 1 },
          desc: 'Хранители слабых, ведомые светом.',
          traits: [{ id: 'radiant-soul', name: 'Сияющая душа', desc: 'С 3 уровня действием на 1 минуту обретаешь крылья (полёт 30 фт); раз в ход наносишь +урон излучением, равный уровню. 1/прод. отдых.', uses: { n: 1, per: 'long', minLvl: 3 } }] },
        { id: 'aasimar-scourge', name: 'Аасимар-каратель', en: 'Scourge', src: 'VGM', asi: { con: 1 },
          desc: 'Пылающие праведным гневом.',
          traits: [{ id: 'radiant-consumption', name: 'Сияющее поглощение', desc: 'С 3 уровня на 1 минуту излучаешь свет, обжигающий всех вокруг (и тебя) излучением; раз в ход +урон, равный уровню. 1/прод. отдых.', uses: { n: 1, per: 'long', minLvl: 3 } }] },
        { id: 'aasimar-fallen', name: 'Падший аасимар', en: 'Fallen', src: 'VGM', asi: { str: 1 },
          desc: 'Отвернувшиеся от света — или изгнанные им.',
          traits: [{ id: 'necrotic-shroud', name: 'Некротический саван', desc: 'С 3 уровня на 1 минуту являешь ужасный облик (враги рядом пугаются); раз в ход +некротический урон, равный уровню. 1/прод. отдых.', uses: { n: 1, per: 'long', minLvl: 3 } }] }
      ]
    },
    {
      id: 'firbolg', name: 'Фирболг', en: 'Firbolg', src: 'VGM', group: 'VGM', size: 'Средний', speed: 30,
      tagline: 'Кроткий великан-хранитель леса',
      desc: 'Высокие лесные отшельники с кровью великанов. Берегут природу, избегают чужих глаз, не понимают денег и собственности.',
      asi: { wis: 2, str: 1 }, languages: ['common', 'elvish', 'giant'],
      traits: [
        { id: 'firbolg-magic', name: 'Магия фирболгов', desc: '«Обнаружение магии» и «Маскировка» (можно выглядеть на 3 фута ниже) — по разу за короткий отдых (Мдр).',
          grants: { spells: [{ id: 'detect-magic', abil: 'wis', note: '1/кор. отдых' }, { id: 'disguise-self', abil: 'wis', note: '1/кор. отдых' }] } },
        { id: 'hidden-step', name: 'Скрытый шаг', desc: 'Бонусным действием становишься невидимым до следующего хода (или пока не атакуешь). 1/кор. отдых.', uses: { n: 1, per: 'short' } },
        POWERFUL,
        { id: 'speech-of-beast-and-leaf', name: 'Речь зверей и листвы', desc: 'Звери и растения понимают смысл твоих слов; преимущество на проверки Харизмы при влиянии на них.' }
      ]
    },
    {
      id: 'goliath', name: 'Голиаф', en: 'Goliath', src: 'VGM', group: 'VGM', size: 'Средний', speed: 30,
      tagline: 'Горный великан духа',
      desc: 'Серокожие горцы, живущие у вершин Хребта Мира. Соревнуются во всём и ценят только заслуженное.',
      asi: { str: 2, con: 1 }, languages: ['common', 'giant'],
      traits: [
        { id: 'natural-athlete', name: 'Прирождённый атлет', desc: 'Владеешь навыком Атлетика.', grants: { skills: ['athletics'] } },
        { id: 'stones-endurance', name: 'Выносливость камня', desc: 'Реакцией уменьшаешь полученный урон на 1к12 + мод. Телосложения. 1/кор. отдых.', uses: { n: 1, per: 'short' } },
        POWERFUL,
        { id: 'mountain-born', name: 'Рождённый в горах', desc: 'Сопротивление холоду; привычен к высокогорью.', grants: { resist: ['cold'] } }
      ]
    },
    {
      id: 'kenku', name: 'Кенку', en: 'Kenku', src: 'VGM', group: 'VGM', size: 'Средний', speed: 30, exotic: true,
      tagline: 'Бескрылый ворон-подражатель',
      desc: 'Проклятые птицы-гуманоиды, потерявшие крылья и собственный голос. Говорят только чужими звуками — это весело отыгрывать.',
      asi: { dex: 2, wis: 1 }, languages: ['common', 'primordial'],
      traits: [
        { id: 'expert-forgery', name: 'Искусный подделыватель', desc: 'Преимущество на проверки, чтобы скопировать почерк или изделие.' },
        { id: 'kenku-training', name: 'Обучение кенку', desc: 'Владеешь двумя навыками из: Акробатика, Обман, Скрытность, Ловкость рук.',
          choices: [{ id: 'skills', type: 'skill', count: 2, from: ['acrobatics', 'deception', 'stealth', 'sleight'], label: '2 навыка кенку' }] },
        { id: 'mimicry', name: 'Мимикрия', desc: 'Идеально подражаешь услышанным голосам и звукам. Говоришь только чужими голосами (язык — ауран).' }
      ]
    },
    {
      id: 'lizardfolk', name: 'Людоящер', en: 'Lizardfolk', src: 'VGM', group: 'VGM', size: 'Средний', speed: 30, exotic: true,
      tagline: 'Холоднокровный прагматик болот',
      desc: 'Мыслят иначе, чем тёплокровные: без сантиментов, всё — еда, инструмент или угроза. Отличный источник чёрного юмора.',
      asi: { con: 2, wis: 1 }, languages: ['common', 'draconic'], swim: 30,
      traits: [
        { id: 'bite', name: 'Укус', desc: 'Природное оружие: 1к6 + Сил колющего урона.', grants: { natWeapon: { name: 'Укус', dmg: '1к6', dt: 'piercing' } } },
        { id: 'cunning-artisan', name: 'Хитрый ремесленник', desc: 'На коротком отдыхе из костей и шкуры убитого зверя делаешь щит, дубинку, дротики или метательные копья.' },
        { id: 'hold-breath', name: 'Задержка дыхания', desc: 'Не дышишь до 15 минут.' },
        { id: 'hunters-lore', name: 'Знания охотника', desc: 'Владеешь двумя навыками из: Уход за животными, Природа, Внимательность, Скрытность, Выживание.',
          choices: [{ id: 'skills', type: 'skill', count: 2, from: ['animal', 'nature', 'perception', 'stealth', 'survival'], label: '2 навыка охотника' }] },
        { id: 'natural-armor', name: 'Природный доспех', desc: 'Без доспеха твой КД = 13 + мод. Ловкости. Щит можно.', grants: { acAlt: { id: 'lizard', name: 'Чешуя', base: 13, abils: ['dex'], shield: true } } },
        { id: 'hungry-jaws', name: 'Голодная пасть', desc: 'Бонусным действием кусаешь; при попадании получаешь временные хиты, равные мод. Телосложения. 1/кор. отдых.', uses: { n: 1, per: 'short' } },
        { id: 'lizard-swim', name: 'Плавание', desc: 'Скорость плавания 30 фт.', grants: { swim: 30 } }
      ]
    },
    {
      id: 'tabaxi', name: 'Табакси', en: 'Tabaxi', src: 'VGM', group: 'VGM', size: 'Средний', speed: 30,
      tagline: 'Любопытный кот-путешественник',
      desc: 'Кошачий народ из далёкой Мацтики. Одержимы новыми историями, диковинками и тайнами, но быстро остывают.',
      asi: { dex: 2, cha: 1 }, languages: ['common'],
      traits: [
        DV(60),
        { id: 'feline-agility', name: 'Кошачья ловкость', desc: 'Можешь удвоить скорость до конца хода; снова — после хода, в котором не двигался.' },
        { id: 'cats-claws', name: 'Кошачьи когти', desc: 'Скорость лазания 20 фт; когти — оружие 1к4 рубящего урона.', grants: { climb: 20, natWeapon: { name: 'Когти', dmg: '1к4', dt: 'slashing' } } },
        { id: 'cats-talent', name: 'Кошачий талант', desc: 'Владеешь навыками Внимательность и Скрытность.', grants: { skills: ['perception', 'stealth'] } },
        { id: 'tabaxi-lang', name: 'Дополнительный язык', desc: 'Знаешь ещё один язык на выбор.', choices: [LANG1] }
      ]
    },
    {
      id: 'triton', name: 'Тритон', en: 'Triton', src: 'VGM', group: 'VGM', size: 'Средний', speed: 30,
      tagline: 'Гордый страж морских глубин',
      desc: 'Хранители океана с Плана Воды. Благородны, немного высокомерны и наивны в делах сухопутных.',
      asi: { str: 1, con: 1, cha: 1 }, languages: ['common', 'primordial'], swim: 30,
      traits: [
        { id: 'amphibious', name: 'Земноводный', desc: 'Дышишь воздухом и водой; скорость плавания 30 фт.', grants: { swim: 30 } },
        { id: 'control-air-water', name: 'Управление воздухом и водой', desc: '«Туманное облако» 1/прод. отдых; с 3 уровня — «Порыв ветра» 1/прод. отдых (Хар).',
          grants: { spells: [{ id: 'fog-cloud', abil: 'cha', note: '1/прод. отдых' }, { id: 'gust-of-wind', abil: 'cha', minLvl: 3, note: '1/прод. отдых' }] } },
        { id: 'emissary-of-the-sea', name: 'Посланник моря', desc: 'Простыми образами общаешься со зверями, дышащими водой.' },
        { id: 'guardians-of-the-depths', name: 'Страж глубин', desc: 'Сопротивление холоду; не страдаешь от глубоководного давления.', grants: { resist: ['cold'] } }
      ]
    },
    {
      id: 'bugbear', name: 'Багбир', en: 'Bugbear', src: 'VGM', group: 'VGM', size: 'Средний', speed: 30,
      tagline: 'Здоровенный лохматый засадник',
      desc: 'Самые крупные гоблиноиды: ленивы, пока нет добычи, и смертельно тихи, когда она есть.',
      asi: { str: 2, dex: 1 }, languages: ['common', 'goblin'],
      traits: [
        DV(60),
        { id: 'long-limbed', name: 'Длинные конечности', desc: 'В свой ход досягаемость твоих рукопашных атак на 5 фт больше.' },
        POWERFUL,
        { id: 'sneaky', name: 'Скрытный', desc: 'Владеешь навыком Скрытность.', grants: { skills: ['stealth'] } },
        { id: 'surprise-attack', name: 'Внезапное нападение', desc: 'Попав в первом раунде боя по застигнутому врасплох существу, наносишь +2к6 урона.' }
      ]
    },
    {
      id: 'goblin', name: 'Гоблин', en: 'Goblin', src: 'VGM', group: 'VGM', size: 'Маленький', speed: 30,
      tagline: 'Мелкий, наглый и живучий',
      desc: 'Трусливые, но изобретательные: выживают там, где другие гибнут. Идеальная раса для приколиста.',
      asi: { dex: 2, con: 1 }, languages: ['common', 'goblin'],
      traits: [
        DV(60),
        { id: 'fury-of-the-small', name: 'Ярость маленьких', desc: 'Раз за короткий отдых, попав по существу крупнее себя, наносишь +урон, равный уровню.', uses: { n: 1, per: 'short' } },
        { id: 'nimble-escape', name: 'Шустрый побег', desc: 'Отход или Засада — бонусным действием в каждый ход.' }
      ]
    },
    {
      id: 'hobgoblin', name: 'Хобгоблин', en: 'Hobgoblin', src: 'VGM', group: 'VGM', size: 'Средний', speed: 30,
      tagline: 'Дисциплинированный солдат',
      desc: 'Военная культура гоблиноидов: порядок, честь легиона и безжалостная эффективность.',
      asi: { con: 2, int: 1 }, languages: ['common', 'goblin'],
      traits: [
        DV(60),
        { id: 'martial-training', name: 'Воинская подготовка', desc: 'Владеешь лёгкими доспехами и двумя видами воинского оружия на выбор.',
          grants: { armor: ['light'] }, choices: [{ id: 'weapons', type: 'weapon', count: 2, from: 'martial', label: '2 вида воинского оружия' }] },
        { id: 'saving-face', name: 'Сохранение лица', desc: 'Раз за короткий отдых после промаха или провала добавь +1 за каждого союзника, которого видишь (не больше +5).', uses: { n: 1, per: 'short' } }
      ]
    },
    {
      id: 'kobold', name: 'Кобольд', en: 'Kobold', src: 'VGM', group: 'VGM', size: 'Маленький', speed: 30,
      tagline: 'Хитрый слуга драконов',
      desc: 'Мелкие ящероподобные создания, мастера ловушек и тоннелей. Поодиночке слабы, в стае опасны.',
      asi: { dex: 2, str: -2 }, languages: ['common', 'draconic'],
      traits: [
        DV(60),
        { id: 'grovel', name: 'Пресмыкательство', desc: 'Действием унижаешься и рыдаешь: союзники в 10 фт атакуют с преимуществом до конца твоего следующего хода. 1/кор. отдых.', uses: { n: 1, per: 'short' } },
        { id: 'pack-tactics', name: 'Тактика стаи', desc: 'Преимущество на атаку, если рядом с целью стоит твой дееспособный союзник.' },
        SUN
      ]
    },
    {
      id: 'orc', name: 'Орк', en: 'Orc', src: 'VGM', group: 'VGM', size: 'Средний', speed: 30,
      tagline: 'Неудержимый натиск',
      desc: 'Дети Груумша: племена Севера, живущие набегами. Орк-приключенец обычно порвал с кланом — или был изгнан.',
      asi: { str: 2, con: 1, int: -2 }, languages: ['common', 'orc'],
      traits: [
        DV(60),
        { id: 'aggressive', name: 'Агрессивный', desc: 'Бонусным действием перемещаешься на свою скорость к видимому врагу.' },
        { id: 'menacing', name: 'Угрожающий вид', desc: 'Владеешь навыком Запугивание.', grants: { skills: ['intimidation'] } },
        POWERFUL
      ]
    },
    {
      id: 'yuan-ti', name: 'Юань-ти', en: 'Yuan-ti Pureblood', src: 'VGM', group: 'VGM', size: 'Средний', speed: 30, exotic: true,
      tagline: 'Змеиная кровь, холодный разум',
      desc: 'Чистокровные юань-ти почти неотличимы от людей. Вышли из змеиных империй юга, где чувства считают слабостью.',
      asi: { cha: 2, int: 1 }, languages: ['common', 'abyssal', 'draconic'],
      traits: [
        DV(60),
        { id: 'innate-spellcasting', name: 'Врождённое колдовство', desc: '«Ядовитые брызги»; «Дружба с животными» — на змей без ограничений; с 3 уровня «Внушение» 1/прод. отдых (Хар).',
          grants: { spells: [{ id: 'poison-spray', abil: 'cha' }, { id: 'animal-friendship', abil: 'cha', note: 'только змеи, без ограничений' }, { id: 'suggestion', abil: 'cha', minLvl: 3, note: '1/прод. отдых' }] } },
        { id: 'magic-resistance', name: 'Сопротивление магии', desc: 'Преимущество на спасброски от заклинаний и магических эффектов.' },
        { id: 'poison-immunity', name: 'Иммунитет к яду', desc: 'Иммунитет к урону ядом и состоянию «отравлен».', grants: { immune: ['poison'] } }
      ]
    },

    /* ═════════ Морденкайнен ═════════ */
    {
      id: 'gith', name: 'Гит', en: 'Gith', src: 'MTF', group: 'MTF', size: 'Средний', speed: 30, exotic: true,
      tagline: 'Бывшие рабы иллитидов с других планов',
      desc: 'Народ, свергнувший свежевателей разума и расколовшийся надвое. В Фаэруне появляются редко — обычно по делу.',
      asi: { int: 1 }, languages: ['common', 'gith'],
      traits: [],
      subraces: [
        { id: 'gith-githyanki', name: 'Гитъянки', en: 'Githyanki', src: 'MTF', asi: { str: 2 },
          desc: 'Воинственные налётчики Астрала, служащие королеве-личу Влаакит.',
          traits: [
            { id: 'decadent-mastery', name: 'Декадентское мастерство', desc: 'Один язык и один навык или инструмент на выбор.',
              choices: [LANG1, { id: 'skillOrTool', type: 'skillOrTool', count: 1, label: 'Навык или инструмент' }] },
            { id: 'martial-prodigy', name: 'Воинский вундеркинд', desc: 'Владеешь лёгкими и средними доспехами, коротким, длинным и двуручным мечом.', grants: { armor: ['light', 'medium'], weapons: ['shortsword', 'longsword', 'greatsword'] } },
            { id: 'githyanki-psionics', name: 'Псионика гитъянки', desc: '«Волшебная рука» (рука невидима); с 3 уровня — «Прыжок» на себя 1/прод. отдых (Инт).',
              grants: { spells: [{ id: 'mage-hand', abil: 'int', note: 'рука невидима' }, { id: 'jump', abil: 'int', minLvl: 3, note: '1/прод. отдых' }] } }
          ] },
        { id: 'gith-githzerai', name: 'Гитцерай', en: 'Githzerai', src: 'MTF', asi: { wis: 2 },
          desc: 'Аскеты-монахи Лимбо, отточившие разум до крепости.',
          traits: [
            { id: 'mental-discipline', name: 'Ментальная дисциплина', desc: 'Преимущество на спасброски от очарования и испуга.' },
            { id: 'githzerai-psionics', name: 'Псионика гитцераев', desc: '«Волшебная рука» (рука невидима); с 3 уровня — «Щит» 1/прод. отдых (Мдр).',
              grants: { spells: [{ id: 'mage-hand', abil: 'wis', note: 'рука невидима' }, { id: 'shield', abil: 'wis', minLvl: 3, note: '1/прод. отдых' }] } }
          ] }
      ]
    },

    /* ═════════ Стихийное зло ═════════ */
    {
      id: 'aarakocra', name: 'Ааракокра', en: 'Aarakocra', src: 'EEPC', group: 'EEPC', size: 'Средний', speed: 25, exotic: true,
      tagline: 'Птичий народ, свободный как ветер',
      desc: 'Крылатые гуманоиды гор. Летают с 1 уровня — это сильно меняет приключение, согласуй с мастером.',
      asi: { dex: 2, wis: 1 }, languages: ['common', 'aarakocra', 'primordial'],
      traits: [
        { id: 'flight', name: 'Полёт', desc: 'Скорость полёта 50 фт. Нельзя летать в среднем или тяжёлом доспехе.', grants: { fly: 50 } },
        { id: 'talons', name: 'Когти', desc: 'Природное оружие: 1к4 + Сил рубящего урона.', grants: { natWeapon: { name: 'Когти', dmg: '1к4', dt: 'slashing' } } }
      ]
    },
    {
      id: 'genasi', name: 'Дженази', en: 'Genasi', src: 'EEPC', group: 'EEPC', size: 'Средний', speed: 30,
      tagline: 'Потомок элементалей',
      desc: 'В их жилах течёт сила стихийных планов — видно по коже, волосам и характеру. В Калимшане их особенно много.',
      asi: { con: 2 }, languages: ['common', 'primordial'],
      traits: [],
      subraces: [
        { id: 'genasi-air', name: 'Дженази воздуха', en: 'Air Genasi', src: 'EEPC', asi: { dex: 1 },
          desc: 'Лёгкие, непоседливые, волосы вечно шевелит ветер.',
          traits: [
            { id: 'unending-breath', name: 'Бесконечное дыхание', desc: 'Можешь не дышать бесконечно долго, если не теряешь сознание.' },
            { id: 'mingle-with-wind', name: 'Слияние с ветром', desc: '«Левитация» 1/прод. отдых (Тел).', grants: { spells: [{ id: 'levitate', abil: 'con', note: '1/прод. отдых' }] } }
          ] },
        { id: 'genasi-earth', name: 'Дженази земли', en: 'Earth Genasi', src: 'EEPC', asi: { str: 1 },
          desc: 'Надёжные и неторопливые, кожа похожа на камень.',
          traits: [
            { id: 'earth-walk', name: 'Хождение по земле', desc: 'Каменистая и земляная труднопроходимая местность не замедляет.' },
            { id: 'merge-with-stone', name: 'Слияние с камнем', desc: '«Бесследное передвижение» 1/прод. отдых (Тел).', grants: { spells: [{ id: 'pass-without-trace', abil: 'con', note: '1/прод. отдых' }] } }
          ] },
        { id: 'genasi-fire', name: 'Дженази огня', en: 'Fire Genasi', src: 'EEPC', asi: { int: 1 },
          desc: 'Вспыльчивые, горячие — буквально.',
          traits: [
            DV(60),
            { id: 'fire-resistance', name: 'Сопротивление огню', desc: 'Сопротивление урону огнём.', grants: { resist: ['fire'] } },
            { id: 'reach-to-the-blaze', name: 'Досягаемость пламени', desc: '«Сотворение пламени»; с 3 уровня — «Огненные ладони» 1/прод. отдых (Тел).', grants: { spells: [{ id: 'produce-flame', abil: 'con' }, { id: 'burning-hands', abil: 'con', minLvl: 3, note: '1/прод. отдых' }] } }
          ] },
        { id: 'genasi-water', name: 'Дженази воды', en: 'Water Genasi', src: 'EEPC', asi: { wis: 1 },
          desc: 'Спокойные и переменчивые, как прилив.',
          traits: [
            { id: 'acid-resistance', name: 'Сопротивление кислоте', desc: 'Сопротивление урону кислотой.', grants: { resist: ['acid'] } },
            { id: 'amphibious', name: 'Земноводный', desc: 'Дышишь воздухом и водой; скорость плавания 30 фт.', grants: { swim: 30 } },
            { id: 'call-to-the-wave', name: 'Зов волны', desc: '«Формирование воды»; с 3 уровня — «Сотворение или уничтожение воды» 2 круга 1/прод. отдых (Тел).', grants: { spells: [{ id: 'shape-water', abil: 'con' }, { id: 'create-destroy-water', abil: 'con', minLvl: 3, note: 'как 2 круг, 1/прод. отдых' }] } }
          ] }
      ]
    },

    /* ═════════ Прочие народы Фаэруна ═════════ */
    {
      id: 'tortle', name: 'Тортл', en: 'Tortle', src: 'TTP', group: 'other', size: 'Средний', speed: 30,
      tagline: 'Добродушный черепаха-странник',
      desc: 'Черепахоподобный народ Чульта. Всю жизнь путешествуют — ведь дом всегда за спиной.',
      asi: { str: 2, wis: 1 }, languages: ['common', 'primordial'],
      traits: [
        { id: 'claws', name: 'Когти', desc: 'Природное оружие: 1к4 + Сил рубящего урона.', grants: { natWeapon: { name: 'Когти', dmg: '1к4', dt: 'slashing' } } },
        { id: 'hold-breath', name: 'Задержка дыхания', desc: 'Не дышишь до 1 часа.' },
        { id: 'natural-armor', name: 'Природный доспех', desc: 'Панцирь: КД 17, Ловкость не добавляется, доспехи надевать нельзя. Щит можно.', grants: { acAlt: { id: 'tortle', name: 'Панцирь', base: 17, abils: [], shield: true, forced: true } } },
        { id: 'shell-defense', name: 'Защита панциря', desc: 'Действием прячешься в панцирь: +4 КД и преимущество на спасброски Сил и Тел, но скорость 0 и помеха на спасброски Лов.' },
        { id: 'survival-instinct', name: 'Инстинкт выживания', desc: 'Владеешь навыком Выживание.', grants: { skills: ['survival'] } }
      ]
    },
    {
      id: 'locathah', name: 'Локата', en: 'Locathah', src: 'LR', group: 'other', size: 'Средний', speed: 30, exotic: true,
      tagline: 'Рыбий народ, переживший рабство',
      desc: 'Морские гуманоиды, веками угнетаемые сахуагинами. Сплочённые, стойкие и недоверчивые.',
      asi: { str: 2, dex: 1 }, languages: ['common', 'primordial'], swim: 30,
      traits: [
        { id: 'natural-armor', name: 'Природный доспех', desc: 'Без доспеха КД = 12 + мод. Ловкости. Щит можно.', grants: { acAlt: { id: 'locathah', name: 'Чешуя', base: 12, abils: ['dex'], shield: true } } },
        { id: 'observant-athletic', name: 'Наблюдательный и атлетичный', desc: 'Владеешь навыками Атлетика и Внимательность.', grants: { skills: ['athletics', 'perception'] } },
        { id: 'leviathan-will', name: 'Воля левиафана', desc: 'Преимущество на спасброски от очарования, испуга, паралича, отравления, ошеломления и сна.' },
        { id: 'limited-amphibiousness', name: 'Ограниченная земноводность', desc: 'Дышишь водой и воздухом, но раз в 4 часа нужно окунуться, иначе накапливаешь истощение.', grants: { swim: 30 } }
      ]
    },
    {
      id: 'verdan', name: 'Вердан', en: 'Verdan', src: 'AI', group: 'other', size: 'Маленький', speed: 30, exotic: true,
      tagline: 'Юный народ-загадка',
      desc: 'Зеленокожие гоблиноиды, изменённые магией; растут всю жизнь и не помнят своего прошлого.',
      asi: { con: 1, cha: 2 }, languages: ['common', 'goblin'],
      traits: [
        { id: 'black-blood-healing', name: 'Исцеление чёрной крови', desc: 'Тратя Кости Хитов, перебрасывай выпавшие 1 и 2.' },
        { id: 'limited-telepathy', name: 'Ограниченная телепатия', desc: 'Телепатически говоришь с существом в 30 фт, знающим язык.' },
        { id: 'persuasive', name: 'Убедительный', desc: 'Владеешь навыком Убеждение.', grants: { skills: ['persuasion'] } },
        { id: 'telepathic-insight', name: 'Телепатическое понимание', desc: 'Преимущество на спасброски Мудрости и Харизмы.' },
        { id: 'verdan-lang', name: 'Дополнительный язык', desc: 'Знаешь ещё один язык на выбор.', choices: [LANG1] }
      ]
    },
    {
      id: 'grung', name: 'Грунг', en: 'Grung', src: 'OGA', group: 'other', size: 'Маленький', speed: 25, exotic: true,
      tagline: 'Ядовитая лягушка-воин',
      desc: 'Кастовые древолягушки джунглей Чульта. Ядовиты и не могут долго без воды — очень специфичный выбор.',
      asi: { dex: 2, con: 1 }, languages: ['grung'],
      traits: [
        { id: 'arboreal-alertness', name: 'Древесная бдительность', desc: 'Владеешь навыком Внимательность; скорость лазания 25 фт.', grants: { skills: ['perception'], climb: 25 } },
        { id: 'amphibious', name: 'Земноводный', desc: 'Дышишь воздухом и водой.' },
        { id: 'poison-immunity', name: 'Иммунитет к яду', desc: 'Иммунитет к урону ядом и состоянию «отравлен».', grants: { immune: ['poison'] } },
        { id: 'poisonous-skin', name: 'Ядовитая кожа', desc: 'Кто хватает тебя — спасбросок Тел или отравлен. Можешь смазывать ядом оружие (+2к4 ядом).' },
        { id: 'standing-leap', name: 'Прыжок с места', desc: 'Прыгаешь на 25 фт в длину и 15 фт в высоту без разбега.' },
        { id: 'water-dependency', name: 'Зависимость от воды', desc: 'Каждый день нужно час провести в воде, иначе получаешь истощение.' }
      ]
    },
    {
      id: 'custom-lineage', name: 'Своё происхождение', en: 'Custom Lineage', src: 'TCE', group: 'other', size: 'Средний', speed: 30, custom: true,
      tagline: 'Придумай народ сам',
      desc: 'Правило Таши для своей необычной задумки: полу-кто-угодно, проклятый, выросший у фей. Механика простая и гибкая.',
      languages: ['common'],
      traits: [
        { id: 'custom-asi', name: 'Увеличение характеристики', desc: 'Одна характеристика на выбор +2.', choices: [{ id: 'asi', type: 'asi', count: 1, amount: 2, label: '+2 к одной характеристике' }] },
        { id: 'custom-size', name: 'Размер', desc: 'Маленький или Средний.', choices: [{ id: 'size', type: 'option', count: 1, def: 'medium', label: 'Размер', options: [
          { id: 'medium', name: 'Средний', desc: 'Обычный рост человека.' }, { id: 'small', name: 'Маленький', desc: 'Как гном или полурослик.', grants: { size: 'Маленький' } }] }] },
        { id: 'custom-feat', name: 'Черта', desc: 'Одна черта на выбор.', choices: [{ id: 'feat', type: 'feat', count: 1, label: 'Черта' }] },
        { id: 'custom-variable', name: 'Особенность', desc: 'Тёмное зрение 60 фт или владение одним навыком.', choices: [{ id: 'variable', type: 'option', count: 1, label: 'Особенность', options: [
          { id: 'darkvision', name: 'Тёмное зрение', desc: '60 фт.', grants: { darkvision: 60 } },
          { id: 'skill', name: 'Навык', desc: 'Один навык на выбор.', choices: [{ id: 'skill', type: 'skill', count: 1, from: 'any', label: 'Навык' }] }] }] },
        { id: 'custom-lang', name: 'Дополнительный язык', desc: 'Знаешь ещё один язык на выбор.', choices: [LANG1] }
      ]
    }
  ];

  /* Драконы-предки (драконорождённый, чародей драконьей крови) */
  DND.data.options = DND.data.options || {};
  DND.data.options.dragonAncestry = [
    { id: 'black',  name: 'Чёрный',     dt: 'acid',      breath: 'линия 5 × 30 фт', save: 'dex', desc: 'Кислота. Дыхание: линия 5 × 30 фт, спасбросок Ловкости.' },
    { id: 'blue',   name: 'Синий',      dt: 'lightning', breath: 'линия 5 × 30 фт', save: 'dex', desc: 'Электричество. Дыхание: линия 5 × 30 фт, спасбросок Ловкости.' },
    { id: 'brass',  name: 'Латунный',   dt: 'fire',      breath: 'линия 5 × 30 фт', save: 'dex', desc: 'Огонь. Дыхание: линия 5 × 30 фт, спасбросок Ловкости.' },
    { id: 'bronze', name: 'Бронзовый',  dt: 'lightning', breath: 'линия 5 × 30 фт', save: 'dex', desc: 'Электричество. Дыхание: линия 5 × 30 фт, спасбросок Ловкости.' },
    { id: 'copper', name: 'Медный',     dt: 'acid',      breath: 'линия 5 × 30 фт', save: 'dex', desc: 'Кислота. Дыхание: линия 5 × 30 фт, спасбросок Ловкости.' },
    { id: 'gold',   name: 'Золотой',    dt: 'fire',      breath: 'конус 15 фт', save: 'dex', desc: 'Огонь. Дыхание: конус 15 фт, спасбросок Ловкости.' },
    { id: 'green',  name: 'Зелёный',    dt: 'poison',    breath: 'конус 15 фт', save: 'con', desc: 'Яд. Дыхание: конус 15 фт, спасбросок Телосложения.' },
    { id: 'red',    name: 'Красный',    dt: 'fire',      breath: 'конус 15 фт', save: 'dex', desc: 'Огонь. Дыхание: конус 15 фт, спасбросок Ловкости.' },
    { id: 'silver', name: 'Серебряный', dt: 'cold',      breath: 'конус 15 фт', save: 'con', desc: 'Холод. Дыхание: конус 15 фт, спасбросок Телосложения.' },
    { id: 'white',  name: 'Белый',      dt: 'cold',      breath: 'конус 15 фт', save: 'con', desc: 'Холод. Дыхание: конус 15 фт, спасбросок Телосложения.' }
  ];

  DND.data.raceGroups = [
    { id: 'PHB', name: 'Книга игрока' },
    { id: 'VGM', name: 'Руководство Воло' },
    { id: 'MTF', name: 'Морденкайнен' },
    { id: 'EEPC', name: 'Стихийное зло' },
    { id: 'other', name: 'Прочие народы Фаэруна' }
  ];
})();
