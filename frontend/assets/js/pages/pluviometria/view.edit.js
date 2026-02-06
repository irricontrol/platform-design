// assets/js/pages/pluviometria/view.edit.js
(function () {
  "use strict";

  const Plv = (window.Plv = window.Plv || {});
  const data = (Plv.data = Plv.data || {});
  const state = (Plv.state = Plv.state || {});
  const dom = (Plv.dom = Plv.dom || {});
  const views = (Plv.views = Plv.views || {});
  const edit = (views.edit = views.edit || {});
  const $ = dom.$ || ((id) => document.getElementById(id));
  const formatLatLng = dom.formatLatLng || ((lat, lng) => {
    if (lat == null || lng == null) return "—";
    const a = Number(lat);
    const b = Number(lng);
    if (Number.isNaN(a) || Number.isNaN(b)) return "—";
    return `${a.toFixed(6)}, ${b.toFixed(6)}`;
  });

  async function mountEditPanel() {
    const slot = $("pageSlot");
    if (!slot) return;

    const html = await fetch("./pages/pluviometria-edit.html").then((r) => r.text());
    slot.innerHTML = html;

    bindEditUI();
    initSettingsFocus();
    renderEditSelect();
    renderEditSummary();
    initEditMap();
  }

  async function showEditView(options = {}) {
    document.body.classList.add("is-pluviometria");
    document.body.classList.add("is-pluviometria-edit");
    document.body.classList.remove("pluv-settings-open");

    const mapCard = $("mapCard");
    if (mapCard) mapCard.style.display = "none";

    await mountEditPanel();
    syncFocusFromSelection();
    initSettingsFocus();
    renderEditSelect();
    renderEditSummary();
    updateEditMap();

    const map = window.icMap;
    if (map && typeof map.invalidateSize === "function") {
      map.invalidateSize({ pan: false });
      requestAnimationFrame(() => map.invalidateSize({ pan: false }));
      setTimeout(() => map.invalidateSize({ pan: false }), 180);
    }

    if (options.openSection) {
      requestAnimationFrame(() => openEditSection(options.openSection));
    }
  }

  function openEditSection(targetSelector) {
    if (!targetSelector) return;
    const configTab = document.querySelector(".pluv-edit__tab[data-tab=\"config\"]");
    configTab?.click();
    const nav = document.querySelector(`.pluv-edit__nav-item[data-target="${targetSelector}"]`);
    nav?.click();
  }

  function bindEditUI() {
    const back = $("pluvEditBack");
    if (back && !back.dataset.bound) {
      back.dataset.bound = "1";
      back.addEventListener("click", (e) => {
        e.preventDefault();
        Plv.views?.data?.showMainView?.();
      });
    }

    const centerBtn = $("pluvEditCenterBtn");
    if (centerBtn && !centerBtn.dataset.bound) {
      centerBtn.dataset.bound = "1";
      centerBtn.addEventListener("click", () => {
        if (state.editMap) {
          const p = getFocusPluvio();
          if (p) {
            const c = state.editMap.getCenter();
            p.lat = c.lat;
            p.lng = c.lng;
          }
        }
        renderEditLocation();
        updateEditMap();
      });
    }

    const pivotList = $("pluvEditPivotList");
    if (pivotList && !pivotList.dataset.bound) {
      pivotList.dataset.bound = "1";
      pivotList.addEventListener("change", (e) => {
        const input = e.target.closest("input[type='checkbox']");
        if (!input) return;
        const p = getFocusPluvio();
        if (!p) return;
        const value = input.value;
        const set = new Set(p.pivosAssoc || []);
        if (input.checked) set.add(value);
        else set.delete(value);
        p.pivosAssoc = Array.from(set);
      });
    }

    if (!document.body.dataset.editSelectBound) {
      document.body.dataset.editSelectBound = "1";
      document.addEventListener("click", (e) => {
        const pluvOption = e.target.closest("[data-pluv-option]");
        if (pluvOption) {
          const id = pluvOption.getAttribute("data-value");
          if (id) setSettingsFocus(id);
          closeCustomSelects();
          return;
        }

        const option = e.target.closest(".pluv-edit__select-option");
        if (option) {
          const menu = option.closest("[data-edit-menu]");
          const kind = menu?.getAttribute("data-edit-menu");
          const value = option.getAttribute("data-value");
          const p = getFocusPluvio();
          if (kind && value && p) {
            const conf = (data.EDIT_SELECTS || {})[kind];
            if (conf) p[conf.key] = value;
            renderEditGeneral();
          }
          closeCustomSelects();
          return;
        }

        const pluvTrigger = e.target.closest("[data-pluv-select-trigger]");
        if (pluvTrigger) {
          const wrap = pluvTrigger.closest("[data-pluv-select]");
          if (!wrap) return;
          const isOpen = wrap.classList.contains("is-open");
          closeCustomSelects();
          wrap.classList.toggle("is-open", !isOpen);
          pluvTrigger.setAttribute("aria-expanded", !isOpen ? "true" : "false");
          return;
        }

        const trigger = e.target.closest("[data-edit-select]");
        if (trigger) {
          const wrap = trigger.closest(".pluv-edit__select-field");
          if (!wrap) return;
          const isOpen = wrap.classList.contains("is-open");
          closeCustomSelects();
          wrap.classList.toggle("is-open", !isOpen);
          trigger.setAttribute("aria-expanded", !isOpen ? "true" : "false");
          return;
        }

        closeCustomSelects();
      });
    }

    document.querySelectorAll(".pluv-edit__tab").forEach((tab) => {
      if (tab.dataset.bound) return;
      tab.dataset.bound = "1";
      tab.addEventListener("click", () => {
        const target = tab.getAttribute("data-tab");
        if (!target) return;
        document.querySelectorAll(".pluv-edit__tab").forEach((btn) => {
          const active = btn === tab;
          btn.classList.toggle("is-active", active);
          btn.setAttribute("aria-selected", active ? "true" : "false");
        });
        document.querySelectorAll("[data-tab-body]").forEach((body) => {
          const active = body.getAttribute("data-tab-body") === target;
          body.classList.toggle("is-active", active);
        });
      });
    });

    document.querySelectorAll(".pluv-edit__nav-item").forEach((btn) => {
      if (btn.dataset.bound) return;
      btn.dataset.bound = "1";
      btn.addEventListener("click", () => {
        document.querySelectorAll(".pluv-edit__nav-item").forEach((item) => {
          item.classList.toggle("is-active", item === btn);
        });
        const target = btn.getAttribute("data-target");
        if (!target) return;
        document.querySelectorAll(".pluv-edit__section").forEach((section) => {
          const active = `#${section.id}` === target;
          section.classList.toggle("is-active", active);
        });
        const el = document.querySelector(target);
        el?.scrollIntoView({ behavior: "smooth", block: "start" });
        if (target === "#pluvEditLocation") {
          setTimeout(() => {
            state.editMap?.invalidateSize?.();
            updateEditMap();
          }, 60);
        }
      });
    });
  }

  function bindSettingsUI() {
    const editBtn = $("pluvEditBtn");
    if (editBtn && !editBtn.dataset.bound) {
      editBtn.dataset.bound = "1";
      editBtn.addEventListener("click", (e) => {
        e.preventDefault();
        showEditView();
      });
    }

    if (!state.settingsBound) {
      state.settingsBound = true;
      document.addEventListener("click", (e) => {
        const reminderOpt = e.target.closest("[data-reminder-option]");
        if (reminderOpt) {
          const value = Number(reminderOpt.getAttribute("data-reminder-option"));
          if (!Number.isNaN(value)) Plv.maintenance?.setReminderDays?.(value);
          Plv.maintenance?.closeReminderMenu?.();
          Plv.maintenance?.closeResponsibleMenu?.();
          return;
        }

        const responsibleOpt = e.target.closest("[data-responsible-option]");
        if (responsibleOpt) {
          const value = responsibleOpt.getAttribute("data-responsible-option");
          if (value) Plv.maintenance?.setMaintenanceResponsible?.(value);
          Plv.maintenance?.closeResponsibleMenu?.();
          Plv.maintenance?.closeMaintMenu?.();
          Plv.maintenance?.closeReminderMenu?.();
          return;
        }

        const reminderTrigger = e.target.closest("[data-reminder-trigger]");
        if (reminderTrigger) {
          const select = reminderTrigger.closest("[data-reminder-select]");
          Plv.maintenance?.toggleReminderMenu?.(select);
          return;
        }

        const responsibleTrigger = e.target.closest("[data-responsible-trigger]");
        if (responsibleTrigger) {
          const select = responsibleTrigger.closest("[data-responsible-select]");
          Plv.maintenance?.toggleResponsibleMenu?.(select);
          return;
        }

        const reminderToggle = e.target.closest("[data-reminder-toggle]");
        if (reminderToggle) {
          Plv.maintenance?.toggleReminderEnabled?.();
          return;
        }

        const opt = e.target.closest("[data-frequency-option]");
        if (opt) {
          Plv.maintenance?.setMaintenanceFrequency?.(opt.getAttribute("data-frequency-option"));
          Plv.maintenance?.closeMaintMenu?.();
          Plv.maintenance?.closeReminderMenu?.();
          Plv.maintenance?.closeResponsibleMenu?.();
          return;
        }

        const trigger = e.target.closest("[data-maint-trigger]");
        if (trigger) {
          const select = trigger.closest("[data-maint-frequency]");
          Plv.maintenance?.toggleMaintMenu?.(select);
          return;
        }

        if (e.target.closest(".pluv-maint__menu")) return;
        Plv.maintenance?.closeMaintMenu?.();
        Plv.maintenance?.closeReminderMenu?.();
        Plv.maintenance?.closeResponsibleMenu?.();
      });

      document.addEventListener("change", (e) => {
        const typeInput = e.target.closest("[data-maint-type]");
        if (typeInput) {
          const typeId = typeInput.getAttribute("data-maint-type");
          if (typeId) {
            if (typeInput.checked) state.maintenanceState.selectedTypes.add(typeId);
            else state.maintenanceState.selectedTypes.delete(typeId);
            Plv.maintenance?.renderMaintenance?.();
          }
          return;
        }
      });

      document.addEventListener("input", (e) => {
        const otherInput = e.target.closest("[data-maint-other]");
        if (otherInput) {
          state.maintenanceState.otherText = otherInput.value || "";
          Plv.maintenance?.syncMaintenanceSubmit?.();
          return;
        }

        const notesInput = e.target.closest("[data-maint-notes]");
        if (notesInput) {
          state.maintenanceState.notes = notesInput.value || "";
          return;
        }

        const respInput = e.target.closest("[data-maint-resp]");
        if (respInput) {
          state.maintenanceState.responsible = respInput.value || "";
          return;
        }

        const range = e.target.closest("[data-red-range]");
        if (!range) return;
        const p = getFocusPluvio();
        if (!p) return;
        if (range.disabled) return;
        const dataItem = (data.PLUV_REDUNDANCY || {})[p.id];
        if (!dataItem) return;
        const value = clampLimit(range.value);
        range.value = value;
        range.style.setProperty("--red-fill", `${value}%`);
        dataItem.limit = value;
        const wrap = range.closest(".pluv-red__slider");
        const valueEl = wrap?.querySelector("[data-red-value]");
        if (valueEl) valueEl.textContent = `${value}%`;
      });

      document.addEventListener("click", (e) => {
        const toggle = e.target.closest("[data-red-toggle]");
        if (!toggle) return;
        const p = getFocusPluvio();
        if (!p) return;
        const dataItem = (data.PLUV_REDUNDANCY || {})[p.id];
        if (!dataItem) return;
        const kind = toggle.getAttribute("data-red-toggle");
        if (kind === "alert") dataItem.alertAuto = !dataItem.alertAuto;
        // Bind do alerta -> habilita/desabilita o slider via re-render.
        renderRedundancy();
      });
    }
  }

  function syncFocusFromSelection() {
    if (state.selected.size === 1) {
      const id = Array.from(state.selected)[0];
      if (id) setSettingsFocus(id);
    }
  }

  function getFocusPluvio() {
    return (data.PLUVIOS || []).find((p) => p.id === state.settingsFocusId) || (data.PLUVIOS || [])[0];
  }

  function renderEditSelect() {
    const btn = $("pluvEditSelectBtn");
    const menu = $("pluvEditSelectMenu");
    if (!btn || !menu) return;

    const current = (data.PLUVIOS || []).find((p) => p.id === state.settingsFocusId) || (data.PLUVIOS || [])[0];
    const currentLabel = current ? `${current.nome} • ${current.sub}` : "Selecionar pluviômetro";
    btn.textContent = currentLabel;
    btn.dataset.value = current?.id || "";

    menu.innerHTML = (data.PLUVIOS || []).map((p) => {
      const label = `${p.nome} • ${p.sub}`;
      const isActive = current && p.id === current.id;
      return `
        <button class="pluv-edit__select-option ${isActive ? "is-active" : ""}" type="button" data-pluv-option data-value="${p.id}">
          ${label}
        </button>
      `;
    }).join("");
  }

  function renderEditLocation() {
    const p = getFocusPluvio();
    if (!p) return;

    const center = $("pluvEditCenter");
    if (center) center.value = formatLatLng(p.lat, p.lng);

    const list = $("pluvEditPivotList");
    if (!list) return;
    list.innerHTML = (data.PIVOS || []).map((pivot) => {
      const checked = (p.pivosAssoc || []).includes(pivot.id);
      return `
        <label class="pluv-edit__check">
          <input type="checkbox" value="${pivot.id}" ${checked ? "checked" : ""} />
          ${pivot.nome}
        </label>
      `;
    }).join("");
  }

  function initEditMap() {
    const container = $("pluvEditMap");
    if (!container || !window.L) return;
    if (state.editMap) {
      try { state.editMap.remove(); } catch (_) {}
      state.editMap = null;
      state.editMarker = null;
    }

    state.editMap = L.map(container, { zoomControl: true, attributionControl: false });
    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      { maxZoom: 19 }
    ).addTo(state.editMap);
    L.tileLayer(
      "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
      { maxZoom: 19, opacity: 0.85 }
    ).addTo(state.editMap);

    state.editMap.on("click", (e) => {
      const p = getFocusPluvio();
      if (!p || !e?.latlng) return;
      p.lat = e.latlng.lat;
      p.lng = e.latlng.lng;
      renderEditLocation();
      updateEditMap();
    });
  }

  function updateEditMap() {
    if (!state.editMap) return;
    const p = getFocusPluvio();
    if (!p) return;
    const lat = Number(p.lat);
    const lng = Number(p.lng);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return;

    state.editMap.setView([lat, lng], 16);
    if (!state.editMarker) {
      state.editMarker = L.marker([lat, lng]).addTo(state.editMap);
    } else {
      state.editMarker.setLatLng([lat, lng]);
    }
  }

  function renderCustomSelect(kind, value) {
    const conf = (data.EDIT_SELECTS || {})[kind];
    if (!conf) return;
    const btn = document.querySelector(`[data-edit-select="${kind}"]`);
    const menu = document.querySelector(`[data-edit-menu="${kind}"]`);
    if (!btn || !menu) return;

    const current = value || conf.options[0];
    btn.textContent = current;
    btn.dataset.value = current;
    menu.innerHTML = conf.options.map((opt) => `
      <button class="pluv-edit__select-option ${opt === current ? "is-active" : ""}" type="button" data-value="${opt}">
        ${opt}
      </button>
    `).join("");
  }

  function closeCustomSelects() {
    document.querySelectorAll(".pluv-edit__select-field").forEach((wrap) => {
      wrap.classList.remove("is-open");
      const btn = wrap.querySelector("[data-edit-select]");
      if (btn) btn.setAttribute("aria-expanded", "false");
      const pluvBtn = wrap.querySelector("[data-pluv-select-trigger]");
      if (pluvBtn) pluvBtn.setAttribute("aria-expanded", "false");
    });
  }

  function editStatusInfo(p) {
    if (!p) return { label: "—", cls: "" };
    if (p.semComunicacao) return { label: "Sem comunicação", cls: "pluv-edit__badge--danger" };
    if (p.status === "rain") return { label: "Operando", cls: "pluv-edit__badge--ok" };
    return { label: "Atenção", cls: "pluv-edit__badge--warn" };
  }

  function renderEditGeneral() {
    const p = getFocusPluvio();
    if (!p) return;

    const status = $("pluvEditStatus");
    if (status) {
      const info = editStatusInfo(p);
      status.className = `pluv-edit__badge ${info.cls}`;
      status.textContent = info.label;
    }

    const note = $("pluvEditLastUpdate");
    if (note) {
      const label = p.updated ? `Última comunicação: ${p.updated}` : "Última comunicação: —";
      note.textContent = label;
    }

    const name = $("pluvEditName");
    if (name) name.value = p.nome || "";

    const plot = $("pluvEditPlot");
    if (plot) plot.value = p.sub || "";

    const model = $("pluvEditModel");
    if (model) model.value = p.model || "";

    const network = $("pluvEditNetwork");
    if (network) network.value = p.net || "";

    const radioCentral = $("pluvEditRadioCentral");
    if (radioCentral) radioCentral.value = p.radioCentral || "";
    const radioControl = $("pluvEditRadioControl");
    if (radioControl) radioControl.value = p.radioControlador || "";
    const radioGps = $("pluvEditRadioGps");
    if (radioGps) radioGps.value = p.radioGps || "";

    renderCustomSelect("type", p.tipo || (data.EDIT_TYPES || [])[0]);
    renderCustomSelect("power", p.alimentacao || (data.EDIT_POWER || [])[0]);
    renderCustomSelect("unit", p.unidade || (data.EDIT_UNITS || [])[0]);

    const powerState = $("pluvEditPowerState");
    if (powerState) {
      const stateLabel = p.alimentacaoEstado || "—";
      powerState.textContent = `Estado: ${stateLabel}`;
    }

    const use = p.uso || {};
    const useIrr = $("pluvEditUseIrrigation");
    const useAlerts = $("pluvEditUseAlerts");
    const useReports = $("pluvEditUseReports");
    if (useIrr) useIrr.checked = !!use.irrigacao;
    if (useAlerts) useAlerts.checked = !!use.alertas;
    if (useReports) useReports.checked = !!use.relatorios;
  }

  function renderEditSummary() {
    renderEditGeneral();
    renderEditLocation();
  }

  function renderSensors() {
    const host = document.querySelector('[data-section-body="sensors"]');
    if (!host) return;

    const p = getFocusPluvio();
    const dataItem = (p && (data.PLUV_SENSORS || {})[p.id]) || (data.PLUV_SENSORS || {})["norte-a"];
    if (!dataItem) return;

    const min = Number(dataItem.thresholdMin);
    const mins = Number(dataItem.thresholdMinMinutes);

    host.innerHTML = `
      <div class="pluv-sensors">
        <div class="pluv-sensors__grid">
          <div class="pluv-sensors__field">
            <label>Modelo do Sensor</label>
            <input class="pluv-sensors__input" value="${dataItem.model}" />
          </div>
          <div class="pluv-sensors__field">
            <label>Valor por Pulso (mm)</label>
            <input class="pluv-sensors__input" value="${dataItem.pulse}" />
            <span class="pluv-sensors__hint">Até 3 casas decimais</span>
          </div>
        </div>

        <div class="pluv-sensors__divider"></div>

        <div class="pluv-sensors__section-title">Chuva Válida (threshold)</div>
        <div class="pluv-sensors__inline">
          <div class="pluv-sensors__field">
            <label>Mínimo (mm)</label>
            <input class="pluv-sensors__input" value="${min}" />
          </div>
          <span class="pluv-sensors__inline-text">em</span>
          <div class="pluv-sensors__field">
            <label>Tempo (min)</label>
            <input class="pluv-sensors__input" value="${mins}" />
          </div>
        </div>

        <div class="pluv-sensors__note">
          Considera chuva válida se &gt;${min}mm em ${mins} minutos
        </div>
      </div>
    `;
  }

  function clampLimit(value) {
    const n = Number(value);
    if (Number.isNaN(n)) return 10;
    return Math.min(99, Math.max(10, Math.round(n)));
  }

  function renderRedundancy() {
    const host = document.querySelector('[data-section-body="redundancy"]');
    if (!host) return;

    const p = getFocusPluvio();
    const dataItem = (p && (data.PLUV_REDUNDANCY || {})[p.id]) || (data.PLUV_REDUNDANCY || {})["norte-a"];
    if (!dataItem) return;

    const limit = clampLimit(dataItem.limit);
    // Toggle superior removido: alerta automático — o controle mestre da redundância.
    const isAlertOn = !!dataItem.alertAuto;
    const hintText = isAlertOn
      ? "Alertar quando a diferença entre sensores exceder este limite"
      : "Ative o alerta para definir o limite de divergência";
    const disabledClass = isAlertOn ? "" : "is-disabled";
    const disabledAttr = isAlertOn ? "" : "disabled";

    host.innerHTML = `
      <div class="pluv-red">
        <div class="pluv-red__row pluv-red__row--main">
          <div class="pluv-red__control ${disabledClass}">
            <div class="pluv-red__label">Limite de divergência</div>
            <div class="pluv-red__slider">
              <input type="range" min="0" max="100" step="1" value="${limit}" data-red-range style="--red-fill: ${limit}%;" ${disabledAttr} />
              <span class="pluv-red__value" data-red-value>${limit}%</span>
            </div>
            <div class="pluv-red__hint" data-red-hint>${hintText}</div>
          </div>

          <div class="pluv-red__alert">
            <div class="pluv-red__alert-left">
              <span class="pluv-red__alert-ico"><i class="fa-solid fa-triangle-exclamation"></i></span>
              <div>
                <div class="pluv-red__title">Alerta automático</div>
                <div class="pluv-red__sub">quando exceder o limite</div>
              </div>
            </div>
            <button class="pluv-switch ${isAlertOn ? "is-on" : ""}" type="button" data-red-toggle="alert" aria-pressed="${isAlertOn ? "true" : "false"}"></button>
          </div>
        </div>
      </div>
    `;
  }

  function setSettingsFocus(id) {
    state.settingsFocusId = id;
    Plv.maintenance?.renderMaintenance?.();
    renderSensors();
    renderRedundancy();
    renderEditSelect();
    renderEditSummary();
  }

  function initSettingsFocus() {
    if (!state.settingsFocusId) {
      state.settingsFocusId = (data.PLUVIOS || [])[0]?.id || null;
    }
    setSettingsFocus(state.settingsFocusId);
  }

  edit.mountEditPanel = mountEditPanel;
  edit.showEditView = showEditView;
  edit.openEditSection = openEditSection;
  edit.bindEditUI = bindEditUI;
  edit.bindSettingsUI = bindSettingsUI;
  edit.syncFocusFromSelection = syncFocusFromSelection;
  edit.getFocusPluvio = getFocusPluvio;
  edit.renderEditSelect = renderEditSelect;
  edit.renderEditLocation = renderEditLocation;
  edit.renderEditSummary = renderEditSummary;
  edit.renderEditGeneral = renderEditGeneral;
  edit.initEditMap = initEditMap;
  edit.updateEditMap = updateEditMap;
  edit.renderSensors = renderSensors;
  edit.renderRedundancy = renderRedundancy;
  edit.setSettingsFocus = setSettingsFocus;
  edit.initSettingsFocus = initSettingsFocus;
})();
