// assets/js/pages/pluviometria/view.map.js
(function () {
  "use strict";

  const Plv = (window.Plv = window.Plv || {});
  const data = (Plv.data = Plv.data || {});
  const state = (Plv.state = Plv.state || {});
  const dom = (Plv.dom = Plv.dom || {});
  const views = (Plv.views = Plv.views || {});
  const mapView = (views.map = views.map || {});
  const $ = dom.$ || ((id) => document.getElementById(id));
  const formatDateBR = dom.formatDateBR || ((d) => {
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yy = d.getFullYear();
    return `${dd}/${mm}/${yy}`;
  });

  function openPluvPanel() {
    if (!document.body.classList.contains("pluv-panel-open")) {
      document.body.classList.add("pluv-panel-open");
    }
    window.IcChuvaGeo?.ensureDefaultOff?.();
    window.icMapSetWheelMode?.("ctrl");
    const target = $("pluvPanel") || $("pageSlot");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function resetPluvPanelState() {
    document.body.classList.remove("pluv-panel-open");
    window.icMapSetWheelMode?.("free");
  }

  function bindPluvMapbar() {
    const button = document.querySelector(".pluv-mapbar__report");
    if (!button || button.dataset.bound) return;
    button.dataset.bound = "1";
    button.addEventListener("click", (event) => {
      event.preventDefault();
      openPluvPanel();
    });

  }

  function formatPeriodLabel() {
    const period = Plv.period?.getPeriod?.() || state.period || null;
    if (period && period.start && period.end) {
      return `${formatDateBR(period.start)} → ${formatDateBR(period.end)}`;
    }
    return "Últimas 24h";
  }

  function updatePeriodDisplays() {
    const period = Plv.period?.getPeriod?.() || state.period || null;
    const startLabelEl = document.querySelector(".pluv-mapbar__range-start");
    const endLabelEl = document.querySelector(".pluv-mapbar__range-end");
    if (startLabelEl && endLabelEl) {
      startLabelEl.textContent = period?.start ? formatDateBR(period.start) : "—";
      endLabelEl.textContent = period?.end ? formatDateBR(period.end) : "—";
    }

    const reportsLabel = document.querySelector(".pluv-reports__filter-label");
    if (reportsLabel) {
      reportsLabel.textContent = `Período: ${formatPeriodLabel()}`;
    }
    const rainLabel = document.querySelector(".rain__period-label");
    if (rainLabel) {
      rainLabel.textContent = `Período: ${formatPeriodLabel()}`;
    }
  }

  function iconFor(p) {
    const cls = `pluv-pin ${p.semComunicacao ? "is-off" : ""}`;
    const mmValue = p.semComunicacao
      ? "--"
      : Number.isFinite(Number(p.mm))
        ? Number(p.mm).toFixed(1).replace(".", ",")
        : "--";
    return L.divIcon({
      className: "",
      html: `
        <div class="${cls}" title="${p.nome}">
          <div class="pluv-pin__bubble">
            <span class="pluv-pin__value">${mmValue}</span>
            <span class="pluv-pin__unit">mm</span>
          </div>
        </div>
      `,
      iconSize: [52, 60],
      iconAnchor: [26, 60],
    });
  }

  function renderMarkers() {
    if (!window.icMap || !window.L) return;

    if (!document.body.classList.contains("is-pluviometria")) {
      if (state.layer) {
        try { state.layer.remove(); } catch (_) {}
        state.layer = null;
      }
      return;
    }

    if (state.layer) {
      try { state.layer.remove(); } catch (_) {}
      state.layer = null;
    }

    state.layer = L.layerGroup().addTo(window.icMap);

    const list = Plv.cards?.selectedList?.() || data.PLUVIOS || [];
    list.forEach((p) => {
      L.marker([p.lat, p.lng], { icon: iconFor(p) })
        .addTo(state.layer)
        .bindPopup(`<strong>${p.nome}</strong><br/>${p.mm.toFixed(1)} mm<br/>${p.updated}`);
    });
  }

  function focusOnMapIfSingle() {
    if (state.selected.size !== 1) return;
    const only = (data.PLUVIOS || []).find((p) => state.selected.has(p.id));
    if (!only) return;
    window.icMap?.setView?.([only.lat, only.lng], 16);
  }

  mapView.openPluvPanel = openPluvPanel;
  mapView.resetPluvPanelState = resetPluvPanelState;
  mapView.bindPluvMapbar = bindPluvMapbar;
  mapView.formatPeriodLabel = formatPeriodLabel;
  mapView.updatePeriodDisplays = updatePeriodDisplays;
  mapView.renderMarkers = renderMarkers;
  mapView.focusOnMapIfSingle = focusOnMapIfSingle;
})();
