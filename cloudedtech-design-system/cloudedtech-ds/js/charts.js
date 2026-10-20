/* ==========================================================================
   CloudEdTech CommunityLab — Fábrica de gráficos (Chart.js 4.4.1)
   Todos los colores salen de los tokens CSS para que el sistema sea único.
   ========================================================================== */
(function () {
  'use strict';
  if (!window.Chart) { console.warn('Chart.js no cargó; los gráficos se omiten.'); return; }

  const root = document.documentElement;
  const probe = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  const cache = {};

  /** Resuelve un token (--chart-1) o color CSS a [r,g,b] usando un canvas de 1px. */
  function rgbOf(value) {
    const raw = value.startsWith('--') ? getComputedStyle(root).getPropertyValue(value).trim() : value;
    if (cache[raw]) return cache[raw];
    probe.clearRect(0, 0, 1, 1);
    probe.fillStyle = '#000';
    probe.fillStyle = raw;
    probe.fillRect(0, 0, 1, 1);
    const [r, g, b] = probe.getImageData(0, 0, 1, 1).data;
    return (cache[raw] = [r, g, b]);
  }
  const color = (t, a = 1) => { const [r, g, b] = rgbOf(t); return a === 1 ? `rgb(${r},${g},${b})` : `rgba(${r},${g},${b},${a})`; };

  const PALETTE = ['--chart-1', '--chart-2', '--chart-3', '--chart-4', '--chart-5', '--chart-6'];
  const nf = new Intl.NumberFormat('es-CL');

  // ---------- Defaults globales ----------
  const C = Chart;
  C.defaults.font.family = getComputedStyle(root).getPropertyValue('--font-sans').trim() || 'Arial, sans-serif';
  C.defaults.font.size = 12;
  C.defaults.color = color('--slate-500');
  C.defaults.borderColor = color('--chart-grid');
  C.defaults.maintainAspectRatio = false;
  C.defaults.animation.duration = 900;
  C.defaults.animation.easing = 'easeOutQuart';
  C.defaults.plugins.legend.display = false;
  Object.assign(C.defaults.plugins.tooltip, {
    backgroundColor: color('--slate-900'),
    titleColor: '#fff',
    bodyColor: color('--slate-300'),
    footerColor: color('--orange-300'),
    padding: 10,
    cornerRadius: 8,
    boxPadding: 4,
    usePointStyle: true,
    titleFont: { weight: '600' },
    caretSize: 5,
  });
  C.defaults.plugins.tooltip.callbacks.label = (ctx) => {
    const p = ctx.parsed;
    const v = typeof p === 'number' ? p : (p.r ?? (ctx.chart.options.indexAxis === 'y' ? p.x : p.y));
    return ` ${ctx.dataset.label || ctx.label}: ${nf.format(v)}`;
  };
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) C.defaults.animation = false;

  // Línea vertical al pasar el mouse (crosshair)
  const crosshair = {
    id: 'crosshair',
    afterDatasetsDraw(chart) {
      const act = chart.tooltip?.getActiveElements?.();
      if (!act || !act.length || chart.config.type !== 'line') return;
      const x = act[0].element.x;
      const { top, bottom } = chart.chartArea;
      const ctx = chart.ctx;
      ctx.save();
      ctx.strokeStyle = color('--slate-300');
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, bottom); ctx.stroke();
      ctx.restore();
    },
  };
  C.register(crosshair);

  const scales = (opts = {}) => ({
    x: { grid: { display: false }, border: { display: false }, ticks: { maxRotation: 0, autoSkipPadding: 14, color: color('--chart-axis') }, ...opts.x },
    y: { beginAtZero: true, grid: { color: color('--chart-grid') }, border: { display: false }, ticks: { color: color('--chart-axis'), padding: 8, callback: (v) => nf.format(v) }, ...opts.y },
  });

  /** Degradado vertical para áreas. */
  function gradient(token, from = 0.32, to = 0) {
    return (ctx) => {
      const { chart } = ctx;
      const area = chart.chartArea;
      if (!area) return color(token, from);
      const g = chart.ctx.createLinearGradient(0, area.top, 0, area.bottom);
      g.addColorStop(0, color(token, from));
      g.addColorStop(1, color(token, to));
      return g;
    };
  }

  // ---------- Tipos ----------
  function area(canvas, { labels, datasets, stacked = false, yMax, unit = '' }) {
    return new C(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: datasets.map((d, i) => {
          const tk = d.color || PALETTE[i];
          return {
            label: d.label, data: d.data, tension: 0.38, fill: d.fill ?? (i === 0 ? 'origin' : false),
            borderColor: color(tk), backgroundColor: gradient(tk, i === 0 ? 0.28 : 0.12),
            borderWidth: i === 0 ? 2.5 : 2, borderDash: d.dashed ? [5, 5] : undefined,
            pointRadius: 0, pointHoverRadius: 5, pointHoverBorderWidth: 2, pointHoverBorderColor: '#fff',
            pointBackgroundColor: color(tk), _token: tk,
          };
        }),
      },
      options: {
        interaction: { mode: 'index', intersect: false },
        scales: scales({ y: { stacked, max: yMax, ticks: { color: color('--chart-axis'), padding: 8, callback: (v) => nf.format(v) + unit } } }),
        plugins: unit ? { tooltip: { callbacks: { label: (c) => ` ${c.dataset.label}: ${nf.format(c.parsed.y)}${unit}` } } } : {},
      },
    });
  }

  function donut(canvas, { labels, values, colors, center, onHover }) {
    const tokens = colors || PALETTE;
    const total = values.reduce((a, b) => a + b, 0);
    const ch = new C(canvas, {
      type: 'doughnut',
      data: { labels, datasets: [{ data: values, backgroundColor: tokens.map((t) => color(t)), hoverBackgroundColor: tokens.map((t) => color(t)), borderColor: '#fff', borderWidth: 3, hoverOffset: 8, _tokens: tokens }] },
      options: {
        cutout: '72%',
        layout: { padding: 8 },
        animation: { animateRotate: true, animateScale: true },
        plugins: { tooltip: { callbacks: { label: (c) => ` ${c.label}: ${nf.format(c.raw)} (${Math.round((c.raw / total) * 100)}%)` } } },
        onHover: (_e, els) => {
          if (!center) return;
          const b = center.querySelector('b'), s = center.querySelector('span');
          const meta = ch.getDatasetMeta(0);
          const visTotal = ch.data.datasets[0].data.reduce((a, v, i) => a + (meta.data[i].hidden ? 0 : v), 0) || 1;
          if (els.length) {
            const i = els[0].index;
            b.textContent = Math.round((ch.data.datasets[0].data[i] / visTotal) * 100) + '%';
            b.style.color = color(tokens[i]);
            s.textContent = labels[i];
          } else {
            b.textContent = center.dataset.value; b.style.color = ''; s.textContent = center.dataset.label;
          }
          onHover && onHover(els);
        },
      },
    });
    return ch;
  }

  function bar(canvas, { labels, datasets, horizontal = false, stacked = false, highlightMax = false, radius = 6 }) {
    return new C(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: datasets.map((d, i) => {
          const tk = d.color || PALETTE[i];
          const max = Math.max(...d.data);
          const bg = highlightMax ? d.data.map((v) => color(tk, v === max ? 1 : 0.35)) : color(tk);
          return {
            label: d.label, data: d.data, backgroundColor: bg, hoverBackgroundColor: color(tk),
            borderRadius: radius, borderSkipped: false, maxBarThickness: horizontal ? 22 : 36, categoryPercentage: 0.72, _token: tk,
          };
        }),
      },
      options: {
        indexAxis: horizontal ? 'y' : 'x',
        interaction: { mode: 'index', intersect: false },
        scales: horizontal
          ? { x: { ...scales().y, stacked }, y: { ...scales().x, stacked, ticks: { color: color('--slate-600'), font: { weight: '500' } } } }
          : scales({ x: { stacked }, y: { stacked } }),
      },
    });
  }

  function sparkline(canvas, data, token = '--chart-1') {
    return new C(canvas, {
      type: 'line',
      data: { labels: data.map((_, i) => i), datasets: [{ data, borderColor: color(token), backgroundColor: gradient(token, 0.25), fill: 'origin', borderWidth: 2, tension: 0.4, pointRadius: 0 }] },
      options: { plugins: { tooltip: { enabled: false } }, scales: { x: { display: false }, y: { display: false, beginAtZero: false } }, animation: { duration: 1200 }, events: [] },
    });
  }

  function radar(canvas, { labels, datasets }) {
    return new C(canvas, {
      type: 'radar',
      data: { labels, datasets: datasets.map((d, i) => { const tk = d.color || PALETTE[i]; return { label: d.label, data: d.data, borderColor: color(tk), backgroundColor: color(tk, 0.15), pointBackgroundColor: color(tk), borderWidth: 2, pointRadius: 3, _token: tk }; }) },
      options: { scales: { r: { beginAtZero: true, grid: { color: color('--chart-grid') }, angleLines: { color: color('--chart-grid') }, ticks: { display: false }, pointLabels: { color: color('--slate-600'), font: { size: 11 } } } } },
    });
  }

  /** Reemplaza datos y anima la transición. */
  function update(chart, labels, datasetsData) {
    if (labels) chart.data.labels = labels;
    datasetsData.forEach((data, i) => {
      const ds = chart.data.datasets[i];
      ds.data = data;
      if (Array.isArray(ds.backgroundColor) && chart.config.type === 'bar' && ds._token) {
        const max = Math.max(...data);
        ds.backgroundColor = data.map((v) => color(ds._token, v === max ? 1 : 0.35));
      }
    });
    chart.update();
  }

  /** Leyenda HTML clicable (oculta/muestra series o segmentos). */
  function legend(container, chart, { values, stacked = false } = {}) {
    const isArc = ['doughnut', 'pie', 'polarArea'].includes(chart.config.type);
    const items = isArc
      ? chart.data.labels.map((l, i) => ({ label: l, token: chart.data.datasets[0]._tokens[i], i }))
      : chart.data.datasets.map((d, i) => ({ label: d.label, token: d._token, i }));
    container.className = 'c-legend' + (stacked ? ' c-legend--stack' : '');
    container.innerHTML = items.map((it) => `
      <button type="button" class="c-legend__item" data-i="${it.i}" aria-pressed="true">
        <span class="c-legend__swatch" style="background:${color(it.token)}"></span>${it.label}
        ${values ? `<span class="c-legend__value">${values[it.i]}</span>` : ''}
      </button>`).join('');
    container.addEventListener('click', (e) => {
      const btn = e.target.closest('.c-legend__item'); if (!btn) return;
      const i = +btn.dataset.i;
      if (isArc) chart.toggleDataVisibility(i);
      else chart.setDatasetVisibility(i, !chart.isDatasetVisible(i));
      chart.update();
      const off = isArc ? !chart.getDataVisibility(i) : !chart.isDatasetVisible(i);
      btn.classList.toggle('is-off', off);
      btn.setAttribute('aria-pressed', String(!off));
    });
  }

  window.CECharts = { color, area, donut, bar, sparkline, radar, update, legend, nf };
})();
