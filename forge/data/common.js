/* Общие справочные данные: характеристики, навыки, языки, инструменты, мировоззрения, боги. */
window.DND = window.DND || {};
DND.data = DND.data || {};

DND.data.sources = {
  PHB:  { name: 'Книга игрока', short: 'КИ' },
  SCAG: { name: 'Руководство по Побережью Мечей', short: 'ПМ' },
  XGE:  { name: 'Руководство Занатара обо всём', short: 'Занатар' },
  TCE:  { name: 'Котёл Таши для всего', short: 'Таша' },
  VGM:  { name: 'Руководство Воло по монстрам', short: 'Воло' },
  MTF:  { name: 'Том противостояний Морденкайнена', short: 'Морденкайнен' },
  EEPC: { name: 'Спутник игрока: Стихийное зло', short: 'Стихийное зло' },
  TTP:  { name: 'Пакет тортлов', short: 'Тортлы' },
  LR:   { name: 'Восстание локата', short: 'Локата' },
  AI:   { name: 'Корпорация «Приобретения»', short: 'Приобретения' },
  OGA:  { name: 'На грунга выше', short: 'Грунги' }
};

DND.data.abilities = [
  { id: 'str', name: 'Сила',         short: 'Сил', desc: 'Мышцы и физическая мощь: атлетика, рукопашные удары, переноска груза.' },
  { id: 'dex', name: 'Ловкость',     short: 'Лов', desc: 'Реакция, точность, равновесие: КД в лёгком доспехе, стрельба, фехтовальное оружие, инициатива.' },
  { id: 'con', name: 'Телосложение', short: 'Тел', desc: 'Здоровье и выносливость. Модификатор прибавляется к хитам на каждом уровне — важна всем.' },
  { id: 'int', name: 'Интеллект',    short: 'Инт', desc: 'Память, логика, знания. Заклинательная характеристика волшебника и изобретателя.' },
  { id: 'wis', name: 'Мудрость',     short: 'Мдр', desc: 'Внимательность, интуиция, связь с миром. Заклинательная характеристика жреца, друида и следопыта.' },
  { id: 'cha', name: 'Харизма',      short: 'Хар', desc: 'Сила личности, обаяние, напор. Заклинательная характеристика барда, паладина, чародея и колдуна.' }
];

DND.data.skills = [
  { id: 'acrobatics',    name: 'Акробатика',        abil: 'dex', desc: 'Удержать равновесие, сделать кувырок, вывернуться из захвата, пройти по канату.' },
  { id: 'investigation', name: 'Анализ',            abil: 'int', desc: 'Искать улики и делать выводы: найти тайник, понять, как устроена ловушка.' },
  { id: 'athletics',     name: 'Атлетика',          abil: 'str', desc: 'Лазать, прыгать, плавать, выбивать двери, бороться.' },
  { id: 'perception',    name: 'Внимательность',    abil: 'wis', desc: 'Заметить, услышать, почуять: засада, шорох за дверью, блеск монеты. Самый частый навык.' },
  { id: 'survival',      name: 'Выживание',         abil: 'wis', desc: 'Следы, ориентирование, охота, предсказание погоды.' },
  { id: 'performance',   name: 'Выступление',       abil: 'cha', desc: 'Музыка, танец, актёрская игра, рассказ истории.' },
  { id: 'intimidation',  name: 'Запугивание',       abil: 'cha', desc: 'Добиться своего угрозами, грубой силой или видом.' },
  { id: 'history',       name: 'История',           abil: 'int', desc: 'Помнить события, королевства, войны, легенды и знаменитостей.' },
  { id: 'sleight',       name: 'Ловкость рук',      abil: 'dex', desc: 'Карманная кража, фокусы, незаметно подбросить или спрятать предмет.' },
  { id: 'arcana',        name: 'Магия',             abil: 'int', desc: 'Знания о заклинаниях, магических предметах, планах и символах.' },
  { id: 'medicine',      name: 'Медицина',          abil: 'wis', desc: 'Стабилизировать умирающего, распознать болезнь.' },
  { id: 'deception',     name: 'Обман',             abil: 'cha', desc: 'Врать убедительно, прятать правду, блефовать.' },
  { id: 'nature',        name: 'Природа',           abil: 'int', desc: 'Знания о растениях, животных, местности и погоде.' },
  { id: 'insight',       name: 'Проницательность',  abil: 'wis', desc: 'Понять намерения собеседника: врёт ли он, чего хочет.' },
  { id: 'religion',      name: 'Религия',           abil: 'int', desc: 'Боги, обряды, святые символы, культы и нежить.' },
  { id: 'stealth',       name: 'Скрытность',        abil: 'dex', desc: 'Прятаться и красться незамеченным.' },
  { id: 'persuasion',    name: 'Убеждение',         abil: 'cha', desc: 'Уговорить по-хорошему: дипломатия, такт, обаяние.' },
  { id: 'animal',        name: 'Уход за животными', abil: 'wis', desc: 'Успокоить зверя, управлять скакуном, понять настроение животного.' }
];

