(function() {
  var slides, total, current = 0, timer;

  function goTo(n) {
    current = (n + total) % total;
    var slideWidth = document.getElementById('ppCarousel').offsetWidth;
    document.getElementById('ppCarouselTrack').style.transform = 'translateX(-' + (current * slideWidth) + 'px)';
    document.querySelectorAll('.pp-carousel-dot').forEach(function(d, i) {
      d.classList.toggle('active', i === current);
    });
  }

  function startAuto() {
    clearInterval(timer);
    timer = setInterval(function() { goTo(current + 1); }, 4000);
  }

  function initCarousel() {
    slides = document.querySelectorAll('.pp-carousel-slide');
    total = slides.length;
    if (!total) return;

    var dotsEl = document.getElementById('ppCarouselDots');
    for (var i = 0; i < total; i++) {
      var d = document.createElement('button');
      d.className = 'pp-carousel-dot' + (i === 0 ? ' active' : '');
      d.setAttribute('aria-label', 'Ir a imagen ' + (i + 1));
      (function(idx) { d.onclick = function() { goTo(idx); startAuto(); }; })(i);
      dotsEl.appendChild(d);
    }

    document.getElementById('ppCarouselPrev').onclick = function() { goTo(current - 1); startAuto(); };
    document.getElementById('ppCarouselNext').onclick = function() { goTo(current + 1); startAuto(); };

    var startX = 0;
    var el = document.getElementById('ppCarousel');
    el.addEventListener('touchstart', function(e) { startX = e.touches[0].clientX; }, { passive: true });
    el.addEventListener('touchend', function(e) {
      var dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 40) { goTo(current + (dx < 0 ? 1 : -1)); startAuto(); }
    }, { passive: true });

    window._ppCarouselGoTo = function(n) { goTo(n); startAuto(); };
    startAuto();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCarousel);
  } else {
    initCarousel();
  }

})();
