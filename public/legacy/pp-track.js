/*
 * Polyplas · Marcaje de comercio electrónico (GA4 / GTM)
 * ------------------------------------------------------------------
 * UN SOLO lugar por donde pasan todos los eventos de ecommerce del sitio.
 * Los módulos (planchas, tinas, cúpulas, receptáculos), el carrito global y la
 * página de gracias llaman a window.ppTrack(evento, ecommerce, origen).
 *
 * Qué garantiza:
 *  1. Mismos datos de artículo en todo el embudo (id, nombre, línea, tipo).
 *       item_category  = LÍNEA de producto   (ej. "Planchas Acrílico", "Tinas Hidromasaje")
 *       item_category2 = TIPO de producto    (ej. "Acrílico AA", "PA · 100% Virgen", "1 persona")
 *       item_category3 = medida              (solo planchas)
 *       item_category4 = espesor             (solo planchas)
 *  2. Un evento por paso real del embudo, sin duplicados:
 *       view_item_list → view_item → add_to_cart → view_cart → begin_checkout
 *       → add_shipping_info → add_payment_info → purchase
 *  3. Una sola compra por número de orden (transaction_id).
 *  4. view_item en las fichas de producto (/tina-hidromasaje-…/, /cupula-acrilico-…/, etc.).
 *
 * Para revisar en el navegador: agrega ?pp_debug=1 a la URL y abre la consola,
 * o mira window.ppTrackLog (lista de lo enviado y lo descartado).
 */
