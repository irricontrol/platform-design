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

  function go(route) {
    if (route === 'pluviometria') {
      setActive('pluviometria');
      window.IcChuvaGeo?.resetDefaults?.();
      window.IcPluviometria?.open?.();
      window.IcChuvaGeo?.open?.();
      return;
    }

    // default: volta para o mapa normal
    setActive('mapa');
    window.IcPluviometria?.close?.();
    window.IcChuvaGeo?.close?.();
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

