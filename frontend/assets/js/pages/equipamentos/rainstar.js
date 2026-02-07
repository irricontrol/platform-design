// assets/js/pages/equipamentos/rainstar.js
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

  window.IcEquipamentos.rainstar = {
    label: "Carretel",

    // =================
    // STEP 2 — Configuração
    // =================
    renderStep2(container, state) {
      const errors = state._errors || {};

      container.innerHTML = `
        <div class="rs-config">
          <div class="equip-form">
            <div class="equip-form__row">
              <div class="equip-field ${errors.name ? "is-error" : ""}">
                <label class="equip-label"><span class="equip-required">*</span> Nome do equipamento</label>
                <input class="equip-input" id="rsName" placeholder="Carretel 01" value="${escapeHtml(state.name || "")}" aria-invalid="${errors.name ? "true" : "false"}" />
                <div class="rs-error ${errors.name ? "" : "is-hidden"}">Este campo \u00e9 obrigat\u00f3rio</div>
              </div>

              <div class="equip-field ${errors.imei ? "is-error" : ""}">
                <label class="equip-label"><span class="equip-required">*</span> IMEI (ID \u00fanico)</label>
                <input class="equip-input" id="rsImei" placeholder="860585004298393" value="${escapeHtml(state.imei || "")}" aria-invalid="${errors.imei ? "true" : "false"}" />
                <div class="rs-error ${errors.imei ? "" : "is-hidden"}">Este campo \u00e9 obrigat\u00f3rio</div>
              </div>
            </div>
          </div>

          <div class="rs-section">
            <div class="rs-section__title">Controles</div>
          </div>

          <div class="rs-grid">
            <div class="rs-field ${errors.method ? "is-error" : ""}">
              <label class="equip-label"><span class="equip-required">*</span> M\u00e9todo de configura\u00e7\u00e3o</label>
              <select class="equip-input" id="rsMethod" aria-invalid="${errors.method ? "true" : "false"}">
                <option value="Puxando o carrinho (Padr\u00e3o)">Puxando o carrinho (Padr\u00e3o)</option>
                <option value="Recolhendo o carrinho">Recolhendo o carrinho</option>
              </select>
              <div class="rs-error ${errors.method ? "" : "is-hidden"}">Este campo \u00e9 obrigat\u00f3rio</div>
            </div>

            <div class="rs-field ${errors.model ? "is-error" : ""}">
              <label class="equip-label"><span class="equip-required">*</span> Modelo</label>
              <select class="equip-input" id="rsModel" aria-invalid="${errors.model ? "true" : "false"}">
                <option value="Rainstar A2">Rainstar A2</option>
                <option value="Rainstar A3">Rainstar A3</option>
                <option value="Rainstar A4">Rainstar A4</option>
              </select>
              <div class="rs-error ${errors.model ? "" : "is-hidden"}">Este campo \u00e9 obrigat\u00f3rio</div>
            </div>

            <div class="rs-field ${errors.flow ? "is-error" : ""}">
              <label class="equip-label"><span class="equip-required">*</span> Taxa de fluxo</label>
              <div class="rs-input-group">
                <input class="equip-input rs-input" id="rsFlow" type="number" min="0" step="0.01" value="${escapeHtml(state.flow || "")}" />
                <span class="rs-input-suffix">m\u00b3/h</span>
              </div>
              <div class="rs-error ${errors.flow ? "" : "is-hidden"}">Este campo \u00e9 obrigat\u00f3rio</div>
            </div>

            <div class="rs-field ${errors.width ? "is-error" : ""}">
              <label class="equip-label"><span class="equip-required">*</span> Largura operacional</label>
              <div class="rs-input-group">
                <input class="equip-input rs-input" id="rsWidth" type="number" min="0" step="0.01" value="${escapeHtml(state.width || "")}" />
                <span class="rs-input-suffix">m</span>
              </div>
              <div class="rs-error ${errors.width ? "" : "is-hidden"}">Este campo \u00e9 obrigat\u00f3rio</div>
            </div>

            <div class="rs-field ${errors.range ? "is-error" : ""}">
              <label class="equip-label"><span class="equip-required">*</span> Alcance</label>
              <div class="rs-input-group">
                <input class="equip-input rs-input" id="rsRange" type="number" min="0" step="0.01" value="${escapeHtml(state.range || "")}" />
                <span class="rs-input-suffix">m</span>
              </div>
              <div class="rs-error ${errors.range ? "" : "is-hidden"}">Este campo \u00e9 obrigat\u00f3rio</div>
            </div>

            <div class="rs-field ${errors.nozzle ? "is-error" : ""}">
              <label class="equip-label"><span class="equip-required">*</span> \u00d8 Bocal</label>
              <select class="equip-input" id="rsNozzle" aria-invalid="${errors.nozzle ? "true" : "false"}">
                <option value="22.5 mm">22.5 mm</option>
                <option value="24 mm">24 mm</option>
                <option value="26 mm">26 mm</option>
                <option value="28 mm">28 mm</option>
              </select>
              <div class="rs-error ${errors.nozzle ? "" : "is-hidden"}">Este campo \u00e9 obrigat\u00f3rio</div>
            </div>

            <div class="rs-field ${errors.pressure ? "is-error" : ""}">
              <label class="equip-label"><span class="equip-required">*</span> Press\u00e3o ideal</label>
              <div class="rs-input-group">
                <input class="equip-input rs-input" id="rsPressure" type="number" min="0" step="0.01" value="${escapeHtml(state.pressure || "")}" />
                <span class="rs-input-suffix">bar</span>
              </div>
              <div class="rs-error ${errors.pressure ? "" : "is-hidden"}">Este campo \u00e9 obrigat\u00f3rio</div>
            </div>

            <div class="rs-field ${errors.pressureAdj ? "is-error" : ""}">
              <label class="equip-label"><span class="equip-required">*</span> Corre\u00e7\u00e3o de press\u00e3o</label>
              <div class="rs-input-group">
                <input class="equip-input rs-input" id="rsPressureAdj" type="number" min="0" step="0.01" value="${escapeHtml(state.pressureAdj || "")}" />
                <span class="rs-input-suffix">bar</span>
              </div>
              <div class="rs-error ${errors.pressureAdj ? "" : "is-hidden"}">Este campo \u00e9 obrigat\u00f3rio</div>
            </div>
          </div>
        </div>
      `;

      this.bindStep2(container, state);
      if (window.IcEquipSelectInit) window.IcEquipSelectInit(container);
    },

    bindStep2(container, state) {
      const setValue = (key, el) => {
        if (!el) return;
        el.addEventListener("input", () => {
          state[key] = el.value;
        });
      };

      const setSelect = (key, el) => {
        if (!el) return;
        el.addEventListener("change", () => {
          state[key] = el.value;
        });
      };

      const nameInput = container.querySelector("#rsName");
      const imeiInput = container.querySelector("#rsImei");
      const method = container.querySelector("#rsMethod");
      const model = container.querySelector("#rsModel");
      const flow = container.querySelector("#rsFlow");
      const width = container.querySelector("#rsWidth");
      const range = container.querySelector("#rsRange");
      const nozzle = container.querySelector("#rsNozzle");
      const pressure = container.querySelector("#rsPressure");
      const pressureAdj = container.querySelector("#rsPressureAdj");

      if (method) method.value = state.method || "Puxando o carrinho (Padr\u00e3o)";
      if (model) model.value = state.model || "Rainstar A2";
      if (nozzle) nozzle.value = state.nozzle || "22.5 mm";

      setValue("name", nameInput);
      setValue("imei", imeiInput);
      setSelect("method", method);
      setSelect("model", model);
      setValue("flow", flow);
      setValue("width", width);
      setValue("range", range);
      setSelect("nozzle", nozzle);
      setValue("pressure", pressure);
      setValue("pressureAdj", pressureAdj);
    },

    readStep2(container) {
      return {
        name: container.querySelector("#rsName")?.value?.trim() || "",
        imei: container.querySelector("#rsImei")?.value?.trim() || "",
        method: container.querySelector("#rsMethod")?.value || "",
        model: container.querySelector("#rsModel")?.value || "",
        flow: container.querySelector("#rsFlow")?.value?.trim() || "",
        width: container.querySelector("#rsWidth")?.value?.trim() || "",
        range: container.querySelector("#rsRange")?.value?.trim() || "",
        nozzle: container.querySelector("#rsNozzle")?.value || "",
        pressure: container.querySelector("#rsPressure")?.value?.trim() || "",
        pressureAdj: container.querySelector("#rsPressureAdj")?.value?.trim() || "",
      };
    },

    validateStep2(data) {
      const errors = {};

      if (!data.name) errors.name = true;
      if (!data.imei) errors.imei = true;
      if (!data.method) errors.method = true;
      if (!data.model) errors.model = true;
      if (!data.flow) errors.flow = true;
      if (!data.width) errors.width = true;
      if (!data.range) errors.range = true;
      if (!data.nozzle) errors.nozzle = true;
      if (!data.pressure) errors.pressure = true;
      if (!data.pressureAdj) errors.pressureAdj = true;

      return { ok: Object.keys(errors).length === 0, errors };
    },
  };
})();
