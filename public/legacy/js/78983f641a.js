// Detecta el tipo (AA/PA) de una card desde su contenedor, sin depender del botón activo
function ppCardGetTipo(card) {
  if (card.dataset.tipo) return card.dataset.tipo;
  var vitrineAA = document.getElementById('ppVitrineAA');
  var vitrinePA = document.getElementById('ppVitrinePA');
  if (vitrinePA && vitrinePA.contains(card)) return 'PA';
  if (vitrineAA && vitrineAA.contains(card)) return 'AA';
  return 'AA';
}

// Verifica si una combo dim+color+esp está sin stock
function ppCardIsOos(tipo, dim, colorKey, esp) {
  var oosEntry = ((window._ppOutOfStock || {})[tipo] || {})[dim];
  if (!oosEntry) return false;
  var entry = oosEntry[colorKey];
  return entry === true || (Array.isArray(entry) && entry.includes(esp));
}

// Actualiza clases OOS en las pills de espesor según la medida seleccionada
function ppCardRefreshEspOos(card) {
  var dim = card.dataset.selectedDim;
  var colorKey = card.dataset.color;
  var tipo = card.dataset.tipo || ppCardGetTipo(card);
  var typePrices = (window._ppPrices || {})[tipo] || {};
  card.querySelectorAll('[data-esp]').forEach(function(s) {
    var esp = s.dataset.esp;
    var hasPrice = !!(typePrices[dim] && typePrices[dim][colorKey] && typePrices[dim][colorKey][esp]);
    var oos = !hasPrice || ppCardIsOos(tipo, dim, colorKey, esp);
    s.classList.toggle('pp-spec-oos', oos);
  });
}

function ppCardSelectDim(el) {
  var card = el.closest('.pp-product-card');
  if (!card) return;
  card.querySelectorAll('[data-dim]').forEach(function(s) { s.classList.remove('pp-spec-active'); });
  el.classList.add('pp-spec-active');
  card.dataset.selectedDim = el.dataset.dim;
  card.dataset.userSelected = 'true';
  // Si el espesor actual queda sin stock para esta medida, limpiar selección de espesor
  var esp = card.dataset.selectedEsp;
  var tipo = card.dataset.tipo || ppCardGetTipo(card);
  if (esp && ppCardIsOos(tipo, el.dataset.dim, card.dataset.color, esp)) {
    card.dataset.selectedEsp = '';
    card.querySelectorAll('[data-esp]').forEach(function(s) { s.classList.remove('pp-spec-active'); });
  }
  ppCardRefreshEspOos(card);
  ppCardUpdatePrice(card);
}

function ppCardSelectEsp(el) {
  var card = el.closest('.pp-product-card');
  if (!card) return;
  // No permitir seleccionar un espesor sin stock
  if (el.classList.contains('pp-spec-oos')) return;
  card.querySelectorAll('[data-esp]').forEach(function(s) { s.classList.remove('pp-spec-active'); });
  el.classList.add('pp-spec-active');
  card.dataset.selectedEsp = el.dataset.esp;
  card.dataset.userSelected = 'true';
  ppCardUpdatePrice(card);
}

