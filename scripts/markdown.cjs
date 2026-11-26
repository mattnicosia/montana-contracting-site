'use strict';
// A small Markdown subset for article bodies: paragraphs, ## and ### headings,
// "- " lists, **bold** and [text](url) links. Text is escaped before markup.

const esc = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const SITE = 'https://montanacontracting.com';

const slugify = text => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

function linkAttrs(url) {
  if (url === SITE || url === SITE + '/') return 'href="/"';
  if (url.startsWith(SITE + '/')) return `href="${url.slice(SITE.length)}"`;
  if (/^https?:\/\//.test(url)) return `href="${url}" target="_blank" rel="noopener"`;
  return `href="${url}"`;
}

// Scans for [text](url), counting parentheses so addresses like
// .../Superintendent_(construction) keep their closing parenthesis.
function links(text) {
  let out = '';
  let i = 0;
  while (i < text.length) {
    const open = text.indexOf('[', i);
    if (open === -1) break;
    const close = text.indexOf('](', open);
    if (close === -1) break;
    let depth = 1;
    let j = close + 2;
    while (j < text.length && depth > 0) {
      if (text[j] === '(') depth++;
      else if (text[j] === ')') depth--;
      if (depth > 0) j++;
    }
    if (depth !== 0) break;
    out += text.slice(i, open) + `<a ${linkAttrs(text.slice(close + 2, j))}>${text.slice(open + 1, close)}</a>`;
    i = j + 1;
  }
  return out + text.slice(i);
}

const inline = text => links(esc(text)).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

function blocks(source) {
  const result = [];
  let para = [];
  let list = null;
  const flush = () => {
    if (para.length) result.push({type: 'p', text: para.join(' ')});
    if (list) result.push({type: 'ul', items: list});
    para = [];
    list = null;
  };
  for (const raw of String(source).replace(/\r\n?/g, '\n').split('\n')) {
    const line = raw.trim();
    if (!line) { flush(); continue; }
    const heading = line.match(/^(#{2,3}) (.+)$/);
    if (heading) { flush(); result.push({type: heading[1] === '##' ? 'h2' : 'h3', text: heading[2]}); continue; }
    if (line.startsWith('- ')) {
      if (para.length) { result.push({type: 'p', text: para.join(' ')}); para = []; }
      (list = list || []).push(line.slice(2));
      continue;
    }
    if (list) flush();
    para.push(line);
  }
  flush();
  // Give every h2 a unique id.
  const seen = new Map();
  for (const block of result) {
    if (block.type !== 'h2') continue;
    const base = slugify(block.text);
    const count = (seen.get(base) || 0) + 1;
    seen.set(base, count);
    block.id = count === 1 ? base : `${base}-${count}`;
  }
  return result;
}

function renderMarkdown(source) {
  return blocks(source).map(block => {
    if (block.type === 'h2') return `<h2 id="${block.id}">${inline(block.text)}</h2>`;
    if (block.type === 'h3') return `<h3>${inline(block.text)}</h3>`;
    if (block.type === 'ul') return `<ul>${block.items.map(item => `<li>${inline(item)}</li>`).join('')}</ul>`;
    return `<p>${inline(block.text)}</p>`;
  }).join('\n');
}

const headingsOf = source => blocks(source).filter(block => block.type === 'h2').map(block => ({id: block.id, text: block.text}));

module.exports = {renderMarkdown, headingsOf, esc};
