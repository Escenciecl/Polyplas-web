/* ── DEEP LINK: #producto=80x80_cuad ── */
(function ppDeepLinkRecep() {
  var hashStr = window.location.hash.replace(/^#/, '');
  if (!hashStr) return;
  var params = new URLSearchParams(hashStr);
  var producto = params.get('producto');
  if (!producto) return;
  function tryOpen() {
    if (typeof window.openReceptDetail !== 'function') { setTimeout(tryOpen, 200); return; }
    history.replaceState(null, '', window.location.pathname + window.location.search);
    setTimeout(function() { window.openReceptDetail(producto); }, 180);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { setTimeout(tryOpen, 400); });
  } else { setTimeout(tryOpen, 400); }
})();
