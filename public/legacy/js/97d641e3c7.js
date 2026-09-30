(function() {
'use strict';

// ── Datos de productos ────────────────────────────────────────
var CUPULAS = window.CUPULAS = [
  {
    id: '54x54',
    nombre: 'Cúpula 54×54 cm',
    specs:  '54×54 cm · 4mm · Transparente · Protección UV',
    precio: 48500,
    img:    '/wp-content/uploads/2023/05/cup80x80.png'
  },
  {
    id: '68x68',
    nombre: 'Cúpula 68×68 cm',
    specs:  '68×68 cm · 4mm · Transparente · Tragaluz',
    precio: 53000,
    img:    '/wp-content/uploads/2023/05/cup80x80.png'
  },
  {
    id: '80x80',
    nombre: 'Cúpula 80×80 cm',
    specs:  '80×80 cm · 4mm · Transparente · Máxima luz',
    precio: 75500,
    img:    '/wp-content/uploads/2023/05/cup80x80.png'
  },
  {
    id: '80x80_bronce',
    nombre: 'Cúpula Bronce 80×80 cm',
    specs:  '80×80 cm · 4mm · Bronce · Control solar',
    precio: 75500,
    img:    '/wp-content/uploads/2023/05/cup80x80.png'
  }
];

// ── Datos para modal de detalle ───────────────────────────────
var CUPULAS_DETAIL = {
  '54x54': {
    label: 'Cúpula de Acrílico',
    title: '54 × 54 cm — Transparente',
    specs: [
      ['Dimensiones',   '54 × 54 cm (base cuadrangular)'],
      ['Espesor',       '4 mm'],
      ['Material',      'Acrílico transparente grado premium'],
      ['Protección UV', 'Filtros integrados anti-UV'],
      ['Resistencia',   'Alta tolerancia a impactos y agentes climáticos'],
      ['Mantenimiento', 'Paño húmedo · Evitar solventes'],
      ['Aplicaciones',  'Tragaluces · Claraboyas · Exhibición · Arquitectura']
    ],
    desc: [
      { h: 'Estándar superior en soluciones termoformadas',
        p: 'Esta cúpula garantiza una resistencia mecánica excepcional y una estética impecable. El acrílico transparente de grado premium ofrece una estructura ligera pero altamente robusta, con acabado brillante que asegura visibilidad óptica sin distorsiones.' },
      { h: 'Transparencia superior al 92%',
        p: 'A diferencia del policarbonato, el acrílico otorga una transparencia superior al 92%, optimizando el ingreso de luz natural en cualquier espacio. Ideal para claraboyas en naves industriales, galpones y proyectos de interiorismo de alta gama.' },
      { h: 'Calidad Polyplas — termoformado de alta precisión',
        p: 'Nuestras cúpulas atraviesan un proceso de termoformado de alta precisión, manteniendo estabilidad dimensional permanente. Cada unidad es sometida a control de calidad riguroso para garantizar un producto libre de imperfecciones.' }
    ]
  },
  '68x68': {
    label: 'Cúpula de Acrílico',
    title: '68 × 68 cm — Transparente',
    specs: [
      ['Dimensiones',   '68 × 68 cm (base cuadrangular)'],
      ['Espesor',       '4 mm'],
      ['Material',      'Acrílico transparente de alta calidad'],
      ['Protección UV', 'Incluida — evita amarillamiento'],
      ['Resistencia',   'Alta resistencia a impactos y la intemperie'],
      ['Aplicaciones',  'Techos · Tragaluces · Ventilación · Iluminación']
    ],
    desc: [
      { h: 'Formato estándar para tragaluces',
        p: 'La cúpula de 68×68 cm es fabricada en acrílico transparente de alta calidad y 4 mm de espesor, ofreciendo gran resistencia a impactos y a la intemperie. Su diseño cuadrado con domo central proporciona excelente entrada de luz natural.' },
      { h: 'Protección UV permanente',
        p: 'Cuenta con protección contra rayos UV para evitar el amarillamiento con el tiempo, garantizando un producto duradero. Superficie lisa y brillante, fácil de limpiar y mantener.' }
    ]
  },
  '80x80': {
    label: 'Cúpula de Acrílico',
    title: '80 × 80 cm — Transparente',
    specs: [
      ['Dimensiones',   '80 × 80 cm (base) · Altura aprox. 22–28 cm'],
      ['Espesor',       '4 mm'],
      ['Material',      'Acrílico transparente de alta calidad'],
      ['Fijaciones',    'Aletas integradas de ~5–6 cm'],
      ['Protector',     'Film protector retirable en instalación'],
      ['Protección UV', 'Incluida'],
      ['Aplicaciones',  'Claraboyas · Galpones · Eficiencia energética']
    ],
    desc: [
      { h: 'Máxima entrada de luz natural',
        p: 'Fabricada en acrílico transparente de alta calidad, resistente y ligero. Su acabado liso y brillante ofrece una excelente visibilidad y protección, ideal para exhibiciones, maquetas, cubiertas protectoras o decoración.' },
      { h: 'Gran durabilidad y facilidad de instalación',
        p: 'Alta durabilidad frente a impactos y rayos UV. Con aletas integradas y film protector retirable en instalación. Compatible con claraboyas industriales para maximizar la eficiencia energética.' }
    ]
  },
  '80x80_bronce': {
    label: 'Cúpula de Acrílico',
    title: '80 × 80 cm — Bronce',
    specs: [
      ['Dimensiones',   '80 × 80 cm (base) · Altura 22–28 cm'],
      ['Espesor',       '4 mm'],
      ['Material',      'Acrílico virgen color bronce'],
      ['Fijaciones',    'Aletas integradas de ~5–6 cm'],
      ['Protector',     'Film protector retirable en instalación'],
      ['Beneficios',    'Luz natural controlada · Ahorro energético · Privacidad'],
      ['Aplicaciones',  'Claraboya techos · Control solar · Diseño arquitectónico']
    ],
    desc: [
      { h: 'Control solar y privacidad',
        p: 'La cúpula color bronce filtra la luz solar reduciendo el deslumbramiento y el calor interior, manteniendo una iluminación cálida y difusa. Ideal para proyectos donde se requiere privacidad visual sin sacrificar luminosidad.' },
      { h: 'Diseño y eficiencia energética',
        p: 'Su color bronce aporta elegancia arquitectónica a cualquier proyecto. Fabricada en acrílico virgen con acabado uniforme y duradero. Reduce la ganancia de calor solar contribuyendo al confort térmico del espacio.' }
    ]
  }
};

// ── Estado ───────────────────────────────────────────────────
var cupCart = [];
var cupQtyModalState = { cupola: null, qty: 1 };
var cupClientType = 'PN';

// ── Utilidades ───────────────────────────────────────────────
function cupFmt(n) {
  return '$ ' + Math.round(n).toLocaleString('es-CL');
}

function cupShowToast(msg, type) {
  var el = document.getElementById('cupolasToast');
  el.textContent = msg;
  el.className = 'pp-toast' + (type ? ' pp-toast--' + type : '');
  el.classList.add('show');
  setTimeout(function() { el.classList.remove('show'); }, 3000);
}

// ── Cart helpers ─────────────────────────────────────────────
function cupCartTotal() {
  return cupCart.reduce(function(s, i) { return s + i.precio * i.qty; }, 0);
}
function cupCartCount() {
  return cupCart.reduce(function(s, i) { return s + i.qty; }, 0);
}
function cupUpdateFloatingCart() {
  var btn   = document.getElementById('cupolasFloatingCart');
  var badge = document.getElementById('cupolasCartBadge');
  var count = cupCartCount();
  btn.style.display = count > 0 ? 'flex' : 'none';
  badge.textContent = count;
}

// ── Drawer ───────────────────────────────────────────────────
function cupRenderDrawer() {
  var container = document.getElementById('cupolasDrawerItems');
  var totalEl   = document.getElementById('cupolasDrawerTotal');
  var countEl   = document.getElementById('cupolasDrawerCount');

  if (!cupCart.length) {
    container.innerHTML =
      '<div class="pp-cup-drawer-empty">' +
      '<div class="pp-cup-drawer-empty-icon"></div>' +
      '<div class="pp-cup-drawer-empty-title">Tu carrito está vacío</div>' +
      '<div class="pp-cup-drawer-empty-sub">Agrega una o más cúpulas para continuar.</div>' +
      '</div>';
    totalEl.textContent = '$ 0';
    countEl.textContent = '0';
    return;
  }

  countEl.textContent = cupCartCount();
  totalEl.textContent = cupFmt(cupCartTotal());

  container.innerHTML = cupCart.map(function(item, idx) {
    return '<div class="pp-cup-drawer-item">' +
      '<img class="pp-cup-drawer-item-thumb" src="' + item.img + '" alt="' + item.nombre + '">' +
      '<div class="pp-cup-drawer-item-body">' +
        '<div class="pp-cup-drawer-item-name">' + item.nombre + '</div>' +
        '<div class="pp-cup-drawer-item-sub">' + item.specs + '</div>' +
      '</div>' +
      '<div class="pp-cup-drawer-item-right">' +
        '<div class="pp-cup-drawer-item-price">' + cupFmt(item.precio * item.qty) + '</div>' +
        '<div class="pp-cup-drawer-item-qty">' +
          '<button class="pp-cup-drawer-qty-btn" onclick="cupDrawerQty(' + idx + ',-1)">−</button>' +
          '<span class="pp-cup-drawer-qty-val">' + item.qty + '</span>' +
          '<button class="pp-cup-drawer-qty-btn" onclick="cupDrawerQty(' + idx + ',1)">+</button>' +
        '</div>' +
        '<button class="pp-cup-drawer-item-remove" onclick="cupRemoveFromCart(' + idx + ')">Eliminar</button>' +
      '</div>' +
    '</div>';
  }).join('');
}

window.cupDrawerQty = function(idx, delta) {
  cupCart[idx].qty = Math.max(1, cupCart[idx].qty + delta);
  cupRenderDrawer();
  cupUpdateFloatingCart();
};

window.cupRemoveFromCart = function(idx) {
  cupCart.splice(idx, 1);
  cupRenderDrawer();
  cupUpdateFloatingCart();
  if (!cupCart.length) closeCupolasDrawer();
};

window.openCupolasDrawer = function() {
  if (window.ppGCOpen) { window.ppGCOpen(); return; }
  cupRenderDrawer();
  document.getElementById('cupolasCartDrawer').classList.add('open');
  document.getElementById('cupolasDrawerOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
};
window.closeCupolasDrawer = function() {
  document.getElementById('cupolasCartDrawer').classList.remove('open');
  document.getElementById('cupolasDrawerOverlay').classList.remove('open');
  document.body.style.overflow = '';
};

// ── Qty modal ────────────────────────────────────────────────
window.cupOpenQtyModal = function(id, nombre, specs, img, idx) {
  var cupola = CUPULAS.find(function(c){ return c.id === id; }) || CUPULAS[idx] || {};
  cupQtyModalState.cupola = cupola;
  cupQtyModalState.qty    = 1;

  document.getElementById('cupQtyThumb').src        = cupola.img || img;
  document.getElementById('cupQtyName').textContent  = nombre;
  document.getElementById('cupQtySub').textContent   = specs;
  document.getElementById('cupQtyUnit').textContent  = cupola.precio ? cupFmt(cupola.precio) + ' c/u · IVA incl.' : '$ — · IVA incl.';
  document.getElementById('cupQtyDisplay').textContent = '1';
  document.getElementById('cupQtyMinus').disabled = true;
  cupUpdateQtyTotal();
  document.getElementById('cupolasQtyModal').classList.add('open');
  document.body.style.overflow = 'hidden';
  dlPushCupulas('view_item', {
    currency: 'CLP',
    value: cupola.precio || 0,
    items: [{ item_id: 'CUP_' + (cupola.id || id), item_name: cupola.nombre || nombre, item_brand: 'Polyplas', item_category: 'Cúpulas de Acrílico', item_variant: cupola.specs || specs || '', price: cupola.precio || 0, quantity: 1, index: 0 }]
  });
};

function cupUpdateQtyTotal() {
  var c     = cupQtyModalState.cupola;
  var total = c && c.precio ? cupFmt(c.precio * cupQtyModalState.qty) : '$ —';
  document.getElementById('cupQtyTotalVal').textContent = total;
}

window.cupChangeModalQty = function(delta) {
  cupQtyModalState.qty = Math.max(1, cupQtyModalState.qty + delta);
  document.getElementById('cupQtyDisplay').textContent    = cupQtyModalState.qty;
  document.getElementById('cupQtyMinus').disabled = cupQtyModalState.qty <= 1;
  cupUpdateQtyTotal();
};

window.closeCupQtyModal = function() {
  document.getElementById('cupolasQtyModal').classList.remove('open');
  document.body.style.overflow = '';
};

window.cupAddToCart = function() {
  var c = cupQtyModalState.cupola;
  if (!c) return;
  var idx = cupCart.findIndex(function(i){ return i.id === c.id; });
  if (idx >= 0) {
    cupCart[idx].qty += cupQtyModalState.qty;
  } else {
    cupCart.push({ id: c.id, nombre: c.nombre, specs: c.specs, precio: c.precio, img: c.img, qty: cupQtyModalState.qty });
  }
  // Carrito global
  try {
    var _gcIdx = idx >= 0 ? idx : cupCart.length - 1;
    var _gcItem = cupCart[_gcIdx];
    if (!_gcItem._gid) _gcItem._gid = 'gc-' + Date.now().toString(36) + Math.random().toString(36).slice(2,7);
    typeof window.ppGlobalCartAdd === 'function' && window.ppGlobalCartAdd({
      gid: _gcItem._gid, sku: 'CUP_' + _gcItem.id, module: 'cupulas',
      nombre: _gcItem.nombre + (_gcItem.specs ? ' · ' + _gcItem.specs : ''),
      qty: _gcItem.qty, precio_unit: _gcItem.precio, corte_costo: 0,
      subtotal: _gcItem.precio * _gcItem.qty,
      descripcion: _gcItem.nombre + ' × ' + _gcItem.qty
    });
  } catch(e) {}
  dlPushCupulas('add_to_cart', {
    currency: 'CLP',
    value: c.precio * cupQtyModalState.qty,
    items: [{ item_id: 'CUP_' + c.id, item_name: c.nombre, item_brand: 'Polyplas', item_category: 'Cúpulas de Acrílico', item_variant: c.specs || '', price: c.precio, quantity: cupQtyModalState.qty, index: 0 }]
  });
  cupRenderDrawer();
  cupUpdateFloatingCart();
  cupShowToast('✓ ' + c.nombre + ' agregada al pedido', 'success');
};

// ── Detail modal ─────────────────────────────────────────────
window.openCupolaDetail = function(id) {
  var d = CUPULAS_DETAIL[id];
  var c = CUPULAS.find(function(x){ return x.id === id; });
  if (!d || !c) return;

  document.getElementById('cupDetailLabel').textContent = d.label;
  document.getElementById('cupDetailTitle').textContent = d.title;
  document.getElementById('cupDetailImg').src           = c.img;
  document.getElementById('cupDetailImg').alt           = c.nombre;
  document.getElementById('cupDetailPrice').textContent = cupFmt(c.precio);

  // Precio antes y ahorro (desde Supabase si aplica)
  var oldEl    = document.getElementById('cupDetailPriceOld');
  var ahorroEl = document.getElementById('cupDetailAhorro');
  if (c.precioAntes && c.precioAntes > c.precio) {
    oldEl.textContent    = 'Antes ' + cupFmt(c.precioAntes);
    oldEl.style.display  = 'block';
    ahorroEl.textContent = 'Ahorras ' + cupFmt(c.precioAntes - c.precio);
    ahorroEl.style.display = 'block';
  } else {
    oldEl.style.display    = 'none';
    ahorroEl.style.display = 'none';
  }

  // Tabla de specs
  var specsHtml = d.specs.map(function(row) {
    return '<tr><td>' + row[0] + '</td><td>' + row[1] + '</td></tr>';
  }).join('');
  document.getElementById('cupDetailSpecs').innerHTML = specsHtml;

  // Descripción
  var descHtml = d.desc.map(function(s) {
    return '<div class="pp-cup-detail-section"><h3>' + s.h + '</h3><p>' + s.p + '</p></div>';
  }).join('');
  document.getElementById('cupDetailDesc').innerHTML = descHtml;

  // Botón comprar
  var buyBtn = document.getElementById('cupDetailBuyBtn');
  buyBtn.onclick = function() {
    closeCupolaDetail();
    cupOpenQtyModal(id, c.nombre, c.specs, c.img, CUPULAS.indexOf(c));
  };

  dlPushCupulas('view_item', {
    currency: 'CLP',
    value: c.precio || 0,
    items: [{ item_id: 'CUP_' + id, item_name: c.nombre, item_brand: 'Polyplas', item_category: 'Cúpulas de Acrílico', item_variant: c.specs || '', price: c.precio || 0, quantity: 1, index: 0 }]
  });
  document.getElementById('cupolasDetailOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  history.replaceState(null, '', window.location.pathname + window.location.search + '#cupula=' + id);
};

window.closeCupolaDetail = function() {
  document.getElementById('cupolasDetailOverlay').classList.remove('open');
  document.body.style.overflow = '';
  history.replaceState(null, '', window.location.pathname + window.location.search);
};

// ── Checkout ─────────────────────────────────────────────────
window.openCupolasCheckout = function() {
  if (!cupCart.length) { cupShowToast('Agrega al menos un producto para continuar'); return; }
  dlPushCupulas('begin_checkout', { currency: 'CLP', value: cupCartTotal(), customer_type: cupClientType, items: cupCart.map(function(i, idx) { return { item_id: 'CUP_' + i.id, item_name: i.nombre, item_brand: 'Polyplas', item_category: 'Cúpulas de Acrílico', item_variant: i.specs || '', price: i.precio, quantity: i.qty, index: idx }; }) });
  if (window.ppGCOpen) { window.ppGCOpen(); return; }
  // Reset a paso 1
  document.getElementById('cupStep1').style.display = '';
  document.getElementById('cupStep2').style.display = 'none';
  document.getElementById('cupCkStep1').className = 'pp-cup-checkout-step active';
  document.getElementById('cupCkStep2').className = 'pp-cup-checkout-step';
  document.getElementById('cupCkLine').className  = 'pp-cup-checkout-step-line';
  // Render items paso 1
  document.getElementById('cupStep1OrderItems').innerHTML = cupCart.map(function(i) {
    return '<div class="pp-cup-modal-order-item">' +
      '<span class="desc">' + i.nombre + ' × ' + i.qty + '</span>' +
      '<span class="monto">' + cupFmt(i.precio * i.qty) + '</span>' +
      '</div>';
  }).join('');
  document.getElementById('cupolasCheckoutModal').classList.add('open');
  document.body.style.overflow = 'hidden';
};

window.closeCupolasCheckout = function() {
  document.getElementById('cupolasCheckoutModal').classList.remove('open');
  document.body.style.overflow = '';
};

window.cupSetClient = function(type) {
  cupClientType = type;
  document.getElementById('cupBtnPN').classList.toggle('active', type === 'PN');
  document.getElementById('cupBtnEMP').classList.toggle('active', type === 'EMP');
  document.getElementById('cupFieldsPN').style.display  = type === 'PN'  ? '' : 'none';
  document.getElementById('cupFieldsEMP').style.display = type === 'EMP' ? '' : 'none';
};

// RUT formatter
window.cupFormatRut = function(inp) {
  var v = inp.value.replace(/[^0-9kK]/g,'');
  if (v.length < 2) { inp.value = v; return; }
  var cuerpo = v.slice(0,-1);
  var dv     = v.slice(-1).toUpperCase();
  var fmt = '';
  while (cuerpo.length > 3) {
    fmt = '.' + cuerpo.slice(-3) + fmt;
    cuerpo = cuerpo.slice(0,-3);
  }
  inp.value = cuerpo + fmt + '-' + dv;
};

function cupValidateRut(rut) {
  var clean = rut.replace(/[^0-9kK]/g,'');
  if (clean.length < 2) return false;
  var cuerpo = clean.slice(0,-1);
  var dv     = clean.slice(-1).toUpperCase();
  var sum = 0; var mul = 2;
  for (var i = cuerpo.length-1; i >= 0; i--) {
    sum += parseInt(cuerpo[i]) * mul;
    mul = mul < 7 ? mul+1 : 2;
  }
  var expected = 11 - (sum % 11);
  var dvCalc = expected === 11 ? '0' : expected === 10 ? 'K' : String(expected);
  return dv === dvCalc;
}

window.cupTelInput = function(inp) {
  var v = inp.value;
  if (!v.startsWith('+56 ')) { inp.value = '+56 '; return; }
  var digits = v.slice(4).replace(/\D/g,'');
  if (digits.length > 9) digits = digits.slice(0,9);
  inp.value = '+56 ' + digits;
};

function cupGetCheckoutData() {
  if (cupClientType === 'PN') {
    return {
      tipo:   'Persona Natural',
      nombre: document.getElementById('cup_pn_nombre').value.trim(),
      rut:    document.getElementById('cup_pn_rut').value.trim(),
      tel:    document.getElementById('cup_pn_tel').value.trim(),
      email:  document.getElementById('cup_pn_email').value.trim(),
      region: document.getElementById('cup_pn_region').value,
      ciudad: document.getElementById('cup_pn_comuna').value.trim(),
      dir:    document.getElementById('cup_pn_dir').value.trim()
    };
  }
  return {
    tipo:     'Empresa',
    razon:    document.getElementById('cup_emp_razon').value.trim(),
    rut:      document.getElementById('cup_emp_rut').value.trim(),
    giro:     document.getElementById('cup_emp_giro').value.trim(),
    contacto: document.getElementById('cup_emp_contacto').value.trim(),
    rut_c:    document.getElementById('cup_emp_rut_c').value.trim(),
    tel:      document.getElementById('cup_emp_tel').value.trim(),
    email:    document.getElementById('cup_emp_email').value.trim(),
    region:   document.getElementById('cup_emp_region').value,
    ciudad:   document.getElementById('cup_emp_comuna').value.trim(),
    dir:      document.getElementById('cup_emp_dir').value.trim()
  };
}

function cupShowFieldError(fieldId, errId, show) {
  var field = document.getElementById(fieldId);
  var err   = document.getElementById(errId);
  if (!field) return;
  if (show) {
    field.classList.add('pp-cup-input-error');
    if (err) err.style.display = 'block';
  } else {
    field.classList.remove('pp-cup-input-error');
    if (err) err.style.display = 'none';
  }
}

window.cupGoStep2 = function() {
  var errEl = document.getElementById('cupStep1Error');
  errEl.style.display = 'none';
  var ok = true;

  if (cupClientType === 'PN') {
    var nombre = document.getElementById('cup_pn_nombre').value.trim();
    var rut    = document.getElementById('cup_pn_rut').value.trim();
    var tel    = document.getElementById('cup_pn_tel').value.trim();
    var email  = document.getElementById('cup_pn_email').value.trim();
    var region = document.getElementById('cup_pn_region').value;
    var ciudad = document.getElementById('cup_pn_comuna').value.trim();
    var dir    = document.getElementById('cup_pn_dir').value.trim();

    if (!nombre)  { errEl.textContent = 'Ingresa tu nombre completo.'; errEl.style.display = 'block'; ok = false; }
    else if (!cupValidateRut(rut)) { cupShowFieldError('cup_pn_rut','cup_pn_rut_err',true); ok = false; }
    else { cupShowFieldError('cup_pn_rut','cup_pn_rut_err',false); }

    var digits = tel.replace(/\D/g,'');
    if (!digits || digits.length < 11) { cupShowFieldError('cup_pn_tel','cup_pn_tel_err',true); ok = false; }
    else cupShowFieldError('cup_pn_tel','cup_pn_tel_err',false);

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { cupShowFieldError('cup_pn_email','cup_pn_email_err',true); ok = false; }
    else cupShowFieldError('cup_pn_email','cup_pn_email_err',false);

    if (!region || !ciudad || !dir) { errEl.textContent = 'Completa región, comuna y dirección.'; errEl.style.display = 'block'; ok = false; }

  } else {
    var razon  = document.getElementById('cup_emp_razon').value.trim();
    var rutE   = document.getElementById('cup_emp_rut').value.trim();
    var giro   = document.getElementById('cup_emp_giro').value.trim();
    var telE   = document.getElementById('cup_emp_tel').value.trim();
    var emailE = document.getElementById('cup_emp_email').value.trim();
    var regionE= document.getElementById('cup_emp_region').value;
    var ciudadE= document.getElementById('cup_emp_comuna').value.trim();
    var dirE   = document.getElementById('cup_emp_dir').value.trim();

    if (!razon || !giro) { errEl.textContent = 'Ingresa razón social y giro.'; errEl.style.display = 'block'; ok = false; }
    if (!cupValidateRut(rutE)) { cupShowFieldError('cup_emp_rut','cup_emp_rut_err',true); ok = false; }
    else cupShowFieldError('cup_emp_rut','cup_emp_rut_err',false);

    var dE = telE.replace(/\D/g,'');
    if (!dE || dE.length < 11) { cupShowFieldError('cup_emp_tel','cup_emp_tel_err',true); ok = false; }
    else cupShowFieldError('cup_emp_tel','cup_emp_tel_err',false);

    if (!emailE || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailE)) { cupShowFieldError('cup_emp_email','cup_emp_email_err',true); ok = false; }
    else cupShowFieldError('cup_emp_email','cup_emp_email_err',false);

    if (!regionE || !ciudadE || !dirE) { errEl.textContent = 'Completa región, comuna y dirección.'; errEl.style.display = 'block'; ok = false; }
  }

  if (!ok) return;

  // Avanzar a paso 2
  document.getElementById('cupStep1').style.display = 'none';
  document.getElementById('cupStep2').style.display = '';
  document.getElementById('cupCkStep1').className = 'pp-cup-checkout-step done';
  document.getElementById('cupCkStep2').className = 'pp-cup-checkout-step active';
  document.getElementById('cupCkLine').className  = 'pp-cup-checkout-step-line done';

  // Render resumen paso 2
  document.getElementById('cupStep2OrderItems').innerHTML = cupCart.map(function(i) {
    return '<div class="pp-cup-modal-order-item">' +
      '<span class="desc">' + i.nombre + ' × ' + i.qty + '</span>' +
      '<span class="monto">' + cupFmt(i.precio * i.qty) + '</span>' +
    '</div>';
  }).join('');
  document.getElementById('cupStep2Total').textContent = cupFmt(cupCartTotal());
  cupRenderEntregaOptions();
};
var cupSelectedEntrega = null;
function cupRenderEntregaOptions() {
  var el = document.getElementById("cupEntregaOptions");
  if (!el) return;
  el.innerHTML = "";
  cupSelectedEntrega = null;
  ["cupRetiroInfo","cupEnvioInfo","cupAddressSection"].forEach(function(id){
    var s=document.getElementById(id); if(s) s.style.display="none";
  });
  var wb = document.getElementById("cupBtnPay");
  if (wb) { wb.disabled=true; wb.style.opacity="0.5"; wb.style.cursor="not-allowed"; }
  var opciones = [
    {id:"retiro_tienda",icon:"🏪",label:"Retiro en tienda",desc:"Retira en nuestra bodega en Santiago · Sin costo",badge:"<span class=\"pp-cup-entrega-badge badge-gratis\">GRATIS</span>",needsAddress:false},
    {id:"despacho",icon:"🚚",label:"Despacho a domicilio",desc:"Gratis para Región Metropolitana · 1 a 3 días hábiles",badge:"<span class=\"pp-cup-entrega-badge badge-gratis\">GRATIS</span>",needsAddress:true},
    {id:"envio_propio",icon:"📦",label:"Envío propio",desc:"Coordinas tú el transporte desde nuestra bodega en Santiago",badge:"<span class=\"pp-cup-entrega-badge badge-propio\">TÚ GESTIONAS</span>",needsAddress:false}
  ];
  opciones.forEach(function(op) {
    var div=document.createElement("div");
    div.className="pp-cup-entrega-opt";
    div.style.cssText="display:flex;align-items:center;gap:12px;padding:14px 16px;border:2px solid #dde4ef;border-radius:12px;cursor:pointer;background:#fff;";
    div.innerHTML="<span style=\"font-size:1.3rem;flex-shrink:0\">"+op.icon+"</span>"
      +"<div style=\"flex:1\"><strong style=\"display:block;font-size:0.85rem;color:#1a1a2e;font-weight:600;\">"+op.label+"</strong>"
      +"<span style=\"font-size:0.75rem;color:#666;\">"+op.desc+"</span></div>"+op.badge;
    div.addEventListener("click",function() {
      document.querySelectorAll("#cupEntregaOptions .pp-cup-entrega-opt").forEach(function(x){
        x.style.borderColor="#dde4ef"; x.style.background="#fff";
      });
      div.style.borderColor="#004a99"; div.style.background="#edf2ff";
      cupSelectedEntrega={id:op.id,label:op.label,needsAddress:op.needsAddress,costo:0};
      dlPushCupulas('add_shipping_info', { currency: 'CLP', value: cupCartTotal(), shipping_tier: op.id, customer_type: cupClientType, items: cupCart.map(function(i, idx) { return { item_id: 'CUP_' + i.id, item_name: i.nombre, item_brand: 'Polyplas', item_category: 'Cúpulas de Acrílico', item_variant: i.specs || '', price: i.precio, quantity: i.qty, index: idx }; }) });
      var e2=document.getElementById("cupStep2Error"); if(e2) e2.style.display="none";
      if(wb){wb.disabled=false;wb.style.opacity="";wb.style.cursor="";}
      document.getElementById("cupRetiroInfo").style.display  = op.id==="retiro_tienda"?"block":"none";
      document.getElementById("cupEnvioInfo").style.display   = op.id==="envio_propio" ?"block":"none";
      document.getElementById("cupAddressSection").style.display = op.id==="despacho"  ?"block":"none";
    });
    el.appendChild(div);
  });
}


window.cupGoBackStep1 = function() {
  cupSelectedEntrega = null;
  document.getElementById('cupStep1').style.display = '';
  document.getElementById('cupStep2').style.display = 'none';
  document.getElementById('cupCkStep1').className = 'pp-cup-checkout-step active';
  document.getElementById('cupCkStep2').className = 'pp-cup-checkout-step';
  document.getElementById('cupCkLine').className  = 'pp-cup-checkout-step-line';
};

// ── Submit pedido ─────────────────────────────────────────────
window.cupSubmitOrder = async function() {
  var btn    = document.getElementById('cupBtnPay');
  var errEl  = document.getElementById('cupStep2Error');
  var client = cupGetCheckoutData();
  if (!cupSelectedEntrega) {
    var _e2=document.getElementById("cupStep2Error");
    if(_e2){_e2.textContent="Elige una modalidad de entrega para continuar.";_e2.style.display="block";}
    btn.disabled=false; btn.textContent="PAGAR CON WEBPAY"; return;
  }
  var entregaLabel = cupSelectedEntrega.label;
  var total  = cupCartTotal();
  if (cupSelectedEntrega.needsAddress) {
    var _dr=document.getElementById("cup_despacho_region")?.value||"";
    var _dc=document.getElementById("cup_despacho_comuna")?.value.trim()||"";
    var _dd=document.getElementById("cup_despacho_dir")?.value.trim()||"";
    if (!_dr||!_dc||!_dd){
      var _e2=document.getElementById("cupStep2Error");
      if(_e2){_e2.textContent="Completa la dirección de despacho.";_e2.style.display="block";}
      btn.disabled=false; btn.textContent="PAGAR CON WEBPAY"; return;
    }
    client.dir_despacho=_dd; client.region_despacho=_dr; client.ciudad_despacho=_dc;
  }

  btn.disabled    = true;
  btn.textContent = 'Procesando…';
  dlPushCupulas('add_payment_info', { currency: 'CLP', value: total, payment_type: 'Webpay', customer_type: cupClientType, items: cupCart.map(function(i, idx) { return { item_id: 'CUP_' + i.id, item_name: i.nombre, item_brand: 'Polyplas', item_category: 'Cúpulas de Acrílico', item_variant: i.specs || '', price: i.precio, quantity: i.qty, index: idx }; }) });
  if (errEl) errEl.style.display = 'none';

  var convId  = (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).slice(2);
  var shortId = 'PP-CUP-' + convId.split('-').pop().substring(0,5).toUpperCase();

  var orderItems = cupCart.map(function(i) {
    return { tipo: i.nombre, dim: i.specs, qty: i.qty, precio: i.precio };
  });
  var resumen = cupCart.map(function(i) {
    return '• ' + i.nombre + ' · ' + i.specs + ' × ' + i.qty + ' → $' + (i.precio * i.qty).toLocaleString('es-CL');
  }).join('\n');

  try {
    var res = await fetch('/wp-json/polyplas/v1/webpay-init', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        total:       Math.round(total),
        entrega:     entregaLabel,
        client:      client,
        return_page: 'https://polyplas.cl/gracias/',
        items:       orderItems
      })
    });
    var data = await res.json();
    if (!data.token || !data.url) throw new Error('Respuesta inválida del servidor');

    // Persistir datos en sessionStorage para recuperar tras retorno Webpay
    try {
      var _orderJson = JSON.stringify({
        client:       client,
        orderItems:   orderItems,
        resumen:      resumen,
        convId:       convId,
        shortId:      shortId,
        entregaLabel: entregaLabel,
        total:        total
      });
      sessionStorage.setItem('pp_cupulas_order_data', _orderJson);
      sessionStorage.setItem('pp_cupulas_cart_dl', JSON.stringify(cupCart.map(function(i, idx) {
        return {
          item_id:       'CUP_' + i.id,
          item_name:     i.nombre,
          item_brand:    'Polyplas',
          item_category: 'Cúpulas de Acrílico',
          item_variant:  i.specs,
          price:         i.precio,
          quantity:      i.qty,
          index:         idx
        };
      })));
      sessionStorage.setItem('pp_cupulas_total_dl', String(Math.round(total)));
      sessionStorage.setItem('pp_cupulas_customer_type', cupClientType);
    } catch(e) {}

    // Redirigir a Webpay
    var form  = document.createElement('form');
    form.method = 'POST';
    form.action = data.url;
    var input   = document.createElement('input');
    input.type  = 'hidden';
    input.name  = 'token_ws';
    input.value = data.token;
    form.appendChild(input);
    document.body.appendChild(form);
    form.submit();

  } catch(e) {
    btn.disabled = false;
    btn.innerHTML =
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3">' +
      '<rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>' +
      ' PAGAR CON WEBPAY';
    if (errEl) {
      errEl.textContent = 'Error al conectar con Webpay. Por favor intenta de nuevo.';
      errEl.style.display = 'block';
    }
  }
};

