/*
 * Compatibilidad para los scripts heredados de WordPress.
 * En WordPress corrían antes de "DOMContentLoaded"/"load". En Next.js se cargan después,
 * así que si un script se suscribe a esos eventos cuando ya ocurrieron, lo ejecutamos de inmediato.
 */
(function () {
  var docAdd = document.addEventListener.bind(document);
  var winAdd = window.addEventListener.bind(window);
  document.addEventListener = function (type, fn, opts) {
    if (type === "DOMContentLoaded" && document.readyState !== "loading") {
      setTimeout(function () { typeof fn === "function" ? fn.call(document, new Event(type)) : fn.handleEvent(new Event(type)); }, 0);
      return;
    }
    return docAdd(type, fn, opts);
  };
  window.addEventListener = function (type, fn, opts) {
    if (type === "load" && document.readyState === "complete") {
      setTimeout(function () { typeof fn === "function" ? fn.call(window, new Event(type)) : fn.handleEvent(new Event(type)); }, 0);
      return;
    }
    if (type === "DOMContentLoaded" && document.readyState !== "loading") {
      setTimeout(function () { typeof fn === "function" ? fn.call(window, new Event(type)) : fn.handleEvent(new Event(type)); }, 0);
      return;
    }
    return winAdd(type, fn, opts);
  };
  /*
   * SDK pesados de terceros (Supabase): varios módulos lo insertan apenas carga la página.
   * Se retienen hasta que la página terminó de cargar y el navegador está desocupado
   * (normalmente 2 a 4 s). Antes se esperaba la primera interacción del visitante, pero eso
   * hacía que todo el JavaScript pesado corriera justo cuando la persona tocaba la pantalla,
   * y Google lo medía como respuesta lenta (INP sobre 200 ms en móvil).
   * Si la página viene de un pago (/gracias/ o ?pp_pago=, ?orden=, ?auth=) se carga de inmediato.
   */
  var HEAVY = /cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js/;
  var urgent = /^\/gracias(\/|$)/.test(location.pathname) || /[?&](pp_pago|orden|auth)=/.test(location.search);
  window.__ppUrgent = urgent; // lo usan también GTM y el chat

  /*
   * window.__ppWhenIdle(fn): ejecuta fn una sola vez, después del evento "load" y con el
   * navegador desocupado. Lo usan este archivo, GTM (components/LegacyScripts.tsx) y el chat.
   */
  var idleQueue = [], idleDone = false;
  function flushIdle() {
    if (idleDone) return;
    idleDone = true;
    var q = idleQueue; idleQueue = [];
    for (var i = 0; i < q.length; i++) { try { q[i](); } catch (e) {} }
  }
  function scheduleIdle() {
    setTimeout(function () {
      if (window.requestIdleCallback) window.requestIdleCallback(flushIdle, { timeout: 3000 });
      else setTimeout(flushIdle, 500);
    }, 1500);
  }
  if (document.readyState === "complete") scheduleIdle();
  else winAdd("load", scheduleIdle, { once: true });
  setTimeout(flushIdle, 10000); // por si "load" se demora mucho
  window.__ppWhenIdle = function (fn) {
    if (urgent || idleDone) { setTimeout(fn, 0); return; }
    idleQueue.push(fn);
  };

  var awake = urgent, queue = [];
  function wake() {
    if (awake) return;
    awake = true;
    var q = queue; queue = [];
    for (var i = 0; i < q.length; i++) q[i]();
  }
  if (!urgent) {
    window.__ppWhenIdle(wake);
    // Si la persona hace clic antes (carrito, cotizador), se carga en ese momento para que funcione.
    winAdd("click", wake, { once: true, capture: true });
  }
  function hold(parent) {
    if (!parent || parent.__ppHold) return;
    parent.__ppHold = true;
    var orig = parent.appendChild;
    parent.appendChild = function (node) {
      if (!awake && node && node.tagName === "SCRIPT" && HEAVY.test(node.src || "")) {
        queue.push(function () { orig.call(parent, node); });
        return node;
      }
      return orig.call(parent, node);
    };
  }
  hold(document.head);
  if (document.body) hold(document.body);
  else docAdd("DOMContentLoaded", function () { hold(document.body); });

  // window.onload asignado tarde
  var onloadDesc = { configurable: true, set: function (fn) {
    if (document.readyState === "complete" && typeof fn === "function") setTimeout(fn, 0);
    else winAdd("load", fn);
  }, get: function () { return null; } };
  try { Object.defineProperty(window, "onload", onloadDesc); } catch (e) {}
})();
