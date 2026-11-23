// Footnotes: [[highlighted term|note text]]  or  [[term|^id]] + a line "[^id]: long note"
// Clicking the highlighted term opens a popover card beside it; Esc, the ✕ or a
// click outside closes it. All notes are also listed at the end of the page.
/* global marked */

const OPEN = '[[', CLOSE = ']]';

// Pass 1 (on Markdown source, outside code fences): swap footnote syntax for buttons.
export function extractFootnotes(md) {
  // definitions: "[^id]: text" (continues until a blank line)
  const defs = {};
  const kept = [];
  let cur = null;
  for (const line of md.split('\n')) {
    const m = line.match(/^\[\^([\w-]+)\]:\s*(.*)$/);
    if (m) { cur = m[1]; defs[cur] = m[2]; continue; }
    if (cur && line.trim() !== '') { defs[cur] += ' ' + line.trim(); continue; }
    cur = null;
    kept.push(line);
  }
  md = kept.join('\n');

  const notes = [];
  const parts = md.split(/(^```[\s\S]*?^```[ \t]*$)/m);
  for (let p = 0; p < parts.length; p += 2) {       // even parts are outside fences
    let s = parts[p], out = '', i = 0;
    while (true) {
      const a = s.indexOf(OPEN, i);
      if (a === -1) { out += s.slice(i); break; }
      const b = s.indexOf(CLOSE, a + 2);
      if (b === -1) { out += s.slice(i); break; }
      const inner = s.slice(a + 2, b);
      const bar = inner.indexOf('|');
      if (bar === -1) { out += s.slice(i, b + 2); i = b + 2; continue; }
      const term = inner.slice(0, bar).trim();
      let note = inner.slice(bar + 1).trim();
      if (note.startsWith('^')) note = defs[note.slice(1)] ?? `⚠ Missing footnote definition “${note}”.`;
      const n = notes.length + 1;
      notes.push({ n, html: marked.parseInline(note) });
      out += s.slice(i, a) +
        `<button type="button" class="fn" id="fnref-${n}" data-fn="${n}" aria-expanded="false" aria-haspopup="dialog">` +
        `${marked.parseInline(term)}<sup>${n}</sup></button>`;
      i = b + 2;
    }
    parts[p] = out;
  }
  return { md: parts.join(''), notes };
}

// Pass 2 (on the rendered DOM): wire up the popover and the end-notes list.
export function mountFootnotes(body, notes) {
  if (!notes.length) return () => {};

  const list = document.createElement('section');
  list.className = 'endnotes';
  list.innerHTML = `<h2>Notes</h2><ol>${notes.map(f =>
    `<li id="note-${f.n}">${f.html} <a href="#" class="backref" data-fn="${f.n}" aria-label="Back to the text">↩</a></li>`).join('')}</ol>`;
  body.appendChild(list);

  const pop = document.createElement('div');
  pop.className = 'fn-pop';
  pop.setAttribute('role', 'dialog');
  pop.tabIndex = -1;
  pop.hidden = true;
  body.appendChild(pop);

  let openBtn = null;
  const externalize = el => el.querySelectorAll('a[href^="http"]').forEach(a => { a.target = '_blank'; a.rel = 'noopener'; });
  externalize(list);

  function open(btn) {
    const f = notes[+btn.dataset.fn - 1];
    pop.innerHTML =
      `<div class="fn-pop-head"><span>FOOTNOTE ${f.n}</span>` +
      `<button type="button" class="fn-close" aria-label="Close footnote">` +
      `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19"/></svg></button></div>` +
      `<div class="fn-pop-body">${f.html}</div>`;
    externalize(pop);
    pop.setAttribute('aria-label', `Footnote ${f.n}`);
    pop.hidden = false;

    const cr = body.getBoundingClientRect(), br = btn.getClientRects()[0] || btn.getBoundingClientRect();
    const w = Math.min(380, body.clientWidth);
    const left = Math.max(0, Math.min(br.left - cr.left - 16, body.clientWidth - w));
    pop.style.width = w + 'px';
    pop.style.left = left + 'px';
    pop.style.top = (br.bottom - cr.top + 10) + 'px';

    if (openBtn) openBtn.setAttribute('aria-expanded', 'false');
    openBtn = btn;
    btn.setAttribute('aria-expanded', 'true');
    pop.focus({ preventScroll: true });
    // keep the whole card visible inside the scrolling panel
    pop.scrollIntoView({ block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }
  function close(returnFocus) {
    if (!openBtn) return;
    pop.hidden = true;
    openBtn.setAttribute('aria-expanded', 'false');
    if (returnFocus) openBtn.focus({ preventScroll: true });
    openBtn = null;
  }

  const onClick = e => {
    const btn = e.target.closest('button.fn');
    if (btn && body.contains(btn)) { e.preventDefault(); btn === openBtn ? close(false) : open(btn); return; }
    if (e.target.closest('.fn-close')) { close(true); return; }
    const back = e.target.closest('a.backref');
    if (back) {
      e.preventDefault();
      const ref = body.querySelector(`#fnref-${back.dataset.fn}`);
      ref?.scrollIntoView({ block: 'center' }); ref && open(ref);
      return;
    }
    if (openBtn && !pop.contains(e.target)) close(false);
  };
  const onKey = e => {
    if (e.key === 'Escape' && openBtn) { e.stopImmediatePropagation(); close(true); }
  };
  document.addEventListener('click', onClick);
  document.addEventListener('keydown', onKey, true);
  return () => { document.removeEventListener('click', onClick); document.removeEventListener('keydown', onKey, true); };
}
