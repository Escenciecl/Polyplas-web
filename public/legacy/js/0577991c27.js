(function () {
  var CFG = { SEPARACION: 10, REINTENTOS: 20 };
  var $ = function (id) { return document.getElementById(id); };

  var root = $('pp-cb');
  if (!root) return;
  var tab = $('pp-cb-tab'), panel = $('pp-cb-panel'), bk = $('pp-cb-bk');
  var fab = null, win = null, abierto = false, agendado = false, intentos = 0;

  /* ── Abrir / cerrar ── */
  function abrir() {
    if (abierto) return;
    abierto = true;
    root.classList.add('pp-abierto');
    tab.setAttribute('aria-expanded', 'true');
    panel.setAttribute('aria-hidden', 'false');
    pedir();
  }
  function cerrar(sinFoco) {
    if (!abierto) return;
    abierto = false;
    root.classList.remove('pp-abierto');
    tab.setAttribute('aria-expanded', 'false');
    panel.setAttribute('aria-hidden', 'true');
    if (!sinFoco) { try { tab.focus({ preventScroll: true }); } catch (e) {} }
  }
  tab.addEventListener('click', function () { abierto ? cerrar() : abrir(); });
  $('pp-cb-close').addEventListener('click', function () { cerrar(); });
  bk.addEventListener('click', function () { cerrar(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') cerrar(); });

  /* ── Posición: convivir con el chat sin pisarse ── */
  function cruza(a, b, pad) {
    pad = pad || 0;
    return a.left < b.right + pad && a.right > b.left - pad && a.top < b.bottom + pad && a.bottom > b.top - pad;
  }

  function acomodar() {
    var vw = window.innerWidth, vh = window.innerHeight, movil = vw <= 480;
    root.classList.toggle('pp-mov', movil);

    var tw = tab.offsetWidth, th = tab.offsetHeight;
    var fr = fab ? fab.getBoundingClientRect() : null;
    if (fr && !fr.width) fr = null;

    // A media altura en escritorio; algo más arriba en móvil (ahí el botón de chat va al centro)
    var top = vh * (movil ? 0.3 : 0.5) - th / 2;
    if (fr && cruza({ left: vw - tw, right: vw, top: top, bottom: top + th }, fr, 8)) {
      top = fr.top - CFG.SEPARACION - th;              // se sube sobre el botón de chat
      if (top < 8) top = fr.bottom + CFG.SEPARACION;   // o se baja si no hay espacio
    }
    top = Math.max(8, Math.min(vh - th - 8, top));
    tab.style.transform = 'translateY(' + Math.round(top) + 'px)';

    // Si la ventana del chat se abre y tocaría la pestaña, la pestaña se esconde y el panel se cierra
    var chatAbierto = win && win.classList.contains('open');
    var tapada = false;
    if (chatAbierto) {
      tapada = cruza({ left: vw - tw, right: vw, top: top, bottom: top + th }, win.getBoundingClientRect(), 0);
      if (abierto) cerrar(true);
    }
    root.classList.toggle('pp-tab-on', !tapada);

    // Panel de escritorio: centrado con la pestaña y siempre por encima del botón de chat
    if (!movil) {
      var ph = panel.offsetHeight;
      var ptop = top + th / 2 - ph / 2;
      var maxBottom = fr ? fr.top - 12 : vh - 8;
      ptop = Math.max(8, Math.min(ptop, maxBottom - ph));
      panel.style.top = Math.round(ptop) + 'px';
    } else {
      panel.style.top = '';
    }
    root.classList.add('pp-listo');
  }

  function pedir() {
    if (agendado) return;
    agendado = true;
    requestAnimationFrame(function () { agendado = false; acomodar(); });
  }

  function enlazar() {
    fab = $('polyplas-fab'); win = $('polyplas-window');
    if (!fab) return false;
    if (window.ResizeObserver) new ResizeObserver(pedir).observe(fab);
    if (window.MutationObserver) {
      var mo = new MutationObserver(pedir);
      mo.observe(fab, { attributes: true, attributeFilter: ['style'] });                 // botón arrastrado (móvil)
      if (win) mo.observe(win, { attributes: true, attributeFilter: ['class'] });        // chat abierto/cerrado
    }
    pedir();
    return true;
  }

  // Oculta el chat FAB y la pestaña cuando el configurador, checkout o carrito están abiertos
  var modalesEnlazados = false;
  function watchModals() {
    var ids = ['configuratorModal', 'checkoutModal', 'cartDrawer'];
    var targets = ids.map(function(id) { return document.getElementById(id); }).filter(Boolean);
    if (!targets.length) return false;

    function sync() {
      var anyOpen = targets.some(function(el) { return el.classList.contains('open'); });
      document.body.classList.toggle('pp-modal-active', anyOpen);
      // Si el chat estaba abierto, cerrarlo para que no quede huérfano
      if (anyOpen && win && win.classList.contains('open')) {
        win.classList.remove('open');
        win.style.height = '';
      }
    }

    if (window.MutationObserver) {
      var mo = new MutationObserver(sync);
      targets.forEach(function(el) {
        mo.observe(el, { attributes: true, attributeFilter: ['class'] });
      });
    }
    sync();
    return true;
  }

  function iniciar() {
    pedir();                                    // la pestaña aparece aunque el chat aún no cargue
    if (!modalesEnlazados && watchModals()) modalesEnlazados = true;
    if (enlazar()) return;
    if (++intentos < CFG.REINTENTOS) setTimeout(iniciar, 500);
  }

  window.addEventListener('resize', pedir, { passive: true });

  // Arranca cuando el navegador está libre, para no competir con la carga de la página
  function arrancar() {
    if (window.requestIdleCallback) window.requestIdleCallback(iniciar, { timeout: 3000 });
    else setTimeout(iniciar, 1500);
  }
  if (document.readyState === 'complete') arrancar();
  else window.addEventListener('load', arrancar, { once: true });
})();
