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
