// assets/js/pages/equipamentos/smart-connect.js
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

  function pinIcon(type) {
    if (!window.L) return null;
    return L.divIcon({
      className: "",
      html: `
        <div class="pivot-pin pivot-pin--${type}">
          <i class="fa-solid fa-location-dot"></i>
        </div>
      `,
      iconSize: [28, 32],
      iconAnchor: [14, 32],
    });
  }

  window.IcEquipamentos.smart_connect = {
    label: "SmartConnect ou Nexus",

    renderStep2(container, state) {
      const centerText =
        state.center || formatLatLng(state.centerLat, state.centerLng) || "";
      const refText = state.ref || formatLatLng(state.refLat, state.refLng) || "";

      container.innerHTML = `
        <div class="sc-loc">
          <div class="equip-page__title"></div>
          <div class="equip-page__sub"></div>

          <div class="sc-loc__field">
            <div class="sc-loc__label">
              <span class="equip-required">*</span> Centro
              <i class="fa-regular fa-circle-question" aria-hidden="true"></i>
            </div>
            <div class="sc-loc__row">
              <div class="sc-loc__input">
                <i class="fa-solid fa-location-crosshairs" aria-hidden="true"></i>
                <input class="equip-input sc-loc__input-field" id="scCenter" placeholder="-23.289023, -46.640897" value="${escapeHtml(centerText)}" />
              </div>
              <button class="equip-btn btn sc-loc__btn sc-loc__btn--center" type="button" data-action="sc-pick-center">
                <i class="fa-solid fa-location-dot" aria-hidden="true"></i> Obter Localiza\u00e7\u00e3o
              </button>
            </div>
          </div>

          <div class="sc-loc__field">
            <div class="sc-loc__label">
              <span class="equip-required">*</span> Refer\u00eancia inicial (\u00c2ngulo 0\u00b0)
              <i class="fa-regular fa-circle-question" aria-hidden="true"></i>
            </div>
            <div class="sc-loc__row">
              <div class="sc-loc__input">
                <i class="fa-solid fa-location-crosshairs" aria-hidden="true"></i>
                <input class="equip-input sc-loc__input-field" id="scRef" placeholder="-23.289274, -46.642657" value="${escapeHtml(refText)}" />
              </div>
              <button class="equip-btn btn sc-loc__btn sc-loc__btn--ref" type="button" data-action="sc-pick-ref">
                <i class="fa-solid fa-location-dot" aria-hidden="true"></i> Obter Localiza\u00e7\u00e3o
              </button>
            </div>
          </div>

          <div class="sc-loc__hint" data-sc-hint>Clique no mapa para definir o centro do piv\u00f4.</div>

          <div id="scPivotMap" class="equip-mini-map sc-loc__map"></div>
        </div>
      `;

      this.initMap(container, state);
      this.bindStep2(container, state);
      if (window.IcEquipSelectInit) window.IcEquipSelectInit(container);
    },

    bindStep2(container, state) {
      const centerInput = container.querySelector("#scCenter");
      const refInput = container.querySelector("#scRef");
      const centerBtn = container.querySelector('[data-action="sc-pick-center"]');
      const refBtn = container.querySelector('[data-action="sc-pick-ref"]');
      const hint = container.querySelector("[data-sc-hint]");

      const setActive = (target) => {
        state.activeTarget = target;
        if (centerBtn) centerBtn.classList.toggle("is-active", target === "center");
        if (refBtn) refBtn.classList.toggle("is-active", target === "ref");
        if (hint) {
          hint.textContent =
            target === "ref"
              ? "Clique no mapa para definir a refer\u00eancia inicial."
              : "Clique no mapa para definir o centro do piv\u00f4.";
        }
      };

      if (centerBtn) centerBtn.addEventListener("click", () => setActive("center"));
      if (refBtn) refBtn.addEventListener("click", () => setActive("ref"));
      setActive(state.activeTarget || "center");

      const applyInput = (input, target) => {
        const parsed = parseLatLng(input.value);
        if (!parsed) return;
        if (typeof state._pivotSetPoint === "function") {
          state._pivotSetPoint(target, parsed.lat, parsed.lng);
        } else {
          if (target === "center") {
            state.center = formatLatLng(parsed.lat, parsed.lng);
            state.centerLat = parsed.lat;
            state.centerLng = parsed.lng;
          } else {
            state.ref = formatLatLng(parsed.lat, parsed.lng);
            state.refLat = parsed.lat;
            state.refLng = parsed.lng;
          }
        }
      };

      if (centerInput) {
        centerInput.addEventListener("change", () => applyInput(centerInput, "center"));
      }
      if (refInput) {
        refInput.addEventListener("change", () => applyInput(refInput, "ref"));
      }
    },

    initMap(container, state) {
      if (!window.L) return;

      const mapEl = container.querySelector("#scPivotMap");
      const centerInput = container.querySelector("#scCenter");
      const refInput = container.querySelector("#scRef");
      if (!mapEl || !centerInput || !refInput) return;

      if (state._pivotMap) {
        try {
          state._pivotMap.remove();
        } catch (e) {}
        state._pivotMap = null;
      }

      let centerPoint = parseLatLng(centerInput.value) || null;
      let refPoint = parseLatLng(refInput.value) || null;

      if (!centerPoint && Number.isFinite(state.centerLat) && Number.isFinite(state.centerLng)) {
        centerPoint = { lat: state.centerLat, lng: state.centerLng };
      }
      if (!refPoint && Number.isFinite(state.refLat) && Number.isFinite(state.refLng)) {
        refPoint = { lat: state.refLat, lng: state.refLng };
      }

      const fallback = { lat: -16.767, lng: -47.613 };
      const basePoint = centerPoint || refPoint || fallback;
      const zoom = centerPoint || refPoint ? 17 : 16;

      const map = L.map(mapEl, { zoomControl: true }).setView([basePoint.lat, basePoint.lng], zoom);

      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        { maxZoom: 19, attribution: "Tiles \u00a9 Esri" }
      ).addTo(map);

      L.tileLayer(
        "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
        { maxZoom: 19, opacity: 0.85 }
      ).addTo(map);

      const centerMarker = L.marker([basePoint.lat, basePoint.lng], {
        icon: pinIcon("center"),
      }).addTo(map);

      const refMarker = L.marker([basePoint.lat, basePoint.lng], {
        icon: pinIcon("ref"),
      }).addTo(map);

      if (!centerPoint) centerMarker.setOpacity(0);
      if (!refPoint) refMarker.setOpacity(0);

      if (centerPoint) centerMarker.setLatLng([centerPoint.lat, centerPoint.lng]);
      if (refPoint) refMarker.setLatLng([refPoint.lat, refPoint.lng]);

      const circle = L.circle([basePoint.lat, basePoint.lng], {
        radius: 0,
        color: "#3b82f6",
        fillColor: "#3b82f6",
        fillOpacity: 0.22,
        weight: 2,
      }).addTo(map);

      const updateCircle = () => {
        if (!centerPoint || !refPoint) {
          circle.setStyle({ opacity: 0, fillOpacity: 0 });
          return;
        }
        const radius = L.latLng(centerPoint.lat, centerPoint.lng).distanceTo([refPoint.lat, refPoint.lng]);
        circle.setLatLng([centerPoint.lat, centerPoint.lng]);
        circle.setRadius(radius);
        circle.setStyle({ opacity: 1, fillOpacity: 0.22 });
        state.radius = radius;
      };

      const setPoint = (target, lat, lng) => {
        if (target === "center") {
          centerPoint = { lat, lng };
          centerMarker.setLatLng([lat, lng]);
          centerMarker.setOpacity(1);
          centerInput.value = formatLatLng(lat, lng);
          state.center = centerInput.value;
          state.centerLat = lat;
          state.centerLng = lng;
        } else {
          refPoint = { lat, lng };
          refMarker.setLatLng([lat, lng]);
          refMarker.setOpacity(1);
          refInput.value = formatLatLng(lat, lng);
          state.ref = refInput.value;
          state.refLat = lat;
          state.refLng = lng;
        }
        updateCircle();
      };

      map.on("click", (e) => {
        const target = state.activeTarget || "center";
        setPoint(target, e.latlng.lat, e.latlng.lng);
      });

      updateCircle();

      state._pivotMap = map;
      state._pivotSetPoint = setPoint;

      setTimeout(() => map.invalidateSize(), 120);
    },

    readStep2(container) {
      const center = container.querySelector("#scCenter")?.value?.trim() || "";
      const ref = container.querySelector("#scRef")?.value?.trim() || "";
      const parsedCenter = parseLatLng(center);
      const parsedRef = parseLatLng(ref);
      let radius = null;

      if (parsedCenter && parsedRef && window.L) {
        radius = L.latLng(parsedCenter.lat, parsedCenter.lng).distanceTo([parsedRef.lat, parsedRef.lng]);
      }

      return {
        center,
        ref,
        centerLat: parsedCenter?.lat ?? null,
        centerLng: parsedCenter?.lng ?? null,
        refLat: parsedRef?.lat ?? null,
        refLng: parsedRef?.lng ?? null,
        radius,
      };
    },

    validateStep2(data) {
      if (data.centerLat === null || data.centerLng === null) {
        return { ok: false, msg: "Informe o centro do piv\u00f4 (Latitude, Longitude)." };
      }
      if (data.refLat === null || data.refLng === null) {
        return { ok: false, msg: "Informe a refer\u00eancia inicial (\u00c2ngulo 0\u00b0)." };
      }
      return { ok: true, msg: "" };
    },

    // =================
    // STEP 3 — Configuração
    // =================
    renderStep3(container, state) {
      const errors = state._errors || {};

      if (!state.manufacturer) state.manufacturer = "Bauer";
      if (!state.panelType) state.panelType = "Nexus";
      if (!state.commType) state.commType = "4G";
      if (!state.powerUnit) state.powerUnit = "cv";

      const showOther = state.manufacturer === "outro";
      const isXbee = state.commType === "XBEE";
      const powerLabel = state.powerUnit === "kw" ? "kW" : "CV";

      container.innerHTML = `
        <div class="sc-config">
          <div class="sc-config__grid">
            <div class="sc-field ${errors.name ? "is-error" : ""}">
              <label class="equip-label"><span class="equip-required">*</span> Nome do equipamento</label>
              <input class="equip-input" id="scName" placeholder="Piv\u00f4 01" value="${escapeHtml(state.name || "")}" aria-invalid="${errors.name ? "true" : "false"}" />
              <div class="sc-error ${errors.name ? "" : "is-hidden"}">Este campo \u00e9 obrigat\u00f3rio</div>
            </div>

            <div class="sc-field ${errors.manufacturer ? "is-error" : ""}">
              <label class="equip-label"><span class="equip-required">*</span> Fabricante do piv\u00f4</label>
              <select class="equip-input" id="scManufacturer" aria-invalid="${errors.manufacturer ? "true" : "false"}">
                <option value="Bauer">Bauer</option>
                <option value="Carborundum">Carborundum</option>
                <option value="Fockink">Fockink</option>
                <option value="Irrigabras">Irrigabras</option>
                <option value="Krebs">Krebs</option>
                <option value="Lindsay">Lindsay</option>
                <option value="Reinke">Reinke</option>
                <option value="Valley">Valley</option>
                <option value="outro">Outro</option>
              </select>
              <div class="sc-error ${errors.manufacturer ? "" : "is-hidden"}">Este campo \u00e9 obrigat\u00f3rio</div>
            </div>

            <div class="sc-field ${showOther ? "" : "is-hidden"} ${errors.manufacturerOther ? "is-error" : ""}">
              <label class="equip-label"><span class="equip-required">*</span> Outro</label>
              <input class="equip-input" id="scManufacturerOther" placeholder="Outro" value="${escapeHtml(state.manufacturerOther || "")}" aria-invalid="${errors.manufacturerOther ? "true" : "false"}" />
              <div class="sc-error ${errors.manufacturerOther ? "" : "is-hidden"}">Este campo \u00e9 obrigat\u00f3rio</div>
            </div>

            <div class="sc-field ${errors.panelType ? "is-error" : ""}">
              <label class="equip-label"><span class="equip-required">*</span> Tipo de painel</label>
              <select class="equip-input" id="scPanelType" aria-invalid="${errors.panelType ? "true" : "false"}">
                <option value="Nexus">Nexus</option>
                <option value="SmartConnect">SmartConnect</option>
              </select>
              <div class="sc-error ${errors.panelType ? "" : "is-hidden"}">Este campo \u00e9 obrigat\u00f3rio</div>
            </div>

            <div class="sc-field ${errors.commType ? "is-error" : ""}">
              <label class="equip-label"><span class="equip-required">*</span> Tipo de comunica\u00e7\u00e3o</label>
              <select class="equip-input" id="scCommType" aria-invalid="${errors.commType ? "true" : "false"}">
                <option value="XBEE">XBEE</option>
                <option value="4G">4G</option>
              </select>
              <div class="sc-error ${errors.commType ? "" : "is-hidden"}">Este campo \u00e9 obrigat\u00f3rio</div>
            </div>

            <div class="sc-field ${isXbee ? "is-hidden" : ""} ${errors.gateway ? "is-error" : ""}">
              <label class="equip-label"><span class="equip-required">*</span> N\u00famero do gateway</label>
              <input class="equip-input" id="scGateway" placeholder="10000000351D266D" value="${escapeHtml(state.gateway || "")}" aria-invalid="${errors.gateway ? "true" : "false"}" />
              <div class="sc-error ${errors.gateway ? "" : "is-hidden"}">Este campo \u00e9 obrigat\u00f3rio</div>
            </div>

            <div class="sc-field ${isXbee ? "" : "is-hidden"} ${errors.radioController ? "is-error" : ""}">
              <label class="equip-label"><span class="equip-required">*</span> R\u00e1dio do controlador</label>
              <input class="equip-input" id="scRadioController" placeholder="0013A200422E3CC5" value="${escapeHtml(state.radioController || "")}" aria-invalid="${errors.radioController ? "true" : "false"}" />
              <div class="sc-error ${errors.radioController ? "" : "is-hidden"}">Este campo \u00e9 obrigat\u00f3rio</div>
            </div>

            <div class="sc-field ${isXbee ? "" : "is-hidden"} ${errors.radioMonitor ? "is-error" : ""}">
              <label class="equip-label"><span class="equip-required">*</span> R\u00e1dio do monitor</label>
              <input class="equip-input" id="scRadioMonitor" placeholder="0013A20041F0A2E1" value="${escapeHtml(state.radioMonitor || "")}" aria-invalid="${errors.radioMonitor ? "true" : "false"}" />
              <div class="sc-error ${errors.radioMonitor ? "" : "is-hidden"}">Este campo \u00e9 obrigat\u00f3rio</div>
            </div>

            <div class="sc-field ${isXbee ? "" : "is-hidden"} ${errors.remoteCable ? "is-error" : ""}">
              <label class="equip-label"><span class="equip-required">*</span> Cabo remoto de bomba (Spoti)</label>
              <input class="equip-input" id="scRemoteCable" placeholder="0013A20031F0A2E4" value="${escapeHtml(state.remoteCable || "")}" aria-invalid="${errors.remoteCable ? "true" : "false"}" />
              <div class="sc-error ${errors.remoteCable ? "" : "is-hidden"}">Este campo \u00e9 obrigat\u00f3rio</div>
            </div>

            <div class="sc-field sc-field--check">
              <label class="equip-label">Pluvi\u00f4metro</label>
              <label class="sc-check">
                <input class="sc-check__input" id="scPluvio" type="checkbox" ${state.pluvio ? "checked" : ""} />
                <span>Possui pluvi\u00f4metro</span>
              </label>
            </div>
          </div>

          <div class="sc-config__block">
            <label class="equip-label">Unidade de pot\u00eancia</label>
            <div class="sc-radio-group">
              <label class="sc-radio">
                <input class="sc-radio__input" type="radio" name="scPowerUnit" value="cv" ${state.powerUnit === "cv" ? "checked" : ""} />
                <span>CV</span>
              </label>
              <label class="sc-radio">
                <input class="sc-radio__input" type="radio" name="scPowerUnit" value="kw" ${state.powerUnit === "kw" ? "checked" : ""} />
                <span>kW</span>
              </label>
            </div>
          </div>

          <div class="sc-config__grid sc-config__grid--power">
            <div class="sc-field ${errors.power ? "is-error" : ""}">
              <label class="equip-label"><span class="equip-required">*</span> Pot\u00eancia</label>
              <div class="sc-input-group">
                <input class="equip-input sc-input" id="scPower" type="number" min="0" step="0.01" value="${escapeHtml(state.power || "")}" />
                <span class="sc-input-suffix" data-sc-power-unit>${powerLabel}</span>
              </div>
              <div class="sc-error ${errors.power ? "" : "is-hidden"}">Este campo \u00e9 obrigat\u00f3rio</div>
            </div>

            <div class="sc-field ${errors.performance ? "is-error" : ""}">
              <label class="equip-label"><span class="equip-required">*</span> Performance</label>
              <div class="sc-input-group">
                <input class="equip-input sc-input" id="scPerformance" type="number" min="0" step="0.01" value="${escapeHtml(state.performance || "")}" />
                <span class="sc-input-suffix">%</span>
              </div>
              <div class="sc-error ${errors.performance ? "" : "is-hidden"}">Este campo \u00e9 obrigat\u00f3rio</div>
            </div>

            <div class="sc-field">
              <label class="equip-label">Pot\u00eancia convertida</label>
              <div class="sc-input-group">
                <input class="equip-input sc-input" id="scConverted" value="${escapeHtml(state.converted || "")}" disabled />
                <span class="sc-input-suffix">kW</span>
              </div>
            </div>
          </div>
        </div>
      `;

      this.bindStep3(container, state);
      this.updateStep3(container, state);
      if (window.IcEquipSelectInit) window.IcEquipSelectInit(container);
    },

    bindStep3(container, state) {
      const manufacturer = container.querySelector("#scManufacturer");
      const manufacturerOther = container.querySelector("#scManufacturerOther");
      const panelType = container.querySelector("#scPanelType");
      const commType = container.querySelector("#scCommType");
      const nameInput = container.querySelector("#scName");
      const gatewayInput = container.querySelector("#scGateway");
      const radioControllerInput = container.querySelector("#scRadioController");
      const radioMonitorInput = container.querySelector("#scRadioMonitor");
      const remoteCableInput = container.querySelector("#scRemoteCable");
      const pluvioInput = container.querySelector("#scPluvio");
      const powerInput = container.querySelector("#scPower");
      const perfInput = container.querySelector("#scPerformance");
      const unitInputs = container.querySelectorAll('input[name="scPowerUnit"]');

      if (manufacturer) {
        manufacturer.value = state.manufacturer || "Bauer";
        manufacturer.addEventListener("change", () => {
          state.manufacturer = manufacturer.value;
          if (state.manufacturer !== "outro") {
            state.manufacturerOther = "";
          }
          this.renderStep3(container, state);
        });
      }

      if (manufacturerOther) {
        manufacturerOther.addEventListener("input", () => {
          state.manufacturerOther = manufacturerOther.value.trim();
        });
      }

      if (panelType) {
        panelType.value = state.panelType || "Nexus";
        panelType.addEventListener("change", () => {
          state.panelType = panelType.value;
        });
      }

      if (commType) {
        commType.value = state.commType || "4G";
        commType.addEventListener("change", () => {
          state.commType = commType.value;
          if (state.commType !== "4G") {
            state.gateway = "";
          }
          if (state.commType !== "XBEE") {
            state.radioController = "";
            state.radioMonitor = "";
            state.remoteCable = "";
          }
          this.renderStep3(container, state);
        });
      }

      if (nameInput) {
        nameInput.addEventListener("input", () => {
          state.name = nameInput.value.trim();
        });
      }

      if (gatewayInput) {
        gatewayInput.addEventListener("input", () => {
          state.gateway = gatewayInput.value.trim();
        });
      }

      if (radioControllerInput) {
        radioControllerInput.addEventListener("input", () => {
          state.radioController = radioControllerInput.value.trim();
        });
      }

      if (radioMonitorInput) {
        radioMonitorInput.addEventListener("input", () => {
          state.radioMonitor = radioMonitorInput.value.trim();
        });
      }

      if (remoteCableInput) {
        remoteCableInput.addEventListener("input", () => {
          state.remoteCable = remoteCableInput.value.trim();
        });
      }

      if (pluvioInput) {
        pluvioInput.addEventListener("change", () => {
          state.pluvio = pluvioInput.checked;
        });
      }

      if (powerInput) {
        powerInput.addEventListener("input", () => {
          state.power = powerInput.value;
          this.updateStep3(container, state);
        });
      }

      if (perfInput) {
        perfInput.addEventListener("input", () => {
          state.performance = perfInput.value;
          this.updateStep3(container, state);
        });
      }

      unitInputs.forEach((input) => {
        input.addEventListener("change", () => {
          if (!input.checked) return;
          state.powerUnit = input.value;
          this.updateStep3(container, state);
        });
      });
    },

    updateStep3(container, state) {
      const converted = container.querySelector("#scConverted");
      const powerSuffix = container.querySelector("[data-sc-power-unit]");
      if (powerSuffix) powerSuffix.textContent = state.powerUnit === "kw" ? "kW" : "CV";

      const power = Number(String(state.power || "").replace(",", "."));
      const perf = Number(String(state.performance || "").replace(",", "."));
      if (!Number.isFinite(power) || !Number.isFinite(perf)) {
        if (converted) converted.value = "";
        state.converted = "";
        return;
      }
      const base = power * (perf / 100);
      const kw = state.powerUnit === "kw" ? base : base * 0.7355;
      const formatted = kw.toFixed(2).replace(".", ",");
      if (converted) converted.value = formatted;
      state.converted = formatted;
    },

    readStep3(container) {
      const name = container.querySelector("#scName")?.value?.trim() || "";
      const manufacturer = container.querySelector("#scManufacturer")?.value || "";
      const manufacturerOther = container.querySelector("#scManufacturerOther")?.value?.trim() || "";
      const panelType = container.querySelector("#scPanelType")?.value || "";
      const commType = container.querySelector("#scCommType")?.value || "";
      const gateway = container.querySelector("#scGateway")?.value?.trim() || "";
      const radioController = container.querySelector("#scRadioController")?.value?.trim() || "";
      const radioMonitor = container.querySelector("#scRadioMonitor")?.value?.trim() || "";
      const remoteCable = container.querySelector("#scRemoteCable")?.value?.trim() || "";
      const pluvio = !!container.querySelector("#scPluvio")?.checked;
      const power = container.querySelector("#scPower")?.value?.trim() || "";
      const performance = container.querySelector("#scPerformance")?.value?.trim() || "";
      const unit = container.querySelector('input[name="scPowerUnit"]:checked')?.value || "cv";
      const converted = container.querySelector("#scConverted")?.value?.trim() || "";

      return {
        name,
        manufacturer,
        manufacturerOther,
        panelType,
        commType,
        gateway,
        radioController,
        radioMonitor,
        remoteCable,
        pluvio,
        power,
        performance,
        powerUnit: unit,
        converted,
      };
    },

    validateStep3(data, state) {
      const errors = {};

      if (!data.name) errors.name = true;
      if (!data.manufacturer) errors.manufacturer = true;
      if (data.manufacturer === "outro" && !data.manufacturerOther) {
        errors.manufacturerOther = true;
      }
      if (!data.panelType) errors.panelType = true;
      if (!data.commType) errors.commType = true;
      if (data.commType === "4G" && !data.gateway) errors.gateway = true;
      if (data.commType === "XBEE" && !data.radioController) errors.radioController = true;
      if (data.commType === "XBEE" && !data.radioMonitor) errors.radioMonitor = true;
      if (data.commType === "XBEE" && !data.remoteCable) errors.remoteCable = true;
      if (!data.power) errors.power = true;
      if (!data.performance) errors.performance = true;

      return { ok: Object.keys(errors).length === 0, errors };
    },
  };
})();