function ppCardUpdatePrice(card) {
  var dim = card.dataset.selectedDim;
  var esp = card.dataset.selectedEsp;
  var colorKey = card.dataset.color;
  var tipo = card.dataset.tipo || ppCardGetTipo(card);
  var typePrices = (window._ppPrices || {})[tipo] || {};
  var priceEl = card.querySelector('.pp-card-desde-price');
  var labelEl = card.querySelector('.pp-card-desde-label');
  var buyBtn  = card.querySelector('.pp-btn-buy');
  if (!priceEl) return;

  if (dim && esp) {
    var isOos = ppCardIsOos(tipo, dim, colorKey, esp);
    if (isOos) {
      priceEl.textContent = 'Sin stock';
      if (labelEl) { labelEl.textContent = 'No disponible'; labelEl.classList.remove('pp-precio-exacto'); }
      if (buyBtn && card.dataset.stockStatus !== 'sin-stock') { buyBtn.disabled = true; buyBtn.textContent = 'SIN STOCK'; }
      return;
    }
    var price = (typePrices[dim] || {})[colorKey];
    price = price && price[esp];
    if (price) {
      priceEl.textContent = '$ ' + Math.round(price).toLocaleString('es-CL');
      if (labelEl) { labelEl.textContent = 'Precio'; labelEl.classList.add('pp-precio-exacto'); }
      if (buyBtn && card.dataset.stockStatus !== 'sin-stock') { buyBtn.disabled = false; buyBtn.textContent = 'COMPRA RÁPIDA →'; }
      return;
    }
  }
  // Sin selección completa: mostrar mínimo disponible en stock
  var minPrice = null;
  Object.keys(typePrices).forEach(function(d) {
    var cp = typePrices[d][colorKey] || {};
    Object.keys(cp).forEach(function(e) {
      if (!ppCardIsOos(tipo, d, colorKey, e)) {
        var p = cp[e];
        if (minPrice === null || p < minPrice) minPrice = p;
      }
    });
  });
  if (minPrice !== null) priceEl.textContent = '$ ' + Math.round(minPrice).toLocaleString('es-CL');
  if (labelEl) { labelEl.textContent = 'Valores desde'; labelEl.classList.remove('pp-precio-exacto'); }
  if (buyBtn && card.dataset.stockStatus !== 'sin-stock') { buyBtn.disabled = false; buyBtn.textContent = 'COMPRA RÁPIDA →'; }
}

