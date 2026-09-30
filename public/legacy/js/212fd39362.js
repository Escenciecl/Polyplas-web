(function() {
'use strict';

// ── Datos de productos ───────────────────────────────────────
// ⚠️ REEMPLAZA estos precios con los reales de los PDFs
var TINAS = window.TINAS = [
  { id:'vilcun',  nombre:'Tina Vilcún',    specs:'170×75×40 cm', precio:479990, img:'/wp-content/uploads/2026/08/vilcun-.webp' },
  { id:'kuyen',   nombre:'Tina Kuyen Full',specs:'183×120×65 cm · 300 L', precio:979990, img:'/wp-content/uploads/2026/08/kuyenfull.webp' },
  { id:'queilen', nombre:'Tina Queilen',   specs:'167×91,5×51 cm · 210 L', precio:489490, img:'/wp-content/uploads/2026/08/queilen.webp' },
  { id:'coinco',  nombre:'Tina Coinco',    specs:'167×92×58 cm · 210 L', precio:499990, img:'/wp-content/uploads/2026/08/coinco.webp' },
  { id:'antuco',  nombre:'Tina Antuco',   specs:'130×130×60 cm', precio:479990, img:'/wp-content/uploads/2026/08/antuco.webp' }
];

// ── Estado ───────────────────────────────────────────────────
var cart = [];
var qtyModalState = { tina: null, qty: 1 };
var kuyenFaldonPending = false;
window.FALDON_UPSELL_ACTIVE = true; // controlado desde CRM vía Supabase
var tinaClientType = 'PN';
var tinaEntrega = 'retiro';

// ── Utilidades ───────────────────────────────────────────────
function fmt(n) {
  return '$ ' + Math.round(n).toLocaleString('es-CL');
}

function showToast(msg, type) {
  var el = document.getElementById('tinaToast');
  el.textContent = msg;
  el.className = 'pp-toast' + (type ? ' pp-toast--' + type : '');
  el.classList.add('show');
  setTimeout(function() { el.classList.remove('show'); }, 3000);
}

// ── Cart helpers ─────────────────────────────────────────────
function cartTotal() {
  return cart.reduce(function(s, i) { return s + i.precio * i.qty; }, 0);
}

function cartCount() {
  return cart.reduce(function(s, i) { return s + i.qty; }, 0);
}

function updateFloatingCart() {
  var btn = document.getElementById('tinaFloatingCart');
  var badge = document.getElementById('tinaCartBadge');
  var count = cartCount();
  btn.style.display = count > 0 ? 'flex' : 'none';
  badge.textContent = count;
}

function renderDrawer() {
  var container = document.getElementById('tinaDrawerItems');
  var totalEl   = document.getElementById('tinaDrawerTotal');
  var countEl   = document.getElementById('tinaDrawerCount');

  if (!cart.length) {
    container.innerHTML = '<div class="pp-drawer-empty"><div class="pp-drawer-empty-icon">🛁</div><div class="pp-drawer-empty-title">Tu carrito está vacío</div><div class="pp-drawer-empty-sub">Agrega una o más tinas para continuar.</div></div>';
    totalEl.textContent = '$ 0';
    countEl.textContent = '0';
    return;
  }

  countEl.textContent = cartCount();
  totalEl.textContent = fmt(cartTotal());

  container.innerHTML = cart.map(function(item, idx) {
    return '<div class="pp-drawer-item">' +
      '<img class="pp-drawer-item-thumb" src="' + item.img + '" alt="' + item.nombre + '" onerror="this.style.background=\'#eef2f8\'">' +
      '<div class="pp-drawer-item-body">' +
        '<div class="pp-drawer-item-name">' + item.nombre + '</div>' +
        '<div class="pp-drawer-item-sub">' + item.specs + '</div>' +
      '</div>' +
      '<div class="pp-drawer-item-right">' +
        '<div class="pp-drawer-item-price">' + fmt(item.precio * item.qty) + '</div>' +
        '<div class="pp-drawer-item-qty">' +
          '<button class="pp-drawer-qty-btn" onclick="drawerQty(' + idx + ',-1)">−</button>' +
          '<span class="pp-drawer-qty-val">' + item.qty + '</span>' +
          '<button class="pp-drawer-qty-btn" onclick="drawerQty(' + idx + ',1)">+</button>' +
        '</div>' +
        '<button class="pp-drawer-item-remove" onclick="removeFromCart(' + idx + ')">Eliminar</button>' +
      '</div>' +
    '</div>';
  }).join('');
}

window.drawerQty = function(idx, delta) {
  cart[idx].qty = Math.max(1, cart[idx].qty + delta);
  renderDrawer();
  updateFloatingCart();
};

window.removeFromCart = function(idx) {
  cart.splice(idx, 1);
  renderDrawer();
  updateFloatingCart();
  if (!cart.length) closeTinaDrawer();
};

// ── Modal de cantidad ────────────────────────────────────────
window.openQtyModal = function(id, nombre, specs, img, tinaIdx) {
  var tina = TINAS.find(function(t){ return t.id === id; }) || TINAS[tinaIdx] || {};
  qtyModalState.tina = tina;
  qtyModalState.qty  = 1;

  document.getElementById('qtyModalThumb').src  = tina.img || img;
  document.getElementById('qtyModalName').textContent = nombre;
  document.getElementById('qtyModalSub').textContent  = specs;
  document.getElementById('qtyModalUnit').textContent = tina.precio ? fmt(tina.precio) + ' c/u · IVA incl.' : '$ — · IVA incl.';
  document.getElementById('qtyDisplay').textContent = '1';
  document.getElementById('qtyMinus').disabled = true;
  updateQtyTotal();
  document.getElementById('tinaQtyModal').classList.add('open');
  document.body.style.overflow = 'hidden';
  dlPushTinas('view_item', {
    currency: 'CLP',
    value: tina.precio || 0,
    items: [{ item_id: 'TINA_' + tina.id, item_name: tina.nombre || nombre, item_brand: 'Polyplas', item_category: 'Tinas Hidromasaje', item_variant: tina.specs || specs || '', price: tina.precio || 0, quantity: 1, index: 0 }]
  });
};

function updateQtyTotal() {
  var tina = qtyModalState.tina;
  var tinaTotal = tina && tina.precio ? tina.precio * qtyModalState.qty : 0;
  var breakdown = document.getElementById('qtyFaldonBreakdown');
  if (kuyenFaldonPending && tina && tina.id === 'kuyen') {
    var faldonPrecio = (typeof FALDON_KUYEN !== 'undefined' && FALDON_KUYEN.precio) ? FALDON_KUYEN.precio : 107100;
    document.getElementById('qtyBdTinaLabel').textContent = tina.nombre || 'Tina Kuyen Full';
    document.getElementById('qtyBdTinaVal').textContent = fmt(tinaTotal);
    document.getElementById('qtyBdFaldonVal').textContent = fmt(faldonPrecio);
    if (breakdown) breakdown.style.display = 'block';
    document.getElementById('qtyTotalVal').textContent = fmt(tinaTotal + faldonPrecio);
  } else {
    if (breakdown) breakdown.style.display = 'none';
    document.getElementById('qtyTotalVal').textContent = tinaTotal ? fmt(tinaTotal) : '$ —';
  }
}

window.changeModalQty = function(delta) {
  qtyModalState.qty = Math.max(1, qtyModalState.qty + delta);
  document.getElementById('qtyDisplay').textContent = qtyModalState.qty;
  document.getElementById('qtyMinus').disabled = qtyModalState.qty <= 1;
  updateQtyTotal();
};

window.closeQtyModal = function() {
  document.getElementById('tinaQtyModal').classList.remove('open');
  document.body.style.overflow = '';
  kuyenFaldonPending = false;
};

window.addToTinaCart = function() {
  var tina = qtyModalState.tina;
  if (!tina) return;
  // Si el faldón está pendiente (Kuyen Full con upsell aceptado), agregarlo primero
  if (kuyenFaldonPending && tina.id === 'kuyen' && typeof FALDON_KUYEN !== 'undefined') {
    var fIdx = cart.findIndex(function(i){ return i.id === FALDON_KUYEN.id; });
    if (fIdx >= 0) { cart[fIdx].qty += 1; }
    else { cart.push({ id: FALDON_KUYEN.id, nombre: FALDON_KUYEN.nombre, specs: FALDON_KUYEN.specs, precio: FALDON_KUYEN.precio, img: FALDON_KUYEN.img, qty: 1 }); }
    kuyenFaldonPending = false;
  }
  var idx = cart.findIndex(function(i){ return i.id === tina.id; });
  if (idx >= 0) {
    cart[idx].qty += qtyModalState.qty;
  } else {
    cart.push({ id: tina.id, nombre: tina.nombre, specs: tina.specs, precio: tina.precio, img: tina.img, qty: qtyModalState.qty });
  }
  // Carrito global
  try {
    var _gcIdx = idx >= 0 ? idx : cart.length - 1;
    var _gcItem = cart[_gcIdx];
    if (!_gcItem._gid) _gcItem._gid = 'gc-' + Date.now().toString(36) + Math.random().toString(36).slice(2,7);
    typeof window.ppGlobalCartAdd === 'function' && window.ppGlobalCartAdd({
      gid: _gcItem._gid, sku: 'TINA_' + _gcItem.id, module: 'tinas',
      nombre: _gcItem.nombre + (_gcItem.specs ? ' · ' + _gcItem.specs : ''),
      qty: _gcItem.qty, precio_unit: _gcItem.precio, corte_costo: 0,
      subtotal: _gcItem.precio * _gcItem.qty,
      descripcion: _gcItem.nombre + ' × ' + _gcItem.qty
    });
  } catch(e) {}
  dlPushTinas('add_to_cart', {
    currency: 'CLP',
    value: tina.precio * qtyModalState.qty,
    items: [{ item_id: 'TINA_' + tina.id, item_name: tina.nombre, item_brand: 'Polyplas', item_category: 'Tinas Hidromasaje', item_variant: tina.specs || '', price: tina.precio, quantity: qtyModalState.qty, index: 0 }]
  });
  closeQtyModal();
  renderDrawer();
  updateFloatingCart();
  showToast('✓ ' + tina.nombre + ' agregada al carrito', 'success');
};

// ── Drawer ───────────────────────────────────────────────────
window.toggleTinaDrawer = function() {
  var drawer = document.getElementById('tinaCartDrawer');
  if (drawer.classList.contains('open')) closeTinaDrawer();
  else openTinaDrawer();
};
window.openTinaDrawer = function() {
  if (window.ppGCOpen) { window.ppGCOpen(); return; }
  renderDrawer();
  document.getElementById('tinaCartDrawer').classList.add('open');
  document.getElementById('tinaDrawerOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
};
window.closeTinaDrawer = function() {
  document.getElementById('tinaCartDrawer').classList.remove('open');
  document.getElementById('tinaDrawerOverlay').classList.remove('open');
  document.body.style.overflow = '';
};

// ── Modal detalle producto ────────────────────────────────────
var tinaDetailData = {
  vilcun: {
    label: 'Tina Hidromasaje',
    title: 'Vilcún',
    imgs: ['/wp-content/uploads/2026/08/vilcun-.webp'],
    precio: '$ 479.990',
    precioOld: 'Antes $ 649.990',
    ahorro: 'Ahorras $ 170.000',
    desc: [
      { h: 'El placer cotidiano de cuidarte', p: 'No esperes a las vacaciones para escaparte a un centro de estética o unas termas. En pleno invierno, la Vilcún te ofrece un escape diario sin salir de tu baño. Su diseño ergonómico abraza tu cuerpo con agua caliente, aliviando el estrés invernal y asegurándote un descanso nocturno profundo y reparador.' },
      { h: 'Diversión y relajo en verano', p: 'Al cambiar la temporada, se convierte en el rincón favorito de tu hogar para refrescarte y tener un momento de desconexión total. La Vilcún se adapta a lo que tu cuerpo pide: calor reconfortante en los meses fríos y frescura absoluta en el verano.' }
    ],
    capacidad: 'Para 1 persona', medidas: '170×75×40 cm',
    hidromasaje: '8 Mini jets', sistema: 'Motobomba 1 HP',
    incluye: ['Motobomba 1 HP', '8 Mini jets', 'Cabecera', 'Pulsador y regulador', 'Desagüe con rebalse automático', 'Base metálica'],
    modalId: 'vilcun', modalNombre: 'Tina Vilcún', modalSpecs: '170×75×40 cm', modalIdx: 0
  },
  queilen: {
    label: 'Tina Hidromasaje',
    title: 'Queilen',
    imgs: ['/wp-content/uploads/2026/08/queilen.webp'],
    precio: '$ 489.490',
    precioOld: 'Antes $ 569.990',
    ahorro: 'Ahorras $ 80.500',
    desc: [
      { h: 'Un spa privado en la calidez de tu hogar', p: 'Los días grises y fríos del invierno se vuelven perfectos cuando tienes una Queilen esperándote. Deja que el agua caliente active tu circulación y recargue tu energía mientras disfrutas de una experiencia de relajación profunda. Es la excusa perfecta para regalarte ese momento de paz que tanto necesitas este invierno.' },
      { h: 'Tu rincón de frescura en verano', p: 'En los meses de calor, la Queilen se transforma en tu piscina privada de relajación. Imagina terminar una tarde de verano con un baño templado y un masaje suave que renueva tu cuerpo por completo. Un lujo necesario listo para disfrutar hoy mismo.' }
    ],
    capacidad: 'Para 1 persona · 210 lt · 60 kg', medidas: '167×91,5×51 cm',
    hidromasaje: '8 Mini jets', sistema: 'Motobomba 1 HP + Pulsador y regulador',
    incluye: ['Motobomba 1 HP', '8 Mini jets', '1 Cabecera', 'Pulsador y regulador', 'Desagüe con rebalse semiautomático', 'Base metálica'],
    modalId: 'queilen', modalNombre: 'Tina Queilen', modalSpecs: '167×91,5×51 cm', modalIdx: 2
  },
  coinco: {
    label: 'Tina Hidromasaje',
    title: 'Coinco',
    imgs: ['/wp-content/uploads/2026/08/coinco.webp'],
    precio: '$ 499.990',
    precioOld: 'Antes $ 579.990',
    ahorro: 'Ahorras $ 80.000',
    desc: [
      { h: 'El refugio perfecto para desconectar del frío', p: 'Tu dosis de calor este invierno: No hay mejor sensación que llegar a casa en un día helado y sumergirse en un oasis de agua humeante. La Coinco está diseñada para transformarse en tu santuario termal privado, donde el frío exterior desaparece al instante mientras el hidromasaje libera toda la tensión acumulada en el día.' },
      { h: 'Bienestar para todo el año', p: 'Cuando el invierno quede atrás y llegue el verano, tu tina se convierte en el lugar ideal para refrescarte, relajarte bajo el sol y disfrutar de un hidromasaje revitalizante a una temperatura perfecta. Una inversión en confort que cambia tu rutina diaria las cuatro estaciones del año.' }
    ],
    capacidad: 'Para 1 persona · 210 lt · 60 kg', medidas: '167×92×58 cm',
    hidromasaje: '6 Jets de alto caudal', sistema: 'Motobomba 1 HP + Pulsador y regulador',
    incluye: ['Motobomba 1 HP', '6 Jets de alto caudal', 'Cabecera', 'Pulsador y regulador', 'Desagüe con rebalse semiautomático', 'Base metálica'],
    modalId: 'coinco', modalNombre: 'Tina Coinco', modalSpecs: '167×92×58 cm', modalIdx: 3
  },
  kuyen: {
    label: 'Tina Hidromasaje',
    title: 'Kuyen Full',
    imgs: ['/wp-content/uploads/2026/08/kuyenfull.webp'],
    precio: '$ 979.990',
    precioOld: 'Antes $ 1.399.990',
    ahorro: 'Ahorras $ 420.000',
    desc: [
      { h: 'La experiencia máxima de lujo y renovación', p: 'Enfrenta el invierno con la tecnología de relajación más avanzada del mercado. Gracias a su mantenedor de temperatura, el agua se mantiene perfectamente caliente durante todo el baño, sin importar el frío que haga afuera. Su sistema de iluminación subacuática y el hidromasaje completo crean una atmósfera mágica de spa premium en la comodidad de tu casa.' },
      { h: 'Tu oasis exclusivo en verano', p: 'En verano, la Kuyen es el centro de frescura y lujo definitivo. Disfruta de un baño refrescante con la delicada sensación de sus blowers y su cascada de agua, creando el ambiente perfecto para relajarte tras un día caluroso. Es el estándar de bienestar más alto, diseñado para consentirte todos los días del año.' }
    ],
    capacidad: 'Para 2 personas · 300 lt · 60 kg', medidas: '183×120×65 cm',
    hidromasaje: '6 Jets de alto caudal + 4 Mini jets lumbares + 12 Blowers',
    sistema: 'Motobomba 1 HP + Mantenedor de temperatura + Panel digital o analógico',
    incluye: ['Motobomba 1 HP', '6 Jets de alto caudal', '4 Mini jets lumbares', '12 Blowers', '8 Mini LEDs', 'Foco subacuático', 'Panel digital o analógico', 'Mantenedor de temperatura', 'Kit grifería (cascada + monomando)', 'Cabecera', 'Pulsador y regulador', 'Desagüe con rebalse semiautomático', 'Base metálica'],
    modalId: 'kuyen', modalNombre: 'Tina Kuyen Full', modalSpecs: '183×120×65 cm', modalIdx: 1
  },
  antuco: {
    label: 'Tina Hidromasaje',
    title: 'Antuco',
    imgs: ['/wp-content/uploads/2026/08/antuco.webp'],
    precio: '$ 479.990',
    precioOld: 'Antes $ 679.990',
    ahorro: 'Ahorras $ 200.000',
    desc: [
      { h: 'Tu espacio de bienestar diario', p: 'La Antuco está diseñada para quienes buscan calidad y confort en un formato compacto. Su estructura cuadrada permite instalarla en espacios reducidos sin renunciar a la experiencia completa del hidromasaje. Ideal para baños más pequeños donde el relax no debe estar ausente.' },
      { h: 'Hidromasaje de verdad en cualquier estación', p: 'Sus 8 mini jets distribuidos estratégicamente generan una corriente de agua que alivia tensiones musculares y activa la circulación. En invierno te envuelve en calor reconfortante; en verano te ofrece el refrescante descanso que mereces.' }
    ],
    capacidad: 'Para 1 persona', medidas: '130×130×60 cm',
    hidromasaje: '8 Mini jets', sistema: 'Motobomba 1 HP + Pulsador y regulador',
    incluye: ['Motobomba 1 HP', '8 Mini jets', 'Cabecera', 'Pulsador y regulador', 'Desagüe con rebalse semiautomático', 'Base metálica'],
    modalId: 'antuco', modalNombre: 'Tina Antuco', modalSpecs: '130×130×60 cm', modalIdx: 4
  }
};

window.openTinaDetail = function(id) {
  var d = tinaDetailData[id];
  if (!d) return;

  // Carrusel del modal
  var slidesEl = document.getElementById('tinaDetailSlides');
  var dotsEl   = document.getElementById('tinaDetailDots');
  slidesEl.innerHTML = d.imgs.map(function(url, i) {
    return i === 0
      ? '<img src="' + url + '" alt="' + d.modalNombre + '" class="pp-slide active" loading="eager">'
      : '<img data-src="' + url + '" alt="' + d.modalNombre + '" class="pp-slide">';
  }).join('');
  dotsEl.innerHTML = d.imgs.map(function(_, i) {
    return '<button type="button" class="pp-dot' + (i === 0 ? ' active' : '') + '" onclick="detailSlide(' + i + ')" aria-label="Ver imagen ' + (i + 1) + '"></button>';
  }).join('');
  if (window._detailInterval) clearInterval(window._detailInterval);
  var _di = 0;
  window._detailInterval = setInterval(function() {
    _di = (_di + 1) % d.imgs.length;
    detailSlide(_di);
  }, 3500);

  document.getElementById('tinaDetailLabel').textContent = d.label;
  document.getElementById('tinaDetailTitle').textContent = d.title;
  document.getElementById('tinaDetailPrice').innerHTML = d.precio + '<span>c/IVA</span>';
  document.getElementById('tinaDetailPriceOld').textContent = d.precioOld;
  document.getElementById('tinaDetailAhorro').textContent = d.ahorro;
  var descHTML = d.desc.map(function(b) {
    return '<h4>' + b.h + '</h4><p>' + b.p + '</p>';
  }).join('');
  document.getElementById('tinaDetailDesc').innerHTML = descHTML;

  // Specs grid
  var specsData = [
    { lbl: 'Capacidad', val: d.capacidad || '—' },
    { lbl: 'Medidas', val: d.medidas || '—' },
    { lbl: 'Hidromasaje', val: d.hidromasaje || '—' },
    { lbl: 'Sistema', val: d.sistema || '—' }
  ];
  document.getElementById('tinaDetailSpecs').innerHTML = specsData.map(function(s) {
    return '<div class="pp-dspec-card"><div class="pp-dspec-lbl">' + s.lbl + '</div><div class="pp-dspec-val">' + s.val + '</div></div>';
  }).join('');

  // Incluye checklist
  var chk = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1a7a3a" stroke-width="2.8"><polyline points="20 6 9 17 4 12"/></svg>';
  document.getElementById('tinaDetailIncluye').innerHTML = (d.incluye || []).map(function(item) {
    return '<li>' + chk + item + '</li>';
  }).join('');

  // FAQs
  var faqs = [
    { q: '¿Viene con bomba incluida?', a: 'Sí, incluye Motobomba 1 HP. No necesitas comprar nada adicional para que funcione el hidromasaje.' },
    { q: '¿Qué necesito para instalarla?', a: 'Solo una entrada de agua y un desagüe estándar. La tina viene con base metálica, desagüe y todo lo necesario para la conexión.' },
    { q: '¿De qué material es?', a: 'Polietileno virgen de alta durabilidad. Resistente a rayaduras, rayos UV y productos de limpieza habituales. No requiere mantenimiento especial.' },
    { q: '¿Para cuántas personas es?', a: d.capacidad || '—' }
  ];
  if (d.sistema && d.sistema.indexOf('Mantenedor') !== -1) {
    faqs.push({ q: '¿Mantiene el agua caliente?', a: 'Sí. Incluye mantenedor de temperatura que mantiene el agua a la temperatura ideal durante todo el baño.' });
  }
  document.getElementById('tinaDetailFaq').innerHTML = faqs.map(function(f) {
    return '<div><div class="pp-dfaq-q">' + f.q + '</div><div class="pp-dfaq-a">' + f.a + '</div></div>';
  }).join('');
  document.getElementById('tinaDetailBtnBuy').onclick = function() {
    closeTinaDetail();
    if (id === 'kuyen') { openKuyenUpsell(); }
    else { openQtyModal(d.modalId, d.modalNombre, d.modalSpecs, d.imgs[0], d.modalIdx); }
  };
  var _viTina = TINAS.find(function(t){ return t.id === id; });
  dlPushTinas('view_item', {
    currency: 'CLP',
    value: _viTina ? (_viTina.precio || 0) : 0,
    items: [{ item_id: 'TINA_' + id, item_name: d.label + ' ' + d.title, item_brand: 'Polyplas', item_category: 'Tinas Hidromasaje', item_variant: d.medidas || '', price: _viTina ? (_viTina.precio || 0) : 0, quantity: 1, index: 0 }]
  });
  document.getElementById('tinaDetailModal').classList.add('open');
  document.body.style.overflow = 'hidden';
  history.replaceState(null, '', window.location.pathname + window.location.search + '#tina=' + id);
};

window.detailSlide = function(idx) {
  var slidesEl = document.getElementById('tinaDetailSlides');
  var dotsEl   = document.getElementById('tinaDetailDots');
  slidesEl.querySelectorAll('.pp-slide').forEach(function(s, i) {
    if (i === idx && s.dataset.src) { s.src = s.dataset.src; delete s.dataset.src; }
    s.classList.toggle('active', i === idx);
  });
  dotsEl.querySelectorAll('.pp-dot').forEach(function(d, i) {
    d.classList.toggle('active', i === idx);
  });
};

window.closeTinaDetail = function() {
  if (window._detailInterval) { clearInterval(window._detailInterval); window._detailInterval = null; }
  document.getElementById('tinaDetailModal').classList.remove('open');
  document.body.style.overflow = '';
  history.replaceState(null, '', window.location.pathname + window.location.search);
};

document.getElementById('tinaDetailModal').addEventListener('click', function(e) {
  if (e.target === this) closeTinaDetail();
});

// ── Checkout ─────────────────────────────────────────────────
function buildOrderItemsHTML() {
  if (!cart.length) return '<div style="color:#888;font-size:0.82rem;">Sin productos</div>';
  return cart.map(function(item) {
    return '<div class="pp-modal-order-item">' +
      '<span class="desc">' + item.nombre + ' × ' + item.qty + '</span>' +
      '<span class="monto">' + fmt(item.precio * item.qty) + '</span>' +
    '</div>';
  }).join('');
}

window.openTinaCheckout = function() {
  if (!cart.length) { showToast('Agrega una tina primero', ''); return; }
  dlPushTinas('begin_checkout', { currency: 'CLP', value: cartTotal(), customer_type: tinaClientType, items: cart.map(function(i, idx) { return { item_id: 'TINA_' + i.id, item_name: i.nombre, item_brand: 'Polyplas', item_category: 'Tinas Hidromasaje', item_variant: i.specs || '', price: i.precio, quantity: i.qty, index: idx }; }) });
  if (window.ppGCOpen) { window.ppGCOpen(); return; }
  // Reset to step 1
  document.getElementById('tinaStep1').style.display = '';
  document.getElementById('tinaStep2').style.display = 'none';
  document.getElementById('tinaCkStep1').className = 'pp-checkout-step active';
  document.getElementById('tinaCkStep2').className = 'pp-checkout-step';
  document.getElementById('tinaCkLine').className  = 'pp-checkout-step-line';
  // Render order summary in step 1
  document.getElementById('tinaStep1OrderItems').innerHTML = buildOrderItemsHTML();
  document.getElementById('tinaCheckoutModal').classList.add('open');
  document.body.style.overflow = 'hidden';
};
window.closeTinaCheckout = function() {
  document.getElementById('tinaCheckoutModal').classList.remove('open');
  document.body.style.overflow = '';
};

window.tinaSetClient = function(type) {
  tinaClientType = type;
  document.getElementById('tinaBtnPN').classList.toggle('active', type === 'PN');
  document.getElementById('tinaBtnEMP').classList.toggle('active', type === 'EMP');
  document.getElementById('tinaFieldsPN').style.display  = type === 'PN'  ? '' : 'none';
  document.getElementById('tinaFieldsEMP').style.display = type === 'EMP' ? '' : 'none';
};

function tinaValidateRut(rut) {
  rut = rut.replace(/\./g,'').replace(/-/,'');
  if (rut.length < 8) return false;
  var body = rut.slice(0,-1), dv = rut.slice(-1).toUpperCase();
  var sum = 0, m = 2;
  for (var i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i]) * m;
    m = m === 7 ? 2 : m + 1;
  }
  var expected = 11 - (sum % 11);
  var dvCalc = expected === 11 ? '0' : expected === 10 ? 'K' : String(expected);
  return dv === dvCalc;
}

window.tinaFormatRut = function(el) {
  var v = el.value.replace(/[^0-9kK]/g,'');
  if (v.length > 1) v = v.slice(0,-1).replace(/\B(?=(\d{3})+(?!\d))/g,'.') + '-' + v.slice(-1).toUpperCase();
  el.value = v;
};

window.tinaTelInput = function(el) {
  var v = el.value.replace(/[^+\d\s]/g,'');
  if (!v.startsWith('+56 ')) v = '+56 ' + v.replace(/^\+56\s?/,'');
  el.value = v;
};

window.tinaGoStep2 = function() {
  var errEl = document.getElementById('tinaStep1Error');
  errEl.style.display = 'none';
  var errors = [];
  if (tinaClientType === 'PN') {
    if (!document.getElementById('tina_pn_nombre').value.trim()) errors.push('Nombre completo');
    var rut = document.getElementById('tina_pn_rut').value.trim();
    if (!rut || !tinaValidateRut(rut)) errors.push('RUT válido');
    var tel = document.getElementById('tina_pn_tel').value.replace(/\D/g,'');
    if (tel.length < 11) errors.push('Teléfono');
    var email = document.getElementById('tina_pn_email').value.trim();
    if (!email || !email.includes('@') || !email.includes('.')) errors.push('Email');
    if (!document.getElementById('tina_pn_region').value) errors.push('Región');
    if (!document.getElementById('tina_pn_comuna').value.trim()) errors.push('Comuna');
    if (!document.getElementById('tina_pn_direccion').value.trim()) errors.push('Dirección');
  } else {
    if (!tinaValidateRut(document.getElementById('tina_emp_rut').value)) errors.push('RUT Empresa');
    if (!document.getElementById('tina_emp_razon').value.trim()) errors.push('Razón Social');
    if (!document.getElementById('tina_emp_giro').value.trim()) errors.push('Giro');
    var empTel = document.getElementById('tina_emp_tel').value.replace(/\D/g,'');
    if (empTel.length < 11) errors.push('Teléfono');
    var empEmail = document.getElementById('tina_emp_email').value.trim();
    if (!empEmail || !empEmail.includes('@') || !empEmail.includes('.')) errors.push('Email');
    if (!document.getElementById('tina_emp_region').value) errors.push('Región');
    if (!document.getElementById('tina_emp_comuna').value.trim()) errors.push('Comuna');
    if (!document.getElementById('tina_emp_direccion').value.trim()) errors.push('Dirección');
  }
  if (errors.length) {
    errEl.textContent = 'Completa los campos: ' + errors.join(', ');
    errEl.style.display = 'block';
    return;
  }
  // Pasar a paso 2
  document.getElementById('tinaStep1').style.display = 'none';
  document.getElementById('tinaStep2').style.display = '';
  document.getElementById('tinaCkStep1').className = 'pp-checkout-step done';
  document.getElementById('tinaCkStep2').className = 'pp-checkout-step active';
  document.getElementById('tinaCkLine').className  = 'pp-checkout-step-line done';
  document.getElementById('tinaStep2OrderItems').innerHTML = buildOrderItemsHTML();
  document.getElementById('tinaStep2Total').textContent = fmt(cartTotal());
  tinaRenderEntregaOptions();
};
var tinaSelectedEntrega = null;
function tinaRenderEntregaOptions() {
  var el = document.getElementById("tinaEntregaOptions");
  if (!el) return;
  el.innerHTML = "";
  tinaSelectedEntrega = null;
  ["tinaRetiroInfo","tinaEnvioInfo","tinaAddressSection"].forEach(function(id){
    var s=document.getElementById(id); if(s) s.style.display="none";
  });
  var wb = document.getElementById("tinaBtnPay");
  if (wb) { wb.disabled=true; wb.style.opacity="0.5"; wb.style.cursor="not-allowed"; }
  var opciones = [
    {id:"retiro_tienda",icon:"🏪",label:"Retiro en tienda",desc:"Retira en nuestra bodega en Santiago · Sin costo",badge:"<span class=\"pp-entrega-badge badge-gratis\">GRATIS</span>",needsAddress:false},
    {id:"despacho",icon:"🚚",label:"Despacho a domicilio",desc:"Gratis para Región Metropolitana · 1 a 3 días hábiles",badge:"<span class=\"pp-entrega-badge badge-gratis\">GRATIS</span>",needsAddress:true},
    {id:"envio_propio",icon:"📦",label:"Envío propio",desc:"Coordinas tú el transporte desde nuestra bodega en Santiago",badge:"<span class=\"pp-entrega-badge badge-propio\">TÚ GESTIONAS</span>",needsAddress:false}
  ];
  opciones.forEach(function(op) {
    var div=document.createElement("div");
    div.className="pp-entrega-opt";
    div.style.cssText="display:flex;align-items:center;gap:12px;padding:14px 16px;border:2px solid #dde4ef;border-radius:12px;cursor:pointer;background:#fff;";
    div.innerHTML="<span style=\"font-size:1.3rem;flex-shrink:0\">"+op.icon+"</span>"
      +"<div style=\"flex:1\"><strong style=\"display:block;font-size:0.85rem;color:#1a1a2e;font-weight:600;\">"+op.label+"</strong>"
      +"<span style=\"font-size:0.75rem;color:#666;\">"+op.desc+"</span></div>"+op.badge;
    div.addEventListener("click",function() {
      document.querySelectorAll("#tinaEntregaOptions .pp-entrega-opt").forEach(function(x){
        x.style.borderColor="#dde4ef"; x.style.background="#fff";
      });
      div.style.borderColor="#004a99"; div.style.background="#edf2ff";
      tinaSelectedEntrega={id:op.id,label:op.label,needsAddress:op.needsAddress,costo:0};
      dlPushTinas('add_shipping_info', { currency: 'CLP', value: cartTotal(), shipping_tier: op.id, customer_type: tinaClientType, items: cart.map(function(i, idx) { return { item_id: 'TINA_' + i.id, item_name: i.nombre, item_brand: 'Polyplas', item_category: 'Tinas Hidromasaje', item_variant: i.specs || '', price: i.precio, quantity: i.qty, index: idx }; }) });
      var e2=document.getElementById("tinaStep2Error"); if(e2) e2.style.display="none";
      if(wb){wb.disabled=false;wb.style.opacity="";wb.style.cursor="";}
      document.getElementById("tinaRetiroInfo").style.display  = op.id==="retiro_tienda"?"block":"none";
      document.getElementById("tinaEnvioInfo").style.display   = op.id==="envio_propio" ?"block":"none";
      document.getElementById("tinaAddressSection").style.display = op.id==="despacho"  ?"block":"none";
    });
    el.appendChild(div);
  });
}


window.tinaSelectEntrega = function(type, el) {
  tinaEntrega = type;
  document.querySelectorAll('.pp-entrega-opt').forEach(function(o){ o.classList.remove('selected'); });
  el.classList.add('selected');
};

function tinaGetCheckoutData() {
  if (tinaClientType === 'PN') {
    return {
      tipo:   'PN',
      nombre: document.getElementById('tina_pn_nombre').value.trim(),
      rut:    document.getElementById('tina_pn_rut').value.trim(),
      tel:    document.getElementById('tina_pn_tel').value.trim(),
      email:  document.getElementById('tina_pn_email').value.trim(),
      region: document.getElementById('tina_pn_region').value,
      ciudad: document.getElementById('tina_pn_comuna').value.trim(),
      dir:    document.getElementById('tina_pn_direccion').value.trim()
    };
  } else {
    return {
      tipo:   'EMP',
      razon:  document.getElementById('tina_emp_razon').value.trim(),
      rut:    document.getElementById('tina_emp_rut').value.trim(),
      giro:   document.getElementById('tina_emp_giro').value.trim(),
      tel:    document.getElementById('tina_emp_tel').value.trim(),
      email:  document.getElementById('tina_emp_email').value.trim(),
      region: document.getElementById('tina_emp_region').value,
      ciudad: document.getElementById('tina_emp_comuna').value.trim(),
      dir:    document.getElementById('tina_emp_direccion').value.trim()
    };
  }
}

window.tinaGoBackStep1 = function() {
  tinaSelectedEntrega = null;
  document.getElementById('tinaStep1').style.display = '';
  document.getElementById('tinaStep2').style.display = 'none';
  document.getElementById('tinaCkStep1').className = 'pp-checkout-step active';
  document.getElementById('tinaCkStep2').className = 'pp-checkout-step';
  document.getElementById('tinaCkLine').className  = 'pp-checkout-step-line';
};

window.tinaSubmitOrder = async function() {
  var btn    = document.getElementById('tinaBtnPay');
  var errEl  = document.getElementById('tinaStep2Error');
  var client = tinaGetCheckoutData();
  if (!tinaSelectedEntrega) {
    var _e2=document.getElementById("tinaStep2Error");
    if(_e2){_e2.textContent="Elige una modalidad de entrega para continuar.";_e2.style.display="block";}
    btn.disabled=false; btn.textContent="PAGAR CON WEBPAY"; return;
  }
  var entregaLabel = tinaSelectedEntrega.label;
  var total  = cartTotal();
  if (tinaSelectedEntrega.needsAddress) {
    var _dr=document.getElementById("tina_despacho_region")?.value||"";
    var _dc=document.getElementById("tina_despacho_comuna")?.value.trim()||"";
    var _dd=document.getElementById("tina_despacho_dir")?.value.trim()||"";
    if (!_dr||!_dc||!_dd){
      var _e2=document.getElementById("tinaStep2Error");
      if(_e2){_e2.textContent="Completa la dirección de despacho.";_e2.style.display="block";}
      btn.disabled=false; btn.textContent="PAGAR CON WEBPAY"; return;
    }
    client.dir_despacho=_dd; client.region_despacho=_dr; client.ciudad_despacho=_dc;
  }

  btn.disabled = true;
  btn.textContent = 'Procesando…';
  dlPushTinas('add_payment_info', { currency: 'CLP', value: total, payment_type: 'Webpay', customer_type: tinaClientType, items: cart.map(function(i, idx) { return { item_id: 'TINA_' + i.id, item_name: i.nombre, item_brand: 'Polyplas', item_category: 'Tinas Hidromasaje', item_variant: i.specs || '', price: i.precio, quantity: i.qty, index: idx }; }) });
  if (errEl) errEl.style.display = 'none';

  var convId  = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2);
  var shortId = 'PP-TINAS-' + convId.split('-').pop().substring(0, 5).toUpperCase();

  var orderItems = cart.map(function(i) {
    return { tipo: i.nombre, dim: i.specs, qty: i.qty, precio: i.precio };
  });
  var resumen = cart.map(function(i) {
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
        items:       cart.map(function(i) {
          return { tipo: i.nombre, dim: i.specs, qty: i.qty, precio: i.precio };
        })
      })
    });

    var data = await res.json();
    if (!data.token || !data.url) throw new Error('Respuesta inválida');

    try {
      var _tinaOrderJson = JSON.stringify({
        client:       client,
        orderItems:   orderItems,
        resumen:      resumen,
        convId:       convId,
        shortId:      shortId,
        entregaLabel: entregaLabel,
        corteActivo:  false,
        total:        total
      });
      sessionStorage.setItem('pp_tinas_order_data', _tinaOrderJson);
      sessionStorage.setItem('pp_tinas_cart_dl', JSON.stringify(cart.map(function(i, idx) {
        return { item_id: 'TINA_' + i.id, item_name: i.nombre, item_brand: 'Polyplas', item_category: 'Tinas Hidromasaje', item_variant: i.specs, price: i.precio, quantity: i.qty, index: idx };
      })));
      sessionStorage.setItem('pp_tinas_total_dl', String(Math.round(total)));
      sessionStorage.setItem('pp_tinas_customer_type', tinaClientType);
    } catch(e) {}

    var form  = document.createElement('form');
    form.method = 'POST';
    form.action = data.url;
    var input = document.createElement('input');
    input.type  = 'hidden';
    input.name  = 'token_ws';
    input.value = data.token;
    form.appendChild(input);
    document.body.appendChild(form);
    form.submit();

  } catch(e) {
    btn.disabled = false;
    btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg> PAGAR CON WEBPAY';
    if (errEl) { errEl.textContent = 'Error al conectar con Webpay. Por favor intenta de nuevo.'; errEl.style.display = 'block'; }
  }
};