DND.data.languages = [
  { id: 'common',      name: 'Общий',          type: 'standard', speakers: 'Люди и почти все', script: 'Общий' },
  { id: 'dwarvish',    name: 'Дварфийский',    type: 'standard', speakers: 'Дварфы', script: 'Дварфийский' },
  { id: 'elvish',      name: 'Эльфийский',     type: 'standard', speakers: 'Эльфы', script: 'Эльфийский' },
  { id: 'giant',       name: 'Великаний',      type: 'standard', speakers: 'Великаны, огры', script: 'Дварфийский' },
  { id: 'gnomish',     name: 'Гномий',         type: 'standard', speakers: 'Гномы', script: 'Дварфийский' },
  { id: 'goblin',      name: 'Гоблинский',     type: 'standard', speakers: 'Гоблиноиды', script: 'Дварфийский' },
  { id: 'halfling',    name: 'Язык полуросликов', type: 'standard', speakers: 'Полурослики', script: 'Общий' },
  { id: 'orc',         name: 'Орочий',         type: 'standard', speakers: 'Орки', script: 'Дварфийский' },
  { id: 'abyssal',     name: 'Язык Бездны',    type: 'exotic', speakers: 'Демоны', script: 'Инфернальный' },
  { id: 'celestial',   name: 'Небесный',       type: 'exotic', speakers: 'Небожители', script: 'Небесный' },
  { id: 'draconic',    name: 'Драконий',       type: 'exotic', speakers: 'Драконы, драконорождённые', script: 'Драконий' },
  { id: 'deep',        name: 'Глубинная речь', type: 'exotic', speakers: 'Иллитиды, бехолдеры', script: '—' },
  { id: 'infernal',    name: 'Инфернальный',   type: 'exotic', speakers: 'Дьяволы', script: 'Инфернальный' },
  { id: 'primordial',  name: 'Первичный',      type: 'exotic', speakers: 'Элементали (наречия: акван, ауран, игнан, терран)', script: 'Дварфийский' },
  { id: 'sylvan',      name: 'Сильван',        type: 'exotic', speakers: 'Феи', script: 'Эльфийский' },
  { id: 'undercommon', name: 'Подземный',      type: 'exotic', speakers: 'Торговцы Подземья', script: 'Эльфийский' },
  { id: 'aarakocra',   name: 'Ааракокра',      type: 'rare', speakers: 'Ааракокры', script: '—' },
  { id: 'gith',        name: 'Гитский',        type: 'rare', speakers: 'Гитъянки, гитцераи', script: 'Тир\'су' },
  { id: 'grung',       name: 'Грунгский',      type: 'rare', speakers: 'Грунги', script: '—' },
  { id: 'druidic',     name: 'Друидический',   type: 'secret', speakers: 'Только друиды', script: '—' },
  { id: 'thieves-cant',name: 'Воровской жаргон', type: 'secret', speakers: 'Плуты', script: '—' }
];