// ── Cerrar con ESC ───────────────────────────────────────────
document.addEventListener('keydown', function(e) {
  if (e.key !== 'Escape') return;
  closeCupQtyModal();
  closeCupolasDrawer();
  closeCupolasCheckout();
  closeCupolaDetail();
});

})(); // fin IIFE

// ── DataLayer (GTM / GA4 ecommerce) ──────────────────────────
window.dataLayer = window.dataLayer || [];
function dlPushCupulas(eventName, ecommerce) {
  window.dataLayer.push({ ecommerce: null });
  window.dataLayer.push({ event: eventName, ecommerce: ecommerce });
}

// ── GA4 view_item_list on page load ──────────────────────────
(function() {
  function _fire() {
    var _items = (window.CUPULAS || []).map(function(c, i) {
      return { item_id: 'CUP_' + c.id, item_name: c.nombre, item_brand: 'Polyplas', item_category: 'Cúpulas de Acrílico', item_variant: c.specs || '', price: c.precio, index: i };
    });
    dlPushCupulas('view_item_list', { currency: 'CLP', item_list_name: 'Cúpulas de Acrílico', items: _items });
  }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', _fire); } else { _fire(); }
})();

// ── Resultado de pago (retorno desde Webpay) ──────────────────
function cupCheckPaymentResult() {
  var params = new URLSearchParams(window.location.search);
  var pago   = params.get('pp_pago');
  if (!pago) return;

  var resultEl = document.getElementById('cupolasPagoResult');
  resultEl.style.cssText = [
    'position:fixed','inset:0','z-index:999999',
    'background:#f0f4fb','display:flex',
    'align-items:center','justify-content:center',
    'padding:24px','overflow-y:auto'
  ].join(';');

  if (pago === 'aprobado') {
    document.getElementById('cupolasResultOk').style.display  = 'block';
    document.getElementById('cupOrden').textContent = params.get('orden') || '—';
    var monto = parseInt(params.get('monto') || '0');
    document.getElementById('cupMonto').textContent = '$ ' + monto.toLocaleString('es-CL');
    document.getElementById('cupAuth').textContent  = params.get('auth')  || '—';
    window.history.replaceState({}, '', window.location.pathname + '#gracias');

    // DataLayer purchase
    try {
      var _dlItems = JSON.parse(sessionStorage.getItem('pp_cupulas_cart_dl') || '[]');
      var _dlTotal = parseInt(sessionStorage.getItem('pp_cupulas_total_dl') || String(monto));
      var _dlCustomerType = sessionStorage.getItem('pp_cupulas_customer_type') || 'PN';
      sessionStorage.removeItem('pp_cupulas_cart_dl');
      sessionStorage.removeItem('pp_cupulas_total_dl');
      sessionStorage.removeItem('pp_cupulas_customer_type');
      dlPushCupulas('purchase', {
        transaction_id: params.get('orden') || '',
        currency:       'CLP',
        value:          _dlTotal || monto,
        customer_type:  _dlCustomerType,
        items:          _dlItems
      });
    } catch(e) {}

    // Registrar en Supabase (CRM) + Google Sheets
    cupulasRegistrarOrden(params);

  } else {
    document.getElementById('cupolasResultFail').style.display = 'block';
    if (pago === 'cancelado') {
      document.getElementById('cupFailMsg').textContent =
        'Cancelaste el proceso de pago. Puedes volver a intentarlo cuando quieras.';
    }
    window.history.replaceState({}, '', window.location.pathname);
  }
}

