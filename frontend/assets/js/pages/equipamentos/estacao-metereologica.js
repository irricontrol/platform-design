// assets/js/pages/equipamentos/estacao-metereologica.js
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

  window.IcEquipamentos.estacao_metereologica = {
    label: "Estação Meteorológica",

    // =================
    // STEP 2 — Configuração
    // =================
    renderStep2(container, state) {
      const errors = state._errors || {};

      container.innerHTML = `
        <div class="ws-config">
          <div class="ws-grid ws-grid--top">
            <div class="ws-field ${errors.vendor ? "is-error" : ""}">
              <label class="equip-label"><span class="equip-required">*</span> Fabricante</label>
              <select class="equip-input" id="wsVendor" aria-invalid="${errors.vendor ? "true" : "false"}">
                <option value="Davis">Davis</option>
              </select>
              <div class="ws-error ${errors.vendor ? "" : "is-hidden"}">Este campo é obrigatório</div>
            </div>
          </div>

          <div class="ws-grid">
            <div class="ws-field ${errors.name ? "is-error" : ""}">
              <label class="equip-label"><span class="equip-required">*</span> Nome do equipamento</label>
              <input class="equip-input" id="wsName" placeholder="Estação Meteorológica" value="${escapeHtml(state.name || "")}" aria-invalid="${errors.name ? "true" : "false"}" />
              <div class="ws-error ${errors.name ? "" : "is-hidden"}">Este campo é obrigatório</div>
            </div>

            <div class="ws-field ${errors.apiKey ? "is-error" : ""}">
              <label class="equip-label"><span class="equip-required">*</span> Chave da API</label>
              <input class="equip-input" id="wsApiKey" placeholder="aw12!fg4SYufdGg3@1ssD" value="${escapeHtml(state.apiKey || "")}" aria-invalid="${errors.apiKey ? "true" : "false"}" />
              <div class="ws-error ${errors.apiKey ? "" : "is-hidden"}">Este campo é obrigatório</div>
            </div>

            <div class="ws-field ${errors.apiSecret ? "is-error" : ""}">
              <label class="equip-label"><span class="equip-required">*</span> Segredo da API</label>
              <input class="equip-input" id="wsApiSecret" type="password" placeholder="****************" value="${escapeHtml(state.apiSecret || "")}" aria-invalid="${errors.apiSecret ? "true" : "false"}" />
              <div class="ws-error ${errors.apiSecret ? "" : "is-hidden"}">Este campo é obrigatório</div>
            </div>

            <div class="ws-field ${errors.stationId ? "is-error" : ""}">
              <label class="equip-label"><span class="equip-required">*</span> ID da Estação Meteorológica</label>
              <input class="equip-input" id="wsStationId" placeholder="F4GT65H32" value="${escapeHtml(state.stationId || "")}" aria-invalid="${errors.stationId ? "true" : "false"}" />
              <div class="ws-error ${errors.stationId ? "" : "is-hidden"}">Este campo é obrigatório</div>
            </div>
          </div>
        </div>
      `;

      this.bindStep2(container, state);
      if (window.IcEquipSelectInit) window.IcEquipSelectInit(container);
    },

    bindStep2(container, state) {
      const vendor = container.querySelector("#wsVendor");
      const nameInput = container.querySelector("#wsName");
      const apiKeyInput = container.querySelector("#wsApiKey");
      const apiSecretInput = container.querySelector("#wsApiSecret");
      const stationIdInput = container.querySelector("#wsStationId");

      if (vendor) {
        vendor.value = state.vendor || "Davis";
        vendor.addEventListener("change", () => {
          state.vendor = vendor.value;
        });
      }

      if (nameInput) {
        nameInput.addEventListener("input", () => {
          state.name = nameInput.value.trim();
        });
      }

      if (apiKeyInput) {
        apiKeyInput.addEventListener("input", () => {
          state.apiKey = apiKeyInput.value.trim();
        });
      }

      if (apiSecretInput) {
        apiSecretInput.addEventListener("input", () => {
          state.apiSecret = apiSecretInput.value.trim();
        });
      }

      if (stationIdInput) {
        stationIdInput.addEventListener("input", () => {
          state.stationId = stationIdInput.value.trim();
        });
      }
    },

    readStep2(container) {
      return {
        vendor: container.querySelector("#wsVendor")?.value || "",
        name: container.querySelector("#wsName")?.value?.trim() || "",
        apiKey: container.querySelector("#wsApiKey")?.value?.trim() || "",
        apiSecret: container.querySelector("#wsApiSecret")?.value?.trim() || "",
        stationId: container.querySelector("#wsStationId")?.value?.trim() || "",
      };
    },

    validateStep2(data) {
      const errors = {};
      if (!data.vendor) errors.vendor = true;
      if (!data.name) errors.name = true;
      if (!data.apiKey) errors.apiKey = true;
      if (!data.apiSecret) errors.apiSecret = true;
      if (!data.stationId) errors.stationId = true;
      return { ok: Object.keys(errors).length === 0, errors };
    },
  };
})();
