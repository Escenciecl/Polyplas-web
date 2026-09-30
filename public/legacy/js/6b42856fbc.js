(function() {
'use strict';

// ── Datos de productos ────────────────────────────────────────
var RECEPTACULOS = window.RECEPTACULOS = [
  {
    id:          '80x80_cuad',
    nombre:      'Receptáculo Cuadrado 80×80 cm',
    specs:       'Acrílico reciclable · 80×80 cm · 13,5 cm · Push-Up',
    precio:      76279,
    precioAntes: 95500,
    img:         '/wp-content/uploads/2025/02/CCB16685-7F31-4E4C-9C4D-36582D221238.jpg'
  },
  {
    id:          '90x90_cuad',
    nombre:      'Receptáculo Cuadrado 90×90 cm',
    specs:       'Acrílico sanitario + fibra de vidrio · 90×90 cm · 13,5 cm · Push-Up',
    precio:      88804,
    precioAntes: 102500,
    img:         '/wp-content/uploads/2025/02/5524DD2C-0DC7-4EEB-90C5-BBA9D77EC3F6.jpg'
  },
  {
    id:          '90x90_esq',
    nombre:      'Receptáculo Esquinero 90×90 cm',
    specs:       'Acrílico sanitario + fibra de vidrio · 90×90 cm · Esquinero · Push-Up',
    precio:      88804,
    precioAntes: 99500,
    img:         '/wp-content/uploads/2025/02/80370B04-D19B-4011-95A4-FC2932B2A6FC.jpg'
  }
];

// ── Datos para modal de detalle ───────────────────────────────
var RECEPTACULOS_DETAIL = {
  '80x80_cuad': {
    label: 'Receptáculo de Ducha',
    title: 'Cuadrado 80 × 80 cm — Push-Up',
    specs: [
      ['Dimensiones',    '80 × 80 cm'],
      ['Altura',         '13,5 cm'],
      ['Material',       'Acrílico reciclable de alta resistencia'],
      ['Desagüe',        'Metálico robusto con sistema push-up'],
      ['Superficie',     'Textura antideslizante'],
      ['Mantenimiento',  'Material no poroso · Fácil limpieza'],
      ['Compatibilidad', 'Orificio estándar · Compatible con sifones universales']
    ],
    desc: [
      { h: 'Eficiencia y diseño compacto',
        p: 'Con medidas de 80×80 cm y altura de 13,5 cm, este receptáculo está diseñado para optimizar baños pequeños o secundarios sin sacrificar funcionalidad. Su forma cuadrada favorece una caída de agua equilibrada hacia el desagüe, mejorando el drenaje de forma natural.' },
      { h: 'Material sostenible y resistente',
        p: 'Fabricado en acrílico reciclable de alta resistencia, es respetuoso con el medio ambiente y soporta perfectamente el uso diario sin perder su brillo. El acrílico es un material no poroso que facilita la limpieza y previene la formación de hongos o acumulación de sarro.' },
      { h: 'Kit de desagüe Push-Up incluido',
        p: 'Incluye desagüe metálico robusto y sistema push-up para una apertura y cierre cómodo y estético. La superficie con textura antideslizante brinda mayor seguridad para toda la familia.' }
    ]
  },
  '90x90_cuad': {
    label: 'Receptáculo de Ducha',
    title: 'Cuadrado 90 × 90 cm — Push-Up',
    specs: [
      ['Dimensiones',    '90 × 90 cm'],
      ['Altura',         '13,5 cm'],
      ['Material',       'Acrílico sanitario reforzado con fibra de vidrio'],
      ['Desagüe',        'Metálico de alta durabilidad con tapón push-up'],
      ['Seguridad',      'Textura antideslizante · Propiedades antibacterianas'],
      ['Bordes',         'Reforzados · Evita deformaciones'],
      ['Compatibilidad', 'Orificio estándar · Compatible con mayoría de válvulas y sifones']
    ],
    desc: [
      { h: 'Durabilidad superior con fibra de vidrio',
        p: 'Fabricado en acrílico sanitario reforzado con fibra de vidrio, este receptáculo 90×90 cm garantiza alta resistencia a golpes, arañazos y cambios bruscos de temperatura. Sus bordes reforzados evitan deformaciones, asegurando una base firme y estable durante el uso diario.' },
      { h: 'Seguridad e higiene comprobada',
        p: 'La base con textura antideslizante y propiedades antibacterianas crea un entorno más higiénico y seguro. La altura de 13,5 cm facilita el acceso seguro mientras mantiene un perfil bajo y elegante en el baño.' },
      { h: 'Accesorios premium incluidos',
        p: 'El kit incluye desagüe metálico de alta durabilidad y tapón push-up (apertura al tacto), ofreciendo un acabado estético y funcional. Compatible con la mayoría de los sistemas de sifones estándar del mercado.' }
    ]
  },
  '90x90_esq': {
    label: 'Receptáculo de Ducha',
    title: 'Esquinero 90 × 90 cm — Push-Up',
    specs: [
      ['Dimensiones',    '90 × 90 cm'],
      ['Tipo',           'Esquinero (pentagonal)'],
      ['Material',       'Acrílico sanitario de alto impacto + fibra de vidrio'],
      ['Desagüe',        'Metálico robusto con sistema push-up'],
      ['Seguridad',      'Textura antideslizante · Bordes reforzados'],
      ['Higiene',        'Baja porosidad · Limpieza con agua y jabón neutro'],
      ['Instalación',    'Base nivelada · Compatible con sifones estándar']
    ],
    desc: [
      { h: 'Diseño esquinero para maximizar espacio',
        p: 'Con dimensiones de 90×90 cm, este receptáculo esquinero está diseñado para baños medianos y grandes que buscan maximizar el área de circulación. Su forma pentagonal aprovecha el rincón de manera eficiente y sus bordes reforzados facilitan el sellado con mamparas curvas o angulares.' },
      { h: 'Construcción de alto impacto',
        p: 'El acrílico sanitario de alto impacto, reforzado estructuralmente con fibra de vidrio, evita deformaciones con el paso del tiempo. El material de baja porosidad impide la acumulación de bacterias y facilita la limpieza solo con agua y jabón neutro.' },
      { h: 'Instalación rápida y universal',
        p: 'Su base nivelada está diseñada para una instalación rápida y compatible con la mayoría de los sistemas de sifones estándar. El kit incluye desagüe metálico robusto y tapón con sistema push-up (apertura y cierre mediante presión), ofreciendo un acabado elegante y funcional.' }
    ]
  }
};

// ── Estado ───────────────────────────────────────────────────
var receptCart = [];
var receptQtyModalState = { producto: null, qty: 1 };
var receptClientType = 'PN';

// ── Utilidades ───────────────────────────────────────────────
function receptFmt(n) {
  return '$ ' + Math.round(n).toLocaleString('es-CL');
}

function receptShowToast(msg, type) {
  var el = document.getElementById('receptToast');
  el.textContent = msg;
  el.className = 'pp-toast' + (type ? ' pp-toast--' + type : '');
  el.classList.add('show');
  setTimeout(function() { el.classList.remove('show'); }, 3000);
}

// ── Cart helpers ─────────────────────────────────────────────
function receptCartTotal() {
  return receptCart.reduce(function(s, i) { return s + i.precio * i.qty; }, 0);
}
function receptCartCount() {
  return receptCart.reduce(function(s, i) { return s + i.qty; }, 0);
}
function receptUpdateFloatingCart() {
  var btn   = document.getElementById('receptFloatingCart');
  var badge = document.getElementById('receptCartBadge');
  var count = receptCartCount();
  btn.style.display = count > 0 ? 'flex' : 'none';
  badge.textContent = count;
}

// ── Drawer ───────────────────────────────────────────────────
function receptRenderDrawer() {
  var container = document.getElementById('receptDrawerItems');
  var totalEl   = document.getElementById('receptDrawerTotal');
  var countEl   = document.getElementById('receptDrawerCount');

  if (!receptCart.length) {
    container.innerHTML =
      '<div class="pp-recep-drawer-empty">' +
      '<div class="pp-recep-drawer-empty-icon">🚿</div>' +
      '<div class="pp-recep-drawer-empty-title">Tu carrito está vacío</div>' +
      '<div class="pp-recep-drawer-empty-sub">Agrega uno o más receptáculos para continuar.</div>' +
      '</div>';
    totalEl.textContent = '$ 0';
    countEl.textContent = '0';
    return;
  }

  countEl.textContent = receptCartCount();
  totalEl.textContent = receptFmt(receptCartTotal());

  container.innerHTML = receptCart.map(function(item, idx) {
    return '<div class="pp-recep-drawer-item">' +
      '<img class="pp-recep-drawer-item-thumb" src="' + item.img + '" alt="' + item.nombre + '">' +
      '<div class="pp-recep-drawer-item-body">' +
        '<div class="pp-recep-drawer-item-name">' + item.nombre + '</div>' +
        '<div class="pp-recep-drawer-item-sub">'  + item.specs  + '</div>' +
      '</div>' +
      '<div class="pp-recep-drawer-item-right">' +
        '<div class="pp-recep-drawer-item-price">' + receptFmt(item.precio * item.qty) + '</div>' +
        '<div class="pp-recep-drawer-item-qty">' +
          '<button class="pp-recep-drawer-qty-btn" onclick="receptDrawerQty(' + idx + ',-1)">−</button>' +
          '<span class="pp-recep-drawer-qty-val">' + item.qty + '</span>' +
          '<button class="pp-recep-drawer-qty-btn" onclick="receptDrawerQty(' + idx + ',1)">+</button>' +
        '</div>' +
        '<button class="pp-recep-drawer-item-remove" onclick="receptRemoveFromCart(' + idx + ')">Eliminar</button>' +
      '</div>' +
    '</div>';
  }).join('');
}

window.receptDrawerQty = function(idx, delta) {
  receptCart[idx].qty = Math.max(1, receptCart[idx].qty + delta);
  receptRenderDrawer();
  receptUpdateFloatingCart();
};

window.receptRemoveFromCart = function(idx) {
  receptCart.splice(idx, 1);
  receptRenderDrawer();
  receptUpdateFloatingCart();
  if (!receptCart.length) closeReceptDrawer();
};

window.openReceptDrawer = function() {
  if (window.ppGCOpen) { window.ppGCOpen(); return; }
  receptRenderDrawer();
  document.getElementById('receptCartDrawer').classList.add('open');
  document.getElementById('receptDrawerOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
};
window.closeReceptDrawer = function() {
  document.getElementById('receptCartDrawer').classList.remove('open');
  document.getElementById('receptDrawerOverlay').classList.remove('open');
  document.body.style.overflow = '';
};

// ── Qty modal ────────────────────────────────────────────────
window.receptOpenQtyModal = function(id, nombre, specs, img, idx) {
  var prod = RECEPTACULOS.find(function(p){ return p.id === id; }) || RECEPTACULOS[idx] || {};
  receptQtyModalState.producto = prod;
  receptQtyModalState.qty      = 1;

  document.getElementById('recepQtyThumb').src       = prod.img || img;
  document.getElementById('recepQtyName').textContent = nombre;
  document.getElementById('recepQtySub').textContent  = specs;
  document.getElementById('recepQtyUnit').textContent = prod.precio ? receptFmt(prod.precio) + ' c/u · IVA incl.' : '$ — · IVA incl.';
  document.getElementById('recepQtyDisplay').textContent = '1';
  document.getElementById('recepQtyMinus').disabled = true;
  receptUpdateQtyTotal();
  document.getElementById('receptQtyModal').classList.add('open');
  document.body.style.overflow = 'hidden';
  dlPushRecep('view_item', {
    currency: 'CLP',
    value: prod.precio || 0,
    items: [{ item_id: 'REC_' + (prod.id || id), item_name: prod.nombre || nombre, item_brand: 'Polyplas', item_category: 'Receptáculos de Ducha', item_variant: prod.specs || specs || '', price: prod.precio || 0, quantity: 1, index: 0 }]
  });
};

function receptUpdateQtyTotal() {
  var p     = receptQtyModalState.producto;
  var total = p && p.precio ? receptFmt(p.precio * receptQtyModalState.qty) : '$ —';
  document.getElementById('recepQtyTotalVal').textContent = total;
}

window.receptChangeModalQty = function(delta) {
  receptQtyModalState.qty = Math.max(1, receptQtyModalState.qty + delta);
  document.getElementById('recepQtyDisplay').textContent   = receptQtyModalState.qty;
  document.getElementById('recepQtyMinus').disabled = receptQtyModalState.qty <= 1;
  receptUpdateQtyTotal();
};

window.closeReceptQtyModal = function() {
  document.getElementById('receptQtyModal').classList.remove('open');
  document.body.style.overflow = '';
};

window.receptAddToCart = function() {
  var p = receptQtyModalState.producto;
  if (!p) return;
  var idx = receptCart.findIndex(function(i){ return i.id === p.id; });
  if (idx >= 0) {
    receptCart[idx].qty += receptQtyModalState.qty;
  } else {
    receptCart.push({ id: p.id, nombre: p.nombre, specs: p.specs, precio: p.precio, img: p.img, qty: receptQtyModalState.qty });
  }
  // Carrito global
  try {
    var _gcIdx = idx >= 0 ? idx : receptCart.length - 1;
    var _gcItem = receptCart[_gcIdx];
    if (!_gcItem._gid) _gcItem._gid = 'gc-' + Date.now().toString(36) + Math.random().toString(36).slice(2,7);
    typeof window.ppGlobalCartAdd === 'function' && window.ppGlobalCartAdd({
      gid: _gcItem._gid, sku: 'REC_' + _gcItem.id, module: 'receptaculos',
      nombre: _gcItem.nombre + (_gcItem.specs ? ' · ' + _gcItem.specs : ''),
      qty: _gcItem.qty, precio_unit: _gcItem.precio, corte_costo: 0,
      subtotal: _gcItem.precio * _gcItem.qty,
      descripcion: _gcItem.nombre + ' × ' + _gcItem.qty
    });
  } catch(e) {}
  dlPushRecep('add_to_cart', {
    currency: 'CLP',
    value: p.precio * receptQtyModalState.qty,
    items: [{ item_id: 'REC_' + p.id, item_name: p.nombre, item_brand: 'Polyplas', item_category: 'Receptáculos de Ducha', item_variant: p.specs || '', price: p.precio, quantity: receptQtyModalState.qty, index: 0 }]
  });
  receptRenderDrawer();
  receptUpdateFloatingCart();
  receptShowToast('✓ ' + p.nombre + ' agregado al pedido', 'success');
};

// ── Detail modal ─────────────────────────────────────────────
window.openReceptDetail = function(id) {
  var d = RECEPTACULOS_DETAIL[id];
  var p = RECEPTACULOS.find(function(x){ return x.id === id; });
  if (!d || !p) return;

  document.getElementById('recepDetailLabel').textContent = d.label;
  document.getElementById('recepDetailTitle').textContent = d.title;
  document.getElementById('recepDetailImg').src           = p.img;
  document.getElementById('recepDetailImg').alt           = p.nombre;
  document.getElementById('recepDetailPrice').textContent = receptFmt(p.precio);

  var oldEl    = document.getElementById('recepDetailPriceOld');
  var ahorroEl = document.getElementById('recepDetailAhorro');
  if (p.precioAntes && p.precioAntes > p.precio) {
    oldEl.textContent      = 'Antes ' + receptFmt(p.precioAntes);
    oldEl.style.display    = 'block';
    ahorroEl.textContent   = 'Ahorras ' + receptFmt(p.precioAntes - p.precio);
    ahorroEl.style.display = 'block';
  } else {
    oldEl.style.display    = 'none';
    ahorroEl.style.display = 'none';
  }

  var specsHtml = d.specs.map(function(row) {
    return '<tr><td>' + row[0] + '</td><td>' + row[1] + '</td></tr>';
  }).join('');
  document.getElementById('recepDetailSpecs').innerHTML = specsHtml;

  var descHtml = d.desc.map(function(s) {
    return '<div class="pp-recep-detail-section"><h3>' + s.h + '</h3><p>' + s.p + '</p></div>';
  }).join('');
  document.getElementById('recepDetailDesc').innerHTML = descHtml;

  var buyBtn = document.getElementById('recepDetailBuyBtn');
  buyBtn.onclick = function() {
    closeReceptDetail();
    receptOpenQtyModal(id, p.nombre, p.specs, p.img, RECEPTACULOS.indexOf(p));
  };

  dlPushRecep('view_item', {
    currency: 'CLP',
    value: p.precio || 0,
    items: [{ item_id: 'REC_' + id, item_name: p.nombre, item_brand: 'Polyplas', item_category: 'Receptáculos de Ducha', item_variant: p.specs || '', price: p.precio || 0, quantity: 1, index: 0 }]
  });
  document.getElementById('receptDetailOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  history.replaceState(null, '', window.location.pathname + window.location.search + '#producto=' + id);
};

window.closeReceptDetail = function() {
  document.getElementById('receptDetailOverlay').classList.remove('open');
  document.body.style.overflow = '';
  history.replaceState(null, '', window.location.pathname + window.location.search);
};

// ── Checkout ─────────────────────────────────────────────────
window.openReceptCheckout = function() {
  if (!receptCart.length) { receptShowToast('Agrega al menos un producto para continuar'); return; }
  dlPushRecep('begin_checkout', { currency: 'CLP', value: receptCartTotal(), customer_type: receptClientType, items: receptCart.map(function(i, idx) { return { item_id: 'REC_' + i.id, item_name: i.nombre, item_brand: 'Polyplas', item_category: 'Receptáculos de Ducha', item_variant: i.specs || '', price: i.precio, quantity: i.qty, index: idx }; }) });
  if (window.ppGCOpen) { window.ppGCOpen(); return; }
  document.getElementById('recepStep1').style.display = '';
  document.getElementById('recepStep2').style.display = 'none';
  document.getElementById('recepCkStep1').className = 'pp-recep-checkout-step active';
  document.getElementById('recepCkStep2').className = 'pp-recep-checkout-step';
  document.getElementById('recepCkLine').className  = 'pp-recep-checkout-step-line';
  document.getElementById('recepStep1OrderItems').innerHTML = receptCart.map(function(i) {
    return '<div class="pp-recep-modal-order-item">' +
      '<span class="desc">' + i.nombre + ' × ' + i.qty + '</span>' +
      '<span class="monto">' + receptFmt(i.precio * i.qty) + '</span>' +
      '</div>';
  }).join('');
  document.getElementById('receptCheckoutModal').classList.add('open');
  document.body.style.overflow = 'hidden';
};

window.closeReceptCheckout = function() {
  document.getElementById('receptCheckoutModal').classList.remove('open');
  document.body.style.overflow = '';
};

window.receptSetClient = function(type) {
  receptClientType = type;
  document.getElementById('recepBtnPN').classList.toggle('active', type === 'PN');
  document.getElementById('recepBtnEMP').classList.toggle('active', type === 'EMP');
  document.getElementById('recepFieldsPN').style.display  = type === 'PN'  ? '' : 'none';
  document.getElementById('recepFieldsEMP').style.display = type === 'EMP' ? '' : 'none';
};

// RUT formatter
window.receptFormatRut = function(inp) {
  var v = inp.value.replace(/[^0-9kK]/g,'');
  if (v.length < 2) { inp.value = v; return; }
  var cuerpo = v.slice(0,-1);
  var dv     = v.slice(-1).toUpperCase();
  var fmt = '';
  while (cuerpo.length > 3) {
    fmt    = '.' + cuerpo.slice(-3) + fmt;
    cuerpo = cuerpo.slice(0,-3);
  }
  inp.value = cuerpo + fmt + '-' + dv;
};

function receptValidateRut(rut) {
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

window.receptTelInput = function(inp) {
  var v = inp.value;
  if (!v.startsWith('+56 ')) { inp.value = '+56 '; return; }
  var digits = v.slice(4).replace(/\D/g,'');
  if (digits.length > 9) digits = digits.slice(0,9);
  inp.value = '+56 ' + digits;
};

function receptGetCheckoutData() {
  if (receptClientType === 'PN') {
    return {
      tipo:   'Persona Natural',
      nombre: document.getElementById('rec_pn_nombre').value.trim(),
      rut:    document.getElementById('rec_pn_rut').value.trim(),
      tel:    document.getElementById('rec_pn_tel').value.trim(),
      email:  document.getElementById('rec_pn_email').value.trim(),
      region: document.getElementById('rec_pn_region').value,
      ciudad: document.getElementById('rec_pn_comuna').value.trim(),
      dir:    document.getElementById('rec_pn_dir').value.trim()
    };
  }
  return {
    tipo:     'Empresa',
    razon:    document.getElementById('rec_emp_razon').value.trim(),
    rut:      document.getElementById('rec_emp_rut').value.trim(),
    giro:     document.getElementById('rec_emp_giro').value.trim(),
    contacto: document.getElementById('rec_emp_contacto').value.trim(),
    rut_c:    document.getElementById('rec_emp_rut_c').value.trim(),
    tel:      document.getElementById('rec_emp_tel').value.trim(),
    email:    document.getElementById('rec_emp_email').value.trim(),
    region:   document.getElementById('rec_emp_region').value,
    ciudad:   document.getElementById('rec_emp_comuna').value.trim(),
    dir:      document.getElementById('rec_emp_dir').value.trim()
  };
}

function receptShowFieldError(fieldId, errId, show) {
  var field = document.getElementById(fieldId);
  var err   = document.getElementById(errId);
  if (!field) return;
  if (show) {
    field.classList.add('pp-recep-input-error');
    if (err) err.style.display = 'block';
  } else {
    field.classList.remove('pp-recep-input-error');
    if (err) err.style.display = 'none';
  }
}

window.receptGoStep2 = function() {
  var errEl = document.getElementById('recepStep1Error');
  errEl.style.display = 'none';
  var ok = true;

  if (receptClientType === 'PN') {
    var nombre = document.getElementById('rec_pn_nombre').value.trim();
    var rut    = document.getElementById('rec_pn_rut').value.trim();
    var tel    = document.getElementById('rec_pn_tel').value.trim();
    var email  = document.getElementById('rec_pn_email').value.trim();
    var region = document.getElementById('rec_pn_region').value;
    var ciudad = document.getElementById('rec_pn_comuna').value.trim();
    var dir    = document.getElementById('rec_pn_dir').value.trim();

    if (!nombre) { errEl.textContent = 'Ingresa tu nombre completo.'; errEl.style.display = 'block'; ok = false; }
    else if (!receptValidateRut(rut)) { receptShowFieldError('rec_pn_rut','rec_pn_rut_err',true); ok = false; }
    else { receptShowFieldError('rec_pn_rut','rec_pn_rut_err',false); }

    var digits = tel.replace(/\D/g,'');
    if (!digits || digits.length < 11) { receptShowFieldError('rec_pn_tel','rec_pn_tel_err',true); ok = false; }
    else receptShowFieldError('rec_pn_tel','rec_pn_tel_err',false);

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { receptShowFieldError('rec_pn_email','rec_pn_email_err',true); ok = false; }
    else receptShowFieldError('rec_pn_email','rec_pn_email_err',false);

    if (!region || !ciudad || !dir) { errEl.textContent = 'Completa región, comuna y dirección.'; errEl.style.display = 'block'; ok = false; }

  } else {
    var razon  = document.getElementById('rec_emp_razon').value.trim();
    var rutE   = document.getElementById('rec_emp_rut').value.trim();
    var giro   = document.getElementById('rec_emp_giro').value.trim();
    var telE   = document.getElementById('rec_emp_tel').value.trim();
    var emailE = document.getElementById('rec_emp_email').value.trim();
    var regionE= document.getElementById('rec_emp_region').value;
    var ciudadE= document.getElementById('rec_emp_comuna').value.trim();
    var dirE   = document.getElementById('rec_emp_dir').value.trim();

    if (!razon || !giro) { errEl.textContent = 'Ingresa razón social y giro.'; errEl.style.display = 'block'; ok = false; }
    if (!receptValidateRut(rutE)) { receptShowFieldError('rec_emp_rut','rec_emp_rut_err',true); ok = false; }
    else receptShowFieldError('rec_emp_rut','rec_emp_rut_err',false);

    var dE = telE.replace(/\D/g,'');
    if (!dE || dE.length < 11) { receptShowFieldError('rec_emp_tel','rec_emp_tel_err',true); ok = false; }
    else receptShowFieldError('rec_emp_tel','rec_emp_tel_err',false);

    if (!emailE || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailE)) { receptShowFieldError('rec_emp_email','rec_emp_email_err',true); ok = false; }
    else receptShowFieldError('rec_emp_email','rec_emp_email_err',false);

    if (!regionE || !ciudadE || !dirE) { errEl.textContent = 'Completa región, comuna y dirección.'; errEl.style.display = 'block'; ok = false; }
  }

  if (!ok) return;

  document.getElementById('recepStep1').style.display = 'none';
  document.getElementById('recepStep2').style.display = '';
  document.getElementById('recepCkStep1').className = 'pp-recep-checkout-step done';
  document.getElementById('recepCkStep2').className = 'pp-recep-checkout-step active';
  document.getElementById('recepCkLine').className  = 'pp-recep-checkout-step-line done';

  document.getElementById('recepStep2OrderItems').innerHTML = receptCart.map(function(i) {
    return '<div class="pp-recep-modal-order-item">' +
      '<span class="desc">' + i.nombre + ' × ' + i.qty + '</span>' +
      '<span class="monto">' + receptFmt(i.precio * i.qty) + '</span>' +
    '</div>';
  }).join('');
  document.getElementById('recepStep2Total').textContent = receptFmt(receptCartTotal());
  receptRenderEntregaOptions();
};
var recepSelectedEntrega = null;
function recepRenderEntregaOptions() {
  var el = document.getElementById("recepEntregaOptions");
  if (!el) return;
  el.innerHTML = "";
  recepSelectedEntrega = null;
  ["recepRetiroInfo","recepEnvioInfo","recepAddressSection"].forEach(function(id){
    var s=document.getElementById(id); if(s) s.style.display="none";
  });
  var wb = document.getElementById("recepBtnPay");
  if (wb) { wb.disabled=true; wb.style.opacity="0.5"; wb.style.cursor="not-allowed"; }
  var opciones = [
    {id:"retiro_tienda",icon:"🏪",label:"Retiro en tienda",desc:"Retira en nuestra bodega en Santiago · Sin costo",badge:"<span class=\"pp-recep-entrega-badge badge-gratis\">GRATIS</span>",needsAddress:false},
    {id:"despacho",icon:"🚚",label:"Despacho a domicilio",desc:"Gratis para Región Metropolitana · 1 a 3 días hábiles",badge:"<span class=\"pp-recep-entrega-badge badge-gratis\">GRATIS</span>",needsAddress:true},
    {id:"envio_propio",icon:"📦",label:"Envío propio",desc:"Coordinas tú el transporte desde nuestra bodega en Santiago",badge:"<span class=\"pp-recep-entrega-badge badge-propio\">TÚ GESTIONAS</span>",needsAddress:false}
  ];
  opciones.forEach(function(op) {
    var div=document.createElement("div");
    div.className="pp-recep-entrega-opt";
    div.style.cssText="display:flex;align-items:center;gap:12px;padding:14px 16px;border:2px solid #dde4ef;border-radius:12px;cursor:pointer;background:#fff;";
    div.innerHTML="<span style=\"font-size:1.3rem;flex-shrink:0\">"+op.icon+"</span>"
      +"<div style=\"flex:1\"><strong style=\"display:block;font-size:0.85rem;color:#1a1a2e;font-weight:600;\">"+op.label+"</strong>"
      +"<span style=\"font-size:0.75rem;color:#666;\">"+op.desc+"</span></div>"+op.badge;
    div.addEventListener("click",function() {
      document.querySelectorAll("#recepEntregaOptions .pp-recep-entrega-opt").forEach(function(x){
        x.style.borderColor="#dde4ef"; x.style.background="#fff";
      });
      div.style.borderColor="#004a99"; div.style.background="#edf2ff";
      recepSelectedEntrega={id:op.id,label:op.label,needsAddress:op.needsAddress,costo:0};
      dlPushRecep('add_shipping_info', { currency: 'CLP', value: receptCartTotal(), shipping_tier: op.id, customer_type: receptClientType, items: receptCart.map(function(i, idx) { return { item_id: 'REC_' + i.id, item_name: i.nombre, item_brand: 'Polyplas', item_category: 'Receptáculos de Ducha', item_variant: i.specs || '', price: i.precio, quantity: i.qty, index: idx }; }) });
      var e2=document.getElementById("recepStep2Error"); if(e2) e2.style.display="none";
      if(wb){wb.disabled=false;wb.style.opacity="";wb.style.cursor="";}
      document.getElementById("recepRetiroInfo").style.display  = op.id==="retiro_tienda"?"block":"none";
      document.getElementById("recepEnvioInfo").style.display   = op.id==="envio_propio" ?"block":"none";
      document.getElementById("recepAddressSection").style.display = op.id==="despacho"  ?"block":"none";
    });
    el.appendChild(div);
  });
}


window.receptGoBackStep1 = function() {
  receptSelectedEntrega = null;
  document.getElementById('recepStep1').style.display = '';
  document.getElementById('recepStep2').style.display = 'none';
  document.getElementById('recepCkStep1').className = 'pp-recep-checkout-step active';
  document.getElementById('recepCkStep2').className = 'pp-recep-checkout-step';
  document.getElementById('recepCkLine').className  = 'pp-recep-checkout-step-line';
};

// ── Submit pedido ─────────────────────────────────────────────
window.receptSubmitOrder = async function() {
  var btn    = document.getElementById('recepBtnPay');
  var errEl  = document.getElementById('recepStep2Error');
  var client = receptGetCheckoutData();
  if (!recepSelectedEntrega) {
    var _e2=document.getElementById("recepStep2Error");
    if(_e2){_e2.textContent="Elige una modalidad de entrega para continuar.";_e2.style.display="block";}
    btn.disabled=false; btn.textContent="PAGAR CON WEBPAY"; return;
  }
  var entregaLabel = recepSelectedEntrega.label;
  var total  = receptCartTotal();
  if (recepSelectedEntrega.needsAddress) {
    var _dr=document.getElementById("recep_despacho_region")?.value||"";
    var _dc=document.getElementById("recep_despacho_comuna")?.value.trim()||"";
    var _dd=document.getElementById("recep_despacho_dir")?.value.trim()||"";
    if (!_dr||!_dc||!_dd){
      var _e2=document.getElementById("recepStep2Error");
      if(_e2){_e2.textContent="Completa la dirección de despacho.";_e2.style.display="block";}
      btn.disabled=false; btn.textContent="PAGAR CON WEBPAY"; return;
    }
    client.dir_despacho=_dd; client.region_despacho=_dr; client.ciudad_despacho=_dc;
  }

  btn.disabled    = true;
  btn.textContent = 'Procesando…';
  dlPushRecep('add_payment_info', { currency: 'CLP', value: total, payment_type: 'Webpay', customer_type: receptClientType, items: receptCart.map(function(i, idx) { return { item_id: 'REC_' + i.id, item_name: i.nombre, item_brand: 'Polyplas', item_category: 'Receptáculos de Ducha', item_variant: i.specs || '', price: i.precio, quantity: i.qty, index: idx }; }) });
  if (errEl) errEl.style.display = 'none';

  var convId  = (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).slice(2);
  var shortId = 'PP-REC-' + convId.split('-').pop().substring(0,5).toUpperCase();

  var orderItems = receptCart.map(function(i) {
    return { tipo: i.nombre, dim: i.specs, qty: i.qty, precio: i.precio };
  });
  var resumen = receptCart.map(function(i) {
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
      sessionStorage.setItem('pp_recep_order_data', _orderJson);
      sessionStorage.setItem('pp_recep_cart_dl', JSON.stringify(receptCart.map(function(i, idx) {
        return {
          item_id:       'REC_' + i.id,
          item_name:     i.nombre,
          item_brand:    'Polyplas',
          item_category: 'Receptáculos de Ducha',
          item_variant:  i.specs,
          price:         i.precio,
          quantity:      i.qty,
          index:         idx
        };
      })));
      sessionStorage.setItem('pp_recep_total_dl', String(Math.round(total)));
      sessionStorage.setItem('pp_recep_customer_type', receptClientType);
    } catch(e) {}

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
  closeReceptQtyModal();
  closeReceptDrawer();
  closeReceptCheckout();
  closeReceptDetail();
});

})(); // fin IIFE

// ── DataLayer (GTM / GA4 ecommerce) ──────────────────────────
window.dataLayer = window.dataLayer || [];
function dlPushRecep(eventName, ecommerce) {
  window.dataLayer.push({ ecommerce: null });
  window.dataLayer.push({ event: eventName, ecommerce: ecommerce });
}

// ── GA4 view_item_list on page load ──────────────────────────
(function() {
  function _fire() {
    var _items = (window.RECEPTACULOS || []).map(function(p, i) {
      return { item_id: 'REC_' + p.id, item_name: p.nombre, item_brand: 'Polyplas', item_category: 'Receptáculos de Ducha', item_variant: p.specs || '', price: p.precio, index: i };
    });
    dlPushRecep('view_item_list', { currency: 'CLP', item_list_name: 'Receptáculos de Ducha', items: _items });
  }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', _fire); } else { _fire(); }
})();

// ── Resultado de pago (retorno desde Webpay) ──────────────────
function recepCheckPaymentResult() {
  var params = new URLSearchParams(window.location.search);
  var pago   = params.get('pp_pago');
  if (!pago) return;

  var resultEl = document.getElementById('receptPagoResult');
  resultEl.style.cssText = [
    'position:fixed','inset:0','z-index:999999',
    'background:#f0f4fb','display:flex',
    'align-items:center','justify-content:center',
    'padding:24px','overflow-y:auto'
  ].join(';');

  if (pago === 'aprobado') {
    document.getElementById('receptResultOk').style.display = 'block';
    document.getElementById('recepOrden').textContent = params.get('orden') || '—';
    var monto = parseInt(params.get('monto') || '0');
    document.getElementById('recepMonto').textContent = '$ ' + monto.toLocaleString('es-CL');
    document.getElementById('recepAuth').textContent  = params.get('auth')  || '—';
    window.history.replaceState({}, '', window.location.pathname + '#gracias');

    // DataLayer purchase
    try {
      var _dlItems = JSON.parse(sessionStorage.getItem('pp_recep_cart_dl') || '[]');
      var _dlTotal = parseInt(sessionStorage.getItem('pp_recep_total_dl') || String(monto));
      var _dlCustomerType = sessionStorage.getItem('pp_recep_customer_type') || 'PN';
      sessionStorage.removeItem('pp_recep_cart_dl');
      sessionStorage.removeItem('pp_recep_total_dl');
      sessionStorage.removeItem('pp_recep_customer_type');
      dlPushRecep('purchase', {
        transaction_id: params.get('orden') || '',
        currency:       'CLP',
        value:          _dlTotal || monto,
        customer_type:  _dlCustomerType,
        items:          _dlItems
      });
    } catch(e) {}

    // Registrar en Supabase (CRM) + Google Sheets
    receptaculosRegistrarOrden(params);

  } else {
    document.getElementById('receptResultFail').style.display = 'block';
    if (pago === 'cancelado') {
      document.getElementById('recepFailMsg').textContent =
        'Cancelaste el proceso de pago. Puedes volver a intentarlo cuando quieras.';
    }
    window.history.replaceState({}, '', window.location.pathname);
  }
}

function receptaculosRegistrarOrden(params) {
  try {
    var _od = JSON.parse(sessionStorage.getItem('pp_recep_order_data') || 'null');
    if (!_od) return;
    if (!window.supabase || !window.POLYPLAS_CONFIG) {
      setTimeout(function() { receptaculosRegistrarOrden(params); }, 350);
      return;
    }
    sessionStorage.removeItem('pp_recep_order_data');

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
        source:        'order',
        tipo_cliente:  _od.client.tipo     || '',
        nombre:        _od.client.nombre   || '',
        razon_social:  _od.client.razon    || '',
        rut:           _od.client.rut      || '',
        giro:          _od.client.giro     || '',
        contacto:      _od.client.contacto || '',
        rut_contacto:  _od.client.rut_c    || '',
        email:         _od.client.email    || '',
        phone:         _od.client.tel      || '',
        dir:           _od.client.dir      || '',
        ciudad:        _od.client.ciudad   || '',
        region:        _od.client.region   || '',
        entrega:       _od.entregaLabel,
        total:         _od.total,
        items:         _od.orderItems,
        webpay_orden:  params.get('orden') || '',
        webpay_auth:   params.get('auth')  || '',
        producto_tipo: 'receptaculos'
      }
    }).then(function() {
      var _scriptURL = 'https://script.google.com/macros/s/AKfycbw4WkE3slUjbDIUrbYVZD-aL1nB6WWJeyj6XG6rpFNz9p3pSFfdmUd3FjY_hV-QQJNkKA/exec';
      var _msgText =
        'PEDIDO RECEPTACULO\n─────────────────\n' + _od.resumen +
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
// Lee pp_stock donde tipo='RECEPTACULOS' y actualiza precios en tiempo real.
// Keys esperados: RECEPTACULOS|80x80_cuad|na|na, RECEPTACULOS|90x90_cuad|na|na, etc.
function loadReceptStockFromSupabase() {
  if (!window.supabase || !window.POLYPLAS_CONFIG) {
    setTimeout(loadReceptStockFromSupabase, 400);
    return;
  }
  var _sb = window.supabase.createClient(
    window.POLYPLAS_CONFIG.SUPABASE_URL,
    window.POLYPLAS_CONFIG.SUPABASE_ANON_KEY
  );
  _sb.from('pp_stock')
    .select('dim,cantidad,precio,precio_antes')
    .eq('tipo', 'RECEPTACULOS')
    .then(function(res) {
      if (!res.data || !res.data.length) return;
      res.data.forEach(function(row) {
        var prod = (window.RECEPTACULOS || []).find(function(p){ return p.id === row.dim; });
        if (!prod) return;

        // Stock 0 → deshabilitar botón; stock > 0 → re-habilitar
        var buyBtn = document.getElementById('buy-' + prod.id);
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
          prod.precio = row.precio;
          var priceEl = document.getElementById('price-' + prod.id);
          if (priceEl) priceEl.innerHTML =
            '$ ' + Math.round(row.precio).toLocaleString('es-CL') +
            '<span class="pp-recep-price-iva">c/IVA</span>';
        }

        // Precio antes y ahorro
        if (row.precio_antes && row.precio_antes > 0) {
          prod.precioAntes = row.precio_antes;
          var oldEl = document.getElementById('price-old-' + prod.id);
          if (oldEl) {
            oldEl.textContent   = 'Antes $ ' + Math.round(row.precio_antes).toLocaleString('es-CL');
            oldEl.style.display = '';
          }
          var ahorro = row.precio_antes - (row.precio || prod.precio || 0);
          var ahorroEl = document.getElementById('ahorro-' + prod.id);
          if (ahorroEl && ahorro > 0) {
            ahorroEl.textContent   = 'Ahorras $ ' + Math.round(ahorro).toLocaleString('es-CL');
            ahorroEl.style.display = '';
          }
        } else {
          prod.precioAntes = null;
          var oldEl2 = document.getElementById('price-old-' + prod.id);
          if (oldEl2) oldEl2.style.display = 'none';
          var ahorroEl2 = document.getElementById('ahorro-' + prod.id);
          if (ahorroEl2) ahorroEl2.style.display = 'none';
        }
      });
      setTimeout(loadReceptStockFromSupabase, 120000);
    }).catch(function(e) {
      console.warn('PP recep stock load:', e);
      setTimeout(loadReceptStockFromSupabase, 120000);
    });
}

// Iniciar sincronización y verificar resultado de pago
loadReceptStockFromSupabase();
recepCheckPaymentResult();
