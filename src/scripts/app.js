/* Wichtelstübchen & SandStube — kleine Helfer */
(function () {
  'use strict';

  /* ---------- Mobiles Menü ---------- */
  var burger = document.querySelector('.burger');
  var nav = document.querySelector('.nav');

  if (burger && nav) {
    var veil = document.createElement('div');
    veil.className = 'nav-veil';
    document.body.appendChild(veil);

    var setOpen = function (open) {
      nav.classList.toggle('open', open);
      veil.classList.toggle('on', open);
      burger.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : '';
    };

    burger.addEventListener('click', function () {
      setOpen(!nav.classList.contains('open'));
    });
    veil.addEventListener('click', function () { setOpen(false); });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setOpen(false);
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 900) setOpen(false);
    });
  }

  /* ---------- Galerie-Slider (barrierefrei) ---------- */
  var sliders = document.querySelectorAll('[data-slider]');
  Array.prototype.forEach.call(sliders, function (slider) {
    var track = slider.querySelector('[data-slider-track]');
    var slides = slider.querySelectorAll('[data-slider-slide]');
    var prev = slider.querySelector('[data-slider-prev]');
    var next = slider.querySelector('[data-slider-next]');
    var dots = slider.querySelectorAll('[data-slider-dot]');
    var live = slider.querySelector('[data-slider-live]');
    if (!track || !slides.length) return;

    var count = slides.length;
    var index = 0;
    var startX = null;

    var show = function (i) {
      index = (i + count) % count;
      track.style.transform = 'translateX(' + (-index * 100) + '%)';
      Array.prototype.forEach.call(slides, function (s, n) {
        s.setAttribute('aria-hidden', String(n !== index));
      });
      Array.prototype.forEach.call(dots, function (d, n) {
        if (n === index) d.setAttribute('aria-current', 'true');
        else d.removeAttribute('aria-current');
      });
      if (live) live.textContent = 'Bild ' + (index + 1) + ' von ' + count;
    };

    if (prev) prev.addEventListener('click', function () { show(index - 1); });
    if (next) next.addEventListener('click', function () { show(index + 1); });
    Array.prototype.forEach.call(dots, function (d, n) {
      d.addEventListener('click', function () { show(n); });
    });

    slider.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { show(index - 1); e.preventDefault(); }
      else if (e.key === 'ArrowRight') { show(index + 1); e.preventDefault(); }
      else if (e.key === 'Home') { show(0); e.preventDefault(); }
      else if (e.key === 'End') { show(count - 1); e.preventDefault(); }
    });

    track.addEventListener('touchstart', function (e) {
      startX = e.touches[0].clientX;
    }, { passive: true });
    track.addEventListener('touchend', function (e) {
      if (startX === null) return;
      var dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 40) show(index + (dx < 0 ? 1 : -1));
      startX = null;
    });
  });

  /* ---------- Sanftes Einblenden beim Scrollen ---------- */
  var targets = document.querySelectorAll('[data-reveal]');
  if (!targets.length) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) {
    targets.forEach(function (el) { el.classList.add('in'); });
    return;
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in');
      io.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

  targets.forEach(function (el, i) {
    /* Geschwister staffeln, wenn keine eigene Verzögerung gesetzt ist */
    if (!el.style.getPropertyValue('--d')) {
      var sibs = el.parentElement ? el.parentElement.querySelectorAll(':scope > [data-reveal]') : [];
      var idx = Array.prototype.indexOf.call(sibs, el);
      el.style.setProperty('--d', (idx > 0 ? Math.min(idx, 5) * 90 : 0) + 'ms');
    }
    io.observe(el);
  });
})();