function cupulasRegistrarOrden(params) {
  try {
    var _od = JSON.parse(sessionStorage.getItem('pp_cupulas_order_data') || 'null');
    if (!_od) return;
    if (!window.supabase || !window.POLYPLAS_CONFIG) {
      setTimeout(function() { cupulasRegistrarOrden(params); }, 350);
      return;
    }
    sessionStorage.removeItem('pp_cupulas_order_data');

    var _sb = window.supabase.createClient(
      window.POLYPLAS_CONFIG.SUPABASE_URL,
      window.POLYPLAS_CONFIG.SUPABASE_ANON_KEY
    );

    _sb.from('conversations').insert({
      id:              _od.convId,
      client_name:     _od.client.nombre || _od.client.razon || '',
      client_email:    _od.client.email  || '',
      unread_count:    1,
      last_message_at: new Date().toISOString(),
      metadata: {
        source:       'order',
        tipo_cliente: _od.client.tipo    || '',
        nombre:       _od.client.nombre  || '',
        razon_social: _od.client.razon   || '',
        rut:          _od.client.rut     || '',
        giro:         _od.client.giro    || '',
        contacto:     _od.client.contacto || '',
        rut_contacto: _od.client.rut_c   || '',
        email:        _od.client.email   || '',
        phone:        _od.client.tel     || '',
        dir:          _od.client.dir     || '',
        ciudad:       _od.client.ciudad  || '',
        region:       _od.client.region  || '',
        entrega:      _od.entregaLabel,
        total:        _od.total,
        items:        _od.orderItems,
        webpay_orden: params.get('orden') || '',
        webpay_auth:  params.get('auth')  || '',
        producto_tipo: 'cupulas'
      }
    }).then(function() {
      // Mensaje de texto en la conversación
      var _scriptURL = 'https://script.google.com/macros/s/AKfycbw4WkE3slUjbDIUrbYVZD-aL1nB6WWJeyj6XG6rpFNz9p3pSFfdmUd3FjY_hV-QQJNkKA/exec';
      var _msgText =
        'PEDIDO CÚPULA\n─────────────────\n' + _od.resumen +
        '\n─────────────────\nEntrega: ' + _od.entregaLabel +
        '   Total: $' + _od.total.toLocaleString('es-CL') +
        '\n─────────────────\nCliente: ' + (_od.client.nombre || _od.client.razon) +
        '  RUT: ' + _od.client.rut +
        '\nEmail: ' + _od.client.email +
        '  Tel: ' + _od.client.tel +
        '\nDirección: ' + _od.client.dir + ', ' + _od.client.ciudad + ', ' + _od.client.region;

      _sb.from('messages').insert({
        conversation_id: _od.convId,
        sender:          'client',
        content:         _msgText
      }).then(function(){});

      // Registro en Google Sheets
      fetch(_scriptURL + '?' + new URLSearchParams({
        accion:        'pedido_web',
        idRef:         _od.shortId,
        nombre:        _od.client.nombre || _od.client.razon || '',
        email:         _od.client.email  || '',
        telefono:      _od.client.tel    || '',
        monto:         String(_od.total),
        vendido:       'Sí',
        observaciones: _od.resumen + ' | Entrega: ' + _od.entregaLabel
      }).toString(), { mode: 'no-cors' });
    });
  } catch(e2) {}
}

