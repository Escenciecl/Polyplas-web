(function() {
// ── Data Layer (GTM / GA4 ecommerce) ─────────────────────
window.dataLayer = window.dataLayer || [];

function dlItem(item, idx) {
  return {
    item_id:        item.tipo + '_' + item.dim + '_' + item.color + '_' + item.esp,
    item_name:      'Plancha ' + ((item.material && materialesInfo[item.material]?.label) || (tiposInfo && tiposInfo[item.tipo] || {}).label || item.tipo) + ' ' + getColorLabel(item.color, item.tipo) + ' ' + ((dimMeta && dimMeta[item.dim] || {}).label || item.dim) + ' ' + item.esp,
    item_brand:     'Polyplas',
    item_category:  (item.material && materialesInfo[item.material]?.label) || (tiposInfo && tiposInfo[item.tipo] || {}).label || item.tipo,
    item_category2: (dimMeta    && dimMeta[item.dim]     || {}).label || item.dim,
    item_variant:   getColorLabel(item.color, item.tipo),
    item_category3: item.esp,
    price:          item.price,
    quantity:       item.qty,
    index:          idx || 0
  };
}

function dlPush(eventName, ecommerce) {
  window.dataLayer.push({ ecommerce: null });
  window.dataLayer.push({ event: eventName, ecommerce: ecommerce });
}

// ============================================================
//  DATOS DE PRECIOS — fallback local; fuente real: Supabase pp_stock
//  Para editar precios y stock: usa el CRM → pestaña Stock
// ============================================================
(function() {
  var _d = window.POLYPLAS_DATA && window.POLYPLAS_DATA.acrilico;
  // Los precios en POLYPLAS_DATA son netos — convertir a IVA incluido (× 1.19)
  // para que sean coherentes con los precios de Supabase y la lógica del módulo.
  if (_d && _d.prices) {
    Object.keys(_d.prices).forEach(function(tipo) {
      Object.keys(_d.prices[tipo]).forEach(function(dim) {
        Object.keys(_d.prices[tipo][dim]).forEach(function(color) {
          Object.keys(_d.prices[tipo][dim][color]).forEach(function(esp) {
            _d.prices[tipo][dim][color][esp] = Math.round(_d.prices[tipo][dim][color][esp] * 1.19);
          });
        });
      });
    });
  }
  window.__ppACRILICO = _d || null;
})();

const outOfStock = (window.__ppACRILICO && window.__ppACRILICO.outOfStock) || { AA: {}, PA: {} };

function isOutOfStock(tipo, dim, color, esp) {
  const entry = outOfStock[tipo]?.[dim]?.[color];
  if (!entry) return false;
  if (entry === true) return true;
  return Array.isArray(entry) && entry.includes(esp);
}

let prices = (window.__ppACRILICO && window.__ppACRILICO.prices) || {
  AA: {
    "1800x1200": {
      clear:  { "2mm":23800,"3mm":34000,"4mm":44000,"5mm":56000,"6mm":66000,"8mm":88500,"10mm":110200 },
      blanca: { "2mm":24890,"3mm":35600,"4mm":46100,"5mm":58700,"6mm":69200,"8mm":92825 },
      fluor_verde: { "3mm":41000 }, fluor_rojo: { "3mm":41000 },
      espejo_dorado: { "3mm":48900 }, espejo_plateado: { "3mm":48900 },
      negra: { "3mm":38000 }
    },
    "2400x1200": {
      clear:  { "2mm":30500,"3mm":44850,"4mm":59300,"5mm":72000,"6mm":89000,"8mm":121000,"10mm":150000 },
      blanca: { "2mm":29000,"3mm":46993,"4mm":62165,"5mm":75500,"6mm":93350,"8mm":126950 },
      negra:  { "3mm":61404 }
    },
    "2400x1800": {
      clear:  { "3mm":65000,"4mm":86000,"5mm":107000,"6mm":128000,"8mm":170000,"10mm":214000 },
      blanca: { "3mm":68150,"4mm":90200,"5mm":112250,"6mm":134300,"8mm":178400 },
      negra:  { "3mm":74000 }
    },
    "2000x1500": {
      clear:  { "3mm":45500,"4mm":60000,"5mm":83200,"6mm":99400,"8mm":138700,"10mm":170000 },
      blanca: { "3mm":47675,"4mm":70145,"5mm":87260,"6mm":104270,"8mm":146000 }
    },
    "3000x2000": {
      clear:  { "3mm":89000,"4mm":118000,"5mm":164300,"6mm":196800,"8mm":275300,"10mm":337900 },
      blanca: { "3mm":93350,"4mm":123800,"5mm":172415,"6mm":206540,"8mm":288965,"10mm":361413 }
    }
  },
  PA: {
    "1870x1270": {
      clear:  { "2mm":26416,"3mm":37840,"4mm":49040,"5mm":62480,"6mm":73680,"8mm":98880,"10mm":123184 },
      blanca: { "2mm":27650,"3mm":39630,"4mm":51400,"5mm":65500,"6mm":77260,"8mm":103720,"10mm":174400 }
    },
    "2500x1270": {
      clear:  { "2mm":32700,"3mm":47900,"4mm":64100,"5mm":76900,"6mm":91000,"8mm":117100,"10mm":151900 },
      blanca: { "2mm":33920,"3mm":49990,"4mm":66170,"5mm":80400,"6mm":99440,"8mm":135280,"10mm":167760 }
    },
    "2490x1870": {
      clear:  { "3mm":72560,"4mm":96080,"5mm":119600,"6mm":143120,"8mm":190160,"10mm":237200 },
      blanca: { "3mm":76100,"4mm":100780,"5mm":125480,"6mm":150200,"8mm":199600,"10mm":346700 },
      negra:  { "3mm":76400 }
    },
    "2050x1520": {
      clear:  { "3mm":50720,"4mm":66960,"5mm":92888,"6mm":111088,"8mm":155048,"10mm":190104 },
      blanca: { "3mm":53150,"4mm":70200,"5mm":97430,"6mm":116540,"8mm":162700 }
    },
    "3050x2050": {
      clear:  { "3mm":99440,"4mm":131920,"5mm":183776,"6mm":220176,"8mm":308096,"10mm":378208 },
      blanca: { "3mm":104300,"4mm":138400,"5mm":192800,"6mm":231000,"8mm":323400,"10mm":397200 }
    },
    "1830x1220": {
      negra: { "3mm":39200 }
    }
  }
};

// Si Supabase aún no cargó, los valores anteriores son netos (fallback local).
// Convertirlos a IVA incluido (× 1.19) para coherencia con Supabase y la lógica interna.
if (!window.__ppACRILICO) {
  (function() {
    [prices.AA, prices.PA].forEach(function(tipoObj) {
      if (!tipoObj) return;
      Object.keys(tipoObj).forEach(function(dim) {
        Object.keys(tipoObj[dim]).forEach(function(color) {
          Object.keys(tipoObj[dim][color]).forEach(function(esp) {
            tipoObj[dim][color][esp] = Math.round(tipoObj[dim][color][esp] * 1.19);
          });
        });
      });
    });
  })();
}

const dimMeta = (window.__ppACRILICO && window.__ppACRILICO.dimMeta) || {
  "1800x1200": { label:"180 × 120 cm", tipos:["AA"] },
  "2400x1200": { label:"240 × 120 cm", tipos:["AA"] },
  "2400x1800": { label:"240 × 180 cm", tipos:["AA"] },
  "2000x1500": { label:"200 × 150 cm", tipos:["AA"] },
  "3000x2000": { label:"300 × 200 cm", tipos:["AA"] },
  "1830x1220": { label:"183 × 122 cm", tipos:["PA"] },
  "1870x1270": { label:"187 × 127 cm", tipos:["PA"] },
  "2500x1270": { label:"250 × 127 cm", tipos:["PA"] },
  "2490x1870": { label:"249 × 187 cm", tipos:["PA"] },
  "2050x1520": { label:"205 × 152 cm", tipos:["PA"] },
  "3050x2050": { label:"305 × 205 cm", tipos:["PA"] }
};

const colorMeta = (window.__ppACRILICO && window.__ppACRILICO.colorMeta) || {
  clear:           { label:"Transparente / Clear", dot:"rgba(200,240,255,0.7)", border:"#aad4f5", img:"/wp-content/uploads/2026/05/plancha-de-acrilico-color-transparente.webp" },
  blanca:          { label:"Blanco Lechoso",       dot:"#f4f4f4",              border:"#ccc",    img:"/wp-content/uploads/2026/05/plancha-de-acrilico-color-blanco-lechoso.webp" },
  negra:           { label:"Negra",                dot:"#111",                 border:"#555",    img:"/wp-content/uploads/2026/05/plancha-de-acrilico-color-negro.webp" },
  fluor_verde:     { label:"Flúor Verde",          dot:"#39ff14",              border:"#39ff14", img:"/wp-content/uploads/2026/08/todos-los-modulos-plancha-acrilico-fluor-verde.webp" },
  fluor_rojo:      { label:"Flúor Rojo",           dot:"#ff1744",              border:"#ff1744", img:"/wp-content/uploads/2026/08/todos-los-modulos-plancha-acrilico-fluor-rojo.webp" },
  espejo_dorado:   { label:"Espejo Dorado",        dot:"linear-gradient(135deg,#f7d774,#c8971a)", border:"#c8971a", img:"/wp-content/uploads/2026/08/todos-los-modulos-plancha-acrilico-espejo-dorado.webp" },
  espejo_plateado: { label:"Espejo Plateado",      dot:"linear-gradient(135deg,#e8e8e8,#999)",    border:"#999",    img:"/wp-content/uploads/2026/08/todos-los-modulos-plancha-acrilico-espejo-plateado.webp" }
};
function getColorLabel(colorKey, tipo) {
  if (tipo === 'AA' && colorKey === 'blanca') return 'Blanca Traslúcida';
  return (colorMeta[colorKey] && colorMeta[colorKey].label) || colorKey || '';
}

// ── Estado ────────────────────────────────────────────────
let state = { material:"", tipo:"AA", dim:"", color:"", esp:"", qty:1 };
let corteState = {
  activo: false, modo: null, instrucciones: "", instruccionesItems: [],
  medidaMode: "misma",
  medidaShared: { ancho: "", alto: "", obs: "" },
  medidaItems: [],
  medidaSets: [],   // [{obs:"", medidas:[{ancho:"",alto:""}]}] — una por plancha
  igualMode: "misma",
  igualItems: [],
  igualShared: { ancho: "", alto: "", qty: "", obs: "" }
};

// ── Flujo guiado: helpers ──────────────────────────────────
function unlockStep(n) {
  const card = document.getElementById("stepCard" + n);
  if (!card) return;
  card.classList.remove("pp-locked");
  card.classList.remove("pp-unlocked");
  void card.offsetWidth; // reflow para re-disparar animacion
  card.classList.add("pp-unlocked");
  card.scrollIntoView({ behavior: "smooth", block: "nearest" });
}
function lockStep(n) {
  const card = document.getElementById("stepCard" + n);
  if (!card) return;
  card.classList.remove("pp-unlocked");
  card.classList.add("pp-locked");
}
function unlockSummary() {
  const s = document.getElementById("summarySection");
  if (!s) return;
  s.classList.add("visible");
  setTimeout(function() {
    s.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, 80);
}
function lockSummary() {
  const s = document.getElementById("summarySection");
  if (s) s.classList.remove("visible");
}
function updateWizard() {
  const steps = [!!state.material, !!state.dim, !!state.color, !!state.esp];
  steps.forEach(function(done, i) {
    const wz = document.getElementById("wz" + (i + 1));
    if (!wz) return;
    wz.classList.remove("wz-active", "wz-done");
    if (done) {
      wz.classList.add("wz-done");
    } else {
      // Es el siguiente paso activo (el primero sin completar)
      const prevDone = i === 0 || steps[i - 1];
      if (prevDone) wz.classList.add("wz-active");
    }
    const line = document.getElementById("wzLine" + (i + 1));
    if (line) line.classList.toggle("wz-done", done);
  });
  // Nudge de configuracion completa
  const done = document.getElementById("configDone");
  if (done) done.classList.toggle("visible", steps.every(Boolean));
}
function setChip(n, text) {
  const chip = document.getElementById("chip" + n);
  const val  = document.getElementById("chip" + n + "Val");
  if (!chip || !val) return;
  if (text) {
    val.textContent = "✓ " + text;
    chip.classList.add("visible");
  } else {
    chip.classList.remove("visible");
  }
}
function editStep(n) {
  // Re-abre el paso n y bloquea los siguientes
  if (n <= 1) {
    lockStep(2); lockStep(3); lockStep(4); lockSummary();
    setChip(1, ""); setChip(2, ""); setChip(3, "");
    state.dim = ""; state.color = ""; state.esp = "";
    updateWizard(); updatePrice();
  } else if (n === 2) {
    lockStep(3); lockStep(4); lockSummary();
    setChip(2, ""); setChip(3, "");
    state.color = ""; state.esp = "";
    buildDimSelector();
    updateWizard(); updatePrice();
  } else if (n === 3) {
    lockStep(4); lockSummary();
    setChip(3, "");
    state.esp = "";
    buildColorSelector();
    updateWizard(); updatePrice();
  }
}

// ── Stepper: estado actual ──────────────────────────────────
let currentStep = 1;

function renderStep(n) {
  currentStep = n;
  const body = document.getElementById("stepperBody");
  if (!body) return;

  // Títulos de cada paso
  const titles = [
    "",
    "Elige el material",
    "Elige medida y espesor",
    "Elige el espesor",
    "Elige el color",
    "Confirma y agrega al pedido"
  ];
  const titleEl = document.getElementById("stepperStepTitle");
  if (titleEl) titleEl.textContent = titles[n] || "";

  // Actualizar dots: done = clickeable con label de selección, active = paso actual
  const dotSelections = {
    1: state.material ? (materialesInfo[state.material]?.tag || state.material) : null,
    2: state.dim ? (dimMeta[state.dim]?.label || state.dim) : null,
    3: state.esp || null,
    4: state.color ? getColorLabel(state.color, state.tipo) : null,
  };
  const dotDefaults = { 1:"Material", 2:"Medida", 3:"Espesor", 4:"Color", 5:"Agregar" };
  for (let i = 1; i <= 5; i++) {
    const dot = document.getElementById("sdot" + i);
    if (!dot) continue;
    dot.classList.remove("active", "done");
    const lbl = dot.querySelector(".pp-sdot-label");
    const line = document.getElementById("sline" + i);
    if (i < n) {
      dot.classList.add("done");
      dot.style.cursor = "pointer";
      if (lbl && dotSelections[i]) lbl.textContent = dotSelections[i];
      dot.onclick = (function(step) { return function() {
        const _preset = window._ppPresetColor || "";
        if (step === 1) { state.dim=""; state.color=_preset||""; state.esp=""; renderStep(1); }
        else if (step === 2) { state.color=_preset||""; state.esp=""; renderStep(2); }
        else if (step === 3) { state.color=_preset||""; renderStep(3); }
        else if (step === 4) { state.color=""; renderStep(4); }
      }; })(i);
    } else {
      dot.style.cursor = "";
      dot.onclick = null;
      if (i === n) dot.classList.add("active");
      if (lbl) lbl.textContent = dotDefaults[i] || "";
    }
    if (line) line.classList.toggle("done", i < n);
  }

  // Ocultar dot de Color si viene pre-seleccionado desde la card
  const _pc = window._ppPresetColor || "";
  const _d4 = document.getElementById("sdot4");
  const _l4 = document.getElementById("sline4");
  if (_d4) _d4.style.display = _pc ? "none" : "";
  if (_l4) _l4.style.display = _pc ? "none" : "";

  // Actualizar barra de progreso
  const _hasPreset = !!window._ppPresetColor;
  const totalSteps = _hasPreset ? 2 : 4;
  for (let s = 1; s <= 4; s++) {
    const pEl = document.getElementById("cpStep" + s);
    if (!pEl) continue;
    pEl.classList.remove("done", "active");
    if (s < n)      pEl.classList.add("done");
    else if (s === n) pEl.classList.add("active");
    // Con preset: solo mostrar 2 dots (step 2 = dot 1, step 5 = dot 2)
    pEl.style.display = (_hasPreset && s > 2) ? "none" : "";
  }
  const cpLabel = document.getElementById("cpLabel");
  if (cpLabel) {
    const displayStep = _hasPreset ? (n <= 2 ? 1 : 2) : Math.min(n - 1, totalSteps);
    cpLabel.textContent = "Paso " + (displayStep || 1) + " de " + totalSteps;
  }

  // Limpiar chips (navegación ahora via dots)
  const crumbs = document.getElementById("stepperCrumbs");
  if (crumbs) crumbs.innerHTML = "";

  // Rescatar stepperPrice si fue movido al body en paso 5
  const priceEl = document.getElementById("stepperPrice");
  if (priceEl && priceEl.parentElement === body) {
    body.parentElement.appendChild(priceEl);
  }
  if (priceEl) priceEl.style.display = "none";

  // Re-animar body
  body.classList.remove("pp-stepper-body");
  void body.offsetWidth;
  body.classList.add("pp-stepper-body");

  // Construir contenido del paso
  body.innerHTML = "";
  if (n === 1) {
    body.innerHTML =
      '<div id="tipoSelector" class="pp-tipo-cards"></div>' +
      '<div id="tipoDesc" style="margin-top:12px;font-size:0.78rem;color:var(--pp-muted);min-height:18px;"></div>';
    buildTipoSelector();
  } else if (n === 2) {
    const _pc2 = window._ppPresetColor || "";
    if (_pc2) {
      body.innerHTML =
        '<div style="font-size:0.68rem;text-transform:uppercase;letter-spacing:2px;color:var(--pp-muted);font-weight:700;margin-bottom:8px;">Medida</div>' +
        '<div id="dimSelector" class="pp-pills"></div>' +
        '<div id="espesorInlineSection" style="margin-top:18px;">' +
          '<div style="font-size:0.68rem;text-transform:uppercase;letter-spacing:2px;color:var(--pp-muted);font-weight:700;margin-bottom:8px;">Espesor</div>' +
          '<div id="espesorSelector" class="pp-espesor-grid"></div>' +
        '</div>' +
        '<div id="comboPricePreview"></div>';
      buildDimSelector();
      buildEspesorSelector();
      if (state.dim && state.esp) showComboPricePreview();
    } else {
      body.innerHTML = '<div id="dimSelector" class="pp-pills"></div>';
      buildDimSelector();
    }
  } else if (n === 3) {
    body.innerHTML = '<div id="espesorSelector" class="pp-espesor-grid"></div>';
    buildEspesorSelector();
  } else if (n === 4) {
    body.innerHTML = '<div id="colorSelector" class="pp-swatches"></div>';
    buildColorSelector();
  } else if (n === 5) {
    if (priceEl) {
      priceEl.style.display = "block";
      priceEl.style.animation = "none";
      void priceEl.offsetWidth;
      priceEl.style.animation = "";
      body.appendChild(priceEl);
    }
    // Asegurar estado del botón menos al entrar al paso 5
    const minusBtn = document.querySelector(".pp-qty-btn[aria-label='Reducir']");
    if (minusBtn) minusBtn.disabled = state.qty <= 1;
  }

  // Botón volver al tope del contenido (pasos 2, 3, 4 — en paso 5 ya hay "← Volver al paso anterior")
  if (n > 1 && n !== 5) {
    const backBtn = document.createElement("button");
    backBtn.className = "pp-stepper-back";
    backBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg> Volver';
    backBtn.onclick = function() {
      const _preset = window._ppPresetColor || "";
      if (n === 2) { state.dim = ""; state.color = ""; state.esp = ""; if (window.closeConfigurator) window.closeConfigurator(); else renderStep(1); }
      else if (n === 3) { state.esp = ""; if (_preset) state.color = _preset; else state.color = ""; const btn=document.getElementById("btnCart"); if(btn) btn.style.display="none"; renderStep(2); }
      else if (n === 4) { state.esp = ""; state.color = ""; renderStep(3); }
      else if (n === 5) { if (_preset) { state.color = _preset; renderStep(3); } else { state.color = ""; renderStep(4); } }
    };
    body.append(backBtn);
  }

  updatePrice();

  // Actualizar barra de progreso y topbar
  (function() {
    const s1 = document.getElementById("confStep1");
    const s2 = document.getElementById("confStep2");
    const l1 = document.getElementById("confLine1");
    const tb = document.getElementById("configuratorTopbarTitle");
    const th = document.getElementById("confTopThumb");
    // Thumbnail del producto en el topbar
    if (th) {
      const imgSrc = window._ppCardImg || "";
      th.innerHTML = imgSrc ? `<img src="${imgSrc}" style="width:100%;height:100%;object-fit:cover;">` : "";
      th.style.display = imgSrc ? "block" : "none";
    }
    if (!s1 || !s2) return;
    [s1,s2].forEach(function(el){ el.className = "pp-conf-step"; });
    if (l1) l1.className = "pp-conf-step-line";
    if (n === 2) {
      s1.classList.add("active");
      if (tb) tb.textContent = "Paso 1 de 2 — Elige medida y espesor";
    } else if (n === 3 || n === 4) {
      s1.classList.add("done"); if(l1) l1.classList.add("done");
      s2.classList.add("active");
      if (tb) tb.textContent = "Paso 2 de 2 — Tu pedido";
    } else if (n === 5) {
      s1.classList.add("done"); if(l1) l1.classList.add("done");
      s2.classList.add("active");
      if (tb) tb.textContent = "Paso 2 de 2 — Tu pedido";
    }
  })();

  // Nudge: activa timer en paso 4 y 5, cancela en el resto
  if (n === 4 || n === 5) { _nudgeSchedule(); }
  else { _nudgeCancel(); }
}

function goToStep(n) {
  renderStep(n);
}

function updateStepperCrumbs(n) {
  // navegación ahora via dots del stepper (clickeables con label de selección)
}

function addCrumb(container, text, onClick) {
  const c = document.createElement("div");
  c.className = "pp-stepper-crumb";
  c.innerHTML = '<span style="font-size:0.7rem;">✓</span> ' + text + ' <span class="pp-stepper-crumb-edit">Editar</span>';
  c.onclick = onClick;
  container.appendChild(c);
}

// ── Inicialización ─────────────────────────────────────────
function init() {
  renderStep(1);
  renderCart();
}

// ── Materiales ────────────────────────────────────────────
const materialesInfo = {
  AA:   { label:"Acrílico AA",   nombre:"Acrílico Mix",           uso:"Señalética · Decoración · Exhibición", diferencia:"Económico · Alta calidad",      desc:"Material reciclado de alta calidad, ideal para uso general y proyectos económicos.", tipo:"AA", tag:"AA", tagClass:"tag-aa" },
  PA:   { label:"PA · 100% Virgen", nombre:"Acrílico 100% Virgen",   uso:"Óptica · Acuarios · Usos exigentes",  diferencia:"Premium · Mayor transparencia", desc:"Acrílico virgen premium, mayor transparencia y durabilidad. Recomendado para usos exigentes.", tipo:"PA", tag:"PA", tagClass:"tag-pa" },
};

// Compatibilidad con código que aún usa tiposInfo (dlItem, etc.)
const tiposInfo = {
  AA: { label: "Acrílico AA" },
  PA: { label: "PA · 100% Virgen" },
};

function getDimFilter(material) {
  return k => !/_pc|_pet|_petg/.test(k);
}

function getMinPrecioMaterial(material) {
  const m = materialesInfo[material];
  if (!m) return null;
  const tipo = m.tipo;
  const filter = getDimFilter(material);
  const allVals = Object.entries(prices[tipo] || {})
    .filter(([k]) => filter(k))
    .flatMap(([, c]) => Object.values(c))
    .flatMap(e => Object.values(e));
  return allVals.length ? Math.min(...allVals) : null;
}

function buildTipoSelector() {
  const el = document.getElementById("tipoSelector");
  if (!el) return;
  el.innerHTML = "";
  el.className = "pp-tipo-cards";

  Object.entries(materialesInfo).forEach(([k, v]) => {
    const desde = getMinPrecioMaterial(k);
    const card = document.createElement("button");
    card.className = "pp-tipo-card" + (state.material === k ? " active" : "");
    card.innerHTML =
      `<span class="pp-tipo-card-check">✓</span>` +
      `<span class="pp-tipo-tag ${v.tagClass} pp-tipo-card-tag">${v.tag}</span>` +
      `<span class="pp-tipo-card-name">${v.nombre}</span>` +
      `<span class="pp-tipo-card-uso">${v.uso}</span>`;
    card.onclick = () => {
      state.material = k; state.tipo = v.tipo; state.dim = ""; state.color = ""; state.esp = "";
      document.querySelectorAll(".pp-tipo-card").forEach(x => x.classList.remove("active"));
      card.classList.add("active");
      const descEl = document.getElementById("tipoDesc");
      if (descEl) descEl.textContent = v.desc;
      setTimeout(() => goToStep(2), 150);
    };
    el.appendChild(card);
  });
  if (state.material && materialesInfo[state.material]) {
    document.getElementById("tipoDesc").textContent = materialesInfo[state.material].desc;
  }
}

// ── Dimensión ─────────────────────────────────────────────
function buildDimSelector() {
  const el = document.getElementById("dimSelector");
  if (!el) return;
  el.innerHTML = "";
  const filter  = getDimFilter(state.material);
  const presetColor = window._ppPresetColor || "";
  let entries = Object.entries(dimMeta).filter(([k,v]) => filter(k) && v.tipos.includes(state.tipo));
  // Si el color viene pre-seleccionado desde la card, mostrar solo dims donde ese color existe
  if (presetColor) {
    entries = entries.filter(([k]) => prices[state.tipo]?.[k]?.[presetColor]);
  }

  entries.forEach(([k, v]) => {
    const b = document.createElement("button");
    b.className = "pp-pill" + (state.dim===k?" active":"");
    b.textContent = v.label;
    b.onclick = () => {
      state.dim = k;
      if (!presetColor) state.color = "";
      state.esp = "";
      document.querySelectorAll("#dimSelector .pp-pill").forEach(x => x.classList.remove("active"));
      b.classList.add("active");
      if (presetColor) {
        history.replaceState(null, '', window.location.pathname + window.location.search + '#color=' + presetColor + '&medida=' + k + '&mat=' + (state.material || 'AA'));
        // Actualizar espesores disponibles para la nueva medida
        buildEspesorSelector();
        // Limpiar precio anterior si cambió la medida
        const pp = document.getElementById("comboPricePreview");
        if (pp) pp.innerHTML = "";
      } else {
        setTimeout(() => goToStep(3), 150);
      }
    };
    el.appendChild(b);
  });
}

// ── Color ─────────────────────────────────────────────────
function buildColorSelector() {
  const el = document.getElementById("colorSelector");
  if (!el) return;
  el.innerHTML = "";
  if (!state.dim || !state.esp) return;
  Object.entries(colorMeta).forEach(([k, v]) => {
    // Solo mostrar colores que tienen precio para el espesor seleccionado
    if (!prices[state.tipo]?.[state.dim]?.[k]?.[state.esp]) return;
    const wrap = document.createElement("div");
    wrap.className = "pp-swatch" + (state.color === k ? " active" : "");
    const dot = document.createElement("div");
    if (v.img) {
      dot.className = "pp-swatch-dot has-img";
      dot.style.backgroundImage = `url('${v.img}')`;
      dot.style.borderColor = state.color === k ? "var(--pp-accent)" : "transparent";
    } else {
      dot.className = "pp-swatch-dot";
      dot.style.background = v.dot;
      dot.style.borderColor = state.color === k ? "var(--pp-accent)" : v.border;
    }
    const lbl = document.createElement("span");
    lbl.textContent = getColorLabel(k, state.tipo);
    wrap.appendChild(dot); wrap.appendChild(lbl);

    // Hover tooltip con foto
    if (v.img) {
      wrap.addEventListener("mouseenter", function(e) {
        const tt    = document.getElementById("colorTooltip");
        const ttImg = document.getElementById("colorTooltipImg");
        const ttLbl = document.getElementById("colorTooltipName");
        if (!tt) return;
        ttImg.style.backgroundImage = `url('${v.img}')`;
        ttLbl.textContent = getColorLabel(k, state.tipo);
        const rect = wrap.getBoundingClientRect();
        const ttW = 210, ttH = 185;
        let left = rect.right + 10;
        let top  = rect.top + rect.height / 2 - ttH / 2;
        if (left + ttW > window.innerWidth - 12) left = rect.left - ttW - 10;
        if (top < 8) top = 8;
        if (top + ttH > window.innerHeight - 8) top = window.innerHeight - ttH - 8;
        tt.style.left = left + "px";
        tt.style.top  = top  + "px";
        tt.classList.add("show");
      });
      wrap.addEventListener("mouseleave", function() {
        const tt = document.getElementById("colorTooltip");
        if (tt) tt.classList.remove("show");
      });
    }

    wrap.onclick = () => {
      state.color = k;
      const tt = document.getElementById("colorTooltip");
      if (tt) tt.classList.remove("show");
      goToStep(5);
    };
    el.appendChild(wrap);
  });
}

// ── Espesor ───────────────────────────────────────────────
const allEspesores = ["0.75mm","1mm","2mm","3mm","4mm","5mm","6mm","8mm","10mm"];
const espHints = {
  "0.75mm": "Displays",
  "1mm":    "Señalética",
  "2mm":    "Señalética",
  "3mm":    "Uso general",
  "4mm":    "Uso general",
  "5mm":    "Construcción",
  "6mm":    "Construcción",
  "8mm":    "Industrial",
  "10mm":   "Estructural",
};
function buildEspesorSelector() {
  const el = document.getElementById("espesorSelector");
  if (!el) return;
  el.innerHTML = "";
  const presetColor = window._ppPresetColor || "";
  const availEsp = {};
  if (state.dim) {
    // Con dim seleccionado: solo espesores de esa medida
    const dimPrices = prices[state.tipo]?.[state.dim] || {};
    Object.entries(dimPrices).forEach(([color, espPrices]) => {
      if (presetColor && color !== presetColor) return;
      Object.keys(espPrices).forEach(esp => {
        if (!availEsp[esp]) availEsp[esp] = { hasStock: false };
        if (!isOutOfStock(state.tipo, state.dim, color, esp)) availEsp[esp].hasStock = true;
      });
    });
  } else {
    // Sin dim: mostrar todos los espesores disponibles para el tipo/color
    const allDimPrices = prices[state.tipo] || {};
    Object.entries(allDimPrices).forEach(([dim, colorPrices]) => {
      Object.entries(colorPrices).forEach(([color, espPrices]) => {
        if (presetColor && color !== presetColor) return;
        Object.keys(espPrices).forEach(esp => {
          if (!availEsp[esp]) availEsp[esp] = { hasStock: false };
          if (!isOutOfStock(state.tipo, dim, color, esp)) availEsp[esp].hasStock = true;
        });
      });
    });
  }
  allEspesores.forEach(esp => {
    if (!availEsp[esp]) return;
    const sinStock = !availEsp[esp].hasStock;
    const b = document.createElement("button");
    b.className = "pp-esp-btn" + (state.esp === esp ? " active" : "") + (sinStock ? " sin-stock" : "");
    b.innerHTML = esp + (espHints[esp] ? `<span class="esp-use">${espHints[esp]}</span>` : "");
    if (sinStock) {
      b.disabled = true;
    } else {
      b.onclick = () => {
        state.esp = esp;
        if (!presetColor) state.color = "";
        document.querySelectorAll("#espesorSelector .pp-esp-btn").forEach(x => x.classList.remove("active"));
        b.classList.add("active");
        if (presetColor) {
          if (state.dim) history.replaceState(null, '', window.location.pathname + window.location.search + '#color=' + presetColor + '&medida=' + state.dim + '&espesor=' + esp + '&mat=' + (state.material || 'AA'));
          // Mostrar precio + botón continuar inline (sin navegar)
          showComboPricePreview();
        } else {
          setTimeout(() => goToStep(4), 150);
        }
      };
    }
    el.appendChild(b);
  });
}

// ── Confirmar inline (espesor elegido, mismo paso) ────────
function showInlineConfirm() {
  const body    = document.getElementById("stepperBody");
  const priceEl = document.getElementById("stepperPrice");
  if (!body || !priceEl) return;
  // Evitar duplicados
  if (body.contains(priceEl)) { updatePrice(); return; }
  // Limpiar el body (ej: espesorSelector) antes de mostrar el paso 3
  body.innerHTML = "";
  priceEl.style.display = "block";
  priceEl.style.animation = "none";
  void priceEl.offsetWidth;
  priceEl.style.animation = "";
  body.appendChild(priceEl);
  updatePrice();
  // Hacer scroll suave al bloque de precio
  setTimeout(() => priceEl.scrollIntoView({ behavior:"smooth", block:"nearest" }), 80);
}

// ── Preview de precio inline (vista combinada medida+espesor) ─
function showComboPricePreview() {
  const _prices = window._ppPrices || prices;
  const price = _prices?.[state.tipo]?.[state.dim]?.[state.color]?.[state.esp];
  const pp = document.getElementById("comboPricePreview");
  if (!pp) return;
  if (!price) { pp.innerHTML = ""; return; }
  const fmtFn = typeof fmt !== "undefined" ? fmt : function(v) { return "$ " + Math.round(v).toLocaleString("es-CL"); };
  const dimLabel = (window._ppDimMeta || dimMeta)?.[state.dim]?.label || state.dim;
  pp.innerHTML =
    '<div style="margin-top:18px;padding:16px;background:#eef3fc;border-radius:12px;border:1px solid rgba(0,74,153,0.2);">' +
      '<div style="font-size:0.65rem;text-transform:uppercase;letter-spacing:2px;color:var(--pp-accent);font-weight:700;margin-bottom:4px;">Precio</div>' +
      '<div style="font-size:1.8rem;font-weight:800;color:var(--pp-success,#2d7a3a);letter-spacing:1px;">' + fmtFn(price) + '</div>' +
      '<div style="font-size:0.72rem;color:var(--pp-muted);margin-top:2px;">IVA incluido &middot; ' + dimLabel + ' &middot; ' + state.esp + '</div>' +
      '<button onclick="goToStep(5)" style="width:100%;margin-top:14px;padding:14px;background:var(--pp-accent);color:#fff;border:none;border-radius:10px;font-family:Arial,sans-serif;font-size:0.95rem;font-weight:700;letter-spacing:1px;cursor:pointer;transition:background 0.15s;">' +
        'Continuar al pedido →' +
      '</button>' +
    '</div>';
  setTimeout(() => pp.scrollIntoView({ behavior: "smooth", block: "nearest" }), 80);
}

// ── Precio por m² ─────────────────────────────────────────
function getDimM2(dimKey) {
  const clean = dimKey.replace(/_[a-z]+$/i, '');
  const parts = clean.split('x');
  if (parts.length !== 2) return null;
  const w = parseInt(parts[0]);
  const h = parseInt(parts[1]);
  return (w && h) ? (w * h) / 1000000 : null;
}

// ── Estado visual de los pasos ─────────────────────────────
function updateStepStates() {
  const done = [!!state.material, !!state.dim, !!state.color, !!state.esp];
  document.querySelectorAll('.pp-step .pp-step-num').forEach(function(el, i) {
    if (done[i] && !el.id) { // solo los pp-step-num sin id propio (paso 1)
      el.classList.add('done');
      el.textContent = '✓';
    } else {
      el.classList.remove('done');
      el.textContent = String(i + 1);
    }
  });
}

// ── Precio ─────────────────────────────────────────────────
function fmt(n) {
  return "$\u00a0" + Math.round(n).toLocaleString("es-CL");
}
function updatePrice() {
  const price = prices[state.tipo]?.[state.dim]?.[state.color]?.[state.esp];
  const sinStock = state.esp ? isOutOfStock(state.tipo, state.dim, state.color, state.esp) : false;
  const total = price ? price * state.qty : null;

  document.getElementById("sType").textContent = state.material ? materialesInfo[state.material]?.label : "—";
  document.getElementById("sDim").textContent = state.dim ? dimMeta[state.dim]?.label : "—";
  document.getElementById("sColor").textContent = state.color ? getColorLabel(state.color, state.tipo) : "—";
  document.getElementById("sEsp").textContent = state.esp || "—";

  updateStepStates();

  // ── Live preview en sidebar ──────────────────────────────
  (function() {
    const lpEl    = document.getElementById("cartLivePreview");
    const emptyEl = document.getElementById("cartEmpty");
    const countEl = document.getElementById("cartCount");
    if (!lpEl) return;

    const modalOpen = document.getElementById("configuratorModal")?.classList.contains("open");
    if (!modalOpen) {
      lpEl.style.display = "none";
      // Restaurar cartEmpty si el carrito está vacío
      if (emptyEl) emptyEl.style.display = cart.length === 0 ? "" : "none";
      return;
    }

    // Modal abierto: mostrar live preview, ocultar estado vacío e items confirmados
    lpEl.style.display = "";
    if (emptyEl) emptyEl.style.display = "none";
    const itemsEl2 = document.getElementById("cartItems");
    if (itemsEl2) itemsEl2.style.display = "none";

    // Ocultar contador mientras el modal está abierto
    if (countEl) countEl.textContent = "";

    const matLabel   = state.material ? (materialesInfo[state.material]?.label || state.material) : "—";
    const colorLabel = state.color    ? getColorLabel(state.color, state.tipo) : null;
    const dimLabel   = state.dim      ? (dimMeta[state.dim]?.label || state.dim) : null;
    const espLabel   = state.esp      || null;

    // Thumb
    const thumbEl = document.getElementById("cartLiveThumb");
    if (thumbEl) {
      const imgSrc = window._ppCardImg || (state.color ? colorMeta[state.color]?.img : "") || "";
      thumbEl.innerHTML = imgSrc
        ? `<img src="${imgSrc}" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;display:block;">`
        : "";
    }

    // Name
    const nameEl = document.getElementById("cartLiveName");
    if (nameEl) nameEl.textContent = matLabel;

    // Sub — construye las partes, pendientes en italic
    const subEl = document.getElementById("cartLiveSub");
    if (subEl) {
      const parts = [];
      if (colorLabel) parts.push(`<span>${colorLabel}</span>`);
      parts.push(dimLabel
        ? `<span>${dimLabel}</span>`
        : `<span class="pp-live-item-sub-pending">medida →</span>`);
      parts.push(espLabel
        ? `<span>${espLabel}</span>`
        : `<span class="pp-live-item-sub-pending">${dimLabel ? "espesor →" : "—"}</span>`);
      subEl.innerHTML = parts.join(' · ');
    }

    // Precio
    const livePrice = prices[state.tipo]?.[state.dim]?.[state.color]?.[state.esp];
    const priceEl   = document.getElementById("cartLivePrice");
    const qtyLblEl  = document.getElementById("cartLiveQtyLabel");
    const qtyValEl  = document.getElementById("cartLiveQty");
    if (priceEl) priceEl.textContent = livePrice ? fmt(livePrice * state.qty) : "—";
    if (qtyValEl) qtyValEl.textContent = state.qty;
    if (qtyLblEl) qtyLblEl.textContent = livePrice
      ? (state.qty > 1 ? state.qty + " u. × " + fmt(livePrice) : fmt(livePrice) + " / u.")
      : "— / u.";

    // Footer del total: solo mostrar cuando hay precio completo, sin botón de pago
    const footerEl2   = document.getElementById("cartFooter");
    const grandEl     = document.getElementById("cartGrandTotal");
    const totalLabel  = footerEl2 ? footerEl2.querySelector("[data-live-label]") : null;
    const checkoutBtn = document.getElementById("btnCheckout");
    const shippingBar = document.getElementById("shippingBar");
    const entregaEl   = document.getElementById("entregaEstimada");
    if (livePrice) {
      if (footerEl2) footerEl2.style.display = "block";
      const liveBase    = livePrice * state.qty;
      const liveNeto    = Math.round(liveBase / 1.19);
      const liveRecargo = (corteState.activo && corteState.modo === "distintos")
        ? Math.round(liveNeto * 0.10) + Math.round(Math.round(liveNeto * 0.10) * 0.19)
        : 0;
      if (grandEl) grandEl.textContent = fmt(liveBase + liveRecargo);
      if (totalLabel) totalLabel.textContent = state.qty > 1
        ? "Total " + state.qty + " plancha(s)"
        : (liveRecargo ? "Precio + recargo corte" : "Precio este item");
      if (shippingBar) shippingBar.style.display = "none";
      if (entregaEl)   entregaEl.style.display   = "none";
    } else {
      if (footerEl2) footerEl2.style.display = "none";
    }
  })();

  const btn          = document.getElementById("btnCart");
  const btnAdd       = document.getElementById("btnAddToOrder");
  const hint         = document.getElementById("btnCartHint");
  const mobileBtn    = document.getElementById("mobileBarBtn");
  const mobileVal    = document.getElementById("mobileBarPrice");
  const cartSVG   = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>`;
  const cartSVGsm = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>`;

  const m2El    = document.getElementById("priceM2");
  const labelEl = document.getElementById("priceLabelText");

  if (sinStock) {
    document.getElementById("priceVal").value = price;
    document.getElementById("priceTotal").value = 0;
    document.getElementById("qtyDisplay").value = state.qty;
    btn.disabled = true;
    btn.style.display = "none";
    btn.innerHTML = "SIN STOCK";
    if (btnAdd) btnAdd.style.display = "none";
    const _btnA2 = document.getElementById("btnAddAnother"); if(_btnA2) _btnA2.style.display = "none";
    const _btnG2 = document.getElementById("btnGoCheckout");  if(_btnG2) _btnG2.style.display = "none";
    const _corte2 = document.getElementById("cartCorteSection"); if(_corte2) _corte2.style.display = "none";
    if (hint) hint.textContent = "";
    if (mobileBtn) { mobileBtn.disabled = true; mobileBtn.innerHTML = "SIN STOCK"; }
    if (mobileVal) mobileVal.textContent = fmt(price);
    if (m2El) m2El.style.display = "none";
    if (labelEl) labelEl.textContent = "Precio por plancha";

  } else if (price) {
    document.getElementById("priceVal").value = price;
    document.getElementById("priceTotal").value = total;
    document.getElementById("qtyDisplay").value = state.qty;
    btn.disabled = false;
    btn.style.display = "none";
    btn.innerHTML = cartSVG + " IR AL PAGO →";
    // Botones dentro de paso3SummarySection — siempre visibles cuando la sección está visible
    if (btnAdd) btnAdd.style.display = "";
    const btnAnother = document.getElementById("btnAddAnother");
    if (btnAnother) btnAnother.style.display = "";
    const btnGo = document.getElementById("btnGoCheckout");
    if (btnGo) btnGo.style.display = "";
    const corteS = document.getElementById("cartCorteSection");
    if (corteS) corteS.style.display = "block";
    // Poblar elementos paso 3
    (function(){
      const matLabel   = state.material ? (materialesInfo[state.material]?.label || state.material) : "";
      const colorLabel = state.color ? getColorLabel(state.color, state.tipo) : "";
      const dimLabel   = state.dim      ? (dimMeta[state.dim]?.label || state.dim) : "";
      const espLabel   = state.esp      || "";
      const imgSrc     = window._ppCardImg || (state.color ? colorMeta[state.color]?.img : "") || "";
      const nameEl     = document.getElementById("paso3Name");
      const subEl      = document.getElementById("paso3Sub");
      const priceEl3   = document.getElementById("paso3Price");
      const recargoEl3 = document.getElementById("paso3Recargo");
      const thumbEl3   = document.getElementById("paso3Thumb");
      const qtyEl3     = document.getElementById("paso3Qty");
      const unitEl3    = document.getElementById("paso3UnitPrice");
      if (nameEl)   nameEl.textContent  = matLabel + (colorLabel ? " " + colorLabel : "");
      if (subEl)    subEl.textContent   = [dimLabel, espLabel].filter(Boolean).join(" · ");
      if (thumbEl3) thumbEl3.innerHTML  = imgSrc ? '<img src="' + imgSrc + '" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;display:block;">' : "";
      if (qtyEl3)   qtyEl3.textContent  = state.qty;
      // Calcular recargo de corte distintos
      var baseTotal3 = price * state.qty;
      if (corteState && corteState.activo && corteState.modo === "distintos") {
        var neto3       = Math.round(baseTotal3 / 1.19);
        var recargo3    = Math.round(neto3 * 0.10);
        var nuevoNeto3  = neto3 + recargo3;
        var ivaRec3     = Math.round(nuevoNeto3 * 0.19);
        var corteCosto3 = (nuevoNeto3 + ivaRec3) - baseTotal3;
        if (priceEl3) priceEl3.textContent = fmt(baseTotal3 + corteCosto3);
        if (recargoEl3) {
          recargoEl3.innerHTML = fmt(baseTotal3) + ' <span style="color:var(--pp-accent2);">+ recargo corte ' + fmt(corteCosto3) + '</span>';
          recargoEl3.style.display = "";
        }
      } else {
        if (priceEl3) priceEl3.textContent = fmt(baseTotal3);
        if (recargoEl3) recargoEl3.style.display = "none";
      }
      if (unitEl3 && state.qty > 1) unitEl3.textContent = state.qty + " × " + fmt(price);
      else if (unitEl3) unitEl3.textContent = fmt(price) + " / u.";
      // Mostrar ítems ya en carrito (excluyendo el ítem actual en edición)
      var cartPreviewEl  = document.getElementById("paso3CartPreview");
      var cartItemsEl    = document.getElementById("paso3CartItems");
      var cartSubtotalEl = document.getElementById("paso3CartSubtotal");
      var currentLabel   = document.getElementById("paso3CurrentLabel");
      // Sincronizar cart[] con sessionStorage para eliminar items ya removidos del carrito global
      (function() {
        try {
          var _gcGids = JSON.parse(sessionStorage.getItem('pp_global_cart') || '[]').map(function(i){ return i.gid; });
          cart = cart.filter(function(i) { return i._gid && _gcGids.indexOf(i._gid) !== -1; });
        } catch(e) {}
      })();
      var prevItems = cart.filter(function(i) {
        return !(i.tipo === state.tipo && i.dim === state.dim && i.color === state.color && i.esp === state.esp);
      });
      if (cart.length > 0 && cartPreviewEl && cartItemsEl) {
        var itemsToShow = prevItems.length > 0 ? prevItems : cart;
        var prevTotal = itemsToShow.reduce(function(s, i) { return s + i.price * i.qty + getItemCorteCosto(i); }, 0);
        cartItemsEl.innerHTML = itemsToShow.map(function(i) {
          var mat    = (i.material ? (materialesInfo[i.material]?.label || i.material) : i.tipo);
          var col    = getColorLabel(i.color, i.tipo);
          var dim    = dimMeta[i.dim]?.label || i.dim;
          var imgSrc = i.img || colorMeta[i.color]?.img || "";
          var thumb  = imgSrc
            ? '<img src="' + imgSrc + '" style="width:36px;height:36px;object-fit:cover;border-radius:6px;border:1px solid var(--pp-border);flex-shrink:0;">'
            : '<div style="width:36px;height:36px;border-radius:6px;background:var(--pp-border);flex-shrink:0;"></div>';
          var iSub   = i.price * i.qty;
          var iCorte = getItemCorteCosto(i);
          var iTotal = iSub + iCorte;
          return '<div style="display:flex;align-items:center;gap:10px;padding:4px 0;">' +
            thumb +
            '<div style="flex:1;min-width:0;">' +
              '<div>' + mat + ' · ' + col + ' · ' + dim + ' · ' + i.esp + (i.qty > 1 ? ' × ' + i.qty : '') + '</div>' +
              (i.corteMode === 'iguales' ? '<div style="font-size:0.7em;color:#34a853;">✂ Corte igual · GRATIS' + (i.corteInstrucciones ? ' · <em>' + i.corteInstrucciones + '</em>' : '') + '</div>' : '') +
              (iCorte > 0 ? '<div style="font-size:0.7em;color:#888;">' + fmt(iSub) + ' + <span style="color:#e52727;">' + fmt(iCorte) + '</span>' + (i.corteInstrucciones ? ' · <em>' + i.corteInstrucciones + '</em>' : '') + '</div>' : '') +
            '</div>' +
            '<span style="color:var(--pp-text);font-weight:600;white-space:nowrap;">' + fmt(iTotal) + '</span>' +
          '</div>';
        }).join("");
        if (cartSubtotalEl) cartSubtotalEl.textContent = fmt(prevTotal);
        var subtotalLabelEl = document.getElementById("paso3CartSubtotalLabel");
        if (subtotalLabelEl) {
          var hayRecargo = itemsToShow.some(function(i) { return i.tieneRecargo; });
          subtotalLabelEl.innerHTML = hayRecargo
            ? 'Subtotal carrito <span style="color:#e52727;font-size:0.9em;">incl. recargo corte</span>'
            : 'Subtotal carrito';
        }
        cartPreviewEl.style.display = "";
        if (currentLabel) currentLabel.style.display = "";
      } else {
        if (cartPreviewEl) cartPreviewEl.style.display = "none";
        if (currentLabel) currentLabel.style.display = "none";
      }
      // Total combinado + textos de botón dinámicos
      var totalCombinadoEl  = document.getElementById("paso3TotalCombinado");
      var totalCombinadoVal = document.getElementById("paso3TotalCombinadoVal");
      var btnGo   = document.getElementById("btnGoCheckout");
      var btnKeep = document.getElementById("btnAddToOrder");
      // Total Bruto por ítem de prevItems (cada uno con su propio tieneRecargo)
      var prevGrandFinal = prevItems.reduce(function(s, i) {
        return s + i.price * i.qty + getItemCorteCosto(i);
      }, 0);
      var prevTotal2 = prevItems.reduce(function(s, i) { return s + i.price * i.qty; }, 0);
      if (prevItems.length > 0) {
        // Combinado = suma de Total Bruto de prevItems + Total Bruto del ítem actual
        var combinado = prevGrandFinal + baseTotal3 + calcCorteCosto(baseTotal3);
        if (totalCombinadoEl)  totalCombinadoEl.style.display  = "";
        if (totalCombinadoVal) totalCombinadoVal.textContent    = fmt(combinado);
        if (btnGo)   btnGo.textContent   = "AGREGAR Y PAGAR →";
        if (btnKeep) btnKeep.textContent = "Agregar al carro y seguir comprando";
      } else {
        if (totalCombinadoEl) totalCombinadoEl.style.display = "none";
        if (btnGo)   btnGo.textContent   = "IR AL PAGO →";
        if (btnKeep) btnKeep.textContent = "Agregar al carro y seguir comprando";
      }
    })();
    // Activar paso 2 (Pedido) en la barra de progreso
    (function(){
      const s1=document.getElementById("confStep1"),s2=document.getElementById("confStep2");
      const l1=document.getElementById("confLine1");
      const tb=document.getElementById("configuratorTopbarTitle");
      if(s1)s1.className="pp-conf-step"; if(s2)s2.className="pp-conf-step";
      if(l1)l1.className="pp-conf-step-line";
      if(s1)s1.classList.add("done"); if(l1)l1.classList.add("done");
      if(s2)s2.classList.add("active");
      if(tb)tb.textContent = "Paso 2 de 2 — Tu pedido";
    })();
    // Mostrar resumen y sección de corte solo cuando stepperPrice ya está en pantalla (paso 5)
    var _sum3 = document.getElementById("paso3SummarySection");
    if (_sum3) _sum3.style.display = "";
    var _corteW = document.getElementById("corteSectionWrapper");
    var _priceElInBody = (function(){ var pe=document.getElementById("stepperPrice"),sb=document.getElementById("stepperBody"); return !!(pe&&sb&&pe.parentElement===sb); })();
    if (_corteW) _corteW.style.display = _priceElInBody ? "" : "none";
    if (hint) hint.textContent = "";
    if (mobileBtn) { mobileBtn.disabled = false; mobileBtn.innerHTML = cartSVGsm + " AGREGAR"; }
    if (mobileVal) mobileVal.textContent = fmt(price);
    if (labelEl) labelEl.textContent = "Precio por plancha";
    if (m2El) m2El.style.display = "none";
    clearTimeout(window._ppViewItemTimer);
    window._ppViewItemTimer = setTimeout(function() {
      dlPush('view_item', {
        currency: 'CLP',
        value: price,
        items: [dlItem({ tipo:state.tipo, dim:state.dim, color:state.color, esp:state.esp, qty:state.qty, price: price })]
      });
    }, 600);

  } else {
    // Mostrar "Desde $X" calculando el mínimo disponible
    let minPrice = null;
    if (state.dim && state.esp) {
      // Min precio para el espesor seleccionado entre todos los colores disponibles
      const dimPrices = prices[state.tipo]?.[state.dim] || {};
      const vals = Object.entries(dimPrices)
        .filter(([color]) => !isOutOfStock(state.tipo, state.dim, color, state.esp))
        .map(([color, espPrices]) => espPrices[state.esp])
        .filter(Boolean);
      if (vals.length) minPrice = Math.min(...vals);
    } else if (state.dim) {
      const colorMap = prices[state.tipo]?.[state.dim] || {};
      const allVals = Object.values(colorMap).flatMap(p => Object.values(p));
      if (allVals.length) minPrice = Math.min(...allVals);
    }

    if (minPrice) {
      document.getElementById("priceVal").value = minPrice;
      if (mobileVal) mobileVal.textContent = "Desde " + fmt(minPrice);
    } else {
      document.getElementById("priceVal").value = "";
      if (mobileVal) mobileVal.textContent = "—";
    }
    document.getElementById("priceTotal").value = "";
    // Ocultar paso3SummarySection y corteSectionWrapper cuando no hay precio
    const _sum3 = document.getElementById("paso3SummarySection");
    if (_sum3) _sum3.style.display = "none";
    const _corteW2 = document.getElementById("corteSectionWrapper");
    if (_corteW2) _corteW2.style.display = "none";
    btn.disabled = true;
    btn.style.display = "none";
    btn.innerHTML = cartSVG + " AGREGAR AL PEDIDO";
    if (btnAdd) btnAdd.style.display = "none";
    const _btnA3 = document.getElementById("btnAddAnother"); if(_btnA3) _btnA3.style.display = "none";
    const _btnG3 = document.getElementById("btnGoCheckout");  if(_btnG3) _btnG3.style.display = "none";
    const _corte3 = document.getElementById("cartCorteSection"); if(_corte3) _corte3.style.display = "none";
    if (mobileBtn) { mobileBtn.disabled = true; mobileBtn.innerHTML = cartSVGsm + " AGREGAR"; }
    if (m2El) m2El.style.display = "none";
    if (labelEl) labelEl.textContent = minPrice ? "Precio estimado desde" : "Precio por plancha";

    // Hint dinámico según paso pendiente
    if (hint) {
      if (!state.material) hint.textContent = "Paso 1 — Selecciona el material";
      else if (!state.dim) hint.textContent = "Paso 2 — Selecciona la dimension";
      else if (!state.esp) hint.textContent = "Selecciona el espesor";
      else if (!state.color) hint.textContent = "Selecciona el color";
      else hint.textContent = "";
    }
  }
}

// ── Cantidad ──────────────────────────────────────────────
function changeQty(d) {
  state.qty = Math.max(1, state.qty + d);
  const inp = document.getElementById("qtyNum");
  if (inp) inp.value = state.qty;
  const minusBtn = document.querySelector(".pp-qty-btn[aria-label='Reducir']");
  if (minusBtn) minusBtn.disabled = state.qty <= 1;
  updatePrice();
  if (corteState.activo && corteState.modo === "distintos") {
    syncMedidaSets(state.qty);
    renderCorteMedidasPanel(document.getElementById("corteInstruccionesArea"));
  }
  // Advertencia si se modifica la cantidad después de haber calculado con la calculadora
  var calcInfo = window._pccCalcInfo;
  var qWarn = document.getElementById('paso3QtyWarn');
  if (qWarn && calcInfo) {
    if (state.qty !== calcInfo.Nsh) {
      qWarn.innerHTML = '&#9888;&#65039; La calculadora arrojó <strong>' + calcInfo.Nsh + (calcInfo.Nsh === 1 ? ' plancha' : ' planchas') + '</strong> para ' + calcInfo.tot + ' piezas. Modificaste la cantidad manualmente.';
      qWarn.style.display = 'block';
    } else {
      qWarn.style.display = 'none';
    }
  }
}
function onQtyInput(inp) {
  const val = parseInt(inp.value, 10);
  state.qty = (!val || val < 1) ? 1 : val;
  inp.value = state.qty;
  const minusBtn = document.querySelector(".pp-qty-btn[aria-label='Reducir']");
  if (minusBtn) minusBtn.disabled = state.qty <= 1;
  updatePrice();
  if (corteState.activo && corteState.modo === "distintos") {
    syncMedidaSets(state.qty);
    renderCorteMedidasPanel(document.getElementById("corteInstruccionesArea"));
  }
}

// ── Corte ─────────────────────────────────────────────────

// Fórmula por ítem:
//   neto_base      = round(bruto / 1.19)
//   recargo_neto   = round(neto_base × 10%)
//   nuevo_neto     = neto_base + recargo_neto
//   iva_item       = round(nuevo_neto × 19%)
//   total_bruto    = nuevo_neto + iva_item
//   surcharge      = total_bruto - bruto
function calcRecargoBruto(bruto) {
  const neto        = Math.round(bruto / 1.19);
  const recargoNeto = Math.round(neto * 0.10);
  const nuevoNeto   = neto + recargoNeto;
  const ivaItem     = Math.round(nuevoNeto * 0.19);
  return (nuevoNeto + ivaItem) - bruto;
}

// Recargo por ítem usando su flag tieneRecargo (guardado al momento de agregar al carrito)
function getItemCorteCosto(item) {
  if (!item.tieneRecargo) return 0;
  return calcRecargoBruto(item.price * item.qty);
}

// Compatibilidad con código de badges/display que usa el estado global actual
function calcCorteCosto(productGrand) {
  if (!corteState.activo || corteState.modo !== "distintos") return 0;
  return calcRecargoBruto(productGrand);
}

function updateCorteBadge() {
  const badge     = document.getElementById("corteBadge");
  const distBadge = document.getElementById("corteDistBadge");

  const modalOpen      = document.getElementById("configuratorModal")?.classList.contains("open");
  const productGrand   = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const netoGrand      = Math.round(productGrand / 1.19);
  const recargo        = Math.round(netoGrand * 0.10);
  const ivaRecargo     = Math.round(recargo * 0.19);
  const costo          = recargo + ivaRecargo;

  // Mientras el modal está abierto mostrar solo "+10%" — el monto exacto aparece al cerrar
  const costoLabel = (!modalOpen && costo) ? "+" + fmt(costo) : "+10%";

  if (distBadge) distBadge.textContent = costoLabel;

  if (!badge) return;
  if (!corteState.activo) { badge.style.display = "none"; return; }
  badge.style.display = "";
  if (corteState.modo !== "distintos") {
    badge.textContent = "GRATIS";
    badge.className = "pp-entrega-badge badge-gratis";
  } else {
    badge.textContent = costoLabel;
    badge.className = "pp-entrega-badge badge-propio";
  }
}

function _saveIgualFromDOM() {
  var aEl = document.getElementById("igualSharedAncho");
  var hEl = document.getElementById("igualSharedAlto");
  var qEl = document.getElementById("igualSharedQty");
  var oEl = document.getElementById("igualSharedObs");
  if (aEl) corteState.igualShared.ancho = aEl.value;
  if (hEl) corteState.igualShared.alto  = hEl.value;
  if (qEl) corteState.igualShared.qty   = qEl.value;
  if (oEl) corteState.igualShared.obs   = oEl.value;
}

function onIgualSharedInput(field, el) {
  corteState.igualShared[field] = el.value;
  if (field !== "obs" && field !== "qty") {
    var base = getDimBase();
    var max = base ? Math.floor((field === "ancho" ? base.w : base.h) / 10) : null;
    var err = validateMedidaField(el.value, max);
    var errEl = el.parentNode ? el.parentNode.querySelector(".pp-medidas-error") : null;
    if (errEl) { errEl.textContent = err; errEl.style.display = err ? "" : "none"; }
    el.classList.toggle("pp-input-error", !!err && el.value.length > 0);
  }
}

function syncIgualItems(qty) {
  while (corteState.igualItems.length < qty) corteState.igualItems.push({ obs: "" });
  if (corteState.igualItems.length > qty) corteState.igualItems = corteState.igualItems.slice(0, qty);
}

function setIgualMode(mode) {
  _saveIgualFromDOM();
  corteState.igualMode = mode;
  if (mode === "distinta") syncIgualItems(state.qty);
  renderCorteTextareas();
}

function onIgualItemInput(idx, el) {
  if (!corteState.igualItems[idx]) corteState.igualItems[idx] = { obs: "" };
  corteState.igualItems[idx].obs = el.value;
}

function buildIgualItemsText() {
  _saveIgualFromDOM();
  var s = corteState.igualShared;
  if (!s.ancho || !s.alto) return "";
  var dim = s.ancho + "×" + s.alto + " cm";
  var txt = s.qty ? s.qty + " × " + dim : dim;
  return txt + (s.obs ? " · " + s.obs : "");
}

function renderCorteTextareas() {
  const area = document.getElementById("corteInstruccionesArea");
  if (!area) return;
  _saveMedidasFromDOM();
  _saveIgualFromDOM();
  area.innerHTML = "";
  area.style.display = "block";

  if (corteState.modo === "iguales") {
    var base = getDimBase();
    var maxW = base ? Math.floor(base.w / 10) : 999;
    var maxH = base ? Math.floor(base.h / 10) : 999;
    var s = corteState.igualShared;
    var html =
      '<div class="pp-notice" style="margin-top:0;margin-bottom:8px;background:rgba(0,74,153,0.07);border-left:3px solid var(--pp-accent);color:var(--pp-text);">' +
        'Todas las piezas se cortarán con las mismas medidas, independientemente de la cantidad.' +
      '</div>' +
      '<div class="pp-notice" style="margin-top:0;margin-bottom:14px;">' +
        'Mínimo de corte 30×30 cm. La sierra consume 3 mm por corte.' +
      '</div>' +
      '<div style="font-size:0.7rem;text-transform:uppercase;letter-spacing:1.5px;color:var(--pp-accent);font-weight:700;margin-bottom:8px;">Medidas de corte *</div>' +
      '<div class="pp-medidas-row">' +
        '<div class="pp-medidas-field">' +
          '<label class="pp-medidas-label">Ancho (cm)</label>' +
          '<input type="number" id="igualSharedAncho" class="pp-medidas-input" min="30" max="' + maxW + '" step="1" value="' + (s.ancho || '') + '" placeholder="ej: ' + Math.floor(maxW * 0.6) + '" oninput="onIgualSharedInput(\'ancho\',this)">' +
          '<span class="pp-medidas-error" style="display:none;"></span>' +
        '</div>' +
        '<div class="pp-medidas-sep">×</div>' +
        '<div class="pp-medidas-field">' +
          '<label class="pp-medidas-label">Alto (cm)</label>' +
          '<input type="number" id="igualSharedAlto" class="pp-medidas-input" min="30" max="' + maxH + '" step="1" value="' + (s.alto || '') + '" placeholder="ej: ' + Math.floor(maxH * 0.6) + '" oninput="onIgualSharedInput(\'alto\',this)">' +
          '<span class="pp-medidas-error" style="display:none;"></span>' +
        '</div>' +
      '</div>' +
      '<div class="pp-medidas-row" style="margin-top:10px;">' +
        '<div class="pp-medidas-field" style="max-width:140px;">' +
          '<label class="pp-medidas-label">Cantidad de trozos *</label>' +
          '<input type="number" id="igualSharedQty" class="pp-medidas-input" min="1" step="1" value="' + (s.qty || '') + '" placeholder="ej: 4" oninput="onIgualSharedInput(\'qty\',this)">' +
        '</div>' +
      '</div>' +
      '<div class="pp-medidas-obs-row">' +
        '<label class="pp-medidas-label" style="margin-bottom:5px;">Observación (opcional)</label>' +
        '<input type="text" id="igualSharedObs" class="pp-medidas-obs-input" value="' + (s.obs || '').replace(/"/g, '&quot;') + '" placeholder="ej: bordes lisos, sin aristas" oninput="onIgualSharedInput(\'obs\',this)">' +
      '</div>';

    const content = document.createElement("div");
    content.innerHTML = html;
    area.appendChild(content);

  } else if (corteState.modo === "distintos") {
    renderCorteMedidasPanel(area);
  }

  // Los botones IR AL PAGO / Seguir comprando están fijos al final del paso 3 (stepperCtaGroup)
}

// ── Medidas estructuradas para "Corte a medida" ───────────────

function getDimBase() {
  if (!state.dim) return null;
  var parts = state.dim.split('x');
  if (parts.length !== 2) return null;
  var w = parseInt(parts[0], 10), h = parseInt(parts[1], 10);
  return (isNaN(w) || isNaN(h)) ? null : { w: w, h: h };
}

function syncMedidaItems(qty) {
  while (corteState.medidaItems.length < qty)
    corteState.medidaItems.push({ ancho: "", alto: "", obs: "" });
  if (corteState.medidaItems.length > qty)
    corteState.medidaItems = corteState.medidaItems.slice(0, qty);
}

function buildCorteMedidasText() {
  if (corteState.modo !== "distintos") return "";
  var qty = state.qty;
  var parts = [];
  for (var i = 0; i < Math.min(qty, corteState.medidaSets.length); i++) {
    var plank = corteState.medidaSets[i];
    var medidasStr = plank.medidas.filter(function(m) { return m.ancho && m.alto; })
      .map(function(m) { return (m.qty ? m.qty + " × " : "") + m.ancho + "×" + m.alto + " cm"; }).join(", ");
    if (!medidasStr) continue;
    var entry = qty > 1 ? "Plancha " + (i + 1) + ": " + medidasStr : medidasStr;
    if (plank.obs) entry += " · " + plank.obs;
    parts.push(entry);
  }
  return parts.join("; ");
}

function buildCorteMedidasSnapshot() {
  if (corteState.modo !== "distintos") return null;
  var qty = state.qty;
  return {
    mode: "distinta",
    shared: null,
    items: corteState.medidaSets.slice(0, qty).map(function(p) {
      return { obs: p.obs, medidas: p.medidas.map(function(m) { return Object.assign({}, m); }) };
    })
  };
}

function formatMedidasForDisplay(corteMedidas, qty) {
  if (!corteMedidas || !corteMedidas.items) return "";
  return corteMedidas.items.map(function(plank, i) {
    if (!plank || !plank.medidas) return null;
    var medidasStr = plank.medidas.filter(function(m) { return m && m.ancho && m.alto; })
      .map(function(m) { return (m.qty ? m.qty + " × " : "") + m.ancho + "×" + m.alto + " cm"; }).join(", ");
    if (!medidasStr) return null;
    var entry = qty > 1 ? "P" + (i + 1) + ": " + medidasStr : medidasStr;
    if (plank.obs) entry += " · " + plank.obs;
    return entry;
  }).filter(Boolean).join(" / ");
}

function validateMedidaField(val, maxVal) {
  var n = parseInt(val, 10);
  if (!val || val === "") return "Campo requerido";
  if (isNaN(n) || n <= 0) return "Ingresa un número válido";
  if (n < 30) return "Mínimo 30 cm";
  if (maxVal && n > maxVal) return "Máximo " + maxVal + " cm";
  return "";
}

function setMedidaMode(mode) {
  corteState.medidaMode = mode;
  syncMedidaItems(state.qty);
  renderCorteMedidasPanel(document.getElementById("corteInstruccionesArea"));
  corteState.instrucciones = buildCorteMedidasText();
}

function onMedidaSharedInput(field, el) {
  corteState.medidaShared[field] = el.value;
  if (field !== "obs") {
    var base = getDimBase();
    var max = base ? Math.floor((field === "ancho" ? base.w : base.h) / 10) : null;
    var err = validateMedidaField(el.value, max);
    var errEl = el.parentNode ? el.parentNode.querySelector(".pp-medidas-error") : null;
    if (errEl) { errEl.textContent = err; errEl.style.display = err ? "" : "none"; }
    el.classList.toggle("pp-input-error", !!err && el.value.length > 0);
  }
  corteState.instrucciones = buildCorteMedidasText();
}

function onMedidaItemInput(idx, field, el) {
  if (!corteState.medidaItems[idx]) corteState.medidaItems[idx] = { ancho: "", alto: "", obs: "" };
  corteState.medidaItems[idx][field] = el.value;
  if (field !== "obs") {
    var base = getDimBase();
    var max = base ? Math.floor((field === "ancho" ? base.w : base.h) / 10) : null;
    var err = validateMedidaField(el.value, max);
    var errEl = el.parentNode ? el.parentNode.querySelector(".pp-medidas-error") : null;
    if (errEl) { errEl.textContent = err; errEl.style.display = err ? "" : "none"; }
    el.classList.toggle("pp-input-error", !!err && el.value.length > 0);
  }
  corteState.instrucciones = buildCorteMedidasText();
}

function _saveMedidasFromDOM() {
  for (var p = 0; p < corteState.medidaSets.length; p++) {
    var plank = corteState.medidaSets[p];
    var obsEl = document.getElementById("msObs_" + p);
    if (obsEl) plank.obs = obsEl.value;
    for (var m = 0; m < plank.medidas.length; m++) {
      var aEl = document.getElementById("msAncho_" + p + "_" + m);
      var hEl = document.getElementById("msAlto_"  + p + "_" + m);
      var qEl = document.getElementById("msQty_"   + p + "_" + m);
      if (aEl) plank.medidas[m].ancho = aEl.value;
      if (hEl) plank.medidas[m].alto  = hEl.value;
      if (qEl) plank.medidas[m].qty   = qEl.value;
    }
  }
}

function syncMedidaSets(qty) {
  while (corteState.medidaSets.length < qty)
    corteState.medidaSets.push({ obs: "", medidas: [{ ancho: "", alto: "" }] });
  if (corteState.medidaSets.length > qty)
    corteState.medidaSets = corteState.medidaSets.slice(0, qty);
}

function _buildPlankMedidasHTML(p, plankData, maxW, maxH, showLabel) {
  var html = '<div class="pp-medidas-plancha-row">';
  if (showLabel) html += '<div class="pp-medidas-plancha-label">Plancha ' + (p + 1) + '</div>';
  for (var m = 0; m < plankData.medidas.length; m++) {
    var med = plankData.medidas[m];
    var canRemove = plankData.medidas.length > 1;
    html +=
      '<div style="display:flex;align-items:flex-end;gap:6px;margin-bottom:8px;">' +
        '<div style="flex:1;">' +
          '<div class="pp-medidas-row">' +
            '<div class="pp-medidas-field">' +
              (m === 0 ? '<label class="pp-medidas-label">Ancho (cm)</label>' : '') +
              '<input type="number" id="msAncho_' + p + '_' + m + '" class="pp-medidas-input" min="30" max="' + maxW + '" step="1" value="' + (med.ancho || '') + '" placeholder="ej: 80" oninput="onMedidaSetInput(' + p + ',' + m + ',\'ancho\',this)">' +
              '<span class="pp-medidas-error" style="display:none;"></span>' +
            '</div>' +
            '<div class="pp-medidas-sep">×</div>' +
            '<div class="pp-medidas-field">' +
              (m === 0 ? '<label class="pp-medidas-label">Alto (cm)</label>' : '') +
              '<input type="number" id="msAlto_' + p + '_' + m + '" class="pp-medidas-input" min="30" max="' + maxH + '" step="1" value="' + (med.alto || '') + '" placeholder="ej: 60" oninput="onMedidaSetInput(' + p + ',' + m + ',\'alto\',this)">' +
              '<span class="pp-medidas-error" style="display:none;"></span>' +
            '</div>' +
            '<div class="pp-medidas-sep" style="visibility:hidden;">×</div>' +
            '<div class="pp-medidas-field" style="max-width:72px;">' +
              (m === 0 ? '<label class="pp-medidas-label">Cant.</label>' : '') +
              '<input type="number" id="msQty_' + p + '_' + m + '" class="pp-medidas-input" min="1" step="1" value="' + (med.qty || '') + '" placeholder="1" oninput="onMedidaSetInput(' + p + ',' + m + ',\'qty\',this)">' +
            '</div>' +
          '</div>' +
        '</div>' +
        (canRemove
          ? '<button type="button" onclick="removeMedidaFromPlank(' + p + ',' + m + ')" style="flex-shrink:0;width:30px;height:36px;border:1px solid #dde4ef;border-radius:6px;background:#fff;color:#e52727;font-size:1rem;font-weight:700;cursor:pointer;line-height:1;margin-bottom:0;" title="Eliminar esta medida">×</button>'
          : '<div style="width:30px;flex-shrink:0;"></div>') +
      '</div>';
  }
  html +=
    '<button type="button" onclick="addMedidaToPlank(' + p + ')" style="width:100%;padding:7px 12px;border:1.5px dashed var(--pp-accent);border-radius:8px;background:transparent;color:var(--pp-accent);font-size:0.78rem;font-weight:700;cursor:pointer;margin-bottom:10px;letter-spacing:0.5px;">+ Agregar otra medida</button>' +
    '<div class="pp-medidas-obs-row">' +
      '<label class="pp-medidas-label" style="margin-bottom:5px;">Observación (opcional)</label>' +
      '<input type="text" id="msObs_' + p + '" class="pp-medidas-obs-input" value="' + (plankData.obs || '').replace(/"/g, '&quot;') + '" placeholder="ej: bordes lisos, sin aristas" oninput="onMedidaSetObs(' + p + ',this)">' +
    '</div>' +
  '</div>';
  return html;
}

function addMedidaToPlank(p) {
  _saveMedidasFromDOM();
  if (!corteState.medidaSets[p]) return;
  corteState.medidaSets[p].medidas.push({ ancho: "", alto: "" });
  renderCorteMedidasPanel(document.getElementById("corteInstruccionesArea"));
}

function removeMedidaFromPlank(p, m) {
  _saveMedidasFromDOM();
  if (!corteState.medidaSets[p] || corteState.medidaSets[p].medidas.length <= 1) return;
  corteState.medidaSets[p].medidas.splice(m, 1);
  renderCorteMedidasPanel(document.getElementById("corteInstruccionesArea"));
}

function onMedidaSetInput(p, m, field, el) {
  if (!corteState.medidaSets[p] || !corteState.medidaSets[p].medidas[m]) return;
  corteState.medidaSets[p].medidas[m][field] = el.value;
  if (field !== "obs" && field !== "qty") {
    var base = getDimBase();
    var max = base ? Math.floor((field === "ancho" ? base.w : base.h) / 10) : null;
    var err = validateMedidaField(el.value, max);
    var errEl = el.parentNode ? el.parentNode.querySelector(".pp-medidas-error") : null;
    if (errEl) { errEl.textContent = err; errEl.style.display = err ? "" : "none"; }
    el.classList.toggle("pp-input-error", !!err && el.value.length > 0);
  }
}

function onMedidaSetObs(p, el) {
  if (corteState.medidaSets[p]) corteState.medidaSets[p].obs = el.value;
}

function renderCorteMedidasPanel(area) {
  if (!area) return;
  _saveMedidasFromDOM();  // preservar valores escritos antes de limpiar
  area.innerHTML = "";
  area.style.display = "block";

  var qty  = state.qty;
  var base = getDimBase();
  var maxW = base ? Math.floor(base.w / 10) : 999;
  var maxH = base ? Math.floor(base.h / 10) : 999;

  var notices = document.createElement("div");
  notices.innerHTML =
    '<div class="pp-notice" style="margin-top:0;margin-bottom:8px;background:rgba(229,39,39,0.07);border-left:3px solid var(--pp-accent2);color:var(--pp-text);">' +
      'Se aplica un recargo del <strong>+10% + IVA</strong> al precio neto de esta plancha.' +
    '</div>' +
    '<div class="pp-notice" style="margin-top:0;margin-bottom:14px;">' +
      'Mínimo de corte 30×30 cm. La sierra consume 3 mm por corte.' +
    '</div>';
  area.appendChild(notices);

  var panel = document.createElement("div");
  panel.className = "pp-medidas-panel";

  syncMedidaSets(qty);
  var html = '<div class="pp-medidas-planchas">';
  for (var i = 0; i < qty; i++) {
    html += _buildPlankMedidasHTML(i, corteState.medidaSets[i], maxW, maxH, qty > 1);
  }
  html += '</div>';
  panel.innerHTML = html;

  area.appendChild(panel);
  corteState.instrucciones = buildCorteMedidasText();
}

function toggleCorte() {
  const check = document.getElementById("corteCheck");
  corteState.activo = check.checked;
  const detalle = document.getElementById("corteDetalle");
  detalle.style.display = check.checked ? "block" : "none";
  if (!check.checked) {
    corteState.modo = null;
    corteState.instrucciones = "";
    corteState.instruccionesItems = [];
    const mI = document.getElementById("corteModIguales");
    const mD = document.getElementById("corteModDistintos");
    if (mI) mI.classList.remove("active");
    if (mD) mD.classList.remove("active");
    const area = document.getElementById("corteInstruccionesArea");
    if (area) { area.innerHTML = ""; area.style.display = "none"; }
    const selector = document.getElementById("corteModoSelector");
    if (selector) selector.style.display = "block";
    updateCorteBadge();
    updateCartTotalsDisplay();
  }
  if (window._ppUpdatePrice) window._ppUpdatePrice();
}

function selectCorteMode(modo) {
  corteState.modo = modo;
  corteState.instrucciones = "";
  if (corteState.instruccionesItems.length !== cart.length) {
    corteState.instruccionesItems = cart.map(function() { return ""; });
  }
  const mI = document.getElementById("corteModIguales");
  const mD = document.getElementById("corteModDistintos");
  if (mI) mI.classList.toggle("active", modo === "iguales");
  if (mD) mD.classList.toggle("active", modo === "distintos");
  // Ocultar selector y mostrar instrucciones
  const selector = document.getElementById("corteModoSelector");
  if (selector) selector.style.display = "none";
  renderCorteTextareas();
  updateCorteBadge();
  updateCartTotalsDisplay();
  if (window._ppUpdatePrice) window._ppUpdatePrice();
}

function backToCorteMode() {
  corteState.modo = null;
  corteState.activo = false;
  corteState.instrucciones = "";
  corteState.instruccionesItems = cart.map(function() { return ""; });
  corteState.medidaSets = [];
  corteState.igualMode = "misma";
  corteState.igualItems = [];
  corteState.igualShared = { ancho: "", alto: "", qty: "", obs: "" };
  const mI = document.getElementById("corteModIguales");
  const mD = document.getElementById("corteModDistintos");
  if (mI) mI.classList.remove("active");
  if (mD) mD.classList.remove("active");
  // Limpiar selección en los nuevos botones paso 3
  ["corteOpt3Iguales","corteOpt3Distintos","corteOpt3None"].forEach(function(id) {
    var el = document.getElementById(id); if (el) el.classList.remove("active");
  });
  const selector = document.getElementById("corteModoSelector");
  if (selector) selector.style.display = "block";
  const area = document.getElementById("corteInstruccionesArea");
  if (area) { area.innerHTML = ""; area.style.display = "none"; }
  const detalle = document.getElementById("corteDetalle");
  if (detalle) detalle.style.display = "none";
  updateCorteBadge();
  updateCartTotalsDisplay();
  updatePrice();
  if (window._ppUpdatePrice) window._ppUpdatePrice();
}

function selectCorteOption(opt) {
  // Actualizar estado
  if (opt === 'none') {
    corteState.activo = false;
    corteState.modo = null;
    corteState.instrucciones = "";
    corteState.instruccionesItems = [];
  } else {
    corteState.activo = true;
    corteState.modo = opt; // 'iguales' | 'distintos'
    corteState.instrucciones = "";
    if (corteState.instruccionesItems.length !== cart.length) {
      corteState.instruccionesItems = cart.map(function() { return ""; });
    }
    if (opt === 'distintos' && corteState.modo !== 'distintos') {
      corteState.medidaSets = [];
    }
  }

  // Marcar botón activo
  ['iguales','distintos','none'].forEach(function(o) {
    var el = document.getElementById('corteOpt3' + o.charAt(0).toUpperCase() + o.slice(1));
    if (el) el.classList.toggle('active', o === opt);
  });

  // Mostrar/ocultar área de detalle e instrucciones
  var detalle = document.getElementById('corteDetalle');
  if (detalle) {
    if (opt === 'none') {
      detalle.style.display = 'none';
      var area = document.getElementById('corteInstruccionesArea');
      if (area) { area.innerHTML = ''; area.style.display = 'none'; }
    } else {
      detalle.style.display = 'block';
      renderCorteTextareas();
      // Mover el bloque justo debajo del botón clickeado (solo si el botón es visible)
      var activeBtn = document.getElementById('corteOpt3' + opt.charAt(0).toUpperCase() + opt.slice(1));
      if (activeBtn && activeBtn.parentNode && !activeBtn.closest('[aria-hidden="true"]')) {
        activeBtn.parentNode.insertBefore(detalle, activeBtn.nextSibling);
      }
    }
  }

  updateCorteBadge();
  updateCartTotalsDisplay();
  updatePrice(); // Actualizar precio en resumen (incluye recargo si es distintos)

  if (opt === 'none') {
    continueFromCorte();
  }
  // 'iguales' / 'distintos' → esperar que el usuario llene instrucciones y presione Siguiente
}

function continueFromCorte() {
  // El resumen ya está visible (paso 3). Solo actualizar precio y hacer scroll al resumen.
  updatePrice();
  var sumSection = document.getElementById('paso3SummarySection');
  if (sumSection) {
    setTimeout(function() { sumSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, 80);
  }
}

function onCorteInput() {
  const el = document.getElementById("corteInstrucciones");
  if (el) corteState.instrucciones = el.value;
}

function onCorteItemInput(el) {
  const idx = parseInt(el.dataset.itemIdx);
  if (!isNaN(idx)) corteState.instruccionesItems[idx] = el.value;
}

function updateCartTotalsDisplay() {
  // No sobreescribir el total cuando el modal está abierto (lo gestiona el live preview IIFE)
  const modalOpen = document.getElementById("configuratorModal")?.classList.contains("open");
  if (modalOpen) return;
  // TOTAL GENERAL BRUTO = suma de Total Bruto por ítem
  const grandFinal = cart.reduce(function(s, i) {
    return s + i.price * i.qty + getItemCorteCosto(i);
  }, 0);
  const totalEl = document.getElementById("cartGrandTotal");
  if (totalEl) totalEl.textContent = fmt(grandFinal);
  const mobileBar    = document.getElementById("mobileBar");
  const mobileBarVal = document.getElementById("mobileBarPrice");
  if (mobileBar && mobileBar.classList.contains("checkout-mode") && mobileBarVal) {
    mobileBarVal.textContent = fmt(grandFinal);
  }
}

// ── Carrito multi-ítem ────────────────────────────────────
let cart = [];
document.addEventListener('ppGCItemRemoved', function(e) {
  cart = cart.filter(function(i) { return i._gid !== e.detail.gid; });
  if (window.renderCart) window.renderCart();
});
document.addEventListener('ppGCCartCleared', function() {
  cart = [];
  if (window.renderCart) window.renderCart();
});

function showToast(msg, type) {
  const t = document.getElementById("ppToast");
  if (!t) return;
  t.textContent = msg;
  t.classList.remove("pp-toast--success");
  if (type === "success") t.classList.add("pp-toast--success");
  t.classList.add("show");
  clearTimeout(window._ppToastTimer);
  window._ppToastTimer = setTimeout(() => t.classList.remove("show"), 2800);
}

// Validación inline al salir del campo
function validateFieldOnBlur(el) {
  if (!el.value || el.value.trim() === "" || el.value === "+56 ") return;
  const id = el.id;
  // Email
  if (id.includes("email")) { onEmailInput(el); return; }
  // RUT
  if (id.includes("rut")) { formatRut(el); return; }
  // Tel
  if (el.type === "tel") { onTelInput(el); return; }
  // Texto genérico
  const valid = el.value.trim().length >= 2;
  el.classList.toggle("pp-input-valid", valid);
  el.classList.toggle("pp-input-error", !valid);
}

// Toggle resumen colapsable en paso 1
function toggleStep1Summary() {
  const items = document.getElementById("step1SummaryItems");
  const btn   = document.getElementById("step1SummaryToggle");
  if (!items || !btn) return;
  const isCollapsed = items.classList.toggle("collapsed");
  btn.textContent = isCollapsed ? "Ver detalle" : "Ocultar";
}

// ── Resetea el configurador a paso 1 para agregar otra plancha ──
function resetConfigurator(doScroll) {
  state.material = ""; state.tipo = "AA"; state.dim = ""; state.color = ""; state.esp = ""; state.qty = 1;
  const priceEl = document.getElementById("stepperPrice");
  if (priceEl) priceEl.style.display = "none";
  const qtyNum = document.getElementById("qtyNum");
  if (qtyNum) qtyNum.value = "1";
  const qtyDisplay = document.getElementById("qtyDisplay");
  if (qtyDisplay) qtyDisplay.value = "1";
  // Resetear estado de corte para el nuevo ítem (cada plancha elige su propio corte)
  corteState.activo = false;
  corteState.modo = null;
  corteState.instrucciones = "";
  corteState.medidaSets = [];
  corteState.igualMode = "misma";
  corteState.igualItems = [];
  corteState.igualShared = { ancho: "", alto: "", qty: "", obs: "" };
  var corteCheck = document.getElementById("corteCheck");
  if (corteCheck) corteCheck.checked = false;
  // Resetear selección de corte en paso 3
  ["corteOpt3Iguales","corteOpt3Distintos","corteOpt3None"].forEach(function(id) {
    var el = document.getElementById(id); if (el) el.classList.remove("active");
  });
  var sumSec = document.getElementById("paso3SummarySection");
  if (sumSec) sumSec.style.display = "none";
  var corteW = document.getElementById("corteSectionWrapper");
  if (corteW) corteW.style.display = "none";
  var corteDetalle = document.getElementById("corteDetalle");
  if (corteDetalle) corteDetalle.style.display = "none";
  var corteArea = document.getElementById("corteInstruccionesArea");
  if (corteArea) { corteArea.innerHTML = ""; corteArea.style.display = "none"; }
  window._pccCalcInfo = null;
  var pInfo = document.getElementById("paso3PiezasInfo");
  if (pInfo) { pInfo.textContent = ""; pInfo.style.display = "none"; }
  var qWarn = document.getElementById("paso3QtyWarn");
  if (qWarn) qWarn.style.display = "none";
  renderStep(1);
}

function addAnotherItem() {
  resetConfigurator(true);
}

function addToCart(keepOpen) {
  const price = prices[state.tipo]?.[state.dim]?.[state.color]?.[state.esp];
  if(!price) return;
  _nudgeCancel();
  _nudgeDismissed = true;
  const _tieneCorte    = corteState.activo && (corteState.modo === "iguales" || corteState.modo === "distintos");
  const _corteMode     = _tieneCorte ? corteState.modo : null;
  const _corteMedidas  = (_tieneCorte && corteState.modo === "distintos") ? buildCorteMedidasSnapshot() : null;
  const _corteInstr    = _tieneCorte
    ? (corteState.modo === "distintos" ? buildCorteMedidasText() : buildIgualItemsText())
    : "";
  const _calcInfo = (window._pccCalcInfo && window._pccCalcInfo.Nsh === state.qty) ? window._pccCalcInfo : null;
  const _gcGid = 'gc-' + Date.now().toString(36) + Math.random().toString(36).slice(2,7);
  cart.push({ material:state.material, tipo:state.tipo, dim:state.dim, color:state.color, esp:state.esp, qty:state.qty, price, img: window._ppCardImg || colorMeta[state.color]?.img || "", tieneRecargo: corteState.activo && corteState.modo === "distintos", corteMode: _corteMode, corteInstrucciones: _corteInstr, corteMedidas: _corteMedidas, calcInfo: _calcInfo, _gid: _gcGid });
  // Carrito global
  try {
    const _gcItem = cart[cart.length - 1];
    const _gcCorte = typeof getItemCorteCosto === 'function' ? getItemCorteCosto(_gcItem) : 0;
    const _gcMatLabel = (_gcItem.material ? (materialesInfo[_gcItem.material]?.label || '') : '') || (tiposInfo[_gcItem.tipo]||{}).label || _gcItem.tipo;
    const _gcDimLabel = (dimMeta[_gcItem.dim]||{}).label || _gcItem.dim;
    const _gcColLabel = getColorLabel(_gcItem.color, _gcItem.tipo);
    typeof window.ppGlobalCartAdd === 'function' && window.ppGlobalCartAdd({
      gid: _gcGid, sku: _gcItem.tipo + '_' + _gcItem.dim + '_' + _gcItem.color + '_' + _gcItem.esp, module: 'acrilico',
      nombre: _gcMatLabel + ' · ' + _gcDimLabel + ' · ' + _gcColLabel + ' · ' + _gcItem.esp,
      qty: _gcItem.qty, precio_unit: _gcItem.price, corte_costo: _gcCorte,
      subtotal: (_gcItem.price * _gcItem.qty) + _gcCorte,
      descripcion: _gcMatLabel + ' · ' + _gcDimLabel + ' · ' + _gcColLabel + ' · ' + _gcItem.esp + ' × ' + _gcItem.qty,
      corteMode: _gcItem.corteMode || '', tieneRecargo: _gcItem.tieneRecargo || false,
      corteInstrucciones: _gcItem.corteInstrucciones || '',
      corteMedidas: _gcItem.corteMedidas || null, calcInfo: _gcItem.calcInfo || null
    });
  } catch(e) {}
  dlPush('add_to_cart', {
    currency: 'CLP',
    value: price * state.qty,
    items: [dlItem({ tipo:state.tipo, dim:state.dim, color:state.color, esp:state.esp, qty:state.qty, price: price })]
  });
  if (!keepOpen) {
    if (window.closeConfigurator) window.closeConfigurator();
    resetConfigurator(false);
    showToast("✓ Plancha agregada al pedido", "success");
  }
  renderCart();

  const mobileBtn = document.getElementById("mobileBarBtn");
  if (mobileBtn) {
    mobileBtn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg> AGREGAR`;
    mobileBtn.style.background = "";
    mobileBtn.disabled = false;
  }
}

function updateCartItemQty(i, delta) {
  if (!cart[i]) return;
  const newQty = cart[i].qty + delta;
  if (newQty < 1) { removeFromCart(i); return; }
  cart[i].qty = newQty;
  if (typeof window.ppGlobalCartAdd === 'function' && cart[i]._gid) {
    const _it = cart[i];
    const _corte = getItemCorteCosto(_it);
    const _mat = _it.material ? (materialesInfo[_it.material]?.label || '') : '';
    const _gcMatLabel = _mat || tiposInfo[_it.tipo]?.label || _it.tipo;
    const _gcDimLabel = dimMeta[_it.dim]?.label || _it.dim;
    const _gcColLabel = getColorLabel(_it.color, _it.tipo);
    window.ppGlobalCartAdd({
      gid: _it._gid, module: 'acrilico',
      nombre: _gcMatLabel + ' · ' + _gcDimLabel + ' · ' + _gcColLabel + ' · ' + _it.esp,
      qty: newQty, precio_unit: _it.price, corte_costo: _corte,
      subtotal: _it.price * newQty + _corte,
      corteMode: _it.corteMode || '', tieneRecargo: _it.tieneRecargo || false,
      corteInstrucciones: _it.corteInstrucciones || '',
      corteMedidas: _it.corteMedidas || null, calcInfo: _it.calcInfo || null
    });
  }
  renderCart();
}

function removeFromCart(i) {
  const removed = cart[i];
  if (removed) {
    dlPush('remove_from_cart', {
      currency: 'CLP',
      value: removed.price * removed.qty,
      items: [dlItem(removed, i)]
    });
  }
  cart.splice(i, 1);
  if (typeof window.ppGlobalCartRemove === 'function' && removed && removed._gid) window.ppGlobalCartRemove(removed._gid);
  renderCart();
}

function renderPageCartBar() {
  const floatBtn  = document.getElementById("floatingCart");
  const badge     = document.getElementById("floatingCartBadge");
  const drawerItems = document.getElementById("drawerCartItems");
  const drawerCount = document.getElementById("drawerCartCount");
  const drawerTotal = document.getElementById("drawerCartTotal");
  const _confOpen = document.getElementById("configuratorModal")?.classList.contains("open");

  if (!floatBtn) return;

  if (cart.length === 0) {
    floatBtn.style.display = "none";
    closeCartDrawer();
    return;
  }

  // Mostrar botón flotante solo fuera del configurador y solo si no hay carrito global
  if (window.ppGCOpen) { floatBtn.style.display = "none"; return; }
  floatBtn.style.display = _confOpen ? "none" : "flex";
  if (badge) badge.textContent = cart.length;

  // Actualizar drawer — Total = suma de Total Bruto por ítem
  let grand = 0;
  let grandFinal = 0;
  cart.forEach(function(item) {
    const sub = item.price * item.qty;
    grand += sub;
    grandFinal += sub + getItemCorteCosto(item);
  });
  if (drawerCount) drawerCount.textContent = cart.length;
  if (drawerTotal) drawerTotal.textContent = fmt(grandFinal);

  // Barra de envío gratis
  const dShipBar   = document.getElementById("drawerShippingBar");
  const dShipFill  = document.getElementById("drawerShippingFill");
  const dShipLabel = document.getElementById("drawerShippingLabel");
  if (dShipBar && dShipFill && dShipLabel) {
    dShipBar.style.display = "block";
    const pct = Math.min(100, Math.round(grand / UMBRAL_ENVIO_GRATIS * 100));
    dShipFill.style.width = pct + "%";
    if (grand >= UMBRAL_ENVIO_GRATIS) {
      dShipLabel.textContent = "🚚 Tienes despacho gratis a la RM";
      dShipLabel.className = "pp-shipping-label reached";
    } else {
      dShipLabel.textContent = "Te faltan " + fmt(UMBRAL_ENVIO_GRATIS - grand) + " para despacho gratis";
      dShipLabel.className = "pp-shipping-label";
    }
  }

  if (drawerItems) {
    drawerItems.innerHTML = "";
    cart.forEach(function(item, i) {
      const matLabel = (item.material ? materialesInfo[item.material]?.label : null) || item.tipo;
      const dimLabel = dimMeta[item.dim]?.label || item.dim;
      const colLabel = getColorLabel(item.color, item.tipo);
      const sub = item.price * item.qty;
      const itemCorte = getItemCorteCosto(item);
      const totalItem = sub + itemCorte;
      const row = document.createElement("div");
      row.className = "pp-drawer-item" + (i === cart.length - 1 ? " pp-drawer-item--new" : "");
      row.innerHTML =
        (item.img ? `<img class="pp-drawer-item-thumb" src="${item.img}" alt="">` : '<div class="pp-drawer-item-thumb"></div>') +
        `<div class="pp-drawer-item-body">
          <div class="pp-drawer-item-name">${matLabel} · ${colLabel}</div>
          <div class="pp-drawer-item-sub">${dimLabel} · ${item.esp} · ${item.qty} u.</div>
          ${item.corteMode === 'iguales' ? `<div><span class="pp-corte-pill">✂ Corte igual · GRATIS</span></div>` : ''}
          ${itemCorte > 0 ? `<div><span class="pp-corte-pill">✂ Corte a medida · +${fmt(itemCorte)}</span></div>` : ''}
          ${item.corteMode === 'distintos' && (item.corteMedidas || item.corteInstrucciones) ? (() => {
            const txt = item.corteMedidas ? formatMedidasForDisplay(item.corteMedidas, item.qty) : item.corteInstrucciones;
            return txt ? `<div style="font-size:0.62rem;color:var(--pp-muted);margin-top:2px;line-height:1.5;">${txt.split(' / ').map(l => `✂ ${l}`).join('<br>')}</div>` : '';
          })() : (item.corteMode === 'iguales' && item.corteInstrucciones ? `<div style="font-size:0.62rem;color:var(--pp-muted);margin-top:2px;font-style:italic;line-height:1.4;">"${item.corteInstrucciones}"</div>` : '')}
        </div>
        <div class="pp-drawer-item-right">
          <div class="pp-drawer-item-price">${fmt(totalItem)}</div>
          <button class="pp-drawer-item-remove" onclick="removeFromCart(${i})">Eliminar</button>
        </div>`;
      drawerItems.appendChild(row);
    });
  }
}

function renderCart() {
  const itemsEl  = document.getElementById("cartItems");
  const countEl  = document.getElementById("cartCount");
  const totalEl  = document.getElementById("cartGrandTotal");
  const emptyEl  = document.getElementById("cartEmpty");
  const corteEl  = document.getElementById("cartCorteSection");
  const footerEl = document.getElementById("cartFooter");

  // Restaurar visibilidad de items, label del total y botones de checkout
  if (itemsEl) itemsEl.style.display = "";
  const _liveLabel = document.querySelector("[data-live-label]");
  if (_liveLabel) _liveLabel.textContent = "Total pedido";
  const _entregaEl = document.getElementById("entregaEstimada");
  if (_entregaEl) _entregaEl.style.display = "";
  // shippingBar lo gestiona updateShipping(), no forzar display aquí

  const mobileBar = document.getElementById("mobileBar");
  const mobileBarLabel = mobileBar ? mobileBar.querySelector(".pp-mobile-bar-label") : null;
  const mobileBarVal   = document.getElementById("mobileBarPrice");
  const mobileBarBtn2  = document.getElementById("mobileBarBtn");

  const _modalOpen = document.getElementById("configuratorModal")?.classList.contains("open");

  if (cart.length === 0) {
    // Si el modal está abierto, el live preview se encarga de ocultar cartEmpty
    if (emptyEl)  emptyEl.style.display  = _modalOpen ? "none" : "block";
    if (footerEl) footerEl.style.display = "none";
    itemsEl.innerHTML = "";
    if (!_modalOpen) countEl.textContent = "";
    if (mobileBar) mobileBar.classList.remove("checkout-mode");
    if (mobileBarLabel) mobileBarLabel.textContent = "Precio por plancha";
    if (mobileBarBtn2) { mobileBarBtn2.onclick = addToCart; }
    renderPageCartBar();
    return;
  }

  const _firstItem = !itemsEl.children.length && cart.length === 1;
  if (emptyEl)  emptyEl.style.display  = "none";
  // Con el configurador abierto, el live preview ya muestra el item — ocultar cartItems para no duplicar
  if (itemsEl) itemsEl.style.display = _modalOpen ? "none" : "";
  if (footerEl) footerEl.style.display = "block";
  // Si el modal está abierto el contador lo actualiza updatePrice con "N + configurando"
  if (!_modalOpen) countEl.textContent = cart.length + " plancha" + (cart.length > 1 ? "s" : "");

  itemsEl.innerHTML = "";
  let grand = 0;       // suma precios base (para barra envío gratis)
  let grandFinal = 0;  // suma Total Bruto por ítem = TOTAL GENERAL BRUTO
  cart.forEach((item, i) => {
    const sub = item.price * item.qty;
    grand += sub;
    const itemCorteCosto = getItemCorteCosto(item);
    const displaySub = sub + itemCorteCosto;
    grandFinal += displaySub;
    const row = document.createElement("div");
    row.className = "pp-cart-item";
    const imgUrl   = item.img || colorMeta[item.color]?.img || "";
    const matLabel = (item.material ? materialesInfo[item.material]?.label : tiposInfo[item.tipo]?.label) || item.tipo;
    const dimLabel = dimMeta[item.dim]?.label || item.dim;
    const colLabel = getColorLabel(item.color, item.tipo);
    row.innerHTML =
      (imgUrl
        ? `<div class="pp-cart-item-thumb"><img src="${imgUrl}" alt="${colLabel}" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;display:block;"></div>`
        : `<div class="pp-cart-item-thumb"></div>`) +
      `<div class="pp-cart-item-body">` +
        `<div class="pp-cart-item-top">` +
          `<div>` +
            `<div class="pp-cart-item-name">${matLabel}</div>` +
            `<div class="pp-cart-item-sub">${dimLabel} · ${colLabel} · ${item.esp}</div>` +
            (() => {
              if (item.corteMode === 'iguales') return `<div style="margin-top:2px;"><span class="pp-corte-pill">✂ Corte igual · GRATIS${item.corteInstrucciones ? ' · ' + item.corteInstrucciones : ''}</span></div>`;
              if (item.corteMode === 'distintos') {
                const medidasTxt = item.corteMedidas ? formatMedidasForDisplay(item.corteMedidas, item.qty) : item.corteInstrucciones;
                if (!medidasTxt) return '';
                const lines = medidasTxt.split(' / ');
                return `<div class="pp-medidas-sub-detail">` + lines.map(l => `<span>✂ ${l}</span>`).join('') + `</div>`;
              }
              return '';
            })() +
          `</div>` +
          `<div class="pp-cart-item-right">` +
            `<div class="pp-cart-item-price">${fmt(displaySub)}</div>` +
            `<button class="pp-cart-item-del" onclick="removeFromCart(${i})" title="Eliminar">✕</button>` +
          `</div>` +
        `</div>` +
        (itemCorteCosto > 0
          ? `<div style="font-size:0.68rem;text-align:right;margin:-2px 0 4px;">${fmt(sub)} <span style="color:var(--pp-accent2);">+ recargo corte ${fmt(itemCorteCosto)}</span></div>`
          : '') +
        `<div class="pp-cart-item-qty-row">` +
          `<button class="pp-cart-qty-btn" onclick="updateCartItemQty(${i},-1)" aria-label="Reducir">−</button>` +
          `<span class="pp-cart-qty-val">${item.qty}</span>` +
          `<button class="pp-cart-qty-btn" onclick="updateCartItemQty(${i},1)" aria-label="Aumentar">+</button>` +
          `<span style="font-size:0.72rem;color:var(--pp-muted);">${item.qty > 1 ? item.qty + ' u. × ' + fmt(item.price) : fmt(item.price) + ' / u.'}</span>` +
        `</div>` +
      `</div>`;
    itemsEl.appendChild(row);
  });

  // Sincronizar instruccionesItems con la cantidad de ítems del carrito
  if (corteState.instruccionesItems.length !== cart.length) {
    corteState.instruccionesItems = cart.map((_, i) => corteState.instruccionesItems[i] || "");
  }
  // Si el modo era "distintos" y el carrito cambió, regenerar los textareas
  if (corteState.activo && corteState.modo === "distintos") {
    renderCorteTextareas();
  }
  updateCorteBadge();

  const _modalOpenNow = document.getElementById("configuratorModal")?.classList.contains("open");
  if (!_modalOpenNow) totalEl.textContent = fmt(grandFinal);

  // Mobile bar → modo checkout
  if (mobileBar) mobileBar.classList.add("checkout-mode");
  if (mobileBarLabel) mobileBarLabel.textContent = "Total pedido";
  if (mobileBarVal) mobileBarVal.textContent = fmt(grandFinal);
  if (mobileBarBtn2) {
    mobileBarBtn2.disabled = false;
    mobileBarBtn2.innerHTML = "IR AL PAGO →";
    mobileBarBtn2.onclick = openCheckout;
  }

  // Barra de progreso hacia envío gratis
  const shippingBar   = document.getElementById("shippingBar");
  const shippingFill  = document.getElementById("shippingFill");
  const shippingLabel = document.getElementById("shippingLabel");
  if (shippingBar && shippingFill && shippingLabel) {
    shippingBar.style.display = "block";
    const pct = Math.min(100, Math.round(grand / UMBRAL_ENVIO_GRATIS * 100));
    shippingFill.style.width = pct + "%";
    if (grand >= UMBRAL_ENVIO_GRATIS) {
      shippingLabel.textContent = "🚚 Tienes despacho gratis a la Region Metropolitana";
      shippingLabel.className = "pp-shipping-label reached";
    } else {
      const falta = UMBRAL_ENVIO_GRATIS - grand;
      shippingLabel.textContent = "Te faltan " + fmt(falta) + " para despacho gratis a la RM";
      shippingLabel.className = "pp-shipping-label";
    }
  }

  if (_firstItem) {
    dlPush('view_cart', {
      currency: 'CLP',
      value: grand,
      items: cart.map(dlItem)
    });
  }

  calcEntregaEstimada();
  renderPageCartBar();
}

// ── Checkout modal ────────────────────────────────────────
let clientType = "PN";

function setClientType(type) {
  clientType = type;
  document.getElementById("fieldsPN").style.display  = type === "PN"  ? "grid" : "none";
  document.getElementById("fieldsEMP").style.display = type === "EMP" ? "grid" : "none";
  document.getElementById("btnPN").classList.toggle("active",  type === "PN");
  document.getElementById("btnEMP").classList.toggle("active", type === "EMP");
}

// ── Validación teléfono ───────────────────────────────────
const TEL_PREFIX = '+56 ';

function onTelFocus(el) {
  if (!el.value.startsWith(TEL_PREFIX)) el.value = TEL_PREFIX;
}

function onTelKeydown(e, el) {
  const prefixLen = TEL_PREFIX.length;
  const pos = el.selectionStart;
  if ((e.key === 'Backspace' || e.key === 'Delete') && pos <= prefixLen) {
    e.preventDefault();
  }
}

function onTelInput(el) {
  let val = el.value;
  if (!val.startsWith(TEL_PREFIX)) {
    val = TEL_PREFIX + val.replace(/^\+?56\s?/, '').replace(/[^0-9]/g, '');
  }
  let digits = val.slice(TEL_PREFIX.length).replace(/[^0-9]/g, '');
  if (digits.length > 9) digits = digits.slice(0, 9);
  el.value = TEL_PREFIX + digits;
  const errEl = document.getElementById(el.id + '_err');
  const invalid = digits.length > 0 && digits.length < 9;
  const ok = digits.length === 9;
  if (errEl) errEl.style.display = invalid ? 'block' : 'none';
  el.classList.toggle('pp-input-error', invalid);
  if (ok) { el.classList.remove('pp-input-error'); el.classList.add('pp-input-valid'); }
  else { el.classList.remove('pp-input-valid'); }
}

function telIsValid(id) {
  const el = document.getElementById(id);
  if (!el) return false;
  const digits = el.value.slice(TEL_PREFIX.length).replace(/[^0-9]/g, '');
  return digits.length === 9;
}

// ── Validación email ──────────────────────────────────────
function onEmailInput(el) {
  const val = el.value.trim();
  const errEl = document.getElementById(el.id + '_err');
  const atCount = (val.match(/@/g) || []).length;
  const valid = atCount === 1 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val);
  if (val.length === 0) {
    if (errEl) errEl.style.display = 'none';
    el.classList.remove('pp-input-error', 'pp-input-valid');
  } else if (valid) {
    if (errEl) errEl.style.display = 'none';
    el.classList.remove('pp-input-error');
    el.classList.add('pp-input-valid');
  } else {
    if (errEl) errEl.style.display = 'block';
    el.classList.add('pp-input-error');
    el.classList.remove('pp-input-valid');
  }
}

function emailIsValid(id) {
  const el = document.getElementById(id);
  if (!el) return false;
  const val = el.value.trim();
  const atCount = (val.match(/@/g) || []).length;
  return atCount === 1 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val);
}

function formatRut(input) {
  let v = input.value.replace(/[^0-9kK]/g, "").toUpperCase();
  if (v.length < 2) { input.value = v; return; }
  const dv     = v.slice(-1);
  let cuerpo   = v.slice(0, -1);
  cuerpo = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  input.value = cuerpo + "-" + dv;

  // Validar solo pn_rut: cuerpo debe tener exactamente 8 dígitos, DV dígito o K
  if (input.id === "pn_rut" || input.id === "emp_rut") {
    const cuerpoDigits = cuerpo.replace(/\./g, "");
    const valid = cuerpoDigits.length === 8 && /^[0-9K]$/.test(dv);
    const empty = v.length === 0;
    const errId = input.id === "pn_rut" ? "pn_rut_err" : "emp_rut_err";
    if (errId) { const errEl = document.getElementById(errId); if (errEl) errEl.style.display = (!empty && !valid) ? "block" : "none"; }
    input.classList.toggle("pp-input-error", !empty && !valid);
    input.classList.toggle("pp-input-valid", !empty && valid);
    if (!valid) input.classList.remove("pp-input-valid");
  }
}

// ── Envío ─────────────────────────────────────────────────
const UMBRAL_ENVIO_GRATIS = 350000;
const COMUNAS_SIN_DESPACHO_GRATIS_RM = [
  "Pirque","San José de Maipo","Tiltil","Buin","Calera de Tango","Paine",
  "Melipilla","Alhué","Curacaví","María Pinto","San Pedro","Talagante",
  "Isla de Maipo","Peñaflor"
];
let selectedEntrega = null;
let currentGrand = 0;

// ── Comunas por región ────────────────────────────────────
const COMUNAS_POR_REGION = {
  RM:   ["Cerrillos","Cerro Navia","Conchalí","El Bosque","Estación Central","Huechuraba","Independencia","La Cisterna","La Florida","La Granja","La Pintana","La Reina","Las Condes","Lo Barnechea","Lo Espejo","Lo Prado","Macul","Maipú","Ñuñoa","Pedro Aguirre Cerda","Peñalolén","Providencia","Pudahuel","Quilicura","Quinta Normal","Recoleta","Renca","San Joaquín","San Miguel","San Ramón","Santiago","Vitacura","Puente Alto","Pirque","San José de Maipo","Colina","Lampa","Tiltil","San Bernardo","Buin","Calera de Tango","Paine","Melipilla","Alhué","Curacaví","María Pinto","San Pedro","Talagante","El Monte","Isla de Maipo","Padre Hurtado","Peñaflor"],
  XV:   ["Arica","Camarones","Putre","General Lagos"],
  I:    ["Iquique","Alto Hospicio","Pozo Almonte","Camiña","Colchane","Huara","Pica"],
  II:   ["Antofagasta","Mejillones","Sierra Gorda","Taltal","Calama","Ollagüe","San Pedro de Atacama","Tocopilla","María Elena"],
  III:  ["Copiapó","Caldera","Tierra Amarilla","Chañaral","Diego de Almagro","Vallenar","Alto del Carmen","Freirina","Huasco"],
  IV:   ["La Serena","Coquimbo","Andacollo","La Higuera","Paiguano","Vicuña","Illapel","Canela","Los Vilos","Salamanca","Ovalle","Combarbalá","Monte Patria","Punitaqui","Río Hurtado"],
  V:    ["Valparaíso","Casablanca","Concón","Juan Fernández","Puchuncaví","Quintero","Viña del Mar","Isla de Pascua","Los Andes","Calle Larga","Rinconada","San Esteban","La Ligua","Cabildo","Papudo","Petorca","Zapallar","Quillota","Calera","Hijuelas","La Cruz","Nogales","San Antonio","Algarrobo","Cartagena","El Quisco","El Tabo","Santo Domingo","San Felipe","Catemu","Llaillay","Panquehue","Putaendo","Santa María","Quilpué","Limache","Olmué","Villa Alemana"],
  VI:   ["Rancagua","Codegua","Coinco","Coltauco","Doñihue","Graneros","Las Cabras","Machalí","Malloa","Mostazal","Olivar","Peumo","Pichidegua","Quinta de Tilcoco","Rengo","Requínoa","San Vicente","Pichilemu","La Estrella","Litueche","Marchihue","Navidad","Paredones","San Fernando","Chépica","Chimbarongo","Lolol","Nancagua","Palmilla","Peralillo","Placilla","Pumanque","Santa Cruz"],
  VII:  ["Talca","Constitución","Curepto","Empedrado","Maule","Pelarco","Pencahue","Río Claro","San Clemente","San Rafael","Cauquenes","Chanco","Pelluhue","Curicó","Hualañé","Licantén","Molina","Rauco","Romeral","Sagrada Familia","Teno","Vichuquén","Linares","Colbún","Longaví","Parral","Retiro","San Javier","Villa Alegre","Yerbas Buenas"],
  XVI:  ["Chillán","Bulnes","Cobquecura","Coelemu","Coihueco","Chillán Viejo","El Carmen","Ninhue","Ñiquén","Pemuco","Pinto","Portezuelo","Quillón","Quirihue","Ránquil","San Carlos","San Fabián","San Ignacio","San Nicolás","Treguaco","Yungay"],
  VIII: ["Concepción","Coronel","Chiguayante","Florida","Hualpén","Hualqui","Lota","Penco","San Pedro de la Paz","Santa Juana","Talcahuano","Tomé","Lebu","Arauco","Cañete","Contulmo","Curanilahue","Los Álamos","Tirúa","Los Ángeles","Antuco","Cabrero","Laja","Mulchén","Nacimiento","Negrete","Quilaco","Quilleco","San Rosendo","Santa Bárbara","Tucapel","Yumbel","Alto Biobío"],
  IX:   ["Temuco","Carahue","Cunco","Curarrehue","Freire","Galvarino","Gorbea","Lautaro","Loncoche","Melipeuco","Nueva Imperial","Padre Las Casas","Perquenco","Pitrufquén","Pucón","Saavedra","teodoro Schmidt","Toltén","Vilcún","Villarrica","Cholchol","Angol","Collipulli","Curacautín","Ercilla","Lonquimay","Los Sauces","Lumaco","Purén","Renaico","Traiguén","Victoria"],
  XIV:  ["Valdivia","Corral","Futrono","La Unión","Lago Ranco","Lanco","Los Lagos","Máfil","Mariquina","Paillaco","Panguipulli","Río Bueno"],
  X:    ["Puerto Montt","Calbuco","Cochamó","Fresia","Frutillar","Los Muermos","Llanquihue","Maullín","Puerto Varas","Castro","Ancud","Chonchi","Curaco de Vélez","Dalcahue","Puqueldón","Queilén","Quellón","Quemchi","Quinchao","Osorno","Puerto Octay","Purranque","Puyehue","Río Negro","San Juan de la Costa","San Pablo","Chaitén","Futaleufú","Hualaihué","Palena"],
  XI:   ["Coyhaique","Lago Verde","Aysén","Cisnes","Guaitecas","Cochrane","O'Higgins","Tortel","Chile Chico","Río Ibáñez"],
  XII:  ["Punta Arenas","Laguna Blanca","Río Verde","San Gregorio","Cabo de Hornos","Antártica","Porvenir","Primavera","Timaukel","Natales","Torres del Paine"]
};

window.updateComunas = function(prefix) {
  const region = document.getElementById(prefix + "_region").value;
  const sel = document.getElementById(prefix + "_ciudad");
  sel.innerHTML = "";
  if (!region || !COMUNAS_POR_REGION[region]) {
    sel.disabled = true;
    sel.innerHTML = '<option value="">Selecciona primero la región...</option>';
    return;
  }
  sel.disabled = false;
  sel.innerHTML = '<option value="">Selecciona comuna...</option>' +
    COMUNAS_POR_REGION[region].map(c => `<option value="${c}">${c}</option>`).join("");
};

function buildEntregaOptions(grand, regionPresel) {
  var el = document.getElementById("entregaOptions");
  el.innerHTML = "";
  selectedEntrega = null;
  updateModalTotal(grand);

  ["retiroInfo","envioInfo","addressSection"].forEach(function(id) {
    var s = document.getElementById(id);
    if (s) s.style.display = "none";
  });

  var titulo = document.getElementById("entregaTitulo");
  if (titulo) titulo.style.display = "block";

  // Despacho solo si región pre-seleccionada es RM
  var esRM = regionPresel === "RM";

  var opciones = [
    {
      id:           "retiro_tienda",
      icon:         "🏪",
      label:        "Retiro en tienda",
      desc:         "Retira en nuestra bodega en Santiago · Sin costo",
      badge:        '<span class="pp-entrega-badge badge-gratis">GRATIS</span>',
      costo:        0,
      needsAddress: false,
    },
  ];

  if (esRM) {
    // Pedido >= $350.000 + RM: despacho gratis o retiro, envío propio no aplica
    opciones.push({
      id:           "despacho",
      icon:         "🚚",
      label:        "Despacho a domicilio",
      desc:         "Gratis para Región Metropolitana · 1 a 3 días hábiles",
      badge:        '<span class="pp-entrega-badge badge-gratis">GRATIS</span>',
      costo:        0,
      needsAddress: true,
    });
  } else if (!regionPresel) {
    // Sin región seleccionada (pedido < $350.000): mostrar envío propio
    opciones.push({
      id:           "envio_propio",
      icon:         "📦",
      label:        "Envío propio",
      desc:         "Coordinas tú el transporte desde nuestra bodega en Santiago",
      badge:        '<span class="pp-entrega-badge badge-propio">TÚ GESTIONAS</span>',
      costo:        0,
      needsAddress: false,
    });
  } else {
    // Región fuera de RM con pedido >= $350.000: despacho no disponible, mostrar envío propio
    opciones.push({
      id:           "envio_propio",
      icon:         "📦",
      label:        "Envío propio",
      desc:         "Coordinas tú el transporte desde nuestra bodega en Santiago",
      badge:        '<span class="pp-entrega-badge badge-propio">TÚ GESTIONAS</span>',
      costo:        0,
      needsAddress: false,
    });
  }

  opciones.forEach(function(op) {
    var div = document.createElement("div");
    div.className = "pp-entrega-opt";
    div.dataset.opId = op.id;
    div.innerHTML =
      '<span class="pp-entrega-icon">' + op.icon + '</span>' +
      '<div class="pp-entrega-info"><strong>' + op.label + '</strong><span id="desc-' + op.id + '">' + op.desc + '</span></div>' +
      op.badge;
    div.addEventListener("click", function() {
      document.querySelectorAll(".pp-entrega-opt").forEach(function(x) { x.classList.remove("selected"); });
      div.classList.add("selected");
      selectedEntrega = Object.assign({}, op);
      dlPush('add_shipping_info', { currency: 'CLP', value: currentGrand, shipping_tier: op.id, customer_type: clientType, items: cart.map(dlItem) });
      var e2 = document.getElementById("step2EntregaError"); if (e2) e2.style.display = "none";
      var wb = document.getElementById("btnWebpay"); if (wb) { wb.disabled = false; wb.style.opacity = ""; wb.style.cursor = ""; }
      showEntregaDetail(op.id, grand, regionPresel);
    });
    el.appendChild(div);
  });
}

function showEntregaDetail(id, grand, regionPresel) {
  document.getElementById("retiroInfo").style.display     = id === "retiro_tienda" ? "block" : "none";
  document.getElementById("envioInfo").style.display      = id === "envio_propio"  ? "block" : "none";
  document.getElementById("addressSection").style.display = id === "despacho"      ? "block" : "none";
  if (id === "despacho") {
    // Leer región/comuna desde paso 1 (ya ingresadas)
    var step1CiudadId = (typeof clientType !== "undefined" && clientType === "EMP") ? "emp_ciudad" : "pn_bill_ciudad";
    var comunaPresel = document.getElementById(step1CiudadId)?.value || "";

    // Ocultar siempre los selectores de región/comuna en el formulario de despacho
    var regionComunaGroup = document.getElementById("pn_regionComunaGroup");
    if (regionComunaGroup) regionComunaGroup.style.display = "none";

    // Pre-poblar campos ocultos pn_region / pn_ciudad con los valores del paso 1
    var reg = document.getElementById("pn_region");
    if (reg) reg.value = regionPresel || "";
    var com = document.getElementById("pn_ciudad");
    if (regionPresel) {
      updateComunas("pn");
      if (comunaPresel && com) com.value = comunaPresel;
    } else {
      if (com) { com.innerHTML = '<option value="">Selecciona primero la región...</option>'; com.disabled = true; }
    }
    // Pre-poblar dirección desde paso 1 (editable si el despacho es a otra dirección)
    var step1DirId = (typeof clientType !== "undefined" && clientType === "EMP") ? "emp_dir" : "pn_bill_dir";
    var step1Dir = document.getElementById(step1DirId)?.value.trim() || "";
    var dir = document.getElementById("pn_dir");
    if (dir) dir.value = step1Dir;
  }
  updateModalTotal(grand);
}

function recalcDespacho() {
  if (!selectedEntrega || !selectedEntrega.needsAddress) return;
  var region = document.getElementById("pn_region").value;
  var comuna = document.getElementById("pn_ciudad").value;
  var descEl = document.getElementById("desc-despacho");
  if (!region) return;
  if (region === "RM") {
    var comunaExcluida = comuna && COMUNAS_SIN_DESPACHO_GRATIS_RM.some(function(c) {
      return c.toLowerCase() === comuna.toLowerCase();
    });
    if (comunaExcluida) {
      if (descEl) descEl.textContent = "⚠️ El despacho gratis no aplica para tu comuna. Usa Retiro en tienda o Envío propio.";
    } else {
      if (descEl) descEl.textContent = "Despacho gratis · Región Metropolitana · 1–3 días hábiles";
    }
    selectedEntrega.costo = 0;
  } else {
    if (descEl) descEl.textContent = "⚠️ Despacho gratis solo para Región Metropolitana. Para otras regiones usa Envío Propio.";
    selectedEntrega.costo = 0;
  }
  updateModalTotal(currentGrand);
}

function checkEntregaVisibility() {} // mantenida por compatibilidad

function resetEntregaUI() {
  document.getElementById("entregaOptions").innerHTML = "";
  document.getElementById("addressSection").style.display    = "none";
  document.getElementById("retiroInfo").style.display        = "none";
  document.getElementById("envioInfo").style.display         = "none";
  document.getElementById("despachoGratisHeader").style.display = "none";
  var wb = document.getElementById("btnWebpay"); if (wb) { wb.disabled = true; wb.style.opacity = "0.5"; wb.style.cursor = "not-allowed"; }
  document.getElementById("entregaTitulo").style.display     = "none";
  var rcg = document.getElementById("pn_regionComunaGroup");
  if (rcg) rcg.style.display = "";
  selectedEntrega = null;
  updateModalTotal(currentGrand);
}

function onRegionPreCheck() {
  var region = document.getElementById("regionPreCheck").value;
  var msg = document.getElementById("regionNoDespachoMsg");
  var comunaCheck = document.getElementById("comunaCheck");
  var comunaMsg = document.getElementById("comunaExcluidaMsg");
  resetEntregaUI();
  if (comunaMsg) comunaMsg.style.display = "none";

  if (!region) {
    if (msg) msg.style.display = "none";
    if (comunaCheck) comunaCheck.style.display = "none";
    return;
  }

  if (region !== "RM") {
    if (msg) msg.style.display = "block";
    if (comunaCheck) comunaCheck.style.display = "none";
    document.getElementById("entregaTitulo").style.display = "block";
    buildEntregaOptions(currentGrand, region);
  } else {
    if (msg) msg.style.display = "none";
    if (comunaCheck) {
      var sel = document.getElementById("comunaPreCheck");
      sel.innerHTML = '<option value="">Selecciona tu comuna...</option>' +
        COMUNAS_POR_REGION["RM"].map(function(c) { return '<option value="' + c + '">' + c + '</option>'; }).join("");
      comunaCheck.style.display = "block";
    }
  }
}

function onComunaPreCheck() {
  var comuna = document.getElementById("comunaPreCheck").value;
  var comunaMsg = document.getElementById("comunaExcluidaMsg");
  resetEntregaUI();

  if (!comuna) {
    if (comunaMsg) comunaMsg.style.display = "none";
    return;
  }

  var excluida = COMUNAS_SIN_DESPACHO_GRATIS_RM.some(function(c) {
    return c.toLowerCase() === comuna.toLowerCase();
  });

  if (excluida) {
    if (comunaMsg) comunaMsg.style.display = "block";
    document.getElementById("entregaTitulo").style.display = "block";
    buildEntregaOptions(currentGrand, null);
  } else {
    if (comunaMsg) comunaMsg.style.display = "none";
    document.getElementById("entregaTitulo").style.display = "block";
    buildEntregaOptions(currentGrand, "RM");
  }
}

function updateModalTotal(grand) {
  const total = grand + (selectedEntrega?.costo || 0);
  document.getElementById("modalTotal").textContent = fmt(total);
}

function buildOrderSummary() {
  const itemsEl = document.getElementById("modalOrderItems");
  itemsEl.innerHTML = "";
  let grand = 0;      // suma precios base
  let grandFinal = 0; // TOTAL GENERAL BRUTO = suma de Total Bruto por ítem
  let totalCorteCosto = 0; // suma de recargos brutos (para mostrar en fila de corte)
  cart.forEach(item => {
    const sub = item.price * item.qty;
    grand += sub;
    const itemCorteCosto = getItemCorteCosto(item);
    totalCorteCosto += itemCorteCosto;
    grandFinal += sub + itemCorteCosto;
    const row = document.createElement("div");
    row.className = "pp-modal-order-item";
    const totalItem = sub + itemCorteCosto;
    const corteLabel = item.corteMode === 'iguales'
      ? `<br><span style="font-size:0.72em;color:#34a853;">✂ Corte igual (GRATIS)${item.corteInstrucciones ? ' · <em>' + item.corteInstrucciones + '</em>' : ''}</span>`
      : (itemCorteCosto > 0
        ? (() => {
            const medidasTxt = item.corteMedidas ? formatMedidasForDisplay(item.corteMedidas, item.qty) : item.corteInstrucciones;
            const medidasLines = medidasTxt ? medidasTxt.split(' / ').map(l => `<em style="font-size:0.95em;color:#666;">✂ ${l}</em>`).join('<br>') : '';
            return `<br><span style="font-size:0.72em;color:#888;">${fmt(sub)} + <span style="color:#e52727;">recargo corte ${fmt(itemCorteCosto)}</span>${medidasLines ? '<br>' + medidasLines : ''}</span>`;
          })()
        : '');
    row.innerHTML =
      `<span class="desc">` +
        `${(item.material ? materialesInfo[item.material]?.label : tiposInfo[item.tipo]?.label) || item.tipo} · ${dimMeta[item.dim]?.label} · ${getColorLabel(item.color, item.tipo)} · ${item.esp} × ${item.qty}` +
        corteLabel +
      `</span>` +
      `<span class="monto"${itemCorteCosto > 0 ? ' style="color:var(--pp-green);"' : ''}>${fmt(totalItem)}</span>`;
    itemsEl.appendChild(row);
  });
  return grandFinal;
}

function goToStep1() {
  document.getElementById("checkoutStep1").style.display = "block";
  document.getElementById("checkoutStep2").style.display = "none";
  document.getElementById("stepDot1").classList.add("active");
  document.getElementById("stepDot1").classList.remove("done");
  document.getElementById("stepDot2").classList.remove("active");
  document.getElementById("stepLine").classList.remove("done");
}

function goToStep2() {
  const fields = clientType === "PN"
    ? ["pn_nombre","pn_rut","pn_email","pn_tel","pn_bill_dir","pn_bill_region","pn_bill_ciudad"]
    : ["emp_rut","emp_razon","emp_giro","emp_tel","emp_email","emp_dir","emp_region","emp_ciudad"];

  const isFieldEmpty = (id) => {
    const el = document.getElementById(id);
    if (!el) return true;
    return el.value.trim().length === 0 || el.value.trim() === TEL_PREFIX;
  };

  const camposVacios = fields.some(isFieldEmpty);
  const errEl = document.getElementById("step1FormError");
  if (camposVacios) {
    if (errEl) { errEl.textContent = "Completa todos los campos obligatorios (*) antes de continuar."; errEl.style.display = "block"; errEl.scrollIntoView({ behavior: "smooth", block: "center" }); }
    fields.forEach(id => { const el = document.getElementById(id); if (el && isFieldEmpty(id)) el.classList.add("pp-input-error"); });
    // Scroll al primer campo vacío
    const primerVacio = fields.find(isFieldEmpty);
    if (primerVacio) { const el = document.getElementById(primerVacio); if (el) el.scrollIntoView({ behavior: "smooth", block: "center" }); }
    return;
  }
  if (errEl) errEl.style.display = "none";

  const emailId = clientType === "PN" ? "pn_email" : "emp_email";
  const telId   = clientType === "PN" ? "pn_tel"   : "emp_tel";

  // Validar formato RUT (PN y EMP)
  const rutId  = clientType === "PN" ? "pn_rut" : "emp_rut";
  const rutErrId = clientType === "PN" ? "pn_rut_err" : "emp_rut_err";
  const rutEl  = document.getElementById(rutId);
  const rawRut = rutEl ? rutEl.value.replace(/[^0-9kK]/g, "").toUpperCase() : "";
  const rutDv  = rawRut.slice(-1);
  const rutCuerpo = rawRut.slice(0, -1);
  const rutOk = rutCuerpo.length === 8 && /^[0-9K]$/.test(rutDv);
  if (!rutOk) {
    if (rutErrId) document.getElementById(rutErrId).style.display = "block";
    rutEl.classList.add("pp-input-error");
    rutEl.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }

  if (!emailIsValid(emailId)) {
    const errEl = document.getElementById(emailId + '_err');
    if (errEl) errEl.style.display = 'block';
    document.getElementById(emailId).classList.add('pp-input-error');
    document.getElementById(emailId).scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  if (!telIsValid(telId)) {
    const errEl = document.getElementById(telId + '_err');
    if (errEl) errEl.style.display = 'block';
    document.getElementById(telId).classList.add('pp-input-error');
    document.getElementById(telId).scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  document.getElementById("checkoutStep1").style.display = "none";
  document.getElementById("checkoutStep2").style.display = "block";
  document.getElementById("stepDot1").classList.remove("active");
  document.getElementById("stepDot1").classList.add("done");
  document.getElementById("stepDot2").classList.add("active");
  document.getElementById("stepLine").classList.add("done");

  selectedEntrega = null;
  document.getElementById("addressSection").style.display = "none";
  document.getElementById("retiroInfo").style.display     = "none";
  document.getElementById("envioInfo").style.display      = "none";
  document.getElementById("entregaOptions").innerHTML     = "";
  document.getElementById("entregaTitulo").style.display  = "none";

  // La región/comuna ya fueron ingresadas en paso 1 — no preguntar de nuevo
  document.getElementById("regionCheck").style.display = "none";
  document.getElementById("despachoGratisHeader").style.display = "none";

  var step1Region = clientType === "EMP"
    ? (document.getElementById("emp_region")?.value || "")
    : (document.getElementById("pn_bill_region")?.value || "");
  var step1Ciudad = clientType === "EMP"
    ? (document.getElementById("emp_ciudad")?.value || "")
    : (document.getElementById("pn_bill_ciudad")?.value || "");

  var regionForOptions = null;
  if (currentGrand >= UMBRAL_ENVIO_GRATIS) {
    if (step1Region === "RM") {
      var comunaExcluidaStep1 = step1Ciudad && COMUNAS_SIN_DESPACHO_GRATIS_RM.some(function(c) {
        return c.toLowerCase() === step1Ciudad.toLowerCase();
      });
      regionForOptions = comunaExcluidaStep1 ? null : "RM";
    } else {
      regionForOptions = step1Region || null;
    }
  }

  buildEntregaOptions(currentGrand, regionForOptions);
  document.getElementById("entregaTitulo").style.display = "block";
  updateModalTotal(currentGrand);
}

function openCheckout() {
  // Si el configurador está abierto con una selección completa, agregarla al carrito primero
  const _confOpen = document.getElementById("configuratorModal")?.classList.contains("open");
  if (_confOpen) {
    const _pendingPrice = prices[state.tipo]?.[state.dim]?.[state.color]?.[state.esp];
    if (_pendingPrice) {
      cart = cart.filter(function(item) {
        return !(item.tipo === state.tipo && item.dim === state.dim && item.color === state.color && item.esp === state.esp);
      });
      addToCart(true);
    } else {
      if (window.closeConfigurator) window.closeConfigurator();
    }
  }
  if (cart.length === 0) return;
  currentGrand = buildOrderSummary();
  dlPush('begin_checkout', { currency: 'CLP', value: currentGrand, customer_type: clientType, items: cart.map(dlItem) });
  if (window.ppGCOpenCheckout) { window.ppGCOpenCheckout(); return; }
  if (window.ppGCOpen) { window.ppGCOpen(); return; }
  // fallback: checkout local
  selectedEntrega = null;
  updateModalTotal(currentGrand);
  // Llenar mini resumen "Tu pedido" del paso 1
  (function() {
    var si = document.getElementById("step1SummaryItems");
    var st = document.getElementById("step1SummaryTotal");
    if (si) {
      si.innerHTML = cart.map(function(item) {
        var matLabel = (item.material ? (materialesInfo[item.material]?.label || '') : '') || (tiposInfo[item.tipo]||{}).label || item.tipo;
        var dimLabel = (dimMeta[item.dim]||{}).label || item.dim;
        var colLabel = getColorLabel(item.color, item.tipo);
        var corteCosto = getItemCorteCosto(item);
        var subtotal = item.price * item.qty + corteCosto;
        return '<div style="margin-bottom:6px;">' +
          '<span style="font-size:0.85em;">' + matLabel + ' · ' + dimLabel + ' · ' + colLabel + ' · ' + item.esp + ' × ' + item.qty + '</span><br>' +
          '<strong style="color:#004a99;">' + fmt(subtotal) + '</strong>' +
        '</div>';
      }).join('');
    }
    if (st) st.textContent = fmt(currentGrand);
  })();
  goToStep1();
  document.getElementById("checkoutModal").classList.add("open");
  document.body.style.overflow = "hidden";
  history.pushState({ppModal:'checkout'}, '');
}

function closeCheckout() {
  document.getElementById("checkoutModal").classList.remove("open");
  document.body.style.overflow = "";
  if (!window._ppInPopstate && window.history.state && window.history.state.ppModal === 'checkout') {
    window._ppSkipPopstate = true;
    window.history.go(-1);
  }
}

// Cerrar modal al hacer click fuera
document.addEventListener("click", function(e) {
  if(e.target && e.target.id === "checkoutModal") closeCheckout();
});

function getCheckoutData() {
  // Dirección de despacho (paso 2, solo si se elige despacho a domicilio)
  const dir    = document.getElementById("pn_dir")?.value.trim()    || "";
  const ciudad = document.getElementById("pn_ciudad")?.value.trim() || "";
  const region = document.getElementById("pn_region")?.value        || "";

  if(clientType === "PN") {
    return {
      tipo:        "Persona Natural",
      nombre:      document.getElementById("pn_nombre").value.trim(),
      rut:         document.getElementById("pn_rut").value.trim(),
      email:       document.getElementById("pn_email").value.trim(),
      tel:         document.getElementById("pn_tel").value.trim(),
      dir_factura: document.getElementById("pn_bill_dir")?.value.trim()    || "",
      region_factura: document.getElementById("pn_bill_region")?.value     || "",
      ciudad_factura: document.getElementById("pn_bill_ciudad")?.value.trim() || "",
      dir, ciudad, region,
    };
  } else {
    return {
      tipo:            "Empresa",
      rut:             document.getElementById("emp_rut").value.trim(),
      razon:           document.getElementById("emp_razon").value.trim(),
      giro:            document.getElementById("emp_giro").value.trim(),
      tel:             document.getElementById("emp_tel").value.trim(),
      email:           document.getElementById("emp_email").value.trim(),
      dir:             document.getElementById("emp_dir").value.trim(),
      region:          document.getElementById("emp_region")?.value      || "",
      ciudad:          document.getElementById("emp_ciudad")?.value.trim() || "",
      // Dirección de despacho (paso 2, solo si se elige despacho a domicilio)
      dir_despacho:    dir,
      region_despacho: region,
      ciudad_despacho: ciudad,
    };
  }
}

function validateCheckout(data) {
  const personalRequired = clientType === "PN"
    ? ["nombre","rut","email","tel","dir_factura","region_factura","ciudad_factura"]
    : ["rut","razon","giro","tel","email","dir","region","ciudad"];
  if (!personalRequired.every(k => data[k] && data[k].length > 0)) return false;
  if (!selectedEntrega) return false;
  if (selectedEntrega.needsAddress) {
    // pn_dir/pn_region/pn_ciudad son siempre los campos de despacho (PN y EMP)
    const deliveryDir    = document.getElementById("pn_dir")?.value.trim()    || "";
    const deliveryRegion = document.getElementById("pn_region")?.value         || "";
    const deliveryCiudad = document.getElementById("pn_ciudad")?.value.trim() || "";
    if (!deliveryDir || !deliveryRegion || !deliveryCiudad) return false;
    if (deliveryRegion !== "RM") {
      alert("El despacho a domicilio gratis es solo para la Region Metropolitana.\nPara otras regiones selecciona 'Envio propio'.");
      return false;
    }
  }
  return true;
}

// ── Modo prueba: registra en Supabase pero no llama a Webpay ──
const MODO_PRUEBA = false;

async function submitCheckout() {
  const client = getCheckoutData();
  if(!validateCheckout(client)) {
    const e2 = document.getElementById("step2EntregaError");
    if (e2) { e2.textContent = "Completa todos los campos antes de continuar."; e2.style.display = "block"; e2.scrollIntoView({ behavior: "smooth", block: "center" }); }
    return;
  }
  if(!selectedEntrega) {
    const e2 = document.getElementById("step2EntregaError");
    if (e2) { e2.style.display = "block"; e2.scrollIntoView({ behavior: "smooth", block: "center" }); }
    return;
  }

  // Validar medidas / instrucciones de corte por ítem
  const itemsSinInstrucciones = cart.filter(i => i.corteMode && !(i.corteInstrucciones || "").trim());
  if (itemsSinInstrucciones.length > 0) {
    const e2 = document.getElementById("step2EntregaError");
    const nombres = itemsSinInstrucciones.map(i => (i.material ? materialesInfo[i.material]?.label : null) || i.tipo).join(', ');
    if (e2) {
      const hasMedidas = itemsSinInstrucciones.some(i => i.corteMode === 'distintos');
      e2.textContent = hasMedidas
        ? `Falta indicar las medidas de corte para: ${nombres}. Vuelve al configurador, ingresa el ancho y alto antes de continuar.`
        : `Falta indicar instrucciones de corte para: ${nombres}. Vuelve al configurador y escribe las instrucciones antes de pagar.`;
      e2.style.display = "block";
      e2.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    return;
  }

  // TOTAL GENERAL BRUTO = suma de Total Bruto por ítem
  let _productBase = 0;
  let _totalCorteCosto = 0;
  cart.forEach(i => {
    _productBase += i.price * i.qty;
    _totalCorteCosto += getItemCorteCosto(i);
  });
  const corteCosto = _totalCorteCosto;
  const grand = _productBase + _totalCorteCosto;
  const total = grand + (selectedEntrega.costo || 0);
  const btn   = document.getElementById("btnWebpay");
  btn.disabled = true;
  btn.textContent = "Procesando...";
  dlPush('add_payment_info', { currency: 'CLP', value: total, payment_type: 'Webpay', customer_type: clientType, items: cart.map(dlItem) });

  // ── Preparar datos del pedido para registrar en CRM tras el pago ──
  var _orderItems = cart.map(function(i) {
    return {
      tipo:    (i.material ? materialesInfo[i.material]?.label : null) || (tiposInfo[i.tipo]||{}).label||i.tipo,
      dim:     (dimMeta[i.dim]||{}).label||i.dim,
      color:   getColorLabel(i.color, i.tipo),
      espesor: i.esp,
      qty:     i.qty,
      precio:  i.price,
      corteMode:          i.corteMode          || null,
      corteInstrucciones: i.corteInstrucciones || '',
      corteMedidas:       i.corteMedidas       || null,
      calcInfo:           i.calcInfo           || null
    };
  });
  var _resumen = cart.map(function(i, idx) {
    const label = (i.material ? materialesInfo[i.material]?.label : null) || (tiposInfo[i.tipo]||{}).label || i.tipo;
    const line = '• ' + label + ' · ' + (dimMeta[i.dim]?.label||i.dim) + ' · ' + getColorLabel(i.color, i.tipo) + ' · ' + i.esp + ' × ' + i.qty + ' → $' + (i.price * i.qty).toLocaleString('es-CL');
    const corte = i.corteMode === 'iguales'
      ? '  Corte igual (GRATIS)' + (i.corteInstrucciones ? ': ' + i.corteInstrucciones : '')
      : (i.tieneRecargo
        ? (() => {
            const medidasTxt = i.corteMedidas ? formatMedidasForDisplay(i.corteMedidas, i.qty) : i.corteInstrucciones;
            return '  Corte a medida (+' + fmt(getItemCorteCosto(i)) + ')' + (medidasTxt ? ': ' + medidasTxt : '');
          })()
        : '');
    return corte ? line + '\n' + corte : line;
  }).join('\n');
  var _convId = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2);
  var _shortId = 'PP-' + _convId.split('-').pop().substring(0,5).toUpperCase();

  if (MODO_PRUEBA) {
    // Registra el pedido en Supabase y Google Sheets igual que tras un pago real
    try {
      var _corteActivo = cart.some(function(i){ return !!i.corteMode; });
      var _corteInstrText = cart.filter(function(i){ return i.corteInstrucciones; }).map(function(i,n){ return 'Ítem '+(n+1)+': '+i.corteInstrucciones; }).join(' | ');
      var _corteItemsList = cart.map(function(i){ return { corteMode: i.corteMode||null, instrucciones: i.corteInstrucciones||'', corteMedidas: i.corteMedidas||null }; });
      var _sb = window.supabase.createClient(window.POLYPLAS_CONFIG.SUPABASE_URL, window.POLYPLAS_CONFIG.SUPABASE_ANON_KEY);
      await _sb.from('conversations').insert({
        id:              _convId,
        client_name:     client.nombre || client.razon || '',
        client_email:    client.email  || '',
        unread_count:    1,
        last_message_at: new Date().toISOString(),
        metadata: {
          source:         'order',
          tipo_cliente:   client.tipo           || '',
          nombre:         client.nombre         || '',
          razon_social:   client.razon          || '',
          rut:            client.rut            || '',
          giro:           client.giro           || '',
          email:          client.email          || '',
          phone:          client.tel            || '',
          dir:            client.dir            || client.dir_factura || '',
          ciudad:         client.ciudad         || client.ciudad_factura || '',
          region:         client.region         || client.region_factura || '',
          dir_factura:    client.dir_factura    || '',
          ciudad_factura: client.ciudad_factura || '',
          region_factura: client.region_factura || '',
          entrega:        selectedEntrega.label,
          total:          total,
          items:          _orderItems,
          corte:          _corteActivo ? (_corteInstrText || 'Sin instrucciones') : null,
          corteItems:     _corteItemsList,
          webpay_orden:   'PRUEBA-' + _shortId,
          webpay_auth:    'MODO_PRUEBA',
        }
      });
      var _scriptURL = 'https://script.google.com/macros/s/AKfycbw4WkE3slUjbDIUrbYVZD-aL1nB6WWJeyj6XG6rpFNz9p3pSFfdmUd3FjY_hV-QQJNkKA/exec';
      var _msgText = '🛒 PEDIDO WEB [PRUEBA]\n─────────────────\n' + _resumen + '\n─────────────────\nEntrega: ' + selectedEntrega.label + '   Total: $' + total.toLocaleString('es-CL') + '\n─────────────────\nCliente: ' + (client.nombre||client.razon) + '  RUT: ' + client.rut + '\nEmail: ' + client.email + '  Tel: ' + client.tel + '\nDirección: ' + client.dir + ', ' + client.ciudad + ', ' + client.region;
      _sb.from('messages').insert({ conversation_id: _convId, sender: 'client', content: _msgText });
      fetch(_scriptURL + '?' + new URLSearchParams({ accion:'pedido_web', idRef:_shortId, nombre:client.nombre||client.razon||'', email:client.email||'', telefono:client.tel||'', monto:String(total), vendido:'Sí', observaciones:_resumen+' | Entrega:'+selectedEntrega.label }).toString(), { mode:'no-cors' });
      cart.length = 0; renderCart();
    } catch(eP) { console.error('MODO_PRUEBA Supabase error:', eP); }
    btn.disabled = false;
    btn.textContent = "PAGAR CON WEBPAY PLUS";
    closeCheckout();
    alert('✅ PEDIDO DE PRUEBA REGISTRADO\n\nID: ' + _shortId + '\nTotal: $' + total.toLocaleString('es-CL') + '\nCliente: ' + (client.nombre || client.razon) + '\n\nRevisa el CRM — el pedido aparece como "PRUEBA-' + _shortId + '"');
    return;
  }

  try {
    // Convertir SVGs del diagrama de corte a PNG base64 en el browser
    const _svgToPngB64 = (svgStr) => new Promise(resolve => {
      const m = svgStr.match(/viewBox=["']0 0 ([\d.]+)[ \t]+([\d.]+)/);
      const vw = m ? parseFloat(m[1]) : 800, vh = m ? parseFloat(m[2]) : 400;
      const sc = 800 / Math.max(vw, vh);
      const cw = Math.max(100, Math.round(vw * sc)), ch = Math.max(50, Math.round(vh * sc));
      // Eliminar style="width:100%..." del <svg> para que width/height explícitos tengan efecto
      const svgClean = svgStr.replace(/(<svg\b[^>]*?) style="[^"]*"/g, '$1');
      const svg2 = svgClean.replace('<svg ', '<svg width="' + cw + '" height="' + ch + '" ');
      // Usar data: URL en lugar de blob: para evitar bloqueos de CSP
      const dataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg2);
      const img  = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = cw; canvas.height = ch;
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, cw, ch);
          ctx.drawImage(img, 0, 0, cw, ch);
          resolve(canvas.toDataURL('image/png').split(',')[1]);
        } catch(e) { resolve(null); }
      };
      img.onerror = () => resolve(null);
      img.src = dataUrl;
    });
    const _cartPngsB64 = await Promise.all(cart.map(async i => {
      if (!i.calcInfo || !Array.isArray(i.calcInfo.svgs) || !i.calcInfo.svgs.length) return [];
      const pngs = await Promise.all(i.calcInfo.svgs.map(svg => _svgToPngB64(svg)));
      return pngs.filter(Boolean);
    }));

    // ← Este endpoint lo creas en WordPress con el snippet PHP
    const res = await fetch("/wp-json/polyplas/v1/webpay-init", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        total:       Math.round(total),
        entrega:     selectedEntrega.label,
        client:      client,
        return_page: window.location.origin + '/gracias/', // ← URL de la página de gracias (ajustar al slug real)
        items:       cart.map((i, _ci) => ({
          tipo:    (i.material ? materialesInfo[i.material]?.label : tiposInfo[i.tipo]?.label) || i.tipo,
          dim:     dimMeta[i.dim]?.label,
          dimKey:  i.dim,
          color:   getColorLabel(i.color, i.tipo),
          espesor: i.esp,
          qty:     i.qty,
          precio:  i.price,
          corteMode:          i.corteMode          || null,
          corteInstrucciones: i.corteInstrucciones  || '',
          corteMedidas:       i.corteMedidas        || null,
          calcInfo:           i.calcInfo ? Object.assign({}, i.calcInfo, { pngsB64: _cartPngsB64[_ci] || [] }) : null,
        })),
      }),
    });

    const data = await res.json();
    if(!data.token || !data.url) throw new Error("Respuesta inválida");

    // Redirigir a Webpay Plus
    const form = document.createElement("form");
    form.method = "POST";
    form.action = data.url;
    const input = document.createElement("input");
    input.type  = "hidden";
    input.name  = "token_ws";
    input.value = data.token;
    form.appendChild(input);
    document.body.appendChild(form);
    // Persistir carrito para el evento purchase al volver de Webpay
    try {
      sessionStorage.setItem('pp_cart_dl',  JSON.stringify(cart.map(dlItem)));
      sessionStorage.setItem('pp_total_dl', String(total));
      sessionStorage.setItem('pp_acrilico_customer_type', clientType);
      sessionStorage.setItem('pp_acrilico_order_data', JSON.stringify({
        client:             client,
        orderItems:         _orderItems,
        resumen:            _resumen,
        convId:             _convId,
        shortId:            _shortId,
        entregaLabel:       selectedEntrega.label,
        corteActivo:              cart.some(i => !!i.corteMode),
        corteModo:                cart.some(i => i.tieneRecargo) ? 'distintos' : (cart.some(i => i.corteMode === 'iguales') ? 'iguales' : null),
        corteInstrucciones:       cart.filter(i => i.corteInstrucciones).map((i,n) => 'Ítem ' + (n+1) + ': ' + i.corteInstrucciones).join(' | '),
        corteItems:               cart.map(i => ({ corteMode: i.corteMode || null, instrucciones: i.corteInstrucciones || '', corteMedidas: i.corteMedidas || null })),
        corteCosto:               corteCosto,
        total:              total
      }));
    } catch(e) {}
    form.submit();

  } catch(e) {
    btn.disabled = false;
    btn.textContent = "PAGAR CON WEBPAY PLUS";
    alert("Error al conectar con Webpay. Por favor intenta de nuevo.");
  }
}

