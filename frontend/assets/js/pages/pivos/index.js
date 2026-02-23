// assets/js/pages/pivos/index.js
(function () {
    "use strict";

    const Pivos = (window.Pivos = window.Pivos || {});
    const state = (Pivos.state = Pivos.state || {});
    const views = (Pivos.views = Pivos.views || {});

    function isDetailsOpen() {
        return document.body.classList.contains("is-pivo-details") && !!document.getElementById("pivoSelectBtn");
    }

    window.IcPivos = {
        async open(options = {}) {
            const pivotId = options.pivotId ?? null;

            if (pivotId != null) state.selectedId = pivotId;

            // ✅ Se já está aberto, NÃO recrie o HTML.
            // Só atualiza a UI pro novo pivô.
            if (isDetailsOpen()) {
                if (views.details && typeof views.details.updateSelected === "function") {
                    await views.details.updateSelected(state.selectedId);
                } else if (views.details && typeof views.details.renderHeaderAndKPIs === "function") {
                    views.details.renderHeaderAndKPIs();
                }

                if (views.charts && typeof views.charts.renderCharts === "function") {
                    views.charts.renderCharts();
                }
                return;
            }

            // ✅ Primeira abertura: monta view completa
            if (views.details && typeof views.details.showMainView === "function") {
                await views.details.showMainView();
            } else {
                console.warn("Pivos views.details.showMainView is not available yet.");
            }
        },

        close() {
            if (views.details && typeof views.details.destroyView === "function") {
                views.details.destroyView();
            } else if (views.details && typeof views.details.destroyMinimap === "function") {
                // fallback (caso você ainda não tenha o destroyView no view.details)
                views.details.destroyMinimap();
            }

            document.body.classList.remove("is-pivo-details");
            state.selectedId = null;

            const slot = document.getElementById("pageSlot");
            if (slot) slot.innerHTML = "";

            if (window.icMapSetWheelMode) {
                window.icMapSetWheelMode("free");
            }

            const map = window.icMap;
            if (map && typeof map.invalidateSize === "function") {
                map.invalidateSize({ pan: false });
                requestAnimationFrame(() => map.invalidateSize({ pan: false }));
                setTimeout(() => map.invalidateSize({ pan: false }), 220);
            }

            window.dispatchEvent(new Event("ic:layout-change"));
        }
    };
})();