// ── Sincronizar precios y stock desde Supabase ────────────────
// Lee pp_stock donde tipo='CUPULAS' y actualiza precios en tiempo real.
// Keys esperados: CUPULAS|54x54|na|na, CUPULAS|68x68|na|na, etc.
function loadCupulasStockFromSupabase() {
  if (!window.supabase || !window.POLYPLAS_CONFIG) {
    setTimeout(loadCupulasStockFromSupabase, 400);
    return;
  }
  var _sb = window.supabase.createClient(
    window.POLYPLAS_CONFIG.SUPABASE_URL,
    window.POLYPLAS_CONFIG.SUPABASE_ANON_KEY
  );
  _sb.from('pp_stock')
    .select('dim,cantidad,precio,precio_antes')
    .eq('tipo', 'CUPULAS')
    .then(function(res) {
      if (!res.data || !res.data.length) return;
      res.data.forEach(function(row) {
        var cup = (window.CUPULAS || []).find(function(c){ return c.id === row.dim; });
        if (!cup) return;

        // Stock 0 → deshabilitar botón; stock > 0 → re-habilitar
        var buyBtn = document.getElementById('buy-' + cup.id);
        if (buyBtn) {
          if (row.cantidad === 0) {
            buyBtn.disabled    = true;
            buyBtn.textContent = 'Sin stock';
          } else {
            buyBtn.disabled    = false;
            buyBtn.textContent = 'COMPRAR';
          }
        }

        // Precio actual
        if (row.precio !== null && row.precio !== undefined) {
          cup.precio = row.precio;
          var priceEl = document.getElementById('price-' + cup.id);
          if (priceEl) priceEl.innerHTML =
            '$ ' + Math.round(row.precio).toLocaleString('es-CL') +
            '<span class="pp-cupola-price-iva">c/IVA</span>';
        }

        // Precio antes y ahorro
        if (row.precio_antes && row.precio_antes > 0) {
          cup.precioAntes = row.precio_antes;
          var oldEl = document.getElementById('price-old-' + cup.id);
          if (oldEl) {
            oldEl.textContent = 'Antes $ ' + Math.round(row.precio_antes).toLocaleString('es-CL');
            oldEl.style.display = '';
          }
          var ahorro = row.precio_antes - (row.precio || cup.precio || 0);
          var ahorroEl = document.getElementById('ahorro-' + cup.id);
          if (ahorroEl && ahorro > 0) {
            ahorroEl.textContent  = 'Ahorras $ ' + Math.round(ahorro).toLocaleString('es-CL');
            ahorroEl.style.display = '';
          }
        } else {
          cup.precioAntes = null;
          var oldEl2 = document.getElementById('price-old-' + cup.id);
          if (oldEl2) oldEl2.style.display = 'none';
          var ahorroEl2 = document.getElementById('ahorro-' + cup.id);
          if (ahorroEl2) ahorroEl2.style.display = 'none';
        }
      });
      setTimeout(loadCupulasStockFromSupabase, 120000);
    }).catch(function(e) {
      console.warn('PP cupulas stock load:', e);
      setTimeout(loadCupulasStockFromSupabase, 120000);
    });
}

// Iniciar sincronización y verificar resultado de pago
loadCupulasStockFromSupabase();
cupCheckPaymentResult();
