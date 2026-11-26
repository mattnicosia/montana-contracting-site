'use strict';
// A small Markdown subset for article bodies: paragraphs, ## and ### headings,
// "- " and "1. " lists, **bold**, *italic* and [text](url) links. Text is escaped
// before markup. Anything else that looks like Markdown fails the build.

const esc = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const SITE = /^https?:\/\/(?:www\.)?montanacontracting\.com(?=\/|$)/;
// Ids already used by the page around the article body.
const RESERVED_IDS = ['main', 'nav', 'main-nav-links', 'toc-label', 'contact', 'contact-title'];

const slugify = text => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// Heading text without Markdown, for ids and the "In this article" list.
const plain = text => text
  .replace(/\[([^\]]*)\]\((?:[^()]|\([^()]*\))*\)/g, '$1')
  .replace(/\*\*(.+?)\*\*/g, '$1')
  .replace(/(^|[^*\w])\*([^*\s][^*]*?)\*(?![*\w])/g, '$1$2')
  .replace(/(^|[\s(])_(\S[^_]*?)_(?=[\s.,;:!?)]|$)/g, '$1$2');

// href is escaped text. Returns the attributes, or null when the address isn't allowed.
function linkAttrs(target) {
  const titled = target.match(/^(\S+)\s+&quot;(.*)&quot;$/);
  const url = titled ? titled[1] : target;
  const title = titled ? ` title="${titled[2]}"` : '';
  if (SITE.test(url)) return `href="${url.replace(SITE, '') || '/'}"${title}`;
  if (/^https?:\/\//.test(url)) return `href="${url}"${title} target="_blank" rel="noopener"`;
  if (/^(\/|#|mailto:|tel:)/.test(url)) return `href="${url}"${title}`;
  return null;
}

// Scans for [text](url), counting parentheses so addresses like
// .../Superintendent_(construction) keep their closing parenthesis.
function links(text) {
  let out = '';
  let i = 0;
  while (i < text.length) {
    // Find "](" first, then the nearest "[" before it, so "[sic]" earlier in the line stays text.
    const close = text.indexOf('](', i);
    if (close === -1) break;
    const open = text.lastIndexOf('[', close);
    let depth = 1;
    let j = close + 2;
    while (j < text.length && depth > 0) {
      if (text[j] === '(') depth++;
      else if (text[j] === ')') depth--;
      if (depth > 0) j++;
    }
    if (open < i || depth !== 0) { out += text.slice(i, close + 2); i = close + 2; continue; }
    const label = text.slice(open + 1, close);
    const attrs = linkAttrs(text.slice(close + 2, j));
    out += text.slice(i, open) + (attrs ? `<a ${attrs}>${label}</a>` : label);
    i = j + 1;
  }
  return out + text.slice(i);
}

// Bold first (a closing ** never followed by another *, so "***" ends bold and italic together),
// then *italic* and _italic_. Markers must touch the words they wrap, so "5 * 3" and
// file_name or Superintendent_(construction) in a link address stay as they are.
const inline = text => links(esc(text))
  .replace(/\*\*(?=\S)(.+?)(?<=\S)\*\*(?!\*)/g, '<strong>$1</strong>')
  .replace(/(^|[^*\w])\*(?=[^\s*])([^*]*?[^\s*])\*(?![*\w])/g, '$1<em>$2</em>')
  .replace(/(^|[\s(>])_(?=\S)([^_]*?\S)_(?=[\s.,;:!?)<]|$)/g, '$1<em>$2</em>');

function blocks(source) {
  const result = [];
  let para = [];
  let list = null;
  const flushPara = () => { if (para.length) result.push({type: 'p', text: para.join(' ')}); para = []; };
  const flushList = () => { if (list) result.push(list); list = null; };
  for (const raw of String(source).replace(/\r\n?/g, '\n').split('\n')) {
    const line = raw.trim();
    if (!line) { flushPara(); flushList(); continue; }
    if (/^(#|#{4,}) |^[*+] /.test(line)) throw new Error('Unsupported Markdown in article body: ' + line.slice(0, 60));
    const heading = line.match(/^(#{2,3}) (.+)$/);
    if (heading) { flushPara(); flushList(); result.push({type: heading[1] === '##' ? 'h2' : 'h3', text: heading[2]}); continue; }
    const item = line.match(/^(?:(- )|\d+\. )(.*)$/);
    if (item) {
      const type = item[1] ? 'ul' : 'ol';
      flushPara();
      if (list && list.type !== type) flushList();
      (list = list || {type, items: []}).items.push(item[2]);
      continue;
    }
    flushList();
    para.push(line);
  }
  flushPara();
  flushList();
  // Give every h2 a unique id that the page doesn't already use.
  const seen = new Map(RESERVED_IDS.map(id => [id, 1]));
  let n = 0;
  for (const block of result) {
    if (block.type !== 'h2') continue;
    n++;
    block.plain = plain(block.text);
    const base = slugify(block.plain) || `section-${n}`;
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
    if (block.type === 'ul' || block.type === 'ol') return `<${block.type}>${block.items.map(item => `<li>${inline(item)}</li>`).join('')}</${block.type}>`;
    return `<p>${inline(block.text)}</p>`;
  }).join('\n');
}

const headingsOf = source => blocks(source).filter(block => block.type === 'h2').map(block => ({id: block.id, text: block.plain}));

module.exports = {renderMarkdown, headingsOf, esc};