// ── Carrito flotante: drawer ───────────────────────────────
function toggleCartDrawer() {
  const drawer  = document.getElementById("cartDrawer");
  const overlay = document.getElementById("cartDrawerOverlay");
  if (!drawer) return;
  const isOpen = drawer.classList.contains("open");
  if (isOpen) {
    drawer.classList.remove("open");
    overlay.classList.remove("open");
  } else {
    if (window.ppGCOpen) { window.ppGCOpen(); return; }
    renderPageCartBar(); // refrescar contenido antes de abrir
    drawer.classList.add("open");
    overlay.classList.add("open");
  }
}

function closeCartDrawer() {
  const drawer  = document.getElementById("cartDrawer");
  const overlay = document.getElementById("cartDrawerOverlay");
  if (drawer)  drawer.classList.remove("open");
  if (overlay) overlay.classList.remove("open");
}

function openCartDrawer() {
  if (window.ppGCOpen) { window.ppGCOpen(); return; }
  renderPageCartBar();
  const drawer  = document.getElementById("cartDrawer");
  const overlay = document.getElementById("cartDrawerOverlay");
  if (drawer)  drawer.classList.add("open");
  if (overlay) overlay.classList.add("open");
}

function addToCartAndShowDrawer() {
  addToCart();
  setTimeout(function() { if (window.closeConfigurator) window.closeConfigurator(); }, 80);
}


