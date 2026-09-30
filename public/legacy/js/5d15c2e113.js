/* ── DEEP LINK: #color=clear&medida=1800x1200&espesor=2mm&mat=PETG ── */
(function ppDeepLink() {
  var hashStr = window.location.hash.replace(/^#/, '');
  var params  = new URLSearchParams(hashStr || window.location.search);
  var color   = params.get('color') || params.get('c');
  var medida  = params.get('medida') || params.get('m');
  var espesor = params.get('espesor') || params.get('esp') || params.get('e');
  var mat     = (params.get('mat') || params.get('t') || 'PETG').toUpperCase();
  if (!color) return;

  function normalizeMedida(raw) {
    if (!raw) return '';
    raw = raw.replace(/\s/g, '');
    var dm = window._ppDimMeta || {};
    if (dm[raw]) return raw;
    var p = raw.split('x');
    if (p.length === 2) {
      var k10 = (parseInt(p[0]) * 10) + 'x' + (parseInt(p[1]) * 10);
      if (dm[k10]) return k10;
    }
    return raw;
  }
  var dimKey = normalizeMedida(medida);

  function tryOpen() {
    var prices = window._ppPrices || {};
    if (!prices[mat] || !Object.keys(prices[mat]).length) {
      setTimeout(tryOpen, 350);
      return;
    }
    var cardEl = document.querySelector('.pp-product-card[data-color="' + color + '"]')
              || document.querySelector('.pp-product-card');
    if (cardEl && dimKey)  cardEl.dataset.selectedDim  = dimKey;
    if (cardEl && espesor) cardEl.dataset.selectedEsp  = espesor;
    if (cardEl && dimKey && espesor) cardEl.dataset.userSelected = 'true';
    history.replaceState(null, '', window.location.pathname + window.location.search);
    setTimeout(function () { openConfigurator(color, espesor, mat); }, 180);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(tryOpen, 400); });
  } else {
    setTimeout(tryOpen, 400);
  }
})();
