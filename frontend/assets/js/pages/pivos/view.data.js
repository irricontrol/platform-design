// assets/js/pages/pivos/view.data.js
(function () {
    "use strict";

    const Pivos = (window.Pivos = window.Pivos || {});
    const data = (Pivos.data = Pivos.data || {});

    function getPivotData(pivotId) {
        console.log("Data layer: fetching data for pivot", pivotId);

        const farm = window.IcFarmGetActive?.() || window.IcFarmActive;
        let pivotObj = null;

        if (farm && farm.equipments && Array.isArray(farm.equipments)) {
            pivotObj = farm.equipments.find(e => e.id === pivotId && e.category === 'pivos');
        }

        let center = null;
        let ref = null;
        let radius = null;

        if (pivotObj && pivotObj.data) {
            const d = pivotObj.data;

            // Centro
            const lat = parseFloat(d.centerLat || d.lat);
            const lng = parseFloat(d.centerLng || d.lng);

            if (!isNaN(lat) && !isNaN(lng)) {
                center = { lat, lng };
            } else if (typeof d.center === 'string' && d.center.includes(',')) {
                const parts = d.center.split(',');
                center = { lat: parseFloat(parts[0]), lng: parseFloat(parts[1]) };
            } else if (typeof d.loc === 'string' && d.loc.includes(',')) {
                const parts = d.loc.split(',');
                center = { lat: parseFloat(parts[0]), lng: parseFloat(parts[1]) };
            }

            // Referência (Ângulo 0)
            const rLat = parseFloat(d.refLat);
            const rLng = parseFloat(d.refLng);
            if (!isNaN(rLat) && !isNaN(rLng)) {
                ref = { lat: rLat, lng: rLng };
            } else if (typeof d.ref === 'string' && d.ref.includes(',')) {
                const parts = d.ref.split(',');
                ref = { lat: parseFloat(parts[0]), lng: parseFloat(parts[1]) };
            }

            radius = parseFloat(d.radius);
            if (isNaN(radius) || radius <= 0) {
                if (center && ref) {
                    // Se tivermos centro e ref, podemos calcular o raio real se necessário
                    // mas por enquanto mantemos fallback se não vier no 'radius'
                    radius = 350;
                } else {
                    radius = 300;
                }
            }
        }

        return {
            id: pivotId,
            name: pivotObj?.name || `Pivô ${pivotId ? pivotId.substring(pivotId.length - 4) : "Desconhecido"}`,
            status: pivotObj?.status || "running",
            geo: pivotObj?.geo || null,
            center: center,
            ref: ref,
            radius: radius
        };
    }

    data.getPivotData = getPivotData;
})();
