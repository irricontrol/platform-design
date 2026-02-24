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

  // Acordeão das seções
  const sections = document.querySelectorAll(".nav__section");
  sections.forEach(section => {
    const title = section.querySelector(".nav__title");
    if (title) {
      title.addEventListener("click", () => {
        section.classList.toggle("is-collapsed");
        const isCollapsed = section.classList.contains("is-collapsed");
        title.setAttribute("aria-expanded", !isCollapsed);
      });
    }
  });

  // Mantém teu highlight de rota
  const items = document.querySelectorAll(".nav__item");
  items.forEach(item => {
    item.addEventListener("click", (e) => {
      // e.preventDefault(); // Comentado para permitir navegação real se necessário
      items.forEach(i => i.classList.remove("is-active"));
      item.classList.add("is-active");

      // Se clicar em um item e a seção estiver colapsada, expande ela (opcional)
      const parentSection = item.closest(".nav__section");
      if (parentSection && parentSection.classList.contains("is-collapsed")) {
        parentSection.classList.remove("is-collapsed");
        parentSection.querySelector(".nav__title")?.setAttribute("aria-expanded", "true");
      }
    });
  });
})();
