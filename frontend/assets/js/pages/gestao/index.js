// assets/js/pages/gestao/index.js
(function () {
    "use strict";

    async function mountGestaoView() {
        const slot = document.getElementById("pageSlot");
        if (!slot) return;
        const html = await fetch("./pages/gestao.html").then((r) => r.text());
        slot.innerHTML = html;
        initGestaoUI(slot);
    }

    function getFarms() {
        const state = window.CreateFarm?.state;
        const fromState = Array.isArray(state?.farms) ? state.farms : [];
        if (fromState.length) return fromState;
        try {
            const stored = JSON.parse(localStorage.getItem("ic_farms") || "[]");
            if (Array.isArray(stored)) return stored;
        } catch (_) { }
        return [];
    }

    function initGestaoUI(root) {
        const farms = getFarms();
        const activeId = localStorage.getItem("ic_active_farm") || localStorage.getItem("ic_active_farm_id");
        const defaultFarm = farms.find(f => f.id === activeId) || farms[0];

        const selectedFarms = new Set();
        if (defaultFarm) {
            selectedFarms.add(defaultFarm.id);
        }

        const multi = root.querySelector("[data-gestao-farm-multi]");
        const chipsHost = root.querySelector("[data-gestao-farm-chips]");
        const searchInput = root.querySelector("[data-gestao-farm-search]");
        const dropdown = root.querySelector("[data-gestao-farm-dropdown]");
        const listHost = root.querySelector("[data-gestao-farm-list]");
        const devicesContainer = document.getElementById("gestaoDevicesContainer");

        function renderChips() {
            if (!chipsHost) return;
            chipsHost.innerHTML = "";
            const selectedItems = farms.filter((f) => selectedFarms.has(f.id));
            const visible = selectedItems.slice(0, 3);
            const extraCount = selectedItems.length - visible.length;

            visible.forEach((f) => {
                const chip = document.createElement("span");
                chip.className = "gestao-op__chip";
                chip.innerHTML = `${f.name || 'Fazenda'}`;
                const remove = document.createElement("button");
                remove.type = "button";
                remove.innerHTML = "&times;";
                remove.addEventListener("click", (e) => {
                    e.stopPropagation();
                    selectedFarms.delete(f.id);
                    renderAll();
                });
                chip.appendChild(remove);
                chipsHost.appendChild(chip);
            });

            if (extraCount > 0) {
                const chip = document.createElement("span");
                chip.className = "gestao-op__chip gestao-op__chip--count";
                chip.textContent = `+ ${extraCount}`;
                chipsHost.appendChild(chip);
            }

            if (searchInput) {
                if (selectedItems.length > 0) {
                    searchInput.placeholder = "";
                } else {
                    searchInput.placeholder = "Selecione as fazendas";
                }
            }
        }

        function renderList(filterStr = "") {
            if (!listHost) return;
            listHost.innerHTML = "";
            const term = filterStr.trim().toLowerCase();
            const filtered = farms.filter((f) => (f.name || 'Fazenda').toLowerCase().includes(term));

            filtered.forEach((f) => {
                const item = document.createElement("div");
                item.className = "gestao-op__item";
                if (selectedFarms.has(f.id)) item.classList.add("is-selected");
                item.textContent = f.name || 'Fazenda';

                const check = document.createElement("span");
                check.className = "check";
                check.innerHTML = '<i class="fa-solid fa-check"></i>';
                item.appendChild(check);

                item.addEventListener("click", () => {
                    if (selectedFarms.has(f.id)) selectedFarms.delete(f.id);
                    else selectedFarms.add(f.id);
                    renderAll();
                });
                listHost.appendChild(item);
            });
        }

        function getCardIcon(category, type) {
            if (category === 'pivos') {
                return `<div class="gestao-op__card-icon gestao-op__card-icon--pivot"><div class="pivot-icon-mock"></div></div>`;
            } else if (category === 'bombas' || type === 'irripump') {
                return `<div class="gestao-op__card-icon"><img src="./assets/img/svg/irripump.svg" alt="Bomba"></div>`;
            } else if (category === 'medidores') {
                return `<div class="gestao-op__card-icon"><img src="./assets/img/svg/radar.svg" alt="Medidor"></div>`;
            } else {
                return `<div class="gestao-op__card-icon"><img src="./assets/img/svg/cpu.svg" alt="Equip"></div>`;
            }
        }

        function getCardActions(category) {
            if (category === 'pivos') {
                return `
                    <button class="btn btn--success" type="button"><i class="fa-solid fa-play"></i> Iniciar Pivô</button>
                    <button class="btn btn--danger-outline" type="button"><i class="fa-solid fa-pause"></i> Parar Pivô</button>
                `;
            } else if (category === 'bombas') {
                return `
                    <button class="btn btn--success" type="button"><i class="fa-solid fa-play"></i> Ligar Bomba</button>
                    <button class="btn btn--danger-outline" type="button"><i class="fa-solid fa-pause"></i> Desligar Bomba</button>
                `;
            }
            return `
                <button class="btn btn--success" type="button"><i class="fa-solid fa-check"></i> Reconhecer</button>
            `;
        }

        function renderDevices() {
            if (!devicesContainer) return;
            devicesContainer.innerHTML = "";

            const activeFarms = farms.filter(f => selectedFarms.has(f.id));

            let allEquips = [];
            activeFarms.forEach(f => {
                const eq = Array.isArray(f.equipments) ? f.equipments : [];
                eq.forEach(e => {
                    if (e.category === 'pivos' || e.category === 'bombas' || e.type === 'irripump') {
                        allEquips.push({ ...e, _farmName: f.name || 'Fazenda' });
                    }
                });
            });

            if (!allEquips.length) {
                devicesContainer.innerHTML = `<p style="font-size:12px;color:#94a3b8;">Não há dispositivos encontrados para a(s) fazenda(s) selecionada(s).</p>`;
                return;
            }

            // Sort pivos first
            allEquips.sort((a, b) => {
                const isPivoA = a.category === 'pivos' ? -1 : 1;
                const isPivoB = b.category === 'pivos' ? -1 : 1;
                if (isPivoA !== isPivoB) return isPivoA - isPivoB;
                return (a.name || '').localeCompare(b.name || '');
            });

            allEquips.forEach(eq => {
                const nome = eq.name || eq.id || 'Equipamento';
                const statusBadge = (eq.category === 'pivos') ? 'PARADO - 100%' : 'ONLINE';
                const badgeClass = (eq.category === 'pivos') ? 'gestao-op__badge--warning' : 'gestao-op__badge--success';

                const dateNow = new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

                const el = document.createElement("div");
                el.className = "gestao-op__card";
                el.innerHTML = `
                    <div class="gestao-op__card-header">
                        ${getCardIcon(eq.category, eq.type)}
                        <div class="gestao-op__card-info">
                            <div class="gestao-op__card-title-row">
                                <span class="gestao-op__card-title">${nome}</span>
                                <span class="gestao-op__badge ${badgeClass}" ${badgeClass === 'gestao-op__badge--success' ? 'style="background-color:#10b981;color:#fff;"' : ''}>${statusBadge}</span>
                            </div>
                            <div class="gestao-op__card-subtitle">
                                <strong>${eq._farmName}</strong> | ${dateNow}
                            </div>
                        </div>
                        <div class="gestao-op__card-actions">
                            ${getCardActions(eq.category)}
                        </div>
                    </div>
                    <div class="gestao-op__card-footer">
                        <button class="gestao-op__history-btn" type="button"><i class="fa-solid fa-chevron-right"></i> Histórico</button>
                        <button class="gestao-op__refresh-btn" type="button"><i class="fa-solid fa-rotate-right"></i> Atualizar</button>
                    </div>
                `;
                devicesContainer.appendChild(el);
            });
        }

        function renderAll() {
            renderChips();
            renderList(searchInput?.value || "");
            renderDevices();
        }

        if (multi) {
            multi.addEventListener("click", (e) => {
                dropdown?.classList.add("is-open");
                dropdown?.setAttribute("aria-hidden", "false");
                searchInput?.focus();
            });

            document.addEventListener("click", (e) => {
                if (multi.contains(e.target)) return;
                dropdown?.classList.remove("is-open");
                dropdown?.setAttribute("aria-hidden", "true");
            });

            if (searchInput) {
                searchInput.addEventListener("input", () => renderList(searchInput.value));
            }
        }

        renderAll();
    }

    function hideMapCard() {
        const mapCard = document.getElementById("mapCard");
        if (mapCard) mapCard.style.display = "none";
    }

    function showMapCard() {
        const mapCard = document.getElementById("mapCard");
        if (mapCard) mapCard.style.display = "";
    }

    window.IcGestao = {
        async open() {
            document.body.classList.add("is-gestao");
            hideMapCard();
            await mountGestaoView();
            window.dispatchEvent(new Event("ic:layout-change"));
        },

        close() {
            document.body.classList.remove("is-gestao");
            const slot = document.getElementById("pageSlot");
            if (slot) slot.innerHTML = "";
            showMapCard();
            window.dispatchEvent(new Event("ic:layout-change"));
        },
    };
})();
