const test = require('node:test');
const assert = require('node:assert/strict');
const {renderMarkdown, headingsOf} = require('../scripts/markdown.cjs');

test('paragraphs, headings and lists', () => {
  assert.equal(renderMarkdown('One.\n\n## Two\n\n### Three\n\n- a\n- b'),
    '<p>One.</p>\n<h2 id="two">Two</h2>\n<h3>Three</h3>\n<ul><li>a</li><li>b</li></ul>');
});
test('h2 ids feed the contents list and stay unique', () => {
  const src = "## Construction Superintendent vs. Project Manager: What's the Difference?\n\n## Safety\n\n## Safety";
  assert.deepEqual(headingsOf(src).map(h => h.id), ['construction-superintendent-vs-project-manager-what-s-the-difference', 'safety', 'safety-2']);
  assert.ok(renderMarkdown(src).includes('<h2 id="safety-2">Safety</h2>'));
});
test('a list directly after a paragraph line still becomes a list', () => {
  assert.equal(renderMarkdown('Intro:\n- a\n- b'), '<p>Intro:</p>\n<ul><li>a</li><li>b</li></ul>');
});
test('escapes once', () => {
  assert.equal(renderMarkdown('Tom & Jerry’s <b> "x"'), '<p>Tom &amp; Jerry’s &lt;b&gt; &quot;x&quot;</p>');
});
test('bold and site links become root-relative', () => {
  assert.equal(renderMarkdown('**Scope:** see [our team](https://montanacontracting.com/people/) and [home](https://montanacontracting.com) and [story](https://montanacontracting.com/#story)'),
    '<p><strong>Scope:</strong> see <a href="/people/">our team</a> and <a href="/">home</a> and <a href="/#story">story</a></p>');
});
test('external links open in a new tab and keep balanced parentheses', () => {
  assert.equal(renderMarkdown('A [job site superintendent](https://en.wikipedia.org/wiki/Superintendent_(construction)).'),
    '<p>A <a href="https://en.wikipedia.org/wiki/Superintendent_(construction)" target="_blank" rel="noopener">job site superintendent</a>.</p>');
});
test('a bracket before a link stays text and the link keeps its own words', () => {
  assert.equal(renderMarkdown('Montana [sic] hired a [superintendent](https://x.com/a).'),
    '<p>Montana [sic] hired a <a href="https://x.com/a" target="_blank" rel="noopener">superintendent</a>.</p>');
});
test('single asterisks and underscores become italics', () => {
  assert.equal(renderMarkdown('It was *really* hard and _very_ slow, **bold *and italic***.'),
    '<p>It was <em>really</em> hard and <em>very</em> slow, <strong>bold <em>and italic</em></strong>.</p>');
});
test('asterisks with spaces, underscores inside words and links stay as they are', () => {
  assert.equal(renderMarkdown('5 * 3 * 2 in file_name_here'), '<p>5 * 3 * 2 in file_name_here</p>');
  assert.equal(renderMarkdown('[a](https://en.wikipedia.org/wiki/Superintendent_(construction)) and [b](https://x.com/a_b_c)'),
    '<p><a href="https://en.wikipedia.org/wiki/Superintendent_(construction)" target="_blank" rel="noopener">a</a> and <a href="https://x.com/a_b_c" target="_blank" rel="noopener">b</a></p>');
});
test('numbered lists become ordered lists', () => {
  assert.equal(renderMarkdown('Steps:\n1. Plan\n2. Build'), '<p>Steps:</p>\n<ol><li>Plan</li><li>Build</li></ol>');
});
test('unsupported syntax fails the build instead of publishing as plain text', () => {
  for (const src of ['# Title', '#### Small', '* item', '+ item']) assert.throws(() => renderMarkdown(src), /Unsupported Markdown/, src);
});
test('heading ids and contents text ignore inline markup, never empty, never clash with the page', () => {
  const src = '## **Bold** [x](https://y.com) heading\n\n## ???\n\n## Contact';
  assert.deepEqual(headingsOf(src), [{id:'bold-x-heading', text:'Bold x heading'}, {id:'section-2', text:'???'}, {id:'contact-2', text:'Contact'}]);
  assert.ok(renderMarkdown(src).includes('<h2 id="bold-x-heading"><strong>Bold</strong> <a href="https://y.com" target="_blank" rel="noopener">x</a> heading</h2>'));
});
test('only web, mail, phone and on-site link addresses become links', () => {
  assert.equal(renderMarkdown('[x](javascript:alert(1)) [m](mailto:a@b.com)'), '<p>x <a href="mailto:a@b.com">m</a></p>');
});
test('www and http site links become root-relative too', () => {
  assert.equal(renderMarkdown('[a](https://www.montanacontracting.com/people/) [b](http://montanacontracting.com/#story)'),
    '<p><a href="/people/">a</a> <a href="/#story">b</a></p>');
});
test('a link title becomes a title attribute, not part of the address', () => {
  assert.equal(renderMarkdown('[a](https://montanacontracting.com/people/ "Our team")'), '<p><a href="/people/" title="Our team">a</a></p>');
});
