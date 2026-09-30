function updateCardSpecs(mat) {
  var prices   = window._ppPrices  || {};
  var dimMeta  = window._ppDimMeta || {};
  var allEsp   = window._ppAllEsp  || [];
  var matInfo  = window._ppMatInfo || {};
  var tipo = (matInfo[mat] && matInfo[mat].tipo) ? matInfo[mat].tipo : mat;

  document.querySelectorAll('.pp-product-card').forEach(function(card) {
    var colorKey = card.dataset.color;
    var specsEl  = card.querySelector('.pp-card-specs');
    if (!specsEl || !colorKey) return;

    var cardTipo   = card.dataset.tipo || tipo;
    var typePrices = prices[cardTipo] || {};

    var dims = [];
    var espSet = {};
    Object.keys(typePrices).forEach(function(dim) {
      var colorMap = typePrices[dim];
      if (colorMap[colorKey]) {
        dims.push(dim);
        Object.keys(colorMap[colorKey]).forEach(function(esp) { espSet[esp] = true; });
      }
    });

    if (!dims.length) { specsEl.innerHTML = ''; return; }

    var espList = allEsp.filter(function(e) { return espSet[e]; });

    // Si solo hay una medida y un espesor, mostrar precio exacto; si no, el minimo
    var desdeEl = card.querySelector('.pp-card-desde-price');
    if (desdeEl) {
      var precioMostrar = null;
      if (dims.length === 1 && espList.length === 1) {
        precioMostrar = typePrices[dims[0]][colorKey][espList[0]];
      }
      if (!precioMostrar) {
        var allVals = Object.values(typePrices).flatMap(function(c){ return Object.values(c); }).flatMap(function(e){ return Object.values(e); }).filter(function(p){ return p > 0; });
        precioMostrar = allVals.length ? Math.min.apply(null, allVals) : null;
      }
      if (precioMostrar) desdeEl.textContent = '$ ' + precioMostrar.toLocaleString('es-CL');
    }

    // Short dim labels: strip " cm" suffix
    var dimLabels = dims.map(function(d) {
      return (dimMeta[d] && dimMeta[d].label) ? dimMeta[d].label.replace(' cm','') : d;
    });

    var singleDim = dims.length === 1;
    var singleEsp = espList.length === 1;

    var dimTags = dimLabels.map(function(l) {
      // Compact: "1800 × 1200 mm" → "1800×1200"
      var activeClass = singleDim ? ' active' : '';
      return '<span class="pp-spec-tag' + activeClass + '">' + l.replace(/\s*×\s*/g,'×').replace(' cm','').replace(' CM','') + '</span>';
    }).join('');
    var espTags = espList.map(function(e) {
      var activeClass = singleEsp ? ' active' : '';
      return '<span class="pp-spec-tag' + activeClass + '">' + e + '</span>';
    }).join('');

    specsEl.innerHTML =
      '<div class="pp-spec-row">' +
        '<div class="pp-spec-head">' +
          '<svg class="pp-spec-icon" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>' +
          '<span class="pp-spec-label">Medidas disponibles</span>' +
        '</div>' +
        '<div class="pp-spec-tags">' + dimTags + '</div>' +
      '</div>' +
      '<div class="pp-spec-row">' +
        '<div class="pp-spec-head">' +
          '<svg class="pp-spec-icon" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><line x1="4" y1="5" x2="20" y2="5"/><line x1="4" y1="10" x2="20" y2="10"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="4" y1="20" x2="14" y2="20"/></svg>' +
          '<span class="pp-spec-label">Espesores disponibles</span>' +
        '</div>' +
        '<div class="pp-spec-tags">' + espTags + '</div>' +
      '</div>';
  });
}

function filterMaterial(mat) {
  // Update active button state
  document.querySelectorAll('.pp-mat-filter-btn').forEach(function(b) {
    b.classList.toggle('active', b.dataset.mat === mat);
  });
  // Show/hide cards and update per-material names
  document.querySelectorAll('.pp-product-card').forEach(function(card) {
    var mats = card.dataset.mat || '';
    card.style.display = mats.indexOf(mat) !== -1 ? '' : 'none';
    var nameForMat = card.dataset['name' + mat[0].toUpperCase() + mat.slice(1).toLowerCase()];
    if (nameForMat) {
      var nameEl = card.querySelector('.pp-product-card-name');
      if (nameEl) nameEl.textContent = nameForMat;
    }
    var desdeForMat = card.dataset['desde' + mat[0].toUpperCase() + mat.slice(1).toLowerCase()];
    if (desdeForMat) {
      var desdeEl = card.querySelector('.pp-card-desde-price');
      if (desdeEl) desdeEl.textContent = desdeForMat;
    }
  });
  // Update specs for visible cards
  updateCardSpecs(mat);
}

