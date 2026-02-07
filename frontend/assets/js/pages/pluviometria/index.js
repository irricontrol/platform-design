// assets/js/pages/pluviometria/index.js
(function () {
  "use strict";

  const Plv = (window.Plv = window.Plv || {});
  const state = (Plv.state = Plv.state || {});
  const views = (Plv.views = Plv.views || {});

  window.__devConfirmMaintenance = function () {
    if (!state.maintenanceState) return;
    state.maintenanceState.awaiting = false;
    state.maintenanceState.confirmedAt = "03/02/2026, 16:01";
    Plv.maintenance?.renderMaintenance?.();
  };

  window.IcPluviometria = {
    getSelectedCount() {
      return state.selected ? state.selected.size : 0;
    },

    getSelectedPluvios() {
      return Plv.cards?.selectedList?.() || [];
    },

    async open() {
      await views.data?.showMainView?.();
    },

    async openEdit() {
      await views.edit?.showEditView?.();
    },

    close() {
      views.map?.resetPluvPanelState?.();
      document.body.classList.remove("is-pluviometria");
      document.body.classList.remove("is-pluviometria-edit");
      document.body.classList.remove("pluv-has-selection");
      document.body.classList.remove("pluv-has-single-selection");
      document.body.classList.remove("pluv-settings-open");
      state.selected?.clear?.();
      state.expanded?.clear?.();

      // limpa slot
      const slot = document.getElementById("pageSlot");
      if (slot) slot.innerHTML = "";

      // remove markers
      if (state.layer) {
        try { state.layer.remove(); } catch (_) {}
        state.layer = null;
      }

      // volta card do mapa
      const mapCard = document.getElementById("mapCard");
      if (mapCard) mapCard.style.display = "";

      // remove camada de chuva fora da Pluviometria
      window.ChuvaGeo?.layers?.rain?.remove?.();

      // restaura ícones do mapa da fazenda ativa
      const activeFarm = window.IcFarmGetActive?.() || window.IcFarmActive;
      if (window.IcMapRenderPivots && activeFarm) {
        window.IcMapRenderPivots(activeFarm);
      }
      window.IcFarmShowMarker?.();

      // 🔧 FORÇA O LEAFLET A REDESENHAR (evita mapa preto)
      const map = window.icMap;
      if (map && typeof map.invalidateSize === "function") {
        map.invalidateSize({ pan: false });
        requestAnimationFrame(() => map.invalidateSize({ pan: false }));
        setTimeout(() => map.invalidateSize({ pan: false }), 220);
      }

      // se outros módulos escutam isso (mapa.js já escuta)
      window.dispatchEvent(new Event("ic:layout-change"));
    },
  };

  Plv.periodPicker?.initPeriodPicker?.();
})();
