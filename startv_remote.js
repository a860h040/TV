(() => {
  const FOCUSABLE_SEL =
    'a[href],button,input,select,textarea,[tabindex]:not([tabindex="-1"])';

  const visible = (el) => {
    if (!el) return false;
    const r = el.getBoundingClientRect();
    return !!(r.width && r.height);
  };

  const getFocusables = () =>
    Array.from(document.querySelectorAll(FOCUSABLE_SEL))
      .filter(el => !el.disabled && visible(el));

  function addFocusClass() {
    getFocusables().forEach(el => el.classList.add("startv-focus"));
  }

  function focusFirst() {
    const list = getFocusables();
    if (list.length) list[0].focus();
  }

  function moveFocus(dir) {
    const list = getFocusables();
    if (!list.length) return;

    const curr = document.activeElement;
    const cr = (curr && curr.getBoundingClientRect) ? curr.getBoundingClientRect() : null;
    if (!cr || !visible(curr)) return focusFirst();

    const cx = (cr.left + cr.right) / 2;
    const cy = (cr.top + cr.bottom) / 2;

    let best = null;
    let bestScore = Infinity;

    for (const el of list) {
      if (el === curr) continue;
      const r = el.getBoundingClientRect();
      const ex = (r.left + r.right) / 2;
      const ey = (r.top + r.bottom) / 2;

      const dx = ex - cx;
      const dy = ey - cy;

      // directional filter
      if (dir === "left"  && dx >= -5) continue;
      if (dir === "right" && dx <=  5) continue;
      if (dir === "up"    && dy >= -5) continue;
      if (dir === "down"  && dy <=  5) continue;

      const primary = (dir === "left" || dir === "right") ? Math.abs(dx) : Math.abs(dy);
      const secondary = (dir === "left" || dir === "right") ? Math.abs(dy) : Math.abs(dx);

      const score = primary * 1.0 + secondary * 0.35;
      if (score < bestScore) {
        bestScore = score;
        best = el;
      }
    }

    if (best) best.focus();
  }

  window.addEventListener("startv:ready", () => {
    addFocusClass();
    setTimeout(() => {
      addFocusClass();
      focusFirst();
    }, 300);
  });

  document.addEventListener("keydown", (e) => {
    // Don’t steal keys while typing
    const tag = (document.activeElement?.tagName || "").toLowerCase();
    const typing = tag === "input" || tag === "textarea";
    if (typing) return;

    switch (e.key) {
      case "ArrowLeft":  e.preventDefault(); moveFocus("left"); break;
      case "ArrowRight": e.preventDefault(); moveFocus("right"); break;
      case "ArrowUp":    e.preventDefault(); moveFocus("up"); break;
      case "ArrowDown":  e.preventDefault(); moveFocus("down"); break;
      // OK/Enter normally triggers click automatically when focused
    }
  }, true);
})();
