(() => {
  const VIDEO_RE = /\.(m3u8|mp4|mpd|mkv)(\?.*)?$/i;

  let overlay, video, closeBtn;

  function ensureUI() {
    if (overlay) return;

    overlay = document.createElement("div");
    overlay.style.cssText = `
      position:fixed; inset:0; background:rgba(0,0,0,.92);
      display:none; z-index:999999; padding:18px;
    `;

    closeBtn = document.createElement("button");
    closeBtn.textContent = "Close";
    closeBtn.className = "startv-focus";
    closeBtn.style.cssText = `
      position:absolute; top:18px; right:18px; padding:10px 14px;
      border-radius:12px; border:1px solid rgba(255,255,255,.25);
      background:rgba(255,255,255,.08); color:#fff; font-size:16px;
    `;

    video = document.createElement("video");
    video.setAttribute("controls", "true");
    video.setAttribute("playsinline", "true");
    video.style.cssText = `
      width:100%; height:100%;
      max-height:calc(100vh - 36px);
      outline:none;
    `;

    closeBtn.addEventListener("click", () => stop());
    overlay.appendChild(closeBtn);
    overlay.appendChild(video);
    document.body.appendChild(overlay);
  }

  function stop() {
    if (!overlay) return;
    try { video.pause(); } catch {}
    video.removeAttribute("src");
    video.load();
    overlay.style.display = "none";
  }

  function play(url) {
    ensureUI();
    overlay.style.display = "block";
    closeBtn.focus();

    // NOTE: MKV often will NOT play in HTML5 video on TVs.
    // MP4/HLS (m3u8) are the most reliable.
    video.src = url;
    video.load();
    video.play().catch(err => console.warn("Autoplay blocked:", err));
  }

  // Intercept clicks on video links
  document.addEventListener("click", (e) => {
    const a = e.target.closest && e.target.closest("a[href]");
    if (!a) return;

    const href = a.href || "";
    if (!VIDEO_RE.test(href)) return;

    e.preventDefault();
    e.stopPropagation();
    play(href);
  }, true);

  // Allow remote BACK / ESC to close player first
  document.addEventListener("keydown", (e) => {
    const isOpen = overlay && overlay.style.display !== "none";
    if (!isOpen) return;

    const key = e.key;
    const code = e.keyCode;

    // Back key on some webOS remotes can map differently; cover common ones
    if (key === "Escape" || key === "Backspace" || code === 461) {
      e.preventDefault();
      stop();
    }
  }, true);

  window.addEventListener("startv:stopPlayer", stop);
})();
