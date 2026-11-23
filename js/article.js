// Loads content/<slug>.md and renders it into the article panel.
/* global marked */
import { PAGES, bySlug } from './bodies.js';
import { extractFootnotes, mountFootnotes } from './footnotes.js';
import { renderFence, renderCharts, upgradeFigures } from './charts.js';

marked.use({
  gfm: true,
  renderer: { code(code, lang) { return renderFence(code, (lang || '').trim()); } },
});

const cache = {};
let cleanup = () => {};
let token = 0;

function frontMatter(src) {
  const meta = {};
  const m = src.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  if (!m) return { meta, body: src };
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':');
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^["']|["']$/g, '');
  }
  return { meta, body: src.slice(m[0].length) };
}

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export async function showArticle(slug, el) {
  const my = ++token;
  const def = bySlug[slug];
  const idx = PAGES.findIndex(p => p.slug === slug);
  const num = n => String(n).padStart(2, '0');

  let src;
  try {
    src = cache[slug] ?? (cache[slug] = await (await fetch(`content/${slug}.md`, { cache: 'no-cache' }).then(r => {
      if (!r.ok) throw new Error(r.status);
      return r;
    })).text());
  } catch (e) {
    if (my !== token) return;
    el.innerHTML = `<p class="kicker">${num(idx + 1)} / ${num(PAGES.length)} · ${esc(def.name.toUpperCase())}</p>
      <h1>${esc(def.tagline)}</h1>
      <p class="load-error">Couldn’t load <code>content/${slug}.md</code>. If you opened index.html straight from your files,
      run a local server instead (see README: <code>python -m http.server</code>).</p>`;
    return;
  }
  if (my !== token) return;

  const { meta, body } = frontMatter(src);
  const { md, notes } = extractFootnotes(body);
  const prev = PAGES[idx - 1], next = PAGES[idx + 1];

  cleanup();
  el.innerHTML = `
    <header class="article-head">
      <p class="kicker">${num(idx + 1)} / ${num(PAGES.length)} · ${esc(meta.kicker || def.name.toUpperCase())}</p>
      <h1>${esc(meta.title || def.tagline)}</h1>
      ${meta.deck ? `<p class="deck">${marked.parseInline(meta.deck)}</p>` : ''}
      ${meta.byline ? `<p class="byline">${esc(meta.byline)}</p>` : ''}
    </header>
    <div class="article-body">${marked.parse(md)}</div>
    <nav class="article-foot" aria-label="Continue reading">
      ${prev ? `<a href="#/${prev.slug}" class="foot-prev"><span>← ${num(idx)}</span>${esc(prev.name)}</a>` : '<span></span>'}
      ${next ? `<a href="#/${next.slug}" class="foot-next"><span>${num(idx + 2)} →</span>${esc(next.name)}: ${esc(next.tagline)}</a>` : `<a href="#/system" class="foot-next"><span>↑</span>Back to the solar system</a>`}
    </nav>`;

  const bodyEl = el.querySelector('.article-body');
  bodyEl.querySelectorAll('a[href^="http"]').forEach(a => { a.target = '_blank'; a.rel = 'noopener'; });
  upgradeFigures(bodyEl);
  cleanup = mountFootnotes(bodyEl, notes);
  await renderCharts(bodyEl);
}
