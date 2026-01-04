(() => {
  const frame = document.getElementById("frame");
  const overlay = document.getElementById("playerOverlay");
  const video = document.getElementById("playerVideo");
  const osd = document.getElementById("osd");

  function showOSD(msg, ms = 1200) {
    osd.textContent = msg;
    osd.style.display = "block";
    clearTimeout(showOSD._t);
    showOSD._t = setTimeout(() => (osd.style.display = "none"), ms);
  }

  function isVideoUrl(url) {
    try {
      const u = new URL(url, location.href);
      const p = u.pathname.toLowerCase();
      return (
        p.endsWith(".m3u8") ||
        p.endsWith(".mp4") ||
        p.endsWith(".webm") ||
        p.endsWith(".mpd") ||
        p.endsWith(".mkv") // may NOT play on webOS; depends on TV codec support
      );
    } catch {
      return false;
    }
  }

  function openPlayer(url) {
    const abs = new URL(url, frame.contentWindow.location.href).href;

    overlay.style.display = "flex";
    video.controls = true;
    video.src = abs;

    video.play().catch(() => {
      // Some TVs require a user gesture; remote Enter counts.
      showOSD("Press OK/Enter to play", 2000);
    });

    showOSD("Playing…  (BACK to close, ⬅/➡ seek, OK pause/play)", 2500);
  }

  function closePlayer() {
    try { video.pause(); } catch {}
    video.removeAttribute("src");
    video.load();
    overlay.style.display = "none";
    // Return focus to app so remote works
    document.body.focus();
  }

  function togglePlay() {
    if (video.paused) video.play().catch(()=>{});
    else video.pause();
  }

  function seekBy(sec) {
    try {
      video.currentTime = Math.max(0, (video.currentTime || 0) + sec);
      showOSD(`Seek ${sec>0?"+":""}${sec}s`);
    } catch {}
  }

  // Remote keys (LG webOS)
  function onKey(e) {
    const code = e.keyCode;

    // Back key on webOS is often 461
    if (code === 461 || e.key === "Backspace" || e.key === "Escape") {
      if (overlay.style.display === "flex") {
        e.preventDefault();
        closePlayer();
        return;
      }
    }

    if (overlay.style.display === "flex") {
      // While player open, handle playback keys
      if (code === 13 || e.key === "Enter" || e.key === " ") { e.preventDefault(); togglePlay(); return; }
      if (code === 37 || e.key === "ArrowLeft")  { e.preventDefault(); seekBy(-10); return; }
      if (code === 39 || e.key === "ArrowRight") { e.preventDefault(); seekBy(+10); return; }

      // Common media keycodes (varies)
      if (code === 179 || code === 415) { e.preventDefault(); togglePlay(); return; } // play/pause
      if (code === 412) { e.preventDefault(); seekBy(-30); return; } // rewind
      if (code === 417) { e.preventDefault(); seekBy(+30); return; } // fast forward
    }
  }

  // Hook clicks inside the loaded page (local, so we CAN access it)
  frame.addEventListener("load", () => {
    const win = frame.contentWindow;
    const doc = frame.contentDocument;

    // Make elements focusable so LG remote can navigate
    doc.querySelectorAll("a, button, input, select, textarea, [role='button']").forEach(el => {
      if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "0");
    });

    // Intercept anchor clicks to video
    doc.addEventListener("click", (ev) => {
      const a = ev.target.closest("a");
      if (!a) return;
      const href = a.getAttribute("href");
      if (!href) return;

      const abs = new URL(href, win.location.href).href;
      if (isVideoUrl(abs)) {
        ev.preventDefault();
        ev.stopPropagation();
        openPlayer(abs);
      }
    }, true);

    // If the site uses window.open(...) for videos, intercept that too
    const originalOpen = win.open.bind(win);
    win.open = function(url, ...rest) {
      if (url && isVideoUrl(url)) {
        openPlayer(url);
        return null;
      }
      return originalOpen(url, ...rest);
    };

    // Ensure remote keys are captured
    document.body.focus();
    showOSD("Remote ready: use arrows + OK. BACK exits player.", 2500);
  });

  // Key handler on outer app
  document.addEventListener("keydown", onKey, true);

  // Close player if video ends
  video.addEventListener("ended", closePlayer);
})();
