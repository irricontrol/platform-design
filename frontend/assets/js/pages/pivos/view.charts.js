// assets/js/pages/pivos/view.charts.js
(function () {
  "use strict";

  const Pivos = (window.Pivos = window.Pivos || {});
  const state = (Pivos.state = Pivos.state || {});
  const views = (Pivos.views = Pivos.views || {});
  const chartsView = (views.charts = views.charts || {});

  // ---------- Helpers ----------
  function polarToXY(cx, cy, r, angleDeg) {
    const a = (angleDeg - 90) * (Math.PI / 180); // começa no topo
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  }

  function donutSectorPath(cx, cy, rOuter, rInner, startDeg, endDeg) {
    const p1 = polarToXY(cx, cy, rOuter, startDeg);
    const p2 = polarToXY(cx, cy, rOuter, endDeg);
    const p3 = polarToXY(cx, cy, rInner, endDeg);
    const p4 = polarToXY(cx, cy, rInner, startDeg);

    const largeArc = endDeg - startDeg > 180 ? 1 : 0;

    return [
      `M ${p1.x} ${p1.y}`,
      `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${p2.x} ${p2.y}`,
      `L ${p3.x} ${p3.y}`,
      `A ${rInner} ${rInner} 0 ${largeArc} 0 ${p4.x} ${p4.y}`,
      "Z",
    ].join(" ");
  }

  function pieSectorPath(cx, cy, r, startDeg, endDeg) {
    const p1 = polarToXY(cx, cy, r, startDeg);
    const p2 = polarToXY(cx, cy, r, endDeg);
    const largeArc = endDeg - startDeg > 180 ? 1 : 0;

    return [
      `M ${cx} ${cy}`,
      `L ${p1.x} ${p1.y}`,
      `A ${r} ${r} 0 ${largeArc} 1 ${p2.x} ${p2.y}`,
      "Z",
    ].join(" ");
  }

  /**
   * NOTA: A função bringToFrontOnHover foi desativada.
   * Re-anexar o elemento ao DOM no mouseenter reseta o estado de :hover 
   * e impede que a transição de borda preta do CSS funcione corretamente.
   */
  function bringToFrontOnHover(svg, selector) {
    // Desativado para evitar conflito com CSS Transitions
    return;
  }

  // ---------- Donut ----------
  function renderDonut(el, segments, opts = {}) {
    if (!el) return;

    const cx = 50;
    const cy = 50;

    const rOuter = opts.rOuter ?? 45;
    const rInner = opts.rInner ?? 32;
    const gapDeg = opts.gapDeg ?? 1.2;

    const total = segments.reduce((acc, s) => acc + (Number(s.value) || 0), 0) || 1;

    el.innerHTML = "";

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 100 100");
    svg.setAttribute("class", "donut-svg");

    let angle = 0;

    segments.forEach((seg) => {
      const v = Math.max(0, Number(seg.value) || 0);
      const sweep = (v / total) * 360;

      let s = angle + gapDeg / 2;
      let e = angle + sweep - gapDeg / 2;

      if (sweep <= gapDeg + 0.2) {
        s = angle;
        e = angle + sweep;
      }

      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", donutSectorPath(cx, cy, rOuter, rInner, s, e));
      path.setAttribute("fill", seg.color);
      path.setAttribute("class", "donut-sector");
      path.setAttribute("data-label", seg.label);
      
      // Inicializa propriedades de stroke para garantir transição suave no CSS
      path.style.strokeWidth = "0px";

      svg.appendChild(path);
      angle += sweep;
    });

    el.appendChild(svg);

    const center = document.createElement("div");
    center.className = "donut-center-text";
    center.innerHTML = `${opts.centerTop ?? "R$ 0.00"}<br>${opts.centerBottom ?? "Total"}`;
    el.appendChild(center);
  }

  // ---------- Pie ----------
  function renderPie(el, segments, opts = {}) {
    if (!el) return;

    const cx = 50;
    const cy = 50;

    const r = opts.r ?? 45;
    const gapDeg = opts.gapDeg ?? 1.0;

    const total = segments.reduce((acc, s) => acc + (Number(s.value) || 0), 0) || 1;

    el.innerHTML = "";

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 100 100");
    svg.setAttribute("class", "pie-svg");

    let angle = 0;

    segments.forEach((seg) => {
      const v = Math.max(0, Number(seg.value) || 0);
      const sweep = (v / total) * 360;

      let s = angle + gapDeg / 2;
      let e = angle + sweep - gapDeg / 2;

      if (sweep <= gapDeg + 0.2) {
        s = angle;
        e = angle + sweep;
      }

      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", pieSectorPath(cx, cy, r, s, e));
      path.setAttribute("fill", seg.color);
      path.setAttribute("class", "pie-sector");
      path.setAttribute("data-label", seg.label);

      // Inicializa propriedades de stroke
      path.style.strokeWidth = "0px";

      svg.appendChild(path);
      angle += sweep;
    });

    el.appendChild(svg);
  }

  // ---------- Main render ----------
  function renderCharts() {
    const custosEl = document.getElementById("pivoChartCustos");
    if (custosEl) {
      renderDonut(
        custosEl,
        [
          { label: "Reduzido", value: 33, color: "#86efac" },
          { label: "Fora do Horário de Pico", value: 33, color: "#93c5fd" },
          { label: "Horário de Pico", value: 34, color: "#f87171" },
        ],
        {
          rOuter: 46,
          rInner: 32,
          gapDeg: 1.2,
          centerTop: "R$ 0.00",
          centerBottom: "Total",
        }
      );
    }

    const consumoEl = document.getElementById("pivoChartConsumo");
    if (consumoEl) {
      consumoEl.classList.add("pivo-chart-container--pie");
      renderPie(
        consumoEl,
        [
          { label: "Reduzido", value: 33, color: "#86efac" },
          { label: "Fora do Horário de Pico", value: 33, color: "#93c5fd" },
          { label: "Horário de Pico", value: 34, color: "#f87171" },
        ],
        {
          r: 45,
          gapDeg: 1.0,
        }
      );
    }
  }

  chartsView.renderCharts = renderCharts;
})();