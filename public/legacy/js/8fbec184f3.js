(function () {
  var items = document.querySelectorAll('.pp-faq-item');
  items.forEach(function (item) {
    var btn = item.querySelector('.pp-faq-btn');
    btn.addEventListener('click', function () {
      var esAbierto = item.classList.contains('open');
      items.forEach(function (i) {
        i.classList.remove('open');
        i.querySelector('.pp-faq-btn').setAttribute('aria-expanded', 'false');
      });
      if (!esAbierto) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });
})();
