(function () {
  "use strict";

  const state = { isOpen: false };
  const $ = (id) => document.getElementById(id);
  const TIMEZONE_LABELS = {
    "Africa/Abidjan": "África/Abidjan (GMT+00)",
    "America/Sao_Paulo": "América/São Paulo (GMT-03)",
    "America/Cuiaba": "América/Cuiabá (GMT-04)",
    "America/Manaus": "América/Manaus (GMT-04)",
    "America/Rio_Branco": "América/Rio Branco (GMT-05)",
    "UTC": "UTC (GMT+00)",
  };

  function formatTimezone(value) {
    if (!value) return TIMEZONE_LABELS["America/Sao_Paulo"];
    return TIMEZONE_LABELS[value] || value;
  }

  function parseLatLng(text) {
    if (!text) return null;
    const parts = String(text).split(",").map((v) => v.trim()).filter(Boolean);
    if (parts.length < 2) return null;
    const lat = Number(parts[0].replace(",", "."));
    const lng = Number(parts[1].replace(",", "."));
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng };
  }

  function formatLatLng(lat, lng) {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return "";
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }

  function getFarmData() {
    const farmState = window.CreateFarm?.state;
    const farms = Array.isArray(farmState?.farms) ? farmState.farms : [];
    const activeId =
      farmState?.currentFarmId ||
      localStorage.getItem("ic_active_farm") ||
      localStorage.getItem("ic_active_farm_id");
    let farm = farms.find((item) => item.id === activeId) || farms[0];

    if (!farm) {
      try {
        const stored = JSON.parse(localStorage.getItem("ic_farms") || "[]");
        if (Array.isArray(stored)) {
          farm = stored.find((item) => item.id === activeId) || stored[0];
        }
      } catch (_) {}
    }

    return farm || null;
  }

  function resolveValue(...values) {
    for (const value of values) {
      if (value !== undefined && value !== null && String(value).trim() !== "") return value;
    }
    return "";
  }

  function applyGeneralData() {
    const farm = getFarmData();
    const createState = window.CreateFarm?.state || {};
    const farmState = createState.farmState || {};
    const billingState = createState.farmBillingState || {};

    const name = resolveValue(farm?.name, farmState.name);
    const clientName = resolveValue(farm?.clientName, billingState.legalName, farmState.clientName);
    const energyDay = resolveValue(farm?.energyBillDay, farmState.energyBillDay);
    const waterDay = resolveValue(farm?.waterBillDay, farmState.waterBillDay);
    const timezone = resolveValue(farm?.timezone, farmState.timezone);
    const centralRadio = resolveValue(farm?.centralRadio, farmState.centralRadio);

    const nameInput = $("farmEditName");
    if (nameInput) nameInput.value = name;

    const clientInput = $("farmEditClient");
    if (clientInput) clientInput.value = clientName;

    const energyInput = $("farmEditEnergyBillDay");
    if (energyInput) energyInput.value = energyDay;

    const waterInput = $("farmEditWaterBillDay");
    if (waterInput) waterInput.value = waterDay;

    const tzInput = $("farmEditTimezone");
    if (tzInput) tzInput.value = formatTimezone(timezone);

    const radioInput = $("farmEditCentralRadio");
    if (radioInput) radioInput.value = centralRadio;
  }

  function initEditMap(coords) {
    const mapEl = $("farmEditMap");
    if (!mapEl || !window.L) return;

    if (state.editMap) {
      try { state.editMap.remove(); } catch (_) {}
      state.editMap = null;
    }

    const center = coords || { lat: -22.008419, lng: -46.812567 };
    const map = L.map(mapEl, { zoomControl: true }).setView([center.lat, center.lng], 16);

    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      { maxZoom: 19, attribution: "Tiles © Esri" }
    ).addTo(map);

    L.tileLayer(
      "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
      { maxZoom: 19, opacity: 0.85 }
    ).addTo(map);

    const marker = L.marker([center.lat, center.lng]).addTo(map);
    state.editMap = map;
    state.editMarker = marker;

    map.on("click", (e) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      const input = $("farmEditLocationValue");
      if (input) input.value = formatLatLng(lat, lng);
      const farmState = window.CreateFarm?.state?.farmState;
      if (farmState) {
        farmState.lat = lat;
        farmState.lng = lng;
        farmState.loc = formatLatLng(lat, lng);
      }
    });

    setTimeout(() => map.invalidateSize(), 120);
  }

  function applyLocationData() {
    const farm = getFarmData();
    const farmState = window.CreateFarm?.state?.farmState || {};
    const locText = resolveValue(farm?.loc, farmState.loc);
    const parsed = parseLatLng(locText);
    const coords = parsed || (Number.isFinite(farm?.lat) && Number.isFinite(farm?.lng)
      ? { lat: farm.lat, lng: farm.lng }
      : Number.isFinite(farmState.lat) && Number.isFinite(farmState.lng)
        ? { lat: farmState.lat, lng: farmState.lng }
        : null);

    const input = $("farmEditLocationValue");
    if (input) {
      if (coords) input.value = formatLatLng(coords.lat, coords.lng);
      else input.value = locText || "";
    }

    initEditMap(coords);

    const btn = $("farmEditLocationBtn");
    if (btn && !btn.dataset.bound) {
      btn.dataset.bound = "1";
      btn.addEventListener("click", () => {
        if (!state.editMap || !state.editMarker) return;
        const center = state.editMap.getCenter();
        state.editMarker.setLatLng(center);
        const value = formatLatLng(center.lat, center.lng);
        if (input) input.value = value;
        if (farmState) {
          farmState.lat = center.lat;
          farmState.lng = center.lng;
          farmState.loc = value;
        }
      });
    }
  }

  async function mountEditPanel() {
    const slot = $("pageSlot");
    if (!slot) return;

    const html = await fetch("./pages/fazenda-edit.html").then((r) => r.text());
    slot.innerHTML = html;
    bindEditUI();
  }

  function setActiveSection(targetSelector) {
    if (!targetSelector) return;
    const root = document.querySelector(".farm-edit");
    if (!root) return;

    root.querySelectorAll(".pluv-edit__nav-item").forEach((item) => {
      item.classList.toggle("is-active", item.getAttribute("data-target") === targetSelector);
    });

    root.querySelectorAll(".pluv-edit__section").forEach((section) => {
      const active = `#${section.id}` === targetSelector;
      section.classList.toggle("is-active", active);
    });

    const el = root.querySelector(targetSelector);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function bindEditUI() {
    const back = $("farmEditBack");
    if (back && !back.dataset.bound) {
      back.dataset.bound = "1";
      back.addEventListener("click", (e) => {
        e.preventDefault();
        const mapItem = document.querySelector('.nav__item[data-route="mapa"]');
        mapItem?.click();
      });
    }

    const nav = document.querySelector(".farm-edit .pluv-edit__nav");
    if (nav && !nav.dataset.bound) {
      nav.dataset.bound = "1";
      nav.addEventListener("click", (e) => {
        const targetEl = e.target instanceof Element ? e.target : e.target?.parentElement;
        const btn = targetEl ? targetEl.closest(".pluv-edit__nav-item") : null;
        if (!btn) return;
        const target = btn.getAttribute("data-target");
        setActiveSection(target);
      });
    }
  }

  function bindSidebarShortcut() {
    const navItem = document.querySelector('.nav__item[data-route="fazenda"]');
    if (!navItem || navItem.dataset.farmEditBound) return;
    navItem.dataset.farmEditBound = "1";
    navItem.addEventListener("click", (e) => {
      e.preventDefault();
      open();
    });
  }

  async function open() {
    if (state.isOpen) return;
    state.isOpen = true;
    document.body.classList.add("is-farm-edit");

    const mapCard = $("mapCard");
    if (mapCard) mapCard.style.display = "none";

    await mountEditPanel();
    applyGeneralData();
    applyLocationData();

    window.dispatchEvent(new Event("ic:layout-change"));
  }

  function close() {
    state.isOpen = false;
    document.body.classList.remove("is-farm-edit");

    const slot = $("pageSlot");
    if (slot) slot.innerHTML = "";

    const mapCard = $("mapCard");
    if (mapCard) mapCard.style.display = "";

    const map = window.icMap;
    if (map && typeof map.invalidateSize === "function") {
      map.invalidateSize({ pan: false });
      requestAnimationFrame(() => map.invalidateSize({ pan: false }));
      setTimeout(() => map.invalidateSize({ pan: false }), 180);
    }

    window.dispatchEvent(new Event("ic:layout-change"));
  }

  window.IcFarmEdit = { open, close };
  bindSidebarShortcut();
})();
