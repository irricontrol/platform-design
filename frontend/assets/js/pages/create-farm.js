// assets/js/pages/create-farm.js
(function initCreateFarm() {
  "use strict";

  const openBtn = document.getElementById("btnCreateFarm");
  const modal = document.getElementById("createFarmModal");
  const nextBtn = document.getElementById("btnCreateFarmNext");
  const prevBtn = document.getElementById("btnCreateFarmPrev");
  const stepsContainer = document.getElementById("createFarmSteps");
  const bodyHost = document.getElementById("createFarmBody");
  const footer = document.getElementById("createFarmFooter");

  if (!openBtn || !modal || !nextBtn || !stepsContainer || !bodyHost) return;

  const closeTriggers = modal.querySelectorAll("[data-close-farm]");
  const steps = ["Geral", "Faturamento", "Contato", "Faixas de Energia", "Localização"];
  let currentStepIndex = 0;

  const BILLING_RULES = {
    BR: {
      fields: {
        country: {
          label: "Pa\u00eds",
          placeholder: "",
          required: true,
          show: true,
        },
        address: {
          label: "Endere\u00e7o (Rua + n\u00famero)",
          placeholder: "Ex: Av. Brasil, 120",
          required: true,
          show: true,
        },
        city: {
          label: "Cidade",
          placeholder: "Ex: Goi\u00e2nia",
          required: true,
          show: true,
        },
        postal: {
          label: "CEP",
          placeholder: "00000-000",
          required: true,
          show: true,
        },
        region: {
          label: "Estado (UF)",
          placeholder: "Ex: SP",
          required: true,
          show: true,
          type: "text",
        },
        neighborhood: {
          label: "Bairro",
          placeholder: "Opcional",
          required: false,
          show: true,
        },
      },
      docTypes: [
        { value: "cpf", label: "CPF" },
        { value: "cnpj", label: "CNPJ" },
      ],
      regionSelectPlaceholder: "Selecione o estado",
    },
    US: {
      fields: {
        country: {
          label: "Country",
          placeholder: "",
          required: true,
          show: true,
        },
        address: {
          label: "Street Address",
          placeholder: "123 Main St",
          required: true,
          show: true,
        },
        city: {
          label: "City",
          placeholder: "New York",
          required: true,
          show: true,
        },
        postal: {
          label: "ZIP Code",
          placeholder: "10001",
          required: true,
          show: true,
        },
        region: {
          label: "State",
          placeholder: "",
          required: true,
          show: true,
          type: "select",
        },
        neighborhood: {
          label: "Neighborhood",
          placeholder: "",
          required: false,
          show: false,
        },
      },
      docTypes: [
        { value: "ssn", label: "SSN" },
        { value: "ein", label: "EIN" },
      ],
      regionSelectPlaceholder: "Select a state",
    },
    DE: {
      fields: {
        country: {
          label: "Country",
          placeholder: "",
          required: true,
          show: true,
        },
        address: {
          label: "Street + Number",
          placeholder: "Musterstrasse 12",
          required: true,
          show: true,
        },
        city: {
          label: "City",
          placeholder: "Berlin",
          required: true,
          show: true,
        },
        postal: {
          label: "Postal Code",
          placeholder: "10115",
          required: true,
          show: true,
        },
        region: {
          label: "State",
          placeholder: "",
          required: false,
          show: false,
          type: "text",
        },
        neighborhood: {
          label: "Neighborhood",
          placeholder: "",
          required: false,
          show: false,
        },
      },
      docTypes: [{ value: "vat", label: "VAT" }],
      regionSelectPlaceholder: "Select a state",
    },
    ZA: {
      fields: {
        country: {
          label: "Country",
          placeholder: "",
          required: true,
          show: true,
        },
        address: {
          label: "Address Line",
          placeholder: "123 Main Rd",
          required: true,
          show: true,
        },
        city: {
          label: "City",
          placeholder: "Cape Town",
          required: true,
          show: true,
        },
        postal: {
          label: "Postal Code",
          placeholder: "8001",
          required: true,
          show: true,
        },
        region: {
          label: "Province",
          placeholder: "Western Cape",
          required: true,
          show: true,
          type: "text",
        },
        neighborhood: {
          label: "Neighborhood",
          placeholder: "",
          required: false,
          show: false,
        },
      },
      docTypes: [{ value: "id", label: "ID Number" }],
      regionSelectPlaceholder: "Select a province",
    },
  };

  const DEFAULT_BILLING = {
    fields: {
      country: {
        label: "Country",
        placeholder: "",
        required: true,
        show: true,
      },
      address: {
        label: "Address Line",
        placeholder: "",
        required: true,
        show: true,
      },
      city: {
        label: "City",
        placeholder: "",
        required: true,
        show: true,
      },
      postal: {
        label: "Postal Code",
        placeholder: "",
        required: true,
        show: true,
      },
      region: {
        label: "Region",
        placeholder: "",
        required: true,
        show: true,
        type: "text",
      },
      neighborhood: {
        label: "Neighborhood",
        placeholder: "",
        required: false,
        show: false,
      },
    },
    docTypes: [{ value: "id", label: "ID Number" }],
    regionSelectPlaceholder: "Select",
  };

  const US_STATE_CODES = [
    "AL",
    "AK",
    "AZ",
    "AR",
    "CA",
    "CO",
    "CT",
    "DE",
    "FL",
    "GA",
    "HI",
    "ID",
    "IL",
    "IN",
    "IA",
    "KS",
    "KY",
    "LA",
    "ME",
    "MD",
    "MA",
    "MI",
    "MN",
    "MS",
    "MO",
    "MT",
    "NE",
    "NV",
    "NH",
    "NJ",
    "NM",
    "NY",
    "NC",
    "ND",
    "OH",
    "OK",
    "OR",
    "PA",
    "RI",
    "SC",
    "SD",
    "TN",
    "TX",
    "UT",
    "VT",
    "VA",
    "WA",
    "WV",
    "WI",
    "WY",
    "DC",
  ];

  function setHidden(el, hidden) {
    if (!el) return;
    el.classList.toggle("is-hidden", hidden);
    el.setAttribute("aria-hidden", String(hidden));
  }

  function setText(el, text) {
    if (!el) return;
    el.textContent = text || "";
  }

  function setFieldState(field, config) {
    if (!field || !config) return;
    setHidden(field, !config.show);
    const labelText = field.querySelector("[data-label-text]");
    const input = field.querySelector("[data-input]");
    setText(labelText, config.label);
    if (input) {
      input.placeholder = config.placeholder || "";
      input.required = !!config.required && config.show;
      input.disabled = !config.show;
    }
  }

  function setControlState(control, show) {
    if (!control) return;
    setHidden(control, !show);
    control.disabled = !show;
  }

  function buildSelectOptions(select, options, placeholder) {
    if (!select) return;
    select.innerHTML = "";
    if (placeholder !== null) {
      const placeholderOption = document.createElement("option");
      placeholderOption.value = "";
      placeholderOption.textContent = placeholder || "Select";
      select.appendChild(placeholderOption);
    }
    options.forEach((item) => {
      const option = document.createElement("option");
      if (typeof item === "string") {
        option.value = item;
        option.textContent = item;
      } else {
        option.value = item.value;
        option.textContent = item.label;
      }
      select.appendChild(option);
    });
  }

  function applyBillingRules(root, countryCode) {
    const rules = BILLING_RULES[countryCode] || DEFAULT_BILLING;
    const countryField = root.querySelector('[data-field="country"]');
    const addressField = root.querySelector('[data-field="address"]');
    const cityField = root.querySelector('[data-field="city"]');
    const postalField = root.querySelector('[data-field="postal"]');
    const neighborhoodField = root.querySelector('[data-field="neighborhood"]');
    const regionField = root.querySelector('[data-field="region"]');
    const regionInput = root.querySelector("[data-region-input]");
    const regionSelect = root.querySelector("[data-region-select]");
    const docTypeSelect = root.querySelector("[data-doc-type]");

    setFieldState(countryField, rules.fields.country);
    setFieldState(addressField, rules.fields.address);
    setFieldState(cityField, rules.fields.city);
    setFieldState(postalField, rules.fields.postal);
    setFieldState(neighborhoodField, rules.fields.neighborhood);

    if (regionField) {
      setHidden(regionField, !rules.fields.region.show);
      const labelText = regionField.querySelector("[data-label-text]");
      setText(labelText, rules.fields.region.label);
      const useSelect = rules.fields.region.type === "select";
      setControlState(regionInput, rules.fields.region.show && !useSelect);
      setControlState(regionSelect, rules.fields.region.show && useSelect);
      if (useSelect) {
        const options = countryCode === "US" ? US_STATE_CODES : [];
        buildSelectOptions(regionSelect, options, rules.regionSelectPlaceholder);
        if (regionSelect) {
          regionSelect.required = !!rules.fields.region.required && rules.fields.region.show;
        }
      } else if (regionInput) {
        regionInput.placeholder = rules.fields.region.placeholder || "";
        regionInput.required = !!rules.fields.region.required && rules.fields.region.show;
      }
    }

    if (docTypeSelect) {
      buildSelectOptions(docTypeSelect, rules.docTypes || DEFAULT_BILLING.docTypes, null);
      docTypeSelect.selectedIndex = 0;
    }
  }

  function bindBillingForm() {
    const root = bodyHost.querySelector("[data-farm-billing]");
    if (!root) return;
    const countrySelect = root.querySelector("[data-country]");
    if (!countrySelect) return;

    const apply = () => applyBillingRules(root, countrySelect.value);
    countrySelect.addEventListener("change", apply);
    apply();
  }

  function renderSteps() {
    stepsContainer.innerHTML = "";
    steps.forEach((label, index) => {
      const stepEl = document.createElement("div");
      stepEl.className = "create-equip__step";
      if (index === currentStepIndex) stepEl.classList.add("create-equip__step--active");

      const numEl = document.createElement("span");
      numEl.className = "create-equip__step-num";
      numEl.textContent = String(index + 1);

      const labelEl = document.createElement("span");
      labelEl.className = "create-equip__step-label";
      labelEl.textContent = label;

      stepEl.append(numEl, labelEl);
      stepsContainer.appendChild(stepEl);
    });
  }

  function updateFooterLayout() {
    if (!prevBtn || !footer) return;
    const showPrev = currentStepIndex > 0;
    prevBtn.style.display = showPrev ? "" : "none";
    footer.classList.toggle("no-prev", !showPrev);
  }

  function setButtons() {
    const isLast = currentStepIndex === steps.length - 1;
    nextBtn.textContent = isLast ? "Finalizar" : "Próximo";
  }

  function renderPlaceholder(label) {
    bodyHost.innerHTML = `
      <div style="padding:14px;border:1px solid #e5e7eb;border-radius:12px;background:#fff;">
        <strong>${label}</strong><br/>
        <span style="color:#6b7280;">Conteúdo em construção.</span>
      </div>
    `;
  }

  function renderStepContent() {
    const label = steps[currentStepIndex];
    renderSteps();
    setButtons();
    updateFooterLayout();

    if (label === "Geral") {
      bodyHost.innerHTML = `
        <div class="equip-wizard__head">
          <div class="equip-wizard__title"></div>
          <div class="equip-wizard__subtitle"></div>
        </div>
        <div class="equip-form">
          <div class="equip-field">
            <label class="equip-label"><span class="equip-required">*</span>Nome da fazenda</label>
            <input class="equip-input" type="text" placeholder="Recanto da Serra" />
          </div>

          <div class="equip-form__row">
            <div class="equip-field">
              <label class="equip-label"><span class="equip-required">*</span>Dia da fatura de energia</label>
              <input class="equip-input" type="number" min="1" max="31" inputmode="numeric" placeholder="1" />
            </div>
            <div class="equip-field">
              <label class="equip-label"><span class="equip-required">*</span>Dia da fatura de água</label>
              <input class="equip-input" type="number" min="1" max="31" inputmode="numeric" placeholder="1" />
            </div>
          </div>

          <label class="equip-check">
            <input class="equip-check__input" type="checkbox" />
            <span>A fazenda possui Central?</span>
          </label>

          <div class="equip-field">
            <label class="equip-label"><span class="equip-required">*</span>Fuso horário</label>
            <select class="equip-input">
              <option value="Africa/Abidjan">África/Abidjan (GMT+00)</option>
              <option value="America/Sao_Paulo">América/Sao_Paulo (GMT-03)</option>
              <option value="America/Cuiaba">América/Cuiabá (GMT-04)</option>
              <option value="America/Manaus">América/Manaus (GMT-04)</option>
              <option value="America/Rio_Branco">América/Rio Branco (GMT-05)</option>
              <option value="UTC">UTC (GMT+00)</option>
            </select>
          </div>
        </div>
      `;
      return;
    }

    if (label === "Faturamento") {
      bodyHost.innerHTML = `
        <div class="farm-billing" data-farm-billing>
          <div class="equip-alert farm-billing__alert" role="note">
            <i class="fa-solid fa-circle-info" aria-hidden="true"></i>
            <span>As informa\u00e7\u00f5es devem ser do cliente</span>
          </div>

          <section class="farm-billing__section">
            <header class="farm-billing__section-head">
              <h4 class="farm-billing__section-title">Endere\u00e7o de Faturamento</h4>
            </header>

            <div class="equip-form farm-billing__grid">
              <div class="equip-field farm-billing__field" data-field="country">
                <label class="equip-label" for="farmBillingCountry">
                  <span data-label-text>Pa\u00eds</span>
                  <span class="equip-required">*</span>
                </label>
                <select class="equip-input" id="farmBillingCountry" name="billing_country" data-country data-input required>
                  <option value="BR">Brasil</option>
                  <option value="US">Estados Unidos</option>
                  <option value="DE">Alemanha</option>
                  <option value="ZA">\u00c1frica do Sul</option>
                </select>
              </div>

              <div class="equip-field farm-billing__field" data-field="postal">
                <label class="equip-label" for="farmBillingPostal">
                  <span data-label-text>CEP</span>
                  <span class="equip-required">*</span>
                </label>
                <input class="equip-input" id="farmBillingPostal" name="billing_postal_code" data-input type="text" placeholder="00000-000" required />
              </div>

              <div class="equip-field farm-billing__field" data-field="city">
                <label class="equip-label" for="farmBillingCity">
                  <span data-label-text>Cidade</span>
                  <span class="equip-required">*</span>
                </label>
                <input class="equip-input" id="farmBillingCity" name="billing_city" data-input type="text" placeholder="Ex: Goi\u00e2nia" required />
              </div>

              <div class="equip-field farm-billing__field" data-field="region">
                <label class="equip-label" for="farmBillingRegion">
                  <span data-label-text>Estado (UF)</span>
                  <span class="equip-required">*</span>
                </label>
                <input class="equip-input farm-billing__control" id="farmBillingRegion" name="billing_region" data-region-input type="text" placeholder="Ex: SP" />
                <select class="equip-input farm-billing__control" id="farmBillingRegionSelect" name="billing_region_code" data-region-select></select>
              </div>

              <div class="equip-field farm-billing__field farm-billing__field--full" data-field="address">
                <label class="equip-label" for="farmBillingAddress">
                  <span data-label-text>Endere\u00e7o (Rua + n\u00famero)</span>
                  <span class="equip-required">*</span>
                </label>
                <input class="equip-input" id="farmBillingAddress" name="billing_address" data-input type="text" placeholder="Ex: Av. Brasil, 120" required />
              </div>

              <div class="equip-field farm-billing__field" data-field="neighborhood">
                <label class="equip-label" for="farmBillingNeighborhood">
                  <span data-label-text>Bairro</span>
                </label>
                <input class="equip-input" id="farmBillingNeighborhood" name="billing_neighborhood" data-input type="text" placeholder="Opcional" />
              </div>
            </div>
          </section>

          <section class="farm-billing__section">
            <header class="farm-billing__section-head">
              <h4 class="farm-billing__section-title">Informa\u00e7\u00f5es de Faturamento</h4>
            </header>

            <div class="equip-form farm-billing__grid farm-billing__grid--docs">
              <div class="equip-field farm-billing__field" data-field="docType">
                <label class="equip-label" for="farmBillingDocType">
                  <span data-label-text>Documento</span>
                  <span class="equip-required">*</span>
                </label>
                <select class="equip-input" id="farmBillingDocType" name="billing_document_type" data-doc-type required></select>
              </div>

              <div class="equip-field farm-billing__field" data-field="docNumber">
                <label class="equip-label" for="farmBillingDocNumber">
                  <span data-label-text>N\u00famero do documento</span>
                  <span class="equip-required">*</span>
                </label>
                <input class="equip-input" id="farmBillingDocNumber" name="billing_document_number" type="text" placeholder="Digite o n\u00famero" required />
              </div>
            </div>

            <div class="equip-form farm-billing__grid">
              <div class="equip-field farm-billing__field farm-billing__field--full" data-field="legalName">
                <label class="equip-label" for="farmBillingName">
                  <span data-label-text>Nome completo / Legal Name</span>
                  <span class="equip-required">*</span>
                </label>
                <input class="equip-input" id="farmBillingName" name="billing_legal_name" type="text" placeholder="Nome completo do cliente" required />
              </div>

              <div class="equip-field farm-billing__field" data-field="phone">
                <label class="equip-label" for="farmBillingPhone">
                  <span data-label-text>Celular</span>
                  <span class="equip-required">*</span>
                </label>
                <input class="equip-input" id="farmBillingPhone" name="billing_phone" type="tel" placeholder="+55 (00) 90000-0000" required />
              </div>

              <div class="equip-field farm-billing__field" data-field="email">
                <label class="equip-label" for="farmBillingEmail">
                  <span data-label-text>E-mail</span>
                  <span class="equip-required">*</span>
                </label>
                <input class="equip-input" id="farmBillingEmail" name="billing_email" type="email" placeholder="cliente@email.com" required />
              </div>
            </div>
          </section>
        </div>
      `;
      bindBillingForm();
      return;
    }

    renderPlaceholder(label);
  }

  function goNext() {
    if (currentStepIndex >= steps.length - 1) {
      closeModal();
      return;
    }
    currentStepIndex++;
    renderStepContent();
  }

  function goPrev() {
    if (currentStepIndex === 0) return;
    currentStepIndex--;
    renderStepContent();
  }

  function openModal() {
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("is-modal-open");
    currentStepIndex = 0;
    renderStepContent();
  }

  function closeModal() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("is-modal-open");
  }

  openBtn.addEventListener("click", openModal);
  closeTriggers.forEach((t) => t.addEventListener("click", closeModal));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("is-open")) closeModal();
  });

  nextBtn.addEventListener("click", goNext);
  if (prevBtn) prevBtn.addEventListener("click", goPrev);
})();
