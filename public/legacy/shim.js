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
  // window.onload asignado tarde
  var onloadDesc = { configurable: true, set: function (fn) {
    if (document.readyState === "complete" && typeof fn === "function") setTimeout(fn, 0);
    else winAdd("load", fn);
  }, get: function () { return null; } };
  try { Object.defineProperty(window, "onload", onloadDesc); } catch (e) {}
})();
