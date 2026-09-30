var SB_URL = 'https://gdrkscedvkjtcvexnhzg.supabase.co';
  var SB_KEY = 'sb_publishable_qT9WuJK5Wi6VghgMvcYIMw_IGBtn1Tc';
  var SHEET_URL = 'https://script.google.com/macros/s/AKfycbw4WkE3slUjbDIUrbYVZD-aL1nB6WWJeyj6XG6rpFNz9p3pSFfdmUd3FjY_hV-QQJNkKA/exec';

  function genUUID() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0,
        v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  function saveToSheet(convId, data) {
    var shortId = 'PP-' + convId.split('-').pop().substring(0, 5).toUpperCase();
    
    fetch(SHEET_URL + '?' + new URLSearchParams({
      accion: 'nuevo_lead',
      idRef: shortId,
      producto: window.location.href,
      gclid: 'Formulario web'
    }).toString(), {
      mode: 'no-cors'
    });
    
    setTimeout(function() {
      fetch(SHEET_URL + '?' + new URLSearchParams({
        accion: 'form_datos',
        idRef: shortId,
        nombre: data.name,
        email: data.email,
        telefono: data.whatsapp
      }).toString(), {
        mode: 'no-cors'
      });
    }, 2000);
  }

  function saveToSupabase(data) {
    var convId = genUUID();
    var now = new Date().toISOString();
    fetch(SB_URL + '/rest/v1/conversations', {
      method: 'POST',
      headers: {
        'apikey': SB_KEY,
        'Authorization': 'Bearer ' + SB_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        id: convId,
        client_name: data.name,
        client_email: data.email,
        unread_count: 1,
        last_message_at: now,
        metadata: {
          phone: data.whatsapp,
          phone_type: 'mobile',
          query: data.message,
          intent: 'contacto', // Cambiado a intención de contacto
          source: 'form_contacto',
          productoUrl: window.location.href
        }
      })
    }).then(function(res) {
      if (!res.ok) return;
      fetch(SB_URL + '/rest/v1/messages', {
        method: 'POST',
        headers: {
          'apikey': SB_KEY,
          'Authorization': 'Bearer ' + SB_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          conversation_id: convId,
          sender: 'client',
          content: data.message,
          created_at: now
        })
      });
      saveToSheet(convId, data);
    }).catch(function(e) {
      console.warn('Supabase error:', e);
    });
  }

  const form = document.getElementById('polyForm');
  const formContent = document.getElementById('formContent');
  const successMessage = document.getElementById('successMessage');

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    const formData = new FormData(form);
    const object = Object.fromEntries(formData);
    const json = JSON.stringify(object);

    form.querySelector('button').innerHTML = "Enviando...";

    fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: json
      })
      .then(async (response) => {
        if (response.status == 200) {
          saveToSupabase(object);
          formContent.style.display = "none";
          successMessage.style.display = "block";
        } else {
          alert("Algo salió mal. Por favor intenta de nuevo.");
          form.querySelector('button').innerHTML = "Enviar Mensaje";
        }
      })
      .catch(error => {
        console.log(error);
        alert("Error de conexión.");
        form.querySelector('button').innerHTML = "Enviar Mensaje";
      });
  });
