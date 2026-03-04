(function () {
    "use strict";

    const state = { isOpen: false };
    const $ = (id) => document.getElementById(id);

    function bindConfigUI() {
        const root = document.getElementById('configPanel');
        if (!root) return;

        // Back button triggers dashboard click
        const btnBack = root.querySelector('#configBack');
        if (btnBack) {
            btnBack.addEventListener('click', () => {
                const dash = document.querySelector('[data-route="dashboard"]');
                if (dash) dash.click();
            });
        }

        // Tabs logic
        const navItems = root.querySelectorAll('.pluv-edit__nav-item');
        const sections = root.querySelectorAll('.pluv-edit__section');
        const crumbsStrong = root.querySelector('.pluv-edit__crumbs strong');

        navItems.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const targetSelector = btn.getAttribute('data-target');
                if (!targetSelector) return;

                const target = root.querySelector(targetSelector);
                if (!target) return;

                navItems.forEach(b => b.classList.remove('is-active'));
                sections.forEach(s => s.classList.remove('is-active'));

                btn.classList.add('is-active');
                target.classList.add('is-active');

                if (crumbsStrong) crumbsStrong.textContent = btn.textContent;
            });
        });

        // Toggle buttons (UI only)
        root.addEventListener('click', (e) => {
            const btn = e.target.closest('.toggle-btn');
            if (btn) {
                const group = btn.closest('.toggle-group');
                if (group) {
                    group.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('is-active'));
                    btn.classList.add('is-active');
                }
                return;
            }

            // Eye icon toggle for passwords
            const eye = e.target.closest('.fa-eye, .fa-eye-slash');
            if (eye) {
                const input = eye.parentElement.querySelector('input');
                if (input) {
                    const isPassword = input.getAttribute('type') === 'password';
                    input.setAttribute('type', isPassword ? 'text' : 'password');
                    eye.classList.toggle('fa-eye-slash', !isPassword);
                    eye.classList.toggle('fa-eye', isPassword);
                }
                return;
            }

            // Advanced Dropdown toggle
            const select = e.target.closest('.js-advanced-select');
            if (select) {
                const dropdown = select.parentElement.querySelector('.advanced-dropdown-panel');
                if (dropdown) dropdown.classList.toggle('is-hidden');
                return;
            }

            // Close dropdown when clicking outside
            if (!e.target.closest('.custom-select-wrapper')) {
                root.querySelectorAll('.advanced-dropdown-panel').forEach(d => d.classList.add('is-hidden'));
            }

            // Select item logic
            const item = e.target.closest('.advanced-dropdown-item');
            if (item) {
                const value = item.getAttribute('data-value');
                const label = item.textContent.trim();
                const wrapper = item.closest('.custom-select-wrapper');

                if (wrapper) {
                    const labelSpan = wrapper.querySelector('#pivotActionLabel');
                    if (labelSpan) labelSpan.textContent = label;
                    wrapper.querySelector('.advanced-dropdown-panel').classList.add('is-hidden');

                    // Mark as active
                    wrapper.querySelectorAll('.advanced-dropdown-item').forEach(i => i.classList.remove('is-active'));
                    item.classList.add('is-active');

                    // Save to pending state
                    state.pendingPrefs = state.pendingPrefs || {};
                    state.pendingPrefs.pivotClickAction = value;
                }
                return;
            }

            // Save button logic
            const btnSave = e.target.closest('.btn-save-pref');
            if (btnSave) {
                let hasChanges = false;
                if (state.pendingPrefs) {
                    Object.keys(state.pendingPrefs).forEach(key => {
                        if (key === 'pivotClickAction') {
                            localStorage.setItem('ic:pivot-click-action', state.pendingPrefs[key]);
                            hasChanges = true;
                        }
                    });
                    delete state.pendingPrefs;
                }

                console.log("Config: Salvo com sucesso. Mudanças?", hasChanges);
                if (window.IcNotify) {
                    window.IcNotify.success('Configurações salvas com sucesso!');
                } else {
                    alert('Configurações salvas com sucesso!');
                }
                return;
            }
        });

        // Initialize values from localStorage
        const savedAction = localStorage.getItem('ic:pivot-click-action') || 'details';
        const labelSpan = root.querySelector('#pivotActionLabel');
        if (labelSpan) {
            const labels = { 'details': 'Ir para Detalhes', 'schedule': 'Abrir Agendamento Direto' };
            labelSpan.textContent = labels[savedAction] || 'Ir para Detalhes';

            // Mark the active item in dropdown
            root.querySelectorAll('.advanced-dropdown-item').forEach(item => {
                if (item.getAttribute('data-value') === savedAction) {
                    item.classList.add('is-active');
                } else {
                    item.classList.remove('is-active');
                }
            });
        }

        console.log("Config UI Bound");
    }

    async function open() {
        if (state.isOpen) return;
        state.isOpen = true;

        document.body.classList.add("is-farm-edit");
        const mapCard = $("mapCard");
        if (mapCard) mapCard.style.display = "none";

        const slot = $("pageSlot");
        if (slot) {
            const html = await fetch("./pages/config.html").then(r => r.text());
            slot.innerHTML = html;
            bindConfigUI();
        }

        window.dispatchEvent(new Event("ic:layout-change"));
    }

    function close() {
        state.isOpen = false;
        document.body.classList.remove("is-farm-edit");
        const slot = $("pageSlot");
        if (slot) slot.innerHTML = "";
        const mapCard = $("mapCard");
        if (mapCard) mapCard.style.display = "";

        const map = window.icMap;
        if (map && typeof map.invalidateSize === "function") {
            map.invalidateSize({ pan: false });
        }
    }

    window.IcConfig = { open, close };

})();
