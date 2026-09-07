const { createHash } = require('node:crypto');

const RECIPIENT = 'matt@montanacontracting.com';
const FIELDS = { name: 120, email: 254, phone: 50, projectType: 40, message: 5000, website: 200, requestId: 36 };
const PROJECT_TYPES = ['Custom Home', 'Commercial', 'Renovation', 'Institutional', 'Other'];
const EMAIL = /^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const hash = value => createHash('sha256').update(value).digest('hex');

function parseInquiry(body) {
  if (typeof body === 'string') body = JSON.parse(body);
  if (!body || Array.isArray(body) || typeof body !== 'object') return null;
  if (Object.keys(body).some(key => !Object.hasOwn(FIELDS, key))) return null;
  const inquiry = {};
  for (const [key, max] of Object.entries(FIELDS)) {
    const value = body[key] ?? '';
    if (typeof value !== 'string' || value.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)) return null;
    inquiry[key] = value.trim();
  }
  if (!inquiry.name || /[\r\n]/.test(inquiry.name + inquiry.email + inquiry.phone) || !EMAIL.test(inquiry.email)) return null;
  if (!PROJECT_TYPES.includes(inquiry.projectType) || inquiry.website || !UUID.test(inquiry.requestId)) return null;
  return inquiry;
}

function allowedOrigins(env) {
  const origins = new Set(['https://montanacontracting.com', 'https://www.montanacontracting.com']);
  if (env.VERCEL_URL && /^[a-z0-9-]+\.vercel\.app$/i.test(env.VERCEL_URL)) origins.add('https://' + env.VERCEL_URL);
  if (env.NODE_ENV === 'development') {
    origins.add('http://localhost:4176');
    origins.add('http://127.0.0.1:4176');
  }
  return origins;
}

function createInquiryHandler({ env = process.env, fetchImpl = fetch, timeoutMs = 8000, now = Date.now } = {}) {
  // This is a bounded per-instance backstop, not a distributed spam limit.
  // The release gate also requires a Vercel edge rate limit on /api/inquiry.
  const attempts = new Map();
  function tooMany(req) {
    const address = env.VERCEL ? req.headers['x-vercel-forwarded-for'] : req.socket?.remoteAddress;
    const key = hash(String(address || 'unknown'));
    const time = now();
    for (const [id, window] of attempts) if (time - window.start >= 60000) attempts.delete(id);
    if (!attempts.has(key)) {
      if (attempts.size >= 10000) return true;
      attempts.set(key, { start: time, count: 0 });
    }
    return ++attempts.get(key).count > 5;
  }
  return async function inquiryHandler(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    const fail = (status, error) => res.status(status).json({ error });
    if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return fail(405, 'Use the inquiry form to send a message.'); }
    if (!allowedOrigins(env).has(req.headers.origin)) return fail(403, 'Open the inquiry form on the Montana website.');
    if (req.headers['content-type']?.split(';')[0].trim().toLowerCase() !== 'application/json') return fail(415, 'The inquiry format is not supported.');
    const size = Buffer.byteLength(typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? ''));
    if (size > 16384 || Number(req.headers['content-length']) > 16384) return fail(413, 'Please shorten your message.');
    let inquiry;
    try { inquiry = parseInquiry(req.body); } catch { return fail(400, 'The inquiry could not be read. Please try again.'); }
    if (!inquiry) return fail(422, 'Check your name, email, project type, and message length.');
    const from = env.INQUIRY_FROM || '';
    if (!env.RESEND_API_KEY || !EMAIL.test(from) || !/^[^@\s]+@(?:[a-z0-9-]+\.)*montanacontracting\.com$/i.test(from)) {
      return fail(503, 'The form is not available yet. Email matt@montanacontracting.com or call (845) 398-1778.');
    }
    if (tooMany(req)) { res.setHeader('Retry-After', '60'); return fail(429, 'Please wait one minute before trying again.'); }
    const mail = {
      from, to: [RECIPIENT], reply_to: inquiry.email,
      subject: 'Website inquiry: ' + inquiry.projectType + ' from ' + inquiry.name,
      text: ['Name: ' + inquiry.name, 'Email: ' + inquiry.email, 'Phone: ' + (inquiry.phone || 'Not provided'), 'Project type: ' + inquiry.projectType, '', inquiry.message || 'No additional details provided.'].join('\n')
    };
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetchImpl('https://api.resend.com/emails', {
        method: 'POST', signal: controller.signal,
        headers: { Authorization: 'Bearer ' + env.RESEND_API_KEY, 'Content-Type': 'application/json', 'Idempotency-Key': 'montana-inquiry/' + hash(inquiry.requestId + JSON.stringify(mail)) },
        body: JSON.stringify(mail)
      });
      if (!response.ok) return fail(502, 'We could not confirm your inquiry. Your details are still here. Please retry or email Matt.');
      const receipt = await response.json();
      if (typeof receipt.id !== 'string' || !receipt.id) return fail(502, 'We could not confirm your inquiry. Please retry or email Matt.');
      return res.status(200).json({ accepted: true });
    } catch {
      return fail(502, 'We could not confirm your inquiry. Your details are still here. Please retry or email Matt.');
    } finally { clearTimeout(timer); }
  };
}

module.exports = { createInquiryHandler };
