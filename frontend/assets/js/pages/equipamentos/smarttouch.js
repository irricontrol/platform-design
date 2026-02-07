// assets/js/pages/equipamentos/smarttouch.js
(function () {
  "use strict";

  window.IcEquipamentos = window.IcEquipamentos || {};

  function escapeHtml(str) {
    return String(str ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function parseLatLng(text) {
    const raw = String(text || "").trim();
    if (!raw) return null;

    const parts = raw
      .replaceAll(";", ",")
      .split(/,|\s+/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (parts.length < 2) return null;

    const lat = Number(parts[0].replace(",", "."));
    const lng = Number(parts[1].replace(",", "."));

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;

    return { lat, lng };
  }

  function formatLatLng(lat, lng) {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return "";
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }

  function parseRadius(value) {
    const raw = String(value || "").replace(",", ".").trim();
    const num = Number(raw);
    return Number.isFinite(num) ? num : null;
  }

  function pinIcon() {
    if (!window.L) return null;
    return L.divIcon({
      className: "",
      html: `
        <div class="st-pin">
          <i class="fa-solid fa-location-dot"></i>
        </div>
      `,
      iconSize: [28, 32],
      iconAnchor: [14, 32],
    });
  }

  window.IcEquipamentos.smarttouch = {
    label: "SmartTouch",

    // =================
    // STEP 2 — Localização
    // =================
    renderStep2(container, state) {
      const radiusValue = Number.isFinite(state.radius) ? state.radius : 30;
      if (!Number.isFinite(state.radius)) state.radius = radiusValue;

      const locText = state.loc || formatLatLng(state.lat, state.lng) || "";

      container.innerHTML = `
        <div class="st-loc">
          <div class="equip-page__title"></div>
          <div class="equip-page__sub"></div>

          <div class="st-loc__field">
            <label class="equip-label"><span class="equip-required">*</span> Raio da \u00faltima torre</label>
            <div class="st-input-group">
              <input class="equip-input st-input" id="stRadius" type="number" min="0" step="1" value="${escapeHtml(radiusValue)}" />
              <span class="st-input-suffix">m</span>
            </div>
          </div>

          <div class="st-loc__field">
            <label class="equip-label"><span class="equip-required">*</span> Localiza\u00e7\u00e3o do dispositivo</label>
            <div class="st-loc__row">
              <div class="st-loc__input">
                <i class="fa-solid fa-location-crosshairs" aria-hidden="true"></i>
                <input class="equip-input st-loc__input-field" id="stLoc" placeholder="-23.289653, -46.642609" value="${escapeHtml(locText)}" />
              </div>
              <button class="equip-btn btn st-loc__btn" type="button" data-action="st-get-loc">
                <i class="fa-solid fa-location-dot" aria-hidden="true"></i> Obter Localiza\u00e7\u00e3o
              </button>
            </div>
          </div>

          <div id="stMap" class="equip-mini-map st-loc__map"></div>
        </div>
      `;

      this.initMap(container, state);
      this.bindStep2(container, state);
      if (window.IcEquipSelectInit) window.IcEquipSelectInit(container);
    },

    bindStep2(container, state) {
      const radiusInput = container.querySelector("#stRadius");
      const locInput = container.querySelector("#stLoc");
      const button = container.querySelector('[data-action="st-get-loc"]');

      const applyLocation = (lat, lng, setView = true) => {
        if (typeof state._stSetPoint === "function") {
          state._stSetPoint(lat, lng, setView);
        } else {
          state.lat = lat;
          state.lng = lng;
          state.loc = formatLatLng(lat, lng);
        }
      };

      if (radiusInput) {
        radiusInput.addEventListener("input", () => {
          const radius = parseRadius(radiusInput.value);
          if (radius === null) return;
          state.radius = radius;
          if (typeof state._stSetRadius === "function") {
            state._stSetRadius(radius);
          }
        });
      }

      if (locInput) {
        locInput.addEventListener("blur", () => {
          const parsed = parseLatLng(locInput.value);
          if (parsed) applyLocation(parsed.lat, parsed.lng, true);
        });
      }

      if (button && navigator.geolocation) {
        button.addEventListener("click", () => {
          button.disabled = true;
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const { latitude, longitude } = pos.coords;
              applyLocation(latitude, longitude, true);
              button.disabled = false;
            },
            () => {
              button.disabled = false;
            },
            { enableHighAccuracy: true, timeout: 8000 }
          );
        });
      }
    },

    initMap(container, state) {
      if (!window.L) return;

      const mapEl = container.querySelector("#stMap");
      const radiusInput = container.querySelector("#stRadius");
      const locInput = container.querySelector("#stLoc");
      if (!mapEl || !radiusInput || !locInput) return;

      if (state._stMap) {
        try {
          state._stMap.remove();
        } catch (e) {}
        state._stMap = null;
      }

      let center = parseLatLng(locInput.value);
      if (!center && Number.isFinite(state.lat) && Number.isFinite(state.lng)) {
        center = { lat: state.lat, lng: state.lng };
      }

      const fallback = { lat: -16.767, lng: -47.613 };
      const start = center || fallback;
      const zoom = center ? 17 : 16;

      const map = L.map(mapEl, { zoomControl: true }).setView([start.lat, start.lng], zoom);

      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        { maxZoom: 19, attribution: "Tiles \u00a9 Esri" }
      ).addTo(map);

      L.tileLayer(
        "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
        { maxZoom: 19, opacity: 0.85 }
      ).addTo(map);

      const marker = L.marker([start.lat, start.lng], { icon: pinIcon() }).addTo(map);

      const radius = parseRadius(radiusInput.value) ?? 30;
      const circle = L.circle([start.lat, start.lng], {
        radius,
        color: "#8b5cf6",
        fillColor: "#8b5cf6",
        fillOpacity: 0.28,
        weight: 2,
        dashArray: "4 6",
      }).addTo(map);

      const setPoint = (lat, lng, setView = true) => {
        marker.setLatLng([lat, lng]);
        circle.setLatLng([lat, lng]);
        locInput.value = formatLatLng(lat, lng);
        state.lat = lat;
        state.lng = lng;
        state.loc = locInput.value;
        if (setView) map.setView([lat, lng], map.getZoom());
      };

      const setRadius = (value) => {
        const r = Math.max(0, Number(value) || 0);
        circle.setRadius(r);
        state.radius = r;
      };

      map.on("click", (e) => {
        setPoint(e.latlng.lat, e.latlng.lng, false);
      });

      state._stMap = map;
      state._stSetPoint = setPoint;
      state._stSetRadius = setRadius;

      setTimeout(() => map.invalidateSize(), 120);
    },

    readStep2(container) {
      const radius = parseRadius(container.querySelector("#stRadius")?.value);
      const loc = container.querySelector("#stLoc")?.value?.trim() || "";
      const parsed = parseLatLng(loc);

      return {
        radius,
        loc,
        lat: parsed?.lat ?? null,
        lng: parsed?.lng ?? null,
      };
    },

    validateStep2(data) {
      if (data.radius === null || data.radius <= 0) {
        return { ok: false, msg: "Informe o raio da \u00faltima torre." };
      }
      if (data.lat === null || data.lng === null) {
        return { ok: false, msg: "Informe uma localiza\u00e7\u00e3o v\u00e1lida (Latitude, Longitude)." };
      }
      return { ok: true, msg: "" };
    },

    // =================
    // STEP 3 — Configuração
    // =================
    renderStep3(container, state) {
      const errors = state._errors || {};

      container.innerHTML = `
        <div class="st-config">
          <div class="equip-form">
            <div class="equip-form__row">
              <div class="equip-field ${errors.deviceName ? "is-error" : ""}">
                <label class="equip-label"><span class="equip-required">*</span> Nome do dispositivo</label>
                <input class="equip-input" id="stDeviceName" placeholder="SmartTouch 01" value="${escapeHtml(state.deviceName || "")}" aria-invalid="${errors.deviceName ? "true" : "false"}" />
                <div class="st-error ${errors.deviceName ? "" : "is-hidden"}">Este campo \u00e9 obrigat\u00f3rio</div>
              </div>

              <div class="equip-field ${errors.imei ? "is-error" : ""}">
                <label class="equip-label"><span class="equip-required">*</span> IMEI</label>
                <input class="equip-input" id="stImei" placeholder="860585004298393" value="${escapeHtml(state.imei || "")}" aria-invalid="${errors.imei ? "true" : "false"}" />
                <div class="st-error ${errors.imei ? "" : "is-hidden"}">Este campo \u00e9 obrigat\u00f3rio</div>
              </div>
            </div>
          </div>
        </div>
      `;

      this.bindStep3(container, state);
      if (window.IcEquipSelectInit) window.IcEquipSelectInit(container);
    },

    bindStep3(container, state) {
      const nameInput = container.querySelector("#stDeviceName");
      const imeiInput = container.querySelector("#stImei");

      if (nameInput) {
        nameInput.addEventListener("input", () => {
          state.deviceName = nameInput.value.trim();
        });
      }

      if (imeiInput) {
        imeiInput.addEventListener("input", () => {
          state.imei = imeiInput.value.trim();
        });
      }
    },

    readStep3(container) {
      const deviceName = container.querySelector("#stDeviceName")?.value?.trim() || "";
      const imei = container.querySelector("#stImei")?.value?.trim() || "";
      return { deviceName, imei };
    },

    validateStep3(data) {
      const errors = {};
      if (!data.deviceName) errors.deviceName = true;
      if (!data.imei) errors.imei = true;
      return { ok: Object.keys(errors).length === 0, errors };
    },
  };
})();