/* Инструменты. cat: artisan — ремесленника, instrument — музыкальный, gaming — игровой набор, kit — прочие наборы, vehicle — транспорт */
DND.data.tools = [
  { id: 'alchemist',   name: 'Инструменты алхимика', cat: 'artisan', cost: 50 },
  { id: 'potter',      name: 'Инструменты гончара', cat: 'artisan', cost: 10 },
  { id: 'tinker',      name: 'Инструменты жестянщика', cat: 'artisan', cost: 50 },
  { id: 'calligrapher',name: 'Инструменты каллиграфа', cat: 'artisan', cost: 10 },
  { id: 'mason',       name: 'Инструменты каменщика', cat: 'artisan', cost: 10 },
  { id: 'cartographer',name: 'Инструменты картографа', cat: 'artisan', cost: 15 },
  { id: 'leatherworker',name:'Инструменты кожевника', cat: 'artisan', cost: 5 },
  { id: 'smith',       name: 'Инструменты кузнеца', cat: 'artisan', cost: 20 },
  { id: 'brewer',      name: 'Инструменты пивовара', cat: 'artisan', cost: 20 },
  { id: 'carpenter',   name: 'Инструменты плотника', cat: 'artisan', cost: 8 },
  { id: 'cook',        name: 'Инструменты повара', cat: 'artisan', cost: 1 },
  { id: 'woodcarver',  name: 'Инструменты резчика по дереву', cat: 'artisan', cost: 1 },
  { id: 'cobbler',     name: 'Инструменты сапожника', cat: 'artisan', cost: 5 },
  { id: 'glassblower', name: 'Инструменты стеклодува', cat: 'artisan', cost: 30 },
  { id: 'weaver',      name: 'Инструменты ткача', cat: 'artisan', cost: 1 },
  { id: 'painter',     name: 'Инструменты художника', cat: 'artisan', cost: 10 },
  { id: 'jeweler',     name: 'Инструменты ювелира', cat: 'artisan', cost: 25 },
  { id: 'drum',        name: 'Барабан', cat: 'instrument', cost: 6 },
  { id: 'viol',        name: 'Виола', cat: 'instrument', cost: 30 },
  { id: 'bagpipes',    name: 'Волынка', cat: 'instrument', cost: 30 },
  { id: 'lyre',        name: 'Лира', cat: 'instrument', cost: 30 },
  { id: 'lute',        name: 'Лютня', cat: 'instrument', cost: 35 },
  { id: 'horn',        name: 'Рожок', cat: 'instrument', cost: 3 },
  { id: 'panflute',    name: 'Свирель', cat: 'instrument', cost: 12 },
  { id: 'flute',       name: 'Флейта', cat: 'instrument', cost: 2 },
  { id: 'dulcimer',    name: 'Цимбалы', cat: 'instrument', cost: 25 },
  { id: 'shawm',       name: 'Шалмей', cat: 'instrument', cost: 2 },
  { id: 'dice-set',    name: 'Кости (игровой набор)', cat: 'gaming', cost: 0.1 },
  { id: 'chess',       name: 'Драконьи шахматы', cat: 'gaming', cost: 1 },
  { id: 'cards',       name: 'Карты (игровой набор)', cat: 'gaming', cost: 0.5 },
  { id: 'three-dragon',name: 'Ставка трёх драконов', cat: 'gaming', cost: 1 },
  { id: 'thieves',     name: 'Воровские инструменты', cat: 'kit', cost: 25 },
  { id: 'navigator',   name: 'Инструменты навигатора', cat: 'kit', cost: 25 },
  { id: 'poisoner',    name: 'Инструменты отравителя', cat: 'kit', cost: 50 },
  { id: 'disguise',    name: 'Набор для грима', cat: 'kit', cost: 25 },
  { id: 'forgery',     name: 'Набор для фальсификации', cat: 'kit', cost: 15 },
  { id: 'herbalism',   name: 'Набор травника', cat: 'kit', cost: 5 },
  { id: 'vehicle-land',name: 'Транспорт (наземный)', cat: 'vehicle' },
  { id: 'vehicle-water',name:'Транспорт (водный)', cat: 'vehicle' }
];
DND.data.toolCats = { artisan: 'инструменты ремесленника', instrument: 'музыкальный инструмент', gaming: 'игровой набор', kit: 'набор', vehicle: 'транспорт' };

DND.data.alignments = [
  { id: 'lg', name: 'Законно-добрый',    short: 'ЗД', desc: 'Поступает правильно, как того ожидает общество. Паладин, верный клятве.' },
  { id: 'ng', name: 'Нейтрально-добрый', short: 'НД', desc: 'Делает добро, не держась ни за правила, ни против них.' },
  { id: 'cg', name: 'Хаотично-добрый',   short: 'ХД', desc: 'Делает добро по велению совести, плевать на чужие ожидания.' },
  { id: 'ln', name: 'Законно-нейтральный', short: 'ЗН', desc: 'Живёт по закону, традиции или личному кодексу.' },
  { id: 'n',  name: 'Нейтральный',       short: 'Н',  desc: 'Держится в стороне от морали, поступает по обстоятельствам.' },
  { id: 'cn', name: 'Хаотично-нейтральный', short: 'ХН', desc: 'Следует своим прихотям, свободу ценит выше всего.' },
  { id: 'le', name: 'Законно-злой',      short: 'ЗЗ', desc: 'Берёт своё методично, в рамках традиции или порядка.' },
  { id: 'ne', name: 'Нейтрально-злой',   short: 'НЗ', desc: 'Делает что угодно, если это сойдёт с рук.' },
  { id: 'ce', name: 'Хаотично-злой',     short: 'ХЗ', desc: 'Жестокость ради прихоти, ярости или жажды. Для игроков — только по договорённости.' }
];