// ── Exponer funciones globales para los onclick del HTML ───
window._ppState               = state;
window._ppMatInfo             = materialesInfo;
window._ppPrices              = prices;
window._ppDimMeta             = dimMeta;
window._ppAllEsp              = allEspesores;
window._ppColorMeta           = colorMeta;
window._ppOutOfStock          = outOfStock;
window.changeQty              = changeQty;
window.onQtyInput             = onQtyInput;
window.addToCart              = addToCart;
window.removeFromCart         = removeFromCart;
window.updateCartItemQty      = updateCartItemQty;
window.openCheckout           = openCheckout;
window.openCheckout._gc       = true; // evita que ppGCUnify lo pise
window.closeCheckout          = closeCheckout;
window.toggleCartDrawer       = toggleCartDrawer;
window.closeCartDrawer        = closeCartDrawer;
window.openCartDrawer         = openCartDrawer;
window.addToCartAndShowDrawer = addToCartAndShowDrawer;
window.setClientType          = setClientType;
window.goToStep               = goToStep;
window.goToStep1              = goToStep1;
window.goToStep2              = goToStep2;
window.toggleStep1Summary     = toggleStep1Summary;
window.validateFieldOnBlur    = validateFieldOnBlur;
window.recalcDespacho         = recalcDespacho;
window.showEntregaDetail      = showEntregaDetail;
window.checkEntregaVisibility = checkEntregaVisibility;
window.formatRut              = formatRut;
window.submitCheckout         = submitCheckout;
window.checkEntregaVisibility = checkEntregaVisibility;
window.onRegionPreCheck       = onRegionPreCheck;
window.onComunaPreCheck       = onComunaPreCheck;
window.toggleCorte            = toggleCorte;
window.selectCorteOption      = selectCorteOption;
window.selectCorteMode        = selectCorteMode;
window.backToCorteMode        = backToCorteMode;
window.onCorteInput           = onCorteInput;
window.onCorteItemInput       = onCorteItemInput;
window.setIgualMode           = setIgualMode;
window.onIgualItemInput       = onIgualItemInput;
window.onIgualSharedInput     = onIgualSharedInput;
window.addMedidaToPlank       = addMedidaToPlank;
window.removeMedidaFromPlank  = removeMedidaFromPlank;
window.onMedidaSetInput       = onMedidaSetInput;
window.onMedidaSetObs         = onMedidaSetObs;
window.renderCart             = renderCart;
window.updateCorteBadge       = updateCorteBadge;
window._ppUpdatePrice         = updatePrice;
window.resetCorteBadge        = function() {
  corteState.activo = false;
  corteState.modo   = null;
  updateCorteBadge();
};

