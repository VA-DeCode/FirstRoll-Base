/* Кузница внутри сайта FirstRoll (Кузница v2): свои кнопки раздела в общей шапке и меню телефона,
   потом шапка, подвал, тема и статус Стола — общие (shared/site.js).
   Страница: <body data-section="forge" data-page="builder|sheet|load" data-root="../">. */
(function () {
  const S = window.FR && FR.site; if (!S) return;
  const page = document.body.dataset.page || 'builder';
  const DL = '<svg width="18" height="18" viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 2v8M4.5 6.5 8 10l3.5-3.5M2.5 13.5h11"/></svg>';
  const PLUS = '<svg width="18" height="18" viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M8 3v10M3 8h10"/></svg>';
  const load = `<a class="hbtn wide" href="load.html" aria-label="Загрузить по коду">${DL}<span class="lbl">Загрузить по коду</span></a>`;
  const fresh = `<a class="hbtn wide" href="index.html" aria-label="Новый герой">${PLUS}<span class="lbl">Конструктор</span></a>`;
  S.headExtra = page === 'builder' ? '<span class="saved" id="saved" role="status"></span>' + load : page === 'sheet' ? load : fresh;
  S.menuExtra = page === 'load' ? `<a href="index.html">${PLUS}Конструктор героя</a>` : `<a href="load.html">${DL}Загрузить по коду</a>`;
  S.init();
})();
