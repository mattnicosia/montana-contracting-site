/* Images remain ordinary image links when scripting or dialog support is absent. */
(function () {
  'use strict';
  var film = document.querySelector('[data-hero-film]');
  if (film) {
    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    film.muted = true;
    if (!reducedMotion.matches) film.play().catch(function () {});
    reducedMotion.addEventListener('change', function (event) { if (event.matches) film.pause(); });
    document.addEventListener('visibilitychange', function () { if (document.hidden) film.pause(); });
  }
  var dialog = document.getElementById('project-lightbox');
  if (!dialog || typeof dialog.showModal !== 'function') return;
  var links = Array.from(document.querySelectorAll('[data-gallery-image]'));
  var image = dialog.querySelector('[data-viewer-image]');
  var count = dialog.querySelector('[data-count]');
  var close = dialog.querySelector('[data-close]');
  var index = 0, lastFocus = null, previousOverflow = '';

  function show(next) {
    index = (next + links.length) % links.length;
    image.src = links[index].href;
    image.alt = links[index].getAttribute('aria-label').replace(/^Open /, '');
    count.textContent = String(index + 1).padStart(2, '0') + ' / ' + String(links.length).padStart(2, '0');
  }
  links.forEach(function (link, i) {
    link.addEventListener('click', function (event) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      lastFocus = link;
      if (film) film.pause();
      show(i);
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      dialog.showModal();
      close.focus();
    });
  });
  close.addEventListener('click', function () { dialog.close(); });
  dialog.querySelector('[data-prev]').addEventListener('click', function () { show(index - 1); });
  dialog.querySelector('[data-next]').addEventListener('click', function () { show(index + 1); });
  dialog.addEventListener('click', function (event) { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('keydown', function (event) {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      show(index + (event.key === 'ArrowLeft' ? -1 : 1));
    }
    if (event.key === 'Tab') {
      var buttons = Array.from(dialog.querySelectorAll('button'));
      var first = buttons[0], last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  dialog.addEventListener('close', function () {
    document.body.style.overflow = previousOverflow;
    image.removeAttribute('src');
    if (lastFocus) lastFocus.focus({preventScroll:true});
  });
  window.addEventListener('pagehide', function () {
    if (dialog.open) dialog.close();
    document.querySelectorAll('video').forEach(function (video) { video.pause(); });
  });
})();
