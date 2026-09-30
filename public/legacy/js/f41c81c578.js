(function () {
  if (window._ppGCInit) return;
  window._ppGCInit = true;

  /* ── Constantes ─────────────────────────────────────────── */
  var GC_KEY       = 'pp_global_cart';
  var GC_ORDER_KEY = 'pp_global_order_data';
  var UMBRAL       = 350000;
  var TEL_PREFIX   = '+56 ';
  var MOD_LABELS   = { petg:'PETG', pet:'PET', acrilico:'Acrílico', pc:'Policarbonato', tinas:'Tinas', cupulas:'Cúpulas', receptaculos:'Receptáculos' };
  var EXCLUIDAS_RM = ['Pirque','San José de Maipo','Tiltil','Buin','Calera de Tango','Paine','Melipilla','Alhué','Curacaví','María Pinto','San Pedro','Talagante','Isla de Maipo','Peñaflor'];
  var COMUNAS = {
    RM:  ['Cerrillos','Cerro Navia','Conchalí','El Bosque','Estación Central','Huechuraba','Independencia','La Cisterna','La Florida','La Granja','La Pintana','La Reina','Las Condes','Lo Barnechea','Lo Espejo','Lo Prado','Macul','Maipú','Ñuñoa','Pedro Aguirre Cerda','Peñalolén','Providencia','Pudahuel','Quilicura','Quinta Normal','Recoleta','Renca','San Joaquín','San Miguel','San Ramón','Santiago','Vitacura','Puente Alto','Pirque','San José de Maipo','Colina','Lampa','Tiltil','San Bernardo','Buin','Calera de Tango','Paine','Melipilla','Alhué','Curacaví','María Pinto','San Pedro','Talagante','El Monte','Isla de Maipo','Padre Hurtado','Peñaflor'],
    XV:['Arica','Camarones','Putre','General Lagos'], I:['Iquique','Alto Hospicio','Pozo Almonte','Camiña','Colchane','Huara','Pica'],
    II:['Antofagasta','Mejillones','Sierra Gorda','Taltal','Calama','Ollagüe','San Pedro de Atacama','Tocopilla','María Elena'],
    III:['Copiapó','Caldera','Tierra Amarilla','Chañaral','Diego de Almagro','Vallenar','Alto del Carmen','Freirina','Huasco'],
    IV:['La Serena','Coquimbo','Andacollo','La Higuera','Paiguano','Vicuña','Illapel','Canela','Los Vilos','Salamanca','Ovalle','Combarbalá','Monte Patria','Punitaqui','Río Hurtado'],
    V:['Valparaíso','Casablanca','Concón','Juan Fernández','Puchuncaví','Quintero','Viña del Mar','Isla de Pascua','Los Andes','Calle Larga','Rinconada','San Esteban','La Ligua','Cabildo','Papudo','Petorca','Zapallar','Quillota','Calera','Hijuelas','La Cruz','Nogales','San Antonio','Algarrobo','Cartagena','El Quisco','El Tabo','Santo Domingo','San Felipe','Catemu','Llaillay','Panquehue','Putaendo','Santa María','Quilpué','Limache','Olmué','Villa Alemana'],
    VI:['Rancagua','Codegua','Coinco','Coltauco','Doñihue','Graneros','Las Cabras','Machalí','Malloa','Mostazal','Olivar','Peumo','Pichidegua','Quinta de Tilcoco','Rengo','Requínoa','San Vicente','Pichilemu','La Estrella','Litueche','Marchihue','Navidad','Paredones','San Fernando','Chépica','Chimbarongo','Lolol','Nancagua','Palmilla','Peralillo','Placilla','Pumanque','Santa Cruz'],
    VII:['Talca','Constitución','Curepto','Empedrado','Maule','Pelarco','Pencahue','Río Claro','San Clemente','San Rafael','Cauquenes','Chanco','Pelluhue','Curicó','Hualañé','Licantén','Molina','Rauco','Romeral','Sagrada Familia','Teno','Vichuquén','Linares','Colbún','Longaví','Parral','Retiro','San Javier','Villa Alegre','Yerbas Buenas'],
    XVI:['Chillán','Bulnes','Cobquecura','Coelemu','Coihueco','Chillán Viejo','El Carmen','Ninhue','Ñiquén','Pemuco','Pinto','Portezuelo','Quillón','Quirihue','Ránquil','San Carlos','San Fabián','San Ignacio','San Nicolás','Treguaco','Yungay'],
    VIII:['Concepción','Coronel','Chiguayante','Florida','Hualpén','Hualqui','Lota','Penco','San Pedro de la Paz','Santa Juana','Talcahuano','Tomé','Lebu','Arauco','Cañete','Contulmo','Curanilahue','Los Álamos','Tirúa','Los Ángeles','Antuco','Cabrero','Laja','Mulchén','Nacimiento','Negrete','Quilaco','Quilleco','San Rosendo','Santa Bárbara','Tucapel','Yumbel','Alto Biobío'],
    IX:['Temuco','Carahue','Cunco','Curarrehue','Freire','Galvarino','Gorbea','Lautaro','Loncoche','Melipeuco','Nueva Imperial','Padre Las Casas','Perquenco','Pitrufquén','Pucón','Saavedra','Teodoro Schmidt','Toltén','Vilcún','Villarrica','Cholchol','Angol','Collipulli','Curacautín','Ercilla','Lonquimay','Los Sauces','Lumaco','Purén','Renaico','Traiguén','Victoria'],
    XIV:['Valdivia','Corral','Futrono','La Unión','Lago Ranco','Lanco','Los Lagos','Máfil','Mariquina','Paillaco','Panguipulli','Río Bueno'],
    X:['Puerto Montt','Calbuco','Cochamó','Fresia','Frutillar','Los Muermos','Llanquihue','Maullín','Puerto Varas','Castro','Ancud','Chonchi','Curaco de Vélez','Dalcahue','Puqueldón','Queilén','Quellón','Quemchi','Quinchao','Osorno','Puerto Octay','Purranque','Puyehue','Río Negro','San Juan de la Costa','San Pablo','Chaitén','Futaleufú','Hualaihué','Palena'],
    XI:['Coyhaique','Lago Verde','Aysén','Cisnes','Guaitecas','Cochrane','O\'Higgins','Tortel','Chile Chico','Río Ibáñez'],
    XII:['Punta Arenas','Laguna Blanca','Río Verde','San Gregorio','Cabo de Hornos','Antártica','Porvenir','Primavera','Timaukel','Natales','Torres del Paine']
  };

  /* ── Estado ─────────────────────────────────────────────── */
  var gcItems = [];
  var gcClientType = 'PN';
  var gcSelectedEntrega = null;
  var gcCurrentGrand = 0;

  /* ── Helpers ─────────────────────────────────────────────── */
  function fmt(n) { return '$ ' + Math.round(n || 0).toLocaleString('es-CL'); }
  function gcLoad() { try { gcItems = JSON.parse(sessionStorage.getItem(GC_KEY) || '[]'); } catch(e) { gcItems = []; } }
  function gcSave() { try { sessionStorage.setItem(GC_KEY, JSON.stringify(gcItems)); } catch(e) {} }
  function gcTotal() { return gcItems.reduce(function(s,i){ return s + (i.subtotal||0); }, 0); }
  function gcCount() { return gcItems.reduce(function(s,i){ return s + (i.qty||0); }, 0); }
  function gEl(id) { return document.getElementById(id); }

  /* ── GA4 ecommerce ───────────────────────────────────────── */
  function gcDlPush(eventName, ecommerce) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ ecommerce: null });
    window.dataLayer.push({ event: eventName, ecommerce: ecommerce });
  }
  function gcDlItem(item, idx) {
    return {
      item_id: item.sku || item.gid || '',
      item_name: (MOD_LABELS[item.module] ? MOD_LABELS[item.module] + ' · ' : '') + (item.nombre || ''),
      item_brand: 'Polyplas',
      item_category: MOD_LABELS[item.module] || item.module || '',
      price: item.precio_unit || Math.round((item.subtotal || 0) / (item.qty || 1)),
      quantity: item.qty || 1,
      index: idx || 0
    };
  }

  /* ── Scroll lock (compatible con iOS Safari) ────────────── */
  var _gcScrollY = 0;
  function gcLockScroll() {
    _gcScrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top      = '-' + _gcScrollY + 'px';
    document.body.style.width    = '100%';
    document.body.style.overflow = 'hidden';
  }
  function gcUnlockScroll() {
    document.body.style.position = '';
    document.body.style.top      = '';
    document.body.style.width    = '';
    document.body.style.overflow = '';
    window.scrollTo(0, _gcScrollY);
  }

  /* ── Badge y FAB ─────────────────────────────────────────── */
  function gcUpdateBadge() {
    gcLoad();
    var cnt = gcCount();
    var bdg = gEl('ppGC-badge');
    var fab = gEl('ppGC-fab');
    if (bdg) bdg.textContent = cnt;
    if (fab) fab.style.display = cnt > 0 ? 'flex' : 'none';
  }

  /* ── API pública: agregar ítem ───────────────────────────── */
  window.ppGlobalCartAdd = function(item) {
    gcLoad();
    if (!item.gid) item.gid = Date.now().toString(36) + Math.random().toString(36).slice(2,7);
    var idx = gcItems.findIndex(function(i){ return i.gid === item.gid; });
    if (idx >= 0) gcItems[idx] = item; else gcItems.push(item);
    gcSave();
    gcUpdateBadge();
    setTimeout(function() {
      ['floatingCart','tinaFloatingCart','cupolasFloatingCart','receptFloatingCart'].forEach(function(id){
        var el = document.getElementById(id); if (el) el.style.display = 'none';
      });
    }, 0);
  };

  window.ppGlobalCartRemove = function(gid) {
    gcLoad();
    gcItems = gcItems.filter(function(i){ return i.gid !== gid; });
    gcSave();
    gcUpdateBadge();
    gcRenderCartItems();
    document.dispatchEvent(new CustomEvent('ppGCItemRemoved', { detail: { gid: gid } }));
  };

  /* ── MODAL CARRITO ───────────────────────────────────────── */
  function gcRenderCartItems() {
    var el    = gEl('ppGC-cart-items');
    var total = gEl('ppGC-cart-total-val');
    var trow  = gEl('ppGC-cart-total-row');
    var acts  = gEl('ppGC-cart-actions');
    var cnt   = gEl('ppGC-cart-count');
    if (!el) return;

    if (!gcItems.length) {
      el.innerHTML = '<div class="ppGC-cart-empty"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg><div>Tu carrito está vacío</div></div>';
      if (trow) trow.style.display = 'none';
      if (acts) acts.style.display = 'none';
      if (cnt)  cnt.textContent = '0';
      return;
    }

    el.innerHTML = gcItems.map(function(item) {
      var mod = MOD_LABELS[item.module] || item.module || '';
      return '<div class="ppGC-cart-item">' +
        '<div class="ppGC-cart-item-info">' +
          (mod ? '<div class="ppGC-cart-item-mod">' + mod + '</div>' : '') +
          '<div class="ppGC-cart-item-name">' + (item.nombre || '') + '</div>' +
          '<div class="ppGC-cart-item-qty">Cantidad: ' + item.qty + '</div>' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:10px;">' +
          '<span class="ppGC-cart-item-price">' + fmt(item.subtotal) + '</span>' +
          '<button class="ppGC-cart-item-remove" onclick="window.ppGlobalCartRemove(\'' + item.gid + '\')" title="Eliminar">×</button>' +
        '</div>' +
      '</div>';
    }).join('');

    if (total) total.textContent = fmt(gcTotal());
    if (trow)  trow.style.display = 'flex';
    if (acts)  acts.style.display = 'flex';
    if (cnt)   cnt.textContent = gcCount();

    // Barra de progreso hacia envío gratis
    var grand = gcTotal();
    var shipBar   = gEl('ppGC-shipping-bar');
    var shipFill  = gEl('ppGC-shipping-fill');
    var shipLabel = gEl('ppGC-shipping-label');
    if (shipBar && shipFill && shipLabel) {
      shipBar.style.display = '';
      var pct = Math.min(100, Math.round(grand / UMBRAL * 100));
      shipFill.style.width = pct + '%';
      if (grand >= UMBRAL) {
        shipLabel.textContent = '🚚 Tienes despacho gratis a la RM';
        shipLabel.className = 'ppGC-shipping-label reached';
      } else {
        shipLabel.textContent = 'Te faltan ' + fmt(UMBRAL - grand) + ' para despacho gratis';
        shipLabel.className = 'ppGC-shipping-label';
      }
    }
  }

  function ppGCOpen() {
    gcLoad();
    gcRenderCartItems();
    gEl('ppGC-overlay').style.display = 'block';
    gEl('ppGC-cart-modal').style.display = 'flex';
    gcLockScroll();
  }

  function ppGCCloseCart() {
    gEl('ppGC-cart-modal').style.display = 'none';
    gEl('ppGC-overlay').style.display = 'none';
    gcUnlockScroll();
  }

  function ppGCClearAndClose() {
    gcLoad();
    gcItems.forEach(function(item) {
      document.dispatchEvent(new CustomEvent('ppGCItemRemoved', { detail: { gid: item.gid } }));
    });
    gcItems = [];
    try { sessionStorage.removeItem(GC_KEY); } catch(e) {}
    document.dispatchEvent(new CustomEvent('ppGCCartCleared'));
    gcUpdateBadge();
    ppGCCloseCart();
  }

  function ppGCBackToCart() {
    ppGCCloseCheckout();
    ppGCOpen();
  }

  /* ── MODAL CHECKOUT ──────────────────────────────────────── */
  function ppGCOpenCheckout() {
    gcLoad();
    if (!gcItems.length) return;
    ppGCCloseCart();
    gcCurrentGrand = gcTotal();
    gcClientType = 'PN';
    ppGCSetClientType('PN');
    gcRenderSummary();
    var si = gEl('ppGC-sum-items'); if (si) si.classList.remove('collapsed');
    var st = gEl('ppGC-sum-toggle'); if (st) st.textContent = 'Ocultar';
    var e1 = gEl('ppGC-s1-err'); if (e1) e1.style.display = 'none';
    var e2 = gEl('ppGC-s2-err'); if (e2) e2.style.display = 'none';
    ppGCGoToStep1Internal();
    gEl('ppGC-overlay').style.display = 'block';
    gEl('ppGC-co-modal').style.display = 'flex';
    gcLockScroll();
  }

  function ppGCCloseCheckout() {
    gEl('ppGC-co-modal').style.display = 'none';
    gEl('ppGC-overlay').style.display = 'none';
    gcUnlockScroll();
  }

  function ppGCCloseAll() {
    gEl('ppGC-cart-modal').style.display = 'none';
    gEl('ppGC-co-modal').style.display = 'none';
    gEl('ppGC-overlay').style.display = 'none';
    gcUnlockScroll();
  }

  /* ── Validación teléfono ─────────────────────────────────── */
  function ppGCOnTelFocus(el) { if (!el.value.startsWith(TEL_PREFIX)) el.value = TEL_PREFIX; }
  function ppGCOnTelKeydown(e,el) { if ((e.key==='Backspace'||e.key==='Delete') && el.selectionStart<=TEL_PREFIX.length) e.preventDefault(); }
  function ppGCOnTelInput(el) {
    var val = el.value;
    if (!val.startsWith(TEL_PREFIX)) val = TEL_PREFIX + val.replace(/^\+?56\s?/,'').replace(/[^0-9]/g,'');
    var digits = val.slice(TEL_PREFIX.length).replace(/[^0-9]/g,'');
    if (digits.length > 9) digits = digits.slice(0,9);
    el.value = TEL_PREFIX + digits;
    var errEl = gEl(el.id+'_err');
    var invalid = digits.length > 0 && digits.length < 9;
    var ok = digits.length === 9;
    if (errEl) errEl.style.display = invalid ? 'block' : 'none';
    el.classList.toggle('ppGC-input-error', invalid);
    el.classList.toggle('ppGC-input-valid', ok);
    if (!ok) el.classList.remove('ppGC-input-valid');
  }
  function ppGCTelIsValid(id) { var el=gEl(id); return el ? el.value.slice(TEL_PREFIX.length).replace(/[^0-9]/g,'').length===9 : false; }

  /* ── Validación email ────────────────────────────────────── */
  function ppGCOnEmailInput(el) {
    var val = el.value.trim();
    var errEl = gEl(el.id+'_err');
    var valid = (val.match(/@/g)||[]).length===1 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val);
    if (!val) { if (errEl) errEl.style.display='none'; el.classList.remove('ppGC-input-error','ppGC-input-valid'); return; }
    if (valid) { if (errEl) errEl.style.display='none'; el.classList.remove('ppGC-input-error'); el.classList.add('ppGC-input-valid'); }
    else       { if (errEl) errEl.style.display='block'; el.classList.add('ppGC-input-error'); el.classList.remove('ppGC-input-valid'); }
  }
  function ppGCEmailIsValid(id) { var el=gEl(id); if(!el) return false; var v=el.value.trim(); return (v.match(/@/g)||[]).length===1 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); }

  /* ── Validación RUT ──────────────────────────────────────── */
  function ppGCFormatRut(input) {
    var v = input.value.replace(/[^0-9kK]/g,'').toUpperCase();
    if (v.length < 2) { input.value = v; return; }
    var dv = v.slice(-1);
    var cuerpo = v.slice(0,-1).replace(/\B(?=(\d{3})+(?!\d))/g,'.');
    input.value = cuerpo + '-' + dv;
    var errMap = {ppgc_rut:'ppgc_rut_err', ppgc_emp_rut:'ppgc_emp_rut_err'};
    if (errMap[input.id]) {
      var digits = cuerpo.replace(/\./g,'');
      var valid = digits.length===8 && /^[0-9K]$/.test(dv);
      var errEl = gEl(errMap[input.id]);
      if (errEl) errEl.style.display = (v.length>0 && !valid) ? 'block' : 'none';
      input.classList.toggle('ppGC-input-error', v.length>0 && !valid);
      input.classList.toggle('ppGC-input-valid', v.length>0 && valid);
    }
  }

  function ppGCValidateField(el) {
    if (!el.value || el.value.trim()==='' || el.value===TEL_PREFIX) return;
    if (el.id.includes('email')) { ppGCOnEmailInput(el); return; }
    if (el.id.includes('rut'))   { ppGCFormatRut(el); return; }
    if (el.type==='tel')         { ppGCOnTelInput(el); return; }
    var valid = el.value.trim().length >= 2;
    el.classList.toggle('ppGC-input-valid', valid);
    el.classList.toggle('ppGC-input-error', !valid);
  }

  /* ── Comunas ─────────────────────────────────────────────── */
  function ppGCUpdateComunas(prefix) {
    var rEl = gEl(prefix+'_region');
    var cEl = gEl(prefix+'_ciudad');
    if (!rEl||!cEl) return;
    var region = rEl.value;
    if (!region || !COMUNAS[region]) { cEl.disabled=true; cEl.innerHTML='<option value="">Selecciona primero la región...</option>'; return; }
    cEl.disabled = false;
    cEl.innerHTML = '<option value="">Selecciona comuna...</option>' + COMUNAS[region].map(function(c){ return '<option value="'+c+'">'+c+'</option>'; }).join('');
  }

  /* ── Toggle cliente ──────────────────────────────────────── */
  function ppGCSetClientType(type) {
    gcClientType = type;
    var pnEl=gEl('ppGC-fieldsPN'), empEl=gEl('ppGC-fieldsEMP');
    var bPN=gEl('ppGC-btnPN'), bEMP=gEl('ppGC-btnEMP');
    if (pnEl)  pnEl.style.display  = type==='PN'  ? 'grid' : 'none';
    if (empEl) empEl.style.display = type==='EMP' ? 'grid' : 'none';
    if (bPN)   bPN.classList.toggle('active',  type==='PN');
    if (bEMP)  bEMP.classList.toggle('active', type==='EMP');
  }

  /* ── Toggle resumen ──────────────────────────────────────── */
  function ppGCToggleSummary() {
    var items=gEl('ppGC-sum-items'), btn=gEl('ppGC-sum-toggle');
    if (!items||!btn) return;
    btn.textContent = items.classList.toggle('collapsed') ? 'Ver' : 'Ocultar';
  }

  function gcRenderSummary() {
    var el=gEl('ppGC-sum-items'), total=gEl('ppGC-sum-total');
    if (!el) return;
    if (!gcItems.length) { el.innerHTML='El carrito está vacío.'; return; }
    el.innerHTML = gcItems.map(function(item){
      var mod = MOD_LABELS[item.module]||item.module||'';
      return '<div style="margin-bottom:4px;">'+(mod?'<span style="font-size:0.72em;color:#888;text-transform:uppercase;">'+mod+'</span><br>':'')+item.nombre+' × '+item.qty+'<br><strong style="color:#004a99;">'+fmt(item.subtotal)+'</strong></div>';
    }).join('');
    if (total) total.textContent = fmt(gcTotal());
  }

  /* ── Entrega ─────────────────────────────────────────────── */
  function gcUpdateModalTotal() {
    var total = gcCurrentGrand + (gcSelectedEntrega ? (gcSelectedEntrega.costo||0) : 0);
    var el = gEl('ppGC-modal-total'); if (el) el.textContent = fmt(total);
  }

  function gcResetEntregaUI() {
    var eo=gEl('ppGC-entregaOptions'); if (eo) eo.innerHTML='';
    ['ppGC-addressSection','ppGC-retiroInfo','ppGC-envioInfo'].forEach(function(id){ var s=gEl(id); if(s) s.style.display='none'; });
    var wb=gEl('ppGC-btn-wp'); if (wb) { wb.disabled=true; wb.style.opacity='0.5'; wb.style.cursor='not-allowed'; }
    var t=gEl('ppGC-entregaTitulo'); if (t) t.style.display='none';
    gcSelectedEntrega=null;
    gcUpdateModalTotal();
  }

  function gcBuildEntregaOptions(grand, regionPresel) {
    gcResetEntregaUI();
    var el=gEl('ppGC-entregaOptions'); if (!el) return;
    var t=gEl('ppGC-entregaTitulo'); if (t) t.style.display='block';
    var esRM = regionPresel==='RM';
    var opciones = [
      { id:'retiro_tienda', icon:'🏪', label:'Retiro en tienda', desc:'Sin costo · Santiago Concha 1525', badge:'<span class="ppGC-entrega-badge badge-gratis">GRATIS</span>', costo:0, needsAddress:false }
    ];
    if (esRM) {
      opciones.push({ id:'despacho', icon:'🚚', label:'Despacho a domicilio', desc:'Gratis · Región Metropolitana · 1–3 días hábiles', badge:'<span class="ppGC-entrega-badge badge-gratis">GRATIS</span>', costo:0, needsAddress:true });
    } else {
      opciones.push({ id:'envio_propio', icon:'📦', label:'Envío propio', desc:'Coordinas tú el transporte desde nuestra bodega', badge:'<span class="ppGC-entrega-badge badge-propio">TÚ GESTIONAS</span>', costo:0, needsAddress:false });
    }
    opciones.forEach(function(op) {
      var div=document.createElement('div');
      div.className='ppGC-entrega-opt';
      div.innerHTML='<span class="ppGC-entrega-icon">'+op.icon+'</span><div class="ppGC-entrega-info"><strong>'+op.label+'</strong><span id="ppGC-desc-'+op.id+'">'+op.desc+'</span></div>'+op.badge;
      div.addEventListener('click', function(){
        el.querySelectorAll('.ppGC-entrega-opt').forEach(function(x){ x.classList.remove('selected'); });
        div.classList.add('selected');
        gcSelectedEntrega = { id:op.id, label:op.label, costo:op.costo, needsAddress:op.needsAddress };
        gcDlPush('add_shipping_info', { currency: 'CLP', value: gcCurrentGrand, shipping_tier: op.id, customer_type: gcClientType, items: gcItems.map(gcDlItem) });
        var e2=gEl('ppGC-s2-err'); if (e2) e2.style.display='none';
        var wb=gEl('ppGC-btn-wp'); if (wb) { wb.disabled=false; wb.style.opacity=''; wb.style.cursor=''; }
        gEl('ppGC-retiroInfo').style.display    = op.id==='retiro_tienda' ? 'block' : 'none';
        gEl('ppGC-envioInfo').style.display     = op.id==='envio_propio'  ? 'block' : 'none';
        gEl('ppGC-addressSection').style.display= op.id==='despacho'      ? 'block' : 'none';
        if (op.needsAddress) {
          var reg=gEl('ppgc_pn_region'); if (reg&&regionPresel) reg.value=regionPresel;
          if (regionPresel) ppGCUpdateComunas('ppgc_pn');
          var step1Dir = gcClientType==='EMP' ? (gEl('ppgc_emp_dir')||{}).value||'' : (gEl('ppgc_bill_dir')||{}).value||'';
          var dirEl=gEl('ppgc_pn_dir'); if (dirEl&&step1Dir) dirEl.value=step1Dir;
        }
        gcUpdateModalTotal();
      });
      el.appendChild(div);
    });
  }

  function ppGCOnRegionPreCheck() {
    var region=(gEl('ppGC-regionPreCheck')||{}).value||'';
    var msg=gEl('ppGC-regionNoDespachoMsg');
    var cc=gEl('ppGC-comunaCheck');
    gcResetEntregaUI();
    if (gEl('ppGC-comunaExcluidaMsg')) gEl('ppGC-comunaExcluidaMsg').style.display='none';
    if (!region) { if (msg) msg.style.display='none'; if (cc) cc.style.display='none'; return; }
    if (region!=='RM') {
      if (msg) msg.style.display='block'; if (cc) cc.style.display='none';
      gcBuildEntregaOptions(gcCurrentGrand, region);
    } else {
      if (msg) msg.style.display='none';
      if (cc) {
        var sel=gEl('ppGC-comunaPreCheck');
        sel.innerHTML='<option value="">Selecciona tu comuna...</option>'+COMUNAS.RM.map(function(c){ return '<option value="'+c+'">'+c+'</option>'; }).join('');
        cc.style.display='block';
      }
    }
  }

  function ppGCOnComunaPreCheck() {
    var comuna=(gEl('ppGC-comunaPreCheck')||{}).value||'';
    var cm=gEl('ppGC-comunaExcluidaMsg');
    gcResetEntregaUI();
    if (!comuna) { if (cm) cm.style.display='none'; return; }
    var excluida=EXCLUIDAS_RM.some(function(c){ return c.toLowerCase()===comuna.toLowerCase(); });
    if (cm) cm.style.display=excluida?'block':'none';
    gcBuildEntregaOptions(gcCurrentGrand, excluida?null:'RM');
  }

  function ppGCRecalcDespacho() {
    if (!gcSelectedEntrega||!gcSelectedEntrega.needsAddress) return;
    var region=(gEl('ppgc_pn_region')||{}).value||'';
    var comuna=(gEl('ppgc_pn_ciudad')||{}).value||'';
    var descEl=gEl('ppGC-desc-despacho');
    if (region==='RM') {
      var excluida=comuna&&EXCLUIDAS_RM.some(function(c){ return c.toLowerCase()===comuna.toLowerCase(); });
      if (descEl) descEl.textContent=excluida
        ? '⚠️ Esta comuna no tiene despacho gratis. Usa Retiro en tienda o Envío propio.'
        : 'Despacho gratis · Región Metropolitana · 1–3 días hábiles';
    } else if (region) {
      if (descEl) descEl.textContent='⚠️ Despacho gratis solo para Región Metropolitana.';
    }
    gcUpdateModalTotal();
  }

  /* ── Navegación checkout ─────────────────────────────────── */
  function ppGCGoToStep1Internal() {
    gEl('ppGC-s1').style.display='block';
    gEl('ppGC-s2').style.display='none';
    var d1=gEl('ppGCsDot1'),d2=gEl('ppGCsDot2'),l=gEl('ppGCsLine'),l1=gEl('ppGCsLbl1'),l2=gEl('ppGCsLbl2');
    if (d1) d1.className='ppGC-step-num active'; if (d2) d2.className='ppGC-step-num';
    if (l)  l.className='ppGC-step-line'; if (l1) l1.className='ppGC-step-label active'; if (l2) l2.className='ppGC-step-label';
    var box=gEl('ppGC-co-modal'); if (box) { var b=box.querySelector('.ppGC-modal-box'); if(b) b.scrollTop=0; }
  }

  function ppGCGoToStep1() { ppGCGoToStep1Internal(); }

  function ppGCGoToStep2() {
    var errEl=gEl('ppGC-s1-err');
    var pnFields=['ppgc_nombre','ppgc_rut','ppgc_email','ppgc_tel','ppgc_bill_dir','ppgc_bill_region','ppgc_bill_ciudad'];
    var empFields=['ppgc_emp_rut','ppgc_emp_razon','ppgc_emp_giro','ppgc_emp_tel','ppgc_emp_email','ppgc_emp_dir','ppgc_emp_region','ppgc_emp_ciudad'];
    var fields = gcClientType==='PN' ? pnFields : empFields;
    var isEmpty = function(id){ var el=gEl(id); return !el||!el.value.trim()||el.value.trim()===TEL_PREFIX; };

    if (fields.some(isEmpty)) {
      if (errEl) { errEl.textContent='Completa todos los campos obligatorios (*).'; errEl.style.display='block'; }
      fields.forEach(function(id){ var el=gEl(id); if(el&&isEmpty(id)) el.classList.add('ppGC-input-error'); });
      var first=fields.find(isEmpty); if (first) { var fe=gEl(first); if(fe) fe.scrollIntoView({behavior:'smooth',block:'center'}); }
      return;
    }
    if (errEl) errEl.style.display='none';

    var emailId=gcClientType==='PN'?'ppgc_email':'ppgc_emp_email';
    var telId  =gcClientType==='PN'?'ppgc_tel'  :'ppgc_emp_tel';
    var rutId  =gcClientType==='PN'?'ppgc_rut'  :'ppgc_emp_rut';
    var rutErrId=gcClientType==='PN'?'ppgc_rut_err':'ppgc_emp_rut_err';

    var rutEl=gEl(rutId), rawRut=rutEl?rutEl.value.replace(/[^0-9kK]/g,'').toUpperCase():'';
    var rutOk=rawRut.slice(0,-1).length===8 && /^[0-9K]$/.test(rawRut.slice(-1));
    if (!rutOk) { var re=gEl(rutErrId); if(re) re.style.display='block'; if(rutEl){rutEl.classList.add('ppGC-input-error');rutEl.scrollIntoView({behavior:'smooth',block:'center'});} return; }
    if (!ppGCEmailIsValid(emailId)) { var ee=gEl(emailId+'_err'); if(ee) ee.style.display='block'; var eEl=gEl(emailId); if(eEl){eEl.classList.add('ppGC-input-error');eEl.scrollIntoView({behavior:'smooth',block:'center'});} return; }
    if (!ppGCTelIsValid(telId)) { var te=gEl(telId+'_err'); if(te) te.style.display='block'; var tEl=gEl(telId); if(tEl){tEl.classList.add('ppGC-input-error');tEl.scrollIntoView({behavior:'smooth',block:'center'});} return; }

    gEl('ppGC-s1').style.display='none';
    gEl('ppGC-s2').style.display='block';
    var d1=gEl('ppGCsDot1'),d2=gEl('ppGCsDot2'),l=gEl('ppGCsLine'),l1=gEl('ppGCsLbl1'),l2=gEl('ppGCsLbl2');
    if (d1) d1.className='ppGC-step-num done'; if (d2) d2.className='ppGC-step-num active';
    if (l)  l.className='ppGC-step-line done'; if (l1) l1.className='ppGC-step-label done'; if (l2) l2.className='ppGC-step-label active';

    // Render ítems paso 2
    var oi=gEl('ppGC-order-items');
    if (oi) oi.innerHTML=gcItems.map(function(item){
      var mod=MOD_LABELS[item.module]||item.module||'';
      return '<div class="ppGC-order-item"><span class="desc">'+(mod?mod+' · ':'')+item.nombre+' × '+item.qty+'</span><span class="monto">'+fmt(item.subtotal)+'</span></div>';
    }).join('');

    gcCurrentGrand = gcTotal();
    gcResetEntregaUI();

    // Pre-seleccionar región del cliente para opciones de entrega
    var step1Region=gcClientType==='EMP'?((gEl('ppgc_emp_region')||{}).value||''):((gEl('ppgc_bill_region')||{}).value||'');

    gEl('ppGC-regionCheck').style.display='none';
    var regionForOpts=null;
    if (gcCurrentGrand >= UMBRAL) {
      if (step1Region==='RM') {
        var step1Ciudad=gcClientType==='EMP'?((gEl('ppgc_emp_ciudad')||{}).value||''):((gEl('ppgc_bill_ciudad')||{}).value||'');
        var excluida=step1Ciudad&&EXCLUIDAS_RM.some(function(c){ return c.toLowerCase()===step1Ciudad.toLowerCase(); });
        regionForOpts=excluida?null:'RM';
      } else {
        regionForOpts=step1Region||null;
      }
    }
    gcBuildEntregaOptions(gcCurrentGrand, regionForOpts);
    gcDlPush('begin_checkout', { currency: 'CLP', value: gcCurrentGrand, customer_type: gcClientType, items: gcItems.map(gcDlItem) });
    gcDlPush('add_payment_info', { currency: 'CLP', value: gcCurrentGrand, payment_type: 'Webpay', customer_type: gcClientType, items: gcItems.map(gcDlItem) });
    gcUpdateModalTotal();
    var box=gEl('ppGC-co-modal'); if (box) { var b=box.querySelector('.ppGC-modal-box'); if(b) b.scrollTop=0; }
  }

  /* ── Datos cliente ───────────────────────────────────────── */
  function gcGetClientData() {
    var g=function(id){ var el=gEl(id); return el?el.value.trim():''; };
    if (gcClientType==='PN') {
      return { tipo:'Persona Natural', nombre:g('ppgc_nombre'), rut:g('ppgc_rut'), email:g('ppgc_email'), tel:g('ppgc_tel'), dir_factura:g('ppgc_bill_dir'), region_factura:g('ppgc_bill_region'), ciudad_factura:g('ppgc_bill_ciudad'), dir:g('ppgc_pn_dir'), ciudad:g('ppgc_pn_ciudad'), region:g('ppgc_pn_region') };
    }
    return { tipo:'Empresa', rut:g('ppgc_emp_rut'), razon:g('ppgc_emp_razon'), giro:g('ppgc_emp_giro'), tel:g('ppgc_emp_tel'), email:g('ppgc_emp_email'), dir:g('ppgc_emp_dir'), region:g('ppgc_emp_region'), ciudad:g('ppgc_emp_ciudad'), dir_despacho:g('ppgc_pn_dir'), region_despacho:g('ppgc_pn_region'), ciudad_despacho:g('ppgc_pn_ciudad') };
  }

  /* ── Submit Webpay ───────────────────────────────────────── */
  async function ppGCSubmitCheckout() {
    var e2=gEl('ppGC-s2-err'), btn=gEl('ppGC-btn-wp');
    if (!gcSelectedEntrega) { if (e2) { e2.textContent='Elige una modalidad de entrega.'; e2.style.display='block'; } return; }
    if (gcSelectedEntrega.needsAddress) {
      var dd=gEl('ppgc_pn_dir'), dr=gEl('ppgc_pn_region'), dc=gEl('ppgc_pn_ciudad');
      if (!dd||!dd.value||!dr||!dr.value||!dc||!dc.value) { if (e2){e2.textContent='Completa la dirección de despacho.';e2.style.display='block';} return; }
    }
    var client=gcGetClientData(), total=gcCurrentGrand+(gcSelectedEntrega.costo||0);
    if (btn) { btn.disabled=true; btn.textContent='Procesando...'; }
    if (e2) e2.style.display='none';
    var convId=(typeof crypto!=='undefined'&&crypto.randomUUID)?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2);
    var shortId='PP-'+convId.split('-').pop().substring(0,5).toUpperCase();
    var resumen=gcItems.map(function(item){ var mod=MOD_LABELS[item.module]||item.module||''; return '• '+(mod?mod+' · ':'')+item.nombre+' × '+item.qty+' → '+fmt(item.subtotal); }).join('\n');
    try {
      var res=await fetch('/wp-json/polyplas/v1/webpay-init',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({total:Math.round(total),entrega:gcSelectedEntrega.label,client:client,return_page:'https://polyplas.cl/gracias/',items:gcItems.map(function(i){return{nombre:i.nombre,qty:i.qty,precio_unit:i.precio_unit||0,corte_costo:i.corte_costo||0,subtotal:i.subtotal||0,corteMode:i.corteMode||'',tieneRecargo:i.tieneRecargo||false,corteInstrucciones:i.corteInstrucciones||'',corteMedidas:i.corteMedidas||null,calcInfo:i.calcInfo||null};})})});
      var data=await res.json();
      if (!data.token||!data.url) throw new Error('Respuesta inválida');
      try { sessionStorage.setItem(GC_ORDER_KEY,JSON.stringify({convId:convId,shortId:shortId,client:client,items:gcItems,entregaLabel:gcSelectedEntrega.label,total:total,resumen:resumen})); } catch(e){}
      var form=document.createElement('form'); form.method='POST'; form.action=data.url;
      var inp=document.createElement('input'); inp.type='hidden'; inp.name='token_ws'; inp.value=data.token;
      form.appendChild(inp); document.body.appendChild(form); form.submit();
    } catch(e) {
      if (e2){e2.textContent='Error al conectar con Webpay. Intenta de nuevo.';e2.style.display='block';}
      if (btn){btn.disabled=false;btn.innerHTML='<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg> PAGAR CON WEBPAY PLUS';}
    }
  }

  /* ── Resultado de pago ───────────────────────────────────── */
  function gcCheckPaymentResult() {
    var params=new URLSearchParams(window.location.search);
    if (params.get('pp_pago')!=='aprobado') return;
    var od=null; try { od=JSON.parse(sessionStorage.getItem(GC_ORDER_KEY)||'null'); } catch(e){}
    if (!od) return;
    sessionStorage.removeItem(GC_ORDER_KEY);
    try { sessionStorage.removeItem(GC_KEY); } catch(e){}
    var auth=params.get('auth')||'', orden=params.get('orden')||'';
    gcDlPush('purchase', { transaction_id: orden, currency: 'CLP', value: od.total, customer_type: (od.client && od.client.tipo === 'Empresa') ? 'EMP' : 'PN', items: (od.items || []).map(gcDlItem) });
    (function tryReg() {
      if (!window.POLYPLAS_CONFIG||typeof(window.supabase||{}).createClient!=='function') { setTimeout(tryReg,400); return; }
      try {
        var sb=window.supabase.createClient(window.POLYPLAS_CONFIG.SUPABASE_URL,window.POLYPLAS_CONFIG.SUPABASE_ANON_KEY);
        sb.from('conversations').insert({id:od.convId,client_name:od.client.nombre||od.client.razon||'',client_email:od.client.email||'',unread_count:1,last_message_at:new Date().toISOString(),metadata:{source:'order',tipo_cliente:od.client.tipo||'',nombre:od.client.nombre||'',razon_social:od.client.razon||'',rut:od.client.rut||'',email:od.client.email||'',phone:od.client.tel||'',dir:od.client.dir||od.client.dir_factura||'',ciudad:od.client.ciudad||od.client.ciudad_factura||'',region:od.client.region||od.client.region_factura||'',entrega:od.entregaLabel,total:od.total,items:od.items.map(function(i){return{module:i.module,nombre:i.nombre,qty:i.qty,precio_unit:i.precio_unit,corte_costo:i.corte_costo||0,subtotal:i.subtotal,corteMode:i.corteMode||'',tieneRecargo:i.tieneRecargo||false,corteInstrucciones:i.corteInstrucciones||'',corteMedidas:i.corteMedidas||null,calcInfo:i.calcInfo||null};}),webpay_orden:orden,webpay_auth:auth}}).then(function(){
          var msg='🛒 PEDIDO WEB - CARRITO GLOBAL\n─────────────────\n'+od.resumen+'\n─────────────────\nEntrega: '+od.entregaLabel+'   Total: '+fmt(od.total)+'\n─────────────────\nCliente: '+(od.client.nombre||od.client.razon)+'  RUT: '+od.client.rut+'\nEmail: '+od.client.email+'  Tel: '+od.client.tel;
          sb.from('messages').insert({conversation_id:od.convId,sender:'client',content:msg});
          fetch('https://script.google.com/macros/s/AKfycbw4WkE3slUjbDIUrbYVZD-aL1nB6WWJeyj6XG6rpFNz9p3pSFfdmUd3FjY_hV-QQJNkKA/exec?'+new URLSearchParams({accion:'pedido_web',idRef:od.shortId,nombre:od.client.nombre||od.client.razon||'',email:od.client.email||'',telefono:od.client.tel||'',monto:String(od.total),vendido:'Sí',observaciones:od.resumen+' | Entrega:'+od.entregaLabel}).toString(),{mode:'no-cors'});
        });
      } catch(e){ console.warn('ppGC Supabase error:',e); }
    })();
  }

  /* ── Unificar drawers individuales ──────────────────────── */
  function ppGCUnify() {
    ['openCartDrawer','toggleCartDrawer',
     'openTinaDrawer','toggleTinaDrawer',
     'openCupolasDrawer','openReceptDrawer'].forEach(function(fn) {
      if (window[fn] && !window[fn]._gc) {
        window[fn] = function() { ppGCOpen(); };
        window[fn]._gc = true;
      }
    });
    // openCheckout de otros módulos va directo al checkout (no solo al carrito)
    if (window.openCheckout && !window.openCheckout._gc) {
      window.openCheckout = function() { ppGCOpenCheckout(); };
      window.openCheckout._gc = true;
    }
    ['updateFloatingCart','cupUpdateFloatingCart','receptUpdateFloatingCart'].forEach(function(fn){
      if (window[fn]&&!window[fn]._gc) { window[fn]=function(){}; window[fn]._gc=true; }
    });
    ['floatingCart','tinaFloatingCart','cupolasFloatingCart','receptFloatingCart'].forEach(function(id){
      var el=document.getElementById(id); if (el) el.style.display='none';
    });
  }
  ppGCUnify();
  setTimeout(ppGCUnify, 300);
  setTimeout(ppGCUnify, 1000);

  /* ── Exponer API global ──────────────────────────────────── */
  window.ppGCOpen            = ppGCOpen;
  window.ppGCCloseCart       = ppGCCloseCart;
  window.ppGCClearAndClose   = ppGCClearAndClose;
  window.ppGCBackToCart      = ppGCBackToCart;
  window.ppGCOpenCheckout    = ppGCOpenCheckout;
  window.ppGCCloseCheckout   = ppGCCloseCheckout;
  window.ppGCCloseAll        = ppGCCloseAll;
  window.ppGCSetClientType   = ppGCSetClientType;
  window.ppGCToggleSummary   = ppGCToggleSummary;
  window.ppGCValidateField   = ppGCValidateField;
  window.ppGCFormatRut       = ppGCFormatRut;
  window.ppGCOnTelInput      = ppGCOnTelInput;
  window.ppGCOnTelKeydown    = ppGCOnTelKeydown;
  window.ppGCOnTelFocus      = ppGCOnTelFocus;
  window.ppGCOnEmailInput    = ppGCOnEmailInput;
  window.ppGCUpdateComunas   = ppGCUpdateComunas;
  window.ppGCGoToStep1       = ppGCGoToStep1;
  window.ppGCGoToStep2       = ppGCGoToStep2;
  window.ppGCOnRegionPreCheck  = ppGCOnRegionPreCheck;
  window.ppGCOnComunaPreCheck  = ppGCOnComunaPreCheck;
  window.ppGCRecalcDespacho    = ppGCRecalcDespacho;
  window.ppGCSubmitCheckout    = ppGCSubmitCheckout;

  /* ── Init ────────────────────────────────────────────────── */
  gcLoad();
  gcUpdateBadge();
  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded', gcCheckPaymentResult);
  else gcCheckPaymentResult();

})();
