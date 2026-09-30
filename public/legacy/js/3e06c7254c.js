/* ── FILTROS MÓVIL ── */
(function () {
  var state = { color: null, espesor: null, retiraHoy: false };
  var currentPanel = null;

  var colorMeta = [
    { key: 'clear',           label: 'Transparente',  bg: 'linear-gradient(135deg,#d4eaf7,#a8d4f0)', brd: '#78b8e0' },
    { key: 'blanca',          label: 'Blanca',         bg: '#f0f0f0',                                  brd: '#c8c8c8' },
    { key: 'negra',           label: 'Negra',           bg: '#1a1a1a',                                  brd: '#1a1a1a' },
    { key: 'espejo_dorado',   label: 'Esp. Dorado',    bg: 'linear-gradient(135deg,#f5e070,#c8a010)', brd: '#c8a010' },
    { key: 'espejo_plateado', label: 'Esp. Plateado',  bg: 'linear-gradient(135deg,#e8e8e8,#a0a8b0)', brd: '#8090a0' },
    { key: 'fluor_verde',     label: 'Flúor Verde',    bg: '#39e014',                                  brd: '#22a800' },
    { key: 'fluor_rojo',      label: 'Flúor Rojo',     bg: '#ff2040',                                  brd: '#cc0020' }
  ];

  function getCards() {
    return Array.from(document.querySelectorAll('.pp-home-vitrine .pp-product-card'));
  }

  function applyFilters() {
    var cards = getCards();
    var visible = 0;
    var active = state.color || state.espesor || state.retiraHoy;
    cards.forEach(function (card) {
      var show = true;
      if (state.color && card.dataset.color !== state.color) show = false;
      if (state.espesor) {
        var esps = (card.dataset.espesores || '').split(',');
        if (esps.indexOf(state.espesor) === -1) show = false;
      }
      if (state.retiraHoy && card.dataset.stockStatus === 'sin-stock') show = false;
      card.style.display = show ? '' : 'none';
      if (show) visible++;
    });
    syncUI();
    updateEmpty(active && visible === 0);
  }

  function syncUI() {
    var count = (state.color ? 1 : 0) + (state.espesor ? 1 : 0) + (state.retiraHoy ? 1 : 0);
    var badge = document.getElementById('ppFiltBadge');
    if (badge) { badge.textContent = count; badge.hidden = count === 0; }

    var found = colorMeta.filter(function (c) { return c.key === state.color; })[0];
    var lblC = document.getElementById('ppFiltLblColor');
    var btnC = document.getElementById('ppFiltBtnColor');
    if (lblC) lblC.textContent = found ? found.label : 'Color';
    if (btnC) btnC.classList.toggle('pp-filt-active', !!state.color);

    var lblE = document.getElementById('ppFiltLblEsp');
    var btnE = document.getElementById('ppFiltBtnEsp');
    if (lblE) lblE.textContent = state.espesor || 'Espesor';
    if (btnE) btnE.classList.toggle('pp-filt-active', !!state.espesor);

    var btnR = document.getElementById('ppFiltBtnRetira');
    if (btnR) btnR.classList.toggle('pp-filt-active', state.retiraHoy);
  }

  function openPanel(type) {
    currentPanel = type;
    var overlay = document.getElementById('ppFiltOverlay');
    var sheet   = document.getElementById('ppFiltSheet');
    var title   = document.getElementById('ppFiltSheetTitle');
    var body    = document.getElementById('ppFiltSheetBody');
    if (!overlay || !sheet) return;
    if (title) title.textContent = type === 'color' ? 'Color' : 'Espesor';
    if (body)  body.innerHTML    = type === 'color' ? buildColorHTML() : buildEspHTML();
    overlay.classList.add('open');
    requestAnimationFrame(function () { sheet.classList.add('open'); });
    document.body.style.overflow = 'hidden';
  }

  function closePanel() {
    var overlay = document.getElementById('ppFiltOverlay');
    var sheet   = document.getElementById('ppFiltSheet');
    if (sheet) sheet.classList.remove('open');
    setTimeout(function () {
      if (overlay) overlay.classList.remove('open');
    }, 280);
    document.body.style.overflow = '';
    currentPanel = null;
  }

  function buildColorHTML() {
    var html = '<div class="pp-color-grid">';
    colorMeta.forEach(function (c) {
      var act = state.color === c.key ? ' pp-filt-active' : '';
      html += '<button class="pp-color-opt' + act + '" onclick="window._ppFilt.selectColor(\'' + c.key + '\')">' +
        '<span class="pp-color-dot" style="background:' + c.bg + ';border-color:' + c.brd + '"></span>' +
        '<span class="pp-color-name">' + c.label + '</span>' +
        '</button>';
    });
    return html + '</div>';
  }

  function buildEspHTML() {
    var espSet = {};
    getCards().forEach(function (card) {
      (card.dataset.espesores || '').split(',').forEach(function (e) { if (e) espSet[e] = true; });
    });
    var order = ['0.75mm','1mm','2mm','3mm','4mm','5mm','6mm','8mm','10mm'];
    var available = order.filter(function (e) { return espSet[e]; });
    if (!available.length) available = ['2mm','3mm','4mm','5mm','6mm','8mm','10mm'];
    var html = '<div class="pp-esp-chips">';
    available.forEach(function (e) {
      var act = state.espesor === e ? ' pp-filt-active' : '';
      html += '<button class="pp-esp-chip' + act + '" onclick="window._ppFilt.selectEsp(\'' + e + '\')">' + e + '</button>';
    });
    return html + '</div>';
  }

  function updateEmpty(isEmpty) {
    var sections = document.querySelectorAll('.pp-home-section');
    var empty = document.getElementById('ppFiltEmpty');
    if (isEmpty) {
      if (!empty) {
        empty = document.createElement('div');
        empty.id = 'ppFiltEmpty';
        empty.className = 'pp-filter-empty';
        empty.innerHTML =
          '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>' +
          '<p>Sin productos con estos filtros</p>' +
          '<button class="pp-filter-empty-btn" onclick="window._ppFilt.clearAll()">Limpiar filtros</button>';
        if (sections[0]) sections[0].parentNode.insertBefore(empty, sections[0]);
      }
      if (empty) empty.style.display = '';
      sections.forEach(function (s) { s.style.display = 'none'; });
    } else {
      if (empty) empty.style.display = 'none';
      sections.forEach(function (s) { s.style.display = ''; });
    }
  }

  window._ppFilt = {
    openPanel:    openPanel,
    closePanel:   closePanel,
    selectColor:  function (k) { state.color   = state.color   === k ? null : k; applyFilters(); closePanel(); },
    selectEsp:    function (e) { state.espesor = state.espesor === e ? null : e; applyFilters(); closePanel(); },
    toggle:       function (k) { state[k] = !state[k]; applyFilters(); },
    clearCurrent: function ()  {
      if (currentPanel === 'color') state.color   = null;
      if (currentPanel === 'esp')   state.espesor = null;
      applyFilters(); closePanel();
    },
    clearAll:     function ()  { state = { color: null, espesor: null, retiraHoy: false }; applyFilters(); }
  };
})();
