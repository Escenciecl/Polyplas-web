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
   * Se retiene hasta la primera interacción del visitante (o 12 s) para no frenar la carga.
   * Si la página viene de un pago (/gracias/ o ?pp_pago=, ?orden=, ?auth=) se carga de inmediato.
   */
  var HEAVY = /cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js/;
  var urgent = /^\/gracias(\/|$)/.test(location.pathname) || /[?&](pp_pago|orden|auth)=/.test(location.search);
  window.__ppUrgent = urgent; // lo usan también GTM y el chat
  var awake = urgent, queue = [];
  function wake() {
    if (awake) return;
    awake = true;
    var q = queue; queue = [];
    for (var i = 0; i < q.length; i++) q[i]();
  }
  if (!urgent) {
    ["pointerdown", "touchstart", "keydown", "scroll", "mousemove"].forEach(function (ev) {
      winAdd(ev, wake, { once: true, passive: true, capture: true });
    });
    setTimeout(wake, 12000);
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