// ── Carga precios y stock desde Supabase ─────────────────
function loadStockFromSupabase() {
  if (!window.supabase || !window.POLYPLAS_CONFIG) {
    setTimeout(loadStockFromSupabase, 400);
    return;
  }
  var _sb = window.supabase.createClient(
    window.POLYPLAS_CONFIG.SUPABASE_URL,
    window.POLYPLAS_CONFIG.SUPABASE_ANON_KEY
  );
  _sb.from('pp_stock').select('tipo,dim,color,espesor,cantidad,precio').then(function(res) {
    if (!res.data || !res.data.length) return;
    // Resetear outOfStock desde Supabase (fuente única de verdad para AA y PA)
    outOfStock.AA = {};
    outOfStock.PA = {};
    res.data.forEach(function(row) {
      // Actualizar precio si el CRM lo modificó
      if (row.precio !== null && row.precio !== undefined && row.precio > 0) {
        if (!prices[row.tipo]) prices[row.tipo] = {};
        if (!prices[row.tipo][row.dim]) prices[row.tipo][row.dim] = {};
        if (!prices[row.tipo][row.dim][row.color]) prices[row.tipo][row.dim][row.color] = {};
        prices[row.tipo][row.dim][row.color][row.espesor] = row.precio;
      }
      // Marcar sin stock si cantidad es 0
      if (row.cantidad === 0) {
        if (!outOfStock[row.tipo]) outOfStock[row.tipo] = {};
        if (!outOfStock[row.tipo][row.dim]) outOfStock[row.tipo][row.dim] = {};
        var entry = outOfStock[row.tipo][row.dim][row.color];
        if (entry === true) return;
        if (!entry) { outOfStock[row.tipo][row.dim][row.color] = [row.espesor]; }
        else if (Array.isArray(entry) && !entry.includes(row.espesor)) { entry.push(row.espesor); }
      }
    });
    buildColorSelector();
    buildEspesorSelector();
    updatePrice();
    if (window._ppInitCardSpecs) window._ppInitCardSpecs();
    setTimeout(loadStockFromSupabase, 120000); // re-carga precios/stock cada 2 min
  }).catch(function(e) {
    console.warn('PP stock load:', e);
    setTimeout(loadStockFromSupabase, 120000); // reintenta en 2 min si hay error
  });
}

