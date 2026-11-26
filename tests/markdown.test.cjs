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
