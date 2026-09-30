/* ── DEEP LINK: #cupula=54x54 ── */
(function ppDeepLinkCupulas() {
  var hashStr = window.location.hash.replace(/^#/, '');
  if (!hashStr) return;
  var params = new URLSearchParams(hashStr);
  var cupula = params.get('cupula');
  if (!cupula) return;
  function tryOpen() {
    if (typeof window.openCupolaDetail !== 'function') { setTimeout(tryOpen, 200); return; }
    history.replaceState(null, '', window.location.pathname + window.location.search);
    setTimeout(function() { window.openCupolaDetail(cupula); }, 180);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { setTimeout(tryOpen, 400); });
  } else { setTimeout(tryOpen, 400); }
})();