// ── Lightbox de fotos ─────────────────────────────────────
window.openPpLightbox = function(src, alt) {
  var img = document.getElementById('ppLightboxImg');
  img.src = src;
  img.alt = alt;
  document.getElementById('ppPhotoLightbox').classList.add('open');
  document.body.style.overflow = 'hidden';
};
window.closePpLightbox = function() {
  document.getElementById('ppPhotoLightbox').classList.remove('open');
  document.body.style.overflow = '';
};

// ── Upsell Faldón Kuyen Full ──────────────────────────────────
var FALDON_KUYEN = {
  id: 'faldon_kuyen',
  nombre: 'Faldón Kuyen Full',
  specs: 'Cubre base metálica · Tina Kuyen Full',
  precio: 107100,
  img: '/wp-content/uploads/2026/08/tina-faldon.webp'
};

window.openKuyenUpsell = function() {
  // Si el faldón está desactivado desde el CRM, ir directo al modal de cantidad
  if (!window.FALDON_UPSELL_ACTIVE) {
    kuyenFaldonPending = false;
    var _k0 = (window.TINAS || []).find(function(t){ return t.id === 'kuyen'; }) || {};
    openQtyModal('kuyen', _k0.nombre || 'Tina Kuyen Full', _k0.specs || '183×120×65 cm · 300 L', _k0.img || '', 1);
    return;
  }
  var _k = (window.TINAS || []).find(function(t){ return t.id === 'kuyen'; }) || {};
  var tinaP = _k.precio || 979990;
  var faldonP = (typeof FALDON_KUYEN !== 'undefined' && FALDON_KUYEN.precio) ? FALDON_KUYEN.precio : 107100;
  var elTina = document.getElementById('upsellTinaPrice');
  var elTotal = document.getElementById('upsellTotalPrice');
  if (elTina) elTina.textContent = fmt(tinaP);
  if (elTotal) elTotal.textContent = fmt(tinaP + faldonP);
  document.getElementById('kuyenUpsellModal').classList.add('open');
  document.body.style.overflow = 'hidden';
};
window.closeKuyenUpsell = function() {
  document.getElementById('kuyenUpsellModal').classList.remove('open');
  document.body.style.overflow = '';
};
window.kuyenUpsellAccept = function() {
  kuyenFaldonPending = true;
  closeKuyenUpsell();
  var _k = (window.TINAS || []).find(function(t) { return t.id === 'kuyen'; }) || {};
  openQtyModal('kuyen', _k.nombre || 'Tina Kuyen Full', _k.specs || '183×120×65 cm · 300 L', _k.img || '', 1);
};
window.kuyenUpsellSkip = function() {
  kuyenFaldonPending = false;
  closeKuyenUpsell();
  var _k = (window.TINAS || []).find(function(t) { return t.id === 'kuyen'; }) || {};
  openQtyModal('kuyen', _k.nombre || 'Tina Kuyen Full', _k.specs || '183×120×65 cm · 300 L', _k.img || '', 1);
};

