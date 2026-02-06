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

  // =========================
  // Helpers
  // =========================
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

    renderCurrentStep();
  }

  function ensureDefaultSelection() {
    if (selectedType) return;
    if (!cards.length) return;
    setSelected(cards[0]);
  }

  function renderPlaceholder(label) {
    dynamicHost.innerHTML = `
      <div style="padding:14px;border:1px solid #e5e7eb;border-radius:12px;background:#fff;">
        <strong>${label}</strong><br/>
        <span style="color:#6b7280;">Tela ainda não implementada para este equipamento.</span>
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

    // Finalizar
    if (currentStepIndex >= steps.length - 1) {
      console.log("FINAL:", selectedType, stateByType[selectedType] || {});
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

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("is-modal-open");

    currentStepIndex = 0;
    renderCurrentStep();
  }

  function closeModal() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
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

