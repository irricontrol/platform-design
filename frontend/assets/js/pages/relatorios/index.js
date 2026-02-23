// assets/js/pages/relatorios/index.js
(function () {
  "use strict";

  async function mountReportView() {
    const slot = document.getElementById("pageSlot");
    if (!slot) return;
    const html = await fetch("./pages/relatorios.html").then((r) => r.text());
    slot.innerHTML = html;
    initReportUI(slot);
  }

  function hideMapCard() {
    const mapCard = document.getElementById("mapCard");
    if (mapCard) mapCard.style.display = "none";
  }

  function showMapCard() {
    const mapCard = document.getElementById("mapCard");
    if (mapCard) mapCard.style.display = "";
  }

  window.IcRelatorios = {
    async open() {
      document.body.classList.add("is-relatorios");
      hideMapCard();
      await mountReportView();
      window.dispatchEvent(new Event("ic:layout-change"));
    },

    close() {
      document.body.classList.remove("is-relatorios");
      const slot = document.getElementById("pageSlot");
      if (slot) slot.innerHTML = "";
      showMapCard();
      window.dispatchEvent(new Event("ic:layout-change"));
    },
  };

  function getFarmData() {
    const state = window.CreateFarm?.state;
    const farms = Array.isArray(state?.farms) ? state.farms : [];
    const activeId =
      state?.currentFarmId ||
      localStorage.getItem("ic_active_farm") ||
      localStorage.getItem("ic_active_farm_id");
    let farm = farms.find((item) => item.id === activeId) || farms[0];

    if (!farm) {
      try {
        const stored = JSON.parse(localStorage.getItem("ic_farms") || "[]");
        if (Array.isArray(stored)) {
          farm = stored.find((item) => item.id === activeId) || stored[0];
        }
      } catch (_) {}
    }

    return farm || null;
  }

  function getPivotList(farm) {
    const list = (farm?.equipments || []).filter((item) => item.category === "pivos");
    if (!list.length) {
      return Array.from({ length: 8 }, (_, i) => ({
        id: `pivo_${i + 1}`,
        name: `Pivô ${String(i + 1).padStart(2, "0")}`,
      }));
    }
    return list.map((item, index) => ({
      id: item.id || `pivo_${index + 1}`,
      name: item.name || item.label || `Pivô ${String(index + 1).padStart(2, "0")}`,
    }));
  }

  const DEFAULT_ACC_OUTLINE = [
    { a: 350, r: 0.8 }, { a: 20, r: 0.82 }, { a: 70, r: 0.82 }, { a: 110, r: 0.8 },
    { a: 145, r: 0.78 }, { a: 170, r: 0.78 },
    { a: 190, r: 0.78 }, { a: 190, r: 0.55 }, { a: 215, r: 0.55 }, { a: 215, r: 0.78 },
    { a: 240, r: 0.78 },
    { a: 255, r: 0.78 }, { a: 255, r: 0.38 }, { a: 285, r: 0.38 }, { a: 285, r: 0.78 },
    { a: 305, r: 0.78 }, { a: 305, r: 0.5 }, { a: 330, r: 0.5 }, { a: 330, r: 0.78 },
  ];

  function parseOutline(raw) {
    if (!raw) return DEFAULT_ACC_OUTLINE;
    const points = raw.split(",").map((item) => {
      const [a, r] = item.trim().split(":");
      const angle = Number(a);
      const radius = Number(r);
      if (Number.isNaN(angle) || Number.isNaN(radius)) return null;
      return { a: angle, r: radius };
    }).filter(Boolean);
    return points.length ? points : DEFAULT_ACC_OUTLINE;
  }

  function drawPivotAccum(canvas, cfg) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const W = rect.width;
    const H = rect.height;
    ctx.clearRect(0, 0, W, H);

    const cx = W / 2;
    const cy = H / 2;
    const R = Math.min(W, H) / 2 - 2;
    const ringCount = cfg.ringCount ?? 3;

    const deg2rad = (d) => (d * Math.PI) / 180;
    const polar = (angleDeg, radius01) => {
      const a = deg2rad(angleDeg - 90);
      const r = radius01 * R;
      return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r };
    };

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.shadowColor = "rgba(15,23,42,0.10)";
    ctx.shadowBlur = 18;
    ctx.fillStyle = "rgba(255,255,255,1)";
    ctx.fill();
    ctx.restore();

    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    const face = ctx.createRadialGradient(cx, cy - R * 0.2, R * 0.15, cx, cy, R);
    face.addColorStop(0, "#ffffff");
    face.addColorStop(0.6, "#f8fafc");
    face.addColorStop(1, "#f1f5f9");
    ctx.fillStyle = face;
    ctx.fill();
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 2;
    ctx.stroke();

    for (let i = 1; i <= ringCount; i += 1) {
      const rr = (R * i) / ringCount;
      ctx.beginPath();
      ctx.arc(cx, cy, rr, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(15,23,42,0.07)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    const outline = cfg.outline ?? DEFAULT_ACC_OUTLINE;
    const pts = outline.map((p) => polar(p.a, p.r));
    if (pts.length) {
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i += 1) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.closePath();

      ctx.fillStyle = "rgba(59,130,246,0.20)";
      ctx.fill();

      ctx.strokeStyle = "rgba(59,130,246,0.55)";
      ctx.lineWidth = 2.5;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.stroke();

    }

    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(148,163,184,0.9)";
    ctx.fill();
  }

  function initReportUI(root) {
    const farm = getFarmData();
    const farmName = farm?.name || "Fazenda";
    const titleEl = root.querySelector("[data-report-farm]");
    if (titleEl) titleEl.textContent = farmName;

    const reportRoot = root.querySelector(".farm-report") || root;
    const tabs = Array.from(root.querySelectorAll(".farm-report__tab"));
    const weekWrap = root.querySelector("[data-report-week]");
    const weekToggle = weekWrap?.querySelector(".farm-report__week-input");
    const monthWrap = root.querySelector("[data-report-month-picker]");
    const monthToggle = root.querySelector("[data-report-month-toggle]");
    const quarterWrap = root.querySelector("[data-report-quarter-picker]");
    const quarterToggle = root.querySelector("[data-report-quarter-toggle]");

    function setPeriod(period) {
      if (reportRoot) reportRoot.dataset.reportPeriod = period;
      tabs.forEach((tab) => {
        const isActive = tab.textContent?.trim().toLowerCase() === periodLabel(period);
        tab.classList.toggle("is-active", isActive);
        tab.setAttribute("aria-selected", String(isActive));
      });
      if (weekWrap && period !== "weekly") weekWrap.classList.remove("is-open");
      if (monthWrap && period !== "monthly") monthWrap.classList.remove("is-open");
      if (quarterWrap && period !== "quarterly") quarterWrap.classList.remove("is-open");
    }

    function periodLabel(period) {
      if (period === "weekly") return "semanal";
      if (period === "monthly") return "mensal";
      return "trimestral";
    }

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const label = tab.textContent?.trim().toLowerCase();
        if (label === "semanal") setPeriod("weekly");
        else if (label === "mensal") setPeriod("monthly");
        else setPeriod("quarterly");
      });
    });

    setPeriod("weekly");

    if (weekToggle) {
      weekToggle.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        weekWrap?.classList.toggle("is-open");
      });
    }

    document.addEventListener("click", (event) => {
      if (!weekWrap) return;
      if (weekWrap.contains(event.target)) return;
      weekWrap.classList.remove("is-open");
    });

    if (monthToggle && monthWrap) {
      monthToggle.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        monthWrap.classList.toggle("is-open");
      });
    }

    document.addEventListener("click", (event) => {
      if (!monthWrap) return;
      if (monthWrap.contains(event.target)) return;
      monthWrap.classList.remove("is-open");
    });

    if (quarterToggle && quarterWrap) {
      quarterToggle.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        quarterWrap.classList.toggle("is-open");
      });
    }

    document.addEventListener("click", (event) => {
      if (!quarterWrap) return;
      if (quarterWrap.contains(event.target)) return;
      quarterWrap.classList.remove("is-open");
    });

    const monthInput = root.querySelector("[data-report-month]");
    if (monthInput && !monthInput.value) {
      const now = new Date();
      const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      monthInput.value = ym;
    }

    const multi = root.querySelector("[data-report-multi]");
    if (!multi) return;

    const chipsHost = multi.querySelector("[data-report-chips]");
    const searchInput = multi.querySelector("[data-report-search]");
    const dropdown = multi.querySelector("[data-report-dropdown]");
    const listHost = multi.querySelector("[data-report-list]");
    const selectAllBtn = multi.querySelector("[data-report-select-all]");

    const pivots = getPivotList(farm);
    const selected = new Set(pivots.slice(0, 3).map((p) => p.id));

    function renderChips() {
      if (!chipsHost) return;
      chipsHost.innerHTML = "";

      const selectedItems = pivots.filter((p) => selected.has(p.id));
      const visible = selectedItems.slice(0, 3);
      const extraCount = selectedItems.length - visible.length;

      visible.forEach((p) => {
        const chip = document.createElement("span");
        chip.className = "farm-report__chip";
        chip.textContent = p.name;
        const remove = document.createElement("button");
        remove.type = "button";
        remove.textContent = "×";
        remove.addEventListener("click", (e) => {
          e.stopPropagation();
          selected.delete(p.id);
          renderAll();
        });
        chip.appendChild(remove);
        chipsHost.appendChild(chip);
      });

      if (extraCount > 0) {
        const chip = document.createElement("span");
        chip.className = "farm-report__chip farm-report__chip--count";
        chip.textContent = `+ ${extraCount}`;
        chipsHost.appendChild(chip);
      }
    }

    function renderList(filter = "") {
      if (!listHost) return;
      listHost.innerHTML = "";
      const term = filter.trim().toLowerCase();
      const filtered = pivots.filter((p) => p.name.toLowerCase().includes(term));

      filtered.forEach((p) => {
        const item = document.createElement("div");
        item.className = "farm-report__item";
        if (selected.has(p.id)) item.classList.add("is-selected");
        item.textContent = p.name;

        const check = document.createElement("span");
        check.className = "check";
        check.innerHTML = '<i class="fa-solid fa-check"></i>';
        item.appendChild(check);

        item.addEventListener("click", () => {
          if (selected.has(p.id)) selected.delete(p.id);
          else selected.add(p.id);
          renderAll();
        });
        listHost.appendChild(item);
      });
    }

    function renderAll() {
      renderChips();
      renderList(searchInput?.value || "");
    }

    function openDropdown() {
      if (!dropdown) return;
      dropdown.classList.add("is-open");
      dropdown.setAttribute("aria-hidden", "false");
    }

    function closeDropdown() {
      if (!dropdown) return;
      dropdown.classList.remove("is-open");
      dropdown.setAttribute("aria-hidden", "true");
    }

    multi.addEventListener("click", (e) => {
      if (e.target.closest("[data-report-select-all]")) return;
      openDropdown();
      searchInput?.focus();
    });

    document.addEventListener("click", (e) => {
      if (multi.contains(e.target)) return;
      closeDropdown();
    });

    if (searchInput) {
      searchInput.addEventListener("input", () => renderList(searchInput.value));
      searchInput.addEventListener("focus", () => openDropdown());
    }

    if (selectAllBtn) {
      selectAllBtn.addEventListener("click", (e) => {
        e.preventDefault();
        const allSelected = selected.size === pivots.length;
        selected.clear();
        if (!allSelected) pivots.forEach((p) => selected.add(p.id));
        renderAll();
      });
    }

    renderAll();

    const headRow = root.querySelector("[data-report-head-row]");
    const bodyRow = root.querySelector("[data-report-body]");
    if (headRow && bodyRow) {
      const syncHead = () => {
        headRow.scrollLeft = bodyRow.scrollLeft;
      };
      bodyRow.addEventListener("scroll", syncHead, { passive: true });
      syncHead();
    }

    const accumPivots = root.querySelectorAll(".farm-report__pivot--accum");
    accumPivots.forEach((accumPivot) => {
      const canvas = accumPivot.querySelector("canvas");
      const outline = parseOutline(accumPivot.dataset.accOutline);
      const ringCount = Number(accumPivot.dataset.accRings) || 3;
      if (canvas) {
        requestAnimationFrame(() => {
          drawPivotAccum(canvas, { outline, ringCount });
        });
      }
    });

    if (!document.documentElement.dataset.reportArrowScroll) {
      document.documentElement.dataset.reportArrowScroll = "true";
      const scrollState = { dir: 0, raf: 0 };

      const stepScroll = () => {
        if (!scrollState.dir) {
          scrollState.raf = 0;
          return;
        }

        if (!document.body.classList.contains("is-relatorios")) {
          scrollState.dir = 0;
          scrollState.raf = 0;
          return;
        }

        const timelineWrap = document.querySelector(".farm-report__timeline-wrap");
        if (!timelineWrap || timelineWrap.scrollWidth <= timelineWrap.clientWidth) {
          scrollState.dir = 0;
          scrollState.raf = 0;
          return;
        }

        const speed = Math.max(1, Math.round(timelineWrap.clientWidth * 0.004));
        timelineWrap.scrollLeft += scrollState.dir * speed;
        scrollState.raf = requestAnimationFrame(stepScroll);
      };

      document.addEventListener("keydown", (event) => {
        if (!document.body.classList.contains("is-relatorios")) return;
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;

        const active = document.activeElement;
        if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA" || active.isContentEditable)) {
          return;
        }

        const timelineWrap = document.querySelector(".farm-report__timeline-wrap");
        if (!timelineWrap || timelineWrap.scrollWidth <= timelineWrap.clientWidth) return;

        event.preventDefault();
        const dir = event.key === "ArrowRight" ? 1 : -1;
        if (!event.repeat && scrollState.dir !== dir) {
          const jump = Math.max(20, Math.round(timelineWrap.clientWidth * 0.04));
          timelineWrap.scrollLeft += dir * jump;
        }

        scrollState.dir = dir;
        if (!scrollState.raf) scrollState.raf = requestAnimationFrame(stepScroll);
      });

      document.addEventListener("keyup", (event) => {
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
        scrollState.dir = 0;
      });

      window.addEventListener("blur", () => {
        scrollState.dir = 0;
      });
    }
  }
})();
