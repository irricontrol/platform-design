// assets/js/pages/create-equipment.js
(function initCreateEquipment() {
  "use strict";

  // =========================
  // DOM refs
  // =========================
  const openBtn = document.getElementById("btnCreateEquipment");
  const modal = document.getElementById("createEquipmentModal");
  const nextBtn = document.getElementById("btnCreateEquipNext");
  const prevBtn = document.getElementById("btnCreateEquipPrev");
  const stepsContainer = document.getElementById("createEquipSteps");
  const footer = document.getElementById("createEquipFooter");

  if (!openBtn || !modal || !nextBtn || !stepsContainer) return;

  const closeTriggers = modal.querySelectorAll("[data-close-create]");
  const cards = Array.from(modal.querySelectorAll(".create-equip__card"));

  // =========================
  // Dynamic host (telas 2..N)
  // =========================
  let dynamicHost = modal.querySelector(".create-equip__dynamic");
  if (!dynamicHost) {
    dynamicHost = document.createElement("div");
    dynamicHost.className = "create-equip__dynamic";
    const grid = modal.querySelector(".create-equip__grid");
    grid?.after(dynamicHost);
  }

  // =========================
  // State
  // =========================
  let selectedType = null;
  let currentStepIndex = 0;
  let lastFocusBeforeOpen = null;

  const THREE_STEPS = ["Equipamento", "Localização", "Configuração"];
  const TWO_STEPS = ["Equipamento", "Configuração"];
  const SIX_STEPS = ["Equipamento", "Cadastro inicial", "Módulos", "Funções", "Vincular equipamento", "Resumo"];

  const stepFlows = {
    smart_connect: THREE_STEPS,
    smarttouch: THREE_STEPS,
    repetidora: THREE_STEPS,
    rainstar: TWO_STEPS,
    estacao_metereologica: TWO_STEPS,
    pluviometro: TWO_STEPS,
    irripump: SIX_STEPS,
    medidor: SIX_STEPS,
  };

  const stateByType = {};
  const equipSelectRegistry = new Set();
  let equipSelectListenersBound = false;

  // =========================
  // Helpers
  // =========================
  function bindEquipSelectGlobalEvents() {
    if (equipSelectListenersBound) return;
    equipSelectListenersBound = true;

    document.addEventListener("click", (event) => {
      if (event.target.closest(".equip-select")) return;
      closeAllEquipSelects();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      closeAllEquipSelects();
    });

    window.addEventListener("resize", () => {
      equipSelectRegistry.forEach((select) => {
        if (select?._equipSelect?.wrapper.classList.contains("is-open")) {
          positionEquipSelectList(select);
        }
      });
    });

    if (modal && !modal._equipSelectScrollBound) {
      modal._equipSelectScrollBound = true;
      modal.addEventListener(
        "scroll",
        () => {
          closeAllEquipSelects();
        },
        true
      );
    }
  }

  function closeEquipSelect(select) {
    const data = select?._equipSelect;
    if (!data) return;
    data.wrapper.classList.remove("is-open");
    data.trigger.setAttribute("aria-expanded", "false");
  }

  function closeAllEquipSelects(except) {
    equipSelectRegistry.forEach((select) => {
      if (select === except) return;
      closeEquipSelect(select);
    });
  }

  function positionEquipSelectList(select) {
    const data = select?._equipSelect;
    if (!data) return;
    const rect = data.trigger.getBoundingClientRect();
    const margin = 12;
    const spacing = 6;
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const spaceBelow = viewportHeight - rect.bottom - margin;
    const spaceAbove = rect.top - margin;
    const openUp = spaceBelow < 160 && spaceAbove > spaceBelow;
    const maxHeight = Math.max(160, openUp ? spaceAbove : spaceBelow);
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

  function syncEquipSelectDisabled(select) {
    const data = select?._equipSelect;
    if (!data) return;
    const disabled = !!select.disabled;
    data.wrapper.classList.toggle("is-disabled", disabled);
    data.trigger.disabled = disabled;
  }

  function updateEquipSelectValue(select) {
    const data = select?._equipSelect;
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

  function rebuildEquipSelectOptions(select) {
    const data = select?._equipSelect;
    if (!data) return;
    data.list.innerHTML = "";
    Array.from(select.options).forEach((option) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "equip-select__option";
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
        updateEquipSelectValue(select);
        closeEquipSelect(select);
        data.trigger.focus();
      });
      data.list.appendChild(btn);
    });
    updateEquipSelectValue(select);
  }

  function refreshEquipSelect(select) {
    if (!select?._equipSelect) return;
    rebuildEquipSelectOptions(select);
    syncEquipSelectDisabled(select);
  }

  function enhanceEquipSelect(select, root) {
    if (!select || select._equipSelect) return;
    const wrapper = document.createElement("div");
    wrapper.className = "equip-select";

    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "equip-select__trigger";
    trigger.setAttribute("aria-haspopup", "listbox");
    trigger.setAttribute("aria-expanded", "false");

    const valueEl = document.createElement("span");
    valueEl.className = "equip-select__value";
    const chev = document.createElement("i");
    chev.className = "fa-solid fa-chevron-down";
    trigger.append(valueEl, chev);

    const list = document.createElement("div");
    list.className = "equip-select__list";
    list.setAttribute("role", "listbox");
    const listId = select.id
      ? `${select.id}__list`
      : `equipSelectList_${Math.random().toString(36).slice(2)}`;
    list.id = listId;
    trigger.setAttribute("aria-controls", listId);

    select.classList.add("equip-select__native");
    select.setAttribute("aria-hidden", "true");
    select.tabIndex = -1;

    select.parentNode.insertBefore(wrapper, select);
    wrapper.append(trigger, list, select);

    select._equipSelect = { wrapper, trigger, valueEl, list };
    equipSelectRegistry.add(select);

    trigger.addEventListener("click", () => {
      if (select.disabled) return;
      const isOpen = wrapper.classList.contains("is-open");
      closeAllEquipSelects(select);
      if (isOpen) {
        closeEquipSelect(select);
      } else {
        positionEquipSelectList(select);
        wrapper.classList.add("is-open");
        trigger.setAttribute("aria-expanded", "true");
      }
    });

    select.addEventListener("change", () => updateEquipSelectValue(select));
    select.addEventListener("input", () => updateEquipSelectValue(select));

    if (select.id && root) {
      const escapeId = window.CSS && CSS.escape ? CSS.escape(select.id) : select.id;
      const label = root.querySelector(`label[for="${escapeId}"]`);
      if (label && !label.dataset.equipSelectBound) {
        label.dataset.equipSelectBound = "true";
        label.addEventListener("click", (event) => {
          event.preventDefault();
          if (select.disabled) return;
          closeAllEquipSelects(select);
          positionEquipSelectList(select);
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
      if (needsRebuild) rebuildEquipSelectOptions(select);
      if (needsRebuild || needsSync) {
        updateEquipSelectValue(select);
        syncEquipSelectDisabled(select);
      }
    });
    observer.observe(select, { childList: true, attributes: true, attributeFilter: ["disabled"] });

    refreshEquipSelect(select);
  }

  function initEquipSelects(root) {
    if (!modal) return;
    bindEquipSelectGlobalEvents();
    equipSelectRegistry.forEach((select) => {
      if (!document.contains(select)) equipSelectRegistry.delete(select);
    });
    const host = root || modal;
    host.querySelectorAll("select.equip-input").forEach((select) => {
      if (!select.closest("#createEquipmentModal")) return;
      if (select._equipSelect) {
        refreshEquipSelect(select);
        return;
      }
      enhanceEquipSelect(select, host);
    });
  }
  function getActiveFarmCoords() {
    const farm = window.IcFarmActive;
    if (!farm) return null;
    if (!Number.isFinite(farm.lat) || !Number.isFinite(farm.lng)) return null;
    return { lat: farm.lat, lng: farm.lng };
  }

  function formatLatLng(lat, lng) {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return "";
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }

  function applyFarmDefaults(type) {
    const farm = getActiveFarmCoords();
    if (!farm) return;
    const st = (stateByType[type] ||= {});

    if (type === "smart_connect") {
      const hasCenter =
        Number.isFinite(st.centerLat) && Number.isFinite(st.centerLng);
      if (!hasCenter && !st.center) {
        st.centerLat = farm.lat;
        st.centerLng = farm.lng;
        st.center = formatLatLng(farm.lat, farm.lng);
      }
      return;
    }

    if (type === "smarttouch") {
      const hasLoc = Number.isFinite(st.lat) && Number.isFinite(st.lng);
      if (!hasLoc && !st.loc) {
        st.lat = farm.lat;
        st.lng = farm.lng;
        st.loc = formatLatLng(farm.lat, farm.lng);
      }
      if (!Number.isFinite(st.radius)) {
        st.radius = 30;
      }
      return;
    }

    if (type === "repetidora") {
      const hasLoc = Number.isFinite(st.lat) && Number.isFinite(st.lng);
      if (!hasLoc && !st.loc) {
        st.lat = farm.lat;
        st.lng = farm.lng;
        st.loc = formatLatLng(farm.lat, farm.lng);
      }
      return;
    }

    if (type === "irripump" || type === "medidor") {
      const hasLoc = Number.isFinite(st.lat) && Number.isFinite(st.lng);
      if (!hasLoc && !st.loc) {
        st.lat = farm.lat;
        st.lng = farm.lng;
        st.loc = formatLatLng(farm.lat, farm.lng);
      }
    }
  }

  function getEquipmentName(type, data) {
    if (!data) return "";
    if (type === "smart_connect") return data.name || "";
    if (type === "smarttouch") return data.deviceName || "";
    if (type === "irripump") return data.nome || "";
    if (type === "medidor") return data.nome || "";
    if (type === "rainstar") return data.name || "";
    if (type === "repetidora") return data.name || "";
    if (type === "pluviometro") return data.name || "";
    if (type === "estacao_metereologica") return data.name || "";
    return data.name || "";
  }

  function getStepsFor(type) {
    return stepFlows[type] || THREE_STEPS;
  }

  function renderSteps(type) {
    const steps = getStepsFor(type);
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

  function showGrid(show) {
    const grid = modal.querySelector(".create-equip__grid");
    if (!grid) return;
    grid.style.display = show ? "" : "none";
  }

  function updateFooterLayout() {
    if (!prevBtn || !footer) return;

    const showPrev = currentStepIndex > 0;
    prevBtn.style.display = showPrev ? "" : "none";
    footer.classList.toggle("no-prev", !showPrev);
  }

  function setButtons() {
    const steps = getStepsFor(selectedType);
    const label = steps[currentStepIndex];
    const isLast = currentStepIndex === steps.length - 1;

    nextBtn.textContent = isLast ? "Finalizar" : "Próximo";

    // antes era Funções -> Resumo
    // agora Funções -> Vincular equipamento
    if (label === "Funções") nextBtn.textContent = "Avançar";
    if (label === "Vincular equipamento") nextBtn.textContent = "Avançar para Resumo";
  }

  function setSelected(card) {
    cards.forEach((c) => c.classList.remove("is-selected"));
    card.classList.add("is-selected");

    selectedType = card.dataset.equip || null;
    currentStepIndex = 0;
    if (selectedType) applyFarmDefaults(selectedType);

    renderCurrentStep();
  }

  function ensureDefaultSelection() {
    if (selectedType) return;
    if (!cards.length) return;
    setSelected(cards[0]);
  }

  function renderPlaceholder(label) {
    dynamicHost.innerHTML = `
      <div class="card create-equip__placeholder">
        <strong>${label}</strong><br/>
        <span class="create-equip__placeholder-muted">Tela ainda não implementada para este equipamento.</span>
      </div>
    `;
  }

  function renderCurrentStep() {
    ensureDefaultSelection();

    const steps = getStepsFor(selectedType);
    const label = steps[currentStepIndex];

    renderSteps(selectedType);
    setButtons();
    updateFooterLayout();

    // Step 1: grid de equipamentos
    if (label === "Equipamento") {
      showGrid(true);
      dynamicHost.style.display = "none";
      dynamicHost.innerHTML = "";
      return;
    }

    // Steps 2..N
    showGrid(false);
    dynamicHost.style.display = "";

    // placeholder padrão
    renderPlaceholder(label);

    // Delegação: Irripump + Medidor (6 steps)
    if (selectedType === "irripump" || selectedType === "medidor") {
      const handler = window.IcEquipamentos?.[selectedType];
      if (!handler) return;

      const st = (stateByType[selectedType] ||= {});

      if (label === "Cadastro inicial") handler.renderStep2(dynamicHost, st);
      else if (label === "Módulos") handler.renderStep3(dynamicHost, st);
      else if (label === "Funções") handler.renderStep4(dynamicHost, st);
      else if (label === "Vincular equipamento") handler.renderStep5(dynamicHost, st);
      else if (label === "Resumo") {
        if (typeof handler.renderStep6 === "function") handler.renderStep6(dynamicHost, st);
        else renderPlaceholder("Resumo");
      }
    }

    // SmartConnect/Nexus — Steps 2..3
    if (selectedType === "smart_connect") {
      const handler = window.IcEquipamentos?.smart_connect;
      if (!handler) return;
      const st = (stateByType[selectedType] ||= {});

      if (label === "Localiza\u00e7\u00e3o") handler.renderStep2(dynamicHost, st);
      else if (label === "Configura\u00e7\u00e3o" && typeof handler.renderStep3 === "function") {
        handler.renderStep3(dynamicHost, st);
      }
    }

    // SmartTouch — Step 2 (Localização)
    if (selectedType === "smarttouch" && label === "Localiza\u00e7\u00e3o") {
      const handler = window.IcEquipamentos?.smarttouch;
      if (!handler) return;
      const st = (stateByType[selectedType] ||= {});
      handler.renderStep2(dynamicHost, st);
    }

    // SmartTouch — Step 3 (Configuração)
    if (selectedType === "smarttouch" && label === "Configura\u00e7\u00e3o") {
      const handler = window.IcEquipamentos?.smarttouch;
      if (!handler || typeof handler.renderStep3 !== "function") return;
      const st = (stateByType[selectedType] ||= {});
      handler.renderStep3(dynamicHost, st);
    }

    // Carretel (Rainstar) — Step 2 (Configuração)
    if (selectedType === "rainstar" && label === "Configura\u00e7\u00e3o") {
      const handler = window.IcEquipamentos?.rainstar;
      if (!handler) return;
      const st = (stateByType[selectedType] ||= {});
      handler.renderStep2(dynamicHost, st);
    }

    // Repetidora — Step 2 (Localização)
    if (selectedType === "repetidora" && label === "Localiza\u00e7\u00e3o") {
      const handler = window.IcEquipamentos?.repetidora;
      if (!handler) return;
      const st = (stateByType[selectedType] ||= {});
      handler.renderStep2(dynamicHost, st);
    }

    // Repetidora — Step 3 (Configuração)
    if (selectedType === "repetidora" && label === "Configura\u00e7\u00e3o") {
      const handler = window.IcEquipamentos?.repetidora;
      if (!handler || typeof handler.renderStep3 !== "function") return;
      const st = (stateByType[selectedType] ||= {});
      handler.renderStep3(dynamicHost, st);
    }

    // Estação Meteorológica — Step 2 (Configuração)
    if (selectedType === "estacao_metereologica" && label === "Configura\u00e7\u00e3o") {
      const handler = window.IcEquipamentos?.estacao_metereologica;
      if (!handler) return;
      const st = (stateByType[selectedType] ||= {});
      handler.renderStep2(dynamicHost, st);
    }

    initEquipSelects(dynamicHost);
  }

  function goNext() {
    ensureDefaultSelection();

    const steps = getStepsFor(selectedType);
    const label = steps[currentStepIndex];

    // Validação Step 2 (Cadastro inicial) — Irripump + Medidor
    if ((selectedType === "irripump" || selectedType === "medidor") && label === "Cadastro inicial") {
      const handler = window.IcEquipamentos?.[selectedType];
      if (!handler) return;

      const st = (stateByType[selectedType] ||= {});
      const data = handler.readStep2(dynamicHost);
      const val = handler.validateStep2(data);

      if (!val.ok) {
        alert(val.msg);
        return;
      }

      Object.assign(st, data);
    }

    // Validação Step 2 (Localização) — SmartConnect/Nexus
    if (selectedType === "smart_connect" && label === "Localiza\u00e7\u00e3o") {
      const handler = window.IcEquipamentos?.smart_connect;
      if (!handler) return;

      const st = (stateByType[selectedType] ||= {});
      const data = handler.readStep2(dynamicHost);
      const val = handler.validateStep2 ? handler.validateStep2(data) : { ok: true, msg: "" };

      if (!val.ok) {
        alert(val.msg);
        return;
      }

      Object.assign(st, data);
    }

    // Validação Step 2 (Localização) — SmartTouch
    if (selectedType === "smarttouch" && label === "Localiza\u00e7\u00e3o") {
      const handler = window.IcEquipamentos?.smarttouch;
      if (!handler) return;

      const st = (stateByType[selectedType] ||= {});
      const data = handler.readStep2(dynamicHost);
      const val = handler.validateStep2 ? handler.validateStep2(data) : { ok: true, msg: "" };

      if (!val.ok) {
        alert(val.msg);
        return;
      }

      Object.assign(st, data);
    }

    // Validação Step 3 (Configuração) — SmartTouch
    if (selectedType === "smarttouch" && label === "Configura\u00e7\u00e3o") {
      const handler = window.IcEquipamentos?.smarttouch;
      if (!handler || typeof handler.readStep3 !== "function") return;

      const st = (stateByType[selectedType] ||= {});
      const data = handler.readStep3(dynamicHost);
      const val = handler.validateStep3 ? handler.validateStep3(data) : { ok: true };

      if (!val.ok) {
        st._errors = val.errors || {};
        handler.renderStep3(dynamicHost, st);
        return;
      }

      st._errors = {};
      Object.assign(st, data);
    }

    // Validação Step 2 (Configuração) — Carretel (Rainstar)
    if (selectedType === "rainstar" && label === "Configura\u00e7\u00e3o") {
      const handler = window.IcEquipamentos?.rainstar;
      if (!handler || typeof handler.readStep2 !== "function") return;

      const st = (stateByType[selectedType] ||= {});
      const data = handler.readStep2(dynamicHost);
      const val = handler.validateStep2 ? handler.validateStep2(data) : { ok: true };

      if (!val.ok) {
        st._errors = val.errors || {};
        handler.renderStep2(dynamicHost, st);
        return;
      }

      st._errors = {};
      Object.assign(st, data);
    }

    // Validação Step 2 (Localização) — Repetidora
    if (selectedType === "repetidora" && label === "Localiza\u00e7\u00e3o") {
      const handler = window.IcEquipamentos?.repetidora;
      if (!handler) return;

      const st = (stateByType[selectedType] ||= {});
      const data = handler.readStep2(dynamicHost);
      const val = handler.validateStep2 ? handler.validateStep2(data) : { ok: true, msg: "" };

      if (!val.ok) {
        alert(val.msg);
        return;
      }

      Object.assign(st, data);
    }

    // Validação Step 3 (Configuração) — Repetidora
    if (selectedType === "repetidora" && label === "Configura\u00e7\u00e3o") {
      const handler = window.IcEquipamentos?.repetidora;
      if (!handler || typeof handler.readStep3 !== "function") return;

      const st = (stateByType[selectedType] ||= {});
      const data = handler.readStep3(dynamicHost);
      const val = handler.validateStep3 ? handler.validateStep3(data) : { ok: true };

      if (!val.ok) {
        st._errors = val.errors || {};
        handler.renderStep3(dynamicHost, st);
        return;
      }

      st._errors = {};
      Object.assign(st, data);
    }

    // Validação Step 2 (Configuração) — Estação Meteorológica
    if (selectedType === "estacao_metereologica" && label === "Configura\u00e7\u00e3o") {
      const handler = window.IcEquipamentos?.estacao_metereologica;
      if (!handler || typeof handler.readStep2 !== "function") return;

      const st = (stateByType[selectedType] ||= {});
      const data = handler.readStep2(dynamicHost);
      const val = handler.validateStep2 ? handler.validateStep2(data) : { ok: true };

      if (!val.ok) {
        st._errors = val.errors || {};
        handler.renderStep2(dynamicHost, st);
        return;
      }

      st._errors = {};
      Object.assign(st, data);
    }

    // Validação Step 3 (Configuração) — SmartConnect/Nexus
    if (selectedType === "smart_connect" && label === "Configura\u00e7\u00e3o") {
      const handler = window.IcEquipamentos?.smart_connect;
      if (!handler || typeof handler.readStep3 !== "function") return;

      const st = (stateByType[selectedType] ||= {});
      const data = handler.readStep3(dynamicHost);
      const val = handler.validateStep3 ? handler.validateStep3(data, st) : { ok: true };

      if (!val.ok) {
        st._errors = val.errors || {};
        handler.renderStep3(dynamicHost, st);
        return;
      }

      st._errors = {};
      Object.assign(st, data);
    }

    // Finalizar
    if (currentStepIndex >= steps.length - 1) {
      const data = stateByType[selectedType] || {};
      const equip = {
        type: selectedType,
        name: getEquipmentName(selectedType, data),
        createdAt: new Date().toISOString(),
        data,
      };
      if (window.IcFarmsAddEquipment) window.IcFarmsAddEquipment(equip);
      closeModal();
      return;
    }

    currentStepIndex++;
    renderCurrentStep();
  }

  function goPrev() {
    if (currentStepIndex === 0) return;
    currentStepIndex--;
    renderCurrentStep();
  }

  function openModal() {
    ensureDefaultSelection();

    lastFocusBeforeOpen = document.activeElement;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    modal.removeAttribute("inert");
    document.body.classList.add("is-modal-open");

    currentStepIndex = 0;
    if (selectedType) applyFarmDefaults(selectedType);
    renderCurrentStep();
  }

  function closeModal() {
    const activeEl = document.activeElement;
    if (activeEl && modal.contains(activeEl)) {
      if (openBtn && typeof openBtn.focus === "function") {
        openBtn.focus();
      } else if (lastFocusBeforeOpen && document.contains(lastFocusBeforeOpen)) {
        lastFocusBeforeOpen.focus();
      } else if (typeof activeEl.blur === "function") {
        activeEl.blur();
      }
    }
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    modal.setAttribute("inert", "");
    document.body.classList.remove("is-modal-open");
  }

  // =========================
  // Eventos base
  // =========================
  openBtn.addEventListener("click", openModal);
  closeTriggers.forEach((t) => t.addEventListener("click", closeModal));

  modal.addEventListener("click", (e) => {
    const card = e.target.closest(".create-equip__card");
    if (card && currentStepIndex === 0) setSelected(card);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("is-open")) closeModal();
  });

  nextBtn.addEventListener("click", goNext);
  if (prevBtn) prevBtn.addEventListener("click", goPrev);

  window.IcEquipSelectInit = initEquipSelects;

  // =========================
  // Step 4 — Funções (fallback global)
  // OBS: seus handlers já tratam onchange internamente,
  // mas manter isso não muda lógica e ajuda caso você remova de lá depois.
  // =========================
  modal.addEventListener("change", (e) => {
    const el = e.target;
    if (!(el instanceof Element)) return;

    const action = el.getAttribute("data-action");
    if (!action) return;

    if (selectedType !== "irripump" && selectedType !== "medidor") return;

    const handler = window.IcEquipamentos?.[selectedType];
    if (!handler) return;

    const st = (stateByType[selectedType] ||= {});
    st.funcs = st.funcs || {};
    st.funcParams = st.funcParams || {};

    if (action === "func-toggle") {
      const key = el.getAttribute("data-key");
      const checked = el.checked === true;

      st.funcs[key] = checked;
      if (!checked) st.funcParams[key] = "";

      handler.renderStep4(dynamicHost, st);
      return;
    }

    if (action === "func-select") {
      const key = el.getAttribute("data-key");
      st.funcParams[key] = el.value || "";
    }
  });

  // =========================
  // Botões do Step 4 (Excluir módulo) — genérico
  // =========================
  modal.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;

    if (selectedType !== "irripump" && selectedType !== "medidor") return;

    const handler = window.IcEquipamentos?.[selectedType];
    if (!handler) return;

    const st = (stateByType[selectedType] ||= {});

    // Irripump usa ip-mod-del-first; Medidor usa md-mod-del-first (se você seguiu o padrão que te mandei)
    if (btn.dataset.action === "ip-mod-del-first" || btn.dataset.action === "md-mod-del-first") {
      st.modules = (st.modules || []).slice(1);
      st.funcs = {};
      st.funcParams = {};
      handler.renderStep4(dynamicHost, st);
    }
  });
})();