// ── Resultado de pago (retorno desde Webpay) ──────────────
function checkPaymentResult() {
  const params = new URLSearchParams(window.location.search);
  const pago   = params.get('pp_pago');
  if (!pago) return;

  // Overlay pantalla completa — tapa todo el contenido de la página
  const resultEl = document.getElementById('ppResult');
  resultEl.style.cssText = [
    'position:fixed', 'inset:0', 'z-index:999999',
    'background:#f0f4fb', 'display:flex',
    'align-items:center', 'justify-content:center',
    'padding:24px', 'overflow-y:auto'
  ].join(';');

  if (pago === 'aprobado') {
    document.getElementById('ppResultOk').style.display = 'block';
    document.getElementById('ppOrden').textContent = params.get('orden') || '—';
    const monto = parseInt(params.get('monto') || '0');
    document.getElementById('ppMonto').textContent = '$\u00a0' + monto.toLocaleString('es-CL');
    document.getElementById('ppAuth').textContent  = params.get('auth') || '—';
    window.history.replaceState({}, '', window.location.pathname + '#gracias');
    // ── Registro en CRM tras pago aprobado ──
    (function _tryRegisterOrder() {
      if (!window.POLYPLAS_CONFIG || typeof (window.supabase || {}).createClient !== 'function') {
        setTimeout(_tryRegisterOrder, 400);
        return;
      }
      try {
        var _od = JSON.parse(sessionStorage.getItem('pp_acrilico_order_data') || 'null');
        if (!_od) return;
        sessionStorage.removeItem('pp_acrilico_order_data');
        var _sb = window.supabase.createClient(window.POLYPLAS_CONFIG.SUPABASE_URL, window.POLYPLAS_CONFIG.SUPABASE_ANON_KEY);
        _sb.from('conversations').insert({
          id:              _od.convId,
          client_name:     _od.client.nombre || _od.client.razon || '',
          client_email:    _od.client.email  || '',
          unread_count:    1,
          last_message_at: new Date().toISOString(),
          metadata: {
            source:        'order',
            tipo_cliente:   _od.client.tipo            || '',
            nombre:         _od.client.nombre          || '',
            razon_social:   _od.client.razon           || '',
            rut:            _od.client.rut             || '',
            giro:           _od.client.giro            || '',
            email:          _od.client.email           || '',
            phone:          _od.client.tel             || '',
            dir:            _od.client.dir             || _od.client.dir_factura || '',
            ciudad:         _od.client.ciudad          || _od.client.ciudad_factura || '',
            region:         _od.client.region          || _od.client.region_factura || '',
            dir_factura:    _od.client.dir_factura     || '',
            ciudad_factura: _od.client.ciudad_factura  || '',
            region_factura: _od.client.region_factura  || '',
            entrega:       _od.entregaLabel,
            total:         _od.total,
            items:         _od.orderItems,
            corte:         _od.corteActivo ? (_od.corteInstrucciones || 'Sin instrucciones') : null,
            corteItems:    _od.corteItems   || null,
            webpay_orden:  params.get('orden') || '',
            webpay_auth:   params.get('auth')  || '',
          }
        }).then(function() {
          var _scriptURL = 'https://script.google.com/macros/s/AKfycbw4WkE3slUjbDIUrbYVZD-aL1nB6WWJeyj6XG6rpFNz9p3pSFfdmUd3FjY_hV-QQJNkKA/exec';
          var _msgText = '🛒 PEDIDO WEB\n─────────────────\n' + _od.resumen + '\n─────────────────\nEntrega: ' + _od.entregaLabel + '   Total: $' + _od.total.toLocaleString('es-CL') + '\n─────────────────\nCliente: ' + (_od.client.nombre||_od.client.razon) + '  RUT: ' + _od.client.rut + '\nEmail: ' + _od.client.email + '  Tel: ' + _od.client.tel + '\nDirección: ' + _od.client.dir + ', ' + _od.client.ciudad + ', ' + _od.client.region;
          _sb.from('messages').insert({ conversation_id: _od.convId, sender: 'client', content: _msgText }).then(function(){});
          fetch(_scriptURL + '?' + new URLSearchParams({ accion:'pedido_web', idRef:_od.shortId, nombre:_od.client.nombre||_od.client.razon||'', email:_od.client.email||'', telefono:_od.client.tel||'', monto:String(_od.total), vendido:'Sí', observaciones:_od.resumen+' | Entrega:'+_od.entregaLabel }).toString(), { mode:'no-cors' });
        });
      } catch(e2) {}
    })();
  } else {
    document.getElementById('ppResultFail').style.display = 'block';
    if (pago === 'cancelado') {
      document.getElementById('ppFailMsg').textContent = 'Cancelaste el proceso de pago. Puedes volver a intentarlo cuando quieras.';
    }
    window.history.replaceState({}, '', window.location.pathname);
  }
}

