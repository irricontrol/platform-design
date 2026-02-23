// assets/js/pages/talhoes/index.js
(function () {
  "use strict";

  const state = {
    isOpen: false,
    map: null,
    drawLayer: null,
    savedLayerGroup: null,
    polygon: null,
    draftLine: null,
    cursorLine: null,
    points: [],
    savedTalhoes: [], // Store saved polygons
    editMarkers: [],
    midpointMarkers: [],
    selectedId: null, // Track selected talhão
    mode: "idle",
    ui: {
      root: null,
      mapWrap: null,
      toolDraw: null,
      toolDelete: null,
      bottomBar: null,
    },
  };

  /* =========================================================
     VIEW MOUNT
     ========================================================= */
  async function mountTalhoesView() {
    const slot = document.getElementById("pageSlot");
    if (!slot) return;

    const res = await fetch("./pages/talhoes.html", { cache: "no-store" });
    if (!res.ok) {
      console.error("[Talhoes] Falha ao carregar ./pages/talhoes.html", res.status);
      slot.innerHTML =
        '<div style="padding:16px">Erro ao carregar Talhoes (pages/talhoes.html).</div>';
      return;
    }

    const html = await res.text();
    slot.innerHTML = html;

    initTalhoesUI();
  }

  function hideMapCard() {
    const mapCard = document.getElementById("mapCard");
    if (mapCard) mapCard.style.display = "none";
  }

  function showMapCard() {
    const mapCard = document.getElementById("mapCard");
    if (mapCard) mapCard.style.display = "";
  }

  /* =========================================================
     FARM HELPERS
     ========================================================= */
  function getFarmData() {
    const s = window.CreateFarm?.state;
    const farms = Array.isArray(s?.farms) ? s.farms : [];
    const activeId =
      s?.currentFarmId ||
      localStorage.getItem("ic_active_farm") ||
      localStorage.getItem("ic_active_farm_id");

    let farm = farms.find((item) => item.id === activeId) || farms[0];

    if (!farm) {
      try {
        const stored = JSON.parse(localStorage.getItem("ic_farms") || "[]");
        if (Array.isArray(stored)) {
          farm = stored.find((item) => item.id === activeId) || stored[0];
        }
      } catch (_) { }
    }

    return farm || { id: activeId || "default" };
  }

  function getActiveFarmId() {
    const farm = getFarmData();
    return farm ? farm.id : "default";
  }

  function parseLatLng(text) {
    if (!text) return null;
    const parts = String(text)
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
    if (parts.length < 2) return null;

    const lat = Number(parts[0].replace(",", "."));
    const lng = Number(parts[1].replace(",", "."));

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng };
  }

  function resolveCenter() {
    const farm = getFarmData();
    if (farm) {
      if (Number.isFinite(farm.lat) && Number.isFinite(farm.lng)) {
        return { lat: farm.lat, lng: farm.lng };
      }
      const parsed = parseLatLng(farm.loc);
      if (parsed) return parsed;
    }
    return { lat: -22.008419, lng: -46.812567 };
  }

  /* =========================================================
     STORAGE
     ========================================================= */
  function saveTalhoesToStorage() {
    const farmId = getActiveFarmId();
    const key = `talhoes_${farmId}`;
    try {
      localStorage.setItem(key, JSON.stringify(state.savedTalhoes));
    } catch (e) {
      console.warn("Failed to save talhoes", e);
    }
  }

  function loadTalhoesFromStorage() {
    const farmId = getActiveFarmId();
    const key = `talhoes_${farmId}`;

    try {
      const data = localStorage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          state.savedTalhoes = parsed;

          // Restore LatLng objects
          state.savedTalhoes.forEach((t) => {
            if (t.points && Array.isArray(t.points) && window.L) {
              t.points = t.points.map((p) => L.latLng(p.lat, p.lng));
            }
            if (t.center && window.L) t.center = L.latLng(t.center.lat, t.center.lng);
          });
        } else {
          state.savedTalhoes = [];
        }
      } else {
        state.savedTalhoes = [];
      }
    } catch (e) {
      console.warn("Failed to load talhoes", e);
      state.savedTalhoes = [];
    }

    try {
      reRenderAllTalhoes();
      renderSidebarList();
    } catch (e) {
      console.error("Error rendering saved talhoes", e);
    }
  }

  /* =========================================================
     UI RENDER (MOVED OUT OF bindMapTools)
     ========================================================= */

  // Calculate area in hectares using spherical polygon approximation
  function calculatePolygonArea(latLngs) {
    if (!latLngs || latLngs.length < 3) return 0;
    const R = 6378137; // meters
    let area = 0;

    for (let i = 0; i < latLngs.length; i++) {
      const p1 = latLngs[i];
      const p2 = latLngs[(i + 1) % latLngs.length];
      area +=
        ((p2.lng - p1.lng) * (Math.PI / 180)) *
        (2 + Math.sin(p1.lat * (Math.PI / 180)) + Math.sin(p2.lat * (Math.PI / 180)));
    }

    area = Math.abs((area * R * R) / 2);
    return area / 10000; // hectares
  }

  function renderTalhaoOnMap(talhao) {
    if (!talhao || !window.L || !state.map) return;

    // ensure group
    if (!state.savedLayerGroup) {
      state.savedLayerGroup = L.layerGroup().addTo(state.map);
    }

    const polygon = L.polygon(talhao.points, {
      color: "#16a34a",
      weight: 2,
      fillColor: "#16a34a",
      fillOpacity: 0.2,
    }).addTo(state.savedLayerGroup);

    const popupContent = `
      <div class="talhoes-popup-title">${talhao.name}</div>
      <div class="talhoes-popup-row">
        <span class="talhoes-popup-label">Área:</span>
        <span class="talhoes-popup-value">${talhao.area} ha</span>
      </div>
      <div class="talhoes-popup-row">
        <span class="talhoes-popup-label">Crop:</span>
        <span class="talhoes-popup-value">${talhao.crop}</span>
      </div>
      <div class="talhoes-popup-row">
        <span class="talhoes-popup-label">Tipo de Solo:</span>
        <span class="talhoes-popup-value">${talhao.soil}</span>
      </div>
    `;

    polygon.bindPopup(popupContent, {
      className: "talhoes-popup",
      closeButton: false,
    });

    polygon.on("mouseover", function () {
      this.openPopup();
    });
    polygon.on("mouseout", function () {
      this.closePopup();
    });
  }

  function reRenderAllTalhoes() {
    if (state.savedLayerGroup) {
      state.savedLayerGroup.clearLayers();
    }
    state.savedTalhoes.forEach((t) => renderTalhaoOnMap(t));
  }

  function renderSidebarList() {
    const listRoot = document.querySelector(".talhoes__list");
    if (!listRoot) return;

    let itemsContainer = document.getElementById("talhoesListItems");
    const emptyState = listRoot.querySelector(".talhoes__empty");

    if (!itemsContainer) {
      itemsContainer = document.createElement("div");
      itemsContainer.id = "talhoesListItems";
      listRoot.appendChild(itemsContainer);
    }

    if (state.savedTalhoes.length > 0) {
      if (emptyState) emptyState.style.display = "none";
      itemsContainer.style.display = "block";
    } else {
      if (emptyState) emptyState.style.display = "flex";
      itemsContainer.style.display = "none";
    }

    itemsContainer.innerHTML = state.savedTalhoes
      .map((t) => {
        const isSelected = t.id === state.selectedId;
        const activeClass = isSelected ? "is-selected" : "";
        return `
      <div class="talhoes__item ${activeClass}" onclick="onTalhaoSelect(${t.id})">
        <span class="talhoes__item-name">${t.name}</span>
        <div class="talhoes__item-actions">
          <button class="talhoes__btn-action" title="Editar" onclick="editTalhao(event, ${t.id})"><i class="fa-solid fa-pen"></i></button>
          <button class="talhoes__btn-action text-red" title="Excluir" onclick="deleteTalhao(event, ${t.id})"><i class="fa-regular fa-trash-can"></i></button>
        </div>
      </div>
    `;
      })
      .join("");
  }

  function renderDetails(talhao) {
    const detailsContainer = document.querySelector(".talhoes__details");
    if (!detailsContainer || !talhao) return;

    // defensive center
    const center = talhao.center
      ? talhao.center
      : talhao.points && talhao.points.length
        ? L.latLngBounds(talhao.points).getCenter()
        : null;

    detailsContainer.innerHTML = `
      <div class="talhoes__detail-grid">
        <div class="talhoes__detail-header">Informações do Talhão</div>

        <div class="talhoes__detail-row">
          <span class="talhoes__detail-label">Nome:</span>
          <span class="talhoes__detail-value">${talhao.name}</span>
        </div>

        <div class="talhoes__detail-row">
          <span class="talhoes__detail-label">Crop:</span>
          <span class="talhoes__detail-value">${talhao.crop}</span>
        </div>

        <div class="talhoes__detail-row">
          <span class="talhoes__detail-label">Área:</span>
          <span class="talhoes__detail-value">${talhao.area} ha</span>
        </div>

        <div class="talhoes__detail-row">
          <span class="talhoes__detail-label">Tipo de Solo:</span>
          <span class="talhoes__detail-value">${talhao.soil}</span>
        </div>

        <div class="talhoes__detail-row" style="grid-column: span 2;">
          <span class="talhoes__detail-label">Posição do Talhão:</span>
          <span class="talhoes__detail-value">${center ? `${center.lat.toFixed(6)}, ${center.lng.toFixed(6)}` : "-"
      }</span>
        </div>
      </div>
    `;
  }

  function saveTalhao() {
    // 1) Validate geometry
    if (!state.points || state.points.length < 3) {
      alert("Desenhe um polígono válido primeiro.");
      return;
    }

    // 2) Validate form
    const nameInput = document.getElementById("talhoesName");
    const soilInput = document.getElementById("talhoesSoil");
    const cropInput = document.getElementById("talhoesCrop");

    const name = nameInput?.value?.trim();
    const soil = soilInput?.value;
    const crop = cropInput?.value;

    if (!name || !soil || !crop) {
      alert("Preencha todos os campos do formulário (Nome, Solo, Plantio).");
      toggleDrawer(true);
      return;
    }

    // 3) Calculate
    const areaHa = calculatePolygonArea(state.points);
    const center = L.polygon(state.points).getBounds().getCenter();

    // 4) Build talhao
    const talhao = {
      id: Date.now(),
      farmId: getActiveFarmId(),
      name,
      soil,
      crop,
      area: areaHa.toFixed(2),
      points: [...state.points],
      center,
    };

    // 5) Save
    state.savedTalhoes.push(talhao);
    saveTalhoesToStorage();

    // 6) Render
    renderTalhaoOnMap(talhao);
    renderSidebarList();
    renderDetails(talhao);

    // 7) Reset
    clearAllGeometry();
    setIdleModeUI();

    if (nameInput) nameInput.value = "";
  }

  /* =========================================================
     MAP INIT
     ========================================================= */
  function initTalhoesMap() {
    const mapEl = document.getElementById("talhoesMap");
    if (!mapEl || !window.L) return;

    if (state.map) {
      try {
        state.map.remove();
      } catch (_) { }
      state.map = null;
    }
    state.drawLayer = null;
    state.savedLayerGroup = null;

    const center = resolveCenter();
    const map = L.map(mapEl, { zoomControl: false }).setView([center.lat, center.lng], 15);

    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      { maxZoom: 19, attribution: "Tiles (c) Esri" }
    ).addTo(map);

    L.tileLayer(
      "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
      { maxZoom: 19, opacity: 0.85 }
    ).addTo(map);

    state.map = map;
    state.drawLayer = L.layerGroup().addTo(map);
    state.savedLayerGroup = L.layerGroup().addTo(map);

    map.on("click", handleMapClick);
    map.on("dblclick", handleMapDoubleClick);
    map.on("mousemove", handleMapMouseMove);

    // render what we already have in memory (usually empty until load)
    try {
      reRenderAllTalhoes();
    } catch (_) { }

    setTimeout(() => map.invalidateSize(), 120);

    // Load saved data for this farm
    setTimeout(() => {
      try {
        loadTalhoesFromStorage();
      } catch (e) {
        console.error("Error loading talhoes", e);
      }
    }, 200);
  }

  function handleMapMouseMove(e) {
    if (state.mode !== "draw" || state.points.length === 0) {
      if (state.cursorLine) {
        state.cursorLine.remove();
        state.cursorLine = null;
      }
      return;
    }

    const lastPoint = state.points[state.points.length - 1];
    if (!lastPoint) return;

    if (!state.cursorLine) {
      state.cursorLine = L.polyline([], {
        color: "#16a34a",
        weight: 2,
        opacity: 0.6,
        dashArray: "4 4",
      }).addTo(state.drawLayer);
    }

    state.cursorLine.setLatLngs([lastPoint, e.latlng]);
  }

  /* =========================================================
     UI INIT + BINDINGS
     ========================================================= */
  function initTalhoesUI() {
    bindDrawer();
    bindMapTools();
    initTalhoesMap();
    syncToolState();
  }

  function bindDrawer() {
    const root = document.getElementById("talhoesPanel");
    if (!root) return;

    if (root.dataset.drawerDelegated === "1") return;
    root.dataset.drawerDelegated = "1";

    root.addEventListener(
      "click",
      (e) => {
        const openBtn = e.target.closest("[data-talhoes-open]");
        if (openBtn) {
          e.preventDefault();
          clearAllGeometry();
          toggleDrawer(true);
          startDrawing();
          toggleBottomBar(true);
          return;
        }

        const closeBtn = e.target.closest("[data-talhoes-close]");
        if (closeBtn) {
          e.preventDefault();
          toggleDrawer(false);
          toggleBottomBar(false);
        }
      },
      true
    );
  }

  function bindMapTools() {
    const root = document.getElementById("talhoesPanel");
    if (!root) return;

    state.ui.root = root;
    state.ui.mapWrap = root.querySelector(".talhoes__map");
    state.ui.toolDraw = root.querySelector("[data-talhoes-tool='draw']");
    state.ui.toolDelete = root.querySelector("[data-talhoes-tool='delete']");
    state.ui.bottomBar = document.getElementById("talhoesBottomBar");

    // bottom bar actions
    if (state.ui.bottomBar) {
      const cancelBtn = state.ui.bottomBar.querySelector("[data-talhoes-action='cancel']");
      const saveBtn = state.ui.bottomBar.querySelector("[data-talhoes-action='save']");

      if (cancelBtn) {
        cancelBtn.addEventListener("click", () => {
          setIdleModeUI();
        });
      }

      if (saveBtn) {
        saveBtn.addEventListener("click", () => {
          saveTalhao();
        });
      }
    }

    // tools
    root.addEventListener("click", (e) => {
      const tool = e.target.closest("[data-talhoes-tool]");
      if (!tool || tool.disabled) return;

      const action = tool.getAttribute("data-talhoes-tool");
      if (!action) return;

      e.preventDefault();

      if (action === "draw") {
        handleDrawTool();
        return;
      }

      if (action === "delete") {
        clearAllGeometry();
      }
    });
  }

  /* =========================================================
     DRAW / EDIT FLOW
     ========================================================= */

  // ✅ single "go idle" (UI) function (no duplicate names)
  function setIdleModeUI() {
    // if drawing, cancel properly
    if (state.mode === "draw") {
      cancelDrawing();
    } else if (state.mode === "edit") {
      setEditMode(false);
    } else {
      clearAllGeometry();
    }

    toggleBottomBar(false);
    toggleDrawer(false);
    syncToolState();
  }

  function handleDrawTool() {
    if (state.mode === "draw") {
      if (state.points.length >= 3) finishDrawing();
      return;
    }

    if (state.polygon) {
      setEditMode(state.mode !== "edit");
      return;
    }

    startDrawing();
    toggleBottomBar(true);
  }

  function handleMapClick(e) {
    if (state.mode !== "draw") return;
    if (!e?.latlng) return;

    // close polygon if near first point
    if (state.points.length >= 3) {
      const startPoint = state.points[0];
      const dist = state.map.latLngToContainerPoint(startPoint).distanceTo(
        state.map.latLngToContainerPoint(e.latlng)
      );
      if (dist < 20) {
        finishDrawing();
        return;
      }
    }

    state.points.push(e.latlng);
    ensureDraftLayers();
    if (state.draftLine) state.draftLine.setLatLngs(state.points);
    syncToolState();
  }

  function handleMapDoubleClick(e) {
    if (state.mode !== "draw") return;
    if (state.points.length < 3) return;
    if (e) {
      try {
        L.DomEvent.stop(e);
      } catch (_) { }
    }
    finishDrawing();
  }

  function startDrawing() {
    if (!state.map || !window.L) return;
    if (state.polygon) return;

    clearDraftLayers();
    state.points = [];
    state.mode = "draw";
    ensureDraftLayers();

    if (state.map.doubleClickZoom) state.map.doubleClickZoom.disable();

    updateMapCursor();
    syncToolState();
  }

  function cancelDrawing() {
    if (state.mode !== "draw") return;
    state.mode = "idle";
    state.points = [];
    clearDraftLayers();
    if (state.map?.doubleClickZoom) state.map.doubleClickZoom.enable();
    updateMapCursor();
    syncToolState();
  }

  function finishDrawing() {
    if (!state.map || !window.L) return;
    if (state.points.length < 3) return;

    // remove duplicated last
    const last = state.points[state.points.length - 1];
    const prev = state.points[state.points.length - 2];
    if (last && prev && last.lat === prev.lat && last.lng === prev.lng) state.points.pop();
    if (state.points.length < 3) return;

    clearDraftLayers();

    const latlngs = state.points.map((p) => L.latLng(p.lat, p.lng));
    state.points = latlngs;

    state.polygon = L.polygon(latlngs, {
      color: "#16a34a",
      weight: 2,
      fillColor: "#16a34a",
      fillOpacity: 0.18,
    }).addTo(state.drawLayer);

    if (state.map?.doubleClickZoom) state.map.doubleClickZoom.enable();

    setEditMode(true);
  }

  function setEditMode(active) {
    if (!state.polygon) {
      state.mode = "idle";
      updateMapCursor();
      syncToolState();
      return;
    }

    if (active) {
      state.mode = "edit";
      createEditMarkers();
      createMidpointMarkers();
    } else {
      state.mode = "idle";
      clearEditMarkers();
      clearMidpointMarkers();
    }

    updateMapCursor();
    syncToolState();
  }

  function ensureDraftLayers() {
    if (!state.drawLayer || !window.L) return;
    if (!state.draftLine) {
      state.draftLine = L.polyline([], {
        color: "#16a34a",
        weight: 2,
      }).addTo(state.drawLayer);
    }
  }

  function clearDraftLayers() {
    if (state.draftLine) {
      state.draftLine.remove();
      state.draftLine = null;
    }
    if (state.cursorLine) {
      state.cursorLine.remove();
      state.cursorLine = null;
    }
  }

  function clearPolygon() {
    if (state.polygon) {
      state.polygon.remove();
      state.polygon = null;
    }
  }

  function createEditMarkers() {
    clearEditMarkers();
    if (!state.drawLayer || !state.polygon || !window.L) return;

    state.points.forEach((latlng, index) => {
      const marker = L.marker(latlng, {
        draggable: true,
        autoPan: true,
        zIndexOffset: 1000,
        icon: L.divIcon({
          className: "talhoes-vertex",
          iconSize: [12, 12],
          iconAnchor: [6, 6],
        }),
      }).addTo(state.drawLayer);

      marker.on("drag", () => {
        state.points[index] = marker.getLatLng();
        if (state.polygon) state.polygon.setLatLngs(state.points);
        updateMidpointsDuringDrag();
      });

      marker.on("dragend", () => {
        createMidpointMarkers();
      });

      state.editMarkers.push(marker);
    });
  }

  function createMidpointMarkers() {
    clearMidpointMarkers();
    if (!state.drawLayer || !state.polygon || !window.L || state.points.length < 3) return;

    state.points.forEach((p1, i) => {
      const p2 = state.points[(i + 1) % state.points.length];
      const latlng = L.latLng((p1.lat + p2.lat) / 2, (p1.lng + p2.lng) / 2);

      const marker = L.marker(latlng, {
        draggable: true,
        icon: L.divIcon({
          className: "talhoes-midpoint",
          iconSize: [10, 10],
          iconAnchor: [5, 5],
        }),
        zIndexOffset: 900,
      }).addTo(state.drawLayer);

      marker.index = i + 1;

      marker.on("dragstart", () => {
        const idx = marker.index;
        state.points.splice(idx, 0, marker.getLatLng());
        state.polygon.setLatLngs(state.points);

        if (marker.getElement()) {
          const iconEl = marker.getElement();
          iconEl.classList.remove("talhoes-midpoint");
          iconEl.classList.add("talhoes-vertex");
          iconEl.style.width = "12px";
          iconEl.style.height = "12px";
          iconEl.style.marginLeft = "-6px";
          iconEl.style.marginTop = "-6px";
          iconEl.style.opacity = "1";
          iconEl.style.border = "2px solid #16a34a";
        }
        marker.setZIndexOffset(1000);

        marker.off("dragstart");
        marker.off("drag");
        marker.off("dragend");

        marker.on("drag", () => {
          state.points[idx] = marker.getLatLng();
          state.polygon.setLatLngs(state.points);
          updateMidpointsDuringDrag();
        });

        marker.on("dragend", () => {
          createEditMarkers();
          createMidpointMarkers();
        });

        state.editMarkers.push(marker);
        state.midpointMarkers = state.midpointMarkers.filter((m) => m !== marker);
        clearMidpointMarkers();
      });

      state.midpointMarkers.push(marker);
    });
  }

  function clearMidpointMarkers() {
    state.midpointMarkers.forEach((m) => m.remove());
    state.midpointMarkers = [];
  }

  function updateMidpointsDuringDrag() {
    state.midpointMarkers.forEach((m) => {
      if (m._icon) m._icon.style.display = "none";
    });
  }

  function clearEditMarkers() {
    state.editMarkers.forEach((marker) => marker.remove());
    state.editMarkers = [];
  }

  function clearAllGeometry() {
    clearEditMarkers();
    clearMidpointMarkers();
    clearDraftLayers();
    clearPolygon();
    state.points = [];
    state.mode = "idle";
    if (state.map?.doubleClickZoom) state.map.doubleClickZoom.enable();
    updateMapCursor();
    syncToolState();
  }

  function updateMapCursor() {
    if (!state.ui.mapWrap) return;
    state.ui.mapWrap.classList.toggle("is-drawing", state.mode === "draw");
  }

  function syncToolState() {
    const hasGeometry = !!state.polygon || state.points.length > 0;

    if (state.ui.toolDraw) {
      const isActive = state.mode === "draw" || state.mode === "edit";
      const label = state.polygon ? "Editar talhao" : "Criar novo talhao";
      const img = state.ui.toolDraw.querySelector("img");

      state.ui.toolDraw.classList.toggle("is-active", isActive);
      state.ui.toolDraw.setAttribute("aria-pressed", isActive ? "true" : "false");
      state.ui.toolDraw.setAttribute("aria-label", label);
      state.ui.toolDraw.setAttribute("title", label);

      if (img) {
        img.src = state.polygon ? "assets/img/svg/pencil.svg" : "assets/img/svg/waypoints.svg";
        img.alt = label;
      }
    }

    if (state.ui.toolDelete) {
      state.ui.toolDelete.disabled = !hasGeometry;
      state.ui.toolDelete.setAttribute("aria-disabled", !hasGeometry ? "true" : "false");
    }
  }

  function toggleBottomBar(show) {
    if (!state.ui.bottomBar) return;

    if (state.ui.mapWrap) {
      state.ui.mapWrap.classList.toggle("has-bottom-bar", !!show);
    }

    if (show) {
      state.ui.bottomBar.classList.add("is-visible");
      state.ui.bottomBar.setAttribute("aria-hidden", "false");
    } else {
      state.ui.bottomBar.classList.remove("is-visible");
      state.ui.bottomBar.setAttribute("aria-hidden", "true");
    }

    if (state.map) setTimeout(() => state.map.invalidateSize(), 50);
  }

  function toggleDrawer(open) {
    const root = document.getElementById("talhoesPanel");
    if (!root) return;

    const drawer = root.querySelector("[data-talhoes-drawer]");
    const mapCard = root.querySelector(".talhoes__map");
    if (!drawer) return;

    drawer.classList.toggle("is-open", Boolean(open));
    mapCard?.classList.toggle("is-drawer-open", Boolean(open));
  }

  function resetState() {
    clearAllGeometry();
    state.ui.root = null;
    state.ui.mapWrap = null;
    state.ui.toolDraw = null;
    state.ui.toolDelete = null;
    state.ui.bottomBar = null;
  }

  /* =========================================================
     GLOBAL ACTIONS (onclick)
     ========================================================= */
  window.onTalhaoSelect = (id) => {
    state.selectedId = id;
    renderSidebarList(); // Update UI to show selected state

    const t = state.savedTalhoes.find((i) => i.id === id);
    if (t) {
      renderDetails(t);
      if (state.map && t.points && t.points.length > 0) {
        const bounds = L.latLngBounds(t.points);
        state.map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  };

  window.editTalhao = (e, id) => {
    if (e) e.stopPropagation();
    const t = state.savedTalhoes.find((i) => i.id === id);
    if (!t) return;

    clearAllGeometry();

    state.points = t.points.map((p) => L.latLng(p.lat, p.lng));

    state.polygon = L.polygon(state.points, {
      color: "#16a34a",
      weight: 2,
      fillColor: "#16a34a",
      fillOpacity: 0.18,
    }).addTo(state.drawLayer);

    setEditMode(true);

    const nameInput = document.getElementById("talhoesName");
    const soilInput = document.getElementById("talhoesSoil");
    const cropInput = document.getElementById("talhoesCrop");

    if (nameInput) nameInput.value = t.name;
    if (soilInput) soilInput.value = t.soil;
    if (cropInput) cropInput.value = t.crop;

    toggleDrawer(true);
    toggleBottomBar(true);

    // remove old item so salvar cria atualizado (mesmo id novo)
    state.savedTalhoes = state.savedTalhoes.filter((x) => x.id !== id);
    saveTalhoesToStorage();

    reRenderAllTalhoes();
    renderSidebarList();

    const detailsContainer = document.querySelector(".talhoes__details");
    if (detailsContainer)
      detailsContainer.innerHTML =
        '<div class="talhoes__details-empty"><span>Selecione um talhão</span></div>';
  };

  window.deleteTalhao = (e, id) => {
    if (e) e.stopPropagation();
    if (!confirm("Tem certeza que deseja excluir este talhão?")) return;

    state.savedTalhoes = state.savedTalhoes.filter((t) => t.id !== id);
    saveTalhoesToStorage();

    reRenderAllTalhoes();
    renderSidebarList();

    const detailsContainer = document.querySelector(".talhoes__details");
    if (detailsContainer)
      detailsContainer.innerHTML =
        '<div class="talhoes__details-empty"><span>Selecione um talhão</span></div>';
  };

  /* =========================================================
     PUBLIC API
     ========================================================= */
  window.IcTalhoes = {
    async open() {
      if (state.isOpen) return;

      state.isOpen = true;
      document.body.classList.add("is-talhoes");
      hideMapCard();

      await mountTalhoesView();
      window.dispatchEvent(new Event("ic:layout-change"));
    },

    close() {
      state.isOpen = false;
      document.body.classList.remove("is-talhoes");

      const slot = document.getElementById("pageSlot");
      if (slot) slot.innerHTML = "";

      showMapCard();

      resetState();

      if (state.map) {
        try {
          state.map.remove();
        } catch (_) { }
        state.map = null;
      }
      state.drawLayer = null;
      state.savedLayerGroup = null;

      window.dispatchEvent(new Event("ic:layout-change"));
    },

    toggleDrawer,
  };
})();
