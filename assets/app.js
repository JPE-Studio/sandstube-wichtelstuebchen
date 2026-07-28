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