// ── Cerrar con ESC ───────────────────────────────────────────
document.addEventListener('keydown', function(e) {
  if (e.key !== 'Escape') return;
  closeKuyenUpsell();
  closeQtyModal();
  closeTinaDrawer();
  closeTinaCheckout();
  closePpLightbox();
});

// Accesibilidad teclado en fotos de cards
(function() {
  function setup() {
    document.querySelectorAll('.pp-tina-img-wrap[onclick]').forEach(function(el) {
      el.setAttribute('role', 'button');
      el.setAttribute('tabindex', '0');
      el.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.click(); }
      });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup);
  else setup();
})();

})();

// ── Flechas carrusel ─────────────────────────────────────────
window.tinasCarouselScroll = function(dir) {
  var grid = document.getElementById('tinasGrid');
  var card = grid.querySelector('.pp-tina-card');
  if (!card) return;
  grid.scrollBy({ left: dir * (card.offsetWidth + 20), behavior: 'smooth' });
};
(function initCarouselArrows() {
  function setup() {
    var grid = document.getElementById('tinasGrid');
    var prev = document.getElementById('tinasArrowPrev');
    var next = document.getElementById('tinasArrowNext');
    var wrap = document.getElementById('tinasCarousel');
    if (!grid || !prev || !next) return;
    function update() {
      var atStart = grid.scrollLeft <= 2;
      var atEnd   = grid.scrollLeft >= grid.scrollWidth - grid.clientWidth - 2;
      prev.disabled = atStart;
      next.disabled = atEnd;
      if (wrap) wrap.classList.toggle('at-end', atEnd);
    }
    grid.addEventListener('scroll', update, { passive: true });
    update();
    // Peek: mueve levemente el carrusel al cargar para mostrar que hay más
    setTimeout(function() {
      if (grid.scrollWidth <= grid.clientWidth + 10) return;
      grid.scrollBy({ left: 100, behavior: 'smooth' });
      setTimeout(function() { grid.scrollBy({ left: -100, behavior: 'smooth' }); }, 650);
    }, 1000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup);
  else setup();
})();

// ── Carrusel de imágenes ─────────────────────────────────────
window.tinaSlide = function(dotEl, idx) {
  var wrap = dotEl.closest('.pp-tina-img-wrap');
  wrap.querySelectorAll('.pp-slide').forEach(function(s, i) {
    if (i === idx && s.dataset.src) { s.src = s.dataset.src; delete s.dataset.src; }
    s.classList.toggle('active', i === idx);
  });
  wrap.querySelectorAll('.pp-dot').forEach(function(d, i) {
    d.classList.toggle('active', i === idx);
  });
};

(function initCarruseles() {
  function start() {
    document.querySelectorAll('.pp-tina-img-wrap').forEach(function(wrap) {
      var idx = 0;
      setInterval(function() {
        var dots = wrap.querySelectorAll('.pp-dot');
        if (!dots.length) return;
        idx = (idx + 1) % dots.length;
        window.tinaSlide(dots[idx], idx);
      }, 3500);
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();

// ── Data Layer (GTM / GA4 ecommerce) ─────────────────────────
window.dataLayer = window.dataLayer || [];
function dlPushTinas(eventName, ecommerce) {
  window.dataLayer.push({ ecommerce: null });
  window.dataLayer.push({ event: eventName, ecommerce: ecommerce });
}

// ── GA4 view_item_list on page load ──────────────────────────
(function() {
  function _fire() {
    var _items = (window.TINAS || []).map(function(t, i) {
      return { item_id: 'TINA_' + t.id, item_name: t.nombre, item_brand: 'Polyplas', item_category: 'Tinas Hidromasaje', item_variant: t.specs || '', price: t.precio, index: i };
    });
    dlPushTinas('view_item_list', { currency: 'CLP', item_list_name: 'Tinas Hidromasaje', items: _items });
  }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', _fire); } else { _fire(); }
})();

// ── Resultado de pago (retorno desde Webpay) ──────────────────
function tinaCheckPaymentResult() {
  var params = new URLSearchParams(window.location.search);
  var pago   = params.get('pp_pago');
  if (!pago) return;

  var resultEl = document.getElementById('tinaPagoResult');
  resultEl.style.cssText = [
    'position:fixed','inset:0','z-index:999999',
    'background:#f0f4fb','display:flex',
    'align-items:center','justify-content:center',
    'padding:24px','overflow-y:auto'
  ].join(';');

  if (pago === 'aprobado') {
    document.getElementById('tinaResultOk').style.display = 'block';
    document.getElementById('tinaOrden').textContent = params.get('orden') || '—';
    var monto = parseInt(params.get('monto') || '0');
    document.getElementById('tinaMonto').textContent = '$ ' + monto.toLocaleString('es-CL');
    document.getElementById('tinaAuth').textContent  = params.get('auth')  || '—';
    window.history.replaceState({}, '', window.location.pathname + '#gracias');

    // ── DataLayer purchase (GTM / GA4) ────────────────────────
    try {
      var _dlItems = JSON.parse(sessionStorage.getItem('pp_tinas_cart_dl') || '[]');
      var _dlTotal = parseInt(sessionStorage.getItem('pp_tinas_total_dl') || String(monto));
      var _dlCustomerType = sessionStorage.getItem('pp_tinas_customer_type') || 'PN';
      sessionStorage.removeItem('pp_tinas_cart_dl');
      sessionStorage.removeItem('pp_tinas_total_dl');
      sessionStorage.removeItem('pp_tinas_customer_type');
      dlPushTinas('purchase', {
        transaction_id: params.get('orden') || '',
        currency:       'CLP',
        value:          _dlTotal || monto,
        customer_type:  _dlCustomerType,
        items:          _dlItems
      });
    } catch(e) {}

    // ── Registrar en Supabase (CRM) + Google Sheets ──
    tinasRegistrarOrden(params);

  } else {
    document.getElementById('tinaResultFail').style.display = 'block';
    if (pago === 'cancelado') {
      document.getElementById('tinaFailMsg').textContent = 'Cancelaste el proceso de pago. Puedes volver a intentarlo cuando quieras.';
    }
    window.history.replaceState({}, '', window.location.pathname);
  }
}
function tinasRegistrarOrden(params) {
  try {
    var _od = JSON.parse(sessionStorage.getItem('pp_tinas_order_data') || 'null');
    if (!_od) return;
    if (!window.supabase || !window.POLYPLAS_CONFIG) {
      setTimeout(function() { tinasRegistrarOrden(params); }, 350);
      return;
    }
    sessionStorage.removeItem('pp_tinas_order_data');
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
        tipo_cliente: _od.client.tipo   || '',
        nombre:       _od.client.nombre || '',
        razon_social: _od.client.razon  || '',
        rut:          _od.client.rut    || '',
        giro:         _od.client.giro   || '',
        email:        _od.client.email  || '',
        phone:        _od.client.tel    || '',
        dir:          _od.client.dir    || '',
        ciudad:       _od.client.ciudad || '',
        region:       _od.client.region || '',
        entrega:      _od.entregaLabel,
        total:        _od.total,
        items:        _od.orderItems,
        webpay_orden: params.get('orden') || '',
        webpay_auth:  params.get('auth')  || ''
      }
    }).then(function() {
      var _scriptURL = 'https://script.google.com/macros/s/AKfycbw4WkE3slUjbDIUrbYVZD-aL1nB6WWJeyj6XG6rpFNz9p3pSFfdmUd3FjY_hV-QQJNkKA/exec';
      var _msgText = '🛁 PEDIDO TINA\n─────────────────\n' + _od.resumen +
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
        observaciones: _od.resumen + ' | Entrega:' + _od.entregaLabel
      }).toString(), { mode: 'no-cors' });
    });
  } catch(e2) {}
}
tinaCheckPaymentResult();

