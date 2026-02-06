// sidebar.js
(function () {
  const app = document.querySelector(".app");
  const btn = document.getElementById("btnSidebarToggle");

  if (!app || !btn) return;

  // Carregar preferência
  const saved = localStorage.getItem("ic_sidebar_collapsed");
  if (saved === "1") app.classList.add("is-collapsed");

  btn.addEventListener("click", () => {
    app.classList.toggle("is-collapsed");
    localStorage.setItem("ic_sidebar_collapsed", app.classList.contains("is-collapsed") ? "1" : "0");

    // Notifica que o layout mudou (ex.: largura do mapa)
    window.dispatchEvent(new CustomEvent("ic:layout-change", {
      detail: { sidebarCollapsed: app.classList.contains("is-collapsed") }
    }));
  });

  // Mantém teu highlight de rota (se você quiser)
  const items = document.querySelectorAll(".nav__item");
  items.forEach(item => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      items.forEach(i => i.classList.remove("is-active"));
      item.classList.add("is-active");
    });
  });
})();
