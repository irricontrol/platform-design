// assets/js/pages/pivos/view.details.js
(function () {
    "use strict";

    const Pivos = (window.Pivos = window.Pivos || {});
    const state = (Pivos.state = Pivos.state || {});
    const views = (Pivos.views = Pivos.views || {});
    const detailsView = (views.details = views.details || {});
    const $ = (id) => document.getElementById(id);

    let minimapInstance = null;
    let minimapLayer = null;
    let minimapCenterMarker = null;
    let minimapTilesPrimary = null;
    let minimapTilesFallback = null;

    // Guard para não registrar listeners duplicados
    let eventsBound = false;
    let onDocClick = null;

    async function mountPanel() {
        const slot = document.getElementById("pageSlot");
        if (!slot) return;

        try {
            const html = await fetch("./pages/pivo.details.html").then((r) => r.text());
            slot.innerHTML = html;

            // Se o template vier sem o menu, não adianta tentar abrir
            const selectorMenu = $("pivoSelectorMenu");
            if (selectorMenu) selectorMenu.style.display = "none";

            bindEvents();
        } catch (err) {
            console.error("Failed to load pivo.details.html", err);
        }
    }

    function bindEvents() {
        // Evita duplicar listeners se abrir/fechar várias vezes
        if (eventsBound) return;
        eventsBound = true;

        const closeBtn = $("pivosCloseBtn");
        if (closeBtn) {
            closeBtn.style.cursor = "pointer";
            closeBtn.addEventListener("click", () => window.IcPivos?.close?.());
        }

        // 1 listener global para toggle do seletor
        onDocClick = (e) => {
            const selectorMenu = $("pivoSelectorMenu");
            const selectBtn = e.target.closest("#pivoSelectBtn");

            // Se não existe menu nessa view, nada a fazer
            if (!selectorMenu) return;

            // Clicou no botão -> toggle
            if (selectBtn) {
                e.stopPropagation();
                const isHidden = getComputedStyle(selectorMenu).display === "none";
                selectorMenu.style.display = isHidden ? "flex" : "none";

                if (isHidden) selectBtn.classList.add("is-active");
                else selectBtn.classList.remove("is-active");

                return;
            }

            // Clique fora -> fecha
            if (!selectorMenu.contains(e.target)) {
                selectorMenu.style.display = "none";
                const btn = $("pivoSelectBtn");
                if (btn) btn.classList.remove("is-active");
            }
        };

        document.addEventListener("click", onDocClick);

        // Listener for History table expansion
        const historyTableBody = $("pivoHistoryTableBody");
        if (historyTableBody) {
            historyTableBody.addEventListener("click", (e) => {
                const btn = e.target.closest(".expand-btn");
                if (!btn) return;

                const tr = btn.closest("tr.pivo-history__row");
                if (!tr) return;

                const detailsRow = tr.nextElementSibling;
                if (!detailsRow || !detailsRow.classList.contains("pivo-history__row-details")) return;

                const isExpanded = detailsRow.style.display !== "none";
                detailsRow.style.display = isExpanded ? "none" : "table-row";

                const icon = btn.querySelector("i");
                if (icon) {
                    icon.className = isExpanded ? "fa-solid fa-plus" : "fa-solid fa-minus";
                }
            });
        }

        // Fault items click
        const pivosPanel = $("pivosPanel");
        if (pivosPanel) {
            pivosPanel.addEventListener("click", (e) => {
                const faultItem = e.target.closest(".js-fault-item");
                if (faultItem) {
                    const faultLabel = faultItem.querySelector(".pivo-faults__label")?.textContent || "Falha";
                    openFaultModal(faultLabel);
                }
            });
        }
    }

    function openFaultModal(faultTitle) {
        const modalId = "pivoFaultModal";
        if ($(modalId)) $(modalId).remove();

        const pivoData = Pivos.data.getPivotData?.(state.selectedId);

        const modalHtml = `
            <div class="fault-modal" id="${modalId}">
                <div class="fault-modal__backdrop"></div>
                <div class="fault-modal__dialog">
                    <header class="fault-modal__header">
                        <h3 class="fault-modal__title">${faultTitle}</h3>
                        <button type="button" class="fault-modal__close" aria-label="Fechar">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </header>
                    <div class="fault-modal__content">
                        <div class="fault-modal__map-side">
                            <div class="fault-modal__map" id="faultModalMap"></div>
                        </div>
                        <div class="fault-modal__table-side">
                            <header class="fault-modal__table-header">
                                <h4 class="fault-modal__table-title">Paradas</h4>
                                <div class="fault-modal__date-picker">
                                    <span>24/01/2026 &nbsp; — &nbsp; 23/02/2026</span>
                                    <i class="fa-regular fa-calendar"></i>
                                </div>
                            </header>
                            <div class="fault-modal__table-container">
                                <table class="fault-modal__table">
                                    <thead>
                                        <tr>
                                            <th>Localização</th>
                                            <th>Hora</th>
                                            <th>Ângulo</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>-16.2574215,-47.413506</td>
                                            <td>10/02/2026 17:44</td>
                                            <td>0.5°</td>
                                        </tr>
                                        <tr>
                                            <td>-16.2572492,-47.4129491</td>
                                            <td>12/02/2026 08:34</td>
                                            <td>354.6°</td>
                                        </tr>
                                        <tr>
                                            <td>-16.2572492,-47.4129491</td>
                                            <td>12/02/2026 08:33</td>
                                            <td>354.6°</td>
                                        </tr>
                                        <tr>
                                            <td>-16.2572492,-47.4129491</td>
                                            <td>12/02/2026 08:24</td>
                                            <td>354.6°</td>
                                        </tr>
                                        <tr>
                                            <td>-16.2572492,-47.4129491</td>
                                            <td>11/02/2026 10:28</td>
                                            <td>354.6°</td>
                                        </tr>
                                        <tr>
                                            <td>-16.2572492,-47.4129491</td>
                                            <td>11/02/2026 10:22</td>
                                            <td>354.6°</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <footer class="fault-modal__pagination">
                                <span>1-6 de 10 itens</span>
                                <div class="fault-modal__pagination-controls">
                                    <button type="button" class="fault-modal__page-btn" disabled><i class="fa-solid fa-chevron-left"></i></button>
                                    <button type="button" class="fault-modal__page-btn is-active">1</button>
                                    <button type="button" class="fault-modal__page-btn">2</button>
                                    <button type="button" class="fault-modal__page-btn"><i class="fa-solid fa-chevron-right"></i></button>
                                </div>
                            </footer>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML("beforeend", modalHtml);

        const modalEl = $(modalId);
        const closeBtn = modalEl.querySelector(".fault-modal__close");
        const backdrop = modalEl.querySelector(".fault-modal__backdrop");

        const closeModal = () => {
            modalEl.remove();
        };

        closeBtn.addEventListener("click", closeModal);
        backdrop.addEventListener("click", closeModal);

        // Initialize Map
        setTimeout(() => {
            renderFaultMap(pivoData, faultTitle);
        }, 100);
    }

    function renderFaultMap(pivoData, faultTitle) {
        const mapEl = $("faultModalMap");
        if (!mapEl || !pivoData) return;

        // Limpar mapa anterior
        if (mapEl._leaflet_id) {
            mapEl._leaflet_id = null;
            mapEl.innerHTML = "";
        }

        const map = L.map(mapEl, {
            zoomControl: true,
            attributionControl: false,
            zoomSnap: 0
        });

        L.tileLayer(
            "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
            { maxZoom: 20 }
        ).addTo(map);

        if (pivoData.center && pivoData.radius) {
            const latlng = [pivoData.center.lat, pivoData.center.lng];

            // 1. Limite Físico (Branco)
            L.circle(latlng, {
                radius: pivoData.radius,
                color: "rgba(255,255,255,0.8)",
                weight: 2,
                fill: false,
                pointerEvents: 'none'
            }).addTo(map);

            // 2. Lógica Especial para Falha de Pressão (Heat Map SpaceX Style)
            if (faultTitle === "Falha de Pressão") {
                const pressurePoints = [];
                const segments = [];
                const steps = 120;
                const seed = (pivoData.id || "pivo").split('').reduce((a, b) => a + b.charCodeAt(0), 0);

                for (let i = 0; i <= 360; i += (360 / steps)) {
                    const angleRad = (i - 90) * (Math.PI / 180);

                    // Simulação de pressão (7.0 = Perfeito)
                    let pressure = 6.4 + (Math.sin(i * 0.05 + seed) * 0.3);

                    // Falha concentrada (Simulando o motivo do alerta)
                    if ((i > 340 || i < 40)) {
                        const distFromCenter = i > 340 ? (i - 340) : (i + 20);
                        const intensity = Math.sin(distFromCenter * 0.05) * 3.0;
                        pressure -= Math.max(1.0, intensity);
                    }

                    pressure = Math.min(7.0, Math.max(0.5, pressure));
                    const ratio = pressure / 7.0;

                    const dReal = pivoData.radius * ratio;
                    const pReal = [
                        pivoData.center.lat + (dReal / 111320) * Math.sin(angleRad),
                        pivoData.center.lng + (dReal / (111320 * Math.cos(pivoData.center.lat * Math.PI / 180))) * Math.cos(angleRad)
                    ];

                    const dWhite = pivoData.radius;
                    const pWhite = [
                        pivoData.center.lat + (dWhite / 111320) * Math.sin(angleRad),
                        pivoData.center.lng + (dWhite / (111320 * Math.cos(pivoData.center.lat * Math.PI / 180))) * Math.cos(angleRad)
                    ];

                    pressurePoints.push(pReal);
                    segments.push({ pReal, pWhite, pressure });
                }

                // A. Heat Map nos Vãos
                for (let i = 0; i < segments.length - 1; i++) {
                    const s1 = segments[i];
                    const s2 = segments[i + 1];
                    const gap = 7.0 - s1.pressure;

                    let color, opacity;
                    if (gap < 0.4) {
                        color = "#00d4ff";
                        opacity = 0.4;
                    } else {
                        const hue = Math.max(0, 60 - ((gap - 0.4) * 20));
                        color = `hsl(${hue}, 100%, 50%)`;
                        opacity = Math.min(0.85, 0.3 + (gap * 0.2));
                    }

                    L.polygon([s1.pReal, s1.pWhite, s2.pWhite, s2.pReal], {
                        color: 'transparent',
                        fillColor: color,
                        fillOpacity: opacity,
                        pointerEvents: 'none'
                    }).addTo(map);
                }

                // B. Miolo Azul
                L.polygon(pressurePoints, {
                    color: 'transparent',
                    fillColor: "#00d4ff",
                    fillOpacity: 0.4,
                    pointerEvents: 'none'
                }).addTo(map);

                map.setView(latlng, 16);
            } else {
                // Outras falhas mantêm o rastro clássico por enquanto
                const mockAngles = [0.5, 354.6, 354.0, 355.2];
                mockAngles.forEach(angle => {
                    const mathAngleRad = (90 - angle) * (Math.PI / 180);
                    for (let i = 0; i <= 60; i++) {
                        const dist = (pivoData.radius * i) / 60;
                        const fLat = pivoData.center.lat + (dist / 111320) * Math.sin(mathAngleRad);
                        const fLng = pivoData.center.lng + (dist / (111320 * Math.cos(pivoData.center.lat * Math.PI / 180))) * Math.cos(mathAngleRad);
                        const progress = i / 60;
                        const areaMetros = pivoData.radius * 0.05;

                        L.circle([fLat, fLng], {
                            radius: areaMetros * (1 + progress * 1.5),
                            color: 'transparent',
                            fillColor: '#facc15',
                            fillOpacity: 0.04,
                            interactive: false
                        }).addTo(map);

                        L.circle([fLat, fLng], {
                            radius: areaMetros * (0.6 + progress * 1.0),
                            color: 'transparent',
                            fillColor: '#fb923c',
                            fillOpacity: 0.06,
                            interactive: false
                        }).addTo(map);

                        if (progress > 0.1) {
                            L.circle([fLat, fLng], {
                                radius: areaMetros * (0.2 + progress * 0.5),
                                color: 'transparent',
                                fillColor: '#ef4444',
                                fillOpacity: 0.12,
                                interactive: false
                            }).addTo(map);
                        }
                    }
                });

                // Zoom na ponta da última falha registrada
                const mainRad = (90 - mockAngles[0]) * (Math.PI / 180);
                const tipLat = pivoData.center.lat + (pivoData.radius / 111320) * Math.sin(mainRad);
                const tipLng = pivoData.center.lng + (pivoData.radius / (111320 * Math.cos(pivoData.center.lat * Math.PI / 180))) * Math.cos(mainRad);
                map.setView([tipLat, tipLng], 18);
            }
        } else if (pivoData.geo && window.icMapParseWKT) {
            const geoJson = window.icMapParseWKT(pivoData.geo);
            if (geoJson) {
                const layer = L.geoJSON(geoJson, {
                    style: { color: "#fff", weight: 4, fill: false }
                }).addTo(map);
                map.fitBounds(layer.getBounds());
            }
        }

        setTimeout(() => map.invalidateSize(), 400);
    }

    function unbindEvents() {
        if (!eventsBound) return;
        eventsBound = false;

        if (onDocClick) {
            document.removeEventListener("click", onDocClick);
            onDocClick = null;
        }
    }

    function getFarmDataSafe() {
        return window.IcFarmGetActive?.() || window.icFarmData || window.IcFarmActive || null;
    }

    function renderPivotSelectorList() {
        const selectorMenu = $("pivoSelectorMenu");
        if (!selectorMenu) return;

        const farmData = getFarmDataSafe();
        const equipments = farmData?.equipments;

        // Sempre limpa para não duplicar
        selectorMenu.innerHTML = "";

        if (!Array.isArray(equipments)) {
            const empty = document.createElement("div");
            empty.style.padding = "10px 12px";
            empty.style.fontSize = "12px";
            empty.style.color = "#64748b";
            empty.textContent = "Nenhum pivô encontrado nesta fazenda.";
            selectorMenu.appendChild(empty);
            return;
        }

        // Aceita pivos/pivo e tolera variações
        const allPivots = equipments.filter((e) => {
            const cat = String(e?.category || "").toLowerCase();
            return cat === "pivos" || cat === "pivo" || cat === "pivot" || cat === "pivots";
        });

        if (!allPivots.length) {
            const empty = document.createElement("div");
            empty.style.padding = "10px 12px";
            empty.style.fontSize = "12px";
            empty.style.color = "#64748b";
            empty.textContent = "Nenhum pivô encontrado nesta fazenda.";
            selectorMenu.appendChild(empty);
            return;
        }

        allPivots.forEach((p) => {
            const btn = document.createElement("button");
            btn.type = "button";

            const isSelected = String(p.id) === String(state.selectedId);
            btn.className = "pivo-selector__item" + (isSelected ? " is-selected" : "");

            const label = p.name || p.nome || `Pivô ${String(p.id).slice(-4)}`;
            btn.innerHTML = isSelected
                ? `<i class="fa-solid fa-check"></i> <span>${label}</span>`
                : `<span>${label}</span>`;

            btn.addEventListener("click", (e) => {
                e.stopPropagation();
                const selectorMenuNow = $("pivoSelectorMenu");
                if (selectorMenuNow) selectorMenuNow.style.display = "none";

                if (!isSelected) {
                    // ✅ trocar pivô sem rematar eventos
                    window.IcPivos?.open?.({ pivotId: p.id });
                }
            });

            selectorMenu.appendChild(btn);
        });
    }

    function renderHeaderAndKPIs() {
        // Sempre monta lista
        renderPivotSelectorList();

        const pivoData = Pivos.data.getPivotData?.(state.selectedId);

        if (!pivoData) {
            const titleEl = document.querySelector(".pincard__title");
            if (titleEl) titleEl.textContent = "Pivô";
            return;
        }

        const titleEl = document.querySelector(".pincard__title");
        if (titleEl) titleEl.textContent = pivoData.name || "Pivô";

        // Aumentado timeout para garantir que o container esteja visível e com dimensões calculadas
        setTimeout(() => renderMinimap(pivoData), 300);
    }

    function safeInvalidateMinimap() {
        if (!minimapInstance) return;
        try {
            minimapInstance.invalidateSize(true);
        } catch (e) { }
    }

    function destroyMinimapOnly() {
        // ❗ NÃO mexe em eventos aqui. Só minimapa.
        if (minimapCenterMarker) {
            try {
                minimapCenterMarker.remove();
            } catch (e) { }
            minimapCenterMarker = null;
        }

        if (minimapLayer) {
            try {
                minimapLayer.remove();
            } catch (e) { }
            minimapLayer = null;
        }

        if (minimapInstance) {
            try {
                minimapInstance.remove();
            } catch (e) { }
            minimapInstance = null;
        }

        minimapTilesPrimary = null;
        minimapTilesFallback = null;
    }

    function renderMinimap(pivoData) {
        // 1. Localizar o elemento (usando querySelector para ser mais versátil se houver duplicates)
        const mapEl = document.querySelector("#pivoMinimap");
        if (!mapEl) return;

        // 2. Destruição rigorosa da instância anterior
        if (minimapInstance) {
            try {
                minimapInstance.off();
                minimapInstance.remove();
            } catch (e) {
                console.warn("[pivo minimap] Erro ao remover mapa:", e);
            }
            minimapInstance = null;
        }

        // 3. Limpeza total do DOM de qualquer vestígio do Leaflet
        const cleanElement = (el) => {
            if (el._leaflet_id) delete el._leaflet_id;
            el.innerHTML = "";
            el.className = "pincard__map"; // Remove leaflet-container, leaflet-fade-anim, etc.
        };

        // Limpa TODOS os elementos com esse ID (prevejo IDs duplicados no DOM)
        document.querySelectorAll("#pivoMinimap").forEach(cleanElement);

        // 4. Verificação de Visibilidade
        // Se o elemento não tem tamanho, o Leaflet gera o mapa cinza.
        if (mapEl.offsetHeight === 0) {
            console.log("[pivo minimap] Container sem altura, reagendando...");
            setTimeout(() => renderMinimap(pivoData), 200);
            return;
        }

        // 5. Nova Instância
        try {
            minimapInstance = L.map(mapEl, {
                zoomControl: false,
                attributionControl: false,
                dragging: false,
                scrollWheelZoom: false,
                doubleClickZoom: false,
                boxZoom: false,
                keyboard: false,
                tap: false,
                fadeAnimation: true,
                zoomSnap: 0
            });

            // 6. Tiles (ArcGIS Satellite)
            const tiles = L.tileLayer(
                "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
                { maxZoom: 19 }
            );
            tiles.addTo(minimapInstance);

            // Tiles Fallback (OSM)
            tiles.on("tileerror", () => {
                L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(minimapInstance);
            });

            // 7. Configuração da View
            const lat = pivoData?.center?.lat || -16.257;
            const lng = pivoData?.center?.lng || -47.413;
            const radius = pivoData?.radius || 300;

            minimapInstance.setView([lat, lng], 17);

            // 8. Desenho do Equipamento (Estilo Clássico Amarelo/Ouro do Mapa Principal)
            if (pivoData?.center) {
                const centerPt = [pivoData.center.lat, pivoData.center.lng];

                minimapLayer = L.circle(centerPt, {
                    radius: radius,
                    color: "#c78a1d",
                    weight: 2,
                    fillColor: "#d39b2b",
                    fillOpacity: 0.55,
                }).addTo(minimapInstance);

                // Desenhar Linha de Referência (Ângulo Zero) se existir
                if (pivoData.ref) {
                    const ang = bearingRad(pivoData.center, pivoData.ref);
                    const lineEnd = destinationPoint(pivoData.center, radius, ang);

                    // Linha Branca
                    L.polyline([centerPt, [lineEnd.lat, lineEnd.lng]], {
                        color: "#ffffff",
                        weight: 2,
                        opacity: 0.95
                    }).addTo(minimapInstance);

                    // Triângulo de indicação (Wedge)
                    const wedgeAngle = (8 * Math.PI) / 180;
                    const left = destinationPoint(pivoData.center, radius, ang - wedgeAngle);
                    const right = destinationPoint(pivoData.center, radius, ang + wedgeAngle);
                    const inner = destinationPoint(pivoData.center, radius * 0.7, ang);
                    L.polygon([
                        [left.lat, left.lng],
                        [right.lat, right.lng],
                        [inner.lat, inner.lng]
                    ], {
                        color: "#ffffff",
                        weight: 1,
                        fillColor: "#ffffff",
                        fillOpacity: 0.95
                    }).addTo(minimapInstance);
                }



                // Força o ajuste se as bordas forem maiores
                try {
                    minimapInstance.fitBounds(minimapLayer.getBounds(), {
                        padding: [-14, -14],
                        maxZoom: 14.5
                    });
                } catch (e) { }
            }
        } catch (err) {
            console.error("[pivo minimap] Falha crítica ao iniciar mapa:", err);
        }

        // 9. Ciclo de Invalidação Persistente (Solução definitiva para o "Gray Bug")
        const forceInval = () => {
            if (minimapInstance) {
                minimapInstance.invalidateSize();
            }
        };

        [100, 300, 600, 1200, 2500].forEach(ms => setTimeout(forceInval, ms));
    }

    async function showMainView() {
        document.body.classList.add("is-pivo-details");

        if (window.icMapSetWheelMode) window.icMapSetWheelMode("ctrl");

        await mountPanel();

        renderHeaderAndKPIs();

        if (views.charts && typeof views.charts.renderCharts === "function") {
            views.charts.renderCharts();
        }

        const map = window.icMap;
        if (map && typeof map.invalidateSize === "function") {
            map.invalidateSize({ pan: false });
            requestAnimationFrame(() => map.invalidateSize({ pan: false }));
            setTimeout(() => map.invalidateSize({ pan: false }), 180);
        }

        setTimeout(() => {
            const slot = $("pageSlot");
            if (slot) slot.scrollIntoView({ behavior: "smooth" });

            setTimeout(safeInvalidateMinimap, 120);
            setTimeout(safeInvalidateMinimap, 300);
        }, 350);
    }

    // ✅ usado no close da view (aí sim desliga eventos)
    function destroyView() {
        unbindEvents();
        destroyMinimapOnly();
    }

    async function updateSelected(pivotId) {
        state.selectedId = pivotId;

        const menu = $("pivoSelectorMenu");
        if (menu) menu.style.display = "none";

        // ✅ só destrói minimapa, NÃO remove eventos
        destroyMinimapOnly();

        renderHeaderAndKPIs();

        if (views.charts && typeof views.charts.renderCharts === "function") {
            views.charts.renderCharts();
        }

        const map = window.icMap;
        if (map && typeof map.invalidateSize === "function") {
            requestAnimationFrame(() => map.invalidateSize({ pan: false }));
        }
    }

    // Helpers Geográficos para desenhar o pivô exatamente como no mapa principal
    function bearingRad(from, to) {
        const toRad = (deg) => (deg * Math.PI) / 180;
        const lat1 = toRad(from.lat);
        const lat2 = toRad(to.lat);
        const dLng = toRad(to.lng - from.lng);
        const y = Math.sin(dLng) * Math.cos(lat2);
        const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
        return Math.atan2(y, x);
    }

    function destinationPoint(origin, distance, bearing) {
        const R = 6378137;
        const toRad = (deg) => (deg * Math.PI) / 180;
        const toDeg = (rad) => (rad * 180) / Math.PI;
        const delta = distance / R;
        const theta = bearing;
        const phi1 = toRad(origin.lat);
        const lambda1 = toRad(origin.lng);

        const sinPhi1 = Math.sin(phi1);
        const cosPhi1 = Math.cos(phi1);
        const sinDelta = Math.sin(delta);
        const cosDelta = Math.cos(delta);

        const sinPhi2 = sinPhi1 * cosDelta + cosPhi1 * sinDelta * Math.cos(theta);
        const phi2 = Math.asin(Math.max(-1, Math.min(1, sinPhi2)));
        const y = Math.sin(theta) * sinDelta * cosPhi1;
        const x = cosDelta - sinPhi1 * Math.sin(phi2);
        const lambda2 = lambda1 + Math.atan2(y, x);

        return { lat: toDeg(phi2), lng: toDeg(lambda2) };
    }

    detailsView.mountPanel = mountPanel;
    detailsView.showMainView = showMainView;
    detailsView.renderHeaderAndKPIs = renderHeaderAndKPIs;

    // IMPORTANTE: o index.js deve chamar destroyView() no close
    detailsView.destroyView = destroyView;

    // se você ainda chama destroyMinimap em algum lugar, mantenho apontando pro minimapa only
    detailsView.destroyMinimap = destroyMinimapOnly;

    detailsView.updateSelected = updateSelected;
})();