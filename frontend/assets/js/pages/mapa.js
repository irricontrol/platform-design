// mapa.js
(function initMapa() {
  const el = document.getElementById("map");
  if (!el) return;

  // Centro inicial (Brasil) ao recarregar a pagina
  const map = L.map("map", {
    zoomControl: false,
    scrollWheelZoom: false
  }).setView([-14.235, -51.9253], 5);

  // Expõe referência para debug/integrações e corrige resize após mudanças de layout
  window.icMap = map;

  // Base: Satélite (Esri World Imagery)
  L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    {
      maxZoom: 19,
      attribution: "Tiles © Esri"
    }
  ).addTo(map);

  // (Opcional) camada de labels por cima, fica bem “Google-like”
  L.tileLayer(
    "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
    {
      maxZoom: 19,
      opacity: 0.85
    }
  ).addTo(map);


  // Hint de zoom com Ctrl + scroll
  const zoomHint = document.createElement("div");
  zoomHint.className = "map-zoom-hint";
  zoomHint.textContent = "Use ctrl + scroll to zoom the map";
  el.appendChild(zoomHint);

  let hintTimer = null;
  const showZoomHint = () => {
    zoomHint.classList.add("is-visible");
    if (hintTimer) clearTimeout(hintTimer);
    hintTimer = setTimeout(() => {
      zoomHint.classList.remove("is-visible");
    }, 1200);
  };

  let wheelMode = "ctrl";
  const applyWheelMode = () => {
    if (wheelMode === "ctrl") {
      map.scrollWheelZoom.disable();
    } else {
      map.scrollWheelZoom.enable();
    }
  };
  applyWheelMode();

  window.icMapSetWheelMode = (mode) => {
    wheelMode = mode === "free" ? "free" : "ctrl";
    applyWheelMode();
  };

  el.addEventListener("wheel", (e) => {
    if (wheelMode === "ctrl" && !e.ctrlKey) showZoomHint();
  }, { passive: true });

  window.addEventListener("keydown", (e) => {
    if (wheelMode !== "ctrl") return;
    if (e.key === "Control") map.scrollWheelZoom.enable();
  });

  window.addEventListener("keyup", (e) => {
    if (wheelMode !== "ctrl") return;
    if (e.key === "Control") map.scrollWheelZoom.disable();
  });

  window.addEventListener("blur", () => {
    if (wheelMode !== "ctrl") return;
    map.scrollWheelZoom.disable();
  });

  const invalidate = () => {
    map.invalidateSize({ pan: false, debounceMoveend: true });
  };

  // Resize normal da janela
  window.addEventListener("resize", invalidate);

  // Mudanças de layout (ex.: colapsar sidebar)
  window.addEventListener("ic:layout-change", () => {
    // rAF + pequeno atraso para pegar o layout já aplicado
    requestAnimationFrame(invalidate);
    setTimeout(invalidate, 180);
  });

  // =========================
  // Pivos no mapa
  // =========================
  const pivotLayer = L.layerGroup().addTo(map);
  const mdnLayer = L.layerGroup().addTo(map);
  const repLayer = L.layerGroup().addTo(map);
  const pumpLayer = L.layerGroup().addTo(map);
  const centralLayer = L.layerGroup().addTo(map);

  const toNumber = (value) => {
    const num = Number(String(value ?? "").replace(",", "."));
    return Number.isFinite(num) ? num : null;
  };

  const parseLatLngText = (text) => {
    const raw = String(text || "").trim();
    if (!raw) return null;
    const parts = raw
      .replaceAll(";", ",")
      .split(/,|\s+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length < 2) return null;
    const lat = toNumber(parts[0]);
    const lng = toNumber(parts[1]);
    if (lat === null || lng === null) return null;
    return { lat, lng };
  };

  const bearingRad = (from, to) => {
    const toRad = (deg) => (deg * Math.PI) / 180;
    const lat1 = toRad(from.lat);
    const lat2 = toRad(to.lat);
    const dLng = toRad(to.lng - from.lng);
    const y = Math.sin(dLng) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
    return Math.atan2(y, x);
  };

  const destinationPoint = (origin, distance, bearing) => {
    const R = 6378137;
    const toRad = (deg) => (deg * Math.PI) / 180;
    const toDeg = (rad) => (rad * 180) / Math.PI;
    const delta = distance / R;
    const theta = bearing;
    const phi1 = toRad(origin.lat);
    const lambda1 = toRad(origin.lng);

    const sinPhi1 = Math.sin(phi1);
    const cosPhi1 = Math.cos(phi1);
    const sinDelta = Math.sin(delta);
    const cosDelta = Math.cos(delta);

    const sinPhi2 = sinPhi1 * cosDelta + cosPhi1 * sinDelta * Math.cos(theta);
    const phi2 = Math.asin(Math.max(-1, Math.min(1, sinPhi2)));
    const y = Math.sin(theta) * sinDelta * cosPhi1;
    const x = cosDelta - sinPhi1 * Math.sin(phi2);
    const lambda2 = lambda1 + Math.atan2(y, x);

    return { lat: toDeg(phi2), lng: toDeg(lambda2) };
  };

  const extractPivotData = (equip) => {
    if (!equip || !equip.type || !equip.data) return null;

    if (equip.type === "smart_connect") {
      const centerLat = toNumber(equip.data.centerLat);
      const centerLng = toNumber(equip.data.centerLng);
      const refLat = toNumber(equip.data.refLat);
      const refLng = toNumber(equip.data.refLng);
      const center =
        Number.isFinite(centerLat) && Number.isFinite(centerLng)
          ? { lat: centerLat, lng: centerLng }
          : parseLatLngText(equip.data.center);
      const ref =
        Number.isFinite(refLat) && Number.isFinite(refLng)
          ? { lat: refLat, lng: refLng }
          : parseLatLngText(equip.data.ref);

      if (!center) return null;
      let radius = toNumber(equip.data.radius);
      if ((!radius || radius <= 0) && ref) {
        radius = L.latLng(center.lat, center.lng).distanceTo([ref.lat, ref.lng]);
      }
      if (!radius || radius <= 0) return null;

      return { center, radius, ref };
    }

    if (equip.type === "smarttouch") {
      const lat = toNumber(equip.data.lat);
      const lng = toNumber(equip.data.lng);
      const center =
        Number.isFinite(lat) && Number.isFinite(lng)
          ? { lat, lng }
          : parseLatLngText(equip.data.loc);
      const radius = toNumber(equip.data.radius);
      if (!center || !radius || radius <= 0) return null;
      return { center, radius, ref: null };
    }

    return null;
  };

  const extractMdnData = (equip) => {
    if (!equip || equip.type !== "medidor" || !equip.data) return null;
    const lat = toNumber(equip.data.lat);
    const lng = toNumber(equip.data.lng);
    const center =
      Number.isFinite(lat) && Number.isFinite(lng)
        ? { lat, lng }
        : parseLatLngText(equip.data.loc);
    if (!center) return null;

    const percentRaw =
      toNumber(equip.data.levelPercent) ??
      toNumber(equip.data.percent) ??
      toNumber(equip.data.nivelPercent);
    const percent = percentRaw === null ? 53 : Math.max(0, Math.min(100, percentRaw));
    return { center, percent };
  };

  const extractRepeaterData = (equip) => {
    if (!equip || equip.type !== "repetidora" || !equip.data) return null;
    const lat = toNumber(equip.data.lat);
    const lng = toNumber(equip.data.lng);
    const center =
      Number.isFinite(lat) && Number.isFinite(lng)
        ? { lat, lng }
        : parseLatLngText(equip.data.loc);
    if (!center) return null;
    return { center };
  };

  const extractPumpData = (equip) => {
    if (!equip || equip.type !== "irripump" || !equip.data) return null;
    const lat = toNumber(equip.data.lat);
    const lng = toNumber(equip.data.lng);
    const center =
      Number.isFinite(lat) && Number.isFinite(lng)
        ? { lat, lng }
        : parseLatLngText(equip.data.loc);
    if (!center) return null;
    return { center };
  };
  const extractCentralData = (equip) => {
    if (!equip || !equip.data) return null;
    if (equip.type !== "smart_connect" && equip.type !== "smarttouch") return null;

    // Se tiver raio, provavelmente é um pivo e já foi desenhado no pivotLayer
    const pivot = extractPivotData(equip);
    if (pivot && pivot.radius > 0) return null;

    const lat = toNumber(equip.data.lat || equip.data.centerLat);
    const lng = toNumber(equip.data.lng || equip.data.centerLng);
    const center =
      Number.isFinite(lat) && Number.isFinite(lng)
        ? { lat, lng }
        : parseLatLngText(equip.data.loc || equip.data.center);

    if (!center) return null;
    return { center };
  };


  const drawPivot = (pivot, equip) => {
    const layer = L.circle([pivot.center.lat, pivot.center.lng], {
      radius: pivot.radius,
      color: "#c78a1d",
      weight: 2,
      fillColor: "#d39b2b",
      fillOpacity: 0.55,
    }).addTo(pivotLayer);

    // Tooltip customizado ("Balão")
    const tooltipHtml = `
      <div class="pivot-tooltip">
        <span class="pivot-tooltip__name">${equip.name || "Pivô"}</span>
        <span class="pivot-tooltip__status is-warning">PAINEL ENERGIZADO</span>
        <span class="pivot-tooltip__date">20 fev 2026 17:41</span>
      </div>
    `;

    layer.bindTooltip(tooltipHtml, {
      permanent: false,
      direction: "top",
      className: "pivot-tooltip-wrap",
      opacity: 1,
      offset: [0, -10]
    });

    layer.on("click", () => {
      const action = localStorage.getItem('ic:pivot-click-action') || 'details';

      if (action === 'schedule') {
        if (window.OpModal && typeof window.OpModal.open === "function") {
          window.OpModal.open({
            title: equip.name || "Pivô",
            pivotId: equip.id
          });
        }
      } else {
        if (window.IcPivos && typeof window.IcPivos.open === "function") {
          window.IcPivos.open({ pivotId: equip.id });
        }
      }
    });

    if (!pivot.ref) return;

    const ang = bearingRad(pivot.center, pivot.ref);
    const lineEnd = destinationPoint(pivot.center, pivot.radius, ang);
    L.polyline(
      [
        [pivot.center.lat, pivot.center.lng],
        [lineEnd.lat, lineEnd.lng],
      ],
      { color: "#ffffff", weight: 2, opacity: 0.95 }
    ).addTo(pivotLayer);

    const wedgeAngle = (8 * Math.PI) / 180;
    const left = destinationPoint(pivot.center, pivot.radius, ang - wedgeAngle);
    const right = destinationPoint(pivot.center, pivot.radius, ang + wedgeAngle);
    const inner = destinationPoint(pivot.center, pivot.radius * 0.7, ang);
    L.polygon(
      [
        [left.lat, left.lng],
        [right.lat, right.lng],
        [inner.lat, inner.lng],
      ],
      { color: "#ffffff", weight: 1, fillColor: "#ffffff", fillOpacity: 0.95 }
    ).addTo(pivotLayer);
  };

  const drawMdn = (mdn, equip) => {
    const label = `${mdn.percent.toFixed(2)}%`;
    const icon = L.divIcon({
      className: "",
      html: `<div class="map-mdn-marker"><span class="map-mdn-marker__value">${label}</span></div>`,
      iconSize: [48, 48],
      iconAnchor: [24, 24],
    });
    const layer = L.marker([mdn.center.lat, mdn.center.lng], { icon }).addTo(mdnLayer);

    const tooltipHtml = `
      <div class="pivot-tooltip">
        <span class="pivot-tooltip__name">${equip.name || "MDN"}</span>
        <span class="pivot-tooltip__status is-info">${mdn.percent.toFixed(2)}% (4.24m)</span>
        <span class="pivot-tooltip__date">30 dez 2025 15:25</span>
      </div>
    `;

    layer.bindTooltip(tooltipHtml, {
      permanent: false,
      direction: "top",
      className: "pivot-tooltip-wrap",
      opacity: 1,
      offset: [0, -10]
    });
  };

  const drawRepeater = (rep, equip) => {
    const icon = L.icon({
      iconUrl: "./assets/img/svg/radio.svg",
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      className: "map-rep-marker",
    });
    const layer = L.marker([rep.center.lat, rep.center.lng], { icon }).addTo(repLayer);

    const tooltipHtml = `
      <div class="pivot-tooltip">
        <span class="pivot-tooltip__name">${equip.name || "Repetidora"}</span>
      </div>
    `;

    layer.bindTooltip(tooltipHtml, {
      permanent: false,
      direction: "top",
      className: "pivot-tooltip-wrap",
      opacity: 1,
      offset: [0, -10]
    });
  };

  const drawPump = (pump, equip) => {
    const icon = L.icon({
      iconUrl: "./assets/img/svg/irripump.svg",
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      className: "map-pump-marker",
    });
    const layer = L.marker([pump.center.lat, pump.center.lng], { icon }).addTo(pumpLayer);

    const tooltipHtml = `
      <div class="pivot-tooltip">
        <span class="pivot-tooltip__name">${equip.name || "Bomba"}</span>
        <span class="pivot-tooltip__status is-warning">DESLIGADA PELA INTERNET</span>
        <span class="pivot-tooltip__date">04 mar 2026 15:15</span>
      </div>
    `;

    layer.bindTooltip(tooltipHtml, {
      permanent: false,
      direction: "top",
      className: "pivot-tooltip-wrap",
      opacity: 1,
      offset: [0, -10]
    });
  };
  const drawCentral = (central, equip) => {
    const icon = L.icon({
      iconUrl: "./assets/img/svg/central.svg",
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      className: "map-central-marker",
    });
    const layer = L.marker([central.center.lat, central.center.lng], { icon }).addTo(centralLayer);

    const tooltipHtml = `
      <div class="pivot-tooltip">
        <span class="pivot-tooltip__name">${equip.name || "Central"}</span>
      </div>
    `;

    layer.bindTooltip(tooltipHtml, {
      permanent: false,
      direction: "top",
      className: "pivot-tooltip-wrap",
      opacity: 1,
      offset: [0, -10]
    });
  };

  const renderMapEquipments = (farm) => {
    pivotLayer.clearLayers();
    mdnLayer.clearLayers();
    repLayer.clearLayers();
    pumpLayer.clearLayers();
    centralLayer.clearLayers();
    if (!farm || !Array.isArray(farm.equipments)) return;

    farm.equipments.forEach((equip) => {
      const pivot = extractPivotData(equip);
      if (!pivot) return;
      drawPivot(pivot, equip);
    });

    farm.equipments.forEach((equip) => {
      const mdn = extractMdnData(equip);
      if (!mdn) return;
      drawMdn(mdn, equip);
    });

    farm.equipments.forEach((equip) => {
      const rep = extractRepeaterData(equip);
      if (!rep) return;
      drawRepeater(rep, equip);
    });

    farm.equipments.forEach((equip) => {
      const pump = extractPumpData(equip);
      if (!pump) return;
      drawPump(pump, equip);
    });

    farm.equipments.forEach((equip) => {
      const central = extractCentralData(equip);
      if (!central) return;
      drawCentral(central, equip);
    });
  };

  window.IcMapRenderPivots = renderMapEquipments;
  window.IcMapClearPivots = () => {
    pivotLayer.clearLayers();
    mdnLayer.clearLayers();
    repLayer.clearLayers();
    pumpLayer.clearLayers();
    centralLayer.clearLayers();
  };
})();

(function initMapCard() {
  const toggles = document.querySelectorAll(".map-card__item--toggle");
  if (!toggles.length) return;

  toggles.forEach(toggle => {
    toggle.addEventListener("click", () => {
      const panelId = toggle.dataset.panel;
      const panel = document.querySelector(`.map-card__panel[data-panel="${panelId}"]`);
      if (!panel) return;

      const isOpen = panel.classList.toggle("is-open");
      toggle.classList.toggle("is-open", isOpen);
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
      panel.setAttribute("aria-hidden", isOpen ? "false" : "true");
    });
  });
})();

(function initMapEquipBar() {
  const panel = document.getElementById("mapEquip");
  if (!panel) return;

  const stopEvent = (event) => {
    if (!event) return;
    event.stopPropagation();
  };

  const bindStop = (el) => {
    if (!el) return;
    ["pointerdown", "mousedown", "touchstart", "click", "dblclick", "wheel"].forEach((evt) => {
      el.addEventListener(evt, stopEvent);
    });
  };

  bindStop(panel);
})();
