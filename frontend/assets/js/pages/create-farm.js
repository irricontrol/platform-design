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
  let farmLocationMap = null;
  let farmLocationMarker = null;

  const farmState = {
    name: "",
    loc: "",
    lat: -22.008419,
    lng: -46.812567,
    radius: "",
  };

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
          label: "Endere\u00e7o",
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
          show: false,
        },
      },
      docTypes: [
        { value: "cpf", label: "CPF (Cadastro de Pessoa F\u00edsica)" },
        { value: "cnpj", label: "CNPJ (Cadastro Nacional da Pessoa Jur\u00eddica)" },
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

  const farmBillingState = {
    country: "",
    postal: "",
    city: "",
    address: "",
    region: "",
    regionCode: "",
    neighborhood: "",
  };

  const farmContactState = {
    useBillingAddress: false,
  };

  const FARM_STORAGE_KEY = "ic_farms";
  const farmListHost = document.getElementById("farmList");
  const farmSearchInput = document.getElementById("farmSearchInput");
  const farmSearchPanel = document.getElementById("farmSearchPanel");
  const farmSearchHost = document.getElementById("farmSearch");
  const mapCardTitle = document.querySelector("#mapCard .map-card__title h2");
  let farms = [];
  let farmMarkers = new Map();
  let farmLayer = null;
  let currentFarmId = null;

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

  function loadFarms() {
    try {
      const raw = localStorage.getItem(FARM_STORAGE_KEY);
      farms = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(farms)) farms = [];
    } catch (e) {
      farms = [];
    }
  }

  function saveFarms() {
    localStorage.setItem(FARM_STORAGE_KEY, JSON.stringify(farms));
  }

  function ensureFarmLayer() {
    if (!window.L || !window.icMap) return null;
    if (!farmLayer) {
      farmLayer = L.layerGroup().addTo(window.icMap);
    }
    return farmLayer;
  }

  function addFarmMarker(farm) {
    const layer = ensureFarmLayer();
    if (!layer || !farm) return;
    if (farmMarkers.has(farm.id)) {
      const existing = farmMarkers.get(farm.id);
      existing.setLatLng([farm.lat, farm.lng]);
      existing.bindPopup(farm.name);
      return;
    }
    const marker = L.marker([farm.lat, farm.lng]).addTo(layer);
    marker.bindPopup(farm.name);
    farmMarkers.set(farm.id, marker);
  }

  function updateActiveFarm() {
    if (!farmListHost) return;
    farmListHost.querySelectorAll(".farm-list__item").forEach((item) => {
      item.classList.toggle("is-active", item.dataset.farmId === currentFarmId);
    });
  }

  function openFarmPanel() {
    if (!farmSearchPanel) return;
    farmSearchPanel.classList.add("is-open");
    farmSearchPanel.setAttribute("aria-hidden", "false");
  }

  function closeFarmPanel() {
    if (!farmSearchPanel) return;
    farmSearchPanel.classList.remove("is-open");
    farmSearchPanel.setAttribute("aria-hidden", "true");
  }

  function selectFarm(farmId) {
    const farm = farms.find((item) => item.id === farmId);
    if (!farm) return;
    currentFarmId = farmId;
    addFarmMarker(farm);
    if (window.icMap) {
      window.icMap.setView([farm.lat, farm.lng], 16);
    }
    const marker = farmMarkers.get(farmId);
    if (marker) marker.openPopup();
    if (mapCardTitle) mapCardTitle.textContent = farm.name;
    updateActiveFarm();
    closeFarmPanel();
  }

  function renderFarmList(filter = "") {
    if (!farmListHost) return;
    farmListHost.innerHTML = "";
    const term = filter.trim().toLowerCase();
    const filtered = farms.filter((farm) => farm.name.toLowerCase().includes(term));

    if (!filtered.length) {
      const empty = document.createElement("div");
      empty.className = "farm-list__empty";
      empty.textContent = term ? "Nenhuma fazenda encontrada." : "Nenhuma fazenda cadastrada.";
      farmListHost.appendChild(empty);
      return;
    }

    filtered.forEach((farm) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "farm-list__item";
      btn.dataset.farmId = farm.id;

      const dot = document.createElement("span");
      dot.className = "farm-list__dot";

      const name = document.createElement("span");
      name.className = "farm-list__name";
      name.textContent = farm.name;

      btn.append(dot, name);
      btn.addEventListener("click", () => selectFarm(farm.id));
      farmListHost.appendChild(btn);
    });

    updateActiveFarm();
  }

  function initFarmList() {
    if (!farmListHost && !window.icMap) return;
    loadFarms();
    farms.forEach(addFarmMarker);
    renderFarmList(farmSearchInput ? farmSearchInput.value : "");
    if (farmSearchInput) {
      farmSearchInput.addEventListener("focus", () => {
        openFarmPanel();
        renderFarmList(farmSearchInput.value);
      });
      farmSearchInput.addEventListener("click", () => {
        openFarmPanel();
        renderFarmList(farmSearchInput.value);
      });
      farmSearchInput.addEventListener("input", (e) => {
        openFarmPanel();
        renderFarmList(e.target.value);
      });
      farmSearchInput.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeFarmPanel();
      });
    }

    document.addEventListener("click", (e) => {
      if (!farmSearchHost) return;
      if (!farmSearchHost.contains(e.target)) closeFarmPanel();
    });
  }

  function addFarmFromWizard() {
    const name = (farmState.name || "").trim() || "Nova fazenda";
    const lat = Number(farmState.lat);
    const lng = Number(farmState.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    const farm = {
      id: `farm_${Date.now()}`,
      name,
      lat,
      lng,
    };

    farms.push(farm);
    saveFarms();
    addFarmMarker(farm);
    renderFarmList(farmSearchInput ? farmSearchInput.value : "");
    selectFarm(farm.id);
  }

  function collectBillingState(root) {
    if (!root) return;
    const countrySelect = root.querySelector("[data-country]");
    farmBillingState.country = countrySelect?.value || farmBillingState.country || "";
    farmBillingState.postal = root.querySelector('[data-field="postal"] [data-input]')?.value || "";
    farmBillingState.city = root.querySelector('[data-field="city"] [data-input]')?.value || "";
    farmBillingState.address = root.querySelector('[data-field="address"] [data-input]')?.value || "";
    farmBillingState.neighborhood = root.querySelector('[data-field="neighborhood"] [data-input]')?.value || "";
    farmBillingState.region = root.querySelector("[data-region-input]")?.value || "";
    farmBillingState.regionCode = root.querySelector("[data-region-select]")?.value || "";
  }

  function applyBillingState(root) {
    if (!root) return;
    const countrySelect = root.querySelector("[data-country]");
    const country = farmBillingState.country || countrySelect?.value || "";
    if (countrySelect) countrySelect.value = country;
    if (!country) return;
    applyBillingRules(root, country);

    const setValue = (selector, value) => {
      const el = root.querySelector(selector);
      if (el) el.value = value || "";
    };

    setValue('[data-field="postal"] [data-input]', farmBillingState.postal);
    setValue('[data-field="city"] [data-input]', farmBillingState.city);
    setValue('[data-field="address"] [data-input]', farmBillingState.address);
    setValue('[data-field="neighborhood"] [data-input]', farmBillingState.neighborhood);

    const regionSelect = root.querySelector("[data-region-select]");
    const regionInput = root.querySelector("[data-region-input]");
    if (regionSelect && !regionSelect.classList.contains("is-hidden")) {
      regionSelect.value = farmBillingState.regionCode || farmBillingState.region || "";
    } else if (regionInput) {
      regionInput.value = farmBillingState.region || farmBillingState.regionCode || "";
    }
  }

  function clearContactAddress(root) {
    if (!root) return;
    const clearValue = (selector) => {
      const el = root.querySelector(selector);
      if (el) el.value = "";
    };
    clearValue('[data-field="postal"] [data-input]');
    clearValue('[data-field="city"] [data-input]');
    clearValue('[data-field="address"] [data-input]');
    clearValue('[data-field="neighborhood"] [data-input]');

    const regionSelect = root.querySelector("[data-region-select]");
    const regionInput = root.querySelector("[data-region-input]");
    if (regionSelect) regionSelect.value = "";
    if (regionInput) regionInput.value = "";
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

  function bindBillingForm(rootEl, options = {}) {
    const root = rootEl || bodyHost.querySelector("[data-farm-billing]");
    if (!root) return;
    const countrySelect = root.querySelector("[data-country]");
    const detailsBlocks = root.querySelectorAll("[data-billing-details]");
    if (!countrySelect) return;

    const setDetailsState = (show) => {
      root.classList.toggle("is-country-selected", show);
      detailsBlocks.forEach((block) => {
        setHidden(block, !show);
        block.querySelectorAll("input, select").forEach((el) => {
          el.disabled = !show;
        });
      });
    };

    const apply = () => {
      const hasCountry = !!countrySelect.value;
      setDetailsState(hasCountry);
      if (hasCountry) {
        applyBillingRules(root, countrySelect.value);
      }
    };

    countrySelect.addEventListener("change", apply);
    if (options.applyState) {
      applyBillingState(root);
      apply();
    } else {
      apply();
    }

    if (options.syncState) {
      const update = () => collectBillingState(root);
      root.addEventListener("input", update);
      root.addEventListener("change", update);
      update();
    }
  }

  function bindContactForm() {
    const root = bodyHost.querySelector("[data-farm-contact]");
    if (!root) return;
    const countrySelect = root.querySelector("[data-country]");
    const addressGrid = root.querySelector("[data-contact-address]");
    const toggle = root.querySelector("[data-contact-same]");
    const detailsBlocks = root.querySelectorAll("[data-contact-details]");
    if (!countrySelect || !addressGrid) return;

    bindBillingForm(root);

    const setDetailsState = (show) => {
      root.classList.toggle("is-country-selected", show);
      detailsBlocks.forEach((block) => {
        setHidden(block, !show);
        block.querySelectorAll("input, select").forEach((el) => {
          el.disabled = !show;
        });
      });
    };

    function setAddressEnabled(enabled) {
      addressGrid.querySelectorAll("input, select").forEach((el) => {
        const isHidden = el.classList.contains("is-hidden") || el.closest(".is-hidden");
        if (!enabled) {
          el.disabled = true;
        } else {
          el.disabled = !!isHidden;
        }
      });
    }

    const applyUseBilling = () => {
      if (!toggle) return;
      farmContactState.useBillingAddress = toggle.checked;
      if (toggle.checked) {
        if (!countrySelect.value && farmBillingState.country) {
          countrySelect.value = farmBillingState.country;
        }
        setDetailsState(!!countrySelect.value);
        applyBillingState(root);
        setAddressEnabled(false);
      } else {
        setAddressEnabled(true);
        clearContactAddress(root);
      }
    };

    const updateDetails = () => {
      const hasCountry = !!countrySelect.value;
      setDetailsState(hasCountry);
      if (hasCountry) {
        applyBillingRules(root, countrySelect.value);
      }
      if (toggle && toggle.checked) {
        applyUseBilling();
      }
    };

    if (toggle) {
      toggle.checked = farmContactState.useBillingAddress;
      toggle.addEventListener("change", applyUseBilling);
      applyUseBilling();
    }

    countrySelect.addEventListener("change", updateDetails);
    updateDetails();
  }

  function bindEnergyStep() {
    const cards = bodyHost.querySelectorAll("[data-energy-card]");
    if (!cards.length) return;
    cards.forEach((card) => {
      card.addEventListener("click", () => {
        cards.forEach((item) => {
          item.classList.remove("is-selected");
          item.setAttribute("aria-pressed", "false");
        });
        card.classList.add("is-selected");
        card.setAttribute("aria-pressed", "true");
      });
    });
  }

  function bindGeneralStep() {
    const nameInput = bodyHost.querySelector("[data-farm-name]");
    if (!nameInput) return;
    nameInput.value = farmState.name || "";
    nameInput.addEventListener("input", () => {
      farmState.name = nameInput.value;
    });
  }

  function parseLatLng(value) {
    if (!value) return null;
    const match = value.match(/(-?\d+(?:\.\d+)?)[,\s]+(-?\d+(?:\.\d+)?)/);
    if (!match) return null;
    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[2]);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
    return { lat, lng };
  }

  function bindLocationStep() {
    const input = bodyHost.querySelector("[data-location-input]");
    const button = bodyHost.querySelector("[data-location-btn]");
    const radiusInput = bodyHost.querySelector("[data-location-radius]");
    const radiusEditBtn = bodyHost.querySelector("[data-radius-edit]");
    const mapEl = bodyHost.querySelector("[data-location-map]");

    if (radiusInput) {
      radiusInput.value = farmState.radius || "";
      radiusInput.disabled = true;
      radiusInput.addEventListener("input", () => {
        farmState.radius = radiusInput.value;
      });
    }

    if (radiusEditBtn && radiusInput) {
      radiusEditBtn.addEventListener("click", () => {
        radiusInput.disabled = false;
        radiusInput.focus();
        radiusInput.select();
      });
    }

    if (!input || !mapEl) return;

    const parsed = parseLatLng(input.value);
    if (!farmState.loc) {
      const initial = parsed || { lat: farmState.lat, lng: farmState.lng };
      farmState.loc = `${initial.lat.toFixed(6)}, ${initial.lng.toFixed(6)}`;
      input.value = farmState.loc;
    }

    const applyLocation = (lat, lng, setView = true) => {
      farmState.lat = lat;
      farmState.lng = lng;
      farmState.loc = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      input.value = farmState.loc;
      if (farmLocationMarker) {
        farmLocationMarker.setLatLng([lat, lng]);
      }
      if (farmLocationMap && setView) {
        farmLocationMap.setView([lat, lng], farmLocationMap.getZoom());
      }
    };

    input.addEventListener("blur", () => {
      const next = parseLatLng(input.value);
      if (next) applyLocation(next.lat, next.lng);
    });

    if (button && navigator.geolocation) {
      button.addEventListener("click", () => {
        button.disabled = true;
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            applyLocation(latitude, longitude, true);
            if (farmLocationMap) farmLocationMap.setZoom(16);
            button.disabled = false;
          },
          () => {
            button.disabled = false;
          },
          { enableHighAccuracy: true, timeout: 8000 }
        );
      });
    }

    if (!window.L) return;

    if (farmLocationMap) {
      try {
        farmLocationMap.remove();
      } catch (e) {
        // no-op
      }
      farmLocationMap = null;
    }

    const center = parsed || { lat: farmState.lat, lng: farmState.lng };
    farmLocationMap = L.map(mapEl, { zoomControl: true, attributionControl: false })
      .setView([center.lat, center.lng], 16);

    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      { maxZoom: 19, attribution: "Tiles Â© Esri" }
    ).addTo(farmLocationMap);

    L.tileLayer(
      "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
      { maxZoom: 19, opacity: 0.85 }
    ).addTo(farmLocationMap);

    farmLocationMarker = L.marker([center.lat, center.lng]).addTo(farmLocationMap);

    farmLocationMap.on("click", (e) => {
      applyLocation(e.latlng.lat, e.latlng.lng, false);
    });

    setTimeout(() => farmLocationMap.invalidateSize(), 120);
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
    const stepKeyMap = {
      "Geral": "geral",
      "Faturamento": "billing",
      "Contato": "contact",
      "Faixas de Energia": "energy",
      "Localização": "location",
      "LocalizaÃ§Ã£o": "location",
    };
    const stepKey = stepKeyMap[label] || label;
    renderSteps();
    setButtons();
    updateFooterLayout();

    if (stepKey === "geral") {
      bodyHost.innerHTML = `
        <div class="equip-wizard__head">
          <div class="equip-wizard__title"></div>
          <div class="equip-wizard__subtitle"></div>
        </div>
        <div class="equip-form">
          <div class="equip-field">
            <label class="equip-label"><span class="equip-required">*</span>Nome da fazenda</label>
            <input class="equip-input" type="text" placeholder="Recanto da Serra" data-farm-name />
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
      bindGeneralStep();
      return;
    }

    if (stepKey === "billing") {
      bodyHost.innerHTML = `
        <div class="farm-billing" data-farm-billing>
          <div class="farm-billing__intro">
            <div class="equip-alert farm-billing__alert" role="note">
              <i class="fa-solid fa-circle-info" aria-hidden="true"></i>
              <span>As informa\u00e7\u00f5es devem ser do cliente!</span>
            </div>
            <p class="farm-billing__hint">
              Essas informa\u00e7\u00f5es ser\u00e3o utilizadas para emitir faturas relacionadas ao uso da plataforma Irricontrol.
            </p>
          </div>

          <section class="farm-billing__section">
            <header class="farm-billing__section-head">
              <h4 class="farm-billing__section-title">Endere\u00e7o de Faturamento</h4>
            </header>

            <div class="equip-form farm-billing__grid farm-billing__grid--country">
              <div class="equip-field farm-billing__field" data-field="country">
                <label class="equip-label" for="farmBillingCountry">
                  <span data-label-text>Pa\u00eds</span>
                  <span class="equip-required">*</span>
                </label>
                <select class="equip-input" id="farmBillingCountry" name="billing_country" data-country data-input required>
                  <option value="">Selecione o pa\u00eds</option>
                  <option value="BR">Brasil</option>
                  <option value="US">Estados Unidos</option>
                  <option value="DE">Alemanha</option>
                  <option value="ZA">\u00c1frica do Sul</option>
                </select>
              </div>

              <div class="equip-field farm-billing__field" data-field="postal" data-billing-details>
                <label class="equip-label" for="farmBillingPostal">
                  <span data-label-text>CEP</span>
                  <span class="equip-required">*</span>
                </label>
                <input class="equip-input" id="farmBillingPostal" name="billing_postal_code" data-input type="text" placeholder="00000-000" required />
              </div>

              <div class="equip-field farm-billing__field" data-field="city" data-billing-details>
                <label class="equip-label" for="farmBillingCity">
                  <span data-label-text>Cidade</span>
                  <span class="equip-required">*</span>
                </label>
                <input class="equip-input" id="farmBillingCity" name="billing_city" data-input type="text" placeholder="Ex: Goi\u00e2nia" required />
              </div>
            </div>

            <div class="farm-billing__details is-hidden" data-billing-details>
              <div class="equip-form farm-billing__grid farm-billing__grid--address">
                <div class="equip-field farm-billing__field farm-billing__field--span-2" data-field="address">
                  <label class="equip-label" for="farmBillingAddress">
                    <span data-label-text>Endere\u00e7o</span>
                    <span class="equip-required">*</span>
                  </label>
                  <input class="equip-input" id="farmBillingAddress" name="billing_address" data-input type="text" placeholder="Ex: Av. Brasil, 120" required />
                </div>

                <div class="equip-field farm-billing__field" data-field="region">
                  <label class="equip-label" for="farmBillingRegion">
                    <span data-label-text>Estado (UF)</span>
                    <span class="equip-required">*</span>
                  </label>
                  <input class="equip-input farm-billing__control" id="farmBillingRegion" name="billing_region" data-region-input type="text" placeholder="Ex: SP" />
                  <select class="equip-input farm-billing__control" id="farmBillingRegionSelect" name="billing_region_code" data-region-select></select>
                </div>

                <div class="equip-field farm-billing__field" data-field="neighborhood">
                  <label class="equip-label" for="farmBillingNeighborhood">
                    <span data-label-text>Bairro</span>
                  </label>
                  <input class="equip-input" id="farmBillingNeighborhood" name="billing_neighborhood" data-input type="text" placeholder="Opcional" />
                </div>
              </div>
            </div>
          </section>

          <section class="farm-billing__section farm-billing__details is-hidden" data-billing-details>
            <header class="farm-billing__section-head">
              <h4 class="farm-billing__section-title">Informa\u00e7\u00f5es de Faturamento</h4>
            </header>

            <div class="equip-form farm-billing__grid farm-billing__grid--billing-top">
              <div class="equip-field farm-billing__field farm-billing__field--span-2" data-field="docGroup">
                <label class="equip-label" for="farmBillingDocType">
                  <span data-label-text>Documento</span>
                  <span class="equip-required">*</span>
                </label>
                <div class="farm-billing__doc">
                  <select class="equip-input" id="farmBillingDocType" name="billing_document_type" data-doc-type aria-label="Tipo de documento" required></select>
                  <input class="equip-input" id="farmBillingDocNumber" name="billing_document_number" type="text" placeholder="000.000.000-00" aria-label="N\u00famero do documento" required />
                </div>
              </div>

              <div class="equip-field farm-billing__field" data-field="legalName">
                <label class="equip-label" for="farmBillingName">
                  <span data-label-text>Nome completo</span>
                  <span class="equip-required">*</span>
                </label>
                <input class="equip-input" id="farmBillingName" name="billing_legal_name" type="text" placeholder="Nome completo" required />
              </div>
            </div>

            <div class="equip-form farm-billing__grid farm-billing__grid--billing-bottom">
              <div class="equip-field farm-billing__field" data-field="phone">
                <label class="equip-label" for="farmBillingPhone">
                  <span data-label-text>Celular</span>
                  <span class="equip-required">*</span>
                </label>
                <input class="equip-input" id="farmBillingPhone" name="billing_phone" type="tel" placeholder="(00) 00000-0000" required />
              </div>

              <div class="equip-field farm-billing__field" data-field="email">
                <label class="equip-label" for="farmBillingEmail">
                  <span data-label-text>E-mail</span>
                  <span class="equip-required">*</span>
                </label>
                <input class="equip-input" id="farmBillingEmail" name="billing_email" type="email" placeholder="exemplo@mail.com.br" required />
              </div>
            </div>
          </section>
        </div>
      `;
      bindBillingForm(null, { applyState: true, syncState: true });
      return;
    }

    if (stepKey === "contact") {
      bodyHost.innerHTML = `
        <div class="farm-billing farm-contact" data-farm-contact>
          <section class="farm-billing__section">
            <header class="farm-billing__section-head">
              <h4 class="farm-billing__section-title">Endere\u00e7o de Contato</h4>
            </header>

            <div class="equip-form farm-billing__grid farm-billing__grid--country">
              <div class="equip-field farm-billing__field" data-field="country">
                <label class="equip-label" for="farmContactCountry">
                  <span data-label-text>Pa\u00eds</span>
                  <span class="equip-required">*</span>
                </label>
                <select class="equip-input" id="farmContactCountry" name="contact_country" data-country data-input required>
                  <option value="">Selecione o pa\u00eds</option>
                  <option value="BR">Brasil</option>
                  <option value="US">Estados Unidos</option>
                  <option value="DE">Alemanha</option>
                  <option value="ZA">\u00c1frica do Sul</option>
                </select>
              </div>

              <div class="equip-field farm-billing__field" data-field="postal" data-contact-details>
                <label class="equip-label" for="farmContactPostal">
                  <span data-label-text>CEP</span>
                  <span class="equip-required">*</span>
                </label>
                <input class="equip-input" id="farmContactPostal" name="contact_postal_code" data-input type="text" placeholder="00000-000" required />
              </div>

              <div class="equip-field farm-billing__field" data-field="city" data-contact-details>
                <label class="equip-label" for="farmContactCity">
                  <span data-label-text>Cidade</span>
                  <span class="equip-required">*</span>
                </label>
                <input class="equip-input" id="farmContactCity" name="contact_city" data-input type="text" placeholder="Ex: Goi\u00e2nia" required />
              </div>
            </div>

            <div class="farm-billing__details is-hidden" data-contact-details>
              <label class="farm-switch">
                <input class="farm-switch__input" type="checkbox" data-contact-same />
                <span class="farm-switch__track" aria-hidden="true"></span>
                <span class="farm-switch__label">Mesmo do endere\u00e7o de faturamento</span>
              </label>

              <div class="equip-form farm-billing__grid farm-billing__grid--address" data-contact-address>
                <div class="equip-field farm-billing__field farm-billing__field--span-2" data-field="address">
                  <label class="equip-label" for="farmContactAddress">
                    <span data-label-text>Endere\u00e7o</span>
                    <span class="equip-required">*</span>
                  </label>
                  <input class="equip-input" id="farmContactAddress" name="contact_address" data-input type="text" placeholder="Ex: Av. Brasil, 120" required />
                </div>

                <div class="equip-field farm-billing__field" data-field="region">
                  <label class="equip-label" for="farmContactRegion">
                    <span data-label-text>Estado (UF)</span>
                    <span class="equip-required">*</span>
                  </label>
                  <input class="equip-input farm-billing__control" id="farmContactRegion" name="contact_region" data-region-input type="text" placeholder="Ex: SP" />
                  <select class="equip-input farm-billing__control" id="farmContactRegionSelect" name="contact_region_code" data-region-select></select>
                </div>

                <div class="equip-field farm-billing__field" data-field="neighborhood">
                  <label class="equip-label" for="farmContactNeighborhood">
                    <span data-label-text>Bairro</span>
                  </label>
                  <input class="equip-input" id="farmContactNeighborhood" name="contact_neighborhood" data-input type="text" placeholder="Opcional" />
                </div>
              </div>
            </div>
          </section>

          <section class="farm-billing__section farm-billing__details is-hidden" data-contact-details>
            <header class="farm-billing__section-head">
              <h4 class="farm-billing__section-title">Informa\u00e7\u00f5es de Contato</h4>
            </header>

            <div class="equip-form farm-billing__grid">
              <div class="equip-field farm-billing__field" data-field="phone">
                <label class="equip-label" for="farmContactPhone">
                  <span data-label-text>Celular</span>
                  <span class="equip-required">*</span>
                </label>
                <input class="equip-input" id="farmContactPhone" name="contact_phone" type="tel" placeholder="+55 (00) 90000-0000" required />
              </div>
              <div class="equip-field farm-billing__field" data-field="email">
                <label class="equip-label" for="farmContactEmail">
                  <span data-label-text>E-mail</span>
                </label>
                <input class="equip-input" id="farmContactEmail" name="contact_email" type="email" placeholder="contato@email.com" />
              </div>
            </div>
          </section>
        </div>
      `;
      bindContactForm();
      return;
    }

    if (stepKey === "energy") {
      bodyHost.innerHTML = `
        <div class="farm-energy">
          <div class="farm-energy__note" role="note">
            Faixas de energia s\u00e3o per\u00edodos espec\u00edficos durante o dia nos quais o custo da energia el\u00e9trica pode variar. Voc\u00ea pode personalizar as faixas da sua fazenda no menu de configura\u00e7\u00f5es.
          </div>

          <p class="farm-energy__lead">
            Selecione o padr\u00e3o que melhor te atende baseado nas faixas de energia por hor\u00e1rio da sua regi\u00e3o
          </p>

          <div class="farm-energy__grid">
            <button class="farm-energy__card" type="button" data-energy-card aria-pressed="false">
              <span class="farm-energy__card-title">Ponta entre 17:00 e 20:00</span>
              <span class="farm-energy__card-desc">Define hor\u00e1rio de ponta entre 17:00 e 20:00 durante dias \u00fateis.</span>
            </button>

            <button class="farm-energy__card" type="button" data-energy-card aria-pressed="false">
              <span class="farm-energy__card-title">Ponta entre 18:00 e 21:00</span>
              <span class="farm-energy__card-desc">Define hor\u00e1rio de ponta entre 18:00 e 21:00 durante dias \u00fateis.</span>
            </button>

            <button class="farm-energy__card is-selected" type="button" data-energy-card aria-pressed="true">
              <span class="farm-energy__card-title">Personalizado</span>
              <span class="farm-energy__card-desc">Personalize mais tarde no menu de configura\u00e7\u00f5es da sua fazenda.</span>
            </button>
          </div>
        </div>
      `;
      bindEnergyStep();
      return;
    }

    if (stepKey === "location") {
      bodyHost.innerHTML = `
        <div class="farm-location">
          <div class="farm-location__row">
            <div class="equip-field farm-location__field">
              <label class="equip-label" for="farmLocationInput">
                <span>Localiza\u00e7\u00e3o da fazenda</span>
                <span class="equip-required">*</span>
              </label>
              <div class="farm-location__input">
                <span class="farm-location__icon" aria-hidden="true">
                  <i class="fa-solid fa-location-dot"></i>
                </span>
                <input
                  class="equip-input farm-location__input-field"
                  id="farmLocationInput"
                  name="farm_location"
                  type="text"
                  placeholder="-22.008419, -46.812567"
                  data-location-input
                  required
                />
              </div>
            </div>

            <button class="equip-btn equip-btn--primary farm-location__btn" type="button" data-location-btn>
              <i class="fa-solid fa-location-crosshairs" aria-hidden="true"></i>
              <span>Obter Localiza\u00e7\u00e3o</span>
            </button>
          </div>

          <div class="farm-location__radius">
            <div class="farm-location__radius-head">
              <span>Radio da central</span>
              <button class="farm-location__radius-edit" type="button" aria-label="Editar raio" data-radius-edit>
                <i class="fa-solid fa-pen"></i>
              </button>
            </div>
            <input
              class="equip-input"
              type="text"
              name="farm_radius"
              placeholder="0000000000000000"
              data-location-radius
            />
          </div>

          <div class="farm-location__map" data-location-map></div>
        </div>
      `;
      bindLocationStep();
      return;
    }

    renderPlaceholder(label);
  }

  function goNext() {
    if (currentStepIndex >= steps.length - 1) {
      addFarmFromWizard();
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
    farmState.name = "";
    farmState.loc = "";
    farmState.lat = -22.008419;
    farmState.lng = -46.812567;
    farmState.radius = "";
    currentStepIndex = 0;
    renderStepContent();
  }

  function closeModal() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("is-modal-open");
  }

  initFarmList();

  openBtn.addEventListener("click", openModal);
  closeTriggers.forEach((t) => t.addEventListener("click", closeModal));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("is-open")) closeModal();
  });

  nextBtn.addEventListener("click", goNext);
  if (prevBtn) prevBtn.addEventListener("click", goPrev);
})();
