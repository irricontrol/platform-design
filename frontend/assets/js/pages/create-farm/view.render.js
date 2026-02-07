// assets/js/pages/create-farm/view.render.js
(function initCreateFarmRender() {
  "use strict";

  const CreateFarm = (window.CreateFarm = window.CreateFarm || {});
  const state = CreateFarm.state || {};
  const helpers = CreateFarm.helpers || {};
  const view = (CreateFarm.view = CreateFarm.view || {});
  const render = (view.render = view.render || {});
  const events = (CreateFarm.events = CreateFarm.events || {});

  function renderEquipmentPanels(farm) {
    const panels = document.querySelectorAll(".map-card__panel[data-equip-list]");
    if (!panels.length) return;

    panels.forEach((panel) => {
      const key = panel.dataset.equipList;
      const list = (farm?.equipments || []).filter((item) => item.category === key);
      panel.innerHTML = "";

      if (!list.length) {
        const empty = document.createElement("div");
        empty.className = "map-card__equip-empty";
        empty.textContent = "Nenhum equipamento cadastrado.";
        panel.appendChild(empty);
        return;
      }

      list.forEach((item) => {
        const equip = document.createElement("div");
        equip.className = "map-card__equip";

        const head = document.createElement("div");
        head.className = "map-card__equip-head";

        const name = document.createElement("span");
        name.className = "map-card__equip-name";
        name.textContent = item.name || item.label || "Equipamento";

        head.appendChild(name);

        if (item.category === "pivos") {
          const badge = document.createElement("span");
          badge.className = "map-card__equip-badge map-card__equip-badge--warn";
          badge.textContent = "PAINEL DESLIGADO";
          head.appendChild(badge);
        }

        if (item.category === "medidores") {
          const levelPercent =
            helpers.toNumber(item?.data?.levelPercent) ??
            helpers.toNumber(item?.data?.percent) ??
            helpers.toNumber(item?.data?.nivelPercent) ??
            82.14;
          const levelMeters =
            helpers.toNumber(item?.data?.levelMeters) ??
            helpers.toNumber(item?.data?.meters) ??
            helpers.toNumber(item?.data?.nivelMeters) ??
            5.75;
          const badge = document.createElement("span");
          badge.className = "map-card__equip-badge map-card__equip-badge--info";
          badge.textContent = `${helpers.formatDecimal(levelPercent, 2)}% (${helpers.formatDecimal(levelMeters, 2)}m)`;
          head.appendChild(badge);
        }

        equip.appendChild(head);

        if (item.category === "pivos") {
          const angle = helpers.getPivotAngleDeg(item.data);

          const metricsTop = document.createElement("div");
          metricsTop.className = "map-card__metrics map-card__metrics--three";
          metricsTop.append(
            helpers.buildMetric("fa-solid fa-location-arrow", angle === null ? "--" : `${angle}?`, "?ngulo"),
            helpers.buildMetric("fa-solid fa-cloud", "--", "Press?o (centro)"),
            helpers.buildMetric("fa-regular fa-clock", "00h00min", "Tempo ligado")
          );

          const metricsBottom = document.createElement("div");
          metricsBottom.className = "map-card__metrics map-card__metrics--two";
          metricsBottom.append(
            helpers.buildMetric("fa-solid fa-droplet", "0mm", "Pluvi?metro"),
            helpers.buildMetric("fa-solid fa-cloud", "--", "Press?o (motor)", "map-card__metric--motor")
          );

          equip.append(metricsTop, metricsBottom);
        }

        if (item.category === "medidores") {
          const minPercent = helpers.toNumber(item?.data?.minPercent) ?? 20;
          const maxPercent = helpers.toNumber(item?.data?.maxPercent) ?? 100;
          const status = item?.data?.status || "Carregada";

          const metricsRow = document.createElement("div");
          metricsRow.className = "map-card__metrics map-card__metrics--three";
          metricsRow.append(
            helpers.buildMetric("fa-solid fa-arrow-down-long", `Min.: ${helpers.formatDecimal(minPercent, 0)}%`),
            helpers.buildMetric("fa-solid fa-arrow-up-long", `Max.: ${helpers.formatDecimal(maxPercent, 0)}%`, null, "map-card__metric--danger"),
            helpers.buildMetric("fa-solid fa-battery-full", status, null, "map-card__metric--success")
          );

          equip.append(metricsRow);
        }

        if (item.category === "repetidoras") {
          const height = helpers.toNumber(item?.data?.height);
          const metricsRow = document.createElement("div");
          metricsRow.className = "map-card__metrics map-card__metrics--one";
          metricsRow.append(
            helpers.buildMetric("fa-solid fa-up-down", height === null ? "-- m" : `${helpers.formatDecimal(height, 1)} m`)
          );
          equip.append(metricsRow);
        }

        const foot = document.createElement("div");
        foot.className = "map-card__equip-foot";
        foot.textContent = `?ltima comunica??o: ${helpers.formatDateTime(item.createdAt)}`;
        equip.appendChild(foot);

        panel.appendChild(equip);
      });
    });
  }

  function clearEquipmentPanels(message) {
    const panels = document.querySelectorAll(".map-card__panel[data-equip-list]");
    if (!panels.length) return;
    const text = message || "Selecione uma fazenda para ver equipamentos.";
    panels.forEach((panel) => {
      panel.innerHTML = "";
      const empty = document.createElement("div");
      empty.className = "map-card__equip-empty";
      empty.textContent = text;
      panel.appendChild(empty);
    });
  }

  function updateActiveFarm() {
    if (!state.farmListHost) return;
    state.farmListHost.querySelectorAll(".farm-list__item").forEach((item) => {
      item.classList.toggle("is-active", item.dataset.farmId === state.currentFarmId);
    });
  }

  function renderFarmList(filter = "") {
    if (!state.farmListHost) return;
    state.farmListHost.innerHTML = "";
    const term = filter.trim().toLowerCase();
    const filtered = state.farms.filter((farm) => farm.name.toLowerCase().includes(term));

    if (!filtered.length) {
      const empty = document.createElement("div");
      empty.className = "farm-list__empty";
      empty.textContent = term ? "Nenhuma fazenda encontrada." : "Nenhuma fazenda cadastrada.";
      state.farmListHost.appendChild(empty);
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
      btn.addEventListener("click", () => events.selectFarm?.(farm.id));
      state.farmListHost.appendChild(btn);
    });

    updateActiveFarm();
  }

  function renderSteps() {
    state.stepsContainer.innerHTML = "";
    state.steps.forEach((label, index) => {
      const stepEl = document.createElement("div");
      stepEl.className = "create-equip__step";
      if (index === state.currentStepIndex) stepEl.classList.add("create-equip__step--active");

      const numEl = document.createElement("span");
      numEl.className = "create-equip__step-num";
      numEl.textContent = String(index + 1);

      const labelEl = document.createElement("span");
      labelEl.className = "create-equip__step-label";
      labelEl.textContent = label;

      stepEl.append(numEl, labelEl);
      state.stepsContainer.appendChild(stepEl);
    });
  }

  function updateFooterLayout() {
    if (!state.prevBtn || !state.footer) return;
    const showPrev = state.currentStepIndex > 0;
    state.prevBtn.style.display = showPrev ? "" : "none";
    state.footer.classList.toggle("no-prev", !showPrev);
  }

  function setButtons() {
    const isLast = state.currentStepIndex === state.steps.length - 1;
    state.nextBtn.textContent = isLast ? "Finalizar" : "Pr?ximo";
  }

  function renderPlaceholder(label) {
    state.bodyHost.innerHTML = `
      <div style="padding:14px;border:1px solid #e5e7eb;border-radius:12px;background:#fff;">
        <strong>${label}</strong><br/>
        <span style="color:#6b7280;">Conte?do em constru??o.</span>
      </div>
    `;
  }

  function renderStepContent() {
    const label = state.steps[state.currentStepIndex];
    const stepKeyMap = {
      "Geral": "geral",
      "Faturamento": "billing",
      "Contato": "contact",
      "Faixas de Energia": "energy",
      "Localiza??o": "location",
      "Localiza????o": "location",
    };
    const stepKey = stepKeyMap[label] || label;
    renderSteps();
    setButtons();
    updateFooterLayout();

    if (stepKey === "geral") {
      state.bodyHost.innerHTML = `
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
              <label class="equip-label"><span class="equip-required">*</span>Dia da fatura de ?gua</label>
              <input class="equip-input" type="number" min="1" max="31" inputmode="numeric" placeholder="1" />
            </div>
          </div>

          <label class="equip-check">
            <input class="equip-check__input" type="checkbox" />
            <span>A fazenda possui Central?</span>
          </label>

          <div class="equip-field">
            <label class="equip-label"><span class="equip-required">*</span>Fuso hor?rio</label>
            <select class="equip-input">
              <option value="Africa/Abidjan">?frica/Abidjan (GMT+00)</option>
              <option value="America/Sao_Paulo">Am?rica/Sao_Paulo (GMT-03)</option>
              <option value="America/Cuiaba">Am?rica/Cuiab? (GMT-04)</option>
              <option value="America/Manaus">Am?rica/Manaus (GMT-04)</option>
              <option value="America/Rio_Branco">Am?rica/Rio Branco (GMT-05)</option>
              <option value="UTC">UTC (GMT+00)</option>
            </select>
          </div>
        </div>
      `;
      events.bindGeneralStep?.();
      events.initFarmSelects?.(state.bodyHost);
      return;
    }

    if (stepKey === "billing") {
      state.bodyHost.innerHTML = `
        <div class="farm-billing" data-farm-billing>
          <div class="farm-billing__intro">
            <div class="equip-alert farm-billing__alert" role="note">
              <i class="fa-solid fa-circle-info" aria-hidden="true"></i>
              <span>As informa??es devem ser do cliente!</span>
            </div>
            <p class="farm-billing__hint">
              Essas informa??es ser?o utilizadas para emitir faturas relacionadas ao uso da plataforma Irricontrol.
            </p>
          </div>

          <section class="farm-billing__section">
            <header class="farm-billing__section-head">
              <h4 class="farm-billing__section-title">Endere?o de Faturamento</h4>
            </header>

            <div class="equip-form farm-billing__grid farm-billing__grid--country">
              <div class="equip-field farm-billing__field" data-field="country">
                <label class="equip-label" for="farmBillingCountry">
                  <span data-label-text>Pa?s</span>
                  <span class="equip-required">*</span>
                </label>
                <select class="equip-input" id="farmBillingCountry" name="billing_country" data-country data-input required>
                  <option value="">Selecione o pa?s</option>
                  <option value="BR">Brasil</option>
                  <option value="US">Estados Unidos</option>
                  <option value="DE">Alemanha</option>
                  <option value="ZA">?frica do Sul</option>
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
                <input class="equip-input" id="farmBillingCity" name="billing_city" data-input type="text" placeholder="Ex: Goi?nia" required />
              </div>
            </div>

            <div class="farm-billing__details is-hidden" data-billing-details>
              <div class="equip-form farm-billing__grid farm-billing__grid--address">
                <div class="equip-field farm-billing__field farm-billing__field--span-2" data-field="address">
                  <label class="equip-label" for="farmBillingAddress">
                    <span data-label-text>Endere?o</span>
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
              <h4 class="farm-billing__section-title">Informa??es de Faturamento</h4>
            </header>

            <div class="equip-form farm-billing__grid farm-billing__grid--billing-top">
              <div class="equip-field farm-billing__field farm-billing__field--span-2" data-field="docGroup">
                <label class="equip-label" for="farmBillingDocType">
                  <span data-label-text>Documento</span>
                  <span class="equip-required">*</span>
                </label>
                <div class="farm-billing__doc">
                  <select class="equip-input" id="farmBillingDocType" name="billing_document_type" data-doc-type aria-label="Tipo de documento" required></select>
                  <input class="equip-input" id="farmBillingDocNumber" name="billing_document_number" type="text" placeholder="000.000.000-00" aria-label="N?mero do documento" required />
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
      events.bindBillingForm?.(null, { applyState: true, syncState: true });
      events.initFarmSelects?.(state.bodyHost);
      return;
    }

    if (stepKey === "contact") {
      state.bodyHost.innerHTML = `
        <div class="farm-billing farm-contact" data-farm-contact>
          <section class="farm-billing__section">
            <header class="farm-billing__section-head">
              <h4 class="farm-billing__section-title">Endere?o de Contato</h4>
            </header>

            <div class="farm-billing__details farm-contact__toggle is-hidden" data-contact-details>
              <label class="farm-switch">
                <input class="farm-switch__input" type="checkbox" data-contact-same />
                <span class="farm-switch__track" aria-hidden="true"></span>
                <span class="farm-switch__label">Mesmo do endere?o de faturamento</span>
              </label>
            </div>

            <div class="equip-form farm-billing__grid farm-billing__grid--country">
              <div class="equip-field farm-billing__field" data-field="country">
                <label class="equip-label" for="farmContactCountry">
                  <span data-label-text>Pa?s</span>
                  <span class="equip-required">*</span>
                </label>
                <select class="equip-input" id="farmContactCountry" name="contact_country" data-country data-input required>
                  <option value="">Selecione o pa?s</option>
                  <option value="BR">Brasil</option>
                  <option value="US">Estados Unidos</option>
                  <option value="DE">Alemanha</option>
                  <option value="ZA">?frica do Sul</option>
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
                <input class="equip-input" id="farmContactCity" name="contact_city" data-input type="text" placeholder="Ex: Goi?nia" required />
              </div>
            </div>

            <div class="farm-billing__details is-hidden" data-contact-details>
              <div class="equip-form farm-billing__grid farm-billing__grid--address" data-contact-address>
                <div class="equip-field farm-billing__field farm-billing__field--span-2" data-field="address">
                  <label class="equip-label" for="farmContactAddress">
                    <span data-label-text>Endere?o</span>
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
              <h4 class="farm-billing__section-title">Informa??es de Contato</h4>
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
      events.bindContactForm?.();
      events.initFarmSelects?.(state.bodyHost);
      return;
    }

    if (stepKey === "energy") {
      state.bodyHost.innerHTML = `
        <div class="farm-energy">
          <div class="farm-energy__note" role="note">
            Faixas de energia s?o per?odos espec?ficos durante o dia nos quais o custo da energia el?trica pode variar. Voc? pode personalizar as faixas da sua fazenda no menu de configura??es.
          </div>

          <p class="farm-energy__lead">
            Selecione o padr?o que melhor te atende baseado nas faixas de energia por hor?rio da sua regi?o
          </p>

          <div class="farm-energy__grid">
            <button class="farm-energy__card" type="button" data-energy-card aria-pressed="false">
              <span class="farm-energy__card-title">Ponta entre 17:00 e 20:00</span>
              <span class="farm-energy__card-desc">Define hor?rio de ponta entre 17:00 e 20:00 durante dias ?teis.</span>
            </button>

            <button class="farm-energy__card" type="button" data-energy-card aria-pressed="false">
              <span class="farm-energy__card-title">Ponta entre 18:00 e 21:00</span>
              <span class="farm-energy__card-desc">Define hor?rio de ponta entre 18:00 e 21:00 durante dias ?teis.</span>
            </button>

            <button class="farm-energy__card is-selected" type="button" data-energy-card aria-pressed="true">
              <span class="farm-energy__card-title">Personalizado</span>
              <span class="farm-energy__card-desc">Personalize mais tarde no menu de configura??es da sua fazenda.</span>
            </button>
          </div>
        </div>
      `;
      events.bindEnergyStep?.();
      return;
    }

    if (stepKey === "location") {
      state.bodyHost.innerHTML = `
        <div class="farm-location">
          <div class="farm-location__row">
            <div class="equip-field farm-location__field">
              <label class="equip-label" for="farmLocationInput">
                <span>Localiza??o da fazenda</span>
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
              <span>Obter Localiza??o</span>
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
      CreateFarm.view?.map?.bindLocationStep?.();
      return;
    }

    renderPlaceholder(label);
  }

  render.renderEquipmentPanels = renderEquipmentPanels;
  render.clearEquipmentPanels = clearEquipmentPanels;
  render.renderFarmList = renderFarmList;
  render.updateActiveFarm = updateActiveFarm;
  render.renderSteps = renderSteps;
  render.updateFooterLayout = updateFooterLayout;
  render.setButtons = setButtons;
  render.renderPlaceholder = renderPlaceholder;
  render.renderStepContent = renderStepContent;
})();
