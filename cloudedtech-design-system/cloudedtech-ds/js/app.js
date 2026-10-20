/* ==========================================================================
   CloudEdTech CommunityLab — Prototipo
   Router por hash, roles, vistas con datos dummy y gráficos dinámicos.
   ========================================================================== */
(function () {
  'use strict';

  const D = window.CE_DATA;
  const CH = window.CECharts || null;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const nf = new Intl.NumberFormat('es-CL');
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const ic = window.icon;
  const sum = (a) => a.reduce((x, y) => x + y, 0);

  const SENT = {
    positive: { label: 'Positivo', pill: 'success' },
    neutral: { label: 'Neutral', pill: '' },
    question: { label: 'Pregunta', pill: 'info' },
    negative: { label: 'Negativo', pill: 'danger' },
  };
  const ROLE_LABEL = { admin: 'Administrador', reviewer: 'Revisor', community_manager: 'Community Manager', system: 'Sistema' };
  const AVATAR_TONES = ['', 'c-avatar--indigo', 'c-avatar--emerald', 'c-avatar--purple', 'c-avatar--slate'];
  const tone = (s) => AVATAR_TONES[[...s].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_TONES.length];

  // ---------- Utilidades UI ----------
  function toast(msg, type = '') {
    const t = document.createElement('div');
    t.className = 'c-toast' + (type ? ` c-toast--${type}` : '');
    t.innerHTML = `${ic(type === 'success' ? 'check-circle' : 'info')}<span>${esc(msg)}</span>`;
    $('#toasts').append(t);
    setTimeout(() => { t.classList.add('is-leaving'); t.addEventListener('animationend', () => t.remove()); }, 3200);
  }

  /** Cuenta animada hasta `to`. */
  function countTo(el, to, { duration = 900, suffix = '', decimals = 0 } = {}) {
    const from = parseFloat(el.dataset.n || '0');
    const start = performance.now();
    const f = new Intl.NumberFormat('es-CL', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    el.dataset.n = to;
    const step = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const e = 1 - Math.pow(1 - p, 3);
      el.textContent = f.format(from + (to - from) * e) + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /** Efecto de escritura para textos generados por IA. */
  function typewrite(el, text, speed = 12) {
    const isField = 'value' in el && el.tagName !== 'BUTTON';
    let i = 0;
    clearInterval(el._tw);
    el._tw = setInterval(() => {
      i += 2;
      const chunk = text.slice(0, i);
      if (isField) el.value = chunk; else el.textContent = chunk;
      el.dispatchEvent(new Event('input'));
      if (i >= text.length) clearInterval(el._tw);
    }, speed);
  }

  /** Ejecuta `fn` tras simular carga en un botón. */
  function busy(btn, ms, fn, label) {
    const html = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `${ic('refresh', 'icon--sm spin')}${label || 'Procesando…'}`;
    setTimeout(() => { btn.disabled = false; btn.innerHTML = html; fn && fn(); }, ms);
  }

  function progress(bar, pctEl, ms, onStep, done) {
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(100, Math.round(((now - start) / ms) * 100));
      bar.style.transition = 'none';
      bar.style.width = p + '%';
      if (pctEl) pctEl.textContent = p + '%';
      onStep && onStep(p);
      if (p < 100) requestAnimationFrame(tick); else done && done();
    };
    requestAnimationFrame(tick);
  }

  const tooltip = $('#tooltip');
  function showTip(e, html) { tooltip.innerHTML = html; tooltip.style.left = e.clientX + 'px'; tooltip.style.top = e.clientY + 'px'; tooltip.classList.add('is-visible'); }
  function hideTip() { tooltip.classList.remove('is-visible'); }

  const pill = (text, kind = '', dot = false) => `<span class="c-pill${kind ? ' c-pill--' + kind : ''}${dot ? ' c-pill--dot' : ''}">${esc(text)}</span>`;
  const trend = (v, unit = '%') => `<span class="c-trend c-trend--${v >= 0 ? 'up' : 'down'}">${ic(v >= 0 ? 'up' : 'down', 'icon--sm')}${v >= 0 ? '+' : ''}${String(v).replace('.', ',')}${unit}</span>`;

  function statCard({ id, title, value, suffix = '', meta, iconName, iconKind = '', spark }) {
    return `<article class="c-card">
      <div class="c-stat">
        <div style="min-width:0">
          <p class="c-stat__label">${esc(title)}</p>
          <p class="c-stat__value t-kpi" id="${id}" data-target="${value}" data-suffix="${suffix}">0${suffix}</p>
          <p class="c-stat__meta">${meta}</p>
        </div>
        <span class="c-iconbox${iconKind ? ' c-iconbox--' + iconKind : ''}">${ic(iconName)}</span>
      </div>
      ${spark ? `<div class="c-stat__spark"><canvas id="${id}-spark"></canvas></div>` : ''}
    </article>`;
  }
  const runCounters = (root) => $$('[data-target]', root).forEach((el) => countTo(el, +el.dataset.target, { suffix: el.dataset.suffix || '' }));
  const runBars = (root) => $$('[data-progress]', root).forEach((b) => { b.style.width = '0'; requestAnimationFrame(() => requestAnimationFrame(() => { b.style.width = b.dataset.progress + '%'; })); });

  // ---------- Rol ----------
  let role = 'admin';
  try { role = sessionStorage.getItem('ce-role') || 'admin'; } catch (_) {}
  const can = (el) => !el.dataset.roles || el.dataset.roles.split(' ').includes(role);
  function applyRole() {
    const r = D.roles[role];
    $('#role-select').value = role;
    $('#user-initials').textContent = (r.first[0] + r.last[0]).toUpperCase();
    $('#user-name').textContent = `${r.first} ${r.last}`;
    $('#user-role').textContent = r.label;
    $$('#nav [data-roles]').forEach((el) => { el.hidden = !can(el); });
  }
  $('#role-select').addEventListener('change', (e) => {
    role = e.target.value;
    try { sessionStorage.setItem('ce-role', role); } catch (_) {}
    applyRole(); route();
    toast(`Vista cambiada a ${ROLE_LABEL[role]}`);
  });

  // ---------- Drawer mobile ----------
  const sidebar = $('#sidebar'), overlay = $('#overlay');
  const setMenu = (open) => { sidebar.classList.toggle('is-open', open); overlay.classList.toggle('is-open', open); };
  $('#open-menu').addEventListener('click', () => setMenu(true));
  $('#close-menu').addEventListener('click', () => setMenu(false));
  overlay.addEventListener('click', () => setMenu(false));

  // ---------- Router ----------
  const inited = {};
  let current = '';
  function route() {
    let view = location.hash.slice(1) || 'dashboard';
    if (view === 'approvals') view = 'content';
    let section = $(`[data-view="${view}"]`);
    if (!section || view === 'forbidden') { view = 'dashboard'; section = $('[data-view="dashboard"]'); }
    const link = $(`#nav a[href="#${view}"]`);
    const allowed = !link || can(link);
    $$('[data-view]').forEach((s) => s.classList.remove('is-active'));
    $$('#nav .c-navlink').forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === '#' + view));
    setMenu(false);
    if (!allowed) { $('[data-view="forbidden"]').classList.add('is-active'); current = 'forbidden'; return; }
    section.classList.add('is-active');
    current = view;
    document.title = `${link ? link.textContent.replace(/\d+$/, '').trim() : 'CommunityLab'} · CloudEdTech`;
    window.scrollTo({ top: 0 });
    if (!inited[view] && views[view]) { inited[view] = true; views[view](section); }
    runBars(section);
  }
  window.addEventListener('hashchange', route);

  // ---------- Comportamientos globales ----------
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-toast]');
    if (t) toast(t.dataset.toast, t.dataset.toastType || '');
    const m = e.target.closest('[data-modal]');
    if (m) openModal(m.dataset.modal);
    const c = e.target.closest('[data-close]');
    if (c) closeModal(c.closest('.c-modal'));
    const sync = e.target.closest('[data-action="sync"]');
    if (sync) busy(sync, 1600, () => toast('312 mensajes nuevos sincronizados desde Discord', 'success'), 'Sincronizando…');
  });
  $$('.c-modal').forEach((m) => m.addEventListener('click', (e) => { if (e.target === m) closeModal(m); }));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') $$('.c-modal.is-open').forEach(closeModal); });
  function openModal(id) { const m = $('#' + id); m.classList.add('is-open'); setTimeout(() => $('input, select, button', m)?.focus(), 50); }
  function closeModal(m) { m && m.classList.remove('is-open'); }

  // Tabs genéricos
  $$('[data-tabs]').forEach((tabs) => {
    const group = tabs.dataset.tabs;
    tabs.addEventListener('click', (e) => {
      const b = e.target.closest('.c-tab'); if (!b) return;
      $$('.c-tab', tabs).forEach((x) => { x.classList.toggle('is-active', x === b); x.setAttribute('aria-selected', x === b); });
      $$(`[data-panel^="${group}:"]`).forEach((p) => { p.hidden = p.dataset.panel !== `${group}:${b.dataset.tab}`; });
    });
  });

  // Segmentados genéricos (solo estado visual) + períodos
  const periodHandlers = {};
  document.addEventListener('click', (e) => {
    const b = e.target.closest('.c-segmented button'); if (!b) return;
    const seg = b.parentElement;
    $$('button', seg).forEach((x) => x.classList.toggle('is-active', x === b));
    if (seg.dataset.period && periodHandlers[seg.dataset.period]) periodHandlers[seg.dataset.period](+b.dataset.days);
  });

  // ==========================================================================
  // Vistas
  // ==========================================================================
  const views = {};
  const charts = {};

  // ---------- Dashboard ----------
  views.dashboard = (root) => {
    const k = D.kpis;
    const s30 = D.series(30, { base: 80, seed: 1 });
    $('#dash-stats').innerHTML = [
      statCard({ id: 'k-msg', title: 'Mensajes procesados', value: k.messages_processed, meta: `${trend(k.messages_change)} vs. período anterior`, iconName: 'message', spark: true }),
      statCard({ id: 'k-aud', title: 'Total de audiencia', value: k.total_audience, meta: `${trend(k.audience_change)} nuevos miembros`, iconName: 'users', spark: true }),
      statCard({ id: 'k-pos', title: 'Sentimiento positivo', value: k.positive_sentiment, suffix: '%', meta: `${trend(k.sentiment_change, ' pts')} este mes`, iconName: 'smile', iconKind: 'success', spark: true }),
      statCard({ id: 'k-top', title: 'Temas detectados', value: k.topics_detected, meta: `<b class="t-brand">${k.new_topics}</b> temas nuevos`, iconName: 'hash', spark: true }),
      statCard({ id: 'k-gen', title: 'Contenidos generados', value: k.content_generated, meta: 'Posts, anuncios y respuestas', iconName: 'pen', spark: true }),
      statCard({ id: 'k-pen', title: 'Pendientes', value: k.pending_approvals, meta: '<a href="#content">Por aprobar →</a>', iconName: 'clock', iconKind: 'danger', spark: true }),
    ].join('');
    runCounters(root);
    if (CH) {
      const sp = { 'k-msg': [s30, '--chart-1'], 'k-aud': [D.series(30, { base: 1700, amp: 20, trend: 5, seed: 3, weekend: 1 }), '--chart-4'],
        'k-pos': [D.series(30, { base: 66, amp: 6, trend: 0.2, seed: 4, weekend: 1 }), '--chart-3'], 'k-top': [D.series(30, { base: 16, amp: 5, trend: 0.3, seed: 5, weekend: 1 }), '--chart-2'],
        'k-gen': [D.series(30, { base: 1, amp: 2, trend: 0.06, seed: 6 }), '--chart-6'], 'k-pen': [D.series(30, { base: 6, amp: 6, trend: 0.05, seed: 7, weekend: 1 }), '--chart-5'] };
      Object.entries(sp).forEach(([id, [d, c]]) => CH.sparkline($('#' + id + '-spark'), d, c));
    }
    if (!CH) return;

    const build = (days) => ({
      labels: D.dayLabels(days),
      msgs: D.series(days, { base: 80, seed: 1 }),
      qs: D.series(days, { base: 15, amp: 9, trend: 0.08, seed: 2 }),
    });
    let a = build(30);
    charts.activity = CH.area($('#ch-dash-activity'), { labels: a.labels, datasets: [{ label: 'Mensajes', data: a.msgs }, { label: 'Preguntas', data: a.qs, color: '--chart-4', fill: 'origin' }] });
    CH.legend($('#lg-dash-activity'), charts.activity);

    const sent = D.sentiment;
    const total = sum(sent.map((s) => s.value));
    charts.sentiment = CH.donut($('#ch-dash-sentiment'), { labels: sent.map((s) => s.label), values: sent.map((s) => s.value), colors: sent.map((s) => s.color), center: $('#ct-dash-sentiment') });
    CH.legend($('#lg-dash-sentiment'), charts.sentiment, { stacked: true, values: sent.map((s) => Math.round((s.value / total) * 100) + '%') });

    const evo = (days) => {
      const p = D.series(days, { base: 66, amp: 8, trend: 6 / days, seed: 11, weekend: 1 });
      const n = D.series(days, { base: 9, amp: 5, trend: -1 / days, seed: 12, weekend: 1 });
      return { p, n, u: p.map((v, i) => Math.max(0, 100 - v - n[i])) };
    };
    let ev = evo(30);
    charts.evolution = CH.area($('#ch-dash-evolution'), { labels: a.labels, unit: '%', yMax: 100, datasets: [
      { label: 'Positivo', data: ev.p, color: '--sentiment-positive' },
      { label: 'Neutral', data: ev.u, color: '--sentiment-neutral', fill: false },
      { label: 'Negativo', data: ev.n, color: '--sentiment-negative', fill: false },
    ] });
    CH.legend($('#lg-dash-evolution'), charts.evolution);

    charts.hours = CH.bar($('#ch-dash-hours'), { labels: D.audience.hours.map((_, h) => `${String(h).padStart(2, '0')}:00`), datasets: [{ label: 'Mensajes', data: D.audience.hours }], highlightMax: true, radius: 4 });

    let byGrowth = false;
    const topicData = () => {
      const t = [...D.topics].sort((x, y) => byGrowth ? y.change - x.change : y.count - x.count);
      return { labels: t.map((x) => x.name), values: t.map((x) => byGrowth ? x.change : x.count) };
    };
    let td = topicData();
    charts.topics = CH.bar($('#ch-dash-topics'), { labels: td.labels, datasets: [{ label: 'Menciones', data: td.values }], horizontal: true, highlightMax: true });
    $('[data-action="sort-topics"]').addEventListener('click', (e) => {
      byGrowth = !byGrowth; td = topicData();
      charts.topics.data.datasets[0].label = byGrowth ? 'Crecimiento %' : 'Menciones';
      CH.update(charts.topics, td.labels, [td.values]);
      e.currentTarget.lastChild.textContent = byGrowth ? 'Ordenar por volumen' : 'Ordenar por crecimiento';
    });

    $('#dash-highlights').innerHTML = D.highlights.slice(0, 3).map((h) => `
      <div style="display:flex;gap:var(--space-3);align-items:center">
        <div class="score-ring" style="--p:${h.score}"><span>${h.score}</span></div>
        <div style="min-width:0;flex:1">
          <p class="t-card" style="font-size:var(--text-sm)">${esc(h.title)}</p>
          <p class="t-caption">${esc(h.author)} · #${h.channel} · ${nf.format(h.reach)} alcance</p>
        </div>
        ${pill(h.type, h.type === 'Historia de éxito' ? 'success' : 'accent')}
      </div>`).join('<hr class="c-divider" style="margin:0">');

    periodHandlers.dashboard = (days) => {
      a = build(days); ev = evo(days);
      CH.update(charts.activity, a.labels, [a.msgs, a.qs]);
      CH.update(charts.evolution, a.labels, [ev.p, ev.u, ev.n]);
      const scale = days / 30;
      const msgEl = $('#k-msg');
      countTo(msgEl, Math.round(k.messages_processed * scale));
      countTo($('#k-pos'), Math.round(sum(ev.p) / days), { suffix: '%' });
      countTo($('#k-top'), Math.max(6, Math.round(k.topics_detected * Math.sqrt(scale))));
      countTo($('#k-gen'), Math.round(k.content_generated * scale));
      const delta = { 7: 5.1, 30: 12.4, 90: 28.7 }[days];
      $('#dash-activity-delta').textContent = `+${String(delta).replace('.', ',')}%`;
    };

    // "En vivo": llegan mensajes nuevos cada pocos segundos
    setInterval(() => {
      if (current !== 'dashboard' || document.hidden) return;
      const n = 1 + Math.floor(Math.random() * 3);
      const el = $('#k-msg');
      countTo(el, +el.dataset.n + n, { duration: 600 });
      const ds = charts.activity.data.datasets[0].data;
      ds[ds.length - 1] += n;
      charts.activity.update();
    }, 3500);
  };

  // ---------- Ingesta de mensajes ----------
  views.messages = (root) => {
    const sm = { analyzed: 2481, positive: 1786, questions: 438, highlights: 37 };
    $('#msg-summary').innerHTML = [
      statCard({ id: 'm-an', title: 'Analizados', value: sm.analyzed, meta: 'Últimos 30 días', iconName: 'inbox' }),
      statCard({ id: 'm-po', title: 'Positivos', value: sm.positive, meta: `<b class="t-success">72%</b> del total`, iconName: 'smile', iconKind: 'success' }),
      statCard({ id: 'm-qu', title: 'Preguntas', value: sm.questions, meta: 'Candidatas a FAQ', iconName: 'message', iconKind: 'info' }),
      statCard({ id: 'm-hl', title: 'Destacados', value: sm.highlights, meta: 'Relevancia ≥ 85', iconName: 'star' }),
    ].join('');
    runCounters(root);

    const chSel = $('#msg-channel'), tpSel = $('#msg-topic');
    D.channels.forEach((c) => chSel.insertAdjacentHTML('beforeend', `<option value="${c}">#${c}</option>`));
    [...new Set(D.messages.map((m) => m.topic))].forEach((t) => tpSel.insertAdjacentHTML('beforeend', `<option>${esc(t)}</option>`));

    const classes = [...new Set(D.messages.map((m) => m.classification))];
    let cls = '';
    const starred = new Set([1, 6]);
    const renderChips = () => {
      $('#msg-chips').innerHTML = [['', 'Todas', D.messages.length], ...classes.map((c) => [c, c, D.messages.filter((m) => m.classification === c).length])]
        .map(([v, l, n]) => `<button type="button" class="c-chip${cls === v ? ' is-active' : ''}" data-cls="${esc(v)}">${esc(l)} <span class="c-chip__n">${n}</span></button>`).join('');
    };
    const render = () => {
      const q = $('#msg-q').value.trim().toLowerCase();
      const list = D.messages.filter((m) =>
        (!q || (m.author + ' ' + m.message).toLowerCase().includes(q)) &&
        (!chSel.value || m.channel === chSel.value) &&
        (!$('#msg-sent').value || m.sentiment === $('#msg-sent').value) &&
        (!tpSel.value || m.topic === tpSel.value) &&
        (!cls || m.classification === cls));
      $('#msg-count').textContent = list.length;
      $('#msg-list').innerHTML = list.length ? list.map((m) => `
        <div class="c-msg">
          <span class="c-avatar ${tone(m.author)}">${m.initials}</span>
          <div class="c-msg__body">
            <div class="c-msg__head"><span class="c-msg__author">${esc(m.author)}</span><span class="c-tag c-tag--channel">${m.channel}</span><span class="c-msg__time">${m.time}</span></div>
            <p class="c-msg__text">${esc(m.message)}</p>
            <div class="c-msg__meta">
              ${pill(SENT[m.sentiment].label, SENT[m.sentiment].pill, true)}${pill(m.topic, 'brand')}${pill(m.classification, 'outline')}
              <span class="t-caption">${ic('thumbs', 'icon--sm')}</span><span class="t-caption">${m.reactions}</span>
              <span class="t-caption">${ic('reply', 'icon--sm')}</span><span class="t-caption">${m.replies}</span>
            </div>
          </div>
          <div class="c-msg__score">
            <b>${m.relevance}</b><span class="t-caption">relevancia</span>
            <div class="c-progress c-progress--sm" style="width:4rem"><div class="c-progress__bar" style="width:${m.relevance}%"></div></div>
            <div class="l-cluster" style="margin-top:var(--space-2)">
              <button class="c-btn c-btn--ghost c-btn--icon c-btn--sm" data-star="${m.id}" aria-label="Destacar" aria-pressed="${starred.has(m.id)}" style="${starred.has(m.id) ? 'color:var(--color-brand)' : ''}">${ic('star', 'icon--sm')}</button>
              <button class="c-btn c-btn--secondary c-btn--sm" data-toast="Mensaje enviado a Redacción">${ic('pen', 'icon--sm')}Redactar</button>
            </div>
          </div>
        </div>`).join('') : `
        <div class="c-empty">
          <div class="c-empty__icon">${ic('search', 'icon--lg')}</div>
          <p class="c-empty__title">No se encontraron mensajes</p>
          <p class="c-empty__text">Prueba con otros filtros o limpia la búsqueda.</p>
        </div>`;
    };
    renderChips(); render();
    ['#msg-q', '#msg-channel', '#msg-sent', '#msg-topic'].forEach((s) => $(s).addEventListener('input', render));
    $('#msg-chips').addEventListener('click', (e) => { const c = e.target.closest('.c-chip'); if (!c) return; cls = c.dataset.cls; renderChips(); render(); });
    $('#msg-reset').addEventListener('click', () => { $('#msg-q').value = ''; chSel.value = ''; $('#msg-sent').value = ''; tpSel.value = ''; cls = ''; renderChips(); render(); });
    $('#msg-list').addEventListener('click', (e) => {
      const b = e.target.closest('[data-star]'); if (!b) return;
      const id = +b.dataset.star;
      starred.has(id) ? starred.delete(id) : starred.add(id);
      toast(starred.has(id) ? 'Agregado a Historias destacadas' : 'Quitado de destacados');
      render();
    });

    $('#batch-run').addEventListener('click', (e) => {
      const btn = e.currentTarget;
      const steps = ['Leyendo mensajes…', 'Clasificando sentimiento…', 'Detectando temas…', 'Calculando relevancia…', 'Guardando resultados…'];
      btn.disabled = true;
      $('#batch-progress').hidden = false;
      progress($('#batch-bar'), $('#batch-pct'), 3000, (p) => { $('#batch-status').textContent = steps[Math.min(steps.length - 1, Math.floor(p / 20))]; }, () => {
        btn.disabled = false;
        $('#batch-status').textContent = 'Lote completado: 100 mensajes · 12 destacados · 3 alertas';
        toast('Lote evaluado con IA: 100 mensajes clasificados', 'success');
      });
    });
  };

  // ---------- Análisis ----------
  views.analytics = (root) => {
    const metrics = [
      { label: 'Mensajes analizados', value: 2481, max: 3000, kind: '', note: 'Meta mensual 3.000' },
      { label: 'Sentimiento positivo', value: 72, max: 100, kind: 'success', suffix: '%', note: '+4,2 pts' },
      { label: 'Relevancia promedio', value: 89, max: 100, kind: 'info', suffix: '%', note: '24 temas detectados' },
      { label: 'Alertas activas', value: 6, max: 20, kind: 'danger', note: 'Requieren intervención' },
    ];
    $('#an-metrics').innerHTML = metrics.map((m, i) => `
      <div class="c-meter">
        <span class="c-stat__label">${m.label}</span>
        <span class="t-kpi" data-target="${m.value}" data-suffix="${m.suffix || ''}" id="an-m${i}">0</span>
        <div class="c-progress c-progress--sm${m.kind ? ' c-progress--' + m.kind : ''}"><div class="c-progress__bar" data-progress="${Math.round((m.value / m.max) * 100)}"></div></div>
        <span class="t-caption">${m.note}</span>
      </div>`).join('');
    runCounters(root);

    const ins = [
      ['bulb', 'Principal', 'Las conversaciones relacionadas con agentes de IA están generando una alta participación y presentan un elevado potencial para convertirse en contenido educativo.'],
      ['message', 'Preguntas frecuentes', 'Las preguntas sobre LangGraph, RAG y agentes de IA aparecen con frecuencia y pueden convertirse en recursos educativos para la comunidad.'],
      ['alert', 'Atención requerida', 'Se detectaron conversaciones con sentimiento negativo o dificultades recurrentes que podrían requerir intervención del Community Manager.'],
    ];
    $('#an-insights').innerHTML = ins.map(([i, t, d]) => `
      <div style="display:flex;gap:var(--space-3);padding:var(--space-3);border-radius:var(--radius-lg);background:rgb(255 255 255 / .04);border:1px solid var(--slate-800)">
        <span style="color:var(--orange-400);flex-shrink:0">${ic(i)}</span>
        <div><p style="font-size:var(--text-sm);font-weight:600;color:#fff">${t}</p><p style="font-size:var(--text-sm);color:var(--slate-300);margin-top:2px">${d}</p></div>
      </div>`).join('');

    $('#an-emojis').innerHTML = D.emojis.map((e) => `
      <div class="c-card c-card--muted emoji-card">
        <div class="emoji-card__e">${e.emoji}</div>
        <p class="t-kpi" style="font-size:var(--text-2xl);margin-top:var(--space-3)" data-target="${e.count}">0</p>
        <p class="t-caption" style="text-transform:capitalize">${e.name}</p>
        <p style="margin-top:var(--space-2);font-size:var(--text-xs)">${trend(e.change)}</p>
      </div>`).join('');
    runCounters($('#an-emojis'));

    if (!CH) return;
    const build = (days) => {
      const p = D.series(days, { base: 64, amp: 8, trend: 8 / days, seed: 21, weekend: 1 });
      const n = D.series(days, { base: 10, amp: 5, trend: -2 / days, seed: 22, weekend: 1 });
      return { labels: D.dayLabels(days), p, n, u: p.map((v, i) => Math.max(0, 100 - v - n[i])) };
    };
    let b = build(30);
    charts.anSent = CH.area($('#ch-an-sentiment'), { labels: b.labels, unit: '%', yMax: 100, datasets: [
      { label: 'Positivo', data: b.p, color: '--sentiment-positive' },
      { label: 'Neutral', data: b.u, color: '--sentiment-neutral', fill: false },
      { label: 'Negativo', data: b.n, color: '--sentiment-negative', fill: false },
    ] });
    CH.legend($('#lg-an-sentiment'), charts.anSent);
    periodHandlers.analytics = (days) => { b = build(days); CH.update(charts.anSent, b.labels, [b.p, b.u, b.n]); };

    const hs = D.hashtags.slice(0, 8);
    let mode = 'count';
    const hd = () => { const s = [...hs].sort((x, y) => y[mode] - x[mode]); return { labels: s.map((h) => '#' + h.tag), values: s.map((h) => h[mode]) }; };
    let h = hd();
    charts.anHash = CH.bar($('#ch-an-hashtags'), { labels: h.labels, datasets: [{ label: 'Usos', data: h.values }], horizontal: true, highlightMax: true });
    $('#an-hash-mode').addEventListener('click', (e) => {
      const btn = e.target.closest('button'); if (!btn) return;
      mode = btn.dataset.mode; h = hd();
      charts.anHash.data.datasets[0].label = mode === 'count' ? 'Usos' : 'Crecimiento %';
      CH.update(charts.anHash, h.labels, [h.values]);
    });

    const tp = D.topics.slice(0, 6);
    const maxC = Math.max(...tp.map((t) => t.count));
    charts.anTopics = CH.radar($('#ch-an-topics'), { labels: tp.map((t) => t.name), datasets: [
      { label: 'Relevancia', data: tp.map((t) => t.relevance) },
      { label: 'Participación', data: tp.map((t) => Math.round((t.count / maxC) * 100)), color: '--chart-4' },
    ] });
    CH.legend($('#lg-an-topics'), charts.anTopics);
  };

  // ---------- Redacción de contenidos ----------
  const DRAFT_STATUS = { pending: ['Pendiente', 'warning'], review: ['En revisión', 'info'], approved: ['Aprobado', 'success'], rejected: ['Rechazado', 'danger'] };
  const VARIANTS = [
    ' ✨ Súmate a la conversación en nuestro Discord y comparte tu avance.',
    ' 💬 ¿Tú también estás construyendo con IA? Cuéntanos en los comentarios.',
    ' 📚 Revisa la ruta de Agentes de IA en CloudEdTech para dar el siguiente paso.',
  ];
  views.content = () => {
    let sel = 0;
    const renderList = () => {
      $('#draft-list').innerHTML = D.drafts.map((d, i) => {
        const [l, k] = DRAFT_STATUS[d.status];
        return `<button type="button" class="draft-item${i === sel ? ' is-active' : ''}" data-i="${i}">
          <span class="c-avatar c-avatar--sm ${tone(d.source.author)}">${d.source.initials}</span>
          <span style="flex:1;min-width:0"><span class="t-card" style="display:block;font-size:var(--text-sm)">${esc(d.source.author)}</span>
          <span class="t-caption">${d.id} · ${d.type} · ${d.updated}</span></span>${pill(l, k)}</button>`;
      }).join('');
    };
    const show = (i) => {
      sel = i; const d = D.drafts[i]; const m = d.source; const [l, k] = DRAFT_STATUS[d.status];
      $('#draft-channel').textContent = m.channel;
      $('#draft-original').innerHTML = `<div style="display:flex;gap:var(--space-3)"><span class="c-avatar ${tone(m.author)}">${m.initials}</span><div><div class="c-msg__head"><span class="c-msg__author">${esc(m.author)}</span><span class="c-msg__time">${m.time}</span></div><p class="c-msg__text">${esc(m.message)}</p><div class="c-msg__meta">${pill(SENT[m.sentiment].label, SENT[m.sentiment].pill, true)}${pill(m.topic, 'brand')}</div></div></div>`;
      $('#draft-type').textContent = d.type;
      $('#draft-status').className = `c-pill c-pill--${k}`; $('#draft-status').textContent = l;
      $('#draft-text').value = d.generated;
      $('#draft-chars').textContent = `${d.generated.length} caracteres`;
      renderList();
    };
    show(0);
    $('#draft-list').addEventListener('click', (e) => { const b = e.target.closest('.draft-item'); if (b) show(+b.dataset.i); });
    $('#draft-text').addEventListener('input', (e) => { D.drafts[sel].generated = e.target.value; $('#draft-chars').textContent = `${e.target.value.length} caracteres`; });
    $('#draft-copy').addEventListener('click', () => { navigator.clipboard?.writeText($('#draft-text').value).catch(() => {}); toast('Contenido copiado'); });
    $('#draft-regen').addEventListener('click', (e) => busy(e.currentTarget, 1100, () => {
      const base = D.drafts[sel].generated.replace(/ (✨|💬|📚).*$/, '');
      typewrite($('#draft-text'), base + VARIANTS[Math.floor(Math.random() * VARIANTS.length)]);
    }, 'Generando…'));
    const setStatus = (s, msg, type) => { D.drafts[sel].status = s; D.drafts[sel].updated = 'Ahora'; show(sel); toast(msg, type); };
    $('#draft-approve').addEventListener('click', () => setStatus('approved', 'Contenido aprobado y listo para publicar', 'success'));
    $('#draft-reject').addEventListener('click', () => setStatus('rejected', 'Contenido rechazado'));

    // Anuncios
    const annRows = () => {
      $('#ann-table').innerHTML = `<thead><tr><th>Anuncio</th><th>Estado</th><th class="is-right">Alcance</th></tr></thead><tbody>${D.announcements.map((a) => `
        <tr><td><span class="is-strong">${esc(a.title)}</span><br><span class="t-caption">${a.channel} · ${a.date}</span></td>
        <td>${pill(a.status, { Publicado: 'success', Programado: 'info', Borrador: '' }[a.status], true)}</td>
        <td class="is-right">${a.reach ? nf.format(a.reach) : '—'}</td></tr>`).join('')}</tbody>`;
    };
    annRows();
    $('#ann-title').addEventListener('input', (e) => { $('#ann-preview-title').textContent = '📣 ' + e.target.value; });
    $('#ann-generate').addEventListener('click', (e) => busy(e.currentTarget, 900, () => {
      const tone = $('#ann-tone').value;
      const open = { Cercano: '¡Hola, comunidad! 👋', Formal: 'Estimada comunidad:', Entusiasta: '¡Se viene algo GRANDE! 🚀' }[tone];
      typewrite($('#ann-preview-body'), `${open} Los invitamos al Demo Day de proyectos este martes 28 de octubre a las 19:00 (hora de Chile). Tendremos 8 cupos para presentar lo que han construido con agentes, RAG y LangGraph. Inscríbete dejando tu proyecto en #proyectos antes del domingo. ¡Nos vemos!`);
    }, 'Generando…'));
    $('#ann-publish').addEventListener('click', (e) => busy(e.currentTarget, 1200, () => {
      D.announcements.unshift({ title: $('#ann-title').value, status: 'Publicado', channel: $('#ann-channel').value.replace('#', ''), date: 'Hoy, ahora', reach: 0 });
      annRows(); toast(`Anuncio publicado en ${$('#ann-channel').value}`, 'success');
    }, 'Publicando…'));

    // Quejas
    const PRIO = { Crítica: 'danger', Alta: 'warning', Media: 'info' };
    const STAT = { 'Sin responder': 'danger', 'En curso': 'warning', Publicada: 'success' };
    const renderComplaints = () => {
      $('#complaint-list').innerHTML = D.complaints.map((c, i) => `
        <div class="c-msg" style="flex-direction:column">
          <div class="l-between">
            <div class="c-msg__head"><span class="c-avatar c-avatar--sm ${tone(c.author)}">${c.author.split(' ').map((w) => w[0]).join('')}</span><span class="c-msg__author">${esc(c.author)}</span><span class="c-tag c-tag--channel">${c.channel}</span><span class="c-msg__time">${c.id} · ${c.time}</span></div>
            <div class="l-cluster">${pill(c.priority, PRIO[c.priority])}${pill(c.status, STAT[c.status], true)}</div>
          </div>
          <p class="c-msg__text" style="padding:var(--space-3);background:var(--surface-muted);border-radius:var(--radius-lg)">${esc(c.text)}</p>
          <div class="c-field" ${c.status === 'Sin responder' ? 'hidden' : ''} data-resp="${i}">
            <label class="c-label" for="resp-${i}">Respuesta sugerida</label>
            <textarea class="c-textarea" id="resp-${i}" rows="3" ${c.status === 'Publicada' ? 'readonly' : ''}>${c.status === 'Sin responder' ? '' : esc(c.response)}</textarea>
          </div>
          <div class="l-cluster" style="justify-content:flex-end">
            ${c.status === 'Publicada' ? `<span class="t-caption">${ic('check-circle', 'icon--sm')}</span><span class="t-caption">Respuesta publicada en Discord</span>` : `
            <button class="c-btn c-btn--secondary c-btn--sm" data-gen="${i}">${ic('sparkles', 'icon--sm')}Generar respuesta</button>
            <button class="c-btn c-btn--primary c-btn--sm" data-pub="${i}" ${c.status === 'Sin responder' ? 'disabled' : ''}>${ic('send', 'icon--sm')}Publicar respuesta</button>`}
          </div>
        </div>`).join('');
    };
    renderComplaints();
    $('#complaint-list').addEventListener('click', (e) => {
      const g = e.target.closest('[data-gen]'), p = e.target.closest('[data-pub]');
      if (g) {
        const i = +g.dataset.gen;
        busy(g, 900, () => {
          const wrap = $(`[data-resp="${i}"]`); wrap.hidden = false;
          typewrite($('textarea', wrap), D.complaints[i].response);
          const pb = $(`[data-pub="${i}"]`); if (pb) pb.disabled = false;
          if (D.complaints[i].status === 'Sin responder') D.complaints[i].status = 'En curso';
        }, 'Generando…');
      }
      if (p) {
        const i = +p.dataset.pub;
        D.complaints[i].response = $(`#resp-${i}`).value;
        busy(p, 900, () => { D.complaints[i].status = 'Publicada'; renderComplaints(); toast('Respuesta publicada en Discord', 'success'); }, 'Publicando…');
      }
    });
  };

  // ---------- OCI ----------
  views['oci-storage'] = () => {
    const render = () => {
      $('#oci-table').innerHTML = `<thead><tr><th>Semana</th><th class="is-right">Mensajes</th><th>Tamaño</th><th>Generado</th><th>Estado</th><th class="is-right">Acciones</th></tr></thead><tbody>${D.ociReports.map((r, i) => `
        <tr>
          <td style="white-space:nowrap"><span class="is-strong t-mono">${r.semana}</span><br><span class="t-caption">${r.periodo}</span></td>
          <td class="is-right">${nf.format(r.mensajes)}</td><td>${r.tamano}</td><td style="white-space:nowrap">${r.generado}</td>
          <td>${r.subido_oci ? pill('✅ Subido a OCI', 'success') : pill('💾 Respaldo Local', 'warning')}</td>
          <td class="is-right"><div class="l-cluster" style="justify-content:flex-end;flex-wrap:nowrap">
            <button class="c-btn c-btn--secondary c-btn--sm" data-json="${i}">${ic('eye', 'icon--sm')}Ver JSON</button>
            <button class="c-btn c-btn--secondary c-btn--icon c-btn--sm" title="Descargar" aria-label="Descargar reporte ${r.semana}" data-toast="Descargando reporte_${r.semana}.json">${ic('download', 'icon--sm')}</button>
            <button class="c-btn c-btn--primary c-btn--sm" data-up="${i}">${ic(r.subido_oci ? 'refresh' : 'upload', 'icon--sm')}${r.subido_oci ? 'Reintentar OCI' : 'Subir a OCI'}</button>
          </div></td>
        </tr>`).join('')}</tbody>`;
    };
    render();
    $('#oci-table').addEventListener('click', (e) => {
      const j = e.target.closest('[data-json]'), u = e.target.closest('[data-up]');
      if (j) {
        const r = D.ociReports[+j.dataset.json];
        const obj = { semana: r.semana, periodo: r.periodo, plataforma: 'discord', resumen: { mensajes: r.mensajes, sentimiento_positivo: 0.72, temas_detectados: 24, destacados: 9 }, top_temas: ['Agentes IA', 'LangGraph', 'RAG'], almacenamiento: { bucket: 'communitylab-reports', subido_oci: r.subido_oci } };
        $('#json-modal-title').textContent = `reporte_${r.semana}.json`;
        $('#json-modal-code').innerHTML = esc(JSON.stringify(obj, null, 2))
          .replace(/(&quot;[^&]+&quot;)(\s*:)/g, '<span class="k">$1</span>$2')
          .replace(/: (&quot;.*?&quot;)/g, ': <span class="s">$1</span>')
          .replace(/: (\d[\d.]*|true|false)/g, ': <span class="n">$1</span>');
        openModal('json-modal');
      }
      if (u) busy(u, 1500, () => { D.ociReports[+u.dataset.up].subido_oci = true; render(); toast('Reporte subido a OCI Object Storage', 'success'); }, 'Subiendo…');
    });
    $('#oci-generate').addEventListener('click', (e) => busy(e.currentTarget, 1300, () => {
      if (!D.ociReports.some((r) => r.semana === '2026-W43')) D.ociReports.unshift({ semana: '2026-W43', periodo: '19 – 25 oct', mensajes: 94, tamano: '31 KB', generado: 'Hoy, ahora', subido_oci: false });
      render(); toast('Reporte 2026-W43 generado', 'success');
      if (charts.oci) { const r = [...D.ociReports].reverse(); CH.update(charts.oci, r.map((x) => x.semana.slice(5)), [r.map((x) => x.mensajes)]); }
    }, 'Generando…'));
    $('#oci-sync').addEventListener('click', (e) => busy(e.currentTarget, 1800, () => { D.ociReports.forEach((r) => { r.subido_oci = true; }); render(); toast('Todos los reportes sincronizados con OCI', 'success'); }, 'Sincronizando…'));
    if (CH) {
      const r = [...D.ociReports].reverse();
      charts.oci = CH.bar($('#ch-oci-weeks'), { labels: r.map((x) => x.semana.slice(5)), datasets: [{ label: 'Mensajes', data: r.map((x) => x.mensajes) }], highlightMax: true });
    }
  };

  // ---------- Historias destacadas ----------
  views.highlights = () => {
    let f = '';
    const types = ['', ...new Set(D.highlights.map((h) => h.type))];
    const render = () => {
      $('#hl-chips').innerHTML = types.map((t) => `<button type="button" class="c-chip${t === f ? ' is-active' : ''}" data-t="${esc(t)}">${t || 'Todas'}</button>`).join('');
      $('#hl-grid').innerHTML = D.highlights.filter((h) => !f || h.type === f).map((h) => `
        <article class="c-card c-card--interactive">
          <div style="display:flex;gap:var(--space-4);align-items:flex-start">
            <div class="score-ring" style="--p:${h.score}"><span>${h.score}</span></div>
            <div style="flex:1;min-width:0">
              ${pill(h.type, h.type === 'Historia de éxito' ? 'success' : 'accent')}
              <h2 class="t-section" style="margin-top:var(--space-2)">${esc(h.title)}</h2>
              <p class="t-muted" style="margin-top:var(--space-1)">${esc(h.excerpt)}</p>
            </div>
          </div>
          <div class="c-card__footer">
            <span class="t-caption">${esc(h.author)} · #${h.channel} · ${nf.format(h.reach)} de alcance</span>
            <button class="c-btn c-btn--soft c-btn--sm" data-toast="Historia enviada a Redacción">${ic('pen', 'icon--sm')}Crear contenido</button>
          </div>
        </article>`).join('');
    };
    render();
    $('#hl-chips').addEventListener('click', (e) => { const c = e.target.closest('.c-chip'); if (c) { f = c.dataset.t; render(); } });
  };

  // ---------- Hashtags ----------
  views.hashtags = () => {
    const max = D.hashtags[0].count;
    $('#hash-cloud').innerHTML = [...D.hashtags].sort(() => 0.5 - Math.random()).map((h) => {
      const r = h.count / max;
      return `<a href="#hashtags" style="font-size:${(0.8 + r * 1.2).toFixed(2)}rem;opacity:${(0.55 + r * 0.45).toFixed(2)}" title="${h.count} usos">#${h.tag}</a>`;
    }).join('');
    $('#hash-table').innerHTML = `<thead><tr><th>#</th><th>Hashtag</th><th class="is-right">Usos</th><th class="is-right">Variación</th></tr></thead><tbody>${D.hashtags.map((h, i) => `
      <tr><td class="t-caption">${i + 1}</td><td class="is-strong">#${h.tag}</td><td class="is-right">${nf.format(h.count)}</td><td class="is-right">${pill((h.change >= 0 ? '+' : '') + h.change + '%', h.change >= 0 ? 'success' : 'danger')}</td></tr>`).join('')}</tbody>`;
    if (!CH) return;
    const build = (days) => ({ labels: D.dayLabels(days), d: [D.series(days, { base: 13, amp: 7, seed: 31 }), D.series(days, { base: 10, amp: 6, trend: 0.15, seed: 32 }), D.series(days, { base: 9, amp: 5, seed: 33 })] });
    let b = build(30);
    charts.hash = CH.area($('#ch-hash-trend'), { labels: b.labels, datasets: [{ label: '#agentesIA', data: b.d[0] }, { label: '#langgraph', data: b.d[1], color: '--chart-4', fill: false }, { label: '#rag', data: b.d[2], color: '--chart-3', fill: false }] });
    CH.legend($('#lg-hash-trend'), charts.hash);
    periodHandlers.hashtags = (days) => { b = build(days); CH.update(charts.hash, b.labels, b.d); };
  };

  // ---------- Audiencia ----------
  views.audience = (root) => {
    const icons = ['activity', 'user-plus', 'star', 'alert'];
    const kinds = ['success', '', 'info', 'danger'];
    $('#aud-segments').innerHTML = D.audience.segments.map((s, i) => `
      <article class="c-card">
        <div class="c-stat"><div><p class="c-stat__label">${s.name}</p><p class="c-stat__value t-kpi" data-target="${s.value}">0</p></div><span class="c-iconbox${kinds[i] ? ' c-iconbox--' + kinds[i] : ''}">${ic(icons[i])}</span></div>
        <div class="c-progress c-progress--sm${kinds[i] ? ' c-progress--' + kinds[i] : ''}" style="margin-top:var(--space-4)"><div class="c-progress__bar" data-progress="${s.pct}"></div></div>
        <p class="t-caption" style="margin-top:var(--space-2)">${s.pct}% de la audiencia</p>
      </article>`).join('');
    runCounters(root);
    if (!CH) return;
    const c = D.audience.byCountry;
    charts.audC = CH.bar($('#ch-aud-country'), { labels: c.map((x) => x.label), datasets: [{ label: 'Miembros', data: c.map((x) => x.value) }], highlightMax: true });
    $('#aud-sort').addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      const s = [...c].sort((x, y) => b.dataset.sort === 'alpha' ? x.label.localeCompare(y.label) : y.value - x.value);
      CH.update(charts.audC, s.map((x) => x.label), [s.map((x) => x.value)]);
    });
    const lv = D.audience.byLevel, tot = sum(lv.map((x) => x.value));
    charts.audL = CH.donut($('#ch-aud-level'), { labels: lv.map((x) => x.label), values: lv.map((x) => x.value), colors: ['--chart-1', '--chart-4', '--chart-2'], center: $('#ct-aud-level') });
    CH.legend($('#lg-aud-level'), charts.audL, { stacked: true, values: lv.map((x) => Math.round((x.value / tot) * 100) + '%') });
    charts.audH = CH.bar($('#ch-aud-hours'), { labels: D.audience.hours.map((_, h) => `${h}h`), datasets: [{ label: 'Mensajes', data: D.audience.hours }], highlightMax: true, radius: 4 });
  };

  // ---------- Calendario ----------
  views.calendar = () => {
    const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const DOW = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    let y = 2026, m = 9, selDay = 19, data = [];
    const level = (v) => (v === 0 ? 0 : v < 60 ? 1 : v < 95 ? 2 : v < 125 ? 3 : 4);
    const detail = (d) => {
      const el = $('#cal-detail');
      if (!d || d.future) {
        el.innerHTML = `<div class="c-empty" style="padding:var(--space-8) var(--space-4)"><div class="c-empty__icon">${ic('calendar', 'icon--lg')}</div><p class="c-empty__title">Sin datos aún</p><p class="c-empty__text">Este día todavía no ocurre.</p></div>`;
        return;
      }
      const r = D.rng(d.day * 31 + m);
      const pos = 60 + Math.round(r() * 25), neg = Math.round(r() * 10);
      const topic = D.topics[Math.floor(r() * 5)].name;
      el.innerHTML = `<p class="t-overline">${['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][d.dow]}</p>
        <h2 class="t-page" style="margin-top:var(--space-1)">${d.day} de ${MONTHS[m].toLowerCase()}</h2>
        <div style="margin-top:var(--space-4)">
          <div class="c-row"><span class="c-row__label">Mensajes</span><span class="c-row__value" id="cal-n">0</span></div>
          <div class="c-row"><span class="c-row__label">Eventos</span><span class="c-row__value">${d.events}</span></div>
          <div class="c-row"><span class="c-row__label">Tema principal</span><span class="c-row__value">${topic}</span></div>
        </div>
        <p class="c-label" style="margin-top:var(--space-4)">Sentimiento</p>
        <div style="display:flex;height:.5rem;border-radius:999px;overflow:hidden;margin-top:var(--space-2)">
          <span style="width:${pos}%;background:var(--sentiment-positive);transition:width .6s"></span><span style="width:${100 - pos - neg}%;background:var(--sentiment-neutral)"></span><span style="width:${neg}%;background:var(--sentiment-negative)"></span>
        </div>
        <div class="l-between t-caption" style="margin-top:var(--space-2)"><span>${pos}% positivo</span><span>${neg}% negativo</span></div>`;
      countTo($('#cal-n'), d.messages, { duration: 500 });
    };
    const render = () => {
      data = D.calendar(y, m);
      $('#cal-month-label').textContent = `${MONTHS[m]} ${y}`;
      const offset = (new Date(y, m, 1).getDay() + 6) % 7;
      $('#cal-grid').innerHTML = DOW.map((d) => `<div class="c-heat__dow">${d}</div>`).join('') +
        Array(offset).fill('<div class="c-heat__cell is-empty"></div>').join('') +
        data.map((d) => `<button type="button" class="c-heat__cell${d.day === selDay ? ' is-selected' : ''}" data-day="${d.day}" data-level="${level(d.messages)}" aria-label="${d.day}: ${d.messages} mensajes">${d.day}</button>`).join('');
      detail(data.find((d) => d.day === selDay));
    };
    render();
    const grid = $('#cal-grid');
    grid.addEventListener('mousemove', (e) => {
      const c = e.target.closest('[data-day]'); if (!c) return hideTip();
      const d = data[+c.dataset.day - 1];
      showTip(e, d.future ? `${d.day} ${MONTHS[m].slice(0, 3).toLowerCase()} · sin datos` : `<b>${d.messages}</b> mensajes · ${d.events} eventos`);
    });
    grid.addEventListener('mouseleave', hideTip);
    grid.addEventListener('click', (e) => { const c = e.target.closest('[data-day]'); if (!c) return; selDay = +c.dataset.day; $$('.c-heat__cell', grid).forEach((x) => x.classList.toggle('is-selected', x === c)); detail(data[selDay - 1]); });
    $('#cal-prev').addEventListener('click', () => { m--; if (m < 0) { m = 11; y--; } selDay = 1; render(); });
    $('#cal-next').addEventListener('click', () => { m++; if (m > 11) { m = 0; y++; } selDay = 1; render(); });
    const TYPE = { Evento: 'brand', Mentoría: 'info', Reporte: 'accent' };
    $('#cal-events').innerHTML = D.events.map((ev) => `
      <div class="c-row" style="align-items:flex-start;justify-content:flex-start">
        <div style="text-align:center;min-width:3rem"><p class="t-card" style="color:var(--color-brand)">${ev.date.split(' ')[0]}</p><p class="t-caption">${ev.date.split(' ')[1]}</p></div>
        <div style="flex:1"><p class="is-strong" style="font-weight:600;color:var(--text-strong)">${esc(ev.title)}</p><p class="t-caption">${ev.time} · #${ev.channel}</p></div>
        ${pill(ev.type, TYPE[ev.type])}
      </div>`).join('');
  };

  // ---------- Export ----------
  views.export = () => {
    const sets = [['Mensajes', 2481, true], ['Análisis de sentimiento', 2481, true], ['Temas detectados', 24, true], ['Hashtags', 10, false], ['Audiencia', 1842, false], ['Registros de auditoría', 342, false]];
    $('#export-sets').innerHTML = sets.map(([l, n, c], i) => `<label class="c-check c-card c-card--muted" style="padding:var(--space-3)"><input type="checkbox" data-n="${n}" ${c ? 'checked' : ''} id="ex-${i}"><span style="flex:1">${l}</span><span class="t-caption">${nf.format(n)}</span></label>`).join('');
    const estimate = () => {
      const days = Math.max(1, (new Date($('#ex-to').value) - new Date($('#ex-from').value)) / 864e5);
      const tot = sum($$('#export-sets input:checked').map((i) => +i.dataset.n));
      countTo($('#ex-estimate'), Math.round(tot * Math.min(3, days / 30)), { duration: 400 });
    };
    estimate();
    $('#export-form').addEventListener('input', estimate);
    const hist = [['Hoy, 09:12', 'mensajes_octubre.csv', 'Valentina Rojas'], ['15 oct, 18:40', 'sentimiento_q3.xlsx', 'Matías Fuentes'], ['01 oct, 10:05', 'resumen_septiembre.pdf', 'Valentina Rojas']];
    const renderHist = () => { $('#export-history').innerHTML = hist.map(([t, f, u]) => `<div class="c-timeline__item"><p class="is-strong" style="font-weight:600;color:var(--text-strong)">${f}</p><p class="t-caption">${t} · ${u}</p></div>`).join(''); };
    renderHist();
    $('#export-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const fmt = $('#ex-format .is-active').textContent;
      const btn = $('button[type="submit"]', e.currentTarget);
      btn.disabled = true; $('#export-progress').hidden = false;
      progress($('#export-bar'), $('#export-pct'), 2200, null, () => {
        btn.disabled = false;
        const name = `communitylab_export.${fmt.toLowerCase()}`;
        hist.unshift(['Ahora', name, D.roles[role].first + ' ' + D.roles[role].last]); renderHist();
        D.myReports.unshift({ name: 'Exportación ' + fmt, type: fmt, created: '19 oct 2026', size: '—', status: 'Listo' });
        if (inited['my-reports']) views._renderReports();
        toast(`${name} listo para descargar`, 'success');
        setTimeout(() => { $('#export-progress').hidden = true; }, 800);
      });
    });
  };

  // ---------- Mis reportes ----------
  views['my-reports'] = () => {
    let f = '';
    views._renderReports = () => {
      const types = ['', ...new Set(D.myReports.map((r) => r.type))];
      $('#rep-chips').innerHTML = types.map((t) => `<button type="button" class="c-chip${t === f ? ' is-active' : ''}" data-t="${t}">${t || 'Todos'}</button>`).join('');
      $('#rep-table').innerHTML = `<thead><tr><th>Nombre</th><th>Tipo</th><th>Creado</th><th>Tamaño</th><th>Estado</th><th class="is-right">Acciones</th></tr></thead><tbody>${D.myReports.filter((r) => !f || r.type === f).map((r) => `
        <tr><td><div style="display:flex;align-items:center;gap:var(--space-3)"><span class="c-iconbox c-iconbox--sm c-iconbox--neutral">${ic('file', 'icon--sm')}</span><span class="is-strong">${esc(r.name)}</span></div></td>
        <td><span class="c-tag">${r.type}</span></td><td>${r.created}</td><td>${r.size}</td>
        <td>${r.status === 'Listo' ? pill('Listo', 'success', true) : `<span class="c-pill c-pill--warning">${ic('refresh', 'icon--sm spin')}Generando</span>`}</td>
        <td class="is-right"><button class="c-btn c-btn--secondary c-btn--sm" ${r.status === 'Listo' ? '' : 'disabled'} data-toast="Descargando ${esc(r.name)}">${ic('download', 'icon--sm')}Descargar</button></td></tr>`).join('')}</tbody>`;
    };
    views._renderReports();
    $('#rep-chips').addEventListener('click', (e) => { const c = e.target.closest('.c-chip'); if (c) { f = c.dataset.t; views._renderReports(); } });
    setTimeout(() => { D.myReports.forEach((r) => { if (r.status === 'Generando') { r.status = 'Listo'; r.size = '2,1 MB'; } }); views._renderReports(); }, 4000);
  };

  // ---------- Auditoría ----------
  views.audit = () => {
    const LV = { info: ['Info', 'info'], success: ['Éxito', 'success'], warning: ['Advertencia', 'warning'], danger: ['Crítico', 'danger'] };
    const render = () => {
      const q = $('#audit-q').value.toLowerCase(), lv = $('#audit-level').value;
      const rows = D.audit.filter((a) => (!lv || a.level === lv) && (!q || `${a.user} ${a.action} ${a.target} ${a.ip}`.toLowerCase().includes(q)));
      $('#audit-count').textContent = `${rows.length} registros`;
      $('#audit-table').innerHTML = `<thead><tr><th>Fecha</th><th>Usuario</th><th>Acción</th><th>Objetivo</th><th>IP</th><th>Nivel</th></tr></thead><tbody>${rows.map((a) => `
        <tr><td class="t-caption" style="white-space:nowrap">${a.time}</td>
        <td><span class="is-strong">${esc(a.user)}</span><br><span class="t-caption">${ROLE_LABEL[a.role] || a.role}</span></td>
        <td>${esc(a.action)}</td><td>${esc(a.target)}</td><td class="t-mono">${a.ip}</td><td>${pill(LV[a.level][0], LV[a.level][1], true)}</td></tr>`).join('') ||
        `<tr><td colspan="6"><div class="c-empty"><div class="c-empty__icon">${ic('audit', 'icon--lg')}</div><p class="c-empty__title">Sin registros</p></div></td></tr>`}</tbody>`;
    };
    render();
    $('#audit-q').addEventListener('input', render);
    $('#audit-level').addEventListener('input', render);
    if (!CH) return;
    const labels = D.dayLabels(14);
    charts.audit = CH.bar($('#ch-audit'), { labels, stacked: true, radius: 3, datasets: [
      { label: 'Info', data: D.series(14, { base: 18, amp: 10, seed: 41 }), color: '--chart-4' },
      { label: 'Éxito', data: D.series(14, { base: 8, amp: 6, seed: 42 }), color: '--chart-3' },
      { label: 'Advertencia', data: D.series(14, { base: 3, amp: 4, seed: 43 }), color: '--chart-5' },
      { label: 'Crítico', data: D.series(14, { base: 1, amp: 3, seed: 44 }), color: '--sentiment-negative' },
    ] });
    CH.legend($('#lg-audit'), charts.audit);
  };

  // ---------- Seguridad ----------
  views.security = (root) => {
    $('#sec-policy').innerHTML = [['Contraseñas robustas', 92, 'success'], ['Usuarios con 2FA', 80, ''], ['Rotación menor a 90 días', 64, 'danger']].map(([l, v, k]) => `
      <div class="c-meter"><div class="c-meter__row"><span>${l}</span><b>${v}%</b></div><div class="c-progress${k ? ' c-progress--' + k : ''}"><div class="c-progress__bar" data-progress="${v}"></div></div></div>`).join('') +
      `<div class="c-alert c-alert--warning" style="margin-top:var(--space-2)">${ic('alert')}<div>1 usuario no ha cambiado su contraseña en más de 90 días.</div></div>`;
    const mods = [['Dashboard e ingesta', 1, 1, 1], ['Análisis y redacción', 1, 1, 1], ['Informes OCI', 1, 1, 1], ['Insights (historias, hashtags, audiencia…)', 1, 1, 0], ['Auditoría', 1, 0, 0], ['Seguridad y configuración', 1, 0, 0]];
    $('#perm-table').innerHTML = `<thead><tr><th>Módulo</th><th style="text-align:center">Administrador</th><th style="text-align:center">Revisor</th><th style="text-align:center">Community Manager</th></tr></thead><tbody>${mods.map(([n, ...r]) => `
      <tr><td class="is-strong">${n}</td>${r.map((v) => `<td style="text-align:center"><span class="${v ? 'perm' : 'perm-no'}" style="display:inline-flex">${ic(v ? 'check-circle' : 'x')}</span></td>`).join('')}</tr>`).join('')}</tbody>`;
    const ST = { Activo: 'success', Pendiente: 'warning', Inactivo: '' };
    const renderUsers = () => {
      $('#users-table').innerHTML = `<thead><tr><th>Usuario</th><th>Rol</th><th>Estado</th><th>Último acceso</th><th class="is-right"></th></tr></thead><tbody>${D.users.map((u, i) => `
        <tr><td><div style="display:flex;align-items:center;gap:var(--space-3)"><span class="c-avatar c-avatar--sm ${tone(u.name)}">${u.initials}</span><div><span class="is-strong">${esc(u.name)}</span><br><span class="t-caption t-mono">${u.user}</span></div></div></td>
        <td><select class="c-select" style="width:auto;padding-top:.35rem;padding-bottom:.35rem" data-role-of="${i}">${Object.entries(ROLE_LABEL).filter(([k]) => k !== 'system').map(([k, l]) => `<option value="${k}" ${u.role === k ? 'selected' : ''}>${l}</option>`).join('')}</select></td>
        <td>${pill(u.status, ST[u.status], true)}</td><td>${u.last}</td>
        <td class="is-right"><button class="c-btn c-btn--ghost c-btn--icon c-btn--sm" aria-label="Más acciones" data-toast="Menú de acciones (prototipo)">${ic('more')}</button></td></tr>`).join('')}</tbody>`;
    };
    renderUsers();
    $('#users-table').addEventListener('change', (e) => {
      const s = e.target.closest('[data-role-of]'); if (!s) return;
      const u = D.users[+s.dataset.roleOf]; u.role = s.value;
      toast(`${u.name} ahora es ${ROLE_LABEL[u.role]}`, 'success');
    });
    $('#nu-save').addEventListener('click', () => {
      const f = $('#nu-first').value.trim(), l = $('#nu-last').value.trim();
      if (!f || !l) { $('#nu-first').classList.toggle('is-invalid', !f); $('#nu-last').classList.toggle('is-invalid', !l); return; }
      D.users.push({ initials: (f[0] + l[0]).toUpperCase(), name: `${f} ${l}`, user: $('#nu-user').value || `${f}.${l}`.toLowerCase(), role: $('#nu-role').value, status: 'Pendiente', last: 'Nunca' });
      renderUsers(); closeModal($('#user-modal')); toast(`Invitación enviada a ${f} ${l}`, 'success');
      ['#nu-first', '#nu-last', '#nu-user'].forEach((s) => { $(s).value = ''; $(s).classList.remove('is-invalid'); });
    });
    runBars(root);
  };

  // ---------- Configuración ----------
  views.settings = () => {
    const svcs = [['API backend', 'server', 'ok', '118 ms'], ['Bot de Discord', 'bot', 'ok', 'Conectado'], ['Motor de IA', 'sparkles', 'ok', '842 ms'], ['OCI Object Storage', 'cloud', 'ok', '2,4 GB'], ['Base de conocimiento', 'book', 'warn', 'Indexación lenta'], ['Tareas programadas', 'clock', 'ok', 'Próx. 08:00']];
    $('#sys-status').innerHTML = svcs.map(([n, i, s, d]) => `
      <div class="c-card c-card--muted" style="display:flex;align-items:center;gap:var(--space-3);padding:var(--space-4)">
        <span class="c-iconbox c-iconbox--sm c-iconbox--neutral">${ic(i, 'icon--sm')}</span>
        <div style="flex:1;min-width:0"><p style="font-size:var(--text-sm);font-weight:600;color:var(--text-strong)">${n}</p><p class="t-caption">${d}</p></div>
        <span class="status-dot${s === 'warn' ? ' status-dot--warn' : ''}" title="${s === 'warn' ? 'Degradado' : 'Operativo'}"></span>
      </div>`).join('');
    const on = new Set(['ia', 'proyectos', 'ayuda', 'general', 'empleos']);
    const renderCh = () => { $('#dc-channels').innerHTML = D.channels.map((c) => `<button type="button" class="c-chip${on.has(c) ? ' is-active' : ''}" data-c="${c}">#${c}</button>`).join(''); };
    renderCh();
    $('#dc-channels').addEventListener('click', (e) => { const b = e.target.closest('[data-c]'); if (!b) return; on.has(b.dataset.c) ? on.delete(b.dataset.c) : on.add(b.dataset.c); renderCh(); });
    $('#ai-temp').addEventListener('input', (e) => { $('#ai-temp-val').textContent = e.target.value; });
    $('#kb-reindex').addEventListener('click', (e) => busy(e.currentTarget, 2000, () => toast('Base de conocimiento reindexada: 148 documentos', 'success'), 'Reindexando…'));
    const notifs = [['Nuevas quejas críticas', 'Inmediato por correo y Discord', true], ['Contenido pendiente de aprobación', 'Resumen cada 2 horas', true], ['Reporte semanal generado', 'Lunes 08:00', true], ['Intentos de acceso fallidos', 'Solo administradores', true], ['Picos de actividad inusual', 'Cuando supera 2× el promedio', false], ['Resumen diario de la comunidad', 'Todos los días 19:00', false]];
    $('#notif-list').innerHTML = notifs.map(([t, d, c]) => `
      <div class="c-row" style="border:1px solid var(--border-subtle);border-radius:var(--radius-lg);padding:var(--space-3) var(--space-4)">
        <div><p style="font-size:var(--text-sm);font-weight:600;color:var(--text-strong)">${t}</p><p class="t-caption">${d}</p></div>
        <label class="c-switch"><span class="sr-only">${t}</span><input type="checkbox" ${c ? 'checked' : ''}><span class="c-switch__track"></span></label>
      </div>`).join('');
  };

  // ---------- Arranque ----------
  applyRole();
  route();
})();