// Actualiza el JSON-LD con los precios reales después del fetch de Supabase
// para evitar discrepancia entre precio visible y datos estructurados (penaliza rich results).
function _syncTinasJsonLd() {
  try {
    var ldScript = document.querySelector('script[type="application/ld+json"]');
    if (!ldScript) return;
    var data = JSON.parse(ldScript.textContent);
    var pageUrl = window.location.href.split('#')[0];
    var items = data.itemListElement || [];
    items.forEach(function(listItem) {
      var product = listItem.item || {};
      // SKU "TINA-KUYEN-FULL" → id "kuyen", "TINA-VILCUN" → "vilcun"
      var rawId = (product.sku || '').replace('TINA-', '').toLowerCase();
      // kuyen-full → kuyen
      var tinaId = rawId.replace('-full', '').replace(/-/g, '');
      var tina = (window.TINAS || []).find(function(t) { return t.id === tinaId; });
      if (!tina || !product.offers) return;
      // precio
      if (tina.precio) product.offers.price = String(Math.round(tina.precio));
      // disponibilidad: sincroniza con el estado real de stock
      product.offers.availability = (tina.inStock === false)
        ? 'https://schema.org/OutOfStock'
        : 'https://schema.org/InStock';
      // url: link directo a la sección del producto en la página actual
      product.url = pageUrl + '#tina-' + tina.id;
      product.offers.url = pageUrl + '#tina-' + tina.id;
    });
    ldScript.textContent = JSON.stringify(data);
  } catch(e) {}
}

