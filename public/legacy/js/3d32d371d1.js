/* ── DEEP LINK: #color=clear&medida=1800x1200&espesor=2mm&mat=AA ── */
(function ppDeepLink() {
  /* Lee del hash (#) para evitar 404 de WordPress con query params */
  var hashStr = window.location.hash.replace(/^#/, '');
  var params  = new URLSearchParams(hashStr || window.location.search);
  var color   = params.get('color') || params.get('c');
  var medida  = params.get('medida') || params.get('m');
  var espesor = params.get('espesor') || params.get('esp') || params.get('e');
  var mat     = (params.get('mat') || params.get('t') || 'AA').toUpperCase();
  if (!color) return;

  /* Normaliza medida: acepta clave exacta (1800x1200) o en cm (180x120 → 1800x1200) */
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
    /* Espera precios de Supabase */
    var tipo   = mat === 'PA' ? 'PA' : 'AA';
    var prices = window._ppPrices || {};
    if (!prices[tipo] || !Object.keys(prices[tipo]).length) {
      setTimeout(tryOpen, 350);
      return;
    }

    /* Encuentra la card del color pedido */
    var vitrineId = tipo === 'PA' ? 'ppVitrinePA' : 'ppVitrineAA';
    var container = document.getElementById(vitrineId) || document;
    var cardEl    = container.querySelector('.pp-product-card[data-color="' + color + '"]');

    if (cardEl && dimKey)  cardEl.dataset.selectedDim  = dimKey;
    if (cardEl && espesor) cardEl.dataset.selectedEsp  = espesor;
    if (cardEl && dimKey && espesor) cardEl.dataset.userSelected = 'true';

    /* Limpia el hash de la URL para no confundir analytics ni back-button */
    history.replaceState(null, '', window.location.pathname + window.location.search);

    /* Abre el modal (directo a paso de pedido si hay dim+esp, si no al selector) */
    setTimeout(function () { openConfigurator(color, mat); }, 180);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(tryOpen, 400); });
  } else {
    setTimeout(tryOpen, 400);
  }
})();
