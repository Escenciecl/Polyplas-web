function ppVitrineScroll(dir, id) {
  var grid = document.getElementById(id || 'ppVitrineAA');
  if (grid) grid.scrollBy({ left: dir * 230, behavior: 'smooth' });
}
function openConfiguratorPA(colorKey) {
  // Activa PA como material sin llamar filterMaterial (evita show/hide de cards)
  document.querySelectorAll('.pp-mat-filter-btn').forEach(function(b) { b.classList.remove('active'); });
  var paBtn = document.querySelector('.pp-mat-filter-btn[data-mat="PA"]');
  if (paBtn) paBtn.classList.add('active');
  openConfigurator(colorKey);
}
