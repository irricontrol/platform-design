// assets/js/pages/equipamentos/repetidora.js
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

  function pinIcon() {
    if (!window.L) return null;
    return L.divIcon({
      className: "",
      html: `
        <div class="rp-pin">
          <i class="fa-solid fa-location-dot"></i>
        </div>
      `,
      iconSize: [28, 32],
      iconAnchor: [14, 32],
    });
  }

  window.IcEquipamentos.repetidora = {
    label: "Repetidora",

    // =================
    // STEP 2 — Localização
    // =================
    renderStep2(container, state) {
      const locText = state.loc || formatLatLng(state.lat, state.lng) || "";

      container.innerHTML = `
        <div class="rp-loc">
          <div class="equip-page__title"></div>
          <div class="equip-page__sub"></div>

          <div class="rp-loc__field">
            <label class="equip-label"><span class="equip-required">*</span> Localiza\u00e7\u00e3o do dispositivo</label>
            <div class="rp-loc__row">
              <div class="rp-loc__input">
                <input class="equip-input rp-loc__input-field" id="rpLoc" placeholder="-23.486974, -46.828956" value="${escapeHtml(locText)}" />
              </div>
              <button class="equip-btn btn rp-loc__btn" type="button" data-action="rp-get-loc">
                <i class="fa-solid fa-location-dot" aria-hidden="true"></i> Obter Localiza\u00e7\u00e3o
              </button>
            </div>
          </div>

          <div id="rpMap" class="equip-mini-map rp-loc__map"></div>
        </div>
      `;

      this.initMap(container, state);
      this.bindStep2(container, state);
      if (window.IcEquipSelectInit) window.IcEquipSelectInit(container);
    },

    bindStep2(container, state) {
      const locInput = container.querySelector("#rpLoc");
      const button = container.querySelector('[data-action="rp-get-loc"]');

      const applyLocation = (lat, lng, setView = true) => {
        if (typeof state._rpSetPoint === "function") {
          state._rpSetPoint(lat, lng, setView);
        } else {
          state.lat = lat;
          state.lng = lng;
          state.loc = formatLatLng(lat, lng);
        }
      };

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

      const mapEl = container.querySelector("#rpMap");
      const locInput = container.querySelector("#rpLoc");
      if (!mapEl || !locInput) return;

      if (state._rpMap) {
        try {
          state._rpMap.remove();
        } catch (e) {}
        state._rpMap = null;
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

      const setPoint = (lat, lng, setView = true) => {
        marker.setLatLng([lat, lng]);
        locInput.value = formatLatLng(lat, lng);
        state.lat = lat;
        state.lng = lng;
        state.loc = locInput.value;
        if (setView) map.setView([lat, lng], map.getZoom());
      };

      map.on("click", (e) => {
        setPoint(e.latlng.lat, e.latlng.lng, false);
      });

      state._rpMap = map;
      state._rpSetPoint = setPoint;

      setTimeout(() => map.invalidateSize(), 120);
    },

    readStep2(container) {
      const loc = container.querySelector("#rpLoc")?.value?.trim() || "";
      const parsed = parseLatLng(loc);
      return {
        loc,
        lat: parsed?.lat ?? null,
        lng: parsed?.lng ?? null,
      };
    },

    validateStep2(data) {
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
        <div class="rp-config">
          <div class="equip-form">
            <div class="equip-form__row">
              <div class="equip-field ${errors.name ? "is-error" : ""}">
                <label class="equip-label"><span class="equip-required">*</span> Nome do equipamento</label>
                <input class="equip-input" id="rpName" placeholder="Repetidora Sede" value="${escapeHtml(state.name || "")}" aria-invalid="${errors.name ? "true" : "false"}" />
                <div class="rp-error ${errors.name ? "" : "is-hidden"}">Este campo \u00e9 obrigat\u00f3rio</div>
              </div>

              <div class="equip-field ${errors.height ? "is-error" : ""}">
                <label class="equip-label"><span class="equip-required">*</span> Altura</label>
                <div class="rp-input-group">
                  <input class="equip-input rp-input" id="rpHeight" type="number" min="0" step="0.1" placeholder="Por favor insira" value="${escapeHtml(state.height || "")}" />
                  <span class="rp-input-suffix">m</span>
                </div>
                <div class="rp-error ${errors.height ? "" : "is-hidden"}">Este campo \u00e9 obrigat\u00f3rio</div>
              </div>

              <div class="equip-field ${errors.radio ? "is-error" : ""}">
                <label class="equip-label"><span class="equip-required">*</span> R\u00e1dio da repetidora</label>
                <input class="equip-input" id="rpRadio" placeholder="0012A20021A0B1C3" value="${escapeHtml(state.radio || "")}" aria-invalid="${errors.radio ? "true" : "false"}" />
                <div class="rp-error ${errors.radio ? "" : "is-hidden"}">Este campo \u00e9 obrigat\u00f3rio</div>
              </div>
            </div>

            <div class="equip-field ${errors.type ? "is-error" : ""}">
              <label class="equip-label"><span class="equip-required">*</span> Tipo</label>
              <select class="equip-input" id="rpType" aria-invalid="${errors.type ? "true" : "false"}">
                <option value="Solar">Solar</option>
                <option value="Bivolt">Bivolt</option>
              </select>
              <div class="rp-error ${errors.type ? "" : "is-hidden"}">Este campo \u00e9 obrigat\u00f3rio</div>
            </div>
          </div>
        </div>
      `;

      this.bindStep3(container, state);
      if (window.IcEquipSelectInit) window.IcEquipSelectInit(container);
    },

    bindStep3(container, state) {
      const nameInput = container.querySelector("#rpName");
      const heightInput = container.querySelector("#rpHeight");
      const radioInput = container.querySelector("#rpRadio");
      const typeSelect = container.querySelector("#rpType");

      if (typeSelect) typeSelect.value = state.type || "Bivolt";

      if (nameInput) {
        nameInput.addEventListener("input", () => {
          state.name = nameInput.value.trim();
        });
      }

      if (heightInput) {
        heightInput.addEventListener("input", () => {
          state.height = heightInput.value;
        });
      }

      if (radioInput) {
        radioInput.addEventListener("input", () => {
          state.radio = radioInput.value.trim();
        });
      }

      if (typeSelect) {
        typeSelect.addEventListener("change", () => {
          state.type = typeSelect.value;
        });
      }
    },

    readStep3(container) {
      return {
        name: container.querySelector("#rpName")?.value?.trim() || "",
        height: container.querySelector("#rpHeight")?.value?.trim() || "",
        radio: container.querySelector("#rpRadio")?.value?.trim() || "",
        type: container.querySelector("#rpType")?.value || "",
      };
    },

    validateStep3(data) {
      const errors = {};
      if (!data.name) errors.name = true;
      if (!data.height) errors.height = true;
      if (!data.radio) errors.radio = true;
      if (!data.type) errors.type = true;
      return { ok: Object.keys(errors).length === 0, errors };
    },
  };
})();
