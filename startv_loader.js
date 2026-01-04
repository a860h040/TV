(() => {
  const REMOTE_URL = "https://a860h040.github.io/TV/index3.html";
  const REMOTE_BASE = new URL(".", REMOTE_URL).href;

  const bootEl = document.getElementById("boot");
  const appEl  = document.getElementById("app");

  const showError = (err) => {
    console.error(err);
    bootEl.textContent = "Failed to load. Check network / URL.";
  };

  async function loadRemote() {
    const res = await fetch(REMOTE_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status} loading ${REMOTE_URL}`);
    const html = await res.text();

    const doc = new DOMParser().parseFromString(html, "text/html");

    // Ensure relative URLs work
    const base = document.createElement("base");
    base.href = REMOTE_BASE;
    document.head.appendChild(base);

    // Copy stylesheets + inline styles
    doc.head.querySelectorAll('link[rel="stylesheet"], style').forEach(node => {
      document.head.appendChild(node.cloneNode(true));
    });

    // Inject body HTML into our container
    appEl.innerHTML = doc.body.innerHTML;

    // Re-run scripts in original order
    const scripts = Array.from(doc.querySelectorAll("script"));
    for (const s of scripts) {
      const ns = document.createElement("script");

      // Copy attributes (type/module/etc.)
      for (const attr of Array.from(s.attributes)) {
        ns.setAttribute(attr.name, attr.value);
      }

      if (s.src) {
        ns.src = new URL(s.getAttribute("src"), REMOTE_BASE).href;
        ns.async = false;
        await new Promise((resolve) => {
          ns.onload = resolve;
          ns.onerror = resolve;
          document.body.appendChild(ns);
        });
      } else {
        ns.textContent = s.textContent || "";
        document.body.appendChild(ns);
      }
    }

    bootEl.remove();
    window.dispatchEvent(new Event("startv:ready"));
  }

  loadRemote().catch(showError);
})();