// ── Sincronizar precios y stock de tinas desde Supabase ───────
// Lee pp_stock donde tipo='TINAS' y actualiza el módulo en tiempo real.
// Los keys en Supabase son TINAS|vilcun|na|na, TINAS|queilen|na|na, etc.
// No interfiere con los registros AA/PA de acrílicos.
function loadTinasStockFromSupabase() {
  if (!window.supabase || !window.POLYPLAS_CONFIG) {
    setTimeout(loadTinasStockFromSupabase, 400);
    return;
  }
  var _sb = window.supabase.createClient(
    window.POLYPLAS_CONFIG.SUPABASE_URL,
    window.POLYPLAS_CONFIG.SUPABASE_ANON_KEY
  );
  _sb.from('pp_stock')
    .select('dim,cantidad,precio,precio_antes')
    .eq('tipo', 'TINAS')
    .then(function(res) {
      if (!res.data || !res.data.length) return;
      res.data.forEach(function(row) {
        // Config especial: faldón Kuyen Full ON/OFF
        if (row.dim === 'kuyen_faldon') {
          window.FALDON_UPSELL_ACTIVE = (row.cantidad === null || row.cantidad === undefined || row.cantidad !== 0);
          return;
        }
        var tina = (window.TINAS || []).find(function(t){ return t.id === row.dim; });
        if (!tina) return;

        // ── Precio actual ─────────────────────────────────────
        if (row.precio !== null && row.precio !== undefined) {
          tina.precio = row.precio;
          var priceEl = document.getElementById('price-' + tina.id);
          if (priceEl) priceEl.innerHTML = '$ ' + Math.round(row.precio).toLocaleString('es-CL') + '<span class="pp-tina-price-iva">c/IVA</span>';
        }

        // ── Precio antes y ahorro ─────────────────────────────
        if (row.precio_antes && row.precio_antes > 0) {
          var oldEl = document.getElementById('price-old-' + tina.id);
          if (oldEl) oldEl.textContent = 'Antes $ ' + Math.round(row.precio_antes).toLocaleString('es-CL');
          var ahorro = row.precio_antes - (tina.precio || row.precio || 0);
          var ahorroTxt = ahorro > 0 ? 'Ahorras $ ' + Math.round(ahorro).toLocaleString('es-CL') : '';
          // Actualizar div ahorro en la card
          var ahorroEl = document.getElementById('ahorro-' + tina.id);
          if (ahorroEl) {
            if (ahorroTxt) { ahorroEl.textContent = ahorroTxt; ahorroEl.style.display = ''; }
            else { ahorroEl.style.display = 'none'; }
          }
          // Actualizar también en tinaDetailData (popup de detalle)
          if (window.tinaDetailData && window.tinaDetailData[tina.id]) {
            window.tinaDetailData[tina.id].precioOld = 'Antes $ ' + Math.round(row.precio_antes).toLocaleString('es-CL');
            window.tinaDetailData[tina.id].ahorro    = ahorroTxt;
          }
        } else {
          // Sin precio antes: ocultar elementos tachado y ahorro
          var oldEl2 = document.getElementById('price-old-' + tina.id);
          if (oldEl2) oldEl2.style.display = 'none';
          var ahorroEl2 = document.getElementById('ahorro-' + tina.id);
          if (ahorroEl2) ahorroEl2.style.display = 'none';
        }

        // ── Sin stock / disponible ────────────────────────────
        tina.inStock = (row.cantidad !== 0);
        var btn = document.querySelector('button.pp-tina-btn-buy[onclick*="' + tina.id + '"]');
        if (btn) {
          if (row.cantidad === 0) {
            btn.disabled = true;
            btn.innerHTML = 'Sin stock';
            btn.style.opacity = '0.5';
            btn.style.cursor  = 'not-allowed';
          } else {
            btn.disabled = false;
            btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg> COMPRAR';
            btn.style.opacity = '';
            btn.style.cursor  = '';
          }
        }
      });
      if (typeof renderDrawer === 'function') renderDrawer();
      _syncTinasJsonLd();
      setTimeout(loadTinasStockFromSupabase, 120000);
    }).catch(function(e) {
      console.warn('PP tinas stock load:', e);
      setTimeout(loadTinasStockFromSupabase, 120000);
    });
}
loadTinasStockFromSupabase();
