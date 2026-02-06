// assets/js/pages/chuva-geo/layers.irrigation.js
(function () {
  'use strict';

  const Cg = (window.ChuvaGeo = window.ChuvaGeo || {});
  const data = (Cg.data = Cg.data || {});
  const state = (Cg.state = Cg.state || {});
  const layers = (Cg.layers = Cg.layers || {});
  const irrigation = (layers.irrigation = layers.irrigation || {});

  function buildLayer() {
    if (!window.L) return null;
    const group = L.layerGroup();

    (data.irrigationAreas || []).forEach((area) => {
      const circle = L.circle(area.center, {
        radius: area.radius,
        color: '#16a34a',
        weight: 2,
        fillColor: '#16a34a',
        fillOpacity: 0.08,
        dashArray: '6 6',
      });

      circle.bindTooltip(area.name, { direction: 'center' });
      group.addLayer(circle);
    });

    return group;
  }

  function ensureLayer() {
    if (state.layers && state.layers.irrigation) return state.layers.irrigation;
    state.layers = state.layers || {};
    const layer = buildLayer();
    if (layer) state.layers.irrigation = layer;
    return layer;
  }

  function add() {
    const map = window.icMap;
    const layer = ensureLayer();
    if (!map || !layer) return;
    if (!map.hasLayer(layer)) layer.addTo(map);
  }

  function remove() {
    const map = window.icMap;
    const layer = state.layers && state.layers.irrigation;
    if (!map || !layer) return;
    if (map.hasLayer(layer)) map.removeLayer(layer);
  }

  function rebuild() {
    remove();
    if (state.layers) state.layers.irrigation = null;
    add();
  }

  irrigation.add = add;
  irrigation.remove = remove;
  irrigation.rebuild = rebuild;
})();
