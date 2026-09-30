(function(){

    /* ── Configuración Supabase (misma que el widget) ── */
    var SB_URL  = 'https://gdrkscedvkjtcvexnhzg.supabase.co';
    var SB_KEY  = 'sb_publishable_qT9WuJK5Wi6VghgMvcYIMw_IGBtn1Tc';
    var SB_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw4WkE3slUjbDIUrbYVZD-aL1nB6WWJeyj6XG6rpFNz9p3pSFfdmUd3FjY_hV-QQJNkKA/exec';

    /* ── Genera PP-XXXXX único igual que el widget ── */
    function ppGenId(){
        var uuid = (typeof crypto!=='undefined'&&crypto.randomUUID)
            ? crypto.randomUUID()
            : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,function(c){
                var r=Math.random()*16|0,v=c==='x'?r:(r&0x3|0x8);return v.toString(16);
            });
        return 'PP-'+uuid.split('-').pop().substring(0,5).toUpperCase();
    }

    /* ── Lee PP-XXXXX del widget si ya existe, si no genera uno nuevo ── */
    function ppGetOrCreateRef(){
        /* Intenta leer el que ya generó el widget principal en esta sesión */
        var existing = window.__ppCurrentRef || null;
        if(existing) return existing;
        /* Si el widget aún no corrió, genera uno propio para este CTA */
        var newRef = ppGenId();
        window.__ppCurrentRef = newRef;
        return newRef;
    }

    /* ── Envía a Google Sheet y GTM con el PP-XXXXX ── */
    function ppTrackCTA(modelo, ref){
        var params = new URLSearchParams(window.location.search);
        var gclid  = params.get('gclid') || params.get('gbraid') || params.get('wbraid') || 'Sin ID de Google';

        /* Google Sheets */
        var sheetParams = new URLSearchParams({
            idRef:    ref,
            producto: 'Guia Tinas - '+modelo+' - '+window.location.href,
            gclid:    gclid
        });
        fetch(SB_SCRIPT_URL+'?'+sheetParams.toString(), {mode:'no-cors'});

        /* GTM dataLayer */
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
            'event':          'whatsapp_track_ok',
            'event_name':     'generate_lead',
            'id_referencia':  ref,
            'modelo_tina':    modelo
        });

        /* Supabase — registra el clic como conversación si aún no existe una ── */
        if(window.supabase){
            var sb = window.supabase.createClient(SB_URL, SB_KEY);
            var newId = (typeof crypto!=='undefined'&&crypto.randomUUID)
                ? crypto.randomUUID()
                : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,function(c){
                    var r=Math.random()*16|0,v=c==='x'?r:(r&0x3|0x8);return v.toString(16);
                });
            sb.from('conversations').insert({
                id: newId,
                client_name:     'Lead Guía - '+modelo,
                client_email:    '',
                unread_count:    1,
                last_message_at: new Date().toISOString(),
                metadata: {
                    phone:       '',
                    phone_type:  'unknown',
                    intent:      'cotizacion',
                    query:       'CTA Guía Tinas - '+modelo,
                    productoUrl: window.location.href,
                    gclid:       params.get('gclid')||null,
                    refID:       ref
                }
            });
        }
    }

    /* ── Función principal que llaman todos los CTAs ── */
    window.ppGuiaCTA = function(btn){
        var modelo = btn ? (btn.dataset.modelo || 'General') : 'General';
        var ref    = ppGetOrCreateRef();

        /* Trackear */
        ppTrackCTA(modelo, ref);

        /* Abrir el chat del widget exactamente igual que forceAlwaysOpenChat */
        var chatWindow = document.getElementById('polyplas-chat');
        var fabOriginal = document.getElementById('polyplas-fab');
        if(chatWindow){
            chatWindow.classList.add('active');
            chatWindow.style.display = 'flex';
            if(fabOriginal) fabOriginal.click();
        } else {
            console.warn('Widget Polyplas no encontrado — ref: '+ref);
        }
    };

    /* ── Exponemos forceAlwaysOpenChat como alias por compatibilidad ── */
    window.forceAlwaysOpenChat = function(){
        window.ppGuiaCTA(null);
    };

/* ── Scroll al formulario "Te llamamos" desde el CTA final ── */
    window.polyScrollLlamamos = function(){
        var panel  = document.getElementById('polyLlamamosPanel');
        var toggle = document.getElementById('polyLlamamosToggle');
        var wrapper = toggle ? toggle.closest('.poly-dual-cta-wrapper') : null;
        if(panel && panel.style.display === 'none'){
            panel.style.display = 'block';
            if(toggle) toggle.setAttribute('aria-expanded','true');
        }
        var target = wrapper || panel;
        if(target){ target.scrollIntoView({behavior:'smooth', block:'start'}); }
        setTimeout(function(){
            var inp = document.getElementById('llNombre');
            if(inp) inp.focus();
        }, 600);
    };

    /* ── "Te llamamos" toggle ── */
    window.polyToggleLlamamos = function(){
        var panel = document.getElementById('polyLlamamosPanel');
        var toggle = document.getElementById('polyLlamamosToggle');
        var isOpen = panel.style.display !== 'none';
        if(isOpen){
            panel.style.display = 'none';
            toggle.setAttribute('aria-expanded','false');
        } else {
            panel.style.display = 'block';
            toggle.setAttribute('aria-expanded','true');
            panel.querySelector('#llNombre').focus();
        }
    };

    /* ── "Te llamamos" form: set _next URL + show success on return ── */
    var llForm = document.getElementById('polyLlamamosForm');
    if(llForm){
        llForm.addEventListener('submit', function(e){
            e.preventDefault();
            fetch(llForm.action, {
                method: 'POST',
                body: new FormData(llForm),
                headers: { 'Accept': 'application/json' }
            }).then(function(res){
                var msg = document.getElementById('polyLlamamosMsg');
                if(res.ok){
                    llForm.reset();
                    if(msg){ msg.style.display='block'; msg.className='poly-llamamos-msg ok'; msg.textContent='¡Listo! Recibimos tus datos y te contactaremos pronto. Muchas gracias.'; }
                } else {
                    if(msg){ msg.style.display='block'; msg.className='poly-llamamos-msg'; msg.textContent='Hubo un error al enviar. Por favor intenta de nuevo.'; }
                }
            }).catch(function(){
                var msg = document.getElementById('polyLlamamosMsg');
                if(msg){ msg.style.display='block'; msg.className='poly-llamamos-msg'; msg.textContent='Hubo un error al enviar. Por favor intenta de nuevo.'; }
            });
        });
    }


    /* ── FAQ ── */
    window.polyToggleFaqT=function(btn){
        var a=btn.nextElementSibling,open=a.classList.contains('open');
        document.querySelectorAll('.poly-faq-a').forEach(function(x){x.classList.remove('open');});
        document.querySelectorAll('.poly-faq-q').forEach(function(x){x.classList.remove('active');});
        if(!open){a.classList.add('open');btn.classList.add('active');}
    };

})();
