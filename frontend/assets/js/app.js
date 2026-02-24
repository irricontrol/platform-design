// assets/js/app.js
(function appRouter() {
  "use strict";

  console.log("Irricontrol FE â€” online");

  const nav = document.querySelector(".sidebar__nav");
  if (!nav) return;

  function setActive(route) {
    document.querySelectorAll(".nav__item").forEach((a) => {
      a.classList.toggle("is-active", a.getAttribute("data-route") === route);
    });
  }

  async function openFarmEditFallback() {
    document.body.classList.add("is-farm-edit");

    const mapCard = document.getElementById("mapCard");
    if (mapCard) mapCard.style.display = "none";

    const slot = document.getElementById("pageSlot");
    if (slot) {
      try {
        const html = await fetch("./pages/fazenda-edit.html").then((r) => r.text());
        slot.innerHTML = html;
      } catch (_) {
        // silencioso: fallback visual mínimo
      }
    }

    window.dispatchEvent(new Event("ic:layout-change"));
  }

  function closeFarmEditFallback() {
    document.body.classList.remove("is-farm-edit");
    const slot = document.getElementById("pageSlot");
    if (slot) slot.innerHTML = "";
    const mapCard = document.getElementById("mapCard");
    if (mapCard) mapCard.style.display = "";
    const map = window.icMap;
    if (map && typeof map.invalidateSize === "function") {
      map.invalidateSize({ pan: false });
      requestAnimationFrame(() => map.invalidateSize({ pan: false }));
      setTimeout(() => map.invalidateSize({ pan: false }), 180);
    }
  }

  function ensureFarmEditClosed() {
    if (document.body.classList.contains("is-farm-edit")) {
      closeFarmEditFallback();
    }
  }

  function go(route) {
    if (route === 'pluviometria') {
      setActive('pluviometria');
      try { window.IcFarmEdit?.close?.(); } catch (_) { closeFarmEditFallback(); }
      ensureFarmEditClosed();
      window.IcTalhoes?.close?.();
      window.IcRelatorios?.close?.();
      window.IcMonitoramento?.close?.();
      window.IcPivos?.close?.();
      window.IcChuvaGeo?.resetDefaults?.();
      window.IcPluviometria?.open?.();
      window.IcChuvaGeo?.open?.();
      return;
    }
    if (route === 'relatorios') {
      setActive('relatorios');
      try { window.IcFarmEdit?.close?.(); } catch (_) { closeFarmEditFallback(); }
      ensureFarmEditClosed();
      window.IcPluviometria?.close?.();
      window.IcChuvaGeo?.close?.();
      window.IcTalhoes?.close?.();
      window.IcPivos?.close?.();
      window.IcMonitoramento?.close?.();
      window.IcRelatorios?.open?.();
      return;
    }
    if (route === 'fazenda') {
      setActive('fazenda');
      window.IcPluviometria?.close?.();
      window.IcChuvaGeo?.close?.();
      window.IcRelatorios?.close?.();
      window.IcTalhoes?.close?.();
      window.IcPivos?.close?.();
      window.IcMonitoramento?.close?.();
      try {
        window.IcFarmEdit?.open?.();
      } catch (_) {
        openFarmEditFallback();
      }
      if (!document.body.classList.contains("is-farm-edit")) {
        openFarmEditFallback();
      }
      return;
    }
    if (route === 'talhoes') {
      setActive('talhoes');
      try { window.IcFarmEdit?.close?.(); } catch (_) { closeFarmEditFallback(); }
      ensureFarmEditClosed();
      window.IcPluviometria?.close?.();
      window.IcChuvaGeo?.close?.();
      window.IcRelatorios?.close?.();
      window.IcPivos?.close?.();
      window.IcMonitoramento?.close?.();
      window.IcTalhoes?.open?.();
      return;
    }

    if (route === 'usuarios') {
      setActive('usuarios');
      try { window.IcFarmEdit?.close?.(); } catch (_) { closeFarmEditFallback(); }

      document.body.classList.add("is-farm-edit");
      const mapCard = document.getElementById("mapCard");
      if (mapCard) mapCard.style.display = "none";

      window.IcPluviometria?.close?.();
      window.IcChuvaGeo?.close?.();
      window.IcRelatorios?.close?.();
      window.IcTalhoes?.close?.();
      window.IcPivos?.close?.();
      window.IcMonitoramento?.close?.();

      const slot = document.getElementById("pageSlot");
      if (slot) {
        fetch("./pages/usuarios.html")
          .then(r => r.text())
          .then(html => {
            slot.innerHTML = html;
            window.dispatchEvent(new Event("ic:layout-change"));
          });
      }
      return;
    }

    if (route === 'hidrica') {
      setActive('hidrica');
      try { window.IcFarmEdit?.close?.(); } catch (_) { closeFarmEditFallback(); }
      ensureFarmEditClosed();
      window.IcPluviometria?.close?.();
      window.IcChuvaGeo?.close?.();
      window.IcRelatorios?.close?.();
      window.IcTalhoes?.close?.();
      window.IcPivos?.close?.();
      window.IcMonitoramento?.close?.();
      return;
    }

    if (route === 'monitoramento') {
      setActive(route);
      try { window.IcFarmEdit?.close?.(); } catch (_) { closeFarmEditFallback(); }
      ensureFarmEditClosed();
      window.IcPluviometria?.close?.();
      window.IcChuvaGeo?.close?.();
      window.IcRelatorios?.close?.();
      window.IcTalhoes?.close?.();
      window.IcPivos?.close?.();
      window.IcMonitoramento?.open?.();

      const map = window.icMap;
      if (map && typeof map.invalidateSize === "function") {
        requestAnimationFrame(() => map.invalidateSize({ pan: false }));
        setTimeout(() => map.invalidateSize({ pan: false }), 180);
      }
      return;
    }

    // default: volta para o mapa normal
    setActive('mapa');
    try { window.IcFarmEdit?.close?.(); } catch (_) { closeFarmEditFallback(); }
    ensureFarmEditClosed();
    window.IcPluviometria?.close?.();
    window.IcChuvaGeo?.close?.();
    window.IcRelatorios?.close?.();
    window.IcTalhoes?.close?.();
    window.IcPivos?.close?.();
    window.IcMonitoramento?.close?.();
    const map = window.icMap;
    if (map && typeof map.invalidateSize === "function") {
      requestAnimationFrame(() => map.invalidateSize({ pan: false }));
      setTimeout(() => map.invalidateSize({ pan: false }), 180);
    }
  }
  nav.addEventListener("click", (e) => {
    const item = e.target.closest(".nav__item");
    if (!item) return;

    const route = item.getAttribute("data-route");
    if (!route) return;

    e.preventDefault();
    go(route);
  });

  // rota inicial
  go("mapa");
})();
