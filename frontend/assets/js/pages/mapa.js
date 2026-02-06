// mapa.js
(function initMapa() {
  const el = document.getElementById("map");
  if (!el) return;

  // Centro inicial (ajusta depois pra sua fazenda)
  const map = L.map("map", {
    zoomControl: true,
    scrollWheelZoom: false
  }).setView([-16.767, -47.613], 12);

  // Expõe referência para debug/integrações e corrige resize após mudanças de layout
  window.icMap = map;

  // Base: Satélite (Esri World Imagery)
  L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    {
      maxZoom: 19,
      attribution: "Tiles © Esri"
    }
  ).addTo(map);

  // (Opcional) camada de labels por cima, fica bem “Google-like”
  L.tileLayer(
    "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
    {
      maxZoom: 19,
      opacity: 0.85
    }
  ).addTo(map);

  // Exemplo: um marcador só pra você ver que tá vivo
  L.marker([-16.767, -47.613]).addTo(map).bindPopup("Mapa carregado ✅");

  // Hint de zoom com Ctrl + scroll
  const zoomHint = document.createElement("div");
  zoomHint.className = "map-zoom-hint";
  zoomHint.textContent = "Use ctrl + scroll to zoom the map";
  el.appendChild(zoomHint);

  let hintTimer = null;
  const showZoomHint = () => {
    zoomHint.classList.add("is-visible");
    if (hintTimer) clearTimeout(hintTimer);
    hintTimer = setTimeout(() => {
      zoomHint.classList.remove("is-visible");
    }, 1200);
  };

  let wheelMode = "ctrl";
  const applyWheelMode = () => {
    if (wheelMode === "ctrl") {
      map.scrollWheelZoom.disable();
    } else {
      map.scrollWheelZoom.enable();
    }
  };
  applyWheelMode();

  window.icMapSetWheelMode = (mode) => {
    wheelMode = mode === "free" ? "free" : "ctrl";
    applyWheelMode();
  };

  el.addEventListener("wheel", (e) => {
    if (wheelMode === "ctrl" && !e.ctrlKey) showZoomHint();
  }, { passive: true });

  window.addEventListener("keydown", (e) => {
    if (wheelMode !== "ctrl") return;
    if (e.key === "Control") map.scrollWheelZoom.enable();
  });

  window.addEventListener("keyup", (e) => {
    if (wheelMode !== "ctrl") return;
    if (e.key === "Control") map.scrollWheelZoom.disable();
  });

  window.addEventListener("blur", () => {
    if (wheelMode !== "ctrl") return;
    map.scrollWheelZoom.disable();
  });

  const invalidate = () => {
    map.invalidateSize({ pan: false, debounceMoveend: true });
  };

  // Resize normal da janela
  window.addEventListener("resize", invalidate);

  // Mudanças de layout (ex.: colapsar sidebar)
  window.addEventListener("ic:layout-change", () => {
    // rAF + pequeno atraso para pegar o layout já aplicado
    requestAnimationFrame(invalidate);
    setTimeout(invalidate, 180);
  });
})();

(function initMapCard() {
  const toggles = document.querySelectorAll(".map-card__item--toggle");
  if (!toggles.length) return;

  toggles.forEach(toggle => {
    toggle.addEventListener("click", () => {
      const panelId = toggle.dataset.panel;
      const panel = document.querySelector(`.map-card__panel[data-panel="${panelId}"]`);
      if (!panel) return;

      const isOpen = panel.classList.toggle("is-open");
      toggle.classList.toggle("is-open", isOpen);
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
      panel.setAttribute("aria-hidden", isOpen ? "false" : "true");
    });
  });
})();

(function initMapEquipBar() {
  const panel = document.getElementById("mapEquip");
  if (!panel) return;

  const stopEvent = (event) => {
    if (!event) return;
    event.stopPropagation();
  };

  const bindStop = (el) => {
    if (!el) return;
    ["pointerdown", "mousedown", "touchstart", "click", "dblclick", "wheel"].forEach((evt) => {
      el.addEventListener(evt, stopEvent);
    });
  };

  bindStop(panel);
})();
