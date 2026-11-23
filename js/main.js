// Router + UI glue. Routes: #/sun, #/saturn, … (article pages) and #/system (overview).
import { PAGES, bySlug } from './bodies.js';
import { createScene } from './scene.js';
import { createCamera } from './camera.js';
import { showArticle } from './article.js';

const $ = s => document.querySelector(s);
const canvas = $('#stage'), panel = $('#panel'), article = $('#article'), scroller = $('#panel .scroller');

const S = createScene(canvas, $('#labels'));
const cam = createCamera(S);
const rm = matchMedia('(prefers-reduced-motion: reduce)');
S.state.reducedMotion = rm.matches;
rm.addEventListener?.('change', e => { S.state.reducedMotion = e.matches; });

// bottom page list (overview) — also the accessible way to navigate
$('#pagenav').innerHTML = PAGES.map((p, i) =>
  `<a href="#/${p.slug}"><span>${String(i + 1).padStart(2, '0')}</span>${p.name}</a>`).join('');

S.onPick(slug => { location.hash = `#/${slug}`; });

let current = null;
let panelTimer = 0;

function setUI(mode) {
  document.body.dataset.mode = mode;
  S.state.showLabels = mode === 'overview';
  S.setPicking(mode === 'overview');
  panel.toggleAttribute('inert', mode !== 'closeup');
  $('#pagenav').toggleAttribute('inert', mode !== 'overview');
  $('#closeup-ui').toggleAttribute('inert', mode !== 'closeup');
}

async function route() {
  const slug = (location.hash.match(/^#\/([\w-]+)/) || [])[1] || 'sun';
  if (slug === current) return;
  clearTimeout(panelTimer);

  if (slug === 'system' || !bySlug[slug]?.page) {
    current = 'system';
    panel.classList.remove('open');
    setUI('overview');
    document.title = 'Cosmic Celebrities · Cornell Data Journal';
    cam.toOverview();
    return;
  }

  const fromOverview = current === null || current === 'system';
  current = slug;
  const def = bySlug[slug];
  const idx = PAGES.indexOf(def);
  const prev = PAGES[idx - 1], next = PAGES[idx + 1];
  $('#prev').hidden = !prev; $('#next').hidden = !next;
  if (prev) { $('#prev').href = `#/${prev.slug}`; $('#prev').innerHTML = arrow('l') + `<span class="n">${pad(idx)}</span> ${prev.name}`; }
  if (next) { $('#next').href = `#/${next.slug}`; $('#next').innerHTML = `<span class="n">${pad(idx + 2)}</span> ${next.name}` + arrow('r'); }
  $('#body-caption').textContent = def.name.toUpperCase();
  document.title = `${def.name} · Cosmic Celebrities · CDJ`;

  setUI('closeup');
  panel.classList.add(fromOverview ? 'loading' : 'swapping');
  cam.toBody(slug);
  const load = showArticle(slug, article);
  panelTimer = setTimeout(async () => {
    await load;
    if (current !== slug) return;
    scroller.scrollTop = 0;
    panel.classList.remove('loading', 'swapping');
    panel.classList.add('open');
  }, S.state.reducedMotion ? 0 : (fromOverview ? 700 : 500));
}

const pad = n => String(n).padStart(2, '0');
const arrow = d => `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="${d === 'l' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'}"/></svg>`;

document.addEventListener('keydown', e => {
  if (e.target.closest('input, textarea, select, [contenteditable]')) return;
  if (document.body.dataset.mode !== 'closeup') return;
  if (e.key === 'Escape') location.hash = '#/system';
  else if (e.key === 'ArrowLeft' && !$('#prev').hidden) location.hash = $('#prev').getAttribute('href');
  else if (e.key === 'ArrowRight' && !$('#next').hidden) location.hash = $('#next').getAttribute('href');
});

window.addEventListener('hashchange', route);
cam.placeAtOverview();
setUI('overview');
if (!location.hash) history.replaceState(null, '', '#/sun');   // readers start on the Sun page
route();