/* Боги Фаэруна (КИ, приложение Б). domains — рекомендуемые домены. */
DND.data.deities = [
  { id: 'azuth',     name: 'Азут',      title: 'бог волшебников', al: 'ЗН', domains: ['Знание'], symbol: 'Очерченная огнём левая рука' },
  { id: 'amberlee',  name: 'Амберли',   title: 'богиня морей', al: 'ХЗ', domains: ['Буря'], symbol: 'Волны, расходящиеся влево и вправо' },
  { id: 'bane',      name: 'Бэйн',      title: 'бог тирании', al: 'ЗЗ', domains: ['Война'], symbol: 'Чёрная кисть правой руки' },
  { id: 'beshaba',   name: 'Бешаба',    title: 'богиня несчастья', al: 'ХЗ', domains: ['Обман'], symbol: 'Чёрные оленьи рога' },
  { id: 'bhaal',     name: 'Баал',      title: 'бог убийства', al: 'НЗ', domains: ['Смерть'], symbol: 'Череп в кольце капель крови' },
  { id: 'waukeen',   name: 'Вокин',     title: 'богиня торговли', al: 'Н', domains: ['Знание', 'Обман'], symbol: 'Монета с профилем Вокин' },
  { id: 'gond',      name: 'Гонд',      title: 'бог ремёсел', al: 'Н', domains: ['Знание'], symbol: 'Зубчатая шестерёнка' },
  { id: 'deneir',    name: 'Денеир',    title: 'бог письменности', al: 'НД', domains: ['Знание'], symbol: 'Горящая свеча над открытым глазом' },
  { id: 'ilmater',   name: 'Ильматер',  title: 'бог стойкости', al: 'ЗД', domains: ['Жизнь'], symbol: 'Руки, связанные в запястьях красной верёвкой' },
  { id: 'kelemvor',  name: 'Келемвор',  title: 'бог смерти', al: 'ЗН', domains: ['Смерть'], symbol: 'Рука скелета с весами' },
  { id: 'lathander', name: 'Латандер',  title: 'бог рождения и обновления', al: 'НД', domains: ['Жизнь', 'Свет'], symbol: 'Дорога к восходящему солнцу' },
  { id: 'leira',     name: 'Лейра',     title: 'богиня иллюзий', al: 'ХН', domains: ['Обман'], symbol: 'Треугольник вершиной вниз в тумане' },
  { id: 'lliira',    name: 'Ллиира',    title: 'богиня веселья', al: 'ХД', domains: ['Жизнь'], symbol: 'Три шестиконечные звезды' },
  { id: 'loviatar',  name: 'Ловиатар',  title: 'богиня боли', al: 'ЗЗ', domains: ['Смерть'], symbol: 'Девятихвостая плеть' },
  { id: 'mielikki',  name: 'Майликки',  title: 'богиня лесов', al: 'НД', domains: ['Природа'], symbol: 'Голова единорога' },
  { id: 'malar',     name: 'Малар',     title: 'бог охоты', al: 'ХЗ', domains: ['Природа'], symbol: 'Когтистая лапа' },
  { id: 'mask',      name: 'Маск',      title: 'бог воров', al: 'ХН', domains: ['Обман'], symbol: 'Чёрная маска' },
  { id: 'milil',     name: 'Милил',     title: 'бог поэзии и песен', al: 'НД', domains: ['Свет'], symbol: 'Пятиструнная арфа из листьев' },
  { id: 'myrkul',    name: 'Миркул',    title: 'бог смерти', al: 'НЗ', domains: ['Смерть'], symbol: 'Белый человеческий череп' },
  { id: 'mystra',    name: 'Мистра',    title: 'богиня магии', al: 'НД', domains: ['Знание'], symbol: 'Круг из семи звёзд' },
  { id: 'oghma',     name: 'Огма',      title: 'бог знаний', al: 'Н', domains: ['Знание'], symbol: 'Чистый свиток' },
  { id: 'auril',     name: 'Ориль',     title: 'богиня зимы', al: 'НЗ', domains: ['Буря', 'Природа'], symbol: 'Шестиконечная снежинка' },
  { id: 'savras',    name: 'Саврас',    title: 'бог предсказаний и судьбы', al: 'ЗН', domains: ['Знание'], symbol: 'Хрустальный шар' },
  { id: 'selune',    name: 'Селунэ',    title: 'богиня луны', al: 'ХД', domains: ['Жизнь', 'Знание'], symbol: 'Глаза в кольце из семи звёзд' },
  { id: 'silvanus',  name: 'Сильванус', title: 'бог дикой природы', al: 'Н', domains: ['Природа'], symbol: 'Дубовый лист' },
  { id: 'sune',      name: 'Сьюни',     title: 'богиня любви и красоты', al: 'ХД', domains: ['Жизнь', 'Свет'], symbol: 'Лицо рыжеволосой красавицы' },
  { id: 'talona',    name: 'Талона',    title: 'богиня болезней и ядов', al: 'ХЗ', domains: ['Смерть'], symbol: 'Три капли в треугольнике' },
  { id: 'talos',     name: 'Талос',     title: 'бог бурь', al: 'ХЗ', domains: ['Буря'], symbol: 'Три молнии из одной точки' },
  { id: 'tempus',    name: 'Темпус',    title: 'бог войны', al: 'Н', domains: ['Война'], symbol: 'Вертикальный пламенеющий меч' },
  { id: 'torm',      name: 'Торм',      title: 'бог отваги и самопожертвования', al: 'ЗД', domains: ['Война'], symbol: 'Правая латная рукавица' },
  { id: 'tymora',    name: 'Тимора',    title: 'богиня удачи', al: 'ХД', domains: ['Обман'], symbol: 'Монета решкой вверх' },
  { id: 'tyr',       name: 'Тир',       title: 'бог правосудия', al: 'ЗД', domains: ['Война'], symbol: 'Весы на боевом молоте' },
  { id: 'helm',      name: 'Хельм',     title: 'бог защиты', al: 'ЗН', domains: ['Жизнь', 'Свет'], symbol: 'Глаз на латной рукавице' },
  { id: 'cyric',     name: 'Цирик',     title: 'бог лжи', al: 'ХЗ', domains: ['Обман'], symbol: 'Белый череп без челюсти на солнце' },
  { id: 'chauntea',  name: 'Чонтия',    title: 'богиня земледелия', al: 'НД', domains: ['Жизнь'], symbol: 'Пучок колосьев' },
  { id: 'shar',      name: 'Шар',       title: 'богиня тьмы и утрат', al: 'НЗ', domains: ['Обман', 'Смерть'], symbol: 'Чёрный диск с фиолетовым контуром' },
  { id: 'eldath',    name: 'Эльдат',    title: 'богиня мира', al: 'НД', domains: ['Жизнь', 'Природа'], symbol: 'Водопад в спокойное озеро' },
  /* Нечеловеческие божества, которым поклоняются в Фаэруне */
  { id: 'bahamut',   name: 'Багамут',   title: 'драконий бог добра', al: 'ЗД', domains: ['Война', 'Жизнь'], symbol: 'Профиль драконьей головы', nonhuman: true },
  { id: 'garl',      name: 'Гарл Златоблеск', title: 'гномий бог обмана и уловок', al: 'ЗД', domains: ['Обман'], symbol: 'Золотой самородок', nonhuman: true },
  { id: 'sashelas',  name: 'Глубинный Сашелас', title: 'эльфийский бог морей', al: 'ХД', domains: ['Буря', 'Природа'], symbol: 'Дельфин', nonhuman: true },
  { id: 'gruumsh',   name: 'Груумш',    title: 'орочий бог бурь и войны', al: 'ХЗ', domains: ['Буря', 'Война'], symbol: 'Немигающий глаз', nonhuman: true },
  { id: 'yondalla',  name: 'Йондалла',  title: 'богиня плодородия и защиты полуросликов', al: 'ЗД', domains: ['Жизнь'], symbol: 'Щит', nonhuman: true },
  { id: 'corellon',  name: 'Кореллон Ларетиан', title: 'эльфийский бог искусства и магии', al: 'ХД', domains: ['Свет'], symbol: 'Месяц или звезда', nonhuman: true },
  { id: 'kurtulmak', name: 'Куртулмак', title: 'кобольдский бог войны и горного дела', al: 'ЗЗ', domains: ['Война'], symbol: 'Кирка', nonhuman: true },
  { id: 'lolth',     name: 'Лолс',      title: 'богиня пауков дроу', al: 'ХЗ', domains: ['Обман'], symbol: 'Паук', nonhuman: true },
  { id: 'maglubiyet',name: 'Маглубиет', title: 'гоблинский бог войны', al: 'ЗЗ', domains: ['Война'], symbol: 'Окровавленный топор', nonhuman: true },
  { id: 'moradin',   name: 'Морадин',   title: 'дварфийский бог созидания', al: 'ЗД', domains: ['Знание'], symbol: 'Молот и наковальня', nonhuman: true },
  { id: 'rillifane', name: 'Риллифэйн Раллатил', title: 'бог природы лесных эльфов', al: 'ХД', domains: ['Природа'], symbol: 'Дуб', nonhuman: true },
  { id: 'sehanine',  name: 'Сеанин Лунный Лук', title: 'эльфийская богиня луны', al: 'ХД', domains: ['Знание'], symbol: 'Полумесяц', nonhuman: true },
  { id: 'semuanya',  name: 'Семуанья',  title: 'богиня выживания людоящеров', al: 'Н', domains: ['Жизнь'], symbol: 'Яйцо', nonhuman: true },
  { id: 'tiamat',    name: 'Тиамат',    title: 'драконья богиня зла', al: 'ЗЗ', domains: ['Обман'], symbol: 'Пятиглавый дракон', nonhuman: true },
  { id: 'hruggek',   name: 'Хруггек',   title: 'бог жестокости багбиров', al: 'ХЗ', domains: ['Война'], symbol: 'Моргенштерн', nonhuman: true }
];