(function () {
  if (window.ppTrack) return;
  window.dataLayer = window.dataLayer || [];

  /* ── Líneas de producto (item_category) ───────────────────── */
  var LINEAS = {
    acrilico: 'Planchas Acrílico',
    pet: 'Planchas PET',
    petg: 'Planchas PETG',
    pc: 'Planchas Policarbonato Compacto',
    cupulas: 'Cúpulas de Acrílico',
    receptaculos: 'Receptáculos de Ducha',
    tinas: 'Tinas Hidromasaje'
  };
  var LINEA_VALORES = Object.keys(LINEAS).map(function (k) { return LINEAS[k]; });

  /* ── Catálogo de productos con ficha propia ───────────────────
   * id = el mismo "id" del feed de Merchant Center.
   * nombre y tipo se usan en TODOS los eventos, así no cambian entre pasos. */
  var CATALOGO = {
    TINA_vilcun:       { nombre: 'Tina Vilcún',                   tipo: '1 persona',    modulo: 'tinas' },
    TINA_queilen:      { nombre: 'Tina Queilen',                  tipo: '1 persona',    modulo: 'tinas' },
    TINA_coinco:       { nombre: 'Tina Coinco',                   tipo: '1 persona',    modulo: 'tinas' },
    TINA_antuco:       { nombre: 'Tina Antuco',                   tipo: '1 persona',    modulo: 'tinas' },
    TINA_kuyen:        { nombre: 'Tina Kuyen Full',               tipo: '2 personas',   modulo: 'tinas' },
    CUP_54x54:         { nombre: 'Cúpula 54×54 cm',               tipo: 'Transparente', modulo: 'cupulas' },
    CUP_68x68:         { nombre: 'Cúpula 68×68 cm',               tipo: 'Transparente', modulo: 'cupulas' },
    CUP_80x80:         { nombre: 'Cúpula 80×80 cm',               tipo: 'Transparente', modulo: 'cupulas' },
    CUP_80x80_bronce:  { nombre: 'Cúpula Bronce 80×80 cm',        tipo: 'Bronce',       modulo: 'cupulas' },
    RECEP_80x80_cuad:  { nombre: 'Receptáculo Cuadrado 80×80 cm', tipo: 'Cuadrado',     modulo: 'receptaculos' },
    RECEP_90x90_cuad:  { nombre: 'Receptáculo Cuadrado 90×90 cm', tipo: 'Cuadrado',     modulo: 'receptaculos' },
    RECEP_90x90_esq:   { nombre: 'Receptáculo Esquinero 90×90 cm', tipo: 'Esquinero',   modulo: 'receptaculos' }
  };

  /* Etiquetas antiguas de categoría → módulo (para datos guardados antes de este cambio) */
  var ETIQUETA_A_MODULO = {
    'Acrílico': 'acrilico', 'Acrílico AA': 'acrilico', 'PA · 100% Virgen': 'acrilico',
    'PET': 'pet', 'PETG': 'petg', 'PC': 'pc', 'Policarbonato': 'pc',
    'Tinas': 'tinas', 'Tinas Hidromasaje': 'tinas',
    'Cúpulas': 'cupulas', 'Cúpulas de Acrílico': 'cupulas',
    'Receptáculos': 'receptaculos', 'Receptáculos de Ducha': 'receptaculos'
  };

  var DEBUG = /[?&]pp_debug=1/.test(location.search);
  var LOG = (window.ppTrackLog = []);
  function log(estado, evento, detalle) {
    LOG.push({ t: Date.now(), estado: estado, evento: evento, detalle: detalle });
    if (LOG.length > 200) LOG.shift();
    if (DEBUG && window.console) console.log('[ppTrack] ' + estado + ' · ' + evento, detalle || '');
  }

  function num(v) { var n = Number(v); return isFinite(n) ? n : 0; }

  /* El sitio usaba REC_… y el feed de Merchant Center usa RECEP_…: se unifica al del feed */
  function normId(id) {
    id = String(id == null ? '' : id);
    if (/^REC_/.test(id)) id = 'RECEP_' + id.slice(4);
    return id;
  }

  function moduloDe(item, origen) {
    var id = normId(item.item_id);
    if (CATALOGO[id]) return CATALOGO[id].modulo;
    if (/^TINA_/.test(id)) return 'tinas';
    if (/^CUP_/.test(id)) return 'cupulas';
    if (/^RECEP_/.test(id)) return 'receptaculos';
    if (LINEAS[origen]) return origen;
    if (item._modulo && LINEAS[item._modulo]) return item._modulo;
    var porLinea = LINEA_VALORES.indexOf(item.item_category);
    if (porLinea >= 0) return Object.keys(LINEAS)[porLinea];
    return ETIQUETA_A_MODULO[item.item_category] || '';
  }

  /* ── Artículo en formato único ────────────────────────────── */
  function normItem(raw, idx, origen) {
    raw = raw || {};
    var id = normId(raw.item_id);
    var modulo = moduloDe(raw, origen);
    var yaNormal = LINEA_VALORES.indexOf(raw.item_category) >= 0;
    var out = {
      item_id: id,
      item_name: raw.item_name || '',
      item_brand: 'Polyplas',
      item_category: LINEAS[modulo] || raw.item_category || '',
      price: num(raw.price),
      quantity: num(raw.quantity) || 1,
      index: typeof raw.index === 'number' ? raw.index : (idx || 0)
    };
    var cat = CATALOGO[id];
    if (cat) {
      out.item_name = cat.nombre;
      out.item_category2 = cat.tipo;
    } else if (yaNormal) {
      if (raw.item_category2) out.item_category2 = raw.item_category2;
      if (raw.item_category3) out.item_category3 = raw.item_category3;
      if (raw.item_category4) out.item_category4 = raw.item_category4;
    } else {
      // Planchas: los módulos envían material / medida / espesor en category / category2 / category3
      if (raw.item_category) out.item_category2 = raw.item_category;
      if (raw.item_category2) out.item_category3 = raw.item_category2;
      if (raw.item_category3) out.item_category4 = raw.item_category3;
    }
    if (raw.item_variant) out.item_variant = raw.item_variant;
    if (raw.item_list_name) out.item_list_name = raw.item_list_name;
    return out;
  }

  /* ── Memoria de artículos (para que carrito y compra usen los mismos datos) ── */
  var REG_KEY = 'pp_dl_items';
  function regLoad() { try { return JSON.parse(sessionStorage.getItem(REG_KEY) || '{}') || {}; } catch (e) { return {}; } }
  function regSave(items) {
    try {
      var reg = regLoad();
      items.forEach(function (it) { if (it.item_id) reg[it.item_id] = it; });
      sessionStorage.setItem(REG_KEY, JSON.stringify(reg));
    } catch (e) {}
  }

  /* Artículo del carrito global → artículo GA4 (lo usa 04-carrito-y-pago.html) */
  window.ppTrackCartItem = function (cartItem, idx) {
    cartItem = cartItem || {};
    var id = normId(cartItem.sku || cartItem.gid || '');
    var qty = num(cartItem.qty) || 1;
    var price = num(cartItem.precio_unit) || Math.round(num(cartItem.subtotal) / qty);
    var guardado = regLoad()[id];
    var base;
    if (guardado) {
      base = guardado;
    } else {
      var partes = String(cartItem.nombre || '').split(' · ');
      base = { item_id: id, item_name: cartItem.nombre || '', _modulo: cartItem.module || '' };
      if (LINEAS[cartItem.module] && /^(acrilico|pet|petg|pc)$/.test(cartItem.module)) {
        // nombre del carrito: "Material · Medida · Color · Espesor"
        base.item_name = 'Plancha ' + (cartItem.nombre || '');
        base.item_category = partes[0] || '';
        base.item_category2 = partes[1] || '';
        base.item_variant = partes[2] || '';
        base.item_category3 = partes[3] || '';
      }
    }
    var out = normItem(base, idx, cartItem.module);
    out.price = price;
    out.quantity = qty;
    out.index = idx || 0;
    return out;
  };

  /* ── Control de duplicados ────────────────────────────────── */
  var vistos = {};          // view_item por artículo, una vez por carga de página
  var listas = {};          // view_item_list por lista, una vez por carga de página
  var ultimos = {};         // mismo evento + mismos artículos en menos de 1,2 s
  var TX_KEY = 'pp_dl_tx';
  function txYaEnviada(id) {
    try { return (JSON.parse(localStorage.getItem(TX_KEY) || '[]') || []).indexOf(id) >= 0; } catch (e) { return false; }
  }
  function txGuardar(id) {
    try {
      var l = JSON.parse(localStorage.getItem(TX_KEY) || '[]') || [];
      if (l.indexOf(id) < 0) l.push(id);
      localStorage.setItem(TX_KEY, JSON.stringify(l.slice(-50)));
    } catch (e) {}
  }

  function enviar(evento, ecommerce) {
    window.dataLayer.push({ ecommerce: null });
    window.dataLayer.push({ event: evento, ecommerce: ecommerce });
    log('ENVIADO', evento, ecommerce);
  }

  /* Pasos del carrito y del pago: los informa SOLO el carrito global (origen "gc") */
  var PASOS_CARRITO = { view_cart: 1, begin_checkout: 1, add_shipping_info: 1, add_payment_info: 1 };
  var comprasEnEspera = {};
  var ESPLANCHA = { acrilico: 1, pet: 1, petg: 1, pc: 1 };

  /**
   * @param {string} evento     nombre GA4 (view_item, add_to_cart, purchase…)
   * @param {object} ecommerce  { currency, value, items: [...] , … }
   * @param {string} origen     'acrilico' | 'pet' | 'petg' | 'pc' | 'tinas' | 'cupulas' | 'receptaculos' | 'gc' | 'gracias' | 'ficha'
   */
  window.ppTrack = function (evento, ecommerce, origen) {
    try {
      ecommerce = ecommerce || {};
      origen = origen || '';

      if (PASOS_CARRITO[evento] && origen !== 'gc' && window._ppGCInit) {
        log('DESCARTADO (lo informa el carrito global)', evento, origen);
        return false;
      }

      var ec = {};
      for (var k in ecommerce) if (Object.prototype.hasOwnProperty.call(ecommerce, k)) ec[k] = ecommerce[k];
      ec.currency = ec.currency || 'CLP';
      ec.items = (ecommerce.items || []).map(function (it, i) { return normItem(it, i, origen); });
      if (ec.value != null) ec.value = num(ec.value);
      if (evento === 'view_item_list' && ec.item_list_name) {
        ec.items.forEach(function (it) { it.item_list_name = ec.item_list_name; });
      }

      var ids = ec.items.map(function (it) { return it.item_id; }).join(',');

      // Planchas: la vista de producto es abrir el configurador (una por material).
      // Cada cambio de medida/espesor/color NO es otra vista: esos pasos van como conf_… (ver ppPaso).
      if (evento === 'view_item' && ESPLANCHA[origen] && ids.indexOf('_') >= 0) {
        log('DESCARTADO (cambio de variante, no es una vista nueva)', evento, ids);
        return false;
      }
      if (evento === 'view_item') {
        if (vistos[ids]) { log('DESCARTADO (ya visto en esta página)', evento, ids); return false; }
        vistos[ids] = 1;
      }
      if (evento === 'view_item_list') {
        var ln = ec.item_list_name || ids;
        if (listas[ln]) { log('DESCARTADO (lista ya informada)', evento, ln); return false; }
        listas[ln] = 1;
      }

      var firma = evento + '|' + ids + '|' + (ec.shipping_tier || '');
      var ahora = Date.now();
      if (evento !== 'purchase' && ultimos[firma] && ahora - ultimos[firma] < 1200) {
        log('DESCARTADO (repetido)', evento, ids);
        return false;
      }
      ultimos[firma] = ahora;

      if (evento === 'add_to_cart' || evento === 'view_item') regSave(ec.items);

      if (evento === 'purchase') {
        var tx = String(ec.transaction_id || '');
        if (tx && txYaEnviada(tx)) { log('DESCARTADO (orden ya informada)', evento, tx); return false; }
        if (!ec.items.length) {
          // Compra sin artículos: se espera un momento por si el carrito global la informa completa
          if (comprasEnEspera[tx]) return false;
          comprasEnEspera[tx] = setTimeout(function () {
            delete comprasEnEspera[tx];
            if (tx && txYaEnviada(tx)) return;
            if (tx) txGuardar(tx);
            enviar(evento, ec);
          }, 2500);
          log('EN ESPERA (compra sin artículos)', evento, tx);
          return true;
        }
        if (comprasEnEspera[tx]) { clearTimeout(comprasEnEspera[tx]); delete comprasEnEspera[tx]; }
        if (tx) txGuardar(tx);
      }

      enviar(evento, ec);
      return true;
    } catch (e) {
      // Si algo falla, el evento se envía igual que antes para no perder la medición
      try {
        window.dataLayer.push({ ecommerce: null });
        window.dataLayer.push({ event: evento, ecommerce: ecommerce });
      } catch (e2) {}
      return true;
    }
  };

  /* ── Pasos intermedios del embudo (micro-pasos) ───────────────
   * Eventos propios, uno por paso real y una sola vez por producto y página:
   *   conf_medida · conf_espesor · conf_color   clic en esa opción del configurador de planchas
   *   conf_pedido                               llegó al paso 2 "Pedido" del configurador
   *   conf_corte_si · conf_corte_no             respondió si quiere las planchas cortadas a medida
   *   compra_abre                               abrió el cuadro de cantidad (tinas, cúpulas, receptáculos)
   *   pago_datos_ok · pago_datos_error          completó (o no) sus datos en "Finalizar pedido"
   *   pago_error_webpay                         falló la conexión con Webpay
   * Cada uno lleva: linea, tipo, item_id y valor (cuando aplica).
   */
  var pasosHechos = {};
  window.ppPaso = function (evento, origen, datos) {
    try {
      datos = datos || {};
      var p = { event: evento, linea: LINEAS[origen] || '', tipo: '', item_id: '', valor: num(datos.valor) || undefined };
      if (ESPLANCHA[origen]) {
        // Solo cuenta dentro del configurador abierto (no la selección que viene precargada)
        var modal = document.getElementById('configuratorModal');
        if (modal && !/\bopen\b/.test(modal.className)) return false;
        var mat = datos.material || datos.tipo || '';
        p.tipo = (window._ppGetMatLabel && mat ? window._ppGetMatLabel(mat) : mat) || '';
        p.item_id = mat;
        p.medida = datos.dim || '';
        p.espesor = datos.esp || '';
        p.color = datos.color || '';
      } else if (datos.item_id) {
        var id = normId(datos.item_id);
        var cat = CATALOGO[id];
        p.item_id = id;
        if (cat) { p.linea = LINEAS[cat.modulo]; p.tipo = cat.tipo; }
      }
      var clave = evento + '|' + p.linea + '|' + p.item_id;
      if (pasosHechos[clave]) { log('DESCARTADO (paso ya informado)', evento, p.item_id); return false; }
      pasosHechos[clave] = 1;
      window.dataLayer.push(p);
      log('ENVIADO', evento, p);
      return true;
    } catch (e) { return false; }
  };

  /* Pregunta "¿Quieres recibir tus planchas cortadas a medida?" del configurador */
  var RUTA_PLANCHA = [[/planchas-acrilico/, 'acrilico'], [/planchas-petg/, 'petg'], [/planchas-pet/, 'pet'], [/policarbonato/, 'pc']];
  document.addEventListener('click', function (e) {
    try {
      var b = e.target && e.target.closest ? e.target.closest('.pcc-guide-btn--yes, .pcc-guide-btn--no') : null;
      if (!b) return;
      var mod = '';
      RUTA_PLANCHA.some(function (r) { if (r[0].test(location.pathname)) { mod = r[1]; return true; } return false; });
      if (!mod) return;
      var si = /pcc-guide-btn--yes/.test(b.className);
      window.ppPaso(si ? 'conf_corte_si' : 'conf_corte_no', mod, window._ppState || {});
    } catch (err) {}
  }, true);

  /* ── Fichas de producto: view_item al cargar la página ────── */
  var PREFIJO_FICHA = { tina: 'TINA_', cupula: 'CUP_', receptaculo: 'RECEP_' };
  function fichaViewItem() {
    try {
      var ficha = document.querySelector('.pp-ficha');
      if (!ficha || ficha.getAttribute('data-pp-visto')) return;
      var enlace = ficha.querySelector('a.pp-btn--primary[href*="#"]');
      if (!enlace) return;
      var m = (enlace.getAttribute('href').split('#')[1] || '').match(/^(tina|cupula|receptaculo)=([\w-]+)/);
      if (!m) return;
      var id = PREFIJO_FICHA[m[1]] + m[2];
      var precioEl = ficha.querySelector('.pp-ficha__price strong');
      var precio = precioEl ? num(String(precioEl.textContent).replace(/[^\d]/g, '')) : 0;
      var h1 = ficha.querySelector('h1');
      ficha.setAttribute('data-pp-visto', '1');
      window.ppTrack('view_item', {
        currency: 'CLP',
        value: precio,
        items: [{ item_id: id, item_name: h1 ? h1.textContent.trim() : id, price: precio, quantity: 1, index: 0 }]
      }, 'ficha');
    } catch (e) {}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fichaViewItem);
  else fichaViewItem();
  document.addEventListener('pp:legacy-ready', fichaViewItem);
})();
