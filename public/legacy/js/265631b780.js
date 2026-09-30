(function() {
  if (window.POLYPLAS_LOADED) return;
  window.POLYPLAS_LOADED = true;

  try {

  function loadSupabaseAndInit() {
    if (window.supabase) { init(); return; }
    var s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    s.onload  = function() { init(); };
    s.onerror = function() {
      console.error('Polyplas: no se pudo cargar el SDK de Supabase — el chat abrirá sin guardar datos');
      init();
    };
    document.head.appendChild(s);
  }

  function init() {
    // ── Referencias al DOM ────────────────────────────────
    var fab    = document.getElementById('polyplas-fab');
    var win    = document.getElementById('polyplas-window');
    var close  = document.getElementById('polyplas-close');
    var input  = document.getElementById('polyplas-input');
    var send   = document.getElementById('polyplas-send');

    if (!fab || !win) { console.error('Polyplas: elementos no encontrados'); return; }

    // ── Dependencias ──────────────────────────────────────
    var cfg = window.POLYPLAS_CONFIG;
    if (!cfg) { console.error('Polyplas: falta POLYPLAS_CONFIG'); return; }

    var sb = null;
    if (window.supabase) {
      sb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
    } else {
      console.error('Polyplas: Supabase SDK no cargado — el chat abrirá pero no podrá guardar datos');
    }

    // ── Estado ────────────────────────────────────────────
    var conversationId    = null;
    var messageChannel    = null;
    var chatState         = null;
    var pending           = {};
    var pendingHistory    = []; // acumula mensajes del bot hasta que exista conversationId
    var officeOpenAtStart = true;
    var statusAtStart     = 'open';
    var intentosContacto  = 0;

    // ── Eventos: click del botón y cerrar ─────────────────
    // IMPORTANTE: registrar listeners ANTES de cualquier verificación de dependencias
    fab.addEventListener('click', toggle);
    close.addEventListener('click', toggle);
    send.addEventListener('click', sendMessage);
    input.addEventListener('keydown', function(e) { if (e.key === 'Enter') sendMessage(); });

    // ── Botón arrastrable en móvil ────────────────────────
    (function() {
      if (window.innerWidth > 480) return;
      var MARGIN = 16, startT = null, fabStart = null, dragged = false;

      function applyPos(top, left, animate) {
        fab.style.transition = animate
          ? 'top .22s cubic-bezier(.22,1,.36,1),left .22s cubic-bezier(.22,1,.36,1)'
          : 'none';
        // setProperty con 'important' para ganarle al CSS aunque tenga !important
        fab.style.setProperty('top',       top + 'px', 'important');
        fab.style.setProperty('left',      left + 'px', 'important');
        fab.style.setProperty('bottom',    'auto', 'important');
        fab.style.setProperty('right',     'auto', 'important');
        fab.style.setProperty('transform', 'none', 'important');
      }

      function clamp(top, left) {
        var W = fab.offsetWidth || 140, H = fab.offsetHeight || 52;
        var vw = window.innerWidth, vh = window.innerHeight;
        return {
          top:  Math.max(MARGIN, Math.min(vh - H - MARGIN, top)),
          left: Math.max(MARGIN, Math.min(vw - W - MARGIN, left))
        };
      }

      // Restaurar posición guardada
      try {
        var sv = JSON.parse(localStorage.getItem('pp_fab_pos') || 'null');
        if (sv && typeof sv.top === 'number') {
          var p0 = clamp(sv.top, sv.left);
          applyPos(p0.top, p0.left, false);
        }
      } catch(e) {}

      function onMove(e) {
        if (!startT) return;
        var t = e.touches[0];
        var dx = t.clientX - startT.x, dy = t.clientY - startT.y;
        if (!dragged && Math.hypot(dx, dy) < 12) return;
        dragged = true;
        e.preventDefault();
        var p = clamp(fabStart.top + dy, fabStart.left + dx);
        applyPos(p.top, p.left, false);
      }

      function onEnd(e) {
        document.removeEventListener('touchmove', onMove);
        document.removeEventListener('touchend', onEnd);
        if (!dragged) {
          startT = null;
          e.preventDefault(); // evitar doble-disparo con el click sintético
          toggle();            // llamar toggle directamente en vez de depender del click
          return;
        }
        e.preventDefault(); // evita el click posterior al drag
        var rect = fab.getBoundingClientRect();
        var vw = window.innerWidth, W = fab.offsetWidth;
        // Anclar al borde más cercano
        var snapLeft = (rect.left + W / 2) < vw / 2;
        var p = clamp(rect.top, snapLeft ? MARGIN : vw - W - MARGIN);
        applyPos(p.top, p.left, true);
        try { localStorage.setItem('pp_fab_pos', JSON.stringify({ top: p.top, left: p.left })); } catch(err) {}
        startT = null;
        setTimeout(function() { dragged = false; }, 50);
      }

      fab.addEventListener('touchstart', function(e) {
        var t = e.touches[0], rect = fab.getBoundingClientRect();
        startT = { x: t.clientX, y: t.clientY };
        fabStart = { top: rect.top, left: rect.left };
        dragged = false;
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('touchend',  onEnd,  { passive: false });
      }, { passive: true });
    })();

    // ── iOS: ajustar altura cuando el teclado virtual sube ─
    // visualViewport.height refleja el área visible real (excluyendo el teclado)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', function() {
        if (win.classList.contains('open')) {
          win.style.height = window.visualViewport.height + 'px';
          var msgs = document.getElementById('polyplas-messages');
          if (msgs) msgs.scrollTop = msgs.scrollHeight;
        }
      });
    }

    // ── Scroll al foco del input en móvil ─────────────────
    input.addEventListener('focus', function() {
      setTimeout(function() {
        var msgs = document.getElementById('polyplas-messages');
        if (msgs) msgs.scrollTop = msgs.scrollHeight;
      }, 350);
    });

    // ── Helpers ───────────────────────────────────────────
    function esc(s) {
      return String(s || '').replace(/[&<>"']/g, function(c) {
        return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
      });
    }

    function now() { return new Date().toISOString(); }

    function renderMessage(m) {
      var container = document.getElementById('polyplas-messages');
      var div = document.createElement('div');
      div.className = 'polyplas-msg ' + m.sender;
      var time = new Date(m.created_at).toLocaleTimeString('es-CL', {hour:'2-digit', minute:'2-digit'});
      div.innerHTML = esc(m.content) + '<span class="time">' + time + '</span>';
      container.appendChild(div);
      container.scrollTop = container.scrollHeight;
    }

    function botSay(text, delay) {
      return new Promise(function(resolve) {
        var container = document.getElementById('polyplas-messages');

        // Pausa que simula que Maca leyó el mensaje antes de responder
        var readPause = (delay !== undefined ? delay : 750 + Math.floor(Math.random() * 350));

        setTimeout(function() {
          // "Leído ✓" aparece justo cuando el bot empieza a responder
          var clientMsgs = container.querySelectorAll('.polyplas-msg.client');
          if (clientMsgs.length > 0) {
            var lastClient = clientMsgs[clientMsgs.length - 1];
            if (!lastClient.querySelector('.read-receipt')) {
              var receipt = document.createElement('span');
              receipt.className = 'read-receipt';
              receipt.textContent = 'Leído ✓';
              lastClient.appendChild(receipt);
            }
          }

          var typing = document.createElement('div');
          typing.className = 'polyplas-msg agent pp-typing';
          typing.innerHTML = '<span></span><span></span><span></span>';
          container.appendChild(typing);
          container.scrollTop = container.scrollHeight;

          // Tiempo de escritura proporcional al largo del mensaje, con tope natural
          var typingTime = Math.min(900 + text.length * 20, 2100);

          setTimeout(function() {
            typing.remove();
            renderMessage({ sender: 'agent', content: text, created_at: now() });
            resolve();
          }, typingTime);
        }, readPause);
      });
    }

    function setPlaceholder(text) {
      input.placeholder = text;
    }

    function showCtaBubble() {
      var container = document.getElementById('polyplas-messages');

      // Botón: comprar planchas de acrílico
      var btnAcrilico = document.createElement('a');
      btnAcrilico.href = 'https://polyplas.cl/categoria-producto/planchas-acrilico/';
      btnAcrilico.target = '_blank';
      btnAcrilico.className = 'pp-cta-bubble';
      btnAcrilico.innerHTML = '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg> Comprar Planchas de Acrílico';
      container.appendChild(btnAcrilico);

      // Botón: comprar tinas de hidromasaje
      var btnTinas = document.createElement('a');
      btnTinas.href = 'https://polyplas.cl/categoria-producto/tinas-de-hidromasaje/';
      btnTinas.target = '_blank';
      btnTinas.className = 'pp-cta-bubble';
      btnTinas.innerHTML = '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg> Comprar Tinas de Hidromasaje';
      container.appendChild(btnTinas);

      // Botón secundario: prefiero dejar mi número
      var btnPhone = document.createElement('button');
      btnPhone.className = 'pp-cta-bubble pp-cta-secondary';
      btnPhone.style.cssText = 'border:1px solid #e5e7eb; cursor:pointer; width:100%; background:transparent; font-family:inherit;';
      btnPhone.innerHTML = '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:15px;height:15px;flex-shrink:0"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg> Prefiero dejar mi número';
      btnPhone.addEventListener('click', function() {
        var ctas = container.querySelectorAll('.pp-cta-bubble');
        ctas.forEach(function(c) { c.remove(); });
        document.getElementById('polyplas-input-area').style.display = '';
        chatState = 'ask_phone_lunch';
        var askPhoneMsg = statusAtStart === 'lunch'
          ? '¡Claro! ¿Me dejas tu WhatsApp? Así te contacto apenas vuelva del almuerzo.'
          : statusAtStart === 'before'
          ? '¡Claro! ¿Me dejas tu WhatsApp? Así te contacto apenas abramos a las 9:00 AM.'
          : statusAtStart === 'after'
          ? '¡Claro! ¿Me dejas tu WhatsApp? Así te contacto mañana a las 9:00 AM.'
          : '¡Claro! ¿Me dejas tu WhatsApp? Así te contacto el lunes a las 9:00 AM.';
        pendingHistory.push({ sender: 'agent', content: askPhoneMsg });
        botSay(askPhoneMsg, 300);
        setPlaceholder('+56 9...');
      });
      container.appendChild(btnPhone);
      container.scrollTop = container.scrollHeight;
    }

    function esPaginaTienda() {
      return /\/categoria-producto\/(planchas-acrilico|tinas-de-hidromasaje)\//i.test(window.location.pathname);
    }

    // ── Detección de intención durante el flujo de datos ──
    // Retorna un mensaje de redirección si el texto es una intención, o null si es un dato válido
    function detectarIntencion(text, paso) {
      var t = text.trim().toLowerCase();
      var intenciones = [
        { re: /cotiz|proforma|presupuest/i,                label: 'tu cotización' },
        { re: /preci|cu[aá]nto (cuesta|vale|sale|cobran)|valor|tarifa/i, label: 'los precios' },
        { re: /comprar?|adquirir|pedir|encargar|ordenar/i, label: 'tu pedido' },
        { re: /consult|informaci[oó]n|saber|ayuda|info/i,  label: 'tu consulta' },
        { re: /direcci[oó]n|d[oó]nde est[aá]n|ubicaci[oó]n|local/i, label: 'la dirección' },
        { re: /stock|disponib|tienen|hay /i,               label: 'la disponibilidad' },
        { re: /transfer|pago|cuenta|banco|rut/i,           label: 'los datos de pago' }
      ];
      for (var i = 0; i < intenciones.length; i++) {
        if (intenciones[i].re.test(t)) {
          var label = intenciones[i].label;
          if (paso === 'nombre') return '¡Claro, con gusto te ayudo con ' + label + '! Para continuar, ¿me dices tu nombre?';
          if (paso === 'email')  return '¡Perfecto! Para enviarte la información sobre ' + label + ' necesito tu email. ¿Cuál es?';
          if (paso === 'phone')  return '¡Entendido! Solo falta tu número de WhatsApp o teléfono y Maca te contacta para ' + label + '.';
        }
      }
      return null;
    }

    // ── Clasificación de la consulta inicial ──────────────
    // Devuelve una etiqueta limpia para el panel de gestión
    function clasificarConsulta(text) {
      var t = text.toLowerCase();
      if (/cotiz|proforma|presupuest/.test(t))                              return 'cotizacion';
      if (/preci|cu[aá]nto (cuesta|vale|sale|cobran)|valor|tarifa/.test(t)) return 'precio';
      if (/stock|disponib|tienen|hay /.test(t))                             return 'stock';
      if (/comprar?|adquirir|pedir|encargar|ordenar/.test(t))               return 'compra';
      if (/transfer|pago|cuenta|banco|rut/.test(t))                         return 'pago';
      if (/direcci[oó]n|d[oó]nde est[aá]n|ubicaci[oó]n|local/.test(t))     return 'direccion';
      if (/horario|atienden|abren|cierran|qu[eé] hora|cu[aá]ndo abren|d[ií]as de atenci[oó]n/.test(t)) return 'horario';
      return 'consulta';
    }

    // ── Validación de teléfono chileno ────────────────────
    function validarTelefono(raw) {
      var clean = raw.replace(/[\s\-().]/g, ''); // quitar espacios, guiones, paréntesis, puntos
      if (/^\+56/.test(clean)) return clean.length === 12; // +56XXXXXXXXX  (ej: +56912345678)
      if (/^56/.test(clean))   return clean.length === 11; // 56XXXXXXXXX   (ej: 56912345678)
      if (/^9/.test(clean))    return clean.length === 9;  // 9XXXXXXXX     (ej: 912345678)
      if (/^22/.test(clean))   return clean.length === 9;  // 22XXXXXXX     (ej: 221234567)
      return false;
    }

    // ── Helper central de horario (Santiago GMT-3) ───────
    // Retorna: 'open' | 'lunch' | 'before' | 'after' | 'weekend'
    // TEST: agrega ?ppStatus=open (o lunch/after/before/weekend) a la URL para forzar un estado
    function getStgStatus() {
      var testStatus = new URLSearchParams(window.location.search).get('ppStatus');
      if (testStatus && ['open','lunch','after','before','weekend'].indexOf(testStatus) !== -1) return testStatus;
      // Usa la zona horaria oficial de Santiago — siempre correcto, con o sin DST
      var parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Santiago',
        weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false
      }).formatToParts(new Date()).reduce(function(a, p) { a[p.type] = p.value; return a; }, {});
      var day  = {Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6}[parts.weekday];
      var mins = (parseInt(parts.hour, 10) % 24) * 60 + parseInt(parts.minute, 10);
      var isFri = day === 5;
      var isWkd = day === 0 || day === 6;
      if (isWkd || (isFri && mins >= 17 * 60))          return 'weekend';
      if (!isFri && day >= 1 && mins >= 18 * 60)         return 'after';
      if (mins < 9 * 60)                                 return 'before';
      if (mins >= 13 * 60 + 30 && mins < 14 * 60 + 15)  return 'lunch';
      return 'open';
    }

    // ── Estado del header según horario ──────────────────
    function updateHeaderStatus() {
      var el = document.getElementById('polyplas-status');
      if (!el) return;
      var s = getStgStatus();
      var map = {
        open:    { text: 'Maca en local · Responde en menos de 5 min', cls: 'status-online'  },
        lunch:   { text: 'Almuerzo · Vuelve a las 14:15 hrs',   cls: 'status-away'    },
        before:  { text: 'Sin atención · Abre a las 9:00 AM',   cls: 'status-offline' },
        after:   { text: 'Sin atención · Vuelve mañana 9:00',   cls: 'status-offline' },
        weekend: { text: 'Sin atención · Vuelve el lunes 9:00', cls: 'status-offline' }
      };
      el.textContent = map[s].text;
      el.className   = map[s].cls;
    }

    // ── Toggle ventana ────────────────────────────────────
    function toggle() {
      win.classList.toggle('open');
      if (!win.classList.contains('open')) {
        win.style.height = ''; // reset inline height set by visualViewport handler
        return;
      }

      updateHeaderStatus();

      if (conversationId) {
        loadExistingChat();
      } else if (!chatState) {
        startFlow();
      }
    }

    // ── Flujo de bienvenida ───────────────────────────────
    function startFlow() {
      document.getElementById('polyplas-chat').classList.add('active');
      var status = getStgStatus();
      officeOpenAtStart = (status === 'open');
      statusAtStart     = status;
      chatState = 'ask_query';


      var offlineGreetings = {
        weekend: 'Hola, soy Maca de Polyplas. Hoy estamos descansando y volvemos el lunes a las 9:00 AM. Si compras online ahora, el lunes a las 9:00 AM gestiono tu pedido de inmediato.',
        after:   'Hola, soy Maca de Polyplas. Por hoy ya terminé mi jornada y vuelvo mañana a las 9:00 AM. Si compras online ahora, mañana a las 9:00 AM gestiono tu pedido de inmediato.',
        lunch:   'Hola, soy Maca de Polyplas. Estoy en almuerzo y vuelvo a las 14:15 hrs. Si compras online ahora, a las 14:15 gestiono tu pedido.',
        before:  'Hola, soy Maca de Polyplas. Aún no hemos abierto, abrimos a las 9:00 AM. Si compras online ahora, a las 9:00 AM gestiono tu pedido de inmediato.'
      };

      setTimeout(function() {
        var welcomeMsg = officeOpenAtStart
          ? 'Hola, te habla Maca de Polyplas. Dime, ¿en qué te puedo ayudar?'
          : (offlineGreetings[status] || offlineGreetings['weekend']);
        pendingHistory.push({ sender: 'agent', content: welcomeMsg });
        // Primer mensaje: typing corto sin pausa de lectura (no hay mensaje del cliente aún)
        var container = document.getElementById('polyplas-messages');
        var typing = document.createElement('div');
        typing.className = 'polyplas-msg agent pp-typing';
        typing.innerHTML = '<span></span><span></span><span></span>';
        container.appendChild(typing);
        setTimeout(function() {
          typing.remove();
          renderMessage({ sender: 'agent', content: welcomeMsg, created_at: now() });
          setPlaceholder('Cuéntame tu consulta...');
          if (!officeOpenAtStart) {
            document.getElementById('polyplas-input-area').style.display = 'none';
            showCtaBubble();
          }
        }, 600);
      }, 300);
    }

    // ── Envío de mensajes ─────────────────────────────────
    async function sendMessage() {
      var text = input.value.trim();
      if (!text || chatState === 'creating') return;
      input.value = '';

      // Capturar nombre del formulario de la página si aún no está en pending
      if (!pending.name) {
        var pfn = document.getElementById('polyplas-name');
        if (pfn && pfn.value.trim()) pending.name = pfn.value.trim();
      }

      // ── Interceptor de palabras clave (cualquier estado) ──────────────
      var autoText = '';
      if (/direcci[oó]n|ubicaci[oó]n|d[oó]nde (est[aá]n?|quedan?|se ubican?)|c[oó]mo llegar|mapa|local/i.test(text)) {
        autoText = 'Estamos en Santiago Concha 1525, Santiago, Región Metropolitana. Puedes ver la ubicación aquí: https://maps.google.com/?q=-33.465282,-70.638817';
      } else if (/horario|atienden|abren|cierran|qu[eé] hora|cu[aá]ndo abren|d[ií]as de atenci[oó]n/i.test(text)) {
        autoText = 'Nuestro horario de atención es lunes a viernes, de 9:00 a 18:00 hrs.';
      }
      if (autoText) {
        renderMessage({ sender: 'client', content: text, created_at: now() });
        await botSay(autoText);
        // Si es la primera consulta, responder y continuar el flujo normal
        if (chatState === 'ask_query') {
          pending.query  = text;
          pending.intent = clasificarConsulta(text);
          pendingHistory.push({ sender: 'client', content: text });
          pendingHistory.push({ sender: 'agent',  content: autoText });
          if (statusAtStart === 'lunch' || statusAtStart === 'before' || statusAtStart === 'after' || statusAtStart === 'weekend') {
            chatState = 'ask_phone_lunch';
            var pedirWspAuto = statusAtStart === 'lunch'
              ? '¿Me dejas tu WhatsApp? Así te contacto apenas vuelva del almuerzo.'
              : statusAtStart === 'before'
              ? '¿Me dejas tu WhatsApp? Así te contacto apenas abramos a las 9:00 AM.'
              : statusAtStart === 'after'
              ? '¿Me dejas tu WhatsApp? Así te contacto mañana a las 9:00 AM.'
              : '¿Me dejas tu WhatsApp? Así te contacto el lunes a las 9:00 AM.';
            pendingHistory.push({ sender: 'agent', content: pedirWspAuto });
            await botSay(pedirWspAuto);
            setPlaceholder('+56 9...');
          } else {
            chatState = 'ask_name';
            var askNameAfterAuto = 'Mientras reviso tu consulta, ¿me dices tu nombre para saber con quién hablo?';
            pendingHistory.push({ sender: 'agent', content: askNameAfterAuto });
            await botSay(askNameAfterAuto);
            setPlaceholder('Tu nombre...');
          }
        }
        return;
      }

      if (chatState === 'ask_query') {
        renderMessage({ sender: 'client', content: text, created_at: now() });
        pending.query  = text;
        pending.intent = clasificarConsulta(text);
        pendingHistory.push({ sender: 'client', content: text });

        if (statusAtStart === 'lunch' || statusAtStart === 'before' || statusAtStart === 'after' || statusAtStart === 'weekend') {
          // Intentar capturar nombre del primer mensaje sin preguntarlo de nuevo
          if (!pending.name) {
            var sinTelTemp = text.replace(/[\+\d][\d\s\-()+.]{5,}/g, '').replace(/\s+/g, ' ').trim();
            var matchNombre = sinTelTemp.match(/(?:soy|me llamo|llaman?)\s+([A-ZÁÉÍÓÚÑa-záéíóúñ][a-záéíóúñA-ZÁÉÍÓÚÑ]{1,})/i)
                           || sinTelTemp.match(/^([A-ZÁÉÍÓÚÑ][a-záéíóúñ]{1,})(?:\s|,|$)/);
            if (matchNombre && matchNombre[1]) pending.name = matchNombre[1];
          }
          var phoneRawLunch = text.match(/[\+\d][\d\s\-()+.]{5,}/);
          var phoneLunch = '';
          if (phoneRawLunch && validarTelefono(phoneRawLunch[0].trim())) phoneLunch = phoneRawLunch[0].trim();
          var intentoPhoneLunch = !!phoneRawLunch;
          if (phoneLunch) {
            pending.phone = phoneLunch;
            var cleanLunch = phoneLunch.replace(/[\s\-()]/g, '');
            if (/^(22|((\+?56)?22))/.test(cleanLunch)) {
              chatState = 'ask_email';
              var askEmailLunch0 = statusAtStart === 'lunch'
                ? 'Como es número fijo, dame tu correo para poder contactarte cuando vuelva.'
                : statusAtStart === 'before'
                ? 'Como es número fijo, dame tu correo para poder contactarte cuando abramos a las 9:00 AM.'
                : statusAtStart === 'after'
                ? 'Como es número fijo, dame tu correo para poder contactarte mañana a las 9:00 AM.'
                : 'Como es número fijo, dame tu correo para poder contactarte el lunes a las 9:00 AM.';
              pendingHistory.push({ sender: 'agent', content: askEmailLunch0 });
              await botSay(askEmailLunch0, 600);
              setPlaceholder('tu@correo.com...');
            } else {
              var _n1 = (document.getElementById('polyplas-name') && document.getElementById('polyplas-name').value.trim()) || pending.name || '';
              var graciasMsg = (_n1 ? 'Gracias, ' + _n1 + ',' : 'Gracias,') + ' estamos hablando.';
              pendingHistory.push({ sender: 'agent', content: graciasMsg });
              await botSay(graciasMsg, 600);
              chatState = 'creating';
              await createConversation();
            }
          } else if (intentoPhoneLunch) {
            chatState = 'ask_phone_lunch';
            var msgNumMal = (statusAtStart === 'before' || statusAtStart === 'after' || statusAtStart === 'weekend')
              ? 'Ese número no es válido. Los formatos aceptados son: +56930997983, 56930997983 o 930997983. ¿Lo intentas de nuevo?'
              : 'No reconocí ese número. Ingrésalo así: +56 9 1234 5678.';
            pendingHistory.push({ sender: 'agent', content: msgNumMal });
            await botSay(msgNumMal, 600);
            setPlaceholder('+56 9...');
          } else {
            chatState = 'ask_phone_lunch';
            var pedirWsp = statusAtStart === 'lunch'
              ? '¿Me dejas tu WhatsApp? Así te contacto apenas vuelva del almuerzo.'
              : statusAtStart === 'before'
              ? '¿Me dejas tu WhatsApp? Así te contacto apenas abramos a las 9:00 AM.'
              : statusAtStart === 'after'
              ? '¿Me dejas tu WhatsApp? Así te contacto mañana a las 9:00 AM.'
              : '¿Me dejas tu WhatsApp? Así te contacto el lunes a las 9:00 AM.';
            pendingHistory.push({ sender: 'agent', content: pedirWsp });
            await botSay(pedirWsp, 600);
            setPlaceholder('+56 9...');
          }
        } else {
          chatState = 'ask_name';
          var askNameMsg = 'Mientras reviso tu consulta, ¿me dices tu nombre para saber con quién hablo?';
          pendingHistory.push({ sender: 'agent', content: askNameMsg });
          await botSay(askNameMsg, 600);
          setPlaceholder('Tu nombre...');
        }
        return;
      }

      if (chatState === 'ask_phone_lunch') {
        renderMessage({ sender: 'client', content: text, created_at: now() });
        var phoneRawL = text.match(/[\+\d][\d\s\-()+.]{5,}/);
        var phoneFoundL = '';
        if (phoneRawL && validarTelefono(phoneRawL[0].trim())) phoneFoundL = phoneRawL[0].trim();
        if (phoneFoundL) {
          pending.phone = phoneFoundL;
          pendingHistory.push({ sender: 'client', content: text });
          intentosContacto = 0;
          var cleanL = phoneFoundL.replace(/[\s\-()]/g, '');
          if (/^(22|((\+?56)?22))/.test(cleanL)) {
            chatState = 'ask_email';
            var askEmailLunch = statusAtStart === 'lunch'
              ? 'Como es número fijo, dame tu correo para poder contactarte cuando vuelva.'
              : statusAtStart === 'before'
              ? 'Como es número fijo, dame tu correo para poder contactarte cuando abramos a las 9:00 AM.'
              : statusAtStart === 'after'
              ? 'Como es número fijo, dame tu correo para poder contactarte mañana a las 9:00 AM.'
              : 'Como es número fijo, dame tu correo para poder contactarte el lunes a las 9:00 AM.';
            pendingHistory.push({ sender: 'agent', content: askEmailLunch });
            await botSay(askEmailLunch);
            setPlaceholder('tu@correo.com...');
          } else {
            var _n2 = (document.getElementById('polyplas-name') && document.getElementById('polyplas-name').value.trim()) || pending.name || '';
            var graciasMsg2 = (_n2 ? 'Gracias, ' + _n2 + ',' : 'Gracias,') + ' estamos hablando.';
            pendingHistory.push({ sender: 'agent', content: graciasMsg2 });
            await botSay(graciasMsg2);
            chatState = 'creating';
            await createConversation();
          }
          return;
        }
        intentosContacto++;
        if (intentosContacto >= 2) {
          pendingHistory.push({ sender: 'client', content: text });
          intentosContacto = 0;
          chatState = 'creating';
          await createConversation();
          return;
        }
        var msgNumInvalido = (statusAtStart === 'before' || statusAtStart === 'after' || statusAtStart === 'weekend')
          ? 'Ese número no es válido. Los formatos aceptados son: +56930997983, 56930997983 o 930997983. ¿Lo intentas de nuevo?'
          : 'No reconocí ese número. Ingrésalo así: +56 9 1234 5678.';
        await botSay(msgNumInvalido);
        setPlaceholder('+56 9...');
        return;
      }

      if (chatState === 'ask_name') {
        renderMessage({ sender: 'client', content: text, created_at: now() });
        var nombreLimpio = text.trim();
        // Primero detectar si es una intención en vez de un nombre
        var msgIntencion = detectarIntencion(nombreLimpio, 'nombre');
        if (msgIntencion) {
          await botSay(msgIntencion, 400);
          return;
        }
        var esNombreInvalido =
          /^[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]+$/.test(nombreLimpio) ||
          /^(hola|holi|buenas|buen\s?d[ií]a|saludos|hey|hi|hello|ola|k tal|q tal)/i.test(nombreLimpio) ||
          nombreLimpio.length < 2;
        if (esNombreInvalido) {
          await botSay('Uy, no llegó bien el nombre. ¿Me lo escribes de nuevo para asegurarme de que te llegue todo correcto?', 400);
          return;
        }
        pending.name = nombreLimpio;
        chatState = 'ask_contact';
        pendingHistory.push({ sender: 'client', content: nombreLimpio });
        var askContactMsg = '¡Mucho gusto ' + nombreLimpio + '! Dame tu WhatsApp por si se cierra esta conversación y así no perdemos el contacto.';
        pendingHistory.push({ sender: 'agent', content: askContactMsg });
        await botSay(askContactMsg, 500);
        setPlaceholder('+56 9...');
        return;
      }

      if (chatState === 'ask_contact') {
        renderMessage({ sender: 'client', content: text, created_at: now() });

        var phoneRawMatch = text.match(/[\+\d][\d\s\-()+.]{5,}/);
        var phoneFound = '';
        if (phoneRawMatch && validarTelefono(phoneRawMatch[0].trim())) phoneFound = phoneRawMatch[0].trim();

        if (phoneFound) {
          pending.phone = phoneFound;
          pendingHistory.push({ sender: 'client', content: text });
          var cleanPhone = phoneFound.replace(/[\s\-()]/g, '');
          var esLandline = /^(22|((\+?56)?22))/.test(cleanPhone);
          if (esLandline) {
            chatState = 'ask_email';
            var askEmailMsg = 'Entendido, ' + pending.name + '. Como es número fijo, dame también tu correo por si necesito contactarte por ahí.';
            pendingHistory.push({ sender: 'agent', content: askEmailMsg });
            await botSay(askEmailMsg);
            setPlaceholder('tu@correo.com...');
          } else {
            intentosContacto = 0;
            chatState = 'creating';
            await createConversation();
          }
          return;
        }

        intentosContacto++;
        if (intentosContacto >= 3) {
          pendingHistory.push({ sender: 'client', content: text });
          intentosContacto = 0;
          chatState = 'creating';
          await createConversation();
          return;
        }

        await botSay('Ese número no parece ser un WhatsApp chileno válido. Ingrésalo así: +56 9 1234 5678.');
        setPlaceholder('+56 9...');
        return;
      }

      if (chatState === 'ask_email') {
        renderMessage({ sender: 'client', content: text, created_at: now() });

        var emailMatch = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
        var emailFound = '';
        if (emailMatch) {
          var em = emailMatch[0];
          if (!(/\.\./.test(em)) && em.indexOf('@') === em.lastIndexOf('@')) emailFound = em;
        }

        if (emailFound) {
          pending.email = emailFound;
          pendingHistory.push({ sender: 'client', content: text });
          intentosContacto = 0;
          if (statusAtStart === 'lunch' || statusAtStart === 'before' || statusAtStart === 'after' || statusAtStart === 'weekend') {
            var _n3 = (document.getElementById('polyplas-name') && document.getElementById('polyplas-name').value.trim()) || pending.name || '';
            var graciasMail = (_n3 ? 'Gracias, ' + _n3 + ',' : 'Gracias,') + ' estamos hablando.';
            pendingHistory.push({ sender: 'agent', content: graciasMail });
            await botSay(graciasMail);
          }
          chatState = 'creating';
          await createConversation();
          return;
        }

        intentosContacto++;
        if (intentosContacto >= 3) {
          pendingHistory.push({ sender: 'client', content: text });
          intentosContacto = 0;
          chatState = 'creating';
          await createConversation();
          return;
        }

        await botSay('Ese correo no parece válido. Debe tener el formato nombre@dominio.com. ¿Lo revisas?');
        setPlaceholder('tu@correo.com...');
        return;
      }

      if (chatState !== 'active' || !conversationId || !sb) return;

      // Si el nombre quedó como fallback, intentar capturarlo del formulario en este momento
      if (pending.name === 'Cliente Nuevo' || !pending.name) {
        var nombreReal = document.getElementById('polyplas-name');
        if (nombreReal && nombreReal.value.trim()) {
          pending.name = nombreReal.value.trim();
          await sb.from('conversations').update({ client_name: pending.name }).eq('id', conversationId);
        }
      }

      renderMessage({ sender: 'client', content: text, created_at: now() });
      await sb.from('messages').insert({ conversation_id: conversationId, sender: 'client', content: text });

      // Auto-respuestas para dirección y horario
      var autoReply = '';
      if (/direcci[oó]n|ubicaci[oó]n|d[oó]nde (est[aá]n?|quedan?|se ubican?)|c[oó]mo llegar|mapa|local/i.test(text)) {
        autoReply = 'Estamos en Santiago Concha 1525, Santiago, Región Metropolitana. Puedes ver la ubicación aquí: https://maps.google.com/?q=-33.465282,-70.638817';
      } else if (/horario|atienden|abren|cierran|qu[eé] hora|cu[aá]ndo abren|d[ií]as de atenci[oó]n/i.test(text)) {
        autoReply = 'Nuestro horario de atención es lunes a viernes, de 9:00 a 18:00 hrs.';
      }

      if (autoReply) {
        await botSay(autoReply);
        await sb.from('messages').insert({ conversation_id: conversationId, sender: 'agent', content: autoReply });
        await sb.from('conversations').update({ last_message_at: now() }).eq('id', conversationId);
      } else {
        await sb.from('conversations').update({ last_message_at: now(), unread_count: 1 }).eq('id', conversationId);
      }
    }

    // ── Crear conversación ────────────────────────────────
    async function createConversation() {
      if (!sb) {
        chatState = 'ask_contact';
        await botSay('Hubo un problema técnico al conectar. Por favor recarga la página e intenta de nuevo.');
        return;
      }
      pending.name  = pending.name  || '';
      pending.phone = pending.phone || '';
      pending.email = pending.email || '';
      var clean = pending.phone.replace(/[\s\-()]/g, '');
      var phoneType = /^(22|((\+?56)?22))/.test(clean) ? 'landline' : 'mobile';
      var params = new URLSearchParams(window.location.search);

      var metadata = {
        phone:       pending.phone,
        phone_type:  phoneType,
        intent:      pending.intent  || 'consulta',
        query:       pending.query   || '',
        gclid:       params.get('gclid')      || null,
        gbraid:      params.get('gbraid')     || null,
        wbraid:      params.get('wbraid')     || null,
        refID:       params.get('refID')       || null,
        productoUrl: params.get('productoUrl') || window.location.href
      };

      // A. Generar UUID en el cliente para no depender de SELECT tras el INSERT
      var newId = (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
          });

      // B. Guardar en Supabase — forzamos lectura del formulario en el momento exacto del envío
      var nameField  = document.getElementById('polyplas-name');
      var emailField = document.getElementById('polyplas-email');
      var finalName  = nameField  ? nameField.value.trim()  : (pending.name  || 'Cliente Nuevo');
      var finalEmail = emailField ? emailField.value.trim() : (pending.email || '');

      var result = await sb.from('conversations').insert({
        id: newId,
        client_name:     finalName,
        client_email:    finalEmail,
        unread_count:    1,
        last_message_at: new Date().toISOString(),
        metadata
      });

      if (result.error) {
        chatState = 'ask_contact';
        await botSay('Hubo un problema técnico. ¿Puedes intentarlo de nuevo?', 400);
        return;
      }

      // C. GENERACIÓN DE IDENTIDAD DINÁMICA REAL
      // Usamos los primeros 5 caracteres del último segmento del UUID generado
      conversationId = newId;
      pending.name = finalName; // Sincronizar para que sendMessage pueda verificarlo
      var uniqueSuffix = conversationId.split('-').pop().substring(0, 5).toUpperCase();
      var shortId = 'PP-' + uniqueSuffix;


      // C. Enviar a Google Sheet con el ID dinámico
      var scriptURL = "https://script.google.com/macros/s/AKfycbw4WkE3slUjbDIUrbYVZD-aL1nB6WWJeyj6XG6rpFNz9p3pSFfdmUd3FjY_hV-QQJNkKA/exec";
      var paramsSheet = new URLSearchParams({
        idRef:    shortId,
        producto: metadata.productoUrl,
        gclid:    metadata.gclid || metadata.gbraid || metadata.wbraid || "Sin ID de Google"
      });
      fetch(scriptURL + '?' + paramsSheet.toString(), { mode: 'no-cors' });

      // D. Avisar a Tag Manager con el ID único del chat
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        'event': 'whatsapp_track_ok',
        'event_name': 'generate_lead',
        'id_referencia': shortId
      });

      // E. Iniciar Chat
      // Verificamos el estado AHORA (no al inicio) por si el usuario tardó y el horario cambió
      var stsNow = getStgStatus();
      var offlineConfirm = {
        weekend: 'Listo, ' + pending.name + ', ya tengo tus datos. Te escribo por WhatsApp el lunes apenas llegue a las 9:00 AM para que lo veamos.',
        after:   'Listo, ' + pending.name + ', ya tengo tus datos anotados. Mañana a las 9:00 AM te escribo al WhatsApp para responder tu consulta.',
        lunch:   'Listo, ' + pending.name + ', ya lo tengo. A las 14:15 te hablo por WhatsApp sin falta para que no pierdas tiempo.',
        before:  'Listo, ' + pending.name + ', ya tengo todo. Apenas abramos a las 9:00 AM te mando un WhatsApp con la respuesta.'
      };
      var confirmMsg = (stsNow === 'open')
        ? '¡Super! Te respondo por aquí en un momento. Si prefieres cerrar esta ventana, no te preocupes, yo te contacto a tu WhatsApp.'
        : (offlineConfirm[stsNow] || offlineConfirm['weekend']);

      // Guardar el historial completo del bot para que la ejecutiva tenga contexto
      if (pendingHistory.length > 0) {
        var historyRows = pendingHistory.map(function(h) {
          return { conversation_id: conversationId, sender: h.sender, content: h.content };
        });
        await sb.from('messages').insert(historyRows);
      }

      if (statusAtStart !== 'lunch' && statusAtStart !== 'before' && statusAtStart !== 'after' && statusAtStart !== 'weekend') {
        await sb.from('messages').insert({
          conversation_id: conversationId, sender: 'agent', content: confirmMsg
        });
        await botSay(confirmMsg, 800);
      }

      chatState = 'active';
      setPlaceholder('Escribe tu mensaje...');
      subscribeRealtime();
    }

    // ── Cargar chat existente ─────────────────────────────
    async function loadExistingChat() {
      var result = await sb.from('messages')
        .select('*').eq('conversation_id', conversationId).order('created_at');
      if (!result.data || !result.data.length) {
        conversationId = null;
        localStorage.removeItem('pp_conv_id');
        startFlow();
        return;
      }
      document.getElementById('polyplas-chat').classList.add('active');
      document.getElementById('polyplas-messages').innerHTML = '';
      result.data.forEach(renderMessage);
      chatState = 'active';
      setPlaceholder('Escribe tu mensaje...');
      subscribeRealtime();
    }

    // ── Tiempo real ───────────────────────────────────────
    function subscribeRealtime() {
      if (messageChannel) sb.removeChannel(messageChannel);
      messageChannel = sb.channel('msgs-' + conversationId)
        .on('postgres_changes', {
          event: 'INSERT', schema: 'public', table: 'messages',
          filter: 'conversation_id=eq.' + conversationId
        }, function(payload) {
          if (payload.new.sender === 'agent') renderMessage(payload.new);
        }).subscribe();
    }
  }

  // Ejecutar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadSupabaseAndInit);
  } else {
    loadSupabaseAndInit();
  }

  } catch(e) {
    console.error('Polyplas widget error:', e);
  }
})();
