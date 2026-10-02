/* Настройки сайта. Меняй здесь, остальной код трогать не нужно. */
window.DND = window.DND || {};
DND.config = {
  version: 1,
  title: 'Кузница героев',
  subtitle: 'Создание персонажа · D&D 5e (2014) · Фаэрун',

  /* Ссылки «Подробнее в справочнике →» в подсказках.
     Когда появится сайт со справочником, впиши его адрес в refBase, например:
       refBase: 'https://username.github.io/dnd-spravochnik/'
     Пути для каждого раздела — в refPaths; {id} заменяется на id пункта
     (список всех id — в docs/ids.md). Если refBase = '' — кнопки нет.
     Чтобы убрать ссылку для одного раздела, поставь ему null. */
  refBase: '',
  refPaths: {
    race:       'races/{id}.html',
    subrace:    'races/{id}.html',
    class:      'classes/{id}.html',
    subclass:   'subclasses/{id}.html',
    feature:    'features/{id}.html',
    option:     'options/{id}.html',
    background: 'backgrounds/{id}.html',
    spell:      'spells/{id}.html',
    feat:       'feats/{id}.html',
    item:       'equipment/{id}.html',
    skill:      'rules/skills.html#{id}',
    language:   'rules/languages.html#{id}',
    tool:       'equipment/tools.html#{id}',
    deity:      'lore/deities.html#{id}'
  },

  /* Настройки мастера по умолчанию (игрок видит их на шаге «Основа»). */
  defaults: {
    level: 1,
    allowExotic: true,        // показывать экзотические расы (Ааракокра, Грунг, Локата…)
    allowCustomLineage: true, // «Своё происхождение» (Таша)
    allowTashaOrigin: true,   // «Настройка происхождения»: перенос расовых бонусов (Таша)
    allowTashaOptional: true, // необязательные умения классов из Таши
    hpMode: 'avg'             // 'avg' — среднее за уровень, 'roll' — бросок
  }
};
