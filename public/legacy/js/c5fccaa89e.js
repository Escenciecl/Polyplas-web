/* ── DEEP LINK: #tina=antuco ── */
(function ppDeepLinkTinas() {
  var hashStr = window.location.hash.replace(/^#/, '');
  if (!hashStr) return;
  var params = new URLSearchParams(hashStr);
  var tina = params.get('tina');
  if (!tina) return;
  function tryOpen() {
    if (typeof window.openTinaDetail !== 'function') { setTimeout(tryOpen, 200); return; }
    history.replaceState(null, '', window.location.pathname + window.location.search);
    setTimeout(function() { window.openTinaDetail(tina); }, 180);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { setTimeout(tryOpen, 400); });
  } else { setTimeout(tryOpen, 400); }
})();