function updateCardSpecs(mat) {
  var prices    = window._ppPrices    || {};
  var dimMeta   = window._ppDimMeta   || {};
  var allEsp    = window._ppAllEsp    || [];
  var matInfo   = window._ppMatInfo   || {};
  var colorMeta = window._ppColorMeta || {};
  var tipo = (matInfo[mat] && matInfo[mat].tipo) ? matInfo[mat].tipo : mat;

  // Solo actualizar las cards de la sección correspondiente
  var vitrineId = tipo === 'PA' ? 'ppVitrinePA' : 'ppVitrineAA';
  var container = document.getElementById(vitrineId) || document;

  container.querySelectorAll('.pp-product-card').forEach(function(card) {
    var colorKey = card.dataset.color;
    var specsEl  = card.querySelector('.pp-card-specs');
    if (!colorKey) return;

    var typePrices = prices[tipo] || {};
    var dims = [];
    var espSet = {};
    var minPrice = null;

    Object.keys(typePrices).forEach(function(dim) {
      if (/_pc|_pet|_petg/.test(dim)) return;
      var colorMap = typePrices[dim];
      if (colorMap[colorKey]) {
        dims.push(dim);
        Object.keys(colorMap[colorKey]).forEach(function(esp) {
          espSet[esp] = true;
          var p = colorMap[colorKey][esp];
          if (minPrice === null || p < minPrice) minPrice = p;
        });
      }
    });

    // Actualizar nombre desde colorMeta (con caso especial AA blanca)
    var nameEl = card.querySelector('.pp-product-card-name');
    if (nameEl) {
      var nombre = (tipo === 'AA' && colorKey === 'blanca')
        ? 'Blanca Traslúcida'
        : ((colorMeta[colorKey] && colorMeta[colorKey].label) || colorKey);
      nameEl.textContent = nombre;
    }

    // Precio "desde" — los valores en _ppPrices ya incluyen IVA (vienen de Supabase)
    var desdeEl = card.querySelector('.pp-card-desde-price');
    if (desdeEl && minPrice !== null) {
      desdeEl.textContent = '$ ' + Math.round(minPrice).toLocaleString('es-CL');
    }

    // Actualizar specs de medidas y espesores
    if (!specsEl) return;
    if (!dims.length) {
      specsEl.innerHTML = '';
      var _sumEl0 = card.querySelector('.pp-card-mobile-summary');
      if (_sumEl0) _sumEl0.textContent = '';
      return;
    }

    // Guardar tipo en la card para que ppCardGetTipo/ppCardIsOos no dependan del botón activo
    card.dataset.tipo = tipo;

    var dimLabels = dims.map(function(d) {
      return (dimMeta[d] && dimMeta[d].label) ? dimMeta[d].label.replace(' cm','') : d;
    });
    var espList = allEsp.filter(function(e) { return espSet[e]; });
    card.dataset.espesores = espList.join(',');

    // Línea resumen para mobile: "5 medidas · 2mm a 10mm"
    (function() {
      var el = card.querySelector('.pp-card-mobile-summary');
      if (!el) {
        el = document.createElement('div');
        el.className = 'pp-card-mobile-summary';
        var nameEl2 = card.querySelector('.pp-product-card-name');
        if (nameEl2 && nameEl2.parentNode) nameEl2.parentNode.insertBefore(el, nameEl2.nextSibling);
      }
      if (el && espList.length > 0) {
        var espMin = espList[0], espMax = espList[espList.length - 1];
        el.textContent = dims.length + ' medida' + (dims.length !== 1 ? 's' : '') + ' · ' + (espMin === espMax ? espMin : espMin + ' a ' + espMax);
      }
    })();

    // Detect stock status for this card from Supabase data
    var oosForTipo = (window._ppOutOfStock || {})[tipo] || {};
    var totalCombos = 0, oosCombos = 0;
    dims.forEach(function(dim) {
      var colorPrices = typePrices[dim][colorKey] || {};
      Object.keys(colorPrices).forEach(function(esp) {
        totalCombos++;
        var entry = oosForTipo[dim] && oosForTipo[dim][colorKey];
        if (entry === true || (Array.isArray(entry) && entry.includes(esp))) oosCombos++;
      });
    });
    var stockStatus = '';
    if (totalCombos > 0 && oosCombos === totalCombos) stockStatus = 'sin-stock';
    else if (oosCombos > 0) stockStatus = 'stock-limitado';
    if (stockStatus) card.dataset.stockStatus = stockStatus;
    else delete card.dataset.stockStatus;

    // Congelar / activar botón comprar según stock total
    var buyBtn = card.querySelector('.pp-btn-buy');
    if (buyBtn) {
      if (stockStatus === 'sin-stock') {
        buyBtn.disabled = true;
        buyBtn.textContent = 'SIN STOCK';
      } else {
        buyBtn.disabled = false;
        buyBtn.textContent = 'COMPRA RÁPIDA →';
      }
    }

    // Preselección automática del combo más barato CON STOCK si el usuario no ha elegido nada
    // También re-ejecutar si la preselección automática quedó sin stock tras cargar Supabase OOS
    var _autoSelOos = card.dataset.userSelected !== 'true' &&
      !!(card.dataset.selectedDim && card.dataset.selectedEsp) &&
      ppCardIsOos(tipo, card.dataset.selectedDim, colorKey, card.dataset.selectedEsp);
    if (!card.dataset.selectedDim || !card.dataset.selectedEsp || _autoSelOos) {
      var _minP = Infinity, _minD = '', _minE = '';
      dims.forEach(function(dim) {
        var espData = typePrices[dim][colorKey] || {};
        Object.entries(espData).forEach(function(ee) {
          var _esp = ee[0], _price = ee[1];
          if (!ppCardIsOos(tipo, dim, colorKey, _esp) && _price < _minP) {
            _minP = _price; _minD = dim; _minE = _esp;
          }
        });
      });
      if (_minD && _minE) {
        card.dataset.selectedDim = _minD;
        card.dataset.selectedEsp = _minE;
        if (!card.dataset.userSelected) card.dataset.userSelected = 'false';
      }
    }

    var selectedDim = card.dataset.selectedDim || '';
    var selectedEsp = card.dataset.selectedEsp || '';
    var dimTags = dims.map(function(dim, i) {
      var label = dimLabels[i].replace(/\s*×\s*/g,'×').replace(' cm','').replace(' CM','');
      var colorPrices = typePrices[dim][colorKey] || {};
      var espKeys = Object.keys(colorPrices);
      var dimOos = espKeys.length > 0 && espKeys.every(function(esp) {
        var entry = oosForTipo[dim] && oosForTipo[dim][colorKey];
        return entry === true || (Array.isArray(entry) && entry.includes(esp));
      });
      var activeClass = selectedDim === dim ? ' pp-spec-active' : '';
      return '<span class="pp-spec-tag pp-spec-sel' + (dimOos ? ' pp-spec-oos' : '') + activeClass + '" data-dim="' + dim + '" onclick="ppCardSelectDim(this)">' + label + '</span>';
    }).join('');
    var espTags = espList.map(function(e) {
      var espInAnyDim = dims.some(function(dim) {
        return typePrices[dim][colorKey] && typePrices[dim][colorKey][e];
      });
      var espOos = espInAnyDim && dims.every(function(dim) {
        if (!(typePrices[dim][colorKey] && typePrices[dim][colorKey][e])) return true;
        var entry = oosForTipo[dim] && oosForTipo[dim][colorKey];
        return entry === true || (Array.isArray(entry) && entry.includes(e));
      });
      var activeClass = selectedEsp === e ? ' pp-spec-active' : '';
      return '<span class="pp-spec-tag pp-spec-sel' + (espOos ? ' pp-spec-oos' : '') + activeClass + '" data-esp="' + e + '" onclick="ppCardSelectEsp(this)">' + e + '</span>';
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

    // Actualizar precio con la preselección (automática o del usuario)
    ppCardUpdatePrice(card);
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
  updateCardSpecs('AA');
  updateCardSpecs('PA');
}
_ppInitCardSpecs();
document.addEventListener('DOMContentLoaded', _ppInitCardSpecs);
function openConfigurator(colorKey, mat) {
  // mat se pasa explícitamente desde openConfiguratorPA('PA')
  // Las cards AA llaman openConfigurator(colorKey) sin mat → default 'AA'
  if (!mat) mat = 'AA';
  var materialesInfo = window._ppMatInfo || {};
  var info = materialesInfo[mat];
  window._ppPresetColor = colorKey || '';
  // Capturar imagen y selección previa de la card
  var _tipo = info ? info.tipo : mat;
  var _vitrineId = _tipo === 'PA' ? 'ppVitrinePA' : 'ppVitrineAA';
  var _container = document.getElementById(_vitrineId) || document;
  var cardEl = _container.querySelector('.pp-product-card[data-color="' + colorKey + '"]');
  window._ppCardImg = (cardEl && cardEl.querySelector('.pp-product-card-img')) ? cardEl.querySelector('.pp-product-card-img').src : '';

  // ¿El usuario eligió activamente medida + espesor en la card?
  var _cardDim = cardEl ? (cardEl.dataset.selectedDim || '') : '';
  var _cardEsp = cardEl ? (cardEl.dataset.selectedEsp || '') : '';
  var _userSelected = cardEl ? (cardEl.dataset.userSelected === 'true') : false;
  // Solo salta directo al paso 2 si el usuario hizo clic en las pills
  var _hasCardSelection = _userSelected && !!(_cardDim && _cardEsp);

  if (window._ppState) {
    window._ppState.material = mat;
    window._ppState.tipo = _tipo;
    window._ppState.color = colorKey || '';
    window._ppState.qty = 1;
    // Siempre cargamos la selección de la card (sea del usuario o automática)
    // para que el paso 1 arranque con el precio ya visible
    window._ppState.dim = _cardDim;
    window._ppState.esp = _cardEsp;
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
  // Con selección de card: ir directo al paso 2 (pedido). Sin selección: paso 1 (medida+espesor)
  /* Actualiza URL hash para que se pueda compartir/usar en Shopping */
  var _dlHash = '#color=' + colorKey + '&mat=' + mat;
  if (_cardDim) _dlHash += '&medida=' + _cardDim;
  if (_cardEsp) _dlHash += '&espesor=' + _cardEsp;
  history.replaceState(null, '', window.location.pathname + window.location.search + _dlHash);

  setTimeout(function() {
    if (window.goToStep) window.goToStep(_hasCardSelection ? 5 : 2);
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
