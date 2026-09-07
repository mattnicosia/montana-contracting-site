(function () {
  'use strict';
  var form = document.getElementById('projectForm');
  if (!form) return;
  var status = document.getElementById('pf-done');
  var button = form.querySelector('[type="submit"]');
  var pending = false;
  var lastPayload = '';
  var requestId = '';

  function announce(message, failed) {
    status.textContent = message;
    status.style.display = 'block';
    status.classList.toggle('is-error', failed);
  }
  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (pending) return;
    if (!form.checkValidity()) { form.reportValidity(); return; }
    if (location.protocol === 'file:') {
      announce('This local file cannot send inquiries. Use the website or email matt@montanacontracting.com.', true);
      return;
    }
    var fields = Object.fromEntries(new FormData(form));
    var payload = JSON.stringify(fields);
    if (payload !== lastPayload || !requestId) {
      requestId = crypto.randomUUID();
      lastPayload = payload;
    }
    pending = true;
    button.disabled = true;
    button.textContent = 'Sending…';
    form.setAttribute('aria-busy', 'true');
    announce('We are sending your inquiry.', false);
    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, 12000);
    try {
      var response = await fetch('/api/inquiry', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.assign(fields, { requestId: requestId })), signal: controller.signal
      });
      var result = await response.json();
      if (!response.ok || result.accepted !== true) {
        announce(result.error || 'We could not confirm your inquiry. Please retry or email matt@montanacontracting.com.', true);
        return;
      }
      announce('Our email service accepted your inquiry for delivery to Matt. Thank you for getting in touch.', false);
      // Keep any new draft the visitor typed while the previous inquiry was pending.
      if (JSON.stringify(Object.fromEntries(new FormData(form))) === payload) form.reset();
      requestId = '';
      lastPayload = '';
    } catch {
      announce('We could not confirm your inquiry. Your details are still here. Please retry or email matt@montanacontracting.com.', true);
    } finally {
      clearTimeout(timer);
      pending = false;
      button.disabled = false;
      button.textContent = 'Send Inquiry';
      form.removeAttribute('aria-busy');
    }
  });
})();
