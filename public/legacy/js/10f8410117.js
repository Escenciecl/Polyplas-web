(function () {

  function checkPaymentResult() {
    var params = new URLSearchParams(window.location.search);
    var pago   = params.get('pp_pago');
    if (!pago) return; // No hay resultado de pago: el bloque permanece oculto

    // Mostrar overlay a pantalla completa
    document.getElementById('ppG-wrap').style.display = 'block';

    if (pago === 'aprobado') {
      var monto = parseInt(params.get('monto') || '0');
      document.getElementById('ppG-ok').style.display = 'block';
      document.getElementById('ppG-orden').textContent = params.get('orden') || '—';
      document.getElementById('ppG-monto').textContent = '$ ' + monto.toLocaleString('es-CL');
      document.getElementById('ppG-auth').textContent  = params.get('auth')  || '—';
      window.history.replaceState({}, '', window.location.pathname + '#gracias');

      // ── GTM / dataLayer — evento purchase ──
      try {
        var _dlItems = JSON.parse(
          sessionStorage.getItem('pp_cart_dl') ||
          sessionStorage.getItem('pp_tinas_cart_dl') ||
          sessionStorage.getItem('pp_pet_cart_dl') ||
          sessionStorage.getItem('pp_petg_cart_dl') ||
          sessionStorage.getItem('pp_cupulas_cart_dl') ||
          sessionStorage.getItem('pp_recep_cart_dl') ||
          sessionStorage.getItem('pp_pc_cart_dl') || '[]'
        );
        var _dlTotal = parseInt(
          sessionStorage.getItem('pp_total_dl') ||
          sessionStorage.getItem('pp_tinas_total_dl') ||
          sessionStorage.getItem('pp_pet_total_dl') ||
          sessionStorage.getItem('pp_petg_total_dl') ||
          sessionStorage.getItem('pp_cupulas_total_dl') ||
          sessionStorage.getItem('pp_recep_total_dl') ||
          sessionStorage.getItem('pp_pc_total_dl') || String(monto)
        );
        sessionStorage.removeItem('pp_cart_dl');
        sessionStorage.removeItem('pp_total_dl');
        sessionStorage.removeItem('pp_tinas_cart_dl');
        sessionStorage.removeItem('pp_tinas_total_dl');
        sessionStorage.removeItem('pp_pet_cart_dl');
        sessionStorage.removeItem('pp_pet_total_dl');
        sessionStorage.removeItem('pp_petg_cart_dl');
        sessionStorage.removeItem('pp_petg_total_dl');
        sessionStorage.removeItem('pp_cupulas_cart_dl');
        sessionStorage.removeItem('pp_cupulas_total_dl');
        sessionStorage.removeItem('pp_recep_cart_dl');
        sessionStorage.removeItem('pp_recep_total_dl');
        sessionStorage.removeItem('pp_pc_cart_dl');
        sessionStorage.removeItem('pp_pc_total_dl');
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({ ecommerce: null });
        window.dataLayer.push({
          event:     'purchase',
          ecommerce: {
            transaction_id: params.get('orden') || '',
            currency:       'CLP',
            value:          _dlTotal || monto,
            items:          _dlItems
          }
        });
      } catch(e) {}

      // ── Limpiar sessionStorage (el CRM ya fue registrado por el servidor PHP) ──
      (function () {
        try {
          var _od = JSON.parse(
            sessionStorage.getItem('pp_acrilico_order_data') ||
            sessionStorage.getItem('pp_pet_order_data') ||
            sessionStorage.getItem('pp_petg_order_data') ||
            sessionStorage.getItem('pp_tinas_order_data') ||
            sessionStorage.getItem('pp_cupulas_order_data') ||
            sessionStorage.getItem('pp_recep_order_data') ||
            sessionStorage.getItem('pp_pc_order_data') || 'null'
          );
          sessionStorage.removeItem('pp_acrilico_order_data');
          sessionStorage.removeItem('pp_pet_order_data');
          sessionStorage.removeItem('pp_petg_order_data');
          sessionStorage.removeItem('pp_tinas_order_data');
          sessionStorage.removeItem('pp_cupulas_order_data');
          sessionStorage.removeItem('pp_recep_order_data');
          sessionStorage.removeItem('pp_pc_order_data');
          if (_od) {
            fetch('https://script.google.com/macros/s/AKfycbw4WkE3slUjbDIUrbYVZD-aL1nB6WWJeyj6XG6rpFNz9p3pSFfdmUd3FjY_hV-QQJNkKA/exec?' + new URLSearchParams({
              accion:        'pedido_web',
              idRef:         _od.shortId,
              nombre:        _od.client.nombre || _od.client.razon || '',
              email:         _od.client.email  || '',
              telefono:      _od.client.tel    || '',
              monto:         String(_od.total),
              vendido:       'Sí',
              observaciones: _od.resumen + ' | Entrega:' + _od.entregaLabel
            }).toString(), { mode: 'no-cors' });
          }
        } catch (e) {}
      })();

    } else {
      // Pago rechazado o cancelado
      document.getElementById('ppG-fail').style.display = 'block';
      if (pago === 'cancelado') {
        document.getElementById('ppG-fail-msg').textContent =
          'Cancelaste el proceso de pago. Puedes volver a intentarlo cuando quieras.';
      }
      window.history.replaceState({}, '', window.location.pathname);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkPaymentResult);
  } else {
    checkPaymentResult();
  }

})();
