/* Google Analytics 4 for montanacontracting.com.
   One tag per page: every page loads this file and nothing else from Google.
   gtag.js loads after the page finishes, so it never competes with the hero image.
   Calls made before it arrives wait in dataLayer and are sent once it loads.
   Only the production host reports, so local builds, previews and tests stay out of the data. */
(function () {
  'use strict';
  var ID = 'G-1YKLCTB80N';
  if (location.hostname !== 'montanacontracting.com') return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', ID);

  function load() {
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + ID;
    document.head.appendChild(s);
  }
  if (document.readyState === 'complete') load();
  else window.addEventListener('load', load, { once: true });

  // Lead signals: taps on the phone number and email links, anywhere on the site.
  document.addEventListener('click', function (event) {
    var link = event.target.closest && event.target.closest('a[href^="tel:"], a[href^="mailto:"]');
    if (!link) return;
    var phone = link.getAttribute('href').indexOf('tel:') === 0;
    window.gtag('event', phone ? 'phone_click' : 'email_click', {
      link_location: location.pathname,
      link_text: (link.textContent || '').trim().slice(0, 60)
    });
  }, true);
})();
