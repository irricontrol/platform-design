// assets/js/pages/chuva-geo/ui.panel.js
(function () {
  'use strict';

  const Cg = (window.ChuvaGeo = window.ChuvaGeo || {});
  const state = (Cg.state = Cg.state || {});
  const data = (Cg.data = Cg.data || {});
  const dom = (Cg.dom = Cg.dom || {});
  const layers = (Cg.layers = Cg.layers || {});
  const panel = (Cg.panel = Cg.panel || {});
  const $ = dom.$ || ((id) => document.getElementById(id));

  const RESET_OPACITY = 0.7;

  function toPercent(value) {
    return Math.round(value * 100);
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function setOpacity(value) {
    const next = clamp(value, 0, 1);
    state.rainOpacity = next;
    layers.rain?.setOpacity?.(next);
    const slider = $('chuvaGeoOpacity');
    const label = $('chuvaGeoOpacityValue');
    if (slider) {
      const pct = toPercent(next);
      slider.value = String(pct);
      slider.style.setProperty('--cg-fill', `${pct}%`);
    }
    if (label) label.textContent = `${toPercent(next)}%`;
  }

  function updateLegend() {
    const maxLabel = $('chuvaGeoMaxLabel');
    const maxMm = state.rainMaxMm || data.rainMaxMm || 25;
    if (maxLabel) maxLabel.textContent = `${maxMm} mm`;
  }

  function updateDisabled() {
    const slider = $('chuvaGeoOpacity');
    const reset = $('chuvaGeoOpacityReset');
    const legend = $('chuvaGeoLegendSection');
    const disabled = !state.showRain;
    if (slider) slider.disabled = disabled;
    if (reset) reset.disabled = disabled;
    if (legend) legend.classList.toggle('is-disabled', disabled);
  }

  function syncUI() {
    const rainToggle = $('chuvaGeoRainToggle');
    const irrigationToggle = $('chuvaGeoIrrigationToggle');

    if (rainToggle) rainToggle.checked = !!state.showRain;
    if (irrigationToggle) irrigationToggle.checked = !!state.showIrrigation;

    setOpacity(typeof state.rainOpacity === 'number' ? state.rainOpacity : RESET_OPACITY);
    updateLegend();
    updateDisabled();
  }

  function bindUI() {
    function haltEvent(event) {
      if (!event) return;
      event.stopPropagation();
    }

    function bindStopPropagation(target) {
      if (!target) return;
      const events = ['pointerdown', 'mousedown', 'touchstart', 'click', 'dblclick', 'wheel'];
      events.forEach((evt) => target.addEventListener(evt, haltEvent));
    }

    const panelRoot = $('chuvaGeoPanel');
    bindStopPropagation(panelRoot);

    const closeBtn = $('chuvaGeoClose');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        window.IcChuvaGeo?.close?.();
      });
    }

    const rainToggle = $('chuvaGeoRainToggle');
    if (rainToggle) {
      bindStopPropagation(rainToggle);
      rainToggle.checked = !!state.showRain;
      rainToggle.addEventListener('change', () => {
        state.userTouched = true;
        state.showRain = !!rainToggle.checked;
        if (state.showRain) layers.rain?.add?.();
        else layers.rain?.remove?.();
        updateDisabled();
      });
    }

    const irrigationToggle = $('chuvaGeoIrrigationToggle');
    if (irrigationToggle) {
      bindStopPropagation(irrigationToggle);
      irrigationToggle.checked = !!state.showIrrigation;
      irrigationToggle.addEventListener('change', () => {
        state.userTouched = true;
        state.showIrrigation = !!irrigationToggle.checked;
        if (state.showIrrigation) layers.irrigation?.add?.();
        else layers.irrigation?.remove?.();
      });
    }

    const slider = $('chuvaGeoOpacity');
    if (slider) {
      slider.value = String(toPercent(state.rainOpacity || RESET_OPACITY));
      bindStopPropagation(slider);
      slider.addEventListener('input', () => {
        const value = clamp(Number(slider.value) / 100, 0, 1);
        setOpacity(value);
      });
    }

    const reset = $('chuvaGeoOpacityReset');
    if (reset) {
      reset.addEventListener('click', () => {
        setOpacity(RESET_OPACITY);
      });
    }
  }

  panel.bindUI = bindUI;
  panel.syncUI = syncUI;
})();
