// Graphs inside articles.
//   ```chart   → interactive Plotly chart (JSON spec, see README)
//   ```stats   → comparison stat cards, one per line: label | value | note
//   ![caption](img/x.png "Source: …")  → framed figure with caption
/* global Plotly */

// Dark-mode series colors drawn from the CDJ palette, assigned in FIXED order.
// The highlight color marks the one entity a chart is about.
export const SERIES = ['#6E72F5', '#F0A050', '#C9C3FA', '#3FB8AF'];
const HIGHLIGHT = '#A66BF0';
const INK = '#F2F1FA', MUTED = '#A9A6C8', GRID = '#1C1A42', AXIS = '#2A2760';

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// Called from the Markdown renderer for fenced code blocks.
export function renderFence(code, lang) {
  if (lang === 'chart') return `<figure class="chart" data-spec="${esc(code)}"></figure>`;
  if (lang === 'stats') {
    const cards = code.trim().split('\n').filter(Boolean).map(line => {
      const [label = '', value = '', note = ''] = line.split('|').map(s => s.trim());
      return `<div class="stat"><span class="stat-value">${esc(value)}</span>` +
        `<span class="stat-label">${esc(label)}</span>${note ? `<span class="stat-note">${esc(note)}</span>` : ''}</div>`;
    }).join('');
    return `<div class="stats">${cards}</div>`;
  }
  return false; // fall back to normal code rendering
}

// Images alone in a paragraph become captioned figures.
export function upgradeFigures(root) {
  root.querySelectorAll('p > img:only-child').forEach(img => {
    const p = img.parentElement;
    if (p.textContent.trim()) return;
    const fig = document.createElement('figure');
    fig.className = 'figure';
    const cap = document.createElement('figcaption');
    cap.innerHTML = `<span class="fig-title">${esc(img.alt)}</span>` + (img.title ? `<span class="fig-source">${esc(img.title)}</span>` : '');
    img.loading = 'lazy';
    img.removeAttribute('title');
    fig.append(img, cap);
    p.replaceWith(fig);
  });
}

export async function renderCharts(root) {
  for (const fig of root.querySelectorAll('figure.chart[data-spec]')) {
    let spec;
    try { spec = JSON.parse(fig.dataset.spec); }
    catch (e) { fig.innerHTML = `<p class="chart-error">Chart spec is not valid JSON: ${esc(e.message)}</p>`; continue; }
    try { await drawChart(fig, spec); }
    catch (e) { fig.innerHTML = `<p class="chart-error">Could not draw chart: ${esc(e.message)}</p>`; }
  }
}

async function drawChart(fig, spec) {
  const rows = spec.rows ?? parseCSV(await (await fetchOk(spec.data)).text());
  const ys = Array.isArray(spec.y) ? spec.y : [spec.y];
  const type = spec.type || 'bar';
  const horizontal = type === 'barh';
  const xs = rows.map(r => r[spec.x]);

  const traces = ys.map((yk, i) => {
    const vals = rows.map(r => r[yk]);
    const base = SERIES[i % SERIES.length];
    const t = { name: yk, hovertemplate: `%{${horizontal ? 'y' : 'x'}}: <b>%{${horizontal ? 'x' : 'y'}}</b>${spec.unit ? ' ' + spec.unit : ''}<extra>${ys.length > 1 ? esc(yk) : ''}</extra>` };
    if (type === 'bar' || horizontal) {
      Object.assign(t, {
        type: 'bar', orientation: horizontal ? 'h' : 'v',
        x: horizontal ? vals : xs, y: horizontal ? xs : vals,
        marker: { color: xs.map(x => (ys.length === 1 && spec.highlight != null && String(x) === String(spec.highlight)) ? HIGHLIGHT : base), cornerradius: 4 },
      });
    } else {
      Object.assign(t, {
        type: 'scatter', mode: type === 'scatter' ? 'markers' : 'lines+markers', x: xs, y: vals,
        line: { color: base, width: 2 }, marker: { color: base, size: type === 'scatter' ? 9 : 7, line: { color: '#000', width: 2 } },
      });
    }
    return t;
  });

  const axis = (title) => ({
    title: title ? { text: title, font: { color: MUTED, size: 11 } } : undefined,
    gridcolor: GRID, linecolor: AXIS, zeroline: false, tickfont: { color: MUTED, size: 11 }, automargin: true,
  });
  const layout = {
    paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)',
    font: { family: 'IBM Plex Mono, ui-monospace, monospace', color: MUTED, size: 11 },
    margin: { l: 8, r: 12, t: ys.length > 1 ? 36 : 8, b: 8 },
    height: spec.height || 300,
    bargap: 0.35, barmode: 'group',
    xaxis: axis(spec.xlabel), yaxis: axis(spec.ylabel),
    showlegend: ys.length > 1,
    legend: { orientation: 'h', x: 0, y: 1.12, font: { color: INK, size: 11 } },
    hoverlabel: { bgcolor: '#07061A', bordercolor: '#8B3FE3', font: { color: INK, family: 'IBM Plex Mono, monospace', size: 12 } },
  };
  if (horizontal) { layout.yaxis.autorange = 'reversed'; layout.yaxis.showgrid = false; }
  else if (type === 'bar') layout.xaxis.showgrid = false;

  fig.innerHTML =
    (spec.title ? `<figcaption class="chart-title">${esc(spec.title)}</figcaption>` : '') +
    `<div class="chart-plot"></div>` +
    (spec.note || spec.source ? `<p class="chart-foot">${spec.note ? esc(spec.note) + ' ' : ''}${spec.source ? 'Source: ' + esc(spec.source) : ''}</p>` : '') +
    `<details class="chart-table"><summary>Data table</summary><table><thead><tr><th>${esc(spec.x)}</th>${ys.map(y => `<th>${esc(y)}</th>`).join('')}</tr></thead>` +
    `<tbody>${rows.map(r => `<tr><td>${esc(r[spec.x])}</td>${ys.map(y => `<td>${esc(r[y])}</td>`).join('')}</tr>`).join('')}</tbody></table></details>`;

  await Plotly.newPlot(fig.querySelector('.chart-plot'), traces, layout, { displayModeBar: false, responsive: true });
}

async function fetchOk(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url} (${r.status})`);
  return r;
}

// Minimal CSV parser (handles quoted fields); numbers are auto-converted.
export function parseCSV(text) {
  const lines = [];
  let row = [], field = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') q = false;
      else field += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some(v => v !== '')) lines.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some(v => v !== '')) lines.push(row);
  const [head, ...body] = lines.filter(r => !String(r[0]).startsWith('#'));
  return body.map(r => Object.fromEntries(head.map((h, i) => {
    const v = (r[i] ?? '').trim();
    return [h.trim(), v !== '' && !isNaN(+v) ? +v : v];
  })));
}