// ── Estimación de entrega ─────────────────────────────────
const _FESTIVOS = new Set([
  '2025-01-01','2025-04-18','2025-04-19','2025-05-01','2025-05-21',
  '2025-06-20','2025-06-29','2025-07-16','2025-08-15','2025-09-18',
  '2025-09-19','2025-10-12','2025-10-31','2025-11-01','2025-12-08','2025-12-25',
  '2026-01-01','2026-04-03','2026-04-04','2026-05-01','2026-05-21',
  '2026-06-19','2026-06-29','2026-07-16','2026-08-15','2026-09-18',
  '2026-09-19','2026-10-12','2026-11-01','2026-12-08','2026-12-25'
]);
const _DIAS  = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
const _MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

function _esDiaHabil(d) {
  const dow = d.getDay();
  if (dow === 0 || dow === 6) return false;
  const key = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  return !_FESTIVOS.has(key);
}
function _siguienteDiaHabil(desde) {
  const d = new Date(desde);
  d.setDate(d.getDate() + 1);
  while (!_esDiaHabil(d)) d.setDate(d.getDate() + 1);
  return d;
}
function _fmtFecha(d) {
  return _DIAS[d.getDay()] + ' ' + d.getDate() + ' de ' + _MESES[d.getMonth()];
}

function calcEntregaEstimada() {
  const el = document.getElementById('entregaEstimada');
  if (!el) return;

  const ahora = new Date();
  const dow   = ahora.getDay();   // 0=dom … 5=vie … 6=sab
  const hora  = ahora.getHours();

  let html = '';

  // Viernes antes de las 12:00 → entrega hoy mismo
  if (dow === 5 && hora < 12) {
    html = `<div class="pp-entrega-est urgente">
      <div class="pp-entrega-est-icon">⚡</div>
      <div>
        <strong>Entrega hoy antes de las 17:00</strong>
        Pedido antes de las 12:00 del viernes — salimos a despachar esta tarde.
      </div>
    </div>`;
  } else {
    const entrega = _siguienteDiaHabil(ahora);
    const esManana = (function() {
      const m = new Date(ahora); m.setDate(m.getDate() + 1);
      return m.toDateString() === entrega.toDateString();
    })();
    const cuando = esManana ? 'Mañana ' + _fmtFecha(entrega) : _fmtFecha(entrega).charAt(0).toUpperCase() + _fmtFecha(entrega).slice(1);
    html = `<div class="pp-entrega-est normal">
      <div class="pp-entrega-est-icon">🚚</div>
      <div>
        <strong>Entrega estimada: ${cuando}</strong>
        Despacho en 24 h · Retiro en tienda disponible desde mañana.
      </div>
    </div>`;
  }

  el.innerHTML = html;
}