// Init specs on load (default: AA active)
// Se llama inmediatamente Y en DOMContentLoaded por compatibilidad con Elementor
// (en Elementor el widget se inyecta después de que DOMContentLoaded ya disparó)
function _ppInitCardSpecs() {
  var activeBtn = document.querySelector('.pp-mat-filter-btn.active');
  updateCardSpecs(activeBtn ? activeBtn.dataset.mat : 'PET');
}
_ppInitCardSpecs();
document.addEventListener('DOMContentLoaded', _ppInitCardSpecs);
function openConfigurator(colorKey, espKey, tipoKey) {
  var mat = tipoKey || 'PET';
  window._ppPresetColor = 'clear';
  window._ppCardImg = '/wp-content/uploads/2026/05/plancha-de-acrilico-color-transparente.webp';
  if (window._ppState) {
    window._ppState.material = mat;
    window._ppState.tipo = mat;
    window._ppState.dim = '';
    window._ppState.color = 'clear';
    window._ppState.esp = espKey || '';
    window._ppState.qty = 1;
  }
  document.getElementById('configuratorModal').classList.add('open');
  document.body.style.overflow = 'hidden';
  if (window._ppDlPush) {
    var _vi_label = window._ppGetMatLabel ? window._ppGetMatLabel(mat) : mat;
    var _vi_min = window._ppGetMinPrecio ? (window._ppGetMinPrecio(mat) || 0) : 0;
    window._ppDlPush('view_item', { currency: 'CLP', value: _vi_min, items: [{ item_id: mat, item_name: 'Plancha ' + _vi_label, item_brand: 'Polyplas', item_category: _vi_label, price: _vi_min, index: 0 }] });
  }
  var pcb = document.getElementById('pageCartBar');
  if (pcb) pcb.style.display = 'none';
  window._ppWizardGoingBack = false;
  window._ppInPopstate = false;
  if (window.updateCorteBadge) window.updateCorteBadge();
  /* Actualiza URL hash para que se pueda compartir/usar en Shopping */
  var _dlHash = '#color=' + (colorKey || 'clear') + '&mat=' + mat;
  if (espKey) _dlHash += '&espesor=' + espKey;
  history.replaceState(null, '', window.location.pathname + window.location.search + _dlHash);

  setTimeout(function() {
    if (espKey && window.goToStep) {
      window.goToStep(4);
    } else if (window.goToStep) {
      window.goToStep(2);
    }
  }, 80);
}
// Cierra solo el DOM del configurador sin tocar el historial
function _closeConfiguratorDOM() {
  window._ppPresetColor = '';
  window._ppCardImg = '';
  document.getElementById('configuratorModal').classList.remove('open');
  document.body.style.overflow = '';
  history.replaceState(null, '', window.location.pathname + window.location.search);
  var lp = document.getElementById('cartLivePreview');
  if (lp) lp.style.display = 'none';
  if (window.renderCart) window.renderCart();
  if (window.updateCorteBadge) window.updateCorteBadge();
}

function closeConfigurator() {
  _closeConfiguratorDOM();
  if (!window._ppInPopstate && window.history.state && window.history.state.ppModal === 'configurador') {
    window._ppSkipPopstate = true;
    window.history.go(-1);
  }
}

// Wrapper de goToStep: empuja historial solo al avanzar (no al retroceder)
(function() {
  var _orig = window.goToStep;
  if (!_orig) return;
  window.goToStep = function(n) {
    _orig(n);
    if (!window._ppWizardGoingBack && !window._pccGoingBack && !window._ppInPopstate) {
      history.pushState({ppModal:'configurador', step:n}, '');
    }
  };
})();

// Interceptar el botón "Atrás" del navegador
window.addEventListener('popstate', function() {
  if (window._ppSkipPopstate) { window._ppSkipPopstate = false; return; }

  var confModal = document.getElementById('configuratorModal');
  if (confModal && confModal.classList.contains('open')) {
    // Activar flags para que closeConfigurator y goToStep no re-empujen historial
    window._ppInPopstate = true;
    window._ppWizardGoingBack = true;
    // Buscar el botón "← Volver" visible en el modal y simularlo
    var btns = confModal.querySelectorAll('.pp-stepper-back, .pcc-back-link');
    var clicked = false;
    for (var i = 0; i < btns.length; i++) {
      if (btns[i].offsetParent !== null) { btns[i].click(); clicked = true; break; }
    }
    if (!clicked) _closeConfiguratorDOM();
    window._ppWizardGoingBack = false;
    window._ppInPopstate = false;
    return;
  }

  var checkModal = document.getElementById('checkoutModal');
  if (checkModal && checkModal.classList.contains('open')) {
    window._ppInPopstate = true;
    if (window.closeCheckout) window.closeCheckout();
    window._ppInPopstate = false;
    return;
  }
});
