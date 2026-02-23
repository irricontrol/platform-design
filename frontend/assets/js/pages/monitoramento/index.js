// assets/js/pages/monitoramento/index.js
(function () {
  "use strict";

  async function mountMonitorView() {
    const slot = document.getElementById("pageSlot");
    if (!slot) return;
    const html = await fetch("./pages/monitoramento.html").then((r) => r.text());
    slot.innerHTML = html;
    initMonitorUI(slot);
  }

  function hideMapCard() {
    const mapCard = document.getElementById("mapCard");
    if (mapCard) mapCard.style.display = "none";
  }

  function showMapCard() {
    const mapCard = document.getElementById("mapCard");
    if (mapCard) mapCard.style.display = "";
  }

  window.IcMonitoramento = {
    async open() {
      document.body.classList.add("is-monitoramento");
      hideMapCard();
      await mountMonitorView();
      window.dispatchEvent(new Event("ic:layout-change"));
    },

    close() {
      document.body.classList.remove("is-monitoramento");
      const slot = document.getElementById("pageSlot");
      if (slot) slot.innerHTML = "";
      showMapCard();
      window.dispatchEvent(new Event("ic:layout-change"));
    },
  };

  function initMonitorUI(root) {
    const tabs = Array.from(root.querySelectorAll(".monitor-view__tab"));

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        tabs.forEach(t => {
          t.classList.remove("is-active");
          t.setAttribute("aria-selected", "false");
        });
        tab.classList.add("is-active");
        tab.setAttribute("aria-selected", "true");
        // Lógica de filtro por período virá depois
      });
    });

    const layers = Array.from(root.querySelectorAll(".monitor-layer"));
    const content = root.querySelector(".monitor-view__content");

    layers.forEach((layer) => {
      layer.addEventListener("click", () => {
        layers.forEach(l => l.classList.remove("is-active"));
        layer.classList.add("is-active");

        const layerType = layer.dataset.layer;
        if (content) {
          content.dataset.currentLayer = layerType;
        }

        // Seleciona todos os rótulos e valores de métricas
        const allLabels = root.querySelectorAll(".monitor-view__metric-label");
        const allValues = root.querySelectorAll(".monitor-view__metric-value");

        allLabels.forEach((label, idx) => {
          if (layerType === 'uniformity') {
            const uLabels = ['Média', 'Tendência', 'Nível', 'Mínima'];
            if (uLabels[idx]) label.textContent = uLabels[idx];
          } else {
            const nLabels = ['Média', 'Tendência', 'Vigor', 'Uniform.'];
            if (nLabels[idx]) label.textContent = nLabels[idx];
          }
        });

        allValues.forEach((val, idx) => {
          // Lógica para o campo de Vigor/Nível (índice 2)
          if (idx === 2) {
            if (layerType === 'uniformity') {
              const uValues = ['Alto', 'Médio', 'Alto'];
              val.textContent = uValues[Math.floor(idx / 4)] || 'Alto'; // Simula por linha se necessário
              // Simplificando: como o querySelectorAll pega todos de todos os pivôs, 
              // vamos usar um seletor mais preciso ou um data-attribute.
            }
          }
        });

        // Refatorando para tratar cada pivô individualmente e garantir que os valores Alto/Médio/Baixo 
        // apareçam corretamente no lugar do Vigor.
        const rows = root.querySelectorAll(".monitor-view__row-group");
        rows.forEach((row, rowIdx) => {
          const vigorValue = row.querySelector("[data-metric-value-vigor]");
          const vigorLabel = row.querySelector("[data-metric-label-vigor]");
          const otherLabels = row.querySelectorAll(".monitor-view__metric-label");

          if (layerType === 'uniformity') {
            vigorLabel.textContent = 'Nível';
            // Simulação de valores p/ cada pivô
            const levels = ['Alto', 'Médio', 'Alto'];
            vigorValue.textContent = levels[rowIdx];
            otherLabels[3].textContent = 'Mínima';
          } else {
            vigorLabel.textContent = 'Vigor';
            const vigors = ['Ótimo', 'Alerta', 'Excelente'];
            vigorValue.textContent = vigors[rowIdx];
            otherLabels[3].textContent = 'Uniform.';
          }
        });

        // Atualiza a escala do eixo Y dinamicamente
        const axisContainers = root.querySelectorAll("[data-axis-y]");
        axisContainers.forEach(container => {
          const spans = container.querySelectorAll("span");
          if (layerType === 'uniformity') {
            const values = ['100', '85', '75', '65', '50']; // Escala 50 a 100
            spans.forEach((span, i) => span.textContent = values[i]);
          } else {
            const values = ['1.00', '0.75', '0.50', '0.25', '0.00']; // Escala NDVI
            spans.forEach((span, i) => span.textContent = values[i]);
          }
        });
      });
    });

    const multi = root.querySelector("[data-monitor-multi]");
    if (multi) {
      console.log("Monitoramento: Multi-select pronto para implementação");
    }

    const dateInput = root.querySelector(".monitor-view__date-input");
    if (dateInput) {
      dateInput.addEventListener("click", () => {
        console.log("Monitoramento: Date picker clicado");
      });
    }

    const headRow = root.querySelector("[data-monitor-header]");
    const bodyRow = root.querySelector("[data-monitor-body]");
    if (headRow && bodyRow) {
      const syncHead = () => {
        headRow.scrollLeft = bodyRow.scrollLeft;
      };
      bodyRow.addEventListener("scroll", syncHead, { passive: true });
      syncHead();
    }
  }
})();
