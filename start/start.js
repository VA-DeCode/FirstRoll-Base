/* Первые шаги · учебник для новичков (макет Claude Design «Первые шаги»): оглавление с прогрессом и глава.
   Главы — атомы kind:'guide' из codex/data/guide.js. Адреса: start/ — оглавление, start/#dice — глава.
   Прогресс чтения хранится в этом браузере (localStorage 'fr-start-read'). Термины в тексте открывают подсказки Кодекса. */
(function () {
  const FR = window.FR, C = FR.codex, S = FR.site, esc = C.esc;
  const D = document, app = D.getElementById('app');
  const store = { get(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
  FR.config.kindUrl = Object.assign(FR.config.kindUrl || {}, { guide: '#{id}' });   // главы — на этой же странице; статьи Кодекса — адрес по умолчанию от data-root

  const CH = C.byKind('guide').filter((a) => a.vis !== 'hidden').sort((x, y) => (x.n || 0) - (y.n || 0));
  const read = () => store.get('fr-start-read', []);
  const setRead = (id, on) => { const r = read().filter((x) => x !== id); if (on) r.push(id); store.set('fr-start-read', r); };
  const mins = (n) => { const m10 = n % 10, m100 = n % 100; return n + ' ' + (m10 === 1 && m100 !== 11 ? 'минута' : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? 'минуты' : 'минут'); };
  const total = CH.reduce((s, a) => s + (a.min || 0), 0);
  const nextUnread = () => CH.find((a) => !read().includes(a.id));

  function toc() {
    D.title = 'Первые шаги · FirstRoll';
    const r = read(), nx = nextUnread();
    const rows = CH.map((a) => {
      const done = r.includes(a.id), curr = nx === a;
      const st = done ? 'Прочитано' : curr ? (r.length ? 'Дальше' : 'Начни здесь') : mins(a.min || 5);
      return `<li><a class="st-row${done ? ' is-done' : ''}${curr ? ' is-cur' : ''}" href="#${esc(a.id)}">
        <span class="st-num">${a.n}</span>
        <span class="st-rt"><b>${esc(a.name)}</b><span>${esc(a.summary || '')}</span><em class="st-stm">${esc(st)}</em></span>
        <span class="st-rs"><em>${esc(st)}</em><small>${esc(mins(a.min || 5))}</small></span>
        <span class="st-dot">${done ? '✓' : ''}</span></a></li>`;
    }).join('');
    app.innerHTML = `<div class="st-toc">
      <section class="st-hero">
        <p class="eyebrow">Учебник для новичков · ${CH.length} глав · ${esc(mins(total))}</p>
        <h1 class="h-display">Первые шаги</h1>
        <p class="lead">Никогда не играл? Прочитай по порядку — к первой сессии будешь знать всё, что нужно, чтобы не теряться за столом.</p>
        <div class="st-prog"><div class="st-prog-h"><span>Прочитано ${r.filter((id) => CH.some((a) => a.id === id)).length} из ${CH.length}</span><span>в этом браузере</span></div>
          <div class="st-bars" style="grid-template-columns:repeat(${CH.length},1fr)">${CH.map((a) => `<span class="${r.includes(a.id) ? 'done' : nx === a ? 'cur' : ''}"></span>`).join('')}</div></div>
        ${nx ? `<a class="btn btn-accent st-go" href="#${esc(nx.id)}">${r.length ? 'Продолжить: глава ' + nx.n : 'Начать: глава 1'} →</a>` : `<p class="st-alldone">Все главы прочитаны. Дальше — <a href="${esc(S.href('forge'))}">собрать персонажа</a> в Кузнице.</p>`}
      </section>
      <div class="orn" aria-hidden="true"><span>◆</span></div>
      <ol class="st-list">${rows}</ol>
    </div>`;
  }

  /* Блоки учебника «::: вид [заголовок] … :::» (строки внутри — через « | »):
     ::: сценка            Мастер: реплика                       → сценка за столом
     ::: ошибки [заголовок] не так | так                          → «Частые ошибки» (v2)
     ::: пример заголовок   шаг | бросок | итог                   → «Разобранный пример» (v2)
     ::: герои              Имя | кто | числа                     → карточки героев партии (v2) */
  const cells = (l) => l.split('|').map((x) => x.trim());
  const BLOCK = {
    'сценка': (lines) => `<figure class="st-scene"><figcaption>Сценка за столом</figcaption>${lines.map((l) => {
      const m = /^([^:]{1,40}):\s*(.+)$/.exec(l); const [w, t] = m ? [m[1], m[2]] : ['', l];
      return `<div><span class="${/^мастер/i.test(w) ? 'dm' : 'pl'}">${esc(w)}</span><span>${C.inline(t)}</span></div>`; }).join('')}</figure>`,
    'ошибки': (lines, title) => `<section class="st-mistakes"><b>${esc(title || 'Частые ошибки')}</b><div><span class="h no">✗ Не так</span><span class="h yes">✓ Так</span>${
      lines.map((l) => { const [a, b] = cells(l); return `<span>${C.inline(a)}</span><span>${C.inline(b || '')}</span>`; }).join('')}</div></section>`,
    'пример': (lines, title) => `<section class="st-example">${title ? `<b>${esc(title)}</b>` : ''}<div class="h"><span>№</span><span>Шаг</span><span>Бросок</span><span>Итог</span></div>${
      lines.map((l, i) => { const [a, b, c] = cells(l); const ok = /^✓/.test(c || '') ? ' class="ok"' : /^✗/.test(c || '') ? ' class="no"' : '';
        return `<div><span>${i + 1}</span><span>${C.inline(a)}</span><span>${C.inline(b || '—')}</span><span${ok}>${C.inline(c || '')}</span></div>`; }).join('')}</section>`,
    'герои': (lines) => `<div class="st-heroes">${lines.map((l) => { const [n, d, x] = cells(l);
      return `<div class="st-hero-card"><b>${esc(n)}</b><span>${C.inline(d || '')}</span>${x ? `<small>${C.inline(x)}</small>` : ''}</div>`; }).join('')}</div>`
  };
  function body(md) {
    const parts = String(md || '').split(/^:::[ \t]*(сценка|ошибки|пример|герои)[ \t]*([^\n]*)$([\s\S]*?)^:::\s*$/m);
    let out = '';
    for (let i = 0; i < parts.length; i += 4) {
      out += C.md(parts[i]);
      if (i + 1 < parts.length) out += BLOCK[parts[i + 1]](parts[i + 3].trim().split('\n').map((l) => l.trim()).filter(Boolean), parts[i + 2].trim());
    }
    return out;
  }

  const ans = {};
  function chapter(a) {
    D.title = a.name + ' · Первые шаги';
    const i = CH.indexOf(a), prev = CH[i - 1], next = CH[i + 1], r = read();
    const quiz = a.quiz || [];
    app.innerHTML = `<article class="st-ch">
      <nav class="cx-crumbs st-crumbs" aria-label="Путь"><a href="#">Первые шаги</a><span aria-hidden="true">›</span><span class="cur">Глава ${a.n}</span></nav>
      <header class="st-chh">
        <div class="st-dots">${CH.map((c) => `<a href="#${esc(c.id)}" aria-label="Глава ${c.n}" class="${c === a ? 'cur' : r.includes(c.id) ? 'done' : ''}"></a>`).join('')}</div>
        <p class="eyebrow">Глава ${a.n} из ${CH.length} · ${esc(mins(a.min || 5))}</p>
        <h1 class="h-display">${esc(a.name)}</h1>
        <div class="orn" aria-hidden="true" style="width:220px"><span>◆</span></div>
      </header>
      <div class="fr-md st-body">${body(a.body)}</div>
      ${quiz.length ? `<section class="st-quiz"><div class="st-qh"><b>Проверь себя</b><span>${quiz.length} ${quiz.length === 1 ? 'вопрос' : quiz.length < 5 ? 'вопроса' : 'вопросов'} · по желанию</span></div>
        ${quiz.map((q, qi) => `<div class="st-q" data-q="${qi}"><p><b>${qi + 1}.</b> ${C.inline(q.q)}</p><div class="st-opts">${q.opts.map((o, oi) => `<button type="button" data-o="${oi}"><i></i><span>${C.inline(o)}</span></button>`).join('')}</div><p class="st-fb" hidden></p></div>`).join('')}</section>` : ''}
      <footer class="st-end">
        <div class="orn3" aria-hidden="true"><span>◆◆◆</span></div>
        <button class="btn st-read" type="button"></button>
        ${next ? `<a class="st-next" href="#${esc(next.id)}"><span><small>Дальше · глава ${next.n}</small><b>${esc(next.name)}</b></span><i>→</i></a>`
          : `<a class="st-next" href="${esc(S.href('forge'))}"><span><small>Учебник пройден</small><b>Собрать персонажа в Кузнице</b></span><i>→</i></a>`}
        ${prev ? `<a class="st-prev" href="#${esc(prev.id)}">← Глава ${prev.n} · ${esc(prev.name)}</a>` : `<a class="st-prev" href="#">← Оглавление</a>`}
      </footer>
    </article>`;
    const rb = app.querySelector('.st-read');
    const paint = () => { const on = read().includes(a.id); rb.textContent = on ? '✓ Глава прочитана' : 'Отметить прочитанной'; rb.classList.toggle('is-on', on); };
    rb.onclick = () => { setRead(a.id, !read().includes(a.id)); paint(); app.querySelectorAll('.st-dots a')[i].className = read().includes(a.id) ? 'cur done' : 'cur'; };
    paint();
    const nx = app.querySelector('.st-next'); if (nx && next) nx.addEventListener('click', () => setRead(a.id, true));
    app.querySelectorAll('.st-q').forEach((box) => {
      const qi = +box.dataset.q, q = quiz[qi];
      const show = () => {
        const pick = ans[a.id + qi]; if (pick == null) return;
        box.querySelectorAll('[data-o]').forEach((b) => { const oi = +b.dataset.o; b.className = oi === q.right ? 'good' : oi === pick ? 'bad' : ''; b.querySelector('i').textContent = oi === q.right ? '✓' : oi === pick ? '✕' : ''; });
        const fb = box.querySelector('.st-fb'); fb.hidden = false; fb.className = 'st-fb ' + (pick === q.right ? 'good' : 'bad');
        fb.innerHTML = `<b>${pick === q.right ? 'Верно.' : 'Не совсем.'}</b> ${C.inline(pick === q.right ? q.ok : q.no)}`;
      };
      box.querySelectorAll('[data-o]').forEach((b) => { b.onclick = () => { ans[a.id + qi] = +b.dataset.o; show(); }; });
      show();
    });
  }

  function render() {
    if (FR.tips) FR.tips.closeAll();
    const id = decodeURIComponent(location.hash.slice(1)), a = CH.find((c) => c.id === id);
    if (a) chapter(a); else toc();
    scrollTo(0, 0);
  }
  addEventListener('hashchange', render);
  S.init();
  render();
})();
