/* Наборы вариантов для умений классов: боевые стили, воззвания, метамагия, приёмы и т.п.
   Каждый вариант может иметь grants (эффекты), choices (вложенные выборы), req (требования), src, tce (только с правилами Таши). */
window.DND = window.DND || {};
DND.data = DND.data || {};
DND.data.options = DND.data.options || {};

Object.assign(DND.data.options, {
  /* Боевые стили. for — какие классы могут брать */
  fightingStyle: [
    { id: 'archery', name: 'Стрельба', en: 'Archery', src: 'PHB', for: ['fighter', 'ranger'], desc: '+2 к броскам атаки дальнобойным оружием.', grants: { rangedAttackBonus: 2 } },
    { id: 'defense', name: 'Оборона', en: 'Defense', src: 'PHB', for: ['fighter', 'paladin', 'ranger'], desc: '+1 к КД, пока ты носишь доспех.', grants: { acArmoredBonus: 1 } },
    { id: 'dueling', name: 'Дуэлянт', en: 'Dueling', src: 'PHB', for: ['fighter', 'paladin', 'ranger', 'bard'], desc: '+2 к урону, если в одной руке рукопашное оружие, а в другой нет оружия.', grants: { duelingBonus: 2 } },
    { id: 'great-weapon', name: 'Сражение большим оружием', en: 'Great Weapon Fighting', src: 'PHB', for: ['fighter', 'paladin'], desc: 'Двуручным или универсальным оружием (двумя руками) перебрасываешь 1 и 2 на костях урона.' },
    { id: 'protection', name: 'Защита', en: 'Protection', src: 'PHB', for: ['fighter', 'paladin'], desc: 'Со щитом реакцией накладываешь помеху на атаку по союзнику в 5 фт от тебя.' },
    { id: 'two-weapon', name: 'Сражение двумя оружиями', en: 'Two-Weapon Fighting', src: 'PHB', for: ['fighter', 'ranger', 'bard'], desc: 'Вторая атака (бонусным действием) получает модификатор характеристики к урону.' },
    { id: 'blind-fighting', name: 'Слепой бой', en: 'Blind Fighting', src: 'TCE', tce: true, for: ['fighter', 'paladin', 'ranger'], desc: 'Слепое зрение 10 фт: видишь невидимых и в темноте рядом с собой.', grants: { blindsight: 10 } },
    { id: 'interception', name: 'Перехват', en: 'Interception', src: 'TCE', tce: true, for: ['fighter', 'paladin'], desc: 'Реакцией уменьшаешь урон союзнику рядом на 1к10 + мастерство (нужен щит или оружие).' },
    { id: 'superior-technique', name: 'Превосходная техника', en: 'Superior Technique', src: 'TCE', tce: true, for: ['fighter'], desc: 'Один приём мастера боевых искусств и одна кость превосходства к6 (восстанавливается на отдыхе).',
      choices: [{ id: 'maneuver', type: 'option', count: 1, group: 'maneuvers', label: 'Приём' }] },
    { id: 'thrown-weapon', name: 'Бой метательным оружием', en: 'Thrown Weapon Fighting', src: 'TCE', tce: true, for: ['fighter', 'ranger'], desc: 'Выхватываешь метательное оружие частью атаки; +2 к урону метательным оружием.' },
    { id: 'unarmed', name: 'Бой без оружия', en: 'Unarmed Fighting', src: 'TCE', tce: true, for: ['fighter'], desc: 'Безоружные удары: 1к6 + Сил (1к8, если обе руки свободны); в захвате — 1к4 урона в начале хода.', grants: { unarmedDie: '1к6' } },
    { id: 'blessed-warrior', name: 'Благословенный воин', en: 'Blessed Warrior', src: 'TCE', tce: true, for: ['paladin'], desc: 'Два заговора жреца (Хар) — считаются заклинаниями паладина.',
      choices: [{ id: 'cantrips', type: 'spell', lvl: 0, lists: ['c'], count: 2, abil: 'cha', label: '2 заговора жреца' }] },
    { id: 'druidic-warrior', name: 'Друидический воин', en: 'Druidic Warrior', src: 'TCE', tce: true, for: ['ranger'], desc: 'Два заговора друида (Мдр) — считаются заклинаниями следопыта.',
      choices: [{ id: 'cantrips', type: 'spell', lvl: 0, lists: ['d'], count: 2, abil: 'wis', label: '2 заговора друида' }] }
  ],

  /* Приёмы мастера боевых искусств */
  maneuvers: [
    { id: 'evasive-footwork', name: 'Активное уклонение', en: 'Evasive Footwork', src: 'PHB', desc: 'При перемещении добавь кость превосходства к КД, пока не остановишься.' },
    { id: 'lunging-attack', name: 'Атака с выпадом', en: 'Lunging Attack', src: 'PHB', desc: 'Досягаемость атаки +5 фт; при попадании кость к урону.' },
    { id: 'maneuvering-attack', name: 'Атака с манёвром', en: 'Maneuvering Attack', src: 'PHB', desc: 'Кость к урону; союзник реакцией отходит на половину скорости без провоцированных атак от цели.' },
    { id: 'menacing-attack', name: 'Атака с угрозой', en: 'Menacing Attack', src: 'PHB', desc: 'Кость к урону; цель проходит спасбросок Мудрости или испугана.' },
    { id: 'feinting-attack', name: 'Атака с финтом', en: 'Feinting Attack', src: 'PHB', desc: 'Бонусным действием — преимущество на следующую атаку по цели рядом и кость к урону.' },
    { id: 'disarming-attack', name: 'Обезоруживающая атака', en: 'Disarming Attack', src: 'PHB', desc: 'Кость к урону; цель проходит спасбросок Силы или роняет предмет.' },
    { id: 'trip-attack', name: 'Опрокидывающая атака', en: 'Trip Attack', src: 'PHB', desc: 'Кость к урону; цель (до Большого) проходит спасбросок Силы или падает ничком.' },
    { id: 'riposte', name: 'Ответный удар', en: 'Riposte', src: 'PHB', desc: 'Когда враг промахивается по тебе в ближнем бою — реакцией бьёшь его с костью к урону.' },
    { id: 'distracting-strike', name: 'Отвлекающий удар', en: 'Distracting Strike', src: 'PHB', desc: 'Кость к урону; следующий союзник атакует эту цель с преимуществом.' },
    { id: 'parry', name: 'Парирование', en: 'Parry', src: 'PHB', desc: 'Реакцией уменьшаешь рукопашный урон на кость + мод. Ловкости.' },
    { id: 'goading-attack', name: 'Провоцирующая атака', en: 'Goading Attack', src: 'PHB', desc: 'Кость к урону; цель проходит спасбросок Мудрости или атакует других с помехой.' },
    { id: 'rally', name: 'Сплочение', en: 'Rally', src: 'PHB', desc: 'Бонусным действием союзник получает временные хиты: кость + мод. Харизмы.' },
    { id: 'pushing-attack', name: 'Толкающая атака', en: 'Pushing Attack', src: 'PHB', desc: 'Кость к урону; цель проходит спасбросок Силы или отлетает на 15 фт.' },
    { id: 'precision-attack', name: 'Точная атака', en: 'Precision Attack', src: 'PHB', desc: 'Добавь кость к броску атаки — даже после броска.' },
    { id: 'commanders-strike', name: 'Удар командующего', en: 'Commander\'s Strike', src: 'PHB', desc: 'Отказываешься от атаки, чтобы союзник реакцией ударил с костью к урону.' },
    { id: 'sweeping-attack', name: 'Широкая атака', en: 'Sweeping Attack', src: 'PHB', desc: 'Попав, задеваешь второго врага рядом — он получает урон, равный кости.' },
    { id: 'ambush', name: 'Засада', en: 'Ambush', src: 'TCE', tce: true, desc: 'Добавь кость к проверке Скрытности или инициативе.' },
    { id: 'bait-and-switch', name: 'Подмена', en: 'Bait and Switch', src: 'TCE', tce: true, desc: 'Меняешься местами с союзником рядом; один из вас получает кость к КД.' },
    { id: 'brace', name: 'Упор', en: 'Brace', src: 'TCE', tce: true, desc: 'Реакцией бьёшь врага, вошедшего в досягаемость, с костью к урону.' },
    { id: 'commanding-presence', name: 'Властное присутствие', en: 'Commanding Presence', src: 'TCE', tce: true, desc: 'Добавь кость к проверке Запугивания, Выступления или Убеждения.' },
    { id: 'grappling-strike', name: 'Захватывающий удар', en: 'Grappling Strike', src: 'TCE', tce: true, desc: 'После попадания бонусным действием захват с костью к проверке Атлетики.' },
    { id: 'quick-toss', name: 'Быстрый бросок', en: 'Quick Toss', src: 'TCE', tce: true, desc: 'Бонусным действием метаешь оружие с костью к урону.' },
    { id: 'tactical-assessment', name: 'Тактическая оценка', en: 'Tactical Assessment', src: 'TCE', tce: true, desc: 'Добавь кость к проверке Анализа, Истории или Проницательности.' }
  ],

  /* Таинственные воззвания колдуна, доступные на 2–3 уровне */
  invocations: [
    { id: 'agonizing-blast', name: 'Мучительный взрыв', en: 'Agonizing Blast', src: 'PHB', req: { spell: 'eldritch-blast' }, desc: 'Добавляешь модификатор Харизмы к урону Мистического заряда. Почти обязательное воззвание.', grants: { agonizing: true } },
    { id: 'armor-of-shadows', name: 'Доспех теней', en: 'Armor of Shadows', src: 'PHB', desc: '«Доспехи мага» на себя сколько угодно раз, без ячеек.', grants: { spells: [{ id: 'mage-armor', abil: 'cha', note: 'на себя, без ячейки' }] } },
    { id: 'beast-speech', name: 'Животная речь', en: 'Beast Speech', src: 'PHB', desc: '«Разговор с животными» без ячеек.', grants: { spells: [{ id: 'speak-with-animals', abil: 'cha', note: 'без ячейки' }] } },
    { id: 'beguiling-influence', name: 'Обманчивое влияние', en: 'Beguiling Influence', src: 'PHB', desc: 'Владеешь навыками Обман и Убеждение.', grants: { skills: ['deception', 'persuasion'] } },
    { id: 'devils-sight', name: 'Дьявольский взгляд', en: 'Devil\'s Sight', src: 'PHB', desc: 'Видишь в обычной и магической темноте на 120 фт. Отлично сочетается с «Тьмой».', grants: { devilsSight: 120 } },
    { id: 'eldritch-sight', name: 'Таинственный взгляд', en: 'Eldritch Sight', src: 'PHB', desc: '«Обнаружение магии» без ячеек.', grants: { spells: [{ id: 'detect-magic', abil: 'cha', note: 'без ячейки' }] } },
    { id: 'eldritch-spear', name: 'Мистическое копьё', en: 'Eldritch Spear', src: 'PHB', req: { spell: 'eldritch-blast' }, desc: 'Дистанция Мистического заряда — 300 фт.' },
    { id: 'eyes-of-the-rune-keeper', name: 'Глаза хранителя рун', en: 'Eyes of the Rune Keeper', src: 'PHB', desc: 'Читаешь любую письменность.' },
    { id: 'fiendish-vigor', name: 'Мощь исчадия', en: 'Fiendish Vigor', src: 'PHB', desc: '«Псевдожизнь» на себя без ячеек (как 1 круг).', grants: { spells: [{ id: 'false-life', abil: 'cha', note: 'на себя, без ячейки' }] } },
    { id: 'gaze-of-two-minds', name: 'Взор двух умов', en: 'Gaze of Two Minds', src: 'PHB', desc: 'Касанием видишь и слышишь чувствами согласного гуманоида.' },
    { id: 'mask-of-many-faces', name: 'Маска многих лиц', en: 'Mask of Many Faces', src: 'PHB', desc: '«Маскировка» без ячеек.', grants: { spells: [{ id: 'disguise-self', abil: 'cha', note: 'без ячейки' }] } },
    { id: 'misty-visions', name: 'Туманные видения', en: 'Misty Visions', src: 'PHB', desc: '«Безмолвный образ» без ячеек.', grants: { spells: [{ id: 'silent-image', abil: 'cha', note: 'без ячейки' }] } },
    { id: 'repelling-blast', name: 'Отталкивающий заряд', en: 'Repelling Blast', src: 'PHB', req: { spell: 'eldritch-blast' }, desc: 'Попадание Мистическим зарядом отталкивает цель на 10 фт.' },
    { id: 'thief-of-five-fates', name: 'Вор пяти судеб', en: 'Thief of Five Fates', src: 'PHB', desc: '«Порча» один раз за продолжительный отдых ячейкой колдуна.', grants: { spells: [{ id: 'bane', abil: 'cha', note: '1/прод. отдых, ячейкой' }] } },
    { id: 'book-of-ancient-secrets', name: 'Книга древних секретов', en: 'Book of Ancient Secrets', src: 'PHB', req: { pact: 'tome' }, desc: 'Записываешь в Книгу теней два ритуала 1 круга из любых списков и можешь исполнять их.',
      choices: [{ id: 'rituals', type: 'spell', lvl: 1, lists: 'any', ritualOnly: true, count: 2, abil: 'cha', label: '2 ритуала 1 круга' }] },
    { id: 'voice-of-the-chain-master', name: 'Глас цепного мастера', en: 'Voice of the Chain Master', src: 'PHB', req: { pact: 'chain' }, desc: 'Общаешься с фамильяром телепатически на любом расстоянии, говоришь его голосом.' },
    { id: 'aspect-of-the-moon', name: 'Аспект луны', en: 'Aspect of the Moon', src: 'XGE', req: { pact: 'tome' }, desc: 'Не нужен сон; отдыхаешь, занимаясь лёгким делом.' },
    { id: 'grasp-of-hadar', name: 'Хватка Хадара', en: 'Grasp of Hadar', src: 'XGE', req: { spell: 'eldritch-blast' }, desc: 'Раз в ход Мистический заряд подтягивает цель на 10 фт к тебе.' },
    { id: 'lance-of-lethargy', name: 'Копьё летаргии', en: 'Lance of Lethargy', src: 'XGE', req: { spell: 'eldritch-blast' }, desc: 'Раз в ход Мистический заряд снижает скорость цели на 10 фт.' },
    { id: 'improved-pact-weapon', name: 'Улучшенное оружие договора', en: 'Improved Pact Weapon', src: 'XGE', req: { pact: 'blade' }, desc: 'Оружие договора получает +1 к атаке и урону и служит фокусировкой; можно призвать лук или арбалет.', grants: { pactWeaponBonus: 1 } },
    { id: 'eldritch-mind', name: 'Мистический разум', en: 'Eldritch Mind', src: 'TCE', desc: 'Преимущество на спасброски Телосложения для поддержания концентрации.' },
    { id: 'investment-of-the-chain-master', name: 'Дар цепного мастера', en: 'Investment of the Chain Master', src: 'TCE', req: { pact: 'chain' }, desc: 'Фамильяр получает полёт или плавание 40 фт, магические атаки, твою Сл спасбросков и защиту реакцией.' },
    { id: 'rebuke-of-the-talisman', name: 'Упрёк талисмана', en: 'Rebuke of the Talisman', src: 'TCE', req: { pact: 'talisman' }, desc: 'Когда бьют носителя талисмана — реакцией наносишь обидчику психический урон (= мастерству) и отталкиваешь на 10 фт.' }
  ],

  /* Предметы договора */
  pactBoons: [
    { id: 'chain', name: 'Договор цепи', en: 'Pact of the Chain', src: 'PHB', desc: 'Знаешь «Поиск фамильяра» (ритуалом) и можешь выбрать особую форму: бес, псевдодракон, квазит или спрайт. Фамильяр может атаковать реакцией.',
      grants: { spells: [{ id: 'find-familiar', abil: 'cha', note: 'ритуал; особые формы' }] } },
    { id: 'blade', name: 'Договор клинка', en: 'Pact of the Blade', src: 'PHB', desc: 'Действием призываешь оружие ближнего боя на выбор — ты им владеешь, оно магическое.', grants: { pactBlade: true } },
    { id: 'tome', name: 'Договор гримуара', en: 'Pact of the Tome', src: 'PHB', desc: 'Книга теней: три заговора из любых списков (считаются заговорами колдуна).',
      choices: [{ id: 'cantrips', type: 'spell', lvl: 0, lists: 'any', count: 3, abil: 'cha', label: '3 заговора из любых списков' }] },
    { id: 'talisman', name: 'Договор талисмана', en: 'Pact of the Talisman', src: 'TCE', desc: 'Амулет: носитель добавляет 1к4 к проваленной проверке характеристики (мастерство раз за прод. отдых).' }
  ],

  /* Метамагия */
  metamagic: [
    { id: 'careful', name: 'Аккуратное заклинание', en: 'Careful Spell', src: 'PHB', desc: '1 ед.: выбранные союзники автоматически проходят спасбросок от твоего заклинания.' },
    { id: 'distant', name: 'Далёкое заклинание', en: 'Distant Spell', src: 'PHB', desc: '1 ед.: дистанция удваивается (касание — 30 фт).' },
    { id: 'empowered', name: 'Усиленное заклинание', en: 'Empowered Spell', src: 'PHB', desc: '1 ед.: перебрось до (мод. Хар) костей урона.' },
    { id: 'extended', name: 'Продлённое заклинание', en: 'Extended Spell', src: 'PHB', desc: '1 ед.: длительность удваивается (до 24 часов).' },
    { id: 'heightened', name: 'Непреодолимое заклинание', en: 'Heightened Spell', src: 'PHB', desc: '3 ед.: одна цель проходит спасбросок с помехой.' },
    { id: 'quickened', name: 'Ускоренное заклинание', en: 'Quickened Spell', src: 'PHB', desc: '2 ед.: заклинание за 1 действие накладывается бонусным действием.' },
    { id: 'subtle', name: 'Неуловимое заклинание', en: 'Subtle Spell', src: 'PHB', desc: '1 ед.: без вербальных и соматических компонентов — никто не заметит.' },
    { id: 'twinned', name: 'Удвоенное заклинание', en: 'Twinned Spell', src: 'PHB', desc: 'Ед. = круг: заклинание на одну цель действует на вторую.' },
    { id: 'seeking', name: 'Ищущее заклинание', en: 'Seeking Spell', src: 'TCE', tce: true, desc: '2 ед.: перебрось промахнувшийся бросок атаки заклинанием.' },
    { id: 'transmuted', name: 'Преобразованное заклинание', en: 'Transmuted Spell', src: 'TCE', tce: true, desc: '1 ед.: меняешь вид урона (кислота, холод, огонь, электричество, яд, звук) на другой из этого списка.' }
  ],

  /* Избранный враг следопыта */
  favoredEnemy: [
    { id: 'aberrations', name: 'Аберрации' }, { id: 'beasts', name: 'Звери' }, { id: 'celestials', name: 'Небожители' },
    { id: 'constructs', name: 'Конструкты' }, { id: 'dragons', name: 'Драконы' }, { id: 'elementals', name: 'Элементали' },
    { id: 'fey', name: 'Феи' }, { id: 'fiends', name: 'Исчадия' }, { id: 'giants', name: 'Великаны' },
    { id: 'monstrosities', name: 'Монстры' }, { id: 'oozes', name: 'Слизи' }, { id: 'plants', name: 'Растения' },
    { id: 'undead', name: 'Нежить' }, { id: 'humanoids', name: 'Две расы гуманоидов', desc: 'Например, гноллы и орки. Впиши их в заметки.' }
  ],
  terrain: [
    { id: 'arctic', name: 'Арктика' }, { id: 'coast', name: 'Побережье' }, { id: 'desert', name: 'Пустыня' }, { id: 'forest', name: 'Лес' },
    { id: 'grassland', name: 'Луга' }, { id: 'mountain', name: 'Горы' }, { id: 'swamp', name: 'Болота' }, { id: 'underdark', name: 'Подземье' }
  ],

  hunterPrey: [
    { id: 'colossus-slayer', name: 'Убийца колоссов', en: 'Colossus Slayer', desc: 'Раз в ход +1к8 урона по раненому существу.' },
    { id: 'giant-killer', name: 'Убийца великанов', en: 'Giant Killer', desc: 'Когда Большое или крупнее существо рядом атакует тебя — реакцией бьёшь в ответ.' },
    { id: 'horde-breaker', name: 'Сокрушитель орд', en: 'Horde Breaker', desc: 'Раз в ход дополнительная атака по второму врагу рядом с первым.' }
  ],

  totemSpirit: [
    { id: 'bear', name: 'Медведь', src: 'PHB', desc: 'В ярости — сопротивление всем видам урона, кроме психической энергии. Самый живучий варвар.' },
    { id: 'eagle', name: 'Орёл', src: 'PHB', desc: 'В ярости враги атакуют тебя по провоцированным атакам с помехой; Рывок — бонусным действием.' },
    { id: 'wolf', name: 'Волк', src: 'PHB', desc: 'В ярости союзники атакуют с преимуществом врагов рядом с тобой.' },
    { id: 'elk', name: 'Лось', src: 'SCAG', desc: 'В ярости (без тяжёлого доспеха) скорость +15 фт.' },
    { id: 'tiger', name: 'Тигр', src: 'SCAG', desc: 'В ярости +10 фт к прыжкам в длину и +3 фт в высоту.' }
  ],

  stormAura: [
    { id: 'desert', name: 'Пустыня', desc: 'Существа по твоему выбору в 10 фт получают 2 урона огнём.' },
    { id: 'sea', name: 'Море', desc: 'Одно существо в 10 фт: спасбросок Ловкости или 1к6 урона электричеством.' },
    { id: 'tundra', name: 'Тундра', desc: 'Союзники в 10 фт получают 2 временных хита.' }
  ],

  elementalDisciplines: [
    { id: 'fangs-fire-snake', name: 'Зубы огненной змеи', desc: '1 ци: досягаемость удара +10 фт и урон огнём (+1к10 за ещё 1 ци).' },
    { id: 'fist-four-thunders', name: 'Кулак четырёх громов', desc: '2 ци: «Волна грома».' },
    { id: 'fist-unbroken-air', name: 'Несокрушимый воздушный кулак', desc: '2 ци: удар сжатым воздухом на 30 фт — 3к10 дробящего, отталкивание и падение.' },
    { id: 'rush-gale-spirits', name: 'Натиск штормовых духов', desc: '2 ци: «Порыв ветра».' },
    { id: 'shape-flowing-river', name: 'Формирование текущей реки', desc: '1 ци: меняешь лёд и воду в кубе 30 фт.' },
    { id: 'sweeping-cinder', name: 'Испепеляющий удар', desc: '2 ци: «Огненные ладони».' },
    { id: 'water-whip', name: 'Водяной кнут', desc: '2 ци: кнут воды на 30 фт — 3к10 дробящего, сбить с ног или подтянуть.' }
  ],

  arcaneShots: [
    { id: 'banishing', name: 'Изгоняющая стрела', desc: 'Цель проходит спасбросок Харизмы или исчезает на полу-план до конца своего хода.' },
    { id: 'beguiling', name: 'Очаровывающая стрела', desc: '+2к6 психической энергией; цель очарована союзником (спасбросок Мудрости).' },
    { id: 'bursting', name: 'Разрывная стрела', desc: 'Взрыв: +2к6 урона силовым полем цели и всем в 10 фт.' },
    { id: 'enfeebling', name: 'Ослабляющая стрела', desc: '+2к6 некротической энергией; урон цели оружием вдвое меньше (спасбросок Телосложения).' },
    { id: 'grasping', name: 'Цепкая стрела', desc: '+2к6 ядом; колючая лоза снижает скорость и ранит при движении.' },
    { id: 'piercing', name: 'Пронзающая стрела', desc: 'Стрела пролетает сквозь всех на линии 30 фт (спасбросок Ловкости).' },
    { id: 'seeking', name: 'Ищущая стрела', desc: 'Огибает препятствия и находит видимую ранее цель (спасбросок Ловкости).' },
    { id: 'shadow', name: 'Теневая стрела', desc: '+2к6 психической энергией; цель ничего не видит дальше 5 фт (спасбросок Мудрости).' }
  ],

  runes: [
    { id: 'cloud', name: 'Облачная руна', desc: 'Реакцией перенаправляешь атаку с себя или союзника на другое существо. Преимущество на Ловкость рук и Обман.' },
    { id: 'fire', name: 'Огненная руна', desc: 'Попав, опутываешь цель огненными цепями: +2к6 огнём в ход, обездвиженность. Двойной бонус мастерства к инструментам.' },
    { id: 'frost', name: 'Ледяная руна', desc: '+2 к проверкам и спасброскам Сил и Тел на 10 минут. Преимущество на Уход за животными и Запугивание.' },
    { id: 'stone', name: 'Каменная руна', desc: 'Реакцией усыпляешь врага (спасбросок Мудрости). Преимущество на Проницательность, тёмное зрение 120 фт.' }
  ],

  shepherdSpirit: [
    { id: 'bear', name: 'Медведь', desc: 'Союзники в ауре получают временные хиты и преимущество на проверки и спасброски Силы.' },
    { id: 'hawk', name: 'Ястреб', desc: 'Реакцией даёшь союзнику в ауре преимущество на атаку; преимущество на Внимательность.' },
    { id: 'unicorn', name: 'Единорог', desc: 'Твои лечащие заклинания лечат всех в ауре; преимущество на поиск существ.' }
  ],

  divineAffinity: [
    { id: 'good', name: 'Добро', spell: 'cure-wounds', desc: 'Дополнительное заклинание: «Лечение ран».' },
    { id: 'evil', name: 'Зло', spell: 'inflict-wounds', desc: 'Дополнительное заклинание: «Нанесение ран».' },
    { id: 'law', name: 'Закон', spell: 'bless', desc: 'Дополнительное заклинание: «Благословение».' },
    { id: 'chaos', name: 'Хаос', spell: 'bane', desc: 'Дополнительное заклинание: «Порча».' },
    { id: 'neutral', name: 'Нейтральность', spell: 'protection-evil-good', desc: 'Дополнительное заклинание: «Защита от добра и зла».' }
  ],

  genieKind: [
    { id: 'dao', name: 'Дао (земля)', dt: 'bludgeoning', spells: ['sanctuary', 'spike-growth'], desc: 'Гнев гения — дробящий урон. Доп. заклинания: «Убежище», «Шипы».' },
    { id: 'djinni', name: 'Джинн (воздух)', dt: 'thunder', spells: ['thunderwave', 'gust-of-wind'], desc: 'Гнев гения — урон звуком. Доп. заклинания: «Волна грома», «Порыв ветра».' },
    { id: 'efreeti', name: 'Ифрит (огонь)', dt: 'fire', spells: ['burning-hands', 'scorching-ray'], desc: 'Гнев гения — урон огнём. Доп. заклинания: «Огненные ладони», «Палящий луч».' },
    { id: 'marid', name: 'Марид (вода)', dt: 'cold', spells: ['fog-cloud', 'blur'], desc: 'Гнев гения — урон холодом. Доп. заклинания: «Туманное облако», «Размытый образ».' }
  ],

  landCircle: [
    { id: 'arctic', name: 'Арктика', spells: ['hold-person', 'spike-growth'] },
    { id: 'coast', name: 'Побережье', spells: ['mirror-image', 'misty-step'] },
    { id: 'desert', name: 'Пустыня', spells: ['blur', 'silence'] },
    { id: 'forest', name: 'Лес', spells: ['barkskin', 'spider-climb'] },
    { id: 'grassland', name: 'Луга', spells: ['invisibility', 'pass-without-trace'] },
    { id: 'mountain', name: 'Горы', spells: ['spider-climb', 'spike-growth'] },
    { id: 'swamp', name: 'Болото', spells: ['darkness', 'melfs-acid-arrow'] },
    { id: 'underdark', name: 'Подземье', spells: ['spider-climb', 'web'] }
  ],

  beastCompanion: [
    { id: 'classic', name: 'Зверь (КИ)', src: 'PHB', desc: 'Настоящий зверь Среднего размера или меньше с ПО не выше 1/4: волк, пантера, кабан, ястреб и т.п. Его параметры — в Бестиарии.' },
    { id: 'land', name: 'Зверь земли (Таша)', src: 'TCE', tce: true, desc: 'Первобытный дух-зверь: быстрый, сбивает с ног при атаке с разбега.' },
    { id: 'sea', name: 'Зверь моря (Таша)', src: 'TCE', tce: true, desc: 'Первобытный дух-зверь: плавает, хватает цель при попадании.' },
    { id: 'sky', name: 'Зверь неба (Таша)', src: 'TCE', tce: true, desc: 'Первобытный дух-зверь: летает, не провоцирует атак при отступлении.' }
  ],

  /* Инфузии изобретателя, доступные на 2–3 уровне */
  infusions: [
    { id: 'enhanced-focus', name: 'Улучшенная магическая фокусировка', en: 'Enhanced Arcane Focus', desc: 'Посох, жезл или палочка: +1 к атакам заклинаниями, игнорирует половинное укрытие.' },
    { id: 'enhanced-defense', name: 'Улучшенная защита', en: 'Enhanced Defense', desc: 'Доспех или щит: +1 к КД.', grants: { acInfusion: 1 } },
    { id: 'enhanced-weapon', name: 'Улучшенное оружие', en: 'Enhanced Weapon', desc: 'Простое или воинское оружие: +1 к атаке и урону.' },
    { id: 'homunculus', name: 'Гомункул-слуга', en: 'Homunculus Servant', desc: 'Механический помощник-гомункул, действующий по твоей команде.' },
    { id: 'mind-sharpener', name: 'Точильщик разума', en: 'Mind Sharpener', desc: 'Доспех или одежда: реакцией превращаешь провал концентрации в успех (4 заряда).' },
    { id: 'repeating-shot', name: 'Многозарядное оружие', en: 'Repeating Shot', desc: 'Стрелковое оружие: +1 к атаке и урону, само создаёт боеприпасы, без перезарядки.' },
    { id: 'returning-weapon', name: 'Возвращающееся оружие', en: 'Returning Weapon', desc: 'Метательное оружие: +1 к атаке и урону, возвращается в руку.' },
    { id: 'armor-magical-strength', name: 'Доспех магической силы', en: 'Armor of Magical Strength', desc: 'Доспех: заряды для бонуса Интеллекта к проверкам Силы и защиты от падения ничком.' },
    { id: 'replicate-item', name: 'Копия магического предмета', en: 'Replicate Magic Item', desc: 'Создаёшь простой магический предмет: сумку хранения, очки ночи, верёвку лазания, камни послания, палочку обнаружения магии и т.п. Можно выбрать несколько раз.' }
  ]
});
