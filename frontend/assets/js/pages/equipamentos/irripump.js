// assets/js/pages/equipamentos/irripump.js
(function () {
  "use strict";

  // Namespace global (mantém compatível com teu wizard)
  window.IcEquipamentos = window.IcEquipamentos || {};

  // =========================
  // Helpers (sem mudar lógica)
  // =========================
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

  // Mantido igual (mesma lógica), mesmo que nem sempre seja usado
  function uid() {
    return Math.random().toString(16).slice(2, 10);
  }

  // =========================
  // Configuração das funções
  // =========================
  const FUNCS = [
    {
      key: "automacao",
      title: "Automação",
      icon: "fa-gears",
      selectLabel: "Tipo de Automação",
      options: ["Bomba de Superfície", "Bomba Submersa"],
    },
    {
      key: "vazao",
      title: "Medição de Vazão",
      icon: "fa-gauge-high",
      selectLabel: "Tipo de Medição de Vazão",
      options: ["Hidrômetro", "Medidor Eletrônico"],
    },
    {
      key: "nivel",
      title: "Medição de Nível",
      icon: "fa-water",
      selectLabel: "Tipo de Medição de Nível",
      options: ["Poço", "Reservatório", "Rio"],
    },
    {
      key: "corrente_tensao",
      title: "Medição de Corrente e Tensão",
      icon: "fa-bolt",
      selectLabel: "Tipo de Medição de Corrente e Tensão",
      options: ["Digital Soft Starter", "Digital Inversora", "Sensores Analógicos"],
    },
  ];

  // =========================
  // Implementação do Irripump
  // =========================
  window.IcEquipamentos.irripump = {
    label: "Irripump",

    // =================
    // STEP 2
    // =================
    renderStep2(container, state) {
      const serial = state.serial ?? "";
      const nome = state.nome ?? "";
      const loc = state.loc ?? "";

      container.innerHTML = `
        <div class="equip-page">
          <div class="equip-page__title"></div>
          <div class="equip-page__sub"></div>

          <div class="equip-form">
            <div class="equip-form__row">
              <div class="equip-field">
                <label class="equip-label"><span class="equip-required">*</span> ID / Serial Number</label>
                <input class="equip-input" id="ipSerial" placeholder="Ex: GH2-001234" value="${escapeHtml(serial)}" />
              </div>
              <button class="equip-btn equip-btn--primary" type="button" data-action="ip-test">Tentar Conexão</button>
            </div>

            <div class="equip-field">
              <label class="equip-label"><span class="equip-required">*</span> Nome do Equipamento</label>
              <input class="equip-input" id="ipNome" placeholder="Ex: Bomba Principal, Poço 01" value="${escapeHtml(nome)}" />
            </div>

            <div class="equip-field">
              <label class="equip-label"><span class="equip-required">*</span> Localização (Latitude, Longitude)</label>
              <input class="equip-input" id="ipLoc" placeholder="Ex: -23.5505, -46.6333" value="${escapeHtml(loc)}" />
              <div class="equip-hint">Você pode clicar no mapa pra preencher automaticamente.</div>
            </div>

            <!-- MAPA REAL AQUI -->
            <div id="ipMiniMap" class="equip-mini-map"></div>
            <div class="equip-mini-map__hint"></div>
          </div>
        </div>
      `;

      // Mantém a mesma lógica: inicializa Leaflet após injetar HTML
      this.initMiniMap(container, state);
    },

    initMiniMap(container, state) {
      // Leaflet precisa existir (mesma regra)
      if (!window.L) return;

      const mapEl = container.querySelector("#ipMiniMap");
      const inputLoc = container.querySelector("#ipLoc");
      if (!mapEl || !inputLoc) return;

      // Se já existe mapa anterior (re-render), destrói pra não bugar (mesma lógica)
      if (state._miniMap) {
        try {
          state._miniMap.remove();
        } catch (e) {
          // sem log pra não poluir
        }
        state._miniMap = null;
      }

      // Centro default (mesmo)
      let center = [-16.767, -47.613];
      let zoom = 16;

      // Se já tem coordenadas no estado, usa elas (mesmo)
      if (typeof state.lat === "number" && typeof state.lng === "number") {
        center = [state.lat, state.lng];
        zoom = 17;
      }

      // Cria mapa (mesmo)
      const miniMap = L.map(mapEl, { zoomControl: true }).setView(center, zoom);

      // Base satélite (mesmo)
      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        { maxZoom: 19, attribution: "Tiles © Esri" }
      ).addTo(miniMap);

      // Labels (opcional) (mesmo)
      L.tileLayer(
        "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
        { maxZoom: 19, opacity: 0.85 }
      ).addTo(miniMap);

      // Marker (mesmo)
      const marker = L.marker(center).addTo(miniMap);

      // Clique no mapa -> atualiza marker + input + state (mesmo)
      miniMap.on("click", (e) => {
        const { lat, lng } = e.latlng;

        marker.setLatLng([lat, lng]);

        const txt = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        inputLoc.value = txt;

        state.loc = txt;
        state.lat = lat;
        state.lng = lng;
      });

      // Guarda no state pra controlar re-render (mesmo)
      state._miniMap = miniMap;

      // Correção de render no modal/aba (mesmo)
      setTimeout(() => miniMap.invalidateSize(), 120);
    },

    // ✅ Mantido: wizard chama isso antes do Step 3
    readStep2(container) {
      const serial = container.querySelector("#ipSerial")?.value?.trim() || "";
      const nome = container.querySelector("#ipNome")?.value?.trim() || "";
      const loc = container.querySelector("#ipLoc")?.value?.trim() || "";

      const parsed = parseLatLng(loc);

      return {
        serial,
        nome,
        loc,
        lat: parsed?.lat ?? null,
        lng: parsed?.lng ?? null,
      };
    },

    // ✅ Mantido: validação do Step 2
    validateStep2(data) {
      if (!data.serial) return { ok: false, msg: "Informe o ID / Serial Number." };
      if (!data.nome) return { ok: false, msg: "Informe o Nome do Equipamento." };

      if (data.lat === null || data.lng === null) {
        return {
          ok: false,
          msg: "Informe uma Localização válida (Latitude, Longitude) ou clique no mapa.",
        };
      }

      return { ok: true, msg: "" };
    },

    // =================
    // STEP 3
    // =================
    renderStep3(container, state) {
      state.modules = state.modules || [
        { id: "m1", name: "Módulo 1", serial: "GH2-01-01-01", source: "Manual" },
      ];

      const cards = state.modules
        .map(
          (m) => `
            <div class="ip-mod-card">
              <div class="ip-mod-card__top">
                <span class="ip-mod-badge">${escapeHtml(m.source)}</span>
                <button
                  class="ip-mod-del"
                  type="button"
                  data-action="ip-mod-del"
                  data-id="${escapeHtml(m.id)}"
                  aria-label="Excluir módulo"
                >
                  <i class="fa-solid fa-trash"></i>
                </button>
              </div>
              <div class="ip-mod-name">${escapeHtml(m.name)}</div>
              <div class="ip-mod-serial">Serial: ${escapeHtml(m.serial)}</div>
            </div>
          `
        )
        .join("");

      container.innerHTML = `
        <div class="ip-step">
          <div class="ip-step__row">
            <div>
              <div class="ip-step__title">Descoberta de Módulos</div>
              <div class="ip-step__sub">Adicione os módulos manualmente</div>
            </div>

            <button class="equip-btn equip-btn--primary" type="button" data-action="ip-mod-open">
              <i class="fa-solid fa-plus"></i> Adicionar Módulo
            </button>
          </div>

          <div class="ip-mod-zone">
            ${cards || `<div class="ip-empty">Nenhum módulo cadastrado.</div>`}
          </div>
        </div>

        <!-- MODAL: adicionar módulo (dentro do card) -->
        <div class="ip-modal" data-ip-modal aria-hidden="true">
          <div class="ip-modal__backdrop" data-ip-close></div>
          <div class="ip-modal__dialog" role="dialog" aria-modal="true" aria-label="Adicionar Módulo
          
          ">
            <div class="ip-modal__head">
              <div class="ip-modal__title">Adicionar Módulo</div>
              <button class="ip-modal__x" type="button" data-ip-close aria-label="Fechar">
                <i class="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div class="ip-modal__body">
              <label class="equip-label"><span class="equip-required">*</span> Serial do Módulo</label>
              <input class="equip-input" id="ipModSerial" placeholder="Ex: GH2-001A-M01" />
            </div>

            <div class="ip-modal__foot">
              <button class="create-equip__btn create-equip__btn--ghost" type="button" data-ip-close>Cancelar</button>
              <button class="create-equip__btn create-equip__btn--primary" type="button" data-action="ip-mod-add">Adicionar</button>
            </div>
          </div>
        </div>
      `;

      // IMPORTANTE: mantém onclick (substitui sempre) pra não duplicar listeners (mesma lógica)
      container.onclick = (e) => {
        const btn = e.target.closest("[data-action], [data-ip-close]");
        if (!btn) return;

        const modalEl = container.querySelector("[data-ip-modal]");
        const serialInput = container.querySelector("#ipModSerial");
        if (!modalEl) return;

        // ABRIR MODAL
        if (btn.dataset.action === "ip-mod-open") {
          modalEl.classList.add("is-open");
          modalEl.setAttribute("aria-hidden", "false");

          if (serialInput) {
            serialInput.value = "";
            serialInput.focus();
          }
          return;
        }

        // FECHAR MODAL (X / backdrop / Cancelar)
        if (btn.hasAttribute("data-ip-close")) {
          modalEl.classList.remove("is-open");
          modalEl.setAttribute("aria-hidden", "true");
          return;
        }

        // ADICIONAR MÓDULO
        if (btn.dataset.action === "ip-mod-add") {
          const serial = (serialInput?.value || "").trim();
          if (!serial) {
            alert("Informe o serial do módulo.");
            return;
          }

          // Mantém o mesmo gerador de id (não troca por uid pra não “mudar nada”)
          const id = Math.random().toString(16).slice(2, 10);

          state.modules = state.modules || [];
          state.modules.push({
            id,
            name: `Módulo ${state.modules.length + 1}`,
            serial,
            source: "Manual",
          });

          // fecha modal
          modalEl.classList.remove("is-open");
          modalEl.setAttribute("aria-hidden", "true");

          // re-render step 3
          this.renderStep3(container, state);
          return;
        }

        // EXCLUIR MÓDULO
        if (btn.dataset.action === "ip-mod-del") {
          const id = btn.dataset.id;
          state.modules = (state.modules || []).filter((m) => m.id !== id);
          this.renderStep3(container, state);
        }
      };
    },

    // =================
    // STEP 4
    // =================
    renderStep4(container, state) {
      const mod =
        (state.modules && state.modules[0]) || {
          name: "Módulo 1",
          serial: "—",
          source: "Manual",
        };

      state.funcs = state.funcs || {};
      state.funcParams = state.funcParams || {};

    const rows = FUNCS.map((f) => {
      const checked = !!state.funcs[f.key];
      const selected = state.funcParams[f.key] || "";
      const pending = checked && !selected;

      const rowClass = [
        "func-row",
        checked ? "is-active" : "is-inactive",
        pending ? "is-pending" : "",
      ]
        .filter(Boolean)
        .join(" ");

      const options = f.options
        .map((opt) => {
          const val = escapeHtml(opt);
          const isSelected = selected === opt ? "is-selected" : "";
          return `<button type="button" class="func-select__option ${isSelected}" data-action="func-select-option" data-key="${escapeHtml(
            f.key
          )}" data-value="${val}">${val}</button>`;
        })
        .join("");

      return `
        <div class="${rowClass}" data-func="${escapeHtml(f.key)}">
          <label class="func-row__head">
            <span class="func-row__check">
              <input
                type="checkbox"
                data-action="func-toggle"
                data-key="${escapeHtml(f.key)}"
                ${checked ? "checked" : ""}
              />
              <span class="func-row__checkmark"></span>
            </span>
            <span class="func-row__ico">
              <i class="fa-solid ${escapeHtml(f.icon || "fa-circle-dot")}"></i>
            </span>
            <span class="func-row__text">
              <span class="func-row__title">${escapeHtml(f.title)}</span>
              <span class="func-row__sub">${escapeHtml(f.selectLabel)}</span>
            </span>
            ${pending ? `<span class="func-row__badge">Pendente</span>` : ""}
          </label>

          <div class="func-row__body ${checked ? "" : "is-disabled"}">
            <div class="func-select ${checked ? "" : "is-disabled"}" data-key="${escapeHtml(f.key)}">
              <button
                type="button"
                class="func-select__trigger"
                data-action="func-select-toggle"
                data-key="${escapeHtml(f.key)}"
                ${checked ? "" : "disabled"}
              >
                <span class="func-select__label">${escapeHtml(selected || "Selecionar tipo...")}</span>
                <span class="func-select__chev"><i class="fa-solid fa-chevron-down"></i></span>
              </button>
              <div class="func-select__list" role="listbox">
                ${options}
              </div>
            </div>
          </div>
        </div>
      `;
    }).join("");

    const activeCount = FUNCS.filter((f) => state.funcs?.[f.key]).length;
    const pendingCount = FUNCS.filter(
      (f) => state.funcs?.[f.key] && !state.funcParams?.[f.key]
    ).length;

      container.innerHTML = `
        <div class="equip-page">
          <div class="equip-page__title">Configuração de Módulos e Funções</div>
          <div class="equip-page__sub">Configure as funções de cada módulo detectado. Ative as funcionalidades desejadas e selecione os tipos correspondentes.</div>

          <div class="mod-panel">
            <div class="mod-panel__head">
              <div class="mod-panel__module">
                <span class="mod-panel__ico"><i class="fa-solid fa-microchip"></i></span>
                <div class="mod-panel__module-info">
                  <div class="mod-panel__title">${escapeHtml(mod.name)}</div>
                  <div class="mod-panel__meta">Serial: ${escapeHtml(mod.serial)} • ${escapeHtml(mod.source)}</div>
                </div>
                <span class="mod-panel__badge">${escapeHtml(mod.source || "Manual")}</span>
              </div>

              <button class="mod-panel__danger" type="button" data-action="ip-mod-del-first">
                <i class="fa-solid fa-trash"></i> Excluir módulo
              </button>
            </div>

            <div class="mod-panel__stats">
              <span class="mod-stat mod-stat--ok">
                <span class="mod-stat__dot"></span>
                ${activeCount} função(ões) ativas
              </span>
              <span class="mod-stat mod-stat--warn">
                <span class="mod-stat__dot"></span>
                ${pendingCount} pendente(s) de configuração
              </span>
            </div>

            <div class="func-list">
              ${rows}
            </div>
          </div>
        </div>
      `;

      // ✅ Listener local do Step 4 (mesma lógica)
      container.onchange = (e) => {
        const el = e.target;
        if (!(el instanceof Element)) return;

        const action = el.getAttribute("data-action");
        if (!action) return;

        // Toggle checkbox
        if (action === "func-toggle") {
          const key = el.getAttribute("data-key");
          const checked = el.checked === true;

          state.funcs[key] = checked;
          if (!checked) state.funcParams[key] = "";

          // habilita/desabilita o select do mesmo bloco
          const row = el.closest(".func-row");
          const body = row?.querySelector(".func-row__body");
          const selectWrap = row?.querySelector(".func-select");
          const trigger = row?.querySelector(".func-select__trigger");
          const label = row?.querySelector(".func-select__label");
          const options = row?.querySelectorAll(".func-select__option");

          if (body) body.classList.toggle("is-disabled", !checked);
          if (selectWrap) selectWrap.classList.toggle("is-disabled", !checked);
          if (trigger) trigger.disabled = !checked;
          if (!checked) {
            if (label) label.textContent = "Selecionar tipo...";
            options?.forEach((opt) => opt.classList.remove("is-selected"));
            if (selectWrap) selectWrap.classList.remove("is-open");
          }
          return;
        }
      };

      container.onclick = (e) => {
        const target = e.target;
        if (!(target instanceof Element)) return;

        const actionEl = target.closest("[data-action]");
        const action = actionEl?.getAttribute("data-action");
        if (!action) {
          // close open selects when clicking elsewhere inside container
          container
            .querySelectorAll(".func-select.is-open")
            .forEach((el) => el.classList.remove("is-open"));
          return;
        }

        if (action === "ip-mod-del-first") {
          state.modules = (state.modules || []).slice(1);
          state.funcs = {};
          state.funcParams = {};
          this.renderStep4(container, state);
          return;
        }

        if (action === "func-select-toggle") {
          const key = actionEl.getAttribute("data-key");
          const wrap = container.querySelector(`.func-select[data-key="${key}"]`);
          if (wrap?.classList.contains("is-disabled")) return;

          container
            .querySelectorAll(".func-select.is-open")
            .forEach((el) => {
              if (el !== wrap) el.classList.remove("is-open");
            });
          wrap?.classList.toggle("is-open");
          return;
        }

        if (action === "func-select-option") {
          const key = actionEl.getAttribute("data-key");
          const value = actionEl.getAttribute("data-value") || "";
          state.funcParams[key] = value;

          const wrap = container.querySelector(`.func-select[data-key="${key}"]`);
          const label = wrap?.querySelector(".func-select__label");
          const options = wrap?.querySelectorAll(".func-select__option");
          if (label) label.textContent = value;
          options?.forEach((opt) => opt.classList.toggle("is-selected", opt === actionEl));
          wrap?.classList.remove("is-open");
          // re-render to update "pendente" badge and stats
          this.renderStep4(container, state);
          return;
        }
      };

      // Botao Excluir (opcional) tratado no handler acima
    },

    // =================
    // STEP 5 (Resumo)
    // =================
// =================
// STEP 5 — Vincular equipamento (novo)
// =================
renderStep5(container, state) {
  state.vinculo = state.vinculo || "";

  container.innerHTML = `
    <div class="equip-page equip-page--link">
      <div class="equip-page__title">Vincular equipamento</div>
      <div class="equip-page__sub">Informe a qual equipamento este Irripump será vinculado.</div>

      <div class="equip-form">
        <div class="equip-field">
          <label class="equip-label"><span class="equip-required">*</span> Equipamento vínculo</label>
          <input
            class="equip-input"
            id="ipVinculo"
            placeholder="Ex: Pivô 03 / Casa de Bomba 01 / Fazenda X"
            value="${escapeHtml(state.vinculo || "")}"
          />
          <div class="equip-hint">Por enquanto é só um campo. Depois vira lista/dropdown com busca.</div>
        </div>
      </div>
    </div>
  `;

  // Salva no state em tempo real (sem depender do Next)
  const input = container.querySelector("#ipVinculo");
  if (input) {
    input.oninput = () => {
      state.vinculo = input.value || "";
    };
  }
},

// =================
// STEP 6 — Resumo (era o Step 5)
// =================
renderStep6(container, state) {
  const modules = state.modules || [];

  const funcsAtivas = FUNCS.filter((f) => state.funcs?.[f.key]).map((f) => ({
    key: f.key,
    name: f.title,
    param: state.funcParams?.[f.key] || "",
  }));

  const missing = funcsAtivas.filter((x) => !x.param);

  const funcsHtml = funcsAtivas.length
    ? funcsAtivas
        .map((x) => {
          const hasParam = !!x.param;
          return `
            <div class="summary-func ${hasParam ? "is-ok" : "is-missing"}">
              <div class="summary-func__head">
                <span class="summary-func__title">${escapeHtml(x.name)}</span>
                <span class="summary-func__badge">${hasParam ? "OK" : "Pendente"}</span>
              </div>
              <div class="summary-func__param">
                ${hasParam ? escapeHtml(x.param) : "Tipo não selecionado"}
              </div>
              ${hasParam ? "" : `<div class="summary-func__meta">Selecione o tipo no Step 4.</div>`}
            </div>
          `;
        })
        .join("")
    : `<div class="muted">Nenhuma função selecionada.</div>`;

  const progressParts = [
    modules.length ? 1 : 0,
    funcsAtivas.length ? 1 : 0,
    funcsAtivas.length && missing.length === 0 ? 1 : 0,
  ];
  const progress = Math.round((progressParts.reduce((acc, n) => acc + n, 0) / 3) * 100);

  const warn = missing.length
    ? `
      <div class="equip-warn">
        <div class="equip-warn__title">
          <i class="fa-solid fa-triangle-exclamation"></i>
          Atenção: faltam parâmetros em ${missing.length} função(ões)
        </div>
        <div class="equip-warn__chips">
          ${missing.map((m) => `<span class="warn-chip">${escapeHtml(m.name)}</span>`).join("")}
        </div>
        <div class="equip-warn__hint">Volte no Step 4 e selecione o tipo para cada função marcada.</div>
      </div>
    `
    : "";

  const moduleRows = modules
    .map(
      (m) => `
        <tr>
          <td class="td-strong">${escapeHtml(m.name)}</td>
          <td>${escapeHtml(m.serial || "—")}</td>
          <td>${escapeHtml(m.source || "—")}</td>
        </tr>
      `
    )
    .join("");

  container.innerHTML = `
    <div class="equip-page equip-summary">
      <div class="equip-page__title">Resumo da Configuração</div>
      <div class="equip-page__sub">Revise todas as informações antes de finalizar o cadastro</div>

      ${warn}

      <div class="summary-grid2">
        <div class="summary-card">
          <div class="summary-card__head">Informações Gerais</div>
          <div class="kv-grid">
            <div class="kv">
              <div class="kv__k">Nome do Equipamento</div>
              <div class="kv__v">${escapeHtml(state.nome || "—")}</div>
            </div>
            <div class="kv">
              <div class="kv__k">Localização</div>
              <div class="kv__v">${escapeHtml(state.loc || "—")}</div>
            </div>
            <div class="kv">
              <div class="kv__k">ID/Serial</div>
              <div class="kv__v">${escapeHtml(state.serial || "—")}</div>
            </div>
            <div class="kv">
              <div class="kv__k">Vínculo</div>
              <div class="kv__v">${escapeHtml(state.vinculo || "—")}</div>
            </div>
            <div class="kv">
              <div class="kv__k">Tipo de Equipamento</div>
              <div class="kv__v"><strong>Irripump</strong></div>
            </div>
          </div>
        </div>

        <div class="summary-card">
          <div class="summary-card__head">Status do Cadastro</div>
          <div class="summary-progress" role="group" aria-label="Progresso do cadastro">
            <div class="summary-progress__label">Pronto para finalizar</div>
            <div
              class="summary-progress__bar"
              role="progressbar"
              aria-valuemin="0"
              aria-valuemax="100"
              aria-valuenow="${progress}"
            >
              <span style="width:${progress}%"></span>
            </div>
            <div class="summary-progress__meta">${progress}%</div>
          </div>

          <div class="status-list">
            <div class="status-item">
              <span class="status-dot ${modules.length ? "is-ok" : "is-warn"}"></span>
              <span class="status-label">Módulos</span>
              <span class="status-val">${modules.length ? `${modules.length} configurado(s)` : "Nenhum módulo"}</span>
            </div>
            <div class="status-item">
              <span class="status-dot ${funcsAtivas.length ? "is-ok" : "is-warn"}"></span>
              <span class="status-label">Funções ativas</span>
              <span class="status-val">${funcsAtivas.length ? `${funcsAtivas.length} selecionada(s)` : "Nenhuma"}</span>
            </div>
            <div class="status-item">
              <span class="status-dot ${missing.length ? "is-warn" : "is-ok"}"></span>
              <span class="status-label">Parâmetros</span>
              <span class="status-val">${missing.length ? "Faltando" : "OK"}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="summary-grid2 summary-grid2--stack">
        <div class="summary-card">
          <div class="summary-card__head">Funções e Parâmetros</div>
          <div class="summary-card__sub">Confira os tipos selecionados para cada função ativa.</div>
          <div class="summary-funcs">
            ${funcsHtml}
          </div>
        </div>

        <div class="summary-card">
          <div class="summary-card__head">Módulos Configurados (${modules.length})</div>
          <div class="summary-card__sub">Lista dos módulos vinculados a este equipamento.</div>
          <div class="table-wrap">
            <table class="tbl tbl--modules">
              <thead>
                <tr>
                  <th>Nome do Módulo</th>
                  <th>Serial</th>
                  <th>Origem</th>
                </tr>
              </thead>
              <tbody>
                ${moduleRows || `<tr><td colspan="3" class="muted">Nenhum módulo configurado.</td></tr>`}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="summary-card">
        <div class="summary-card__head">Finalizar Cadastro</div>
        <div class="summary-card__sub">Escolha como deseja finalizar o cadastro deste equipamento.</div>

        <div class="summary-actions">
          <button class="summary-btn" type="button" data-action="save-draft">
            <i class="fa-solid fa-floppy-disk"></i> Salvar como Rascunho
          </button>

          <button class="summary-btn summary-btn--primary" type="button" data-action="finish">
            <i class="fa-solid fa-check"></i> Concluir Cadastro e Ativar
          </button>

          <button class="summary-btn" type="button" data-action="advanced">
            <i class="fa-solid fa-gear"></i> Seguir para Configuração Avançada
          </button>
        </div>
      </div>
    </div>
      `;
    },
  };
})();
