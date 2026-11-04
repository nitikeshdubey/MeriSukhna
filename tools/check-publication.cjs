/* Run against source before publishing and against the public origin after upload. */
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const origin = 'https://merisukhna.com';
const live = process.argv.includes('--live');
async function read(route, file = route) {
  if (!live) return fs.readFile(path.join(root, file), 'utf8');
  const response = await fetch(origin + route, { redirect: 'manual', signal: AbortSignal.timeout(15000) });
  assert.equal(response.status, 200, route + ' HTTP status');
  assert(!/noindex/i.test(response.headers.get('x-robots-tag') || ''), route + ' excludes indexing');
  return response.text();
}
async function main() {
  const robots = await read('/robots.txt');
  assert(robots.includes('Sitemap: ' + origin + '/sitemap-index.xml'));
  const index = await read('/sitemap-index.xml');
  assert(index.includes('<loc>' + origin + '/sitemap.xml</loc>'));
  const sitemap = await read('/sitemap.xml');
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  assert.equal(urls.length, new Set(urls).size);
  const hub = await read('/blog/', 'blog/index.html');
  const files = (await fs.readdir(path.join(root, 'blog'))).filter(f => f.endsWith('.html') && f !== 'index.html');
  assert(files.length, 'No articles found');
  for (const file of files) {
    const route = '/blog/' + file.slice(0, -5);
    assert(urls.includes(origin + route), 'Missing from sitemap: ' + route);
    assert(hub.includes('href="' + route + '"'), 'Missing from journal: ' + route);
    const article = await read(route, 'blog/' + file);
    assert(article.includes('rel="canonical" href="' + origin + route + '"'), route + ' canonical');
    assert(!/<meta[^>]+name="(?:robots|googlebot)"[^>]+content="[^"]*noindex/i.test(article), route + ' noindex');
    assert(/<h1[\s>]/i.test(article), route + ' missing article heading');
  }
  console.log(files.length + ' articles pass ' + (live ? 'live' : 'source') + ' discovery checks. Google discovery and indexing are reported separately in Search Console.');
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
