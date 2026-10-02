/* Подсказки Кузницы: строки-сводки для карточек вариантов (raceLine, spellHeader, asiText) и мост к общим подсказкам Кодекса. */
(function () {
  const D = DND.data, I = DND.idx, U = DND.util, esc = U.esc;
  const T = DND.tips = {};
  const asiText = (o) => o ? Object.entries(o).map(([a, n]) => (n > 0 ? '+' : '−') + Math.abs(n) + ' ' + I.abilShort(a)).join(', ') : '';
  T.asiText = asiText;

  T.raceLine = function (r, s) {
    const asi = Object.assign({}, r.asi || {});
    if (s && s.asi) for (const [a, n] of Object.entries(s.asi)) asi[a] = (asi[a] || 0) + n;
    const parts = [];
    let a = asiText(asi);
    if (r.id === 'half-elf') a = '+2 Хар, +1 к двум';
    if (r.id === 'human' && !s) a = '+1 ко всем или вариант';
    if (r.id === 'custom-lineage') a = '+2 к одной';
    if (r.id === 'tiefling' && !s) a = '+2 Хар, +1 по линии';
    if (r.id === 'genasi' && !s) a = '+2 Тел, +1 по стихии';
    if (a) parts.push(a);
    parts.push((s && s.traits && s.traits.some((t) => t.grants && t.grants.speed) ? s.traits.find((t) => t.grants && t.grants.speed).grants.speed : r.speed) + ' фт');
    const dv = [].concat(r.traits || [], (s && s.traits) || []).map((t) => t.grants && t.grants.darkvision).filter(Boolean);
    if (dv.length) parts.push('тёмное зрение ' + Math.max(...dv));
    if (r.size === 'Маленький') parts.push('маленький');
    return parts.join(' · ');
  };


  T.spellHeader = (sp) => [sp.lvl ? sp.lvl + ' круг' : 'Заговор', D.schools[sp.school], sp.time, sp.range, sp.comp.replace(/\s*\(.*\)/, ' (М)').replace(/М \(М\)/, 'М'), sp.dur].join(' · ');

  /* ───── Поведение (v2): одна .tip-card на всю экосистему — карточки Кодекса (shared/tips.js) ─────
     Разметка Кузницы не меняется: data-tip="вид:id" (виды Кузницы). Здесь он переводится в ссылку Кодекса data-ref:
     — карточка с «i» (.info-btn): ссылка ставится на «i» — наведение и нажатие на «i» открывают карточку, щелчок по карточке выбирает;
     — чип выбора (кнопка): data-ref-mode="hover" — наведение открывает карточку, щелчок выбирает; на телефоне — долгое нажатие;
     — простой текст (предмет, характеристика): обычная ссылка-термин, щелчок открывает карточку.
     Если статьи в Кодексе нет, у элемента просто нет подсказки. */
  const KIND = { race: 'race', subrace: 'subrace', class: 'class', subclass: 'sub', background: 'bg', spell: 'spell', feat: 'feat', skill: 'skill',
    ability: 'abil', language: 'lang', tool: 'tool', deity: 'deity', alignment: 'align', item: 'item', option: 'option', feature: 'feature' };
  T.ref = function (spec) {
    const i = spec.indexOf(':'); if (i < 0) return null;
    const kind = KIND[spec.slice(0, i)]; let id = spec.slice(i + 1);
    if (!kind) return null;
    if (kind === 'option') id = id.replace('|', '-');
    const C = window.FR && FR.codex;
    return C && C.get(kind, id) ? kind + ':' + id : null;
  };
  function wire(root) {
    (root.querySelectorAll ? root : document).querySelectorAll('[data-tip]:not([data-tip-ok])').forEach((el) => {
      el.setAttribute('data-tip-ok', '');
      const ref = T.ref(el.getAttribute('data-tip')); if (!ref) return;
      const info = el.querySelector('.info-btn');
      if (info) { info.setAttribute('data-ref', ref); return; }
      el.setAttribute('data-ref', ref);
      if (el.matches('button,[role="button"],[data-act],label,input')) el.setAttribute('data-ref-mode', 'hover');
      else if (!el.classList.contains('ref')) el.classList.add('ref');
    });
  }
  T.show = function (el) { const r = el.getAttribute('data-ref') || T.ref(el.getAttribute('data-tip') || ''); if (r && window.FR && FR.tips) FR.tips.open(r, el); };
  T.hide = function () { if (window.FR && FR.tips) FR.tips.closeAll(); };
  T.init = function () {
    if (T._init) return; T._init = true;
    if (!(window.FR && FR.tips)) return;
    wire(document);
    new MutationObserver((ms) => { for (const m of ms) if (m.addedNodes.length) { wire(document); break; } }).observe(document.body, { childList: true, subtree: true });
    // «i» внутри карточки-кнопки: открыть подсказку и не выбрать карточку
    document.addEventListener('click', (e) => {
      const b = e.target.closest('.info-btn'); if (!b) return;
      e.preventDefault(); e.stopPropagation();
      const r = b.getAttribute('data-ref'); if (r) FR.tips.open(r, b);
    }, true);
    // долгое нажатие на телефоне — подсказка для чипов и карточек
    let lp = 0, fired = null;
    document.addEventListener('touchstart', (e) => {
      const el = e.target.closest('[data-ref-mode="hover"],[data-tip]'); if (!el) return;
      const r = el.getAttribute('data-ref') || (el.querySelector('.info-btn') || el).getAttribute('data-ref'); if (!r) return;
      lp = setTimeout(() => { fired = el; FR.tips.open(r); }, 480);
    }, { passive: true });
    document.addEventListener('touchend', (e) => { clearTimeout(lp); if (fired) { e.preventDefault(); fired = null; } });
    document.addEventListener('touchmove', () => clearTimeout(lp), { passive: true });
  };
})();
