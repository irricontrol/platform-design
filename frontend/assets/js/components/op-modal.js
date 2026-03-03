/* assets/js/components/op-modal.js */
(function () {
  "use strict";

  const OpModal = (window.OpModal = {
    open(data = {}) {
      const modalId = "opModalIrrigation";
      if (document.getElementById(modalId)) document.getElementById(modalId).remove();

      const {
        title = "Irrigação simples",
        angle = 304.6,
        isPeakHour = true,
      } = data;

      const html = `
        <div class="op-modal" id="${modalId}">
          <div class="op-modal__backdrop"></div>
          <div class="op-modal__dialog">
            <header class="op-modal__header">
              <div class="op-modal__title-row">
                <h3 class="op-modal__title">${title}</h3>
                <button type="button" class="op-modal__load-btn">Carregar última irrigação</button>
              </div>
              <button type="button" class="op-modal__close" aria-label="Fechar">
                <i class="fa-solid fa-xmark"></i>
              </button>
            </header>

            <div class="op-modal__content">
              ${isPeakHour ? `
                <div class="op-modal__alert op-modal__alert--warning">
                  <i class="fa-solid fa-circle-exclamation"></i>
                  <span>Horário de pico habilitado</span>
                </div>
              ` : ''}

              <div class="op-modal__alert op-modal__alert--info">
                <i class="fa-solid fa-circle-info"></i>
                <span>Ângulo atual: ${angle.toFixed(1)}°</span>
              </div>

              <div class="op-modal__visualizer">
                <div class="op-modal__dial-container" id="opModalDial">
                  <!-- SVG Dial will be rendered here -->
                </div>
                <div class="op-modal__legend">
                  <div class="op-modal__legend-item">
                    <span class="op-modal__legend-color" style="background: #1e40af;"></span>
                    <span>Segmento 1</span>
                  </div>
                </div>
              </div>

              <div class="op-form__grid">
                <!-- Row 1 -->
                <div class="op-form__group">
                  <label class="op-form__label">Modo de início</label>
                  <div class="op-form__custom-select">
                    <div class="op-form__select js-op-dropdown-trigger">
                      <span class="selected-text">Agora</span>
                    </div>
                    <div class="op-form__dropdown-panel">
                      <div class="op-form__dropdown-item is-active" data-value="agora">Agora</div>
                      <div class="op-form__dropdown-item" data-value="agendado">Agendado</div>
                      <div class="op-form__dropdown-item" data-value="pos_pico">Após horário de pico 1</div>
                    </div>
                  </div>
                </div>
                <div class="op-form__group">
                  <label class="op-form__label">Data de início</label>
                  <div class="op-form__input--with-suffix" style="background: #f1f5f9;">
                    <input type="text" value="${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}" disabled style="background: transparent;">
                    <div class="op-form__input-suffix"><i class="fa-regular fa-calendar"></i></div>
                  </div>
                </div>

                <!-- Row 2 -->
                <div class="op-form__group">
                  <label class="op-form__label">Direção</label>
                  <div class="op-form__segmented">
                    <button type="button" class="op-form__seg-btn is-active">
                      Avanço <i class="fa-solid fa-arrow-rotate-right"></i>
                    </button>
                    <button type="button" class="op-form__seg-btn">
                      Reverso <i class="fa-solid fa-arrow-rotate-left"></i>
                    </button>
                  </div>
                </div>
                <div class="op-form__group">
                  <label class="op-form__label">Modo de irrigação</label>
                  <div class="op-form__segmented">
                    <button type="button" class="op-form__seg-btn is-active">
                      Molhado <i class="fa-solid fa-droplet"></i>
                    </button>
                    <button type="button" class="op-form__seg-btn">
                      Seco <i class="fa-solid fa-droplet-slash"></i>
                    </button>
                  </div>
                </div>

                <!-- Row 3 -->
                <div class="op-form__group" style="grid-column: span 2;">
                   <label class="op-form__checkbox-label">
                     <input type="checkbox">
                     <span>Fertirrigação</span>
                   </label>
                </div>

                <!-- Row 4 -->
                <div class="op-form__group">
                  <label class="op-form__label">Percentímetro</label>
                  <div class="op-form__input--with-suffix">
                    <input type="number" value="100">
                    <div class="op-form__input-suffix">%</div>
                  </div>
                </div>
                <div class="op-form__group">
                  <label class="op-form__label">Lâmina</label>
                  <div class="op-form__input--with-suffix">
                    <input type="number" value="6.7153" step="0.0001">
                    <div class="op-form__input-suffix">mm</div>
                  </div>
                </div>

                <!-- Row 5: Modo de Parada -->
                <div class="op-form__group" style="grid-column: span 2;">
                  <div class="op-form__stop-row">
                    <div class="op-form__group">
                      <label class="op-form__label">Modo de parada</label>
                      <div class="op-form__custom-select">
                        <div class="op-form__select js-op-dropdown-trigger js-stop-mode-trigger">
                          <span class="selected-text">Sem parar</span>
                        </div>
                        <div class="op-form__dropdown-panel">
                          <div class="op-form__dropdown-item is-active" data-value="sem_parar">Sem parar</div>
                          <div class="op-form__dropdown-item" data-value="por_angulo">Por ângulo</div>
                          <div class="op-form__dropdown-item" data-value="por_voltas">Por voltas</div>
                        </div>
                      </div>
                    </div>

                    <!-- Dynamic field for Angle or Laps -->
                    <div class="op-form__group is-hidden js-stop-dynamic-field">
                      <label class="op-form__label js-stop-dynamic-label">Ângulo de parada</label>
                      <div class="op-form__input--with-suffix js-stop-dynamic-input-container">
                        <input type="number" value="305" class="js-stop-dynamic-input">
                        <div class="op-form__input-suffix js-stop-dynamic-suffix">°</div>
                      </div>
                    </div>
                  </div>

                  <!-- Estimated Info -->
                  <div class="op-form__estimate is-hidden js-stop-estimate">
                    <div class="op-form__estimate-line">Duração estimada da operação: 1 h 0 min</div>
                    <div class="op-form__estimate-line">Horário estimado para término: ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).replace('.', '')} 12:59</div>
                  </div>
                </div>
              </div>
            </div>

            <footer class="op-modal__footer">
              <button type="button" class="btn btn--cancel">Cancelar</button>
              <button type="button" class="btn btn--ok">OK</button>
            </footer>
          </div>
        </div>
      `;

      document.body.insertAdjacentHTML("beforeend", html);
      const modal = document.getElementById(modalId);

      // Event listeners
      const closeModal = () => modal.remove();
      modal.querySelector(".op-modal__close").addEventListener("click", closeModal);
      modal.querySelector(".op-modal__backdrop").addEventListener("click", closeModal);
      modal.querySelector(".btn--cancel").addEventListener("click", closeModal);
      modal.querySelector(".btn--ok").addEventListener("click", closeModal);

      // Custom dropdown logic (General refactor)
      modal.querySelectorAll(".op-form__custom-select").forEach(dropdown => {
        const trigger = dropdown.querySelector(".js-op-dropdown-trigger");
        const panel = dropdown.querySelector(".op-form__dropdown-panel");
        const items = dropdown.querySelectorAll(".op-form__dropdown-item");
        const selectedSpan = trigger.querySelector(".selected-text");

        trigger.addEventListener("click", (e) => {
          e.stopPropagation();
          // Close others
          modal.querySelectorAll(".op-form__dropdown-panel").forEach(p => {
            if (p !== panel) p.classList.remove("is-active");
          });
          modal.querySelectorAll(".js-op-dropdown-trigger").forEach(t => {
            if (t !== trigger) t.classList.remove("is-active");
          });
          modal.querySelectorAll(".op-form__custom-select").forEach(d => {
            if (d !== dropdown) d.classList.remove("is-active");
          });

          panel.classList.toggle("is-active");
          trigger.classList.toggle("is-active");
          dropdown.classList.toggle("is-active");
        });

        items.forEach(item => {
          item.addEventListener("click", () => {
            items.forEach(i => i.classList.remove("is-active"));
            item.classList.add("is-active");
            selectedSpan.textContent = item.textContent;
            panel.classList.remove("is-active");
            trigger.classList.remove("is-active");
            dropdown.classList.remove("is-active");

            // Stop Mode logic logic
            if (trigger.classList.contains("js-stop-mode-trigger")) {
              const dynamicField = modal.querySelector(".js-stop-dynamic-field");
              const dynamicLabel = modal.querySelector(".js-stop-dynamic-label");
              const dynamicInput = modal.querySelector(".js-stop-dynamic-input");
              const dynamicSuffix = modal.querySelector(".js-stop-dynamic-suffix");
              const estimateInfo = modal.querySelector(".js-stop-estimate");
              const val = item.getAttribute("data-value");

              if (val === "sem_parar") {
                dynamicField.classList.add("is-hidden");
                estimateInfo.classList.add("is-hidden");
              } else if (val === "por_angulo") {
                dynamicField.classList.remove("is-hidden");
                estimateInfo.classList.remove("is-hidden");
                dynamicLabel.textContent = "Ângulo de parada";
                dynamicSuffix.textContent = "°";
                dynamicSuffix.style.display = "flex";
                dynamicInput.placeholder = "";
                dynamicInput.value = "305";
              } else if (val === "por_voltas") {
                dynamicField.classList.remove("is-hidden");
                estimateInfo.classList.remove("is-hidden");
                dynamicLabel.textContent = "Voltas";
                dynamicSuffix.textContent = "";
                dynamicSuffix.style.display = "none";
                dynamicInput.placeholder = "Por favor insira";
                dynamicInput.value = "";
              }
            }
          });
        });
      });

      // Close dropdowns on outside click
      document.addEventListener("click", () => {
        modal.querySelectorAll(".op-form__dropdown-panel").forEach(p => p.classList.remove("is-active"));
        modal.querySelectorAll(".js-op-dropdown-trigger").forEach(t => t.classList.remove("is-active"));
      });

      // Toggle segmented buttons
      modal.querySelectorAll(".op-form__segmented").forEach(group => {
        const btns = group.querySelectorAll(".op-form__seg-btn");
        btns.forEach(btn => {
          btn.addEventListener("click", () => {
            btns.forEach(b => b.classList.remove("is-active"));
            btn.classList.add("is-active");
          });
        });
      });

      // Render Dial
      this.renderDial("opModalDial", angle);
    },

    renderDial(containerId, currentAngle) {
      const container = document.getElementById(containerId);
      if (!container) return;

      const size = 240;
      const center = size / 2;
      const radius = 95;
      const strokeWidth = 12;

      let svg = `<svg viewBox="0 0 ${size} ${size}" width="100%" height="100%" style="overflow: visible;">`;

      // Background Circle
      svg += `<circle cx="${center}" cy="${center}" r="${radius}" fill="#2563eb" fill-opacity="0.9" />`;

      // Tick marks
      for (let i = 0; i < 360; i += 5) {
        const angleRad = (i - 90) * (Math.PI / 180);
        const x1 = center + radius * Math.cos(angleRad);
        const y1 = center + radius * Math.sin(angleRad);
        const x2 = center + (radius + 6) * Math.cos(angleRad);
        const y2 = center + (radius + 6) * Math.sin(angleRad);
        svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#fff" stroke-width="1" stroke-opacity="0.4" />`;
      }

      // Current Angle Needle
      const needleAngleRad = (currentAngle - 90) * (Math.PI / 180);
      const needleX = center + radius * Math.cos(needleAngleRad);
      const needleY = center + radius * Math.sin(needleAngleRad);
      svg += `<line x1="${center}" y1="${center}" x2="${needleX}" y2="${needleY}" stroke="#fff" stroke-width="2" />`;
      svg += `<circle cx="${center}" cy="${center}" r="8" fill="#fff" />`;

      // Indicator Triangle (Pointing to center, base at edge)
      const tipInX = center + (radius - 12) * Math.cos(needleAngleRad);
      const tipInY = center + (radius - 12) * Math.sin(needleAngleRad);

      const leftAngle = needleAngleRad - (8 * Math.PI / 180);
      const rightAngle = needleAngleRad + (8 * Math.PI / 180);

      const lx = center + radius * Math.cos(leftAngle);
      const ly = center + radius * Math.sin(leftAngle);
      const rx = center + radius * Math.cos(rightAngle);
      const ry = center + radius * Math.sin(rightAngle);

      svg += `<polygon points="${tipInX},${tipInY} ${lx},${ly} ${rx},${ry}" fill="#fff" stroke="#334155" stroke-width="1" />`;

      svg += `</svg>`;
      container.innerHTML = svg;
    }
  });
})();