// ── Nudge de abandono ─────────────────────────────────────
var _nudgeTimer   = null;
var _nudgeDismissed = false;

function _nudgeShow() {
  if (_nudgeDismissed) return;
  var el = document.getElementById('ppNudge');
  if (!el) return;

  // Generar ID de recuperación PP-XXXXX
  var recovId = 'PP-' + Math.random().toString(36).slice(2, 7).toUpperCase();

  // Resumen del carrito actual
  var cartSummary = cart.map(function(i) {
    var mat   = (materialesInfo[i.material] && materialesInfo[i.material].tag) || i.tipo || '';
    var color = getColorLabel(i.color, i.tipo);
    var dim   = (dimMeta[i.dim] && dimMeta[i.dim].label) || i.dim || '';
    return mat + ' · ' + color + ' · ' + dim + ' · ' + i.esp + ' × ' + i.qty;
  }).join('\n');

  // Monto acumulado
  var montoCart = cart.reduce(function(s, i) { return s + i.price * i.qty; }, 0);

  // Actualizar link WhatsApp dinámicamente
  var waMsg = '¡Hola! Tengo dudas con mi selección de planchas 🪟\n' +
    'Ref: ' + recovId +
    (cartSummary ? '\n\nMi selección hasta ahora:\n' + cartSummary : '');
  var waLink = el.querySelector('a[href*="wa.me"]');
  if (waLink) {
    waLink.href = 'https://wa.me/56942086751?text=' + encodeURIComponent(waMsg);
  }

  // Registrar en Google Sheet como recuperación pendiente
  try {
    var _scriptURL = 'https://script.google.com/macros/s/AKfycbw4WkE3slUjbDIUrbYVZD-aL1nB6WWJeyj6XG6rpFNz9p3pSFfdmUd3FjY_hV-QQJNkKA/exec';
    fetch(_scriptURL + '?' + new URLSearchParams({
      accion:        'pedido_web',
      idRef:         recovId,
      nombre:        '',
      email:         '',
      telefono:      '',
      monto:         String(montoCart),
      vendido:       'No',
      observaciones: (cartSummary || 'Sin ítems') + ' | [ABANDONO — nudge enviado]'
    }).toString(), { mode: 'no-cors' });
  } catch(e) {}

  el.classList.add('show');
}
function _nudgeHide() {
  var el = document.getElementById('ppNudge');
  if (el) el.classList.remove('show');
}
function _nudgeSchedule() {
  clearTimeout(_nudgeTimer);
  if (_nudgeDismissed) return;
  _nudgeTimer = setTimeout(_nudgeShow, 12000);
}
function _nudgeCancel() {
  clearTimeout(_nudgeTimer);
  _nudgeHide();
}

