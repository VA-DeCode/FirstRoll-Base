/* Кодекс · список файлов статей. Страница подключает только этот файл:
     <script src="…/codex/load.js"></script>
   он дописывает теги <script> для всех файлов ниже (работает и с диска, file://).
   Новый файл статей — добавить строку в FILES. Порядок: сначала статьи, потом данные Кузницы и импорт
   (импорт дополняет ручные статьи механикой, см. import/forge.js). Node: require('./codex/load.js') → список. */
(function () {
  const FILES = [
    'data/rules.js',
    'data/rules-core.js',
    'data/rules-adventure.js',
    'data/rules-combat.js',
    'data/rules-magic.js',
    'data/actions.js',
    'data/conditions.js',
    'data/damage.js',
    'data/guide.js',
    // хоумбрю наших кампаний (ведёт tools/homebrew.js; скрытое vis:'dm' в публичную сборку не попадает)
    'data/homebrew/bestiary.js',
    'data/homebrew/items.js',
    'data/homebrew/other.js'
  ];
  const FORGE = '../forge/data/';
  const FORGE_FILES = ['common', 'equipment', 'races', 'classes', 'backgrounds', 'feats', 'spells', 'options'];
  const ALL = FILES.concat(FORGE_FILES.map((n) => FORGE + n + '.js'), ['import/forge.js']);
  if (typeof module !== 'undefined' && module.exports) { module.exports = ALL; return; }
  const base = document.currentScript.src.replace(/[^/]*$/, '');
  // В Кузнице её данные уже на странице — второй раз не грузим
  const have = window.DND && DND.data && DND.data.races;
  ALL.filter((f) => !(have && f.indexOf(FORGE) === 0)).forEach((f) => document.write('<script src="' + base + encodeURI(f) + '"><\/script>'));
})();