/* Этносы людей Фаэруна (КИ, гл. 2) — только для описания. */
DND.data.ethnicities = [
  { id: 'calishite',  name: 'Калишит',     desc: 'Смуглые жители юго-запада (Калимшан). Невысокие, темноглазые.' },
  { id: 'chondathan', name: 'Чондатанец',  desc: 'Самые распространённые люди Побережья Мечей и центра Фаэруна.' },
  { id: 'damaran',    name: 'Дамарец',     desc: 'Северо-запад Фаэруна: крепкие, от светлой до смуглой кожи.' },
  { id: 'illuskan',   name: 'Иллусканец',  desc: 'Северяне побережья: высокие, светлокожие, часто светловолосые.' },
  { id: 'mulan',      name: 'Мулан',       desc: 'Восток (Тэй, Муладан): высокие, с янтарной кожей; знать бреет головы.' },
  { id: 'rashemi',    name: 'Рашеми',      desc: 'Земли за Внутренним морем: невысокие, крепкие, темноволосые.' },
  { id: 'shou',       name: 'Шу',          desc: 'Выходцы из далёкого Кара-Тура.' },
  { id: 'tethyrian',  name: 'Тетирец',     desc: 'Потомки смешения народов Побережья Мечей; очень разные внешне.' },
  { id: 'turami',     name: 'Тёрами',      desc: 'Южное побережье Внутреннего моря: высокие, темнокожие.' }
];

DND.data.damageTypes = {
  acid: 'кислотой', bludgeoning: 'дробящий', cold: 'холодом', fire: 'огнём', force: 'силовым полем',
  lightning: 'электричеством', necrotic: 'некротической энергией', piercing: 'колющий', poison: 'ядом',
  psychic: 'психической энергией', radiant: 'излучением', slashing: 'рубящий', thunder: 'звуком'
};
DND.data.damageNames = {
  acid: 'кислота', bludgeoning: 'дробящий', cold: 'холод', fire: 'огонь', force: 'силовое поле',
  lightning: 'электричество', necrotic: 'некротическая энергия', piercing: 'колющий', poison: 'яд',
  psychic: 'психическая энергия', radiant: 'излучение', slashing: 'рубящий', thunder: 'звук'
};

/* Опыт по уровням и бонус мастерства */
DND.data.xp = [0, 300, 900, 2700];
DND.data.profBonus = [2, 2, 2, 2];
