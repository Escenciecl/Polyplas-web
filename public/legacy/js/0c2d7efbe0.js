function ppVitrineScroll(dir, id) {
  var grid = document.getElementById(id || 'ppVitrineAA');
  if (grid) grid.scrollBy({ left: dir * 230, behavior: 'smooth' });
}
function openConfiguratorPA(colorKey) {
  openConfigurator(colorKey, 'PA');
}
