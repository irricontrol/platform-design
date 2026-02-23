// assets/js/pages/create-farm/feature.events.js
(function initCreateFarmEvents() {
  "use strict";

  const CreateFarm = (window.CreateFarm = window.CreateFarm || {});
  const state = CreateFarm.state || {};
  const helpers = CreateFarm.helpers || {};
  const rules = CreateFarm.rules || {};
  const setters = CreateFarm.setters || {};
  const view = CreateFarm.view || {};
  const render = view.render || {};
  const viewMap = view.map || {};
  const events = (CreateFarm.events = CreateFarm.events || {});

  const ACTIVE_FARM_STORAGE_KEY = "ic_active_farm";
  const MAP_CARD_ACTIVE_CLASS = "is-farm-active";

  function getSavedFarmId() {
    try {
      return localStorage.getItem(ACTIVE_FARM_STORAGE_KEY);
    } catch (err) {
      return null;
    }
  }

  function setMapCardActive(isActive) {
    const mapCard = document.getElementById("mapCard");
    if (!mapCard) return;
    mapCard.classList.toggle(MAP_CARD_ACTIVE_CLASS, !!isActive);
  }

  function setSavedFarmId(farmId) {
    try {
      if (farmId) localStorage.setItem(ACTIVE_FARM_STORAGE_KEY, farmId);
      else localStorage.removeItem(ACTIVE_FARM_STORAGE_KEY);
    } catch (err) {
      // ignore storage failures (private mode, blocked, etc.)
    }
  }

  function bindFarmSelectGlobalEvents() {
    if (state.farmSelectListenersBound) return;
    state.farmSelectListenersBound = true;
    document.addEventListener("click", (event) => {
      if (event.target.closest(".farm-select")) return;
      closeAllFarmSelects();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      closeAllFarmSelects();
    });
    window.addEventListener("resize", () => {
      state.farmSelectRegistry.forEach((select) => {
        if (select?._farmSelect?.wrapper.classList.contains("is-open")) {
          positionFarmSelectList(select);
        }
      });
    });
    if (state.modal && !state.modal._farmSelectScrollBound) {
      state.modal._farmSelectScrollBound = true;
      state.modal.addEventListener(
        "scroll",
        () => {
          closeAllFarmSelects();
        },
        true
      );
    }
  }

  function closeFarmSelect(select) {
    const data = select?._farmSelect;
    if (!data) return;
    data.wrapper.classList.remove("is-open");
    data.trigger.setAttribute("aria-expanded", "false");
  }

  function closeAllFarmSelects(except) {
    state.farmSelectRegistry.forEach((select) => {
      if (select === except) return;
      closeFarmSelect(select);
    });
  }

  function positionFarmSelectList(select) {
    const data = select?._farmSelect;
    if (!data) return;
    const rect = data.trigger.getBoundingClientRect();
    const margin = 12;
    const spacing = 6;
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const spaceBelow = viewportHeight - rect.bottom - margin;
    const spaceAbove = rect.top - margin;
    const openUp = spaceBelow < 160 && spaceAbove > spaceBelow;
    const maxHeight = Math.max(120, openUp ? spaceAbove : spaceBelow);
    const top = openUp
      ? Math.max(margin, rect.top - maxHeight - spacing)
      : rect.bottom + spacing;
    const width = Math.min(rect.width, viewportWidth - margin * 2);
    const left = Math.max(margin, Math.min(rect.left, viewportWidth - width - margin));
    data.list.style.left = `${left}px`;
    data.list.style.top = `${top}px`;
    data.list.style.width = `${width}px`;
    data.list.style.maxHeight = `${maxHeight}px`;
  }

  function syncFarmSelectDisabled(select) {
    const data = select?._farmSelect;
    if (!data) return;
    const disabled = !!select.disabled;
    data.wrapper.classList.toggle("is-disabled", disabled);
    data.trigger.disabled = disabled;
  }

  function syncFarmSelectHidden(select) {
    const data = select?._farmSelect;
    if (!data) return;
    const hidden = select.classList.contains("is-hidden");
    data.wrapper.classList.toggle("is-hidden", hidden);
    data.wrapper.setAttribute("aria-hidden", String(hidden));
  }

  function updateFarmSelectValue(select) {
    const data = select?._farmSelect;
    if (!data) return;
    const option = select.selectedOptions[0] || select.options[0];
    const value = option ? option.value : "";
    const label = option ? option.textContent : "";
    data.valueEl.textContent = label || "";
    data.valueEl.classList.toggle("is-placeholder", value === "");
    Array.from(data.list.children).forEach((btn) => {
      const isSelected = btn.dataset.value === value;
      btn.classList.toggle("is-selected", isSelected);
      btn.setAttribute("aria-selected", String(isSelected));
    });
  }

  function rebuildFarmSelectOptions(select) {
    const data = select?._farmSelect;
    if (!data) return;
    data.list.innerHTML = "";
    Array.from(select.options).forEach((option) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "farm-select__option";
      btn.dataset.value = option.value;
      btn.textContent = option.textContent;
      btn.setAttribute("role", "option");
      if (option.disabled) {
        btn.disabled = true;
        btn.setAttribute("aria-disabled", "true");
      }
      btn.addEventListener("click", () => {
        if (btn.disabled) return;
        select.value = option.value;
        select.dispatchEvent(new Event("change", { bubbles: true }));
        updateFarmSelectValue(select);
        closeFarmSelect(select);
        data.trigger.focus();
      });
      data.list.appendChild(btn);
    });
    updateFarmSelectValue(select);
  }

  function refreshFarmSelect(select) {
    if (!select?._farmSelect) return;
    rebuildFarmSelectOptions(select);
    syncFarmSelectDisabled(select);
    syncFarmSelectHidden(select);
  }

  function enhanceFarmSelect(select, root) {
    if (!select || select._farmSelect) return;
    const wrapper = document.createElement("div");
    wrapper.className = "farm-select";
    wrapper.dataset.farmSelect = "true";

    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "farm-select__trigger";
    trigger.setAttribute("aria-haspopup", "listbox");
    trigger.setAttribute("aria-expanded", "false");

    const valueEl = document.createElement("span");
    valueEl.className = "farm-select__value";
    const chev = document.createElement("i");
    chev.className = "fa-solid fa-chevron-down";
    trigger.append(valueEl, chev);

    const list = document.createElement("div");
    list.className = "farm-select__list";
    list.setAttribute("role", "listbox");
    const listId = select.id
      ? `${select.id}__list`
      : `farmSelectList_${Math.random().toString(36).slice(2)}`;
    list.id = listId;
    trigger.setAttribute("aria-controls", listId);

    select.classList.add("farm-select__native");
    select.setAttribute("aria-hidden", "true");
    select.tabIndex = -1;

    select.parentNode.insertBefore(wrapper, select);
    wrapper.append(trigger, list, select);

    select._farmSelect = { wrapper, trigger, valueEl, list };
    state.farmSelectRegistry.add(select);

    trigger.addEventListener("click", () => {
      if (select.disabled) return;
      const isOpen = wrapper.classList.contains("is-open");
      closeAllFarmSelects(select);
      if (isOpen) {
        closeFarmSelect(select);
      } else {
        positionFarmSelectList(select);
        wrapper.classList.add("is-open");
        trigger.setAttribute("aria-expanded", "true");
      }
    });

    select.addEventListener("change", () => updateFarmSelectValue(select));
    select.addEventListener("input", () => updateFarmSelectValue(select));

    if (select.id && root) {
      const escapeId = window.CSS && CSS.escape ? CSS.escape(select.id) : select.id;
      const label = root.querySelector(`label[for="${escapeId}"]`);
      if (label && !label.dataset.farmSelectBound) {
        label.dataset.farmSelectBound = "true";
        label.addEventListener("click", (event) => {
          event.preventDefault();
          if (select.disabled) return;
          closeAllFarmSelects(select);
          wrapper.classList.add("is-open");
          trigger.setAttribute("aria-expanded", "true");
          trigger.focus();
        });
      }
    }

    const observer = new MutationObserver((mutations) => {
      let needsRebuild = false;
      let needsSync = false;
      mutations.forEach((mutation) => {
        if (mutation.type === "childList") needsRebuild = true;
        if (mutation.type === "attributes") needsSync = true;
      });
      if (needsRebuild) rebuildFarmSelectOptions(select);
      if (needsRebuild || needsSync) {
        updateFarmSelectValue(select);
        syncFarmSelectDisabled(select);
        syncFarmSelectHidden(select);
      }
    });
    observer.observe(select, { childList: true, attributes: true, attributeFilter: ["disabled", "class"] });

    refreshFarmSelect(select);
  }

  function initFarmSelects(root) {
    if (!root) return;
    bindFarmSelectGlobalEvents();
    state.farmSelectRegistry.forEach((select) => {
      if (!document.contains(select)) state.farmSelectRegistry.delete(select);
    });
    root.querySelectorAll("select.equip-input").forEach((select) => {
      if (!root.closest("#createFarmModal") && !select.closest("#createFarmModal")) return;
      if (select._farmSelect) {
        refreshFarmSelect(select);
        return;
      }
      enhanceFarmSelect(select, root);
    });
  }

  const API_TOAST_MESSAGE = "Servidor local offline. Inicie o backend para salvar fazendas.";

  function getApiToast() {
    return document.getElementById("farmApiToast");
  }

  function showApiToast(message) {
    const toast = getApiToast();
    if (!toast) return;
    const text = toast.querySelector("[data-toast-text]");
    if (text && message) text.textContent = message;
    toast.classList.add("is-visible");
    toast.setAttribute("aria-hidden", "false");
  }

  function hideApiToast() {
    const toast = getApiToast();
    if (!toast) return;
    toast.classList.remove("is-visible");
    toast.setAttribute("aria-hidden", "true");
  }

  function loadFarms() {
    return fetch(rules.FARM_API_URL, { headers: { Accept: "application/json" } })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then((payload) => {
        const farms = Array.isArray(payload) ? payload : payload?.farms;
        state.farms = Array.isArray(farms) ? farms : [];
        try { localStorage.setItem("ic_farms", JSON.stringify(state.farms)); } catch (_) { }
        hideApiToast();
      })
      .catch((err) => {
        console.warn("[CreateFarm] Falha ao carregar fazendas da API.", err);
        try {
          const stored = JSON.parse(localStorage.getItem("ic_farms") || "[]");
          if (Array.isArray(stored) && stored.length > 0) {
            state.farms = stored;
            console.log("[CreateFarm] Usando backup local de fazendas.");
          } else {
            state.farms = [];
          }
        } catch (e) {
          state.farms = [];
        }
        showApiToast(API_TOAST_MESSAGE + (state.farms.length > 0 ? " (Modo Offline)" : ""));
      });
  }

  function saveFarms() {
    return fetch(rules.FARM_API_URL, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state.farms),
    })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json().catch(() => null);
      })
      .then((payload) => {
        const farms = Array.isArray(payload) ? payload : payload?.farms;
        if (Array.isArray(farms)) state.farms = farms;
        try { localStorage.setItem("ic_farms", JSON.stringify(state.farms)); } catch (_) { }
        hideApiToast();
      })
      .catch((err) => {
        console.warn("[CreateFarm] Falha ao salvar fazendas na API.", err);
        try { localStorage.setItem("ic_farms", JSON.stringify(state.farms)); } catch (_) { }
        showApiToast(API_TOAST_MESSAGE);
      });
  }

  function ensureDefaultFarm() {
    if (state.farms.length) return state.farms[0];
    const title = state.mapCardTitle?.textContent?.trim() || "Fazenda";
    let lat = -22.008419;
    let lng = -46.812567;
    if (window.icMap && typeof window.icMap.getCenter === "function") {
      const center = window.icMap.getCenter();
      if (center && Number.isFinite(center.lat) && Number.isFinite(center.lng)) {
        lat = center.lat;
        lng = center.lng;
      }
    }

    const farm = {
      id: `farm_${Date.now()}`,
      name: title,
      lat,
      lng,
      loc: state.farmState.loc || "",
      clientName: (state.farmState.clientName || state.farmBillingState.legalName || "").trim(),
      energyBillDay: state.farmState.energyBillDay || "",
      waterBillDay: state.farmState.waterBillDay || "",
      timezone: state.farmState.timezone || "",
      hasCentral: !!state.farmState.hasCentral,
      centralRadio: state.farmState.centralRadio || "",
    };

    state.farms.push(farm);
    saveFarms();
    viewMap.addFarmMarker?.(farm);
    state.currentFarmId = farm.id;
    setSavedFarmId(state.currentFarmId);
    setMapCardActive(true);
    setters.setActiveFarmSnapshot?.(farm);
    render.renderFarmList?.(state.farmSearchInput ? state.farmSearchInput.value : "");
    return farm;
  }

  function clearFarmSelection() {
    state.currentFarmId = null;
    setSavedFarmId(null);
    setMapCardActive(false);
    setters.clearActiveFarmSnapshot?.();
    if (state.farmSearchHost) state.farmSearchHost.classList.remove("has-selection");
    if (state.farmSearchInput) delete state.farmSearchInput.dataset.selected;
    render.updateActiveFarm?.();
    render.clearEquipmentPanels?.();
    window.IcMapClearPivots?.();
    viewMap.clearFarmMarkers?.();
  }

  function openFarmPanel() {
    if (!state.farmSearchPanel) return;
    state.farmSearchPanel.classList.add("is-open");
    state.farmSearchPanel.setAttribute("aria-hidden", "false");
    state.farmSearchPanel.removeAttribute("inert");
    if (state.farmSearchHost) state.farmSearchHost.classList.add("is-open");
  }

  function closeFarmPanel() {
    if (!state.farmSearchPanel) return;
    const activeEl = document.activeElement;
    if (activeEl && state.farmSearchPanel.contains(activeEl)) {
      if (state.farmSearchInput) {
        state.farmSearchInput.focus();
      } else if (typeof activeEl.blur === "function") {
        activeEl.blur();
      }
    }
    state.farmSearchPanel.classList.remove("is-open");
    state.farmSearchPanel.setAttribute("aria-hidden", "true");
    state.farmSearchPanel.setAttribute("inert", "");
    if (state.farmSearchHost) state.farmSearchHost.classList.remove("is-open");
  }

  function selectFarm(farmId) {
    const farm = state.farms.find((item) => item.id === farmId);
    if (!farm) return;
    state.currentFarmId = farmId;
    setSavedFarmId(farmId);
    setMapCardActive(true);
    setters.setActiveFarmSnapshot?.(farm);
    viewMap.clearFarmMarkers?.();
    viewMap.addFarmMarker?.(farm);
    if (window.icMap) {
      window.icMap.setView([farm.lat, farm.lng], 16);
    }
    // Sem popup do marcador da fazenda.
    if (state.mapCardTitle) state.mapCardTitle.textContent = farm.name;
    if (state.farmSearchInput) {
      state.farmSearchInput.value = farm.name;
      state.farmSearchInput.dataset.selected = farmId;
    }
    if (state.farmSearchHost) state.farmSearchHost.classList.add("has-selection");
    render.updateActiveFarm?.();
    viewMap.applyFarmGeo?.(farm);
    render.renderEquipmentPanels?.(farm);
    if (window.IcMapRenderPivots) window.IcMapRenderPivots(farm);
    closeFarmPanel();
  }

  function initFarmList() {
    if (!state.farmListHost && !window.icMap) return;
    loadFarms().then(() => {
      const savedFarmId = getSavedFarmId();
      const savedFarm = savedFarmId ? state.farms.find((item) => item.id === savedFarmId) : null;
      if (!state.currentFarmId && savedFarm) {
        render.renderFarmList?.(state.farmSearchInput ? state.farmSearchInput.value : "");
        selectFarm(savedFarm.id);
        return;
      }
      if (!state.currentFarmId) {
        render.clearEquipmentPanels?.();
        window.IcMapClearPivots?.();
        viewMap.clearFarmMarkers?.();
        setMapCardActive(false);
      }
      render.renderFarmList?.(state.farmSearchInput ? state.farmSearchInput.value : "");
    });

    if (state.farmSearchInput) {
      state.farmSearchInput.addEventListener("focus", () => {
        openFarmPanel();
        render.renderFarmList?.(state.farmSearchInput.value);
        state.farmSearchInput.select();
      });
      state.farmSearchInput.addEventListener("click", () => {
        openFarmPanel();
        render.renderFarmList?.(state.farmSearchInput.value);
        state.farmSearchInput.select();
      });
      state.farmSearchInput.addEventListener("input", (e) => {
        openFarmPanel();
        render.renderFarmList?.(e.target.value);
        clearFarmSelection();
      });
      state.farmSearchInput.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeFarmPanel();
      });
    }

    document.addEventListener("click", (e) => {
      if (!state.farmSearchHost) return;
      if (!state.farmSearchHost.contains(e.target)) closeFarmPanel();
    });
  }

  function addFarmFromWizard() {
    const name = (state.farmState.name || "").trim() || "Nova fazenda";
    const lat = Number(state.farmState.lat);
    const lng = Number(state.farmState.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    const farm = {
      id: `farm_${Date.now()}`,
      name,
      lat,
      lng,
      loc: state.farmState.loc || "",
      clientName: (state.farmState.clientName || state.farmBillingState.legalName || "").trim(),
      energyBillDay: state.farmState.energyBillDay || "",
      waterBillDay: state.farmState.waterBillDay || "",
      timezone: state.farmState.timezone || "",
      hasCentral: !!state.farmState.hasCentral,
      centralRadio: state.farmState.centralRadio || "",
    };

    state.farms.push(farm);
    saveFarms();
    viewMap.addFarmMarker?.(farm);
    render.renderFarmList?.(state.farmSearchInput ? state.farmSearchInput.value : "");
    selectFarm(farm.id);
  }

  function collectBillingState(root) {
    if (!root) return;
    const countrySelect = root.querySelector("[data-country]");
    state.farmBillingState.country = countrySelect?.value || state.farmBillingState.country || "";
    state.farmBillingState.postal = root.querySelector('[data-field="postal"] [data-input]')?.value || "";
    state.farmBillingState.city = root.querySelector('[data-field="city"] [data-input]')?.value || "";
    state.farmBillingState.address = root.querySelector('[data-field="address"] [data-input]')?.value || "";
    state.farmBillingState.neighborhood = root.querySelector('[data-field="neighborhood"] [data-input]')?.value || "";
    state.farmBillingState.region = root.querySelector("[data-region-input]")?.value || "";
    state.farmBillingState.regionCode = root.querySelector("[data-region-select]")?.value || "";
    state.farmBillingState.legalName = root.querySelector("#farmBillingName")?.value || "";
    state.farmBillingState.docType = root.querySelector("#farmBillingDocType")?.value || "";
    state.farmBillingState.docNumber = root.querySelector("#farmBillingDocNumber")?.value || "";
    state.farmBillingState.phone = root.querySelector("#farmBillingPhone")?.value || "";
    state.farmBillingState.email = root.querySelector("#farmBillingEmail")?.value || "";
    state.farmState.clientName = state.farmBillingState.legalName || state.farmState.clientName || "";
  }

  function applyBillingState(root) {
    if (!root) return;
    const countrySelect = root.querySelector("[data-country]");
    const country = state.farmBillingState.country || countrySelect?.value || "";
    if (countrySelect) {
      countrySelect.value = country;
      refreshFarmSelect(countrySelect);
    }
    if (!country) return;
    helpers.applyBillingRules?.(root, country);

    const setValue = (selector, value) => {
      const el = root.querySelector(selector);
      if (el) el.value = value || "";
    };

    setValue('[data-field="postal"] [data-input]', state.farmBillingState.postal);
    setValue('[data-field="city"] [data-input]', state.farmBillingState.city);
    setValue('[data-field="address"] [data-input]', state.farmBillingState.address);
    setValue('[data-field="neighborhood"] [data-input]', state.farmBillingState.neighborhood);
    setValue("#farmBillingName", state.farmBillingState.legalName);
    setValue("#farmBillingDocType", state.farmBillingState.docType);
    setValue("#farmBillingDocNumber", state.farmBillingState.docNumber);
    setValue("#farmBillingPhone", state.farmBillingState.phone);
    setValue("#farmBillingEmail", state.farmBillingState.email);

    const regionSelect = root.querySelector("[data-region-select]");
    const regionInput = root.querySelector("[data-region-input]");
    if (regionSelect && !regionSelect.classList.contains("is-hidden")) {
      regionSelect.value = state.farmBillingState.regionCode || state.farmBillingState.region || "";
      refreshFarmSelect(regionSelect);
    } else if (regionInput) {
      regionInput.value = state.farmBillingState.region || state.farmBillingState.regionCode || "";
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
    if (regionSelect) {
      regionSelect.value = "";
      refreshFarmSelect(regionSelect);
    }
    if (regionInput) regionInput.value = "";
  }

  function bindBillingForm(rootEl, options = {}) {
    const root = rootEl || state.bodyHost.querySelector("[data-farm-billing]");
    if (!root) return;
    const countrySelect = root.querySelector("[data-country]");
    const detailsBlocks = root.querySelectorAll("[data-billing-details]");
    if (!countrySelect) return;

    const setDetailsState = (show) => {
      root.classList.toggle("is-country-selected", show);
      detailsBlocks.forEach((block) => {
        helpers.setHidden(block, !show);
        block.querySelectorAll("input, select").forEach((el) => {
          el.disabled = !show;
        });
      });
    };

    const apply = () => {
      const hasCountry = !!countrySelect.value;
      setDetailsState(hasCountry);
      if (hasCountry) {
        helpers.applyBillingRules?.(root, countrySelect.value);
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
    const root = state.bodyHost.querySelector("[data-farm-contact]");
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
        helpers.setHidden(block, !show);
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
      state.farmContactState.useBillingAddress = toggle.checked;
      if (toggle.checked) {
        if (!countrySelect.value && state.farmBillingState.country) {
          countrySelect.value = state.farmBillingState.country;
          refreshFarmSelect(countrySelect);
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
        helpers.applyBillingRules?.(root, countrySelect.value);
      }
      if (toggle && toggle.checked) {
        applyUseBilling();
      }
    };

    if (toggle) {
      toggle.checked = state.farmContactState.useBillingAddress;
      toggle.addEventListener("change", applyUseBilling);
      applyUseBilling();
    }

    countrySelect.addEventListener("change", updateDetails);
    updateDetails();
  }

  function bindEnergyStep() {
    const cards = state.bodyHost.querySelectorAll("[data-energy-card]");
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
    const nameInput = state.bodyHost.querySelector("[data-farm-name]");
    const energyInput = state.bodyHost.querySelector("[data-farm-energy-day]");
    const waterInput = state.bodyHost.querySelector("[data-farm-water-day]");
    const timezoneSelect = state.bodyHost.querySelector("[data-farm-timezone]");
    const centralToggle = state.bodyHost.querySelector("[data-farm-has-central]");

    if (nameInput) {
      nameInput.value = state.farmState.name || "";
      nameInput.addEventListener("input", () => {
        state.farmState.name = nameInput.value;
      });
    }

    if (energyInput) {
      energyInput.value = state.farmState.energyBillDay || "";
      energyInput.addEventListener("input", () => {
        state.farmState.energyBillDay = energyInput.value;
      });
    }

    if (waterInput) {
      waterInput.value = state.farmState.waterBillDay || "";
      waterInput.addEventListener("input", () => {
        state.farmState.waterBillDay = waterInput.value;
      });
    }

    if (timezoneSelect) {
      timezoneSelect.value = state.farmState.timezone || timezoneSelect.value || "America/Sao_Paulo";
      state.farmState.timezone = timezoneSelect.value;
      timezoneSelect.addEventListener("change", () => {
        state.farmState.timezone = timezoneSelect.value;
      });
    }

    if (centralToggle) {
      centralToggle.checked = !!state.farmState.hasCentral;
      centralToggle.addEventListener("change", () => {
        state.farmState.hasCentral = centralToggle.checked;
      });
    }
  }

  function getPluvioCoords(data, farm) {
    const lat = helpers.toNumber?.(data?.lat);
    const lng = helpers.toNumber?.(data?.lng);
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
    const parsed = helpers.parseLatLngText?.(data?.loc);
    if (parsed) return parsed;
    if (farm && Number.isFinite(farm.lat) && Number.isFinite(farm.lng)) {
      return { lat: farm.lat, lng: farm.lng };
    }
    return null;
  }

  function addPluvioToPluviometria(equipItem, farm) {
    if (!equipItem || equipItem.type !== "pluviometro") return;
    const plvData = window.Plv?.data;
    if (!plvData) return;

    const list = Array.isArray(plvData.PLUVIOS) ? plvData.PLUVIOS : (plvData.PLUVIOS = []);
    const equipId = equipItem.id;
    const serial = equipItem.data?.serial || "";
    const exists = list.some((p) => p.sourceEquipId === equipId || p.id === equipId || (serial && p.serial === serial));
    if (exists) return;

    const coords = getPluvioCoords(equipItem.data || {}, farm);
    if (!coords) return;

    const name = equipItem.name || equipItem.data?.nome || "Pluviometro";
    const sub = equipItem.data?.sub || "Talhao nao informado";

    const pluvioId = equipId || `pluv_${Date.now()}`;

    list.push({
      id: pluvioId,
      sourceEquipId: equipId || null,
      serial,
      nome: name,
      sub,
      pivos: [],
      pivosAssoc: [],
      lat: coords.lat,
      lng: coords.lng,
      status: "none",
      statusLabel: "Sem chuva no momento",
      statusMeta: "sem dados",
      mm: 0,
      intensidade: "Sem chuva",
      intensidadeMeta: "",
      updated: "Recem cadastrado",
      unidade: "mm",
      uso: { irrigacao: false, alertas: false, relatorios: false },
      semComunicacao: false,
    });

    plvData.PLUV_SENSORS = plvData.PLUV_SENSORS || {};
    if (!plvData.PLUV_SENSORS[pluvioId]) {
      plvData.PLUV_SENSORS[pluvioId] = {
        model: "",
        pulse: "0.000",
        thresholdMin: 0,
        thresholdMinMinutes: 0,
      };
    }

    plvData.PLUV_REDUNDANCY = plvData.PLUV_REDUNDANCY || {};
    if (!plvData.PLUV_REDUNDANCY[pluvioId]) {
      plvData.PLUV_REDUNDANCY[pluvioId] = { limit: 10, alertAuto: false };
    }

    if (helpers.isPluviometriaActive?.()) {
      const plv = window.Plv;
      plv?.cards?.renderCards?.();
      plv?.cards?.syncSelectionUI?.();
      plv?.views?.map?.renderMarkers?.();
      plv?.views?.data?.renderData?.();
      plv?.maintenance?.renderMaintenanceCards?.();
      plv?.views?.edit?.renderEditSelect?.();
      plv?.views?.edit?.renderEditSummary?.();
    }
  }

  function addEquipmentToFarm(equipPayload) {
    if (!equipPayload) return;
    const farmId = equipPayload.farmId || state.currentFarmId || state.activeFarmSnapshot?.id;
    let farm = farmId ? state.farms.find((item) => item.id === farmId) : null;
    if (!farm) farm = ensureDefaultFarm();
    if (!farm) return;
    if (!state.currentFarmId) state.currentFarmId = farm.id;
    setSavedFarmId(state.currentFarmId);
    setMapCardActive(true);
    setters.setActiveFarmSnapshot?.(farm);

    const type = equipPayload.type;
    const category = rules.EQUIP_CATEGORY_BY_TYPE[type] || "outros";
    const baseLabel = rules.EQUIP_LABEL_BY_TYPE[type] || "Equipamento";
    const name = equipPayload.name || helpers.getNextNameForCategory(farm, category, baseLabel);

    const equipItem = {
      id: `equip_${Date.now()}`,
      type,
      category,
      name,
      createdAt: equipPayload.createdAt || new Date().toISOString(),
      data: helpers.sanitizeEquipmentData(equipPayload.data),
    };

    farm.equipments = farm.equipments || [];
    farm.equipments.push(equipItem);
    addPluvioToPluviometria(equipItem, farm);
    saveFarms();
    render.renderEquipmentPanels?.(farm);
    if (window.IcMapRenderPivots) window.IcMapRenderPivots(farm);
    if (state.mapCardTitle) state.mapCardTitle.textContent = farm.name;
  }

  function goNext() {
    if (state.currentStepIndex >= state.steps.length - 1) {
      addFarmFromWizard();
      closeModal();
      return;
    }
    state.currentStepIndex += 1;
    render.renderStepContent?.();
  }

  function goPrev() {
    if (state.currentStepIndex === 0) return;
    state.currentStepIndex -= 1;
    render.renderStepContent?.();
  }

  function openModal() {
    state.modal.classList.add("is-open");
    state.modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("is-modal-open");
    state.farmState.name = "";
    state.farmState.clientName = "";
    state.farmState.energyBillDay = "";
    state.farmState.waterBillDay = "";
    state.farmState.timezone = "America/Sao_Paulo";
    state.farmState.hasCentral = false;
    state.farmState.centralRadio = "";
    state.farmState.loc = "";
    state.farmState.lat = -22.008419;
    state.farmState.lng = -46.812567;
    state.farmState.radius = "";
    state.currentStepIndex = 0;
    render.renderStepContent?.();
  }

  function closeModal() {
    state.modal.classList.remove("is-open");
    state.modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("is-modal-open");
  }

  events.bindFarmSelectGlobalEvents = bindFarmSelectGlobalEvents;
  events.closeFarmSelect = closeFarmSelect;
  events.closeAllFarmSelects = closeAllFarmSelects;
  events.positionFarmSelectList = positionFarmSelectList;
  events.syncFarmSelectDisabled = syncFarmSelectDisabled;
  events.syncFarmSelectHidden = syncFarmSelectHidden;
  events.updateFarmSelectValue = updateFarmSelectValue;
  events.rebuildFarmSelectOptions = rebuildFarmSelectOptions;
  events.refreshFarmSelect = refreshFarmSelect;
  events.enhanceFarmSelect = enhanceFarmSelect;
  events.initFarmSelects = initFarmSelects;

  events.loadFarms = loadFarms;
  events.saveFarms = saveFarms;
  events.ensureDefaultFarm = ensureDefaultFarm;
  events.clearFarmSelection = clearFarmSelection;
  events.openFarmPanel = openFarmPanel;
  events.closeFarmPanel = closeFarmPanel;
  events.selectFarm = selectFarm;
  events.initFarmList = initFarmList;
  events.addFarmFromWizard = addFarmFromWizard;

  events.collectBillingState = collectBillingState;
  events.applyBillingState = applyBillingState;
  events.clearContactAddress = clearContactAddress;
  events.bindBillingForm = bindBillingForm;
  events.bindContactForm = bindContactForm;
  events.bindEnergyStep = bindEnergyStep;
  events.bindGeneralStep = bindGeneralStep;

  events.addEquipmentToFarm = addEquipmentToFarm;
  events.goNext = goNext;
  events.goPrev = goPrev;
  events.openModal = openModal;
  events.closeModal = closeModal;
})();