// ── Run ───────────────────────────────────────────────────
function ppRun() {
  if (document.getElementById('tipoSelector')) {
    checkPaymentResult();
    init();
    setTimeout(loadStockFromSupabase, 600);
    var nudgeClose = document.getElementById('ppNudgeClose');
    if (nudgeClose) nudgeClose.onclick = function() {
      _nudgeDismissed = true;
      _nudgeCancel();
    };
  } else {
    setTimeout(ppRun, 50);
  }
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', ppRun);
} else {
  ppRun();
}

window._ppDlPush = dlPush;
window._ppGetMatLabel = function(m) { return (materialesInfo[m] && materialesInfo[m].label) || m; };
window._ppGetMinPrecio = getMinPrecioMaterial;
(function() {
  var _items = Object.entries(materialesInfo).map(function(e, i) {
    return { item_id: e[0], item_name: 'Plancha ' + e[1].label, item_brand: 'Polyplas', item_category: e[1].label, price: getMinPrecioMaterial(e[0]) || 0, index: i };
  });
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { dlPush('view_item_list', { currency: 'CLP', item_list_name: 'Planchas Acrílico', items: _items }); });
  } else {
    dlPush('view_item_list', { currency: 'CLP', item_list_name: 'Planchas Acrílico', items: _items });
  }
})();

})(); // fin IIFE